import { displayMacauRegion } from "@/lib/macau-location-display";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/button-link";
import { Card, CardContent } from "@/components/ui/card";

export type FeaturedTutorCardProps = {
  locale: string;
  tutor: {
    id: string;
    display_name: string;
    district: string;
    hourly_rate: number;
    service_type: string;
    is_verified: boolean;
    average_rating: number;
    total_reviews: number;
    education_background: string;
    profile_photo: string | null;
    subjectSummary: string;
  };
  labels: {
    verified: string;
    reviews: string;
    noSubjects: string;
    viewProfile: string;
    book: string;
    online: string;
    inPerson: string;
    both: string;
  };
};

function serviceLabel(serviceType: string, labels: FeaturedTutorCardProps["labels"]) {
  if (serviceType === "online") return labels.online;
  if (serviceType === "in-person") return labels.inPerson;
  if (serviceType === "both") return labels.both;
  return labels.both;
}

export function FeaturedTutorCard({ locale, tutor, labels }: FeaturedTutorCardProps) {
  const initials = tutor.display_name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="featured-tutor-card ui-hover-lift group flex h-full flex-col overflow-hidden p-0">
      {/* Fixed-height media box + absolutely positioned img avoids global `img { height: auto }` breaking crop on mobile */}
      <div className="featured-tutor-card-media relative h-[148px] w-full shrink-0 overflow-hidden bg-[#F7F9FC] sm:h-40">
        {tutor.profile_photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tutor.profile_photo}
            alt=""
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full min-h-[148px] w-full items-center justify-center text-2xl font-semibold text-[#4E5969] sm:min-h-0">
            {initials}
          </div>
        )}
        <div className="pointer-events-none absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1.5 sm:left-3 sm:top-3 sm:gap-2">
          {tutor.is_verified ? (
            <Badge variant="default" className="pointer-events-auto text-[11px] font-medium sm:text-xs">
              {labels.verified}
            </Badge>
          ) : null}
          <Badge
            variant="default"
            className="pointer-events-auto border-0 bg-white/92 text-[11px] font-medium text-[#1D2129] shadow-sm sm:text-xs"
          >
            {serviceLabel(tutor.service_type, labels)}
          </Badge>
        </div>
        <div className="absolute bottom-2 left-2 rounded-md bg-[#0F2C59]/92 px-2 py-1 text-[11px] font-bold text-[#DAC0A3] sm:bottom-3 sm:left-3 sm:text-xs">
          MOP{tutor.hourly_rate}/hr
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 px-4 pb-5 pt-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 text-base font-bold leading-snug tracking-tight text-[#0F2C59] sm:text-lg">
              {tutor.display_name}
            </h3>
            <div className="ui-shiny-rating ui-shiny-rating-sweep shrink-0 text-sm font-bold text-[#E6C699] drop-shadow-[0_1px_0_rgba(0,0,0,0.35)] sm:text-base">
              ⭐ {Number(tutor.average_rating).toFixed(1)}
            </div>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{displayMacauRegion(locale, tutor.district)}</p>
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-zinc-700">{tutor.education_background}</p>

        <p className="text-sm leading-relaxed text-zinc-600">{tutor.subjectSummary || labels.noSubjects}</p>

        <div className="mt-auto flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap sm:gap-2">
          <ButtonLink
            href={`/${locale}/tutors/${tutor.id}`}
            variant="outline"
            size="sm"
            className="h-11 w-full shrink-0 text-sm sm:h-10 sm:min-h-0 sm:min-w-0 sm:flex-1 sm:text-xs"
          >
            {labels.viewProfile}
          </ButtonLink>
          <ButtonLink
            href={`/${locale}/booking/new?tutorId=${tutor.id}`}
            size="sm"
            className="h-11 w-full shrink-0 text-sm sm:h-10 sm:min-h-0 sm:min-w-0 sm:flex-1 sm:text-xs"
          >
            {labels.book}
          </ButtonLink>
        </div>
      </CardContent>
    </Card>
  );
}
