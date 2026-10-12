import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconArrow, IconCaret } from "@/components/layout/Icons";
import { Stars } from "@/components/product/ProductCard";

/**
 * Dawn's homepage sections, as server components. Each mirrors a section of
 * the same name in Shopify's Dawn theme; the words inside them come from the
 * page, not from here.
 */

/** A section's colour scheme: true means the default tint (mint). */
const scheme = (background) =>
  background ? `dawn-bg-${background === true ? "mint" : background}` : null;

/** Category tiles cycle through the colours of the Miracle Tree mark. */
const TILE_TINTS = ["var(--tint-mint)", "var(--tint-blush)", "var(--tint-cream)", "var(--tint-sky)", "var(--tint-lilac)"];

const unoptimized = (url) =>
  typeof url === "string" ? url.startsWith("/uploads/") : undefined;

/* ----------------------------------------------------------- image banner */

export function ImageBanner({ image, alt, caption, title, subtitle, buttons = [] }) {
  return (
    <section className="relative flex min-h-[25rem] items-center md:min-h-[35rem]">
      <Image src={image} alt={alt} fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-[rgba(11,61,42,0.55)]" aria-hidden />
      <div className="page-width relative z-[1] w-full py-16 text-center">
        <div className="mx-auto max-w-[44rem] text-white">
          {caption ? <p className="caption-uc text-white">{caption}</p> : null}
          <h1 className="h0 mt-3 !text-white">{title}</h1>
          {subtitle ? <p className="mx-auto mt-4 max-w-[36rem] text-[1rem] text-white">{subtitle}</p> : null}
          {buttons.length ? (
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {buttons.map((b, i) => (
                <Link
                  key={b.href}
                  href={b.href}
                  className={cn("button", i === 0 ? "button--white-solid" : "button--white")}
                >
                  {b.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- section header */

export function SectionTitle({ title, subtitle, align = "left", className }) {
  return (
    <div className={cn("mb-6 md:mb-8", align === "center" && "text-center", className)}>
      <h2 className="h1">{title}</h2>
      {subtitle ? (
        <p className={cn("mt-3 max-w-[45rem]", align === "center" && "mx-auto")}>{subtitle}</p>
      ) : null}
    </div>
  );
}

export function ViewAll({ href, label }) {
  return (
    <div className="mt-8 text-center md:mt-10">
      <Link href={href} className="button">
        {label}
      </Link>
    </div>
  );
}

/* ----------------------------------------------------------- multicolumn */

export function Multicolumn({ title, subtitle, columns, cols = 3, background = false, children, footer }) {
  const grid = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };
  return (
    <section className={cn("dawn-section", background && `${scheme(background)} my-9`)}>
      <div className={cn("page-width", background && "py-6 md:py-9")}>
        {title ? <SectionTitle title={title} subtitle={subtitle} /> : null}
        {children}
        {columns?.length ? (
          <ul className={cn("grid gap-x-6 gap-y-10", grid[cols])}>
            {columns.map((c) => (
              <li key={c.key}>
                {c.eyebrow ? <p className="caption-uc mb-2 text-[rgb(var(--accent))]">{c.eyebrow}</p> : null}
                {c.figure ? (
                  <p className="h0 !leading-none !text-[rgb(var(--accent))]">
                    {c.figure}
                    {c.unit ? <span className="ml-2 text-[1rem] tracking-normal text-[rgba(18,18,18,0.75)]">{c.unit}</span> : null}
                  </p>
                ) : null}
                {c.title ? <h3 className={cn("h3", c.figure && "mt-4")}>{c.title}</h3> : null}
                {c.meta ? <p className="mt-1 text-[0.8125rem]">{c.meta}</p> : null}
                {c.body ? <p className="mt-2 text-[0.9375rem]">{c.body}</p> : null}
                {c.link ? (
                  <Link href={c.link.href} className="mt-3 inline-flex items-center gap-2 text-[0.9375rem] text-[rgb(var(--link))] hover:underline hover:underline-offset-[0.3rem]">
                    {c.link.label}
                    <IconArrow />
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {footer}
      </div>
    </section>
  );
}

/* ------------------------------------------------------- image with text */

export function ImageWithText({ image, alt, reverse = false, caption, title, children, buttons = [], background = false }) {
  return (
    <section className="dawn-section">
      <div className="page-width">
        <div className={cn("grid", image && "md:grid-cols-2", background ? scheme(background) : "border border-[rgba(18,18,18,0.08)]")}>
          {/* Without a photograph the text block takes the full width, rather
              than sitting beside an empty panel. */}
          {image ? (
            <div className={cn("relative aspect-[4/3] md:aspect-auto md:min-h-[30rem]", reverse && "md:order-2")}>
              <Image src={image} alt={alt} fill sizes="(min-width: 750px) 50vw, 100vw" className="object-cover" unoptimized={unoptimized(image)} />
            </div>
          ) : null}
          <div className={cn("flex flex-col justify-center px-6 py-10 md:px-14 md:py-16", !image && "md:mx-auto md:max-w-[50rem]")}>
            {caption ? <p className="caption-uc text-[rgb(var(--accent))]">{caption}</p> : null}
            {title ? <h2 className="h1 mt-2">{title}</h2> : null}
            <div className="mt-4 text-[0.9375rem]">{children}</div>
            {buttons.length ? (
              <div className="mt-8 flex flex-wrap gap-3">
                {buttons.map((b, i) => (
                  <Link key={b.href} href={b.href} className={cn("button", i > 0 && "button--secondary")}>
                    {b.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- collection list */

export function CollectionList({ title, collections }) {
  if (!collections.length) return null;
  return (
    <section className="dawn-section">
      <div className="page-width">
        <SectionTitle title={title} />
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
          {collections.map((c, i) => (
            <li key={c.slug}>
              <Link href={`/shop/${c.slug}`} className="card-product group block">
                <div
                  className="card-product__media relative aspect-square overflow-hidden"
                  style={{ background: TILE_TINTS[i % TILE_TINTS.length] }}
                >
                  {c.image ? (
                    <Image src={c.image} alt="" fill sizes="(min-width: 990px) 240px, 50vw" className="card-product__img--primary object-contain p-4 mix-blend-multiply" unoptimized={unoptimized(c.image)} />
                  ) : null}
                </div>
                <h3 className="card-product__heading mt-3 flex items-center gap-2 text-[1rem]">
                  <span className="text-[rgb(18,18,18)] group-hover:underline group-hover:decoration-2 group-hover:underline-offset-[0.3rem]">
                    {c.name}
                  </span>
                  <IconArrow className="text-[rgb(var(--accent))] transition-transform group-hover:translate-x-1" />
                </h3>
                <p className="text-[0.8125rem]">{c.count} {c.count === 1 ? "product" : "products"}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- logo list */

export function LogoList({ logos }) {
  return (
    <ul className="mt-10 grid grid-cols-3 items-center gap-6 md:grid-cols-6">
      {logos.map((logo) => (
        <li key={logo.src} className="flex justify-center">
          <Image src={logo.src} alt={logo.alt} width={120} height={120} className="h-20 w-auto object-contain md:h-24" />
        </li>
      ))}
    </ul>
  );
}

/* ----------------------------------------------------------- testimonials */

export function Testimonials({ title, subtitle, items, emptyText, emptyLink }) {
  return (
    <section className="dawn-section">
      <div className="page-width">
        <SectionTitle title={title} subtitle={subtitle} align="center" />
        {items.length === 0 ? (
          <div className="text-center">
            <p className="mx-auto max-w-[36rem]">{emptyText}</p>
            <Link href={emptyLink.href} className="button button--secondary mt-6">
              {emptyLink.label}
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col p-6"
                style={{ background: TILE_TINTS[items.indexOf(item) % TILE_TINTS.length] }}
              >
                {item.rating ? <Stars value={item.rating} size={14} /> : null}
                <blockquote className="mt-3 flex-1 text-[0.9375rem]">&ldquo;{item.body}&rdquo;</blockquote>
                <p className="mt-4 text-[0.875rem] text-[rgb(18,18,18)]">
                  {item.authorName}
                  {item.location ? <span className="text-[rgba(18,18,18,0.75)]"> · {item.location}</span> : null}
                </p>
                {item.isVerified ? <p className="caption-uc mt-1">Verified</p> : null}
                {item.product ? (
                  <Link href={`/product/${item.product.slug}`} className="dawn-link mt-2 text-[0.8125rem]">
                    on {item.product.name}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- blog posts */

export function BlogPosts({ title, subtitle, articles, cta }) {
  if (!articles.length) return null;
  return (
    <section className="dawn-section">
      <div className="page-width">
        <SectionTitle title={title} subtitle={subtitle} />
        <ul className="grid gap-x-4 gap-y-10 md:grid-cols-3">
          {articles.map((a) => (
            <li key={a.id}>
              <Link href={`/journal/${a.slug}`} className="card-product group block">
                {a.heroImageUrl ? (
                  <div className="card-product__media relative mb-4 aspect-[3/2] overflow-hidden">
                    <Image src={a.heroImageUrl} alt="" fill sizes="(min-width: 750px) 33vw, 100vw" className="card-product__img--primary object-cover" unoptimized={unoptimized(a.heroImageUrl)} />
                  </div>
                ) : null}
                <h3 className="card-product__heading h3">
                  <span className="group-hover:underline group-hover:decoration-2 group-hover:underline-offset-[0.3rem]">{a.title}</span>
                </h3>
                {a.publishedAt ? (
                  <p className="caption-uc mt-2 text-[rgb(var(--accent))]">
                    {new Date(a.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                ) : null}
                {a.excerpt ? <p className="mt-2 line-clamp-3 text-[0.9375rem]">{a.excerpt}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
        {cta ? <ViewAll href={cta.href} label={cta.label} /> : null}
      </div>
    </section>
  );
}

/* --------------------------------------------------- collapsible content */

export function CollapsibleContent({ title, subtitle, rows, link }) {
  if (!rows.length) return null;
  return (
    <section className="dawn-section">
      <div className="page-width">
        <div className="mx-auto max-w-[45rem]">
          <SectionTitle title={title} subtitle={subtitle} align="center" />
          {rows.map((row, i) => (
            <details key={row.id} className={cn("accordion", i === rows.length - 1 && "accordion--last")}>
              <summary className="text-[1rem]">
                {row.question}
                <IconCaret className="accordion__caret" />
              </summary>
              <div className="accordion__content text-[0.9375rem]">
                <p>{row.answer}</p>
              </div>
            </details>
          ))}
          {link ? (
            <p className="mt-6 text-center">
              <Link href={link.href} className="dawn-link">
                {link.label}
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- rich text */

export function RichText({ caption, title, subtitle, buttons = [], background = false }) {
  return (
    <section className={cn("dawn-section", background && `${scheme(background)} my-9`)}>
      <div className="page-width py-8 text-center md:py-14">
        <div className="mx-auto max-w-[45rem]">
          {caption ? <p className="caption-uc">{caption}</p> : null}
          <h2 className="h1 mt-2">{title}</h2>
          {subtitle ? <p className="mt-4">{subtitle}</p> : null}
          {buttons.length ? (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {buttons.map((b, i) => (
                <Link key={b.href} href={b.href} className={cn("button", i > 0 && "button--secondary")}>
                  {b.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
