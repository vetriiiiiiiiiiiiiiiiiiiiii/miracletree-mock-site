"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { Stars } from "@/components/product/ProductCard";
import { IconChevronRight, IconShare } from "@/components/layout/Icons";

/**
 * Dawn's main-product section: the media gallery on the left (large image
 * with a thumbnail strip on desktop, a swipe slider with a counter on phones)
 * and the product information column on the right, sticky while the gallery
 * scrolls past. Owns the selected-variant image so the page stays a Server
 * Component.
 */
export function ProductHero({
  productId,
  productName,
  categoryName,
  categorySlug,
  images = [],
  variants = [],
  ratingAverage,
  ratingCount,
  children,
}) {
  const [activeImageUrl, setActiveImageUrl] = useState(variants[0]?.imageUrl ?? null);
  const onVariantChange = useCallback((variant) => {
    if (variant.imageUrl) setActiveImageUrl(variant.imageUrl);
  }, []);

  return (
    <div className="grid gap-y-6 md:grid-cols-[55%_1fr] md:gap-x-0">
      <Gallery images={images} productName={productName} activeImageUrl={activeImageUrl} />

      <div className="md:pl-12 lg:pl-16">
        <div className="md:sticky md:top-28">
          {categoryName && categorySlug ? (
            <Link href={`/shop/${categorySlug}`} className="caption-uc text-[rgba(18,18,18,0.75)] hover:underline">
              {categoryName}
            </Link>
          ) : null}
          <h1 className="h1 mt-2.5">{productName}</h1>

          <div className="mt-2 text-[0.875rem]">
            {ratingCount > 0 ? (
              <a href="#reviews" className="inline-flex items-center gap-2">
                <Stars value={ratingAverage} size={14} />
                <span>({ratingCount})</span>
              </a>
            ) : (
              <a href="#reviews" className="dawn-link text-[0.8125rem]">
                No reviews yet — be the first
              </a>
            )}
          </div>

          <div className="mt-5">
            <ProductPurchase
              productId={productId}
              productName={productName}
              categoryName={categoryName}
              variants={variants}
              onVariantChange={onVariantChange}
            />
          </div>

          {children}

          <ShareButton />
        </div>
      </div>
    </div>
  );
}

function Gallery({ images, productName, activeImageUrl }) {
  const [index, setIndex] = useState(0);
  const sliderRef = useRef(null);

  // A variant with its own photograph moves the gallery to it.
  useEffect(() => {
    if (!activeImageUrl) return;
    const i = images.findIndex((img) => img.url === activeImageUrl);
    if (i >= 0) setIndex(i);
  }, [activeImageUrl, images]);

  // Keep the phone slider in step with the selected image.
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    slider.scrollTo({ left: slider.clientWidth * index, behavior: "smooth" });
  }, [index]);

  if (!images.length) {
    return <div className="aspect-square bg-[rgba(18,18,18,0.04)]" />;
  }

  const unoptimized = (url) =>
    typeof url === "string" ? url.startsWith("/uploads/") : undefined;
  const current = images[index] ?? images[0];

  return (
    <div className="min-w-0">
      {/* Phones: swipe slider */}
      <div
        ref={sliderRef}
        className="-mx-[0.9375rem] flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / el.clientWidth);
          if (i !== index) setIndex(i);
        }}
      >
        {images.map((img, i) => (
          <div key={img.id ?? img.url} className="relative aspect-square w-full shrink-0 snap-start">
            <Image
              src={img.url}
              alt={img.alt ?? productName}
              fill
              sizes="100vw"
              priority={i === 0}
              className="object-contain"
              unoptimized={unoptimized(img.url)}
            />
          </div>
        ))}
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-2 text-[0.8125rem] md:hidden">
          <button
            type="button"
            className="header__icon"
            aria-label="Previous slide"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            <IconChevronRight className="rotate-180" />
          </button>
          <span>
            {index + 1} / {images.length}
          </span>
          <button
            type="button"
            className="header__icon"
            aria-label="Next slide"
            disabled={index === images.length - 1}
            onClick={() => setIndex((i) => Math.min(images.length - 1, i + 1))}
          >
            <IconChevronRight />
          </button>
        </div>
      ) : null}

      {/* Desktop: large image + thumbnails */}
      <div className="hidden md:block">
        <div className="relative aspect-square border border-[rgba(18,18,18,0.04)]">
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt ?? productName}
            fill
            sizes="(min-width: 1200px) 600px, 55vw"
            priority
            className="object-contain"
            unoptimized={unoptimized(current.url)}
          />
        </div>
        {images.length > 1 ? (
          <ul className="mt-2.5 grid grid-cols-4 gap-2.5 lg:grid-cols-5">
            {images.map((img, i) => (
              <li key={img.id ?? img.url}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Load image ${i + 1} in gallery view`}
                  aria-current={i === index ? "true" : undefined}
                  className={cn(
                    "relative block aspect-square w-full border transition-colors",
                    i === index
                      ? "border-[rgb(18,18,18)]"
                      : "border-[rgba(18,18,18,0.08)] hover:border-[rgba(18,18,18,0.4)]",
                  )}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-contain p-1"
                    unoptimized={unoptimized(img.url)}
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function ShareButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="mt-6 inline-flex items-center gap-2 py-2 text-[0.875rem] text-[rgb(18,18,18)] hover:underline hover:underline-offset-[0.3rem]"
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) await navigator.share({ url });
          else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }
        } catch {
          // The shopper dismissed the share sheet.
        }
      }}
    >
      <IconShare />
      {copied ? "Link copied to clipboard" : "Share"}
    </button>
  );
}
