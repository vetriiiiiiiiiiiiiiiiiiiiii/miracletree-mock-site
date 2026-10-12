"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/Drawer";
import { IconCaret, IconClose } from "@/components/layout/Icons";
const SORTS = [
  { label: "Featured", value: "featured" },
  { label: "Price: low to high", value: "price-asc" },
  { label: "Price: high to low", value: "price-desc" },
  { label: "Newest", value: "newest" },
  { label: "Top rated", value: "rating" },
  { label: "Name A–Z", value: "name" },
];
const PRICE_BANDS = [
  { label: "Under ₹250", value: "0-250" },
  { label: "₹250 – ₹500", value: "250-500" },
  { label: "₹500 – ₹1000", value: "500-1000" },
  { label: "Over ₹1000", value: "1000-" },
];
/**
 * Filters live in the URL rather than in component state, so a filtered view is
 * shareable, survives a refresh, works with the back button, and can be crawled.
 */
function useFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const setParam = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
      // Any filter change resets pagination — page 4 of a new result set is
      // almost never what the shopper meant.
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );
  const clearAll = useCallback(() => {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    startTransition(() =>
      router.push(`${pathname}?${params.toString()}`, { scroll: false }),
    );
  }, [pathname, router, searchParams]);
  return { searchParams, setParam, clearAll, pending };
}
/** Builds the facet list once, so the dropdowns and the drawer agree. */
function useFacets(groups) {
  const { searchParams, setParam } = useFilterNavigation();
  const activePrice = (() => {
    const min = searchParams.get("min");
    const max = searchParams.get("max");
    if (!min && !max) return null;
    return `${min ?? "0"}-${max ?? ""}`;
  })();
  const facets = [
    {
      key: "availability",
      title: "Availability",
      options: [
        { label: "In stock only", value: "in-stock" },
        { label: "On offer", value: "offers" },
      ],
      isChecked: (v) =>
        v === "in-stock"
          ? searchParams.get("availability") === "in-stock"
          : Boolean(searchParams.get("offers")),
      toggle: (v, on) =>
        v === "in-stock"
          ? setParam("availability", on ? "in-stock" : null)
          : setParam("offers", on ? "1" : null),
      reset: () => {
        setParam("availability", null);
        setParam("offers", null);
      },
    },
    {
      key: "price",
      title: "Price",
      options: PRICE_BANDS,
      isChecked: (v) => activePrice === v,
      toggle: (v, on) => {
        if (!on) {
          setParam("min", null);
          setParam("max", null);
          return;
        }
        const [min, max] = v.split("-");
        setParam("min", min && min !== "0" ? min : null);
        setParam("max", max || null);
      },
      reset: () => {
        setParam("min", null);
        setParam("max", null);
      },
    },
    ...[
      ["category", "Category", groups.categories],
      ["type", "Product type", groups.types],
      ["ingredient", "Ingredient", groups.ingredients],
    ]
      .filter(([, , options]) => options.length)
      .map(([key, title, options]) => ({
        key,
        title,
        options,
        isChecked: (v) => searchParams.get(key) === v,
        toggle: (v, on) => setParam(key, on ? v : null),
        reset: () => setParam(key, null),
      })),
  ];
  return facets;
}

export function ShopToolbar({ total, groups, activeCount }) {
  const { searchParams, setParam, clearAll } = useFilterNavigation();
  const facets = useFacets(groups);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sort = searchParams.get("sort") ?? "featured";
  const count = `${total} ${total === 1 ? "product" : "products"}`;

  return (
    <>
      {/* Desktop: Dawn's horizontal facets */}
      <div className="hidden items-start justify-between gap-6 md:flex">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-[0.875rem]">Filter:</span>
          {facets.map((facet) => (
            <FacetDropdown key={facet.key} facet={facet} />
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-6">
          <label className="flex items-center gap-3 text-[0.875rem]">
            Sort by:
            <span className="select">
              <select
                value={sort}
                onChange={(e) => setParam("sort", e.target.value)}
                className="select__select !h-auto !py-1 !shadow-none"
              >
                {SORTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <IconCaret className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </span>
          </label>
          <p className="text-[0.875rem]" aria-live="polite">
            {count}
          </p>
        </div>
      </div>

      {/* Phones: "Filter and sort" */}
      <div className="flex items-center justify-between md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 py-2 text-[0.875rem] text-[rgb(18,18,18)]"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M2 5h10M15 5h3M2 15h3M8 15h10M12 3v4M5 13v4" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Filter and sort
          {activeCount > 0 ? <span>({activeCount})</span> : null}
        </button>
        <p className="text-[0.875rem]">{count}</p>
      </div>

      {activeCount > 0 ? (
        <ActiveChips groups={groups} onClear={clearAll} setParam={setParam} searchParams={searchParams} />
      ) : null}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filter and sort" side="right">
        <div className="border-b border-[rgba(18,18,18,0.08)] px-6 py-4 text-center">
          <h2 className="text-[1rem] text-[rgb(18,18,18)]">Filter and sort</h2>
          <p className="text-[0.8125rem]">{count}</p>
          <button
            type="button"
            className="header__icon absolute right-3 top-3"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {facets.map((facet) => (
            <details key={facet.key} className="border-b border-[rgba(18,18,18,0.08)]">
              <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 text-[0.9375rem] text-[rgb(18,18,18)]">
                {facet.title}
                <IconCaret />
              </summary>
              <div className="px-6 pb-4">
                <FacetList facet={facet} />
              </div>
            </details>
          ))}
          <div className="flex items-center justify-between px-6 py-4">
            <label htmlFor="mobile-sort" className="text-[0.9375rem] text-[rgb(18,18,18)]">
              Sort by
            </label>
            <span className="select">
              <select
                id="mobile-sort"
                value={sort}
                onChange={(e) => setParam("sort", e.target.value)}
                className="select__select"
              >
                {SORTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <IconCaret className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-[rgba(18,18,18,0.08)] p-4">
          <button type="button" className="button button--secondary !min-w-0" onClick={clearAll}>
            Remove all
          </button>
          <button type="button" className="button !min-w-0" onClick={() => setDrawerOpen(false)}>
            Apply
          </button>
        </div>
      </Drawer>
    </>
  );
}

function FacetDropdown({ facet }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = facet.options.filter((o) => facet.isChecked(o.value)).length;
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 py-2 text-[0.875rem] text-[rgba(18,18,18,0.75)] hover:text-[rgb(18,18,18)] hover:underline hover:underline-offset-[0.3rem]"
      >
        {facet.title}
        {selected ? ` (${selected})` : ""}
        <IconCaret className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-1 w-[21.875rem] border border-[rgba(18,18,18,0.2)] bg-white">
          <div className="flex items-center justify-between border-b border-[rgba(18,18,18,0.2)] px-5 py-3.5 text-[0.875rem]">
            <span>{selected} selected</span>
            <button type="button" onClick={facet.reset} className="dawn-link">
              Reset
            </button>
          </div>
          <div className="max-h-[22rem] overflow-y-auto px-5 py-3">
            <FacetList facet={facet} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FacetList({ facet }) {
  return (
    <ul className="grid gap-1">
      {facet.options.map((option) => {
        const checked = facet.isChecked(option.value);
        const id = `facet-${facet.key}-${option.value}`;
        return (
          <li key={option.value}>
            <label htmlFor={id} className="flex cursor-pointer items-center gap-3 py-1.5 text-[0.875rem] hover:text-[rgb(18,18,18)]">
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={(e) => facet.toggle(option.value, e.target.checked)}
                className="h-4 w-4 shrink-0 accent-[rgb(18,18,18)]"
              />
              <span>
                {option.label}
                {option.count !== undefined ? ` (${option.count})` : ""}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveChips({ groups, searchParams, setParam, onClear }) {
  const chips = [];
  const label = (options, value) =>
    options.find((o) => o.value === value)?.label ?? value;
  for (const [key, options] of [
    ["category", groups.categories],
    ["type", groups.types],
    ["ingredient", groups.ingredients],
  ]) {
    const value = searchParams.get(key);
    if (value) chips.push({ key, label: label(options, value) });
  }
  if (searchParams.get("availability") === "in-stock") {
    chips.push({ key: "availability", label: "In stock" });
  }
  if (searchParams.get("offers")) chips.push({ key: "offers", label: "On offer" });
  if (searchParams.get("min") || searchParams.get("max")) {
    const min = searchParams.get("min");
    const max = searchParams.get("max");
    chips.push({
      key: "price",
      label: min && max ? `Rs. ${min}–Rs. ${max}` : min ? `Over Rs. ${min}` : `Under Rs. ${max}`,
    });
  }
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 pt-4">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => {
            if (chip.key === "price") {
              setParam("min", null);
              setParam("max", null);
            } else {
              setParam(chip.key, null);
            }
          }}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(18,18,18,0.55)] px-4 py-1.5 text-[0.8125rem] text-[rgb(18,18,18)] hover:border-[rgb(18,18,18)]"
        >
          {chip.label}
          <IconClose size={12} />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      <button type="button" onClick={onClear} className="dawn-link px-2 text-[0.8125rem]">
        Remove all
      </button>
    </div>
  );
}

/** Kept for the vertical sidebar export; Dawn's default layout does not use it. */
export function ShopFilters({ groups }) {
  const facets = useFacets(groups);
  return (
    <div className="grid gap-6">
      {facets.map((facet) => (
        <fieldset key={facet.key}>
          <legend className="mb-2 text-[0.9375rem] text-[rgb(18,18,18)]">{facet.title}</legend>
          <FacetList facet={facet} />
        </fieldset>
      ))}
    </div>
  );
}
