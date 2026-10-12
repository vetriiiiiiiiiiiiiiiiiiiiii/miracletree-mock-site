"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
/**
 * A modal surface used for the cart, filters, search and quick view.
 *
 * Handles the four things a hand-rolled dialog usually gets wrong: focus moves
 * in on open and back to the trigger on close, Tab is trapped inside, Escape
 * closes, and the page behind it cannot scroll.
 */
export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  footer,
  className,
  labelledBy,
}) {
  const panelRef = useRef(null);
  const restoreFocusTo = useRef(null);
  // A portal renders nothing on the server but real DOM on the client, which
  // React reports as a hydration mismatch. Mounting on the first effect keeps
  // the first client render identical to the server's.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    restoreFocusTo.current = document.activeElement;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    // Compensating for the scrollbar prevents the page shifting behind the veil.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    const focusables = () =>
      [
        ...(panelRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? []),
      ].filter((el) => el.offsetParent !== null);
    const timer = window.setTimeout(() => {
      const [first] = focusables();
      (first ?? panelRef.current)?.focus();
    }, 60);
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      restoreFocusTo.current?.focus?.();
    };
  }, [open, onClose]);
  if (!mounted) return null;
  const positions = {
    right: "inset-y-0 right-0 h-full w-full max-w-[25rem] border-l",
    left: "inset-y-0 left-0 h-full w-full max-w-[25rem] border-r",
    top: "inset-x-0 top-0 w-full border-b",
    bottom: "inset-x-0 bottom-0 w-full border-t",
    center:
      "left-1/2 top-1/2 w-[min(56rem,92vw)] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 border",
  };
  const enter = {
    right: open ? "translate-x-0" : "translate-x-full",
    left: open ? "translate-x-0" : "-translate-x-full",
    top: open ? "translate-y-0" : "-translate-y-full",
    bottom: open ? "translate-y-0" : "translate-y-full",
    center: open ? "scale-100 opacity-100" : "scale-[0.97] opacity-0",
  };
  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[200]",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
      // `aria-hidden` alone hides the panel from assistive tech but leaves its
      // links and buttons in the tab order, so a keyboard user tabs into a
      // drawer they cannot see. `inert` removes them from focus and the
      // accessibility tree together.
      inert={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-[rgba(18,18,18,0.5)] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          "absolute flex flex-col border-[rgba(18,18,18,0.2)] bg-white",
          "transition-all duration-300 ease-[cubic-bezier(0.29,0.63,0.44,1)]",
          // The shadow is painted only while the drawer is open. A closed
          // drawer is merely translated off-screen, and an 80px spread still
          // reaches back over the edge from there — the cart drawer was
          // darkening the right side of every page on the site, and the mobile
          // menu the top. Neither is visible against a near-black ground,
          // which is why it survived until the light theme existed.
          open && "shadow-[var(--mt-shadow-drawer)]",
          positions[side],
          enter[side],
          className,
        )}
      >
        {children}
        {footer ? (
          <div className="mt-auto border-t border-[rgba(18,18,18,0.08)] bg-white p-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
export function DrawerHeader({ title, subtitle, onClose, id }) {
  return (
    <header className="flex items-center justify-between gap-4 px-[1.875rem] py-5">
      <div>
        <h2 id={id} className="h2">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-xs text-cream-400">{subtitle}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="-mr-2 p-2 text-[rgb(18,18,18)] transition-transform hover:scale-110"
        aria-label={`Close ${title.toLowerCase()}`}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path
            d="M3 3l12 12M15 3L3 15"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </svg>
      </button>
    </header>
  );
}
