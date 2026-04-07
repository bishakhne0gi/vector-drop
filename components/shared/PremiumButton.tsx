import { ReactNode } from "react";

interface PremiumButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  className?: string;
  isLink?: boolean;
}

const buttonStyles = {
  base: "inline-flex items-center gap-2 px-8 py-3 text-sm font-bold text-white rounded-full transition-all hover:shadow-lg",
  shared: {
    background: "linear-gradient(180deg, #1D1F23 0%, rgba(255, 255, 255, 0.15) 100%)",
    boxShadow: "0 4px 7px rgba(0, 0, 0, 0.2), 0 0 0 1.5px rgba(0, 0, 0, 1), inset 0 2px 2px rgba(111, 111, 111, 1), inset 0 -2px 2px rgba(173, 160, 160, 0.25)",
    textShadow: "0 4px 4px rgba(0, 0, 0, 0.4)",
    borderTop: "1.5px solid rgba(255, 255, 255, 0.15)",
  },
};

export function PremiumButton({
  children,
  href,
  onClick,
  className = "",
  isLink = false,
}: PremiumButtonProps) {
  const combinedClassName = `${buttonStyles.base} ${className}`;

  if (isLink && href) {
    return (
      <a
        href={href}
        className={combinedClassName}
        style={buttonStyles.shared}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={combinedClassName}
      style={buttonStyles.shared}
    >
      {children}
    </button>
  );
}
