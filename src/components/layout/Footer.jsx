import Link from "next/link";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { SITE } from "@/lib/constants";
import { IconFacebook, IconInstagram, IconYoutube } from "@/components/layout/Icons";

/**
 * Dawn's footer: a row of blocks (link lists and brand information), then the
 * newsletter and social icons, then the copyright line with the policy links.
 */
export function Footer({ shop, company, support }) {
  const policies = support.filter((i) => /privacy|terms|returns|shipping/i.test(i.label));
  return (
    <footer className="dawn-bg-green mt-[2.25rem]">
      <div className="page-width pb-6 pt-[2.25rem] md:pt-[3.375rem]">
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          <FooterBlock title="Shop" items={shop} />
          <FooterBlock title="Company" items={company} />
          <FooterBlock title="Support" items={support} />

          <div>
            <h2 className="h4 mb-5 text-[1.125rem]">{SITE.legalName}</h2>
            <div className="text-[0.875rem] leading-relaxed">
              <p>
                {SITE.legalName} has worked with moringa growers around Madurai
                for more than twenty years. Leaf, pod, flower, seed and gum — one
                tree, grown and processed close to where it stands.
              </p>
              <address className="mt-4 not-italic">
                {SITE.address.line1}, {SITE.address.line2}
                <br />
                {SITE.address.city}, {SITE.address.state} {SITE.address.postalCode}
              </address>
              <p className="mt-4">
                <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="hover:underline">
                  {SITE.phone}
                </a>
                {SITE.mobile ? (
                  <>
                    <br />
                    <a href={`tel:${SITE.mobile.replace(/\s/g, "")}`} className="hover:underline">
                      {SITE.mobile}
                    </a>
                  </>
                ) : null}
                <br />
                <span>{SITE.phoneHours}</span>
                <br />
                <a href={`mailto:${SITE.email}`} className="hover:underline">
                  {SITE.email}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="w-full max-w-[22.5rem]">
            <h2 className="h4 mb-2 text-[1.125rem]">Field notes from the tree.</h2>
            <p className="mb-4 text-[0.875rem]">
              Harvest updates, growing notes and the occasional recipe. Roughly
              once a month, never more.
            </p>
            <NewsletterForm source="footer" />
          </div>

          <ul className="-ml-3 flex items-center md:ml-0" aria-label="Social">
            {[
              [SITE.social.facebook, "Facebook", IconFacebook],
              [SITE.social.instagram, "Instagram", IconInstagram],
              [SITE.social.youtube, "YouTube", IconYoutube],
            ].map(([href, label, Icon]) =>
              href ? (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="header__icon"
                  >
                    <Icon size={18} />
                  </a>
                </li>
              ) : null,
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="page-width flex flex-col items-center gap-3 py-6 text-center text-[0.6875rem] tracking-[0.0375rem] md:flex-row md:justify-between md:text-left">
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>
              © {new Date().getFullYear()}, {SITE.legalName}
            </span>
            {policies.map((p) => (
              <Link key={p.id} href={p.href} className="hover:underline">
                {p.label}
              </Link>
            ))}
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>
              Payments secured by <span className="text-white">Razorpay</span>
            </span>
            <span>
              Crafted by{" "}
              <a
                href="https://lumiodigital.store"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                Lumio Digital
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterBlock({ title, items }) {
  if (!items.length) return null;
  return (
    <nav aria-label={title}>
      <h2 className="h4 mb-5 text-[1.125rem]">{title}</h2>
      <ul className="grid gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="text-[0.875rem] tracking-[0.0375rem] hover:text-white hover:underline hover:underline-offset-[0.3rem]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
