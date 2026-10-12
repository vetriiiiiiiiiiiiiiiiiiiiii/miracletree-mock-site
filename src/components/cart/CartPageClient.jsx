"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Discount, QuantityStepper, Totals } from "@/components/cart/CartDrawer";
import { IconTrash } from "@/components/layout/Icons";
import { formatShopPrice } from "@/lib/money";
import { analytics } from "@/lib/analytics";

/** Dawn's main-cart-items + main-cart-footer. */
export function CartPageClient() {
  const { cart, setQuantity, remove, applyCoupon, removeCoupon, pending } = useCart();
  const { totals, lines } = cart;

  useEffect(() => {
    if (!lines.length) return;
    analytics.viewCart(
      totals.grandTotal / 100,
      lines.map((l) => ({
        item_id: l.productId,
        item_name: l.productName,
        item_variant: l.variantName,
        price: l.unitPrice / 100,
        quantity: l.quantity,
      })),
    );
    // Once per visit to the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!lines.length) {
    return (
      <div className="py-16 text-center">
        <h1 className="h1">Your cart is empty</h1>
        <Link href="/shop" className="button mt-8">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="h1">Your cart</h1>
        <Link href="/shop" className="dawn-link text-[0.9375rem]">
          Continue shopping
        </Link>
      </div>

      <table className="mt-10 w-full border-collapse">
        <thead>
          <tr className="caption-uc border-b border-[rgba(18,18,18,0.08)] text-left text-[rgba(18,18,18,0.75)]">
            <th className="pb-4 font-normal">Product</th>
            <th className="hidden pb-4 pl-8 font-normal md:table-cell">Quantity</th>
            <th className="pb-4 text-right font-normal">Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const controls = (
              <div className="flex items-center gap-2">
                <QuantityStepper
                  value={line.quantity}
                  max={Math.max(1, line.available)}
                  disabled={pending}
                  onChange={(q) => void setQuantity(line.id, q)}
                  label={`Quantity for ${line.productName}`}
                />
                <button
                  type="button"
                  className="header__icon"
                  onClick={() => void remove(line.id)}
                  aria-label={`Remove ${line.productName}`}
                >
                  <IconTrash />
                </button>
              </div>
            );
            return (
              <tr key={line.id} className="align-top">
                <td className="pt-10">
                  <div className="flex gap-4 md:gap-10">
                    <Link href={`/product/${line.productSlug}`} className="relative block aspect-square w-24 shrink-0 md:w-[9.375rem]">
                      {line.imageUrl ? (
                        <Image
                          src={line.imageUrl}
                          alt={line.productName}
                          fill
                          sizes="150px"
                          className="object-contain"
                          unoptimized={typeof line.imageUrl === "string" ? line.imageUrl.startsWith("/uploads/") : undefined}
                        />
                      ) : null}
                    </Link>
                    <div>
                      <Link
                        href={`/product/${line.productSlug}`}
                        className="text-[1rem] text-[rgb(18,18,18)] hover:underline hover:underline-offset-[0.3rem]"
                      >
                        {line.productName}
                      </Link>
                      <p className="mt-1 text-[0.875rem]">{formatShopPrice(line.unitPrice)}</p>
                      {line.variantName && !["Default", "Standard"].includes(line.variantName) ? (
                        <p className="text-[0.875rem]">Size: {line.variantName}</p>
                      ) : null}
                      {line.overStock ? (
                        <p className="mt-2 text-[0.75rem] text-danger">
                          Only {line.available} left — quantity will be reduced at checkout.
                        </p>
                      ) : null}
                      <div className="mt-4 md:hidden">{controls}</div>
                    </div>
                  </div>
                </td>
                <td className="hidden pl-8 pt-10 md:table-cell">{controls}</td>
                <td className="pt-10 text-right text-[1rem] text-[rgb(18,18,18)]">
                  {formatShopPrice(line.lineTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-14 border-t border-[rgba(18,18,18,0.08)] pt-10 md:flex md:justify-end">
        <div className="w-full md:max-w-[22.5rem]">
          <Discount
            coupon={cart.coupon}
            warning={cart.couponWarning}
            applyCoupon={applyCoupon}
            removeCoupon={removeCoupon}
          />
          <Totals totals={totals} />
          <Link href="/checkout" className="button button--full mt-5">
            Check out
          </Link>
        </div>
      </div>
    </>
  );
}
