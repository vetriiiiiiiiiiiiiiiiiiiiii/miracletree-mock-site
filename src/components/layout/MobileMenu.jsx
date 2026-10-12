"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { SITE } from "@/lib/constants";
import {
  IconAccount,
  IconArrow,
  IconChevronRight,
  IconClose,
  IconFacebook,
  IconInstagram,
  IconYoutube,
} from "@/components/layout/Icons";

/**
 * Dawn's menu drawer: slides in from the left, top-level links in a large
 * size, nested menus open as a second panel with a back row, and the account
 * link and social icons sit in a tinted strip at the bottom.
 */
export function MobileMenu({ open, onClose, menu, isAuthenticated }) {
  const [submenu, setSubmenu] = useState(null);
  useEffect(() => {
    if (!open) setSubmenu(null);
  }, [open]);

  const active = submenu ? menu.find((m) => m.id === submenu) : null;

  return (
    <Drawer open={open} onClose={onClose} title="Menu" side="left" className="max-w-[100vw] sm:max-w-[22.5rem]">
      <div className="flex items-center justify-end px-3 py-2.5">
        <button type="button" onClick={onClose} aria-label="Close menu" className="header__icon">
          <IconClose />
        </button>
      </div>

      <nav aria-label="Menu" className="relative flex-1 overflow-y-auto overflow-x-hidden">
        {active ? (
          <div>
            <button
              type="button"
              onClick={() => setSubmenu(null)}
              className="flex w-full items-center gap-3 bg-[rgba(18,18,18,0.04)] px-8 py-3 text-left text-[1.125rem] text-[rgb(18,18,18)]"
            >
              <IconArrow className="rotate-180" />
              {active.label}
            </button>
            <ul className="py-4">
              {active.children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={child.href}
                    onClick={onClose}
                    className="block px-8 py-[0.6875rem] text-[1.125rem] text-[rgb(18,18,18)] hover:bg-[rgba(18,18,18,0.04)]"
                  >
                    {child.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="py-4">
            {menu.map((item) => (
              <li key={item.id}>
                {item.children ? (
                  <button
                    type="button"
                    onClick={() => setSubmenu(item.id)}
                    className="flex w-full items-center justify-between px-8 py-[0.6875rem] text-left text-[1.125rem] text-[rgb(18,18,18)] hover:bg-[rgba(18,18,18,0.04)]"
                  >
                    {item.label}
                    <IconChevronRight />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="block px-8 py-[0.6875rem] text-[1.125rem] text-[rgb(18,18,18)] hover:bg-[rgba(18,18,18,0.04)]"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </nav>

      <div className="bg-[rgba(18,18,18,0.03)] px-8 py-6">
        <Link
          href={isAuthenticated ? "/account" : "/login"}
          onClick={onClose}
          className="-ml-1 inline-flex items-center gap-3 py-1 text-[0.875rem] text-[rgb(18,18,18)]"
        >
          <IconAccount />
          {isAuthenticated ? "Account" : "Log in"}
        </Link>
        <ul className="-ml-3 mt-4 flex items-center">
          {[
            [SITE.social.facebook, "Facebook", IconFacebook],
            [SITE.social.instagram, "Instagram", IconInstagram],
            [SITE.social.youtube, "YouTube", IconYoutube],
          ].map(([href, label, Icon]) =>
            href ? (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="header__icon">
                  <Icon />
                </a>
              </li>
            ) : null,
          )}
        </ul>
      </div>
    </Drawer>
  );
}
