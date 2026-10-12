/**
 * The storefront's icon set, drawn after Dawn's: thin, square-capped outlines
 * at 20px, inheriting the text colour.
 */
function Svg({ size = 20, className, children, viewBox = "0 0 20 20", ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      aria-hidden
      focusable="false"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconSearch(props) {
  return (
    <Svg {...props}>
      <circle cx="8.6" cy="8.6" r="6.1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M13.1 13.1 18 18" stroke="currentColor" strokeWidth="1.3" />
    </Svg>
  );
}

export function IconAccount(props) {
  return (
    <Svg {...props}>
      <circle cx="10" cy="6.2" r="3.7" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.6 18.4c.5-4 3.6-6.6 7.4-6.6s6.9 2.6 7.4 6.6" stroke="currentColor" strokeWidth="1.2" />
    </Svg>
  );
}

export function IconCart(props) {
  return (
    <Svg {...props}>
      <path d="M3.2 6.4h13.6l-1.1 11.4H4.3L3.2 6.4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6.9 6.4V5.3a3.1 3.1 0 0 1 6.2 0v1.1" stroke="currentColor" strokeWidth="1.2" />
    </Svg>
  );
}

export function IconHamburger(props) {
  return (
    <Svg {...props}>
      <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.2" />
    </Svg>
  );
}

export function IconClose(props) {
  return (
    <Svg {...props}>
      <path d="M4 4l12 12M16 4 4 16" stroke="currentColor" strokeWidth="1.2" />
    </Svg>
  );
}

export function IconCaret({ size = 10, ...props }) {
  return (
    <Svg size={size} viewBox="0 0 10 6" {...props}>
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.2" />
    </Svg>
  );
}

export function IconArrow({ size = 14, ...props }) {
  return (
    <Svg size={size} viewBox="0 0 14 10" {...props}>
      <path d="M0 5h12.5M8.5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
    </Svg>
  );
}

export function IconChevronRight({ size = 12, ...props }) {
  return (
    <Svg size={size} viewBox="0 0 6 10" {...props}>
      <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
    </Svg>
  );
}

export function IconMinus({ size = 10, ...props }) {
  return (
    <Svg size={size} viewBox="0 0 10 2" {...props}>
      <path d="M0 1h10" stroke="currentColor" strokeWidth="1.2" />
    </Svg>
  );
}

export function IconPlus({ size = 10, ...props }) {
  return (
    <Svg size={size} viewBox="0 0 10 10" {...props}>
      <path d="M0 5h10M5 0v10" stroke="currentColor" strokeWidth="1.2" />
    </Svg>
  );
}

export function IconTrash({ size = 16, ...props }) {
  return (
    <Svg size={size} viewBox="0 0 16 16" {...props}>
      <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4M6.6 6.5v4.5M9.4 6.5v4.5" stroke="currentColor" strokeWidth="1.1" />
    </Svg>
  );
}

export function IconShare({ size = 14, ...props }) {
  return (
    <Svg size={size} viewBox="0 0 14 16" {...props}>
      <path d="M7 1v9.5M3.5 4.5 7 1l3.5 3.5M1.5 8v6.5h11V8" stroke="currentColor" strokeWidth="1.1" />
    </Svg>
  );
}

export function IconInstagram(props) {
  return (
    <Svg {...props}>
      <rect x="2" y="2" width="16" height="16" rx="4.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="14.8" cy="5.2" r="1" fill="currentColor" />
    </Svg>
  );
}

export function IconFacebook(props) {
  return (
    <Svg {...props}>
      <path
        d="M18 10.05A8 8 0 1 0 8.75 17.95v-5.6H6.72v-2.3h2.03V8.29c0-2 1.2-3.11 3.02-3.11.88 0 1.8.16 1.8.16v1.97h-1.01c-1 0-1.31.62-1.31 1.25v1.5h2.22l-.35 2.3h-1.87v5.6A8 8 0 0 0 18 10.04Z"
        fill="currentColor"
      />
    </Svg>
  );
}

export function IconYoutube(props) {
  return (
    <Svg {...props}>
      <path
        d="M18.6 6.1a2.2 2.2 0 0 0-1.5-1.5C15.7 4.2 10 4.2 10 4.2s-5.7 0-7.1.4A2.2 2.2 0 0 0 1.4 6.1 23 23 0 0 0 1 10a23 23 0 0 0 .4 3.9 2.2 2.2 0 0 0 1.5 1.5c1.4.4 7.1.4 7.1.4s5.7 0 7.1-.4a2.2 2.2 0 0 0 1.5-1.5c.3-1.3.4-2.6.4-3.9s-.1-2.6-.4-3.9ZM8.2 12.4V7.6L12.9 10l-4.7 2.4Z"
        fill="currentColor"
      />
    </Svg>
  );
}

/** Product-page collapsible row icons (Dawn's "icon with text" set). */
export function IconRow({ name, size = 20 }) {
  const paths = {
    leaf: "M10 18V8M10 13c0-4.4-3.3-7.3-7.7-7.6C2.7 10.4 6 13 10 13Zm0-3c0-4.4 3.3-7.3 7.7-7.6C17.3 7.4 14 10 10 10Z",
    truck: "M1.5 5h10v8h-10zM11.5 7.5h3.8L18.5 11v2h-7M5 15.6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm9.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
    box: "M3 6l7-3 7 3v8l-7 3-7-3V6Zm0 0 7 3 7-3M10 9v8",
    question: "M7.6 7.4a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.8M10 14.6v.4M10 18.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z",
    list: "M6.5 5h11M6.5 10h11M6.5 15h11M2.5 5h1M2.5 10h1M2.5 15h1",
    pin: "M10 18s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10Zm0-7.6a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z",
    lock: "M5.5 9V6.5a4.5 4.5 0 0 1 9 0V9M3.5 9h13v9h-13zM10 12.5v2",
    star: "m10 2 2.4 5 5.4.7-4 3.7 1 5.4L10 14.2l-4.8 2.6 1-5.4-4-3.7 5.4-.7L10 2Z",
  };
  return (
    <Svg size={size}>
      <path d={paths[name] ?? paths.leaf} stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </Svg>
  );
}
