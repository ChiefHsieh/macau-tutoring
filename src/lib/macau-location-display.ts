import { normalizeRegion, type MacauRegion } from "@/lib/tutor-setup-form-helpers";

/**
 * Canonical Macau regions/subareas in the DB and URLs remain Traditional Chinese.
 * For English UI only — translate labels without changing stored/filter values.
 */

const EN_REGION_LABEL: Record<MacauRegion, string> = {
  澳門半島: "Macau Peninsula",
  氹仔: "Taipa",
  路環: "Coloane",
  路氹城: "Cotai",
};

/** Every subarea string from `macauSubareasByRegion` → English label */
const EN_SUBAREA_LABEL: Record<string, string> = {
  黑沙環: "Areia Preta",
  關閘: "Portas do Cerco",
  台山: "Toi San",
  高士德: "Horta e Costa",
  水坑尾: "Rua do Campo",
  新馬路: "Avenida de Almeida Ribeiro",
  南灣: "Nam Van",
  西灣: "Sai Van",
  下環: "São Lourenço",
  媽閣: "Barra",
  荷蘭園: "Holland Garden",
  東望洋: "Guia",
  筷子基: "Fai Chi Kei",
  青洲: "Ilha Verde",
  氹仔舊城: "Old Taipa Village",
  氹仔北安: "Pac On Taipa",
  氹仔花城: "Taipa Flower City",
  氹仔濠景: "Taipa Nova City",
  路環市區: "Coloane Village",
  黑沙: "Hac Sa",
  竹灣: "Cheoc Van",
  "路氹城（金光大道 / 威尼斯人 / 銀河片區）": "Cotai Strip (including the Venetian / Galaxy area)",
};

export function isEnglishLocale(locale: string): boolean {
  return locale === "en" || locale.startsWith("en-");
}

export function displayMacauRegion(locale: string, region: string | null | undefined): string {
  const raw = region?.trim() ?? "";
  if (!raw) return "";
  if (!isEnglishLocale(locale)) return raw;
  const canonical = normalizeRegion(raw);
  return EN_REGION_LABEL[canonical] ?? EN_REGION_LABEL[raw as MacauRegion] ?? raw;
}

export function displayMacauSubarea(locale: string, subarea: string | null | undefined): string {
  const raw = subarea?.trim() ?? "";
  if (!raw) return "";
  if (!isEnglishLocale(locale)) return raw;
  return EN_SUBAREA_LABEL[raw] ?? raw;
}
