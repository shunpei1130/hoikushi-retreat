import { escapeAttr, escapeHtml, safeJsonLd } from "./html.mjs";
import { computeTotal } from "./components.mjs";

const SERVICE_TYPE = "保育士向け退職相談・退職代行";

export function buildJsonLd({ config, page, mode, origin }) {
  const brand = config.brandName;
  const graph = [];
  const pageUrl = origin ? `${origin}${page.path}` : null;
  const pageId = pageUrl ? `${pageUrl}#webpage` : "#webpage";
  const websiteId = origin ? `${origin}/#website` : null;
  const organizationId = origin ? `${origin}/#organization` : null;

  const webpage = {
    "@type": "WebPage",
    "@id": pageId,
    name: page.title,
    description: page.description,
    inLanguage: "ja-JP",
  };
  if (pageUrl) webpage.url = pageUrl;
  if (config.contentUpdatedAt) webpage.dateModified = config.contentUpdatedAt;
  if (websiteId) webpage.isPartOf = { "@id": websiteId };
  graph.push(webpage);

  const hasOrganization =
    origin &&
    config.operator?.legalName &&
    config.operator?.address &&
    config.operator?.responsiblePerson;

  if (origin && websiteId) {
    const website = {
      "@type": "WebSite",
      "@id": websiteId,
      url: `${origin}/`,
      name: brand,
      inLanguage: "ja-JP",
    };
    if (organizationId && hasOrganization) website.publisher = { "@id": organizationId };
    graph.push(website);
  }

  if (hasOrganization) {
    const operator = config.operator;
    const organization = {
      "@type": ["Organization", "WorkersUnion"],
      "@id": organizationId,
      name: brand,
      legalName: operator.legalName,
      url: `${origin}/`,
      address: {
        "@type": "PostalAddress",
        streetAddress: operator.address,
        addressCountry: "JP",
      },
      employee: Array.isArray(config.staff)
        ? config.staff
            .filter((person) => person.approved === true)
            .map((person) => ({
              "@type": "Person",
              name: person.name,
              jobTitle: person.role || "元保育士スタッフ",
              description: person.experience,
            }))
        : undefined,
    };

    const contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["ja"],
    };
    if (operator.contactUrl) contactPoint.url = operator.contactUrl;
    if (operator.hours) contactPoint.hoursAvailable = operator.hours;
    if (config.channels?.phone?.verified === true && config.channels.phone.number) {
      contactPoint.telephone = config.channels.phone.number;
    }
    if (contactPoint.url || contactPoint.hoursAvailable || contactPoint.telephone) {
      organization.contactPoint = contactPoint;
    }
    graph.push(organization);
  }

  const total = computeTotal(config);
  if (origin && hasOrganization && total.amount !== null && !config.pricing?.total?.condition) {
    const service = {
      "@type": "Service",
      "@id": `${origin}/#service`,
      name: brand,
      serviceType: SERVICE_TYPE,
      description: page.description,
      provider: { "@id": organizationId },
      areaServed: { "@type": "Country", name: "日本" },
      audience: { "@type": "Audience", audienceType: "保育士" },
      url: `${origin}/`,
      offers: {
        "@type": "Offer",
        price: String(total.amount),
        priceCurrency: "JPY",
        url: `${origin}/`,
      },
    };
    graph.push(service);
  }

  if (origin && Array.isArray(page.breadcrumbs) && page.breadcrumbs.length > 1) {
    const breadcrumb = {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: page.breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        item: `${origin}${item.path}`,
      })),
    };
    graph.push(breadcrumb);
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function jsonLdScript(jsonLd) {
  return `<script type="application/ld+json">${safeJsonLd(jsonLd)}</script>`;
}

export function buildMeta({ config, page, mode, origin }) {
  const isProduction = mode === "production";
  const robots = isProduction && !page.noindex ? "index,follow,max-image-preview:large" : "noindex,nofollow,noarchive";
  const ogImage = origin ? `${origin}/assets/og-image.png` : "/assets/og-image.png";
  const canonical = origin && !page.noindex ? `${origin}${page.path}` : null;
  const title = page.title;
  const description = page.description;

  return {
    title,
    description,
    robots,
    canonical,
    ogImage,
    tags: [
      `<title>${escapeHtml(title)}</title>`,
      `<meta name="description" content="${escapeAttr(description)}">`,
      `<meta name="robots" content="${robots}">`,
      canonical ? `<link rel="canonical" href="${escapeAttr(canonical)}">` : "",
      `<meta property="og:type" content="website">`,
      `<meta property="og:site_name" content="${escapeAttr(config.brandName)}">`,
      `<meta property="og:locale" content="ja_JP">`,
      `<meta property="og:title" content="${escapeAttr(title)}">`,
      `<meta property="og:description" content="${escapeAttr(description)}">`,
      `<meta property="og:image" content="${escapeAttr(ogImage)}">`,
      `<meta property="og:image:width" content="1200">`,
      `<meta property="og:image:height" content="630">`,
      `<meta property="og:image:alt" content="保育士リトリートの相談窓口。保育士の退職代行、保育の悩みから相談できる。AIチャット・元保育士へのLINE・電話相談。">`,
      canonical ? `<meta property="og:url" content="${escapeAttr(canonical)}">` : "",
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${escapeAttr(title)}">`,
      `<meta name="twitter:description" content="${escapeAttr(description)}">`,
      `<meta name="twitter:image" content="${escapeAttr(ogImage)}">`,
      `<meta name="twitter:image:alt" content="保育士リトリートの相談窓口。保育士の退職代行、保育の悩みから相談できる。AIチャット・元保育士へのLINE・電話相談。">`,
    ]
      .filter(Boolean)
      .join("\n  "),
  };
}
