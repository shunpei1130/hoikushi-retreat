const ICON_PATHS = {
  ai: `
    <path d="M12 3.5 13.6 8l4.4 1.6-4.4 1.6L12 15.6l-1.6-4.4L6 9.6 10.4 8 12 3.5Z"/>
    <path d="M18.6 15.2l.7 1.8 1.7.7-1.7.7-.7 1.8-.7-1.8-1.7-.7 1.7-.7.7-1.8Z"/>
  `,
  chat: `
    <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-3-.5L5 20l1.4-3.5A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z"/>
    <path d="M8.5 11.5h7M8.5 14.5h4.5"/>
  `,
  phone: `
    <path d="M8.1 4.6 10 8.2c.3.6.1 1.3-.4 1.7l-1.2.9a10.4 10.4 0 0 0 5.1 5.1l.9-1.2c.4-.5 1.1-.7 1.7-.4l3.6 1.9c.7.4 1 1.3.7 2l-.7 2a2 2 0 0 1-2 1.2C10.8 20.6 3.4 13.2 2.6 6.3a2 2 0 0 1 1.2-2l2-.7c.8-.3 1.7 0 2.1.7Z"/>
  `,
  arrowRight: `<path d="M4 12h15M13 6l6 6-6 6"/>`,
  arrowDown: `<path d="M12 4v15M6 13l6 6 6-6"/>`,
  check: `<path d="m5 12.5 4.2 4.2L19 6.8"/>`,
  info: `
    <circle cx="12" cy="12" r="8.5"/>
    <path d="M12 10.5v5M12 7.5h.01"/>
  `,
  clock: `
    <circle cx="12" cy="12" r="8.5"/>
    <path d="M12 7.5V12l3 2"/>
  `,
  yen: `
    <path d="m7 5 5 6 5-6M12 11v8M8 13h8M8 16.5h8"/>
  `,
  building: `
    <path d="M4 20.5h16M6 20.5V7l6-3 6 3v13.5M9.5 9.5h1M13.5 9.5h1M9.5 13h1M13.5 13h1M10.5 20.5v-3.5h3v3.5"/>
  `,
  users: `
    <circle cx="9" cy="8.5" r="3"/>
    <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0M15.5 5.8a3 3 0 0 1 0 5.4M17 14.2a5.5 5.5 0 0 1 3.5 5.3"/>
  `,
  document: `
    <path d="M6.5 3.5h7l4 4v13h-11v-17Z"/>
    <path d="M13.5 3.5v4h4M9.5 12h5M9.5 15h5"/>
  `,
  shield: `
    <path d="M12 3.5 19 6v5.5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-2.5Z"/>
    <path d="m8.8 12 2.2 2.2 4.2-4.4"/>
  `,
  leaf: `
    <path d="M12 20.5v-7.8M12 13c-3.8 0-6.2-2.4-6.2-6.2C9.6 6.8 12 9.2 12 13ZM12 13c0-4.2 2.7-6.8 6.8-6.8 0 4.1-2.6 6.8-6.8 6.8Z"/>
  `,
  external: `<path d="M14 4h6v6M20 4l-8.5 8.5M18 14v5.5H4.5V6H10"/>`,
  spark: `<path d="M12 2.5 13.2 9l6.3 1.2-6.3 1.2L12 18l-1.2-6.6L4.5 10.2 10.8 9 12 2.5Z"/>`,
};

export function icon(name, className = "") {
  const paths = ICON_PATHS[name];
  if (!paths) throw new Error(`Unknown icon: ${name}`);
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}

export function brandMark(className = "") {
  const classes = ["brand-mark", className].filter(Boolean).join(" ");
  return `<img class="${classes}" src="/assets/favicon-96.png" alt="" width="40" height="40" decoding="async">`;
}
