import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <Card className="ui-hover-lift group overflow-hidden p-0">
      <div className="relative h-40 w-full bg-[#F7F9FC]">
        {tutor.profile_photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tutor.profile_photo}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-[#4E5969]">
            {initials}
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {tutor.is_verified ? (
            <Badge variant="default" className="font-medium">
              {labels.verified}
            </Badge>
          ) : null}
          <Badge variant="default" className="border-0 bg-white/90 font-medium text-[#1D2129] shadow-sm">
            {serviceLabel(tutor.service_type, labels)}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3 rounded-md bg-[#0F2C59]/90 px-2 py-1 text-xs font-bold text-[#DAC0A3]">
          MOP{tutor.hourly_rate}/hr
        </div>
      </div>

      <CardContent className="space-y-2 p-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold leading-snug tracking-tight text-[#0F2C59]">{tutor.display_name}</h3>
            <p className="text-sm text-zinc-600">{tutor.district}</p>
          </div>
          <div className="text-right text-xs text-zinc-600">
            <div className="font-semibold text-zinc-900">⭐ {Number(tutor.average_rating).toFixed(1)}</div>
            <div>
              {tutor.total_reviews} {labels.reviews}
            </div>
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-zinc-700">{tutor.education_background}</p>

        <p className="text-xs text-zinc-600">{tutor.subjectSummary || labels.noSubjects}</p>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild variant="outline" size="sm" className="min-w-0 flex-1 text-xs">
            <Link href={`/${locale}/tutors/${tutor.id}`}>{labels.viewProfile}</Link>
          </Button>
          <Button asChild size="sm" className="min-w-0 flex-1 text-xs">
            <Link href={`/${locale}/booking/new?tutorId=${tutor.id}`}>{labels.book}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
