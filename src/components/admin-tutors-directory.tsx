"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AdminTutorListItem } from "@/app/api/admin/tutors/route";

type AdminTutorsDirectoryProps = {
  locale: string;
};

export function AdminTutorsDirectory({ locale }: AdminTutorsDirectoryProps) {
  const t = useTranslations("AdminTutors");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminTutorListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    const tmr = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(tmr);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/admin/tutors?${params.toString()}`, { credentials: "include" });
      if (res.status === 403) {
        router.replace(`/${locale}`);
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? res.statusText);
      }
      const data = (await res.json()) as {
        tutors: AdminTutorListItem[];
        totalPages: number;
        total: number;
      };
      setRows(data.tutors);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, locale, page, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const openThread = async (tutorId: string) => {
    setOpeningId(tutorId);
    setError(null);
    try {
      const res = await fetch("/api/admin/conversations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorId, locale }),
      });
      if (res.status === 403) {
        router.replace(`/${locale}`);
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? res.statusText);
      }
      const data = (await res.json()) as { redirectPath: string };
      router.push(data.redirectPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open chat.");
    } finally {
      setOpeningId(null);
    }
  };

  const fmtDate = (iso: string | null) => {
    if (!iso) return t("neverOnline");
    try {
      return new Date(iso).toLocaleString(locale === "en" ? "en-GB" : "zh-HK", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="block w-full max-w-md text-sm text-[#E2E8F0]">
          <span className="mb-1 block font-medium">{t("searchLabel")}</span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="border-[#2D4263] bg-[#0A0F35] text-white placeholder:text-zinc-500"
          />
        </label>
        <p className="text-sm text-zinc-400">
          {t("totalCount", { count: total })}
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-red-700/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</p>
      ) : null}

      {loading ? (
        <p className="py-12 text-center text-[#E2E8F0]">{tCommon("loading")}</p>
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-zinc-400">{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-[#1A2456] bg-[#0A0F35] px-4 py-4"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[#2D4263] bg-[#101742]">
                {row.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                    —
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[#F8F9FA]">{row.displayName}</p>
                <p className="mt-1 line-clamp-2 text-sm text-[#94A3B8]">
                  {t("subjectsLabel")}: {row.subjects.length ? row.subjects.join("、") : "—"}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                  <span>
                    {t("registered")}: {fmtDate(row.registeredAt)}
                  </span>
                  <span>
                    {t("lastOnline")}: {fmtDate(row.lastOnlineAt)}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                className="shrink-0 rounded-lg bg-[#5B8FD9] px-4 py-2 text-white hover:bg-[#4A7BC8]"
                disabled={openingId !== null}
                onClick={() => void openThread(row.id)}
              >
                {openingId === row.id ? tCommon("loading") : t("sendMessage")}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {!loading && totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("prevPage")}
          </Button>
          <span className="text-sm text-zinc-400">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("nextPage")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
