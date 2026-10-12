"use client";
import Link from "next/link";
import { forwardRef, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { magneticButton } from "@/lib/motion";
// Dawn's buttons: square, sentence case, solid foreground or a 1px outline
// that thickens on hover (drawn with box-shadow so the layout never moves).
const VARIANTS = {
  primary:
    "bg-[rgb(var(--brand-green))] text-white shadow-[0_0_0_1px_rgb(var(--brand-green))] hover:shadow-[0_0_0_2px_rgb(var(--brand-green))]",
  secondary:
    "bg-transparent text-[rgb(var(--brand-green))] shadow-[0_0_0_1px_rgb(var(--brand-green))] hover:shadow-[0_0_0_2px_rgb(var(--brand-green))]",
  ghost: "text-[rgb(18,18,18)] hover:underline underline-offset-[0.3rem]",
  gold: "bg-[rgb(var(--brand-magenta))] text-white shadow-[0_0_0_1px_rgb(var(--brand-magenta))] hover:shadow-[0_0_0_2px_rgb(var(--brand-magenta))]",
  danger: "bg-danger text-white hover:brightness-110",
};
const SIZES = {
  sm: "min-h-[2.25rem] px-4 text-[0.875rem]",
  md: "min-h-[2.8125rem] px-[1.875rem] text-[0.9375rem]",
  lg: "min-h-[2.8125rem] px-[1.875rem] text-[0.9375rem]",
};
const BASE =
  "relative inline-flex items-center justify-center gap-2 rounded-none tracking-[0.0625rem] " +
  "transition-shadow duration-100 " +
  "disabled:cursor-not-allowed disabled:opacity-50";
/**
 * Magnetic pull is opt-in and automatically inert on touch devices and under
 * reduced-motion, so it can be left on for primary calls to action everywhere.
 */
function useMagnetic(enabled, strength) {
  const ref = useRef(null);
  useEffect(() => {
    if (!enabled || !ref.current) return;
    return magneticButton(ref.current, { strength });
  }, [enabled, strength]);
  return ref;
}
export const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    magnetic = false,
    magneticStrength = 0.25,
    loading = false,
    icon,
    className,
    children,
    disabled,
    ...props
  },
  forwardedRef,
) {
  const magneticRef = useMagnetic(magnetic, magneticStrength);
  return (
    <button
      ref={(node) => {
        magneticRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      <span>{children}</span>
    </button>
  );
});
export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  magnetic = false,
  magneticStrength = 0.25,
  className,
  children,
  icon,
  prefetch,
  ...props
}) {
  const magneticRef = useMagnetic(magnetic, magneticStrength);
  const isExternal = /^https?:\/\//.test(href);
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);
  if (isExternal) {
    return (
      <a
        ref={magneticRef}
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
      >
        {icon}
        <span>{children}</span>
      </a>
    );
  }
  return (
    <Link
      ref={magneticRef}
      href={href}
      prefetch={prefetch}
      className={classes}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
function Spinner() {
  return (
    <span
      className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent"
      aria-hidden
    />
  );
}
/**
 * A text link with a rule that wipes in from the left on hover. Used for
 * inline navigation where a full button would be too loud.
 */
export function UnderlineLink({ href, children, className }) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center text-cream-200 transition-colors hover:text-cream-50",
        className,
      )}
    >
      <span>{children}</span>
      <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-gold-400 transition-transform duration-500 ease-[var(--ease-organic)] group-hover:origin-left group-hover:scale-x-100" />
    </Link>
  );
}
