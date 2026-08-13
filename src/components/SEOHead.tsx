import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  jsonLd?: object | object[];
}

const DEFAULT_TITLE = 'Golden Travel - Paket Umrah & Haji Khusus Resmi Kemenag | Batam & Indonesia';
const DEFAULT_DESC = 'PT. Golden Tour Haramain (Golden Travel) - Biro travel Umrah dan Haji Khusus resmi Kemenag terpercaya di Batam, Kepri & seluruh Indonesia. Paket Umrah promo, VIP Bintang 5, & Haji Furoda.';
const DEFAULT_KEYWORDS = 'haji umrah, paket umrah dan haji, travel umrah batam, paket umrah batam, travel haji umrah batam, biaya umrah batam, travel umrah terpercaya, paket umrah promo 2026, haji khusus resmi, Golden Travel, PT Golden Tour Haramain, umrah vip bintang 5, biro umrah kepri';
const SITE_URL = 'https://goldentravel.co.id';

export default function SEOHead({
  title,
  description = DEFAULT_DESC,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogType = 'website',
  ogImage = `${SITE_URL}/logo.png`,
  jsonLd
}: SEOProps) {
  useEffect(() => {
    // 1. Title
    const fullTitle = title ? `${title} | Golden Travel` : DEFAULT_TITLE;
    document.title = fullTitle;

    // 2. Helper to set or create meta tag
    const setMetaTag = (selector: string, attrName: string, attrVal: string, contentVal: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentVal);
    };

    // Description & Keywords
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);

    // Open Graph
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);

    // Canonical
    const currentUrl = canonical ? `${SITE_URL}${canonical}` : `${SITE_URL}${window.location.pathname}`;
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', currentUrl);

    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', currentUrl);

    // Dynamic JSON-LD
    let scriptJsonLd = document.getElementById('dynamic-jsonld') as HTMLScriptElement | null;
    if (jsonLd) {
      if (!scriptJsonLd) {
        scriptJsonLd = document.createElement('script');
        scriptJsonLd.id = 'dynamic-jsonld';
        scriptJsonLd.type = 'application/ld+json';
        document.head.appendChild(scriptJsonLd);
      }
      scriptJsonLd.textContent = JSON.stringify(jsonLd);
    } else if (scriptJsonLd) {
      scriptJsonLd.remove();
    }
  }, [title, description, keywords, canonical, ogType, ogImage, jsonLd]);

  return null;
}
