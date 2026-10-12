"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatShopPrice } from "@/lib/money";
import { useCart } from "@/components/cart/CartProvider";
import { analytics } from "@/lib/analytics";

/**
 * Dawn's card-product, "standard" style: the photograph, a Sale / Sold out
 * pill at its bottom-left, the title (underlined on hover), the price, and
 * the quick-add button — "Add to cart" for a single size, "Choose options"
 * (opening the quick view) when there are several.
 */
export function ProductCard({
  product,
  index = 0,
  listName = "Product list",
  priority = false,
  className,
  onQuickView,
}) {
  const { add } = useCart();
  const [adding, setAdding] = useState(false);
  const primary = product.images[0];
  const secondary = product.images[1];
  const displayPrice =
    product.variants?.length > 0
      ? Math.min(...product.variants.map((v) => v.price))
      : product.price;
  const displayCompareAt =
    product.variants?.length === 1
      ? product.variants[0].compareAtPrice
      : product.compareAtPrice;
  const onSale = Boolean(displayCompareAt && displayCompareAt > displayPrice);
  const multipleSizes = product.variants?.length > 1;
  const inStock =
    product.inStock ??
    product.variants?.some(
      (v) =>
        !v.inventory?.trackInventory ||
        (v.inventory ? v.inventory.onHand - v.inventory.reserved > 0 : true),
    );

  const analyticsItem = {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category?.name,
    price: displayPrice / 100,
    index,
  };

  const handleQuickAdd = async () => {
    const variant = product.variants[0];
    if (!variant) return;
    setAdding(true);
    await add({
      productId: product.id,
      variantId: variant.id,
      quantity: 1,
      meta: {
        name: product.name,
        variantName: variant.name,
        price: variant.price,
        category: product.category?.name,
      },
    });
    setAdding(false);
  };

  const unoptimized = (url) =>
    typeof url === "string" ? url.startsWith("/uploads/") : undefined;

  return (
    <div className={cn("card-product group relative flex h-full flex-col", className)}>
      <div className="card-product__media relative aspect-square overflow-hidden bg-white">
        {primary ? (
          <Image
            src={primary.url}
            alt={primary.alt ?? product.name}
            fill
            sizes="(min-width: 990px) 275px, (min-width: 750px) 33vw, 50vw"
            priority={priority}
            className={cn(
              "card-product__img--primary object-contain",
              secondary && "md:group-hover:opacity-0",
            )}
            unoptimized={unoptimized(primary.url)}
          />
        ) : (
          <div className="absolute inset-0 bg-[rgba(18,18,18,0.04)]" />
        )}
        {secondary ? (
          <Image
            src={secondary.url}
            alt=""
            aria-hidden
            fill
            sizes="(min-width: 990px) 275px, (min-width: 750px) 33vw, 50vw"
            className="hidden object-contain opacity-0 md:block md:group-hover:opacity-100"
            unoptimized={unoptimized(secondary.url)}
          />
        ) : null}

        <div className="pointer-events-none absolute bottom-3 left-3 z-10">
          {!inStock ? (
            <span className="badge badge--muted">Sold out</span>
          ) : onSale ? (
            <span className="badge">Sale</span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-3.5">
        <h3 className="card-product__heading text-[0.9375rem] leading-snug tracking-[0.0375rem] md:text-[1rem]">
          <Link
            href={`/product/${product.slug}`}
            onClick={() => analytics.selectItem(listName, analyticsItem)}
            className="after:absolute after:inset-0 after:z-[1] after:content-['']"
          >
            {product.name}
          </Link>
        </h3>

        {product.ratingCount > 0 ? (
          <p className="mt-1 flex items-center gap-1.5 text-[0.75rem]">
            <Stars value={product.ratingAverage} />
            <span>({product.ratingCount})</span>
          </p>
        ) : null}

        <div className="price mt-1.5">
          {onSale ? (
            <>
              <span className="sr-only">Regular price</span>
              <s>{formatShopPrice(displayCompareAt)}</s>
              <span className="sr-only">Sale price</span>
            </>
          ) : (
            <span className="sr-only">Regular price</span>
          )}
          <span className={onSale ? "price--sale" : undefined}>
            {multipleSizes ? "From " : ""}
            {formatShopPrice(displayPrice)}
          </span>
        </div>

        <div className="relative z-[2] mt-auto pt-3.5">
          {!inStock ? (
            <button type="button" className="button button--secondary button--full" disabled>
              Sold out
            </button>
          ) : multipleSizes ? (
            <button
              type="button"
              className="button button--secondary button--full"
              onClick={() =>
                onQuickView ? onQuickView(product.slug) : (window.location.href = `/product/${product.slug}`)
              }
            >
              Choose options
            </button>
          ) : (
            <button
              type="button"
              className="button button--secondary button--full"
              onClick={handleQuickAdd}
              disabled={adding}
              aria-busy={adding || undefined}
            >
              {adding ? <Spinner /> : "Add to cart"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Stars({ value, size = 12 }) {
  const rounded = Math.round((value ?? 0) * 2) / 2;
  return (
    <span className="inline-flex text-[rgb(var(--brand-orange))]" aria-label={`${(value ?? 0).toFixed(1)} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden>
          <defs>
            <linearGradient id={`half-${i}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            d="m10 1.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8L10 1.5Z"
            fill={rounded >= i ? "currentColor" : rounded >= i - 0.5 ? `url(#half-${i})` : "transparent"}
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      ))}
    </span>
  );
}

export function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border border-current border-t-transparent"
      aria-hidden
    />
  );
}
