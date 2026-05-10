/** Canonical URLs for static pages (terms, etc.). Safe on server and client. */

export function getTermsPageUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_TERMS_URL?.trim();
  if (explicit) return explicit;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (site) return `${site}/terms.html`;
  return "/terms.html";
}
