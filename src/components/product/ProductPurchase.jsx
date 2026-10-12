"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatShopPrice } from "@/lib/money";
import { QuantityStepper } from "@/components/cart/CartDrawer";
import { useCart } from "@/components/cart/CartProvider";
import { Spinner } from "@/components/product/ProductCard";
import { IconRow } from "@/components/layout/Icons";
import { analytics } from "@/lib/analytics";

/**
 * Dawn's buy box: price (with the Sale pill), variant pills, the bordered
 * quantity box, then "Add to cart" as an outline button above a solid
 * "Buy it now". Price, stock and size all come from one selected variant, so
 * the number shown is always the number charged.
 */
export function ProductPurchase({
  productId,
  productName,
  categoryName,
  variants = [],
  onVariantChange,
  onAdded,
  compact = false,
}) {
  const router = useRouter();
  const { add } = useCart();
  // Open on the first variant that can actually be bought.
  const initialIndex = Math.max(
    0,
    variants.findIndex((v) => !v.tracked || v.available > 0),
  );
  const [index, setIndex] = useState(initialIndex);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(null);
  const selected = variants[index];

  useEffect(() => {
    if (selected) onVariantChange?.(selected);
  }, [selected, onVariantChange]);

  useEffect(() => {
    if (!selected) return;
    analytics.viewItem({
      item_id: productId,
      item_name: productName,
      item_category: categoryName ?? undefined,
      item_variant: selected.name,
      price: selected.price / 100,
    });
    // Reporting once per product view, not once per variant click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const stock = useMemo(() => {
    if (!selected) return { level: "out", text: "Unavailable" };
    if (!selected.tracked) return { level: "in", text: "In stock" };
    if (selected.available <= 0) return { level: "out", text: "Sold out" };
    if (selected.available <= 5)
      return { level: "low", text: `Low stock: ${selected.available} left` };
    return { level: "in", text: "In stock" };
  }, [selected]);

  const maxQuantity = selected
    ? selected.tracked
      ? Math.max(1, Math.min(10, selected.available))
      : 10
    : 1;

  const handleAdd = async (then) => {
    if (!selected) return;
    setBusy(then === "stay" ? "add" : "buy");
    const ok = await add({
      productId,
      variantId: selected.id,
      quantity,
      meta: {
        name: productName,
        variantName: selected.name,
        price: selected.price,
        category: categoryName ?? undefined,
      },
    });
    setBusy(null);
    if (ok) onAdded?.();
    if (ok && then === "checkout") router.push("/checkout");
  };

  if (!selected) return null;
  const onSale = selected.compareAtPrice && selected.compareAtPrice > selected.price;
  const soldOut = stock.level === "out";

  return (
    <div>
      <div className="price price--large flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {onSale ? (
          <>
            <span className="sr-only">Regular price</span>
            <s className="!mr-0 !text-[1rem]">{formatShopPrice(selected.compareAtPrice)}</s>
            <span className="sr-only">Sale price</span>
          </>
        ) : null}
        <span className={onSale ? "price--sale" : undefined}>{formatShopPrice(selected.price)}</span>
        {soldOut ? (
          <span className="badge badge--muted !border-[rgba(18,18,18,0.2)]">Sold out</span>
        ) : onSale ? (
          <span className="badge">Sale</span>
        ) : null}
      </div>
      <p className="mt-1 text-[0.8125rem]">Inclusive of all taxes</p>

      {variants.length > 1 ? (
        <fieldset className="mt-6">
          <legend className="mb-2 text-[0.875rem]">Size</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant, i) => {
              const out = variant.tracked && variant.available <= 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  className="pill"
                  aria-pressed={i === index}
                  disabled={out}
                  onClick={() => {
                    setIndex(i);
                    setQuantity(1);
                  }}
                >
                  {variant.name}
                  {out ? <span className="sr-only"> — sold out</span> : null}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {stock.level !== "in" ? (
        <p className="mt-5 flex items-center gap-2 text-[0.875rem]">
          <span
            className={
              stock.level === "low"
                ? "h-2 w-2 rounded-full bg-[#ee9441]"
                : "h-2 w-2 rounded-full bg-[#c8c8c8]"
            }
            aria-hidden
          />
          {stock.text}
        </p>
      ) : null}

      <div className="mt-6">
        <label className="mb-2 block text-[0.875rem]">Quantity</label>
        <QuantityStepper
          value={quantity}
          max={maxQuantity}
          onChange={setQuantity}
          disabled={soldOut}
          label={`Quantity of ${productName}`}
        />
      </div>

      <div className="mt-6 grid max-w-[27.5rem] gap-2.5">
        <button
          type="button"
          className="button button--secondary button--full"
          disabled={soldOut || busy !== null}
          onClick={() => handleAdd("stay")}
        >
          {busy === "add" ? <Spinner /> : soldOut ? "Sold out" : "Add to cart"}
        </button>
        {!soldOut ? (
          <button
            type="button"
            className="button button--full"
            disabled={busy !== null}
            onClick={() => handleAdd("checkout")}
          >
            {busy === "buy" ? <Spinner /> : "Buy it now"}
          </button>
        ) : null}
      </div>

      {soldOut ? (
        <p className="mt-4 max-w-[27.5rem] text-[0.875rem]">
          This size is sold out. Pick another size above, or check back — we
          restock after each harvest.
        </p>
      ) : null}

      {compact ? null : (
      <ul className="mt-8 grid gap-3 text-[0.875rem]">
        <IconText icon="truck">Free shipping over ₹699 · flat ₹60 below that</IconText>
        <IconText icon="box">Packed within 1–2 working days, shipped across India</IconText>
        <IconText icon="leaf">
          Closed-chamber dried at low temperature · no colouring, no preservatives
        </IconText>
        <IconText icon="lock">Secure payment by card, UPI, net banking or COD</IconText>
      </ul>
      )}
    </div>
  );
}

function IconText({ icon, children }) {
  return (
    <li className="flex items-start gap-3 text-[rgb(18,18,18)]">
      <span className="mt-0.5 shrink-0 text-[rgb(var(--brand-green))]">
        <IconRow name={icon} />
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
