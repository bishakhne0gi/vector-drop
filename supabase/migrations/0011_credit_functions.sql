-- ============================================================
-- 0011_credit_functions.sql
-- All credit balance mutation lives here. Application code NEVER updates
-- user_credits directly.
--
-- Run via: supabase db push  (or paste into the Supabase SQL editor)
-- Requires: 0010_credits_and_versions.sql
-- ============================================================

-- ─── grant_units ─────────────────────────────────────────────
-- Adds units. Idempotent on p_idempotency_key: calling twice with the same key
-- grants once. This is what makes retried payment webhooks safe — Dodo WILL
-- redeliver, and without this each redelivery would be free credits.
--
-- Negative deltas (refunds) are clamped so the balance cannot go below zero;
-- the user may already have spent the credits being refunded.
create or replace function grant_units(
  p_user_id         text,
  p_delta_units     int,
  p_reason          text,
  p_idempotency_key text,
  p_metadata        jsonb default null
) returns table (granted boolean, balance_units int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current   int;
  v_applied   int;
  v_new       int;
  v_ledger_id uuid;
begin
  insert into user_credits (user_id) values (p_user_id)
    on conflict (user_id) do nothing;

  select uc.balance_units into v_current
    from user_credits uc where uc.user_id = p_user_id for update;

  v_applied := p_delta_units;
  if v_current + v_applied < 0 then
    v_applied := -v_current;
  end if;
  v_new := v_current + v_applied;

  insert into credit_ledger (user_id, delta_units, reason, balance_after,
                             idempotency_key, metadata)
  values (p_user_id, v_applied, p_reason, v_new, p_idempotency_key, p_metadata)
  on conflict (idempotency_key) do nothing
  returning id into v_ledger_id;

  -- Nothing inserted means this exact event was already applied. Leave the
  -- balance untouched and report that no grant happened.
  if v_ledger_id is null then
    return query select false, v_current;
    return;
  end if;

  update user_credits uc
     set balance_units    = v_new,
         lifetime_granted = uc.lifetime_granted + greatest(v_applied, 0),
         updated_at       = now()
   where uc.user_id = p_user_id;

  return query select true, v_new;
end $$;

-- ─── spend_units ─────────────────────────────────────────────
-- Charges for one unlockable thing. Idempotent on (user_id, kind, ref_id): the
-- second call is free, which is what makes re-downloads, format changes, and
-- retried requests cost nothing.
--
-- p_units = 0 records a permanent entitlement without touching the balance or
-- the ledger — used for the original converted version, which is included with
-- the conversion credit.
--
-- Raises 'insufficient_credits' when the balance is short.
create or replace function spend_units(
  p_user_id text,
  p_kind    text,
  p_ref_id  uuid,
  p_units   int,
  p_reason  text
) returns table (charged boolean, balance_units int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing  uuid;
  v_current   int;
  v_new       int;
  v_ledger_id uuid;
  v_key       text;
begin
  insert into user_credits (user_id) values (p_user_id)
    on conflict (user_id) do nothing;

  -- Already paid for? Serve it free.
  select u.id into v_existing
    from unlocks u
   where u.user_id = p_user_id and u.kind = p_kind and u.ref_id = p_ref_id;

  if v_existing is not null then
    select uc.balance_units into v_current
      from user_credits uc where uc.user_id = p_user_id;
    return query select false, v_current;
    return;
  end if;

  -- Free unlock: record the entitlement, never touch the balance.
  if p_units = 0 then
    insert into unlocks (user_id, kind, ref_id) values (p_user_id, p_kind, p_ref_id)
      on conflict (user_id, kind, ref_id) do nothing;
    select uc.balance_units into v_current
      from user_credits uc where uc.user_id = p_user_id;
    return query select false, v_current;
    return;
  end if;

  -- Conditional decrement. The row lock taken by UPDATE serialises concurrent
  -- spends, so a double-clicked button cannot charge twice. No matching row
  -- means the balance was short.
  update user_credits uc
     set balance_units  = uc.balance_units - p_units,
         lifetime_spent = uc.lifetime_spent + p_units,
         updated_at     = now()
   where uc.user_id = p_user_id
     and uc.balance_units >= p_units
  returning uc.balance_units into v_new;

  if v_new is null then
    raise exception 'insufficient_credits'
      using errcode = 'P0001', hint = 'balance below required units';
  end if;

  -- Key mirrors lib/credits/keys.ts so the ledger is reconcilable from either side.
  v_key := case
             when p_kind = 'conversion' then 'convert:' || p_ref_id::text
             else 'export:' || p_user_id || ':' || p_ref_id::text
           end;

  insert into credit_ledger (user_id, delta_units, reason, balance_after,
                             idempotency_key, metadata)
  values (p_user_id, -p_units, p_reason, v_new, v_key,
          jsonb_build_object('kind', p_kind, 'ref_id', p_ref_id))
  returning id into v_ledger_id;

  insert into unlocks (user_id, kind, ref_id, ledger_id)
  values (p_user_id, p_kind, p_ref_id, v_ledger_id);

  return query select true, v_new;
end $$;
