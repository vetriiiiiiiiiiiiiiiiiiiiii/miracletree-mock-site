import Link from "next/link";

/** Dawn's 404 template: caption, heading, a line of text, one button. */
export default function StorefrontNotFound() {
  return (
    <div className="page-width py-16 text-center md:py-24">
      <p className="caption-uc">404</p>
      <h1 className="h0 mt-4">This path didn&rsquo;t grow.</h1>
      <p className="mx-auto mt-4 max-w-[36rem]">
        The page you were looking for isn&rsquo;t here. It may have moved or the
        link may have a typo in it.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="button">
          Explore the collection
        </Link>
        <Link href="/" className="button button--secondary">
          Return home
        </Link>
      </div>
      <nav aria-label="Suggested pages" className="mt-12">
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[0.875rem]">
          {[
            { href: "/shop", label: "All products" },
            { href: "/moringa", label: "Discover moringa" },
            { href: "/journal", label: "The journal" },
            { href: "/faq", label: "FAQ" },
            { href: "/contact", label: "Contact" },
          ].map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="dawn-link">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
