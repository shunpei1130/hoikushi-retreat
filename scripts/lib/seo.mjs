import { escapeAttr, escapeHtml, safeJsonLd } from "./html.mjs";
import { computeTotal } from "./components.mjs";

const SERVICE_TYPE = "保育士向け退職相談・退職代行サービス";
const OG_IMAGE_ALT =
  "保育士リトリートの相談窓口。保育士の退職代行、保育の悩みから相談できる。AIチャット・元保育士へのLINE・電話相談。";

export function buildJsonLd({ config, page, mode, origin }) {
  const brand = config.brandName;
  const graph = [];
  const pageUrl = origin ? `${origin}${page.path}` : null;
  const pageId = pageUrl ? `${pageUrl}#webpage` : "#webpage";
  const websiteId = origin ? `${origin}/#website` : null;
  const organizationId = origin ? `${origin}/#organization` : null;
  const serviceId = origin ? `${origin}/#service` : null;
  const logoId = origin ? `${origin}/#logo` : null;
  const primaryImageId = origin ? `${origin}/#primaryimage` : null;

  const hasOrganization = Boolean(
    origin &&
      config.operator?.legalName &&
      config.operator?.address &&
      config.operator?.responsiblePerson,
  );
  const total = computeTotal(config);
  const hasService = Boolean(origin && hasOrganization && total.amount !== null);

  if (origin && !page.noindex) {
    graph.push({
      "@type": "ImageObject",
      "@id": primaryImageId,
      inLanguage: "ja-JP",
      url: `${origin}/assets/og-image.png`,
      contentUrl: `${origin}/assets/og-image.png`,
      width: 1200,
      height: 630,
      caption: OG_IMAGE_ALT,
    });
  }

  const webpage = {
    "@type": "WebPage",
    "@id": pageId,
    name: page.title,
    description: page.description,
    inLanguage: "ja-JP",
  };
  if (pageUrl) webpage.url = pageUrl;
  if (config.contentUpdatedAt) {
    webpage.datePublished = config.contentUpdatedAt;
    webpage.dateModified = config.contentUpdatedAt;
  }
  if (websiteId) webpage.isPartOf = { "@id": websiteId };
  if (origin && !page.noindex && primaryImageId) {
    webpage.primaryImageOfPage = { "@id": primaryImageId };
  }
  if (hasOrganization && organizationId) {
    webpage.publisher = { "@id": organizationId };
  }
  if (hasService && serviceId && page.path === "/") {
    webpage.about = { "@id": serviceId };
    webpage.mainEntity = { "@id": serviceId };
  }
  if (origin && Array.isArray(page.breadcrumbs) && page.breadcrumbs.length >= 1 && !page.noindex) {
    webpage.breadcrumb = { "@id": `${pageUrl}#breadcrumb` };
  }
  if (page.path === "/" && !page.noindex) {
    webpage.speakable = {
      "@type": "SpeakableSpecification",
      cssSelector: ["#hero-title", ".hero-card__lead", "#faq"],
    };
  }
  graph.push(webpage);

  if (origin && websiteId) {
    const website = {
      "@type": "WebSite",
      "@id": websiteId,
      url: `${origin}/`,
      name: brand,
      alternateName: ["保育士リトリート（退職代行・お悩み相談）", "保育士のほっと退職"],
      description:
        "元保育士と女性カウンセラーが対応する、保育士特化の無料お悩み相談・労働組合運営の退職代行サービス。",
      inLanguage: "ja-JP",
    };
    if (organizationId && hasOrganization) website.publisher = { "@id": organizationId };
    graph.push(website);
  }

  if (hasOrganization) {
    const operator = config.operator;
    const sameAs = [];
    if (config.channels?.line?.verified === true && config.channels.line.url) {
      sameAs.push(config.channels.line.url);
    }

    const organization = {
      "@type": ["Organization", "WorkersUnion"],
      "@id": organizationId,
      name: brand,
      legalName: operator.legalName,
      url: `${origin}/`,
      logo: {
        "@type": "ImageObject",
        "@id": logoId,
        url: `${origin}/assets/apple-touch-icon.png`,
        contentUrl: `${origin}/assets/apple-touch-icon.png`,
        width: 180,
        height: 180,
        caption: brand,
      },
      image: `${origin}/assets/og-image.png`,
      areaServed: {
        "@type": "Country",
        name: "JP",
      },
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
    if (sameAs.length > 0) organization.sameAs = sameAs;

    const contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["ja"],
      areaServed: "JP",
    };
    if (operator.contactUrl) {
      contactPoint.url = operator.contactUrl;
    } else if (config.channels?.line?.verified === true && config.channels.line.url) {
      contactPoint.url = config.channels.line.url;
    }
    if (operator.hours) contactPoint.hoursAvailable = operator.hours;
    if (config.channels?.phone?.verified === true && config.channels.phone.number) {
      contactPoint.telephone = config.channels.phone.number;
    } else if (operator.contact && /^[0-9+\-()]{8,}$/.test(operator.contact.trim())) {
      contactPoint.telephone = operator.contact.trim();
    }
    if (contactPoint.url || contactPoint.hoursAvailable || contactPoint.telephone) {
      organization.contactPoint = contactPoint;
    }
    graph.push(organization);
  }

  if (hasService) {
    const verifiedPlans = Array.isArray(config.pricing?.plans)
      ? config.pricing.plans.filter(
          (plan) => plan.verified === true && typeof plan.amount === "number",
        )
      : [];

    const service = {
      "@type": "Service",
      "@id": serviceId,
      name: `${brand}（保育士特化の退職相談・退職代行）`,
      alternateName: brand,
      serviceType: SERVICE_TYPE,
      category: "退職代行・労働組合相談支援",
      description: page.description,
      provider: { "@id": organizationId },
      brand: { "@id": organizationId },
      areaServed: { "@type": "Country", name: "日本" },
      audience: {
        "@type": "Audience",
        audienceType: config.service?.audience || "保育士（正社員・契約社員・パート・公立保育士等）",
      },
      termsOfService: `${origin}/terms/`,
      url: `${origin}/`,
      offers: {
        "@type": "Offer",
        name: config.pricing?.total?.condition || "退職支援総額",
        price: String(total.amount),
        priceCurrency: "JPY",
        availability: "https://schema.org/InStock",
        url: `${origin}/#pricing`,
      },
    };

    if (verifiedPlans.length > 0) {
      service.hasOfferCatalog = {
        "@type": "OfferCatalog",
        name: "保育士リトリート 相談・退職支援料金プラン",
        itemListElement: [
          {
            "@type": "Offer",
            name: "LINE・電話・AIチャット無料相談",
            description: "元保育士・女性カウンセラーへのLINE相談、電話相談、保育特化AIチャット相談",
            price: "0",
            priceCurrency: "JPY",
            url: `${origin}/#talk`,
          },
          ...verifiedPlans.map((plan) => ({
            "@type": "Offer",
            name: plan.label,
            description: [plan.condition, plan.note].filter(Boolean).join("／"),
            price: String(plan.amount),
            priceCurrency: "JPY",
            availability: "https://schema.org/InStock",
            url: `${origin}/#pricing`,
          })),
        ],
      };
    }

    graph.push(service);
  }

  if (origin && Array.isArray(page.faqs) && page.faqs.length > 0 && !page.noindex) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faqpage`,
      inLanguage: "ja-JP",
      isPartOf: { "@id": pageId },
      mainEntity: page.faqs.map((item, index) => ({
        "@type": "Question",
        "@id": `${pageUrl}#faq-q-${String(index + 1).padStart(2, "0")}`,
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  if (origin && Array.isArray(page.steps) && page.steps.length > 0 && !page.noindex) {
    graph.push({
      "@type": "HowTo",
      "@id": `${pageUrl}#howto`,
      name: "保育士リトリートの退職代行・無料相談のご利用の流れ（かんたん3ステップ）",
      description:
        "公式LINE追加後、ヒアリングシート（Googleフォーム）を記入して料金をお支払いいただくだけでご依頼完了となります。",
      inLanguage: "ja-JP",
      totalTime: "PT10M",
      step: page.steps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.name,
        text: step.text,
        url: `${pageUrl}#flow`,
      })),
    });
  }

  if (origin && Array.isArray(page.breadcrumbs) && page.breadcrumbs.length >= 1 && !page.noindex) {
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
  const robots =
    isProduction && !page.noindex
      ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
      : "noindex,nofollow,noarchive";
  const ogImage = origin ? `${origin}/assets/og-image.png` : "/assets/og-image.png";
  const canonical = isProduction && origin && !page.noindex ? `${origin}${page.path}` : null;
  const title = page.title;
  const description = page.description;
  const ogType = page.path === "/" ? "website" : "article";

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
      `<meta name="googlebot" content="${robots}">`,
      `<meta name="format-detection" content="telephone=no,address=no,email=no">`,
      `<meta name="author" content="${escapeAttr(config.brandName)}">`,
      canonical ? `<link rel="canonical" href="${escapeAttr(canonical)}">` : "",
      canonical ? `<link rel="alternate" hreflang="ja" href="${escapeAttr(canonical)}">` : "",
      canonical ? `<link rel="alternate" hreflang="x-default" href="${escapeAttr(canonical)}">` : "",
      `<meta property="og:type" content="${ogType}">`,
      `<meta property="og:site_name" content="${escapeAttr(config.brandName)}">`,
      `<meta property="og:locale" content="ja_JP">`,
      `<meta property="og:title" content="${escapeAttr(title)}">`,
      `<meta property="og:description" content="${escapeAttr(description)}">`,
      `<meta property="og:image" content="${escapeAttr(ogImage)}">`,
      `<meta property="og:image:type" content="image/png">`,
      `<meta property="og:image:width" content="1200">`,
      `<meta property="og:image:height" content="630">`,
      `<meta property="og:image:alt" content="${OG_IMAGE_ALT}">`,
      canonical ? `<meta property="og:url" content="${escapeAttr(canonical)}">` : "",
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${escapeAttr(title)}">`,
      `<meta name="twitter:description" content="${escapeAttr(description)}">`,
      `<meta name="twitter:image" content="${escapeAttr(ogImage)}">`,
      `<meta name="twitter:image:alt" content="${OG_IMAGE_ALT}">`,
    ]
      .filter(Boolean)
      .join("\n  "),
  };
}
