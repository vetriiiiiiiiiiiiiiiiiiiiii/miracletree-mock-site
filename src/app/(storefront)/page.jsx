import {
  getArticles,
  getCategories,
  getFaqs,
  getFeaturedProducts,
  getFeaturedReviews,
  getHomepageSections,
  getIngredients,
  getSettings,
  getTestimonials,
} from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";
import { INNOVATIONS } from "@/lib/innovation";
import { COUNTRIES_REACHED, MARKETS, PROJECTS } from "@/lib/export-markets";
import { CERT_MARKS, FACTS, FOUNDER_FIGURES, STEPS, VISITORS } from "@/lib/home-content";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  BlogPosts,
  CollapsibleContent,
  CollectionList,
  ImageBanner,
  ImageWithText,
  LogoList,
  Multicolumn,
  RichText,
  SectionTitle,
  Testimonials,
  ViewAll,
} from "@/components/home/DawnSections";

export async function generateMetadata() {
  const settings = await getSettings();
  const base = buildMetadata({
    title:
      settings.get("seo.defaultTitle") ??
      `${SITE.name} — Moringa superfoods from Madurai`,
    description: settings.get("seo.defaultDescription") ?? SITE.description,
    path: "/",
  });
  // The root layout appends "— Miracle Tree" to every title. The homepage title
  // already carries the brand, so it opts out of the template rather than
  // rendering it twice.
  return { ...base, title: { absolute: String(base.title) } };
}
/**
 * The homepage, laid out as a Dawn home template: image banner, featured
 * collection, multicolumns, image-with-text, collection list, testimonials,
 * blog posts, collapsible FAQ and a closing rich-text call to action. Every
 * section still answers to its CMS row — title, subtitle, CTA and on/off.
 */
export default async function HomePage() {
  const [sections, products, ingredients, reviews, testimonials, articles, faqs, categories, founder, accolades] =
    await Promise.all([
      getHomepageSections(),
      getFeaturedProducts(8),
      getIngredients(),
      getFeaturedReviews(9),
      getTestimonials(6),
      getArticles({ take: 3 }),
      getFaqs(),
      getCategories(),
      prisma.leader.findFirst({
        where: { isActive: true, isFounder: true },
        select: { name: true, role: true, quote: true, imageUrl: true },
      }),
      prisma.accolade.findMany({
        where: { isActive: true },
        orderBy: { position: "asc" },
        select: { title: true, issuer: true, year: true },
      }),
    ]);

  // A collection card needs a picture; categories have none of their own, so
  // each borrows the first photograph from its own products.
  const collections = await Promise.all(
    categories.map(async (c) => {
      const first = c.imageUrl
        ? null
        : await prisma.product.findFirst({
            where: { status: "published", category: { slug: c.slug } },
            orderBy: { position: "asc" },
            select: { images: { orderBy: { position: "asc" }, take: 1, select: { url: true } } },
          });
      return {
        name: c.name,
        slug: c.slug,
        count: c._count.products,
        image: c.imageUrl ?? first?.images[0]?.url ?? null,
      };
    }),
  );

  const get = (key) => sections.get(key);
  const heroSection = get("hero");
  const hero = {
    title: heroSection?.title ?? "From the Miracle Tree.",
    subtitle:
      heroSection?.subtitle ??
      "Moringa grown, dried and milled in Madurai — from a single seed to what reaches your kitchen.",
  };

  // Real reviews first; brand testimonials fill the rest. Nothing invented.
  const proof = [
    ...reviews.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      body: r.body,
      isVerified: r.isVerified,
      product: r.product,
    })),
    ...testimonials.map((t) => ({
      id: t.id,
      authorName: t.authorName,
      location: t.location,
      rating: t.rating,
      body: t.body,
    })),
  ].slice(0, 6);

  const certified = accolades.filter((a) => /NPOP|FSSAI|ISO|Manufacturing|HACCP/i.test(a.title));
  const recognised = accolades.filter((a) => !certified.includes(a)).slice(0, 4);
  const storySection = get("story");

  return (
    <>
      <ImageBanner
        image={heroSection?.mediaUrl ?? "/photos/gallery-14.webp"}
        alt="The Miracle Tree Life Science building with a visiting group outside"
        caption="MiracleTree Life Science · Madurai"
        title={hero.title}
        subtitle={hero.subtitle}
        buttons={[
          { href: "/shop", label: "Shop the range" },
          { href: "/innovation", label: "What we developed" },
        ]}
      />

      {/* Featured collection */}
      {isActive(sections, "collection") && products.length ? (
        <section className="dawn-section">
          <div className="page-width">
            <SectionTitle
              title={get("collection")?.title ?? "The collection"}
              subtitle={get("collection")?.subtitle ?? null}
            />
            <ProductGrid products={products} listName="Homepage collection" columns={4} priorityCount={4} />
            <ViewAll
              href={get("collection")?.ctaHref ?? "/shop"}
              label={get("collection")?.ctaLabel ?? "View all products"}
            />
          </div>
        </section>
      ) : null}

      {isActive(sections, "why-moringa") ? (
        <Multicolumn
          title={get("why-moringa")?.title ?? "Why moringa"}
          subtitle={get("why-moringa")?.subtitle ?? null}
          background="yellow"
          columns={FACTS.map((f) => ({
            key: f.figure,
            figure: f.figure,
            unit: f.unit,
            title: f.title,
            body: f.body,
          }))}
          footer={
            <p className="mt-10 max-w-[45rem] text-[0.875rem]">
              We describe how the plant is grown and handled, not what it will do
              for you. Moringa is a food, and our products are foods — if you are
              pregnant, nursing, on prescribed medication or managing a condition,
              talk to your doctor before adding any supplement.{" "}
              <a href="/moringa" className="dawn-link">
                More about the plant
              </a>
            </p>
          }
        />
      ) : null}

      <CollectionList title="Shop by category" collections={collections} />

      {isActive(sections, "story") ? (
        <ImageWithText
          image={storySection?.mediaUrl ?? "/photos/gallery-17.webp"}
          alt="A MOGO product pack being presented outside the premises"
          caption="Madurai, Tamil Nadu — where the leaf is grown, dried and milled."
          title={storySection?.title ?? "Twenty years under the same tree"}
          background="lilac"
          buttons={[
            {
              href: storySection?.ctaHref ?? "/about",
              label: storySection?.ctaLabel ?? "Our story",
            },
          ]}
        >
          {storySection?.subtitle ? <p>{storySection.subtitle}</p> : null}
          <p className="mt-3">
            The work has not changed much in that time: find growers who treat
            the tree properly, get the leaf into shade quickly, and dry it
            slowly enough that it still looks like a leaf when it reaches the
            mill.
          </p>
        </ImageWithText>
      ) : null}

      {isActive(sections, "farm-to-product") ? (
        <Multicolumn
          title={get("farm-to-product")?.title ?? "Farm to pack"}
          subtitle={get("farm-to-product")?.subtitle ?? null}
          background="green"
          cols={4}
          columns={STEPS.map((step, i) => ({
            key: step.id,
            eyebrow: String(i + 1).padStart(2, "0"),
            title: step.label,
            body: step.body,
          }))}
        />
      ) : null}

      <Multicolumn
        title="What we developed"
        subtitle="Two drying technologies, the first moringa-leaf energy bar, and cold-pressed seed oil. Built between 2014 and 2019."
        background="purple"
        cols={4}
        columns={INNOVATIONS.map((item) => ({
          key: item.slug,
          eyebrow: item.year,
          title: item.name,
          meta: item.expansion,
          body: item.headline,
          link: { href: `/innovation#${item.slug}`, label: "More" },
        }))}
        footer={
          <div className="mt-10">
            <a href="/innovation" className="button">
              All four in detail
            </a>
          </div>
        }
      />

      {founder ? (
        <ImageWithText
          image={founder.imageUrl}
          alt={founder.name}
          caption={founder.role}
          title={founder.name}
          background="blush"
          reverse
          buttons={[
            { href: "/leadership", label: "His full record" },
            { href: "/innovation", label: "The innovations" },
          ]}
        >
          {founder.quote ? (
            <blockquote className="h3 italic">&ldquo;{founder.quote}&rdquo;</blockquote>
          ) : null}
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
            {FOUNDER_FIGURES.map((f) => (
              <div key={f.value}>
                <dd className="h2">{f.value}</dd>
                <dt className="text-[0.8125rem]">{f.label}</dt>
              </div>
            ))}
          </dl>
        </ImageWithText>
      ) : null}

      {isActive(sections, "ingredients") && ingredients.length ? (
        <Multicolumn
          title={get("ingredients")?.title ?? "What's inside"}
          subtitle={get("ingredients")?.subtitle ?? null}
          cols={3}
          columns={ingredients.map((i, index) => ({
            key: i.slug,
            eyebrow: `0${index + 1}${i.origin ? ` · ${i.origin}` : ""}`,
            title: i.name,
            body: i.description,
            link: i._count.products
              ? { href: `/shop?ingredient=${i.slug}`, label: `${i._count.products} ${i._count.products === 1 ? "product" : "products"}` }
              : null,
          }))}
        />
      ) : null}

      <Multicolumn
        title={`From Madurai to ${COUNTRIES_REACHED} countries`}
        subtitle="Moringa grown, dried and milled in one district in Tamil Nadu, shipped to nine countries on record by name — and in two of them, built from the ground up."
        background="teal"
        cols={2}
        columns={PROJECTS.map((p) => ({
          key: p.country,
          eyebrow: `${p.partner} · ${p.status} · ${p.years}`,
          title: p.country,
          body: p.body,
        }))}
      >
        <ul className="mb-4 flex flex-wrap gap-2">
          {MARKETS.map((m) => (
            <li key={m.country} className="badge !bg-white !text-[rgb(var(--brand-deep))] !px-4 !py-2 !text-[0.8125rem]">
              {m.country}
            </li>
          ))}
        </ul>
        <p className="mb-10 text-[0.875rem]">
          {COUNTRIES_REACHED} countries reached in total; these nine are the
          ones recorded by name.
        </p>
      </Multicolumn>

      {/* What the company can prove */}
      {certified.length || recognised.length ? (
        <section className="dawn-section">
          <div className="page-width">
            <SectionTitle
              title="What we can prove"
              subtitle="Licence numbers, issuing bodies and dates — not adjectives. Every certificate below can be checked with the authority that granted it."
            />
            <div className="grid gap-10 md:grid-cols-3">
              <div>
                <h3 className="h3 mb-3">Certification</h3>
                <ul className="grid gap-3 text-[0.9375rem]">
                  {certified.map((a) => (
                    <li key={a.title} className="border-b border-[rgba(18,18,18,0.08)] pb-3">
                      <p className="text-[rgb(18,18,18)]">{a.title}</p>
                      <p className="text-[0.8125rem]">{[a.issuer, a.year].filter(Boolean).join(" · ")}</p>
                    </li>
                  ))}
                </ul>
              </div>
              {recognised.length ? (
                <div>
                  <h3 className="h3 mb-3">Recognition</h3>
                  <ul className="grid gap-3 text-[0.9375rem]">
                    {recognised.map((a) => (
                      <li key={a.title} className="border-b border-[rgba(18,18,18,0.08)] pb-3">
                        <p className="text-[rgb(18,18,18)]">{a.title}</p>
                        {a.issuer ? <p className="text-[0.8125rem]">{a.issuer}</p> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div>
                <h3 className="h3 mb-1">Who has visited</h3>
                <p className="mb-3 text-[0.875rem]">
                  Agricultural bodies, research institutes and food-technology
                  scientists who have been to the Milakaranai site or met the
                  team.
                </p>
                <ul className="grid gap-3 text-[0.9375rem]">
                  {VISITORS.map((v) => (
                    <li key={v.name} className="border-b border-[rgba(18,18,18,0.08)] pb-3">
                      <p className="text-[rgb(18,18,18)]">{v.name}</p>
                      <p className="text-[0.8125rem]">{v.role}</p>
                    </li>
                  ))}
                </ul>
                <a href="/gallery#visitors" className="dawn-link mt-4 inline-block text-[0.875rem]">
                  See the photographs
                </a>
              </div>
            </div>
            <LogoList logos={CERT_MARKS.map((m) => ({ src: `/brand/certs/${m.src}.webp`, alt: m.alt }))} />
          </div>
        </section>
      ) : null}

      {isActive(sections, "reviews") ? (
        <Testimonials
          title={get("reviews")?.title ?? "In their words"}
          subtitle={get("reviews")?.subtitle ?? null}
          items={proof}
          emptyText="We are rebuilding this section around verified reviews only. If you have bought from us before, your review will appear here once it is approved."
          emptyLink={{ href: "/shop", label: "Browse the collection" }}
        />
      ) : null}

      {isActive(sections, "journal") ? (
        <BlogPosts
          title={get("journal")?.title ?? "The Journal"}
          subtitle={get("journal")?.subtitle ?? null}
          articles={articles}
          cta={{
            href: get("journal")?.ctaHref ?? "/about#field-notes",
            label: get("journal")?.ctaLabel ?? "Read the journal",
          }}
        />
      ) : null}

      {isActive(sections, "faq") ? (
        <CollapsibleContent
          title={get("faq")?.title ?? "Questions, answered"}
          subtitle={get("faq")?.subtitle ?? null}
          rows={faqs.slice(0, 6)}
          link={{ href: "/faq", label: "All questions" }}
        />
      ) : null}

      {isActive(sections, "final-cta") ? (
        <RichText
          title={get("final-cta")?.title ?? "Discover the miracle"}
          subtitle={get("final-cta")?.subtitle ?? null}
          background="magenta"
          buttons={[
            { href: get("final-cta")?.ctaHref ?? "/shop", label: get("final-cta")?.ctaLabel ?? "Shop now" },
            { href: "/moringa", label: "Discover moringa" },
          ]}
        />
      ) : null}
    </>
  );
}
/** A section absent from the CMS still renders; only an explicit disable hides it. */
function isActive(sections, key) {
  const section = sections.get(key);
  return section ? section.isActive : true;
}
function safeJson(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
