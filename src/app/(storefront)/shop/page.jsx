import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ShopControls } from "@/components/shop/ShopLayout";
import { Pagination } from "@/components/shop/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCategories, getIngredients, searchProducts } from "@/lib/queries";
import { shopQuerySchema } from "@/lib/validation";
import { buildFilterGroups, countActiveFilters } from "@/lib/shop";
import { breadcrumbSchema, buildMetadata, itemListSchema } from "@/lib/seo";
export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const term = typeof params.q === "string" ? params.q : null;
  return buildMetadata({
    title: term ? `Search: ${term}` : "Shop all moringa products",
    description:
      "Moringa leaf powder, teas, tablets, capsules, mixes, snacks and seed oil — grown in Madurai, Tamil Nadu and dried in-house at low temperature.",
    path: "/shop",
    // Filtered and paginated permutations are index noise; canonical /shop and
    // the category pages carry the SEO weight.
    noIndex: Object.keys(params).length > 0,
  });
}
export default async function ShopPage({ searchParams }) {
  const raw = await searchParams;
  const query = shopQuerySchema.parse(raw);
  const [result, categories, ingredients] = await Promise.all([
    searchProducts(query),
    getCategories(),
    getIngredients(),
  ]);
  const groups = buildFilterGroups(categories, ingredients);
  const activeCount = countActiveFilters(raw);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
  ];
  return (
    <>
      <JsonLd id="shop-breadcrumb" data={breadcrumbSchema(crumbs)} />
      {result.products.length ? (
        <JsonLd id="shop-items" data={itemListSchema(result.products)} />
      ) : null}

      <div className="page-width pt-9 md:pt-12">
        <h1 className="h1">
          <span className="sr-only">Collection: </span>
          {query.q ? `Results for “${query.q}”` : "The collection"}
        </h1>
        <div className="mt-3 max-w-[45rem] text-[0.9375rem]">
          <p>
            {query.q
              ? `${result.total} ${result.total === 1 ? "product" : "products"} matched your search.`
              : "Twenty-seven products, all from the same tree. Leaf, pod, flower, seed and gum, handled five different ways."}
          </p>
        </div>
      </div>

      <div className="page-width dawn-section">
        <Suspense fallback={<div className="h-10" />}>
          <ShopControls groups={groups} total={result.total} activeCount={activeCount} />
        </Suspense>

        {result.products.length === 0 ? (
          <EmptyState
            title="Nothing matched those filters"
            body={
              query.q
                ? `We couldn't find anything for “${query.q}”. Try a broader term, or browse by category.`
                : "Try loosening a filter or two — or start from a category."
            }
            actionLabel="Clear filters"
            actionHref="/shop"
            secondaryLabel="Browse bestsellers"
            secondaryHref="/shop?collection=bestsellers"
          />
        ) : (
          <>
            <ProductGrid
              products={result.products}
              listName={query.q ? `Search: ${query.q}` : "Shop"}
              columns={4}
              priorityCount={4}
              className="mt-6"
              headingLabel={query.q ? `Results for ${query.q}` : "Products"}
            />
            <Pagination page={result.page} pages={result.pages} total={result.total} pageSize={result.pageSize} />
          </>
        )}

        {/* Crawlable category links, independent of the JS filter UI. */}
        <nav aria-label="Shop by category" className="mt-14 border-t border-[rgba(18,18,18,0.08)] pt-8">
          <h2 className="h4 mb-3">Shop by category</h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={`/shop/${category.slug}`} className="text-[0.875rem] hover:text-[rgb(18,18,18)] hover:underline hover:underline-offset-[0.3rem]">
                  {category.name} ({category._count.products})
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
