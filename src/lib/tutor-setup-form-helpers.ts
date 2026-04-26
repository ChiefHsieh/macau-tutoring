export const gradeLevelValues = [
  "小學1-6年級",
  "初中1-3年級",
  "高一",
  "高二",
  "高三",
  "澳門四校聯考",
  "IGCSE",
  "IB",
  "A-Level",
  "IELTS",
  "TOEFL",
  "SAT",
] as const;

export type GradeLevel = (typeof gradeLevelValues)[number];

/** Preset teachable subjects (stored as display strings in tutor_subjects.subject). */
export const teachableSubjectOptions = [
  "中文",
  "英文",
  "葡文",
  "數學",
  "物理",
  "化學",
  "生物",
  "經濟",
  "商業",
  "歷史",
  "地理",
  "資訊及通訊科技",
  "音樂",
  "日文",
  "法文",
  "德文",
  "西班牙文",
] as const;

export type TeachableSubject = (typeof teachableSubjectOptions)[number];

const OPTION_SET = new Set<string>(teachableSubjectOptions);

export type SubjectGroup = { subject_names: string[]; grade_levels: GradeLevel[] };

export type EducationEntry = {
  degree_type: string;
  university: string;
  field_of_study: string;
  year_period: string;
};

export const macauRegionValues = ["澳門半島", "氹仔", "路環", "路氹城"] as const;
export type MacauRegion = (typeof macauRegionValues)[number];

export const macauSubareasByRegion: Record<MacauRegion, readonly string[]> = {
  澳門半島: [
    "黑沙環",
    "關閘",
    "台山",
    "高士德",
    "水坑尾",
    "新馬路",
    "南灣",
    "西灣",
    "下環",
    "媽閣",
    "荷蘭園",
    "東望洋",
    "筷子基",
    "青洲",
  ],
  氹仔: ["氹仔舊城", "氹仔北安", "氹仔花城", "氹仔濠景"],
  路環: ["路環市區", "黑沙", "竹灣"],
  路氹城: ["路氹城（金光大道 / 威尼斯人 / 銀河片區）"],
} as const;

const ALL_SUBAREAS = new Set<string>(Object.values(macauSubareasByRegion).flat());
const SUBAREA_TO_REGION = new Map<string, MacauRegion>(
  Object.entries(macauSubareasByRegion).flatMap(([region, areas]) =>
    areas.map((area) => [area, region as MacauRegion] as const),
  ),
);

export function normalizeRegion(value: string | null | undefined): MacauRegion {
  if (value === "Macau Peninsula") return "澳門半島";
  if (value === "Taipa") return "氹仔";
  if (value === "Coloane") return "路環";
  if (value && (macauRegionValues as readonly string[]).includes(value)) return value as MacauRegion;
  return "澳門半島";
}

export function parseServiceAreasFromDb(raw: string | null | undefined, district?: string | null): string[] {
  if (!raw?.trim()) return [];
  const t = raw.trim();
  // New format: |A|B|C|
  if (t.includes("|")) {
    return t
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && ALL_SUBAREAS.has(s));
  }
  // Legacy fallback: plain district text or comma-separated text
  const parts = t
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && ALL_SUBAREAS.has(s));
  if (parts.length > 0) return parts;
  const region = normalizeRegion(district ?? t);
  return [...macauSubareasByRegion[region]];
}

export function serializeServiceAreasForDb(areas: string[]): string {
  const valid = Array.from(new Set(areas.map((s) => s.trim()).filter((s) => ALL_SUBAREAS.has(s))));
  if (valid.length === 0) return "";
  return `|${valid.join("|")}|`;
}

export function inferRegionFromAreas(areas: string[]): MacauRegion {
  for (const area of areas) {
    const region = SUBAREA_TO_REGION.get(area);
    if (region) return region;
  }
  return "澳門半島";
}

const EDU_SEP = " · ";

export function flattenSubjectGroups(groups: SubjectGroup[]): { subject: string; grade_level: GradeLevel }[] {
  const out: { subject: string; grade_level: GradeLevel }[] = [];
  for (const g of groups) {
    for (const subj of g.subject_names) {
      const s = subj.trim();
      if (!s) continue;
      for (const gl of g.grade_levels) {
        out.push({ subject: s, grade_level: gl });
      }
    }
  }
  return out;
}

export function groupSubjectsFromDb(
  rows: { subject: string; grade_level: string }[] | null | undefined,
): SubjectGroup[] {
  if (!rows?.length) return [{ subject_names: [], grade_levels: [] }];
  const map = new Map<string, GradeLevel[]>();
  for (const r of rows) {
    const gl = r.grade_level as GradeLevel;
    if (!gradeLevelValues.includes(gl)) continue;
    if (!map.has(r.subject)) map.set(r.subject, []);
    const arr = map.get(r.subject)!;
    if (!arr.includes(gl)) arr.push(gl);
  }
  const grouped = [...map.entries()]
    .map(([subject, grade_levels]) => ({
      subject_names: [subject],
      grade_levels,
    }))
    .filter((g) => g.subject_names[0] && g.grade_levels.length > 0);
  if (grouped.length === 0) return [{ subject_names: [], grade_levels: [] }];
  return grouped;
}

export function isPresetTeachableSubject(name: string): name is TeachableSubject {
  return OPTION_SET.has(name);
}

/** Parse stored `education_background` into form rows (supports legacy 3-part or plain lines). */
export function parseEducationForForm(raw: string): EducationEntry[] {
  const t = raw.trim();
  if (!t) return [{ degree_type: "", university: "", field_of_study: "", year_period: "" }];
  const lines = t.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    const parts = line.split(EDU_SEP);
    if (parts.length === 4) {
      return {
        degree_type: parts[0]!,
        university: parts[1]!,
        field_of_study: parts[2]!,
        year_period: parts[3]!,
      };
    }
    if (parts.length === 3) {
      return {
        degree_type: parts[0]!,
        university: "",
        field_of_study: parts[1]!,
        year_period: parts[2]!,
      };
    }
    return { degree_type: "", university: "", field_of_study: line, year_period: "" };
  });
}

/** Serialize degree rows for `tutor_profiles.education_background` (one line per degree). */
export function serializeEducationForDb(entries: EducationEntry[]): string {
  return entries
    .map((e) => {
      const d = e.degree_type.trim();
      const u = e.university.trim();
      const f = e.field_of_study.trim();
      const y = e.year_period.trim();
      if (d && u && f && y) return `${d}${EDU_SEP}${u}${EDU_SEP}${f}${EDU_SEP}${y}`;
      if (d && f && y && !u) return `${d}${EDU_SEP}${f}${EDU_SEP}${y}`;
      if (f && !d && !u && !y) return f;
      return [d, u, f, y].filter(Boolean).join(EDU_SEP);
    })
    .filter(Boolean)
    .join("\n");
}
