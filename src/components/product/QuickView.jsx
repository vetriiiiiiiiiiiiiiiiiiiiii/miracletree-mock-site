"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { IconArrow, IconClose } from "@/components/layout/Icons";
import { analytics } from "@/lib/analytics";

/**
 * Dawn's quick-add modal, opened by "Choose options" on a product card: the
 * photograph beside the same buy box the product page uses, and a link to the
 * full details. The data is fetched on open rather than embedded in every
 * card, so a 27-card grid does not ship 27 product payloads.
 */
export function QuickView({ slug, open, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!open || !slug) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`/api/products/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        return response.json();
      })
      .then((payload) => {
        setData(payload);
        setImage(payload.images[0]?.url ?? null);
        analytics.viewItem({
          item_id: payload.id,
          item_name: payload.name,
          item_category: payload.categoryName ?? undefined,
          price: (payload.variants[0]?.price ?? 0) / 100,
        });
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError("We couldn't load that product.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [open, slug]);

  return (
    <Drawer open={open} onClose={onClose} title="Quick view" side="center" className="w-[min(60rem,94vw)] p-0">
      <button type="button" onClick={onClose} aria-label="Close" className="header__icon absolute right-2 top-2 z-10">
        <IconClose />
      </button>
      <div className="max-h-[88vh] overflow-y-auto">
        {loading ? (
          <div className="grid gap-8 p-8 md:grid-cols-2">
            <div className="aspect-square animate-pulse bg-[rgba(18,18,18,0.04)]" />
            <div className="grid content-start gap-4">
              <div className="h-8 w-3/4 animate-pulse bg-[rgba(18,18,18,0.06)]" />
              <div className="h-4 w-1/3 animate-pulse bg-[rgba(18,18,18,0.06)]" />
              <div className="mt-4 h-12 w-full animate-pulse bg-[rgba(18,18,18,0.06)]" />
            </div>
          </div>
        ) : error || !data ? (
          <div className="p-12 text-center">
            <p>{error ?? "That product is unavailable."}</p>
            <button type="button" className="button button--secondary mt-6" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <div className="grid gap-6 p-6 md:grid-cols-2 md:gap-10 md:p-10">
            <div className="relative aspect-square">
              {image ? (
                <Image
                  src={image}
                  alt={data.name}
                  fill
                  sizes="(min-width: 750px) 440px, 90vw"
                  className="object-contain"
                  unoptimized={typeof image === "string" ? image.startsWith("/uploads/") : undefined}
                />
              ) : null}
            </div>
            <div>
              {data.categoryName ? <p className="caption-uc">{data.categoryName}</p> : null}
              <h2 className="h1 mt-2">{data.name}</h2>
              <div className="mt-5">
                <ProductPurchase
                  productId={data.id}
                  productName={data.name}
                  categoryName={data.categoryName}
                  variants={data.variants}
                  onVariantChange={(v) => v.imageUrl && setImage(v.imageUrl)}
                  onAdded={onClose}
                  compact
                />
              </div>
              <Link
                href={`/product/${data.slug}`}
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-2 text-[0.9375rem] text-[rgb(18,18,18)] hover:underline hover:underline-offset-[0.3rem]"
              >
                View full details
                <IconArrow />
              </Link>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
