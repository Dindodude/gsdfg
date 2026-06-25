const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const CONTACT_PATHS = ["/", "/contact", "/contact-us", "/about", "/about-us"];
const BLOCKED_EMAIL_PARTS = ["example.com", "sentry.io", "wixpress.com", "domain.com", "email.com"];

function normalizeUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }

  return url;
}

function sameOriginUrl(baseUrl: string, path: string) {
  const base = new URL(normalizeUrl(baseUrl));
  return new URL(path, base.origin).toString();
}

function uniqueEmails(html: string) {
  return Array.from(new Set((html.match(EMAIL_PATTERN) ?? []).map((email) => email.toLowerCase())))
    .filter((email) => !BLOCKED_EMAIL_PARTS.some((blocked) => email.includes(blocked)))
    .filter((email) => !email.endsWith(".png") && !email.endsWith(".jpg") && !email.endsWith(".jpeg") && !email.endsWith(".webp"));
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "AgencyForgeAI/1.0 email enrichment crawler",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) return "";

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
    return "";
  }

  return response.text();
}

export async function scrapeEmailsFromWebsite(websiteUrl: string) {
  const candidates = CONTACT_PATHS.map((path) => sameOriginUrl(websiteUrl, path));
  const emails = new Set<string>();

  for (const url of candidates) {
    try {
      const html = await fetchText(url);
      uniqueEmails(html).forEach((email) => emails.add(email));
    } catch {
      // Continue trying likely contact pages.
    }
  }

  return Array.from(emails);
}
