import { BookOpen, Clock, MapPin } from "lucide-react";
import { PageSection } from "@/components/page-section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type RecentDemandCardModel = {
  id: string;
  grade: string;
  subject: string;
  districtLine: string;
  budgetLine: string;
  postedLabel: string;
  isDemo: boolean;
};

type RecentDemandSectionProps = {
  title: string;
  subtitle: string;
  demoNote: string | null;
  items: RecentDemandCardModel[];
  labels: {
    demoBadge: string;
  };
};

export function RecentDemandSection({
  title,
  subtitle,
  demoNote,
  items,
  labels,
}: RecentDemandSectionProps) {
  if (items.length === 0) return null;

  return (
    <PageSection title={title} description={subtitle}>
      {demoNote ? (
        <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {demoNote}
        </p>
      ) : null}
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:snap-none md:grid-cols-2 md:overflow-visible lg:grid-cols-4">
        {items.map((item) => (
          <Card
            key={item.id}
            className="min-w-[min(100%,260px)] shrink-0 snap-start border-zinc-200 shadow-sm md:min-w-0"
          >
            <CardContent className="relative space-y-3 pt-5">
              {item.isDemo ? (
                <Badge variant="warning" className="absolute right-3 top-3">
                  {labels.demoBadge}
                </Badge>
              ) : null}
              <div className="flex items-start gap-2 pr-14">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#000225]" aria-hidden />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{item.grade}</p>
                  <p className="text-base font-semibold text-[#1D2129]">{item.subject}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm text-zinc-600">
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
                  {item.districtLine}
                </p>
                <p className="font-medium text-zinc-800">{item.budgetLine}</p>
              </div>
              <p className="flex items-center gap-1.5 border-t border-zinc-100 pt-2 text-xs text-zinc-500">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {item.postedLabel}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageSection>
  );
}
