import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductHero } from "@/components/product/ProductHero";
import { ProductReviews } from "@/components/product/ProductReviews";
import { BrandStorySection } from "@/components/product/BrandStorySection";
import { ProductGrid } from "@/components/product/ProductGrid";
import { IconCaret, IconRow } from "@/components/layout/Icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { brandStoryFor } from "@/lib/brand-stories";
import { prisma } from "@/lib/prisma";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import {
  breadcrumbSchema,
  buildMetadata,
  faqSchema,
  productSchema,
} from "@/lib/seo";
import { stripHtml, truncate } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  let product = null;
  try {
    product = await getProductBySlug(slug);
  } catch (err) {
    console.error("[generateMetadata] DB error for slug:", slug, err);
  }
  if (!product) {
    return buildMetadata({
      title: "Product not found",
      description: "",
      path: `/product/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: product.seoTitle ?? product.name,
    description:
      product.seoDescription ??
      product.shortDescription ??
      stripHtml(product.description ?? product.name),
    path: `/product/${product.slug}`,
    image: product.ogImageUrl ?? product.images?.[0]?.url ?? null,
    type: "product",
    keywords: product.seoKeywords,
  });
}
export default async function ProductPage({ params }) {
  const { slug } = await params;
  let product = null;
  let dbError = false;
  try {
    product = await getProductBySlug(slug);
  } catch (err) {
    console.error(`[ProductPage] DB error retrieving product for slug '${slug}':`, err?.message || err);
    if (err?.stack) console.error(err.stack);
    dbError = true;
  }
  if (dbError || !product) notFound();

  const user = null;
  let canReview = false;
  let related = [];
  try {
    related = await getRelatedProducts(product.id, product.categoryId, 4);
  } catch (err) {
    console.error("[ProductPage] getRelatedProducts error:", err);
  }
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    ...(product.category
      ? [
          {
            name: product.category.name,
            path: `/shop/${product.category.slug}`,
          },
        ]
      : []),
    { name: product.name, path: `/product/${product.slug}` },
  ];
  const variants = (product.variants ?? []).map((variant) => ({
    id: variant.id,
    name: variant.name,
    sku: variant.sku,
    price: variant.price ?? 0,
    compareAtPrice: variant.compareAtPrice,
    imageUrl: variant.imageUrl,
    tracked: variant.inventory?.trackInventory ?? false,
    available: variant.inventory
      ? Math.max(0, (variant.inventory.onHand ?? 0) - (variant.inventory.reserved ?? 0))
      : 0,
  }));
  return (
    <>
      <JsonLd
        id="product"
        data={productSchema({ ...product, inStock: product.inStock })}
      />
      <JsonLd id="product-breadcrumb" data={breadcrumbSchema(crumbs)} />
      {product.faqs?.length ? (
        <JsonLd id="product-faq" data={faqSchema(product.faqs)} />
      ) : null}

      <RecentlyViewed
        productId={product.id}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price ?? product.variants?.[0]?.price ?? 0,
          image: product.images?.[0]?.url ?? null,
        }}
      />

      <section className="page-width dawn-section">
        <ProductHero
          productId={product.id}
          productName={product.name}
          categoryName={product.category?.name ?? null}
          categorySlug={product.category?.slug ?? null}
          images={product.images}
          variants={variants}
          ratingAverage={product.ratingAverage}
          ratingCount={product.ratingCount}
        >
          {product.shortDescription ? (
            <p className="mt-8 text-[0.9375rem] leading-relaxed">
              {product.shortDescription}
            </p>
          ) : null}

          {product.description || product.story ? (
            <div
              className="rte prose-botanical mt-5 !text-[0.9375rem] !leading-[1.8]"
              // Sanitised on write in the admin action and again here, so
              // rows imported from the old store cannot carry a payload.
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(product.story ?? product.description),
              }}
            />
          ) : null}

          <div className="mt-8">
            {product.benefits?.length ? (
              <Row icon="leaf" title="In the brand's own words">
                <p className="mb-3 text-[0.8125rem]">
                  Taken directly from the product&apos;s own description — we
                  don&apos;t add claims of our own.
                </p>
                <ul className="grid gap-3">
                  {product.benefits.map((benefit) => (
                    <li key={benefit.id}>
                      <p className="text-[rgb(18,18,18)]">{benefit.title}</p>
                      {benefit.body ? <p className="text-[0.875rem]">{benefit.body}</p> : null}
                    </li>
                  ))}
                </ul>
              </Row>
            ) : null}

            {product.ingredients?.length ? (
              <Row icon="list" title="From the tree">
                <p className="mb-3 text-[0.8125rem]">
                  The parts of the moringa this product is made from.
                </p>
                <ul className="grid gap-4">
                  {product.ingredients.map((entry) => (
                    <li key={entry.ingredientId ?? entry.id}>
                      <p className="text-[rgb(18,18,18)]">
                        {entry.ingredient?.name ?? "Ingredient"}
                        {entry.amount ? ` · ${entry.amount}` : ""}
                      </p>
                      {entry.ingredient?.origin ? (
                        <p className="caption-uc mt-1">{entry.ingredient.origin}</p>
                      ) : null}
                      {entry.ingredient?.description ? (
                        <p className="mt-1 text-[0.875rem]">{entry.ingredient.description}</p>
                      ) : null}
                      {entry.ingredient?.slug ? (
                        <Link href={`/shop?ingredient=${entry.ingredient.slug}`} className="dawn-link text-[0.8125rem]">
                          Shop this part
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Row>
            ) : null}

            {product.usageSteps?.length ? (
              <Row icon="question" title="Three steps">
                <p className="mb-3 text-[0.8125rem]">
                  Follow the serving on the pack. If you are pregnant, nursing
                  or on prescribed medication, speak to your doctor first.
                </p>
                <ol className="grid gap-3">
                  {product.usageSteps.map((step) => (
                    <li key={step.id}>
                      <p className="text-[rgb(18,18,18)]">
                        {step.step}. {step.title}
                      </p>
                      {step.body ? <p className="text-[0.875rem]">{step.body}</p> : null}
                    </li>
                  ))}
                </ol>
              </Row>
            ) : null}

            <Row icon="pin" title="Where this came from" last>
              <p className="text-[0.875rem]">
                Grown on smallholdings around Madurai in Tamil Nadu, picked by
                hand at first light, and into shade within the hour. Drying then
                happens in a controlled low-temperature closed chamber rather
                than in open sun — slower and more expensive, and the reason the
                leaf still looks like a leaf when it reaches the mill.
              </p>
              <p className="mt-3 text-[0.875rem]">
                Everything is milled and packed in small batches, so what
                arrives is rarely more than a few weeks old.
              </p>
              <Link href="/moringa" className="dawn-link mt-3 inline-block text-[0.875rem]">
                The whole process
              </Link>
            </Row>
          </div>
        </ProductHero>
      </section>

      {/* The sub-brand's own story, for the products that have one. */}
      <BrandStorySection story={brandStoryFor(product.slug)} />

      {/* Dawn "collapsible content" section */}
      {product.faqs?.length ? (
        <section className="page-width dawn-section">
          <div className="mx-auto max-w-[45rem]">
            <h2 className="h1 mb-8 text-center">About {product.name}</h2>
            {product.faqs.map((faq, i) => (
              <details key={faq.id} className={`accordion ${i === product.faqs.length - 1 ? "accordion--last" : ""}`}>
                <summary className="text-[1rem]">
                  {faq.question}
                  <IconCaret className="accordion__caret" />
                </summary>
                <div className="accordion__content text-[0.9375rem]">
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <section id="reviews" className="page-width dawn-section scroll-mt-24">
        <h2 className="h2 mb-8">What people say</h2>
        <ProductReviews
          productId={product.id}
          productName={product.name}
          reviews={product.reviews ?? []}
          average={product.ratingAverage}
          count={product.ratingCount}
          breakdown={product.ratingBreakdown}
          user={user}
          canReview={canReview}
        />
      </section>

      {related.length ? (
        <section className="page-width dawn-section">
          <h2 className="h2 mb-6">From the same tree</h2>
          <ProductGrid
            products={related}
            listName={`Related to ${product.name}`}
            columns={4}
          />
        </section>
      ) : null}

      {/* Compliance note — stated once, plainly, on every product page. */}
      <div className="page-width pb-4 pt-6">
        <p className="max-w-[76ch] text-[0.75rem] leading-relaxed">
          {truncate(
            "These are food products, not medicines. They are not intended to diagnose, treat, cure or prevent any disease. If you are pregnant, nursing, taking prescribed medication or managing a health condition, talk to a qualified medical practitioner before adding any supplement to your diet.",
            400,
          )}
        </p>
      </div>
    </>
  );
}

/** Dawn's collapsible_tab block: icon, heading, caret. */
function Row({ icon, title, last = false, children }) {
  return (
    <details className={`accordion ${last ? "accordion--last" : ""}`}>
      <summary className="text-[0.9375rem]">
        <IconRow name={icon} />
        {title}
        <IconCaret className="accordion__caret" />
      </summary>
      <div className="accordion__content">{children}</div>
    </details>
  );
}
