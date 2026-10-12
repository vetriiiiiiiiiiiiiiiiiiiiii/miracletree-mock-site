"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { useCart } from "@/components/cart/CartProvider";
import { formatShopPrice } from "@/lib/money";
import { analytics } from "@/lib/analytics";
import { IconClose, IconMinus, IconPlus, IconTrash } from "@/components/layout/Icons";

/** Dawn's cart drawer. */
export function CartDrawer() {
  const { cart, isOpen, close, setQuantity, remove, applyCoupon, removeCoupon, pending } =
    useCart();
  const { totals } = cart;

  return (
    <Drawer open={isOpen} onClose={close} title="Your cart" side="right">
      {cart.lines.length === 0 ? (
        <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
          <button type="button" onClick={close} aria-label="Close" className="header__icon absolute right-3 top-3">
            <IconClose />
          </button>
          <h2 className="h2">Your cart is empty</h2>
          <Link href="/shop" onClick={close} className="button mt-6">
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-[1.875rem] pb-2 pt-5">
            <h2 className="h2">Your cart</h2>
            <button type="button" onClick={close} aria-label="Close" className="header__icon -mr-3">
              <IconClose />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-[1.875rem]">
            <div className="caption-uc flex justify-between border-b border-[rgba(18,18,18,0.08)] pb-2.5 pt-3 text-[rgba(18,18,18,0.75)]">
              <span>Product</span>
              <span>Total</span>
            </div>
            <ul>
              {cart.lines.map((line) => (
                <CartLine
                  key={line.id}
                  line={line}
                  pending={pending}
                  onClose={close}
                  onQuantity={(q) => void setQuantity(line.id, q)}
                  onRemove={() => void remove(line.id)}
                />
              ))}
            </ul>
          </div>

          <div className="border-t border-[rgba(18,18,18,0.08)] px-[1.875rem] pb-6 pt-4">
            <Discount
              coupon={cart.coupon}
              warning={cart.couponWarning}
              applyCoupon={applyCoupon}
              removeCoupon={removeCoupon}
            />
            <Totals totals={totals} />
            <Link
              href="/checkout"
              className="button button--full mt-4"
              onClick={() => {
                close();
                analytics.beginCheckout(
                  totals.grandTotal / 100,
                  cart.lines.map((l) => ({
                    item_id: l.productId,
                    item_name: l.productName,
                    item_variant: l.variantName,
                    price: l.unitPrice / 100,
                    quantity: l.quantity,
                  })),
                  cart.coupon?.code,
                );
              }}
            >
              Check out
            </Link>
          </div>
        </>
      )}
    </Drawer>
  );
}

function CartLine({ line, pending, onClose, onQuantity, onRemove }) {
  return (
    <li className="grid grid-cols-[5.5rem_1fr_auto] gap-x-4 py-5">
      <Link href={`/product/${line.productSlug}`} onClick={onClose} className="relative block aspect-square w-[5.5rem]">
        {line.imageUrl ? (
          <Image
            src={line.imageUrl}
            alt={line.productName}
            fill
            sizes="88px"
            className="object-contain"
            unoptimized={typeof line.imageUrl === "string" ? line.imageUrl.startsWith("/uploads/") : undefined}
          />
        ) : null}
      </Link>
      <div className="min-w-0">
        <Link
          href={`/product/${line.productSlug}`}
          onClick={onClose}
          className="block text-[0.9375rem] leading-snug text-[rgb(18,18,18)] hover:underline hover:underline-offset-[0.3rem]"
        >
          {line.productName}
        </Link>
        <p className="mt-1 text-[0.875rem]">{formatShopPrice(line.unitPrice)}</p>
        {line.variantName && !["Default", "Standard"].includes(line.variantName) ? (
          <p className="text-[0.8125rem]">Size: {line.variantName}</p>
        ) : null}
        <div className="mt-3 flex items-center gap-1">
          <QuantityStepper
            value={line.quantity}
            max={Math.max(1, line.available)}
            disabled={pending}
            onChange={onQuantity}
            label={`Quantity for ${line.productName}`}
            small
          />
          <button
            type="button"
            onClick={onRemove}
            className="header__icon"
            aria-label={`Remove ${line.productName}`}
          >
            <IconTrash />
          </button>
        </div>
        {line.overStock ? (
          <p className="mt-2 text-[0.75rem] text-danger">
            Only {line.available} left — quantity will be reduced at checkout.
          </p>
        ) : null}
      </div>
      <p className="text-right text-[0.9375rem] text-[rgb(18,18,18)]">{formatShopPrice(line.lineTotal)}</p>
    </li>
  );
}

export function Discount({ coupon, warning, applyCoupon, removeCoupon }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (!code.trim()) return;
    setApplying(true);
    setError(await applyCoupon(code.trim()));
    setApplying(false);
    setCode("");
  };
  return (
    <details className="accordion !border-t-0" open={Boolean(coupon) || undefined}>
      <summary className="!py-2 text-[0.875rem]">
        Discounts
        <span className="accordion__caret">
          <IconPlus />
        </span>
      </summary>
      <div className="pb-3">
        {coupon ? (
          <p className="flex items-center gap-3 text-[0.8125rem]">
            <span className="badge badge--muted !border-[rgba(18,18,18,0.2)]">{coupon.code}</span>
            {coupon.description ? <span>{coupon.description}</span> : null}
            <button type="button" onClick={() => void removeCoupon()} className="ml-auto underline underline-offset-2">
              Remove
            </button>
          </p>
        ) : (
          <form onSubmit={submit} className="flex gap-3">
            <div className="field">
              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                placeholder="Discount code"
                aria-label="Discount code"
                className="field__input !min-h-[2.5rem] !py-2 !text-[0.875rem] uppercase"
              />
            </div>
            <button type="submit" className="button button--secondary !min-h-[2.5rem] !min-w-0" disabled={applying}>
              Apply
            </button>
          </form>
        )}
        {error ? (
          <p className="mt-2 text-[0.75rem] text-danger" role="alert">
            {error}
          </p>
        ) : null}
        {warning ? (
          <p className="mt-2 text-[0.75rem] text-danger" role="status">
            {warning}
          </p>
        ) : null}
      </div>
    </details>
  );
}

export function Totals({ totals }) {
  return (
    <div className="grid gap-1 text-[0.875rem]">
      {totals.discountTotal > 0 ? (
        <Row label="Discount" value={`−${formatShopPrice(totals.discountTotal)}`} />
      ) : null}
      <Row
        label="Shipping"
        value={totals.shippingTotal === 0 ? "Free" : formatShopPrice(totals.shippingTotal)}
      />
      <div className="mt-1 flex items-baseline justify-between">
        <h3 className="text-[1rem] text-[rgb(18,18,18)]">Estimated total</h3>
        <p className="text-[1rem] tracking-[0.0625rem] text-[rgb(18,18,18)]">
          {formatShopPrice(totals.grandTotal)}
        </p>
      </div>
      {totals.amountToFreeShipping > 0 ? (
        <p className="text-[0.8125rem]">
          {formatShopPrice(totals.amountToFreeShipping)} away from free shipping
        </p>
      ) : null}
      <p className="text-[0.8125rem]">Inclusive of all taxes</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/** Dawn's bordered quantity box: − value +. */
export function QuantityStepper({ value, max, onChange, disabled, label, small }) {
  return (
    <div className={small ? "quantity quantity--sm" : "quantity"} role="group" aria-label={label}>
      <button
        type="button"
        className="quantity__button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
      >
        <IconMinus />
      </button>
      <span className="quantity__input" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="quantity__button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <IconPlus />
      </button>
    </div>
  );
}
