"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart/CartProvider";
import { Logo } from "@/components/layout/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { IconAccount, IconCart, IconCaret, IconHamburger, IconSearch } from "@/components/layout/Icons";

/**
 * Dawn's header: announcement bar, then logo on the left with the menu beside
 * it and search / account / cart on the right. On a phone it becomes
 * hamburger · centred logo · search and cart. Sticky "on scroll up", as in
 * Dawn's default setting: it slides away while reading down the page and
 * returns the moment the shopper scrolls back up.
 */
export function Header({
  items,
  companyItems,
  categories,
  isAuthenticated,
  announcement,
}) {
  const pathname = usePathname();
  const { cart, open } = useCart();
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 200 && y > lastY.current);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // The Shop link carries the categories as its dropdown, the way a Shopify
  // main menu nests collections under "Shop".
  const shopChildren = [
    { id: "all", label: "All products", href: "/shop" },
    ...categories.map((c) => ({
      id: c.slug,
      label: c.name,
      href: `/shop/${c.slug}`,
    })),
  ];
  const menu = items.map((item) =>
    item.href === "/shop" ? { ...item, children: shopChildren } : item,
  );
  if (companyItems.length) {
    menu.push({ id: "company", label: "Company", href: null, children: companyItems });
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[400] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:bg-white focus:px-4 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      {announcement ? (
        <div className="bg-[rgb(var(--brand-magenta))]">
          <p className="page-width py-2.5 text-center text-[0.8125rem] leading-snug tracking-[0.0625rem] text-white">
            {announcement}
          </p>
        </div>
      ) : null}

      <div
        className={cn(
          "sticky top-0 z-[150] border-b border-[rgba(18,18,18,0.08)] bg-white transition-transform duration-150 ease-out",
          hidden && !menuOpen && "-translate-y-full",
        )}
      >
        <header className="page-width grid grid-cols-[1fr_auto_1fr] items-center py-2.5 lg:grid-cols-[auto_1fr_auto] lg:gap-x-4 lg:py-5">
          {/* Phone: hamburger on the left */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="header__icon -ml-3 lg:hidden"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <IconHamburger />
          </button>

          <Link
            href="/"
            aria-label="Miracle Tree — home"
            className="justify-self-center p-[0.4rem] lg:-ml-[0.4rem] lg:justify-self-start"
          >
            <Logo className="h-8 w-auto lg:h-10" priority />
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex flex-wrap items-center">
              {menu.map((item) =>
                item.children ? (
                  <li key={item.id}>
                    <Dropdown item={item} pathname={pathname} />
                  </li>
                ) : (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="header__menu-item"
                      aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    >
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="-mr-3 flex items-center justify-self-end">
            <button
              type="button"
              className="header__icon"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <IconSearch />
            </button>
            <Link
              href={isAuthenticated ? "/account" : "/login"}
              className="header__icon !hidden lg:!inline-flex"
              aria-label={isAuthenticated ? "Account" : "Log in"}
            >
              <IconAccount />
            </Link>
            <button
              type="button"
              onClick={open}
              className="header__icon"
              aria-label={`Cart, ${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"}`}
            >
              <IconCart />
              {cart.itemCount > 0 ? (
                <span className="cart-count-bubble" aria-hidden>
                  {cart.itemCount < 100 ? cart.itemCount : ""}
                </span>
              ) : null}
            </button>
          </div>
        </header>
      </div>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        menu={menu}
        isAuthenticated={isAuthenticated}
      />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function isActive(pathname, href) {
  if (!href) return false;
  const path = href.split(/[?#]/)[0];
  return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
}

/** A Dawn header dropdown: a <details> that also opens on hover. */
function Dropdown({ item, pathname }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = item.children.some((c) => isActive(pathname, c.href));

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onClick = (e) => !ref.current?.contains(e.target) && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="header__menu-item"
        aria-expanded={open}
        aria-current={active ? "page" : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{item.label}</span>
        <IconCaret className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <ul className="absolute left-0 top-full z-50 min-w-[12.5rem] border border-[rgba(18,18,18,0.1)] bg-white py-6">
          {item.children.map((child) => (
            <li key={child.id}>
              <Link
                href={child.href}
                className={cn(
                  "block px-5 py-[0.5625rem] text-[0.875rem] tracking-[0.0375rem] hover:text-[rgb(18,18,18)] hover:underline hover:underline-offset-[0.3rem]",
                  isActive(pathname, child.href)
                    ? "text-[rgb(18,18,18)] underline underline-offset-[0.3rem]"
                    : "text-[rgba(18,18,18,0.75)]",
                )}
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
