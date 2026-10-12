"use client";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { subscribeAction } from "@/app/actions/marketing";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { IconArrow } from "@/components/layout/Icons";
const INITIAL = { status: "idle" };
export function NewsletterForm({ source = "site", className }) {
  const [state, action] = useActionState(subscribeAction, INITIAL);
  useEffect(() => {
    if (state.status === "success") analytics.newsletterSignup(source);
  }, [state, source]);
  if (state.status === "success") {
    return (
      <p
        className={cn(
          "flex items-center gap-2 text-sm text-[rgb(18,18,18)]",
          className,
        )}
        role="status"
      >
        {state.message}
      </p>
    );
  }
  return (
    <form action={action} className={cn("grid gap-3", className)}>
      <input type="hidden" name="source" value={source} />

      <div className="field">
        <input
          id={`newsletter-${source}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          aria-invalid={state.status === "error" ? true : undefined}
          aria-describedby={
            state.status === "error" ? `newsletter-${source}-error` : undefined
          }
          className="field__input pr-12"
        />
        <label htmlFor={`newsletter-${source}`} className="sr-only">
          Email
        </label>
        <SubmitButton />
      </div>

      {state.status === "error" ? (
        <p
          id={`newsletter-${source}-error`}
          className="text-xs text-danger"
          role="alert"
        >
          {state.errors?.email ?? state.message}
        </p>
      ) : null}

      <p className="text-xs leading-relaxed text-[rgba(18,18,18,0.75)]">
        We use your address only to send the journal. Unsubscribe from any
        email.
      </p>
    </form>
  );
}
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Subscribe"
      className="field__button disabled:opacity-50"
    >
      <IconArrow />
    </button>
  );
}
