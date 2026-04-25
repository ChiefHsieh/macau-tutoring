import { gradeLevelValues, teachableSubjectOptions } from "@/lib/tutor-setup-form-helpers";
import { macauRegionValues, macauSubareasByRegion } from "@/lib/tutor-setup-form-helpers";

/** Subjects shown as chips; values must match `tutor_subjects.subject` strings. */
export const DIRECTORY_SUBJECT_OPTIONS = [...teachableSubjectOptions, "Putonghua"] as const;

export type DirectorySubjectOption = (typeof DIRECTORY_SUBJECT_OPTIONS)[number];

const SUBJECT_ALLOW = new Set<string>(DIRECTORY_SUBJECT_OPTIONS);
const AREA_ALLOW = new Set<string>(Object.values(macauSubareasByRegion).flat());

export const DIRECTORY_RATE_MIN = 100;
export const DIRECTORY_RATE_MAX = 1000;
export const DIRECTORY_RATE_STEP = 10;

export function parseSubjectsFromSearchParams(subject: string | string[] | undefined): string[] {
  const raw = subject === undefined ? [] : Array.isArray(subject) ? subject : [subject];
  const out = new Set<string>();
  for (const s of raw) {
    const t = s.trim();
    if (SUBJECT_ALLOW.has(t)) out.add(t);
  }
  return [...out];
}

export function parseAreasFromSearchParams(area: string | string[] | undefined): string[] {
  const raw = area === undefined ? [] : Array.isArray(area) ? area : [area];
  const out = new Set<string>();
  for (const s of raw) {
    const t = s.trim();
    if (AREA_ALLOW.has(t)) out.add(t);
  }
  return [...out];
}

export function clampRateRange(min: number, max: number): { min: number; max: number } {
  let a = Number.isFinite(min) ? Math.round(min) : DIRECTORY_RATE_MIN;
  let b = Number.isFinite(max) ? Math.round(max) : DIRECTORY_RATE_MAX;
  a = Math.min(DIRECTORY_RATE_MAX, Math.max(DIRECTORY_RATE_MIN, a));
  b = Math.min(DIRECTORY_RATE_MAX, Math.max(DIRECTORY_RATE_MIN, b));
  if (a > b) [a, b] = [b, a];
  return { min: a, max: b };
}

export { gradeLevelValues };
export { macauRegionValues, macauSubareasByRegion };
