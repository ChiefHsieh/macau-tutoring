"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/button-link";
import { Select } from "@/components/ui/select";
import {
  DIRECTORY_RATE_MAX,
  DIRECTORY_RATE_MIN,
  DIRECTORY_RATE_STEP,
  DIRECTORY_SUBJECT_OPTIONS,
  gradeLevelValues,
  macauRegionValues,
  macauSubareasByRegion,
} from "@/lib/tutor-directory-filters";
import { displayMacauRegion, displayMacauSubarea } from "@/lib/macau-location-display";

export type TutorDirectoryFilterDefaults = {
  subjects: string[];
  grade: string;
  district: string;
  areas: string[];
  min: number;
  max: number;
  sort: string;
};

type TutorDirectoryFilterFormProps = {
  locale: string;
  defaults: TutorDirectoryFilterDefaults;
  /** Called after GET submit (e.g. close mobile drawer). */
  onApply?: () => void;
};

function DualRangeBudget({
  low,
  high,
  onLow,
  onHigh,
}: {
  low: number;
  high: number;
  onLow: (v: number) => void;
  onHigh: (v: number) => void;
}) {
  const t = useTranslations("Directory");
  const span = DIRECTORY_RATE_MAX - DIRECTORY_RATE_MIN;
  const leftPct = ((low - DIRECTORY_RATE_MIN) / span) * 100;
  const widthPct = ((high - low) / span) * 100;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-xs text-zinc-600">
        <span>
          {t("priceFrom")} <span className="font-semibold text-[#1D2129]">MOP{low}</span>
        </span>
        <span>
          {t("priceTo")} <span className="font-semibold text-[#1D2129]">MOP{high}</span>
        </span>
      </div>
      <div className="relative h-9 pt-2">
        <div
          className="pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-zinc-200"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#000225]/80"
          style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 0)}%` }}
          aria-hidden
        />
        <input
          type="range"
          min={DIRECTORY_RATE_MIN}
          max={DIRECTORY_RATE_MAX}
          step={DIRECTORY_RATE_STEP}
          value={low}
          onChange={(e) => {
            const v = Number(e.target.value);
            onLow(Math.min(v, high));
          }}
          aria-label={t("priceMinAria")}
          className="pointer-events-none absolute inset-x-0 top-0 h-9 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#000225] [&::-moz-range-thumb]:bg-white [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#000225] [&::-webkit-slider-thumb]:bg-white"
          style={{ zIndex: low <= high ? 3 : 5 }}
        />
        <input
          type="range"
          min={DIRECTORY_RATE_MIN}
          max={DIRECTORY_RATE_MAX}
          step={DIRECTORY_RATE_STEP}
          value={high}
          onChange={(e) => {
            const v = Number(e.target.value);
            onHigh(Math.max(v, low));
          }}
          aria-label={t("priceMaxAria")}
          className="pointer-events-none absolute inset-x-0 top-0 h-9 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#000225] [&::-moz-range-thumb]:bg-white [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#000225] [&::-webkit-slider-thumb]:bg-white"
          style={{ zIndex: low <= high ? 5 : 3 }}
        />
      </div>
    </div>
  );
}

export function TutorDirectoryFilterForm({ locale, defaults, onApply }: TutorDirectoryFilterFormProps) {
  const t = useTranslations("Directory");
  const tCommon = useTranslations("Common");
  const tSubjects = useTranslations("Directory.subjectOptions");
  const tGrades = useTranslations("Directory.gradeOptions");
  const router = useRouter();
  const [isFilterNavigating, startFilterTransition] = useTransition();
  const formAction = `/${locale}/tutors`;

  const [low, setLow] = useState(defaults.min);
  const [high, setHigh] = useState(defaults.max);
  const [region, setRegion] = useState(defaults.district);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(defaults.subjects);
  const [selectedGrade, setSelectedGrade] = useState<string>(defaults.grade);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(defaults.areas);
  const [sort, setSort] = useState(defaults.sort);

  function applyFiltersAndNavigate() {
    const params = new URLSearchParams();
    params.set("min", String(low));
    params.set("max", String(high));
    if (region) params.set("district", region);
    selectedSubjects.forEach((s) => params.append("subject", s));
    if (selectedGrade) params.set("grade", selectedGrade);
    selectedAreas.forEach((a) => params.append("area", a));
    params.set("sort", sort);
    const qs = params.toString();
    router.push(`${formAction}${qs ? `?${qs}` : ""}`);
    onApply?.();
  }

  const chipBaseClass =
    "inline-flex min-w-0 max-w-full cursor-pointer items-center gap-1.5 break-words rounded-full border px-3 py-1.5 text-sm leading-snug transition-colors [word-break:break-word]";
  const chipClass = (active: boolean) =>
    active
      ? `${chipBaseClass} border-[#E6C699] bg-[#E6C699] text-[#000225]`
      : `${chipBaseClass} border-zinc-200 bg-white text-[#1D2129] hover:border-zinc-300`;

  return (
    <form
      action={formAction}
      method="get"
      className="grid min-w-0 max-w-full gap-4 overflow-x-hidden"
      onSubmit={(e) => {
        e.preventDefault();
        startFilterTransition(() => {
          applyFiltersAndNavigate();
        });
      }}
    >
      <fieldset className="min-w-0 space-y-2 border-0 p-0">
        <legend className="text-sm font-medium text-white">{t("subjectsLegend")}</legend>
        <p className="text-xs text-[#94A3B8]">{t("subjectsHint")}</p>
        <div className="flex min-w-0 max-w-full flex-wrap gap-2">
          {DIRECTORY_SUBJECT_OPTIONS.map((opt) => (
            <label
              key={opt}
              className={chipClass(selectedSubjects.includes(opt))}
            >
              <input
                type="checkbox"
                name="subject"
                value={opt}
                checked={selectedSubjects.includes(opt)}
                onChange={(e) => {
                  setSelectedSubjects((prev) =>
                    e.target.checked ? [...prev, opt] : prev.filter((item) => item !== opt),
                  );
                }}
                className="sr-only"
              />
              <span>{tSubjects(opt)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="min-w-0 space-y-2 border-0 p-0">
        <legend className="text-sm font-medium text-white">{t("gradeLegend")}</legend>
        <div className="flex min-w-0 max-w-full flex-wrap gap-2">
          <label className={chipClass(!selectedGrade)}>
            <input
              type="radio"
              name="grade"
              value=""
              checked={!selectedGrade}
              onChange={() => setSelectedGrade("")}
              className="sr-only"
            />
            {t("gradeAny")}
          </label>
          {gradeLevelValues.map((gl) => (
            <label
              key={gl}
              className={chipClass(selectedGrade === gl)}
            >
              <input
                type="radio"
                name="grade"
                value={gl}
                checked={selectedGrade === gl}
                onChange={() => setSelectedGrade(gl)}
                className="sr-only"
              />
              {tGrades(gl)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1">
        <p className="text-sm font-medium text-white">{t("budgetLegend")}</p>
        <DualRangeBudget low={low} high={high} onLow={setLow} onHigh={setHigh} />
      </div>

      <fieldset className="space-y-2 border-0 p-0">
        <legend className="text-sm font-medium text-white">{t("districtLegend")}</legend>
        <div className="flex min-w-0 max-w-full flex-wrap gap-2">
          <label className={chipClass(!region)}>
            <input
              type="radio"
              name="_region"
              value=""
              checked={!region}
              onChange={() => setRegion("")}
              className="sr-only"
            />
            {t("districtAny")}
          </label>
          {macauRegionValues.map((r) => (
            <label
              key={r}
              className={chipClass(region === r)}
            >
              <input
                type="radio"
                name="_region"
                value={r}
                checked={region === r}
                onChange={() => setRegion(r)}
                className="sr-only"
              />
              {displayMacauRegion(locale, r)}
            </label>
          ))}
        </div>
      </fieldset>

      {region ? (
        <fieldset className="space-y-2 border-0 p-0">
          <legend className="text-sm font-medium text-white">{t("areaLegend")}</legend>
          <div className="flex min-w-0 max-w-full flex-wrap gap-2">
            {macauSubareasByRegion[region as keyof typeof macauSubareasByRegion].map((area) => (
              <label
                key={area}
                className={chipClass(selectedAreas.includes(area))}
              >
                <input
                  type="checkbox"
                  name="area"
                  value={area}
                  checked={selectedAreas.includes(area)}
                  onChange={(e) => {
                    setSelectedAreas((prev) =>
                      e.target.checked ? [...prev, area] : prev.filter((item) => item !== area),
                    );
                  }}
                  className="sr-only"
                />
                {displayMacauSubarea(locale, area)}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <Select name="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
        <option value="newest">{t("sortNewest")}</option>
        <option value="price">{t("sortPrice")}</option>
        <option value="rating">{t("sortRating")}</option>
      </Select>

      <Button type="submit" disabled={isFilterNavigating}>
        {isFilterNavigating ? tCommon("loading") : t("apply")}
      </Button>
      <ButtonLink
        href={formAction}
        variant="ghost"
        size="sm"
        className="h-auto justify-center px-0 text-[#4E5969]"
        onClick={() => onApply?.()}
        pendingLabel={tCommon("loading")}
      >
        {t("clearFilters")}
      </ButtonLink>
    </form>
  );
}
