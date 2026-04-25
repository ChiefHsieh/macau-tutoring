"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TutorDirectoryFilterForm, type TutorDirectoryFilterDefaults } from "@/components/tutor-directory-filter-form";

export type TutorFilterDefaults = TutorDirectoryFilterDefaults;

type TutorFiltersMobileDrawerProps = {
  locale: string;
  filterKey: string;
  defaults: TutorFilterDefaults;
};

export function TutorFiltersMobileDrawer({ locale, filterKey, defaults }: TutorFiltersMobileDrawerProps) {
  const t = useTranslations("Directory");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-auto w-full justify-between gap-3 rounded-xl px-4 py-3 text-left font-semibold shadow-sm hover:shadow-md"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-[#000225]" aria-hidden />
          {t("openFilters")}
        </span>
        <span className="text-xs font-normal text-zinc-500">{t("tapToExpand")}</span>
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t("closeFilters")}
            onClick={() => setOpen(false)}
          />
          <div
            className="tutor-filters-drawer-panel absolute left-0 right-0 top-0 z-10 max-h-[min(88vh,720px)] overflow-y-auto rounded-b-2xl border-x border-b border-[#F2F3F5] bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutor-filter-drawer-title"
          >
            <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-4 py-3">
              <h2 id="tutor-filter-drawer-title" className="text-base font-semibold">
                {t("openFilters")}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-9 w-9 shrink-0 p-0 text-zinc-600"
                aria-label={t("closeFilters")}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="px-4 pb-6 pt-4">
              <TutorDirectoryFilterForm
                key={filterKey}
                locale={locale}
                defaults={defaults}
                onApply={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
