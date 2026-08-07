import { describe, it, expect } from "vitest";
import { versionStoragePath } from "@/lib/versions/service";
import { computeSvgHash } from "@/lib/svg/canonicalize";

describe("versionStoragePath", () => {
  it("addresses versions by content hash, never a fixed filename", () => {
    // The old code wrote every save to projects/{id}/output.svg, destroying
    // history. Content-addressed paths make that impossible by construction.
    expect(versionStoragePath("proj-1", "abc123")).toBe(
      "projects/proj-1/versions/abc123.svg",
    );
  });

  it("gives different paths to different content", () => {
    expect(versionStoragePath("proj-1", "aaa")).not.toBe(
      versionStoragePath("proj-1", "bbb"),
    );
  });

  it("keeps different projects separate even for identical content", () => {
    expect(versionStoragePath("proj-1", "same")).not.toBe(
      versionStoragePath("proj-2", "same"),
    );
  });

  it("never writes to the legacy output.svg path", () => {
    expect(versionStoragePath("proj-1", "abc")).not.toContain("output.svg");
  });
});

describe("version identity end-to-end", () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path id="path-1" d="M 0 0 L 5 5" fill="#ff0000"/></svg>`;

  it("gives cosmetically-different saves the same storage path", () => {
    // Same artwork re-serialised with different ids and spacing must resolve to
    // one version — otherwise the user is charged twice for one drawing.
    const reserialised = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
      <path id="path-1-9fk2" d="M 0 0 L 5.0000001 5" fill="#FF0000" />
    </svg>`;

    expect(versionStoragePath("p", computeSvgHash(svg))).toBe(
      versionStoragePath("p", computeSvgHash(reserialised)),
    );
  });

  it("gives genuinely edited artwork a different storage path", () => {
    const edited = svg.replace("L 5 5", "L 7 5");
    expect(versionStoragePath("p", computeSvgHash(svg))).not.toBe(
      versionStoragePath("p", computeSvgHash(edited)),
    );
  });
});
