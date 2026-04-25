"use client";

import { submitParentLeadAction } from "@/app/[locale]/leads/actions";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LeadQuickFormLabels = {
  grade: string;
  subject: string;
  district: string;
  budget: string;
  phone: string;
  submit: string;
};

type LeadQuickFormProps = {
  locale: string;
  labels: LeadQuickFormLabels;
};

export function LeadQuickForm({ locale, labels }: LeadQuickFormProps) {
  return (
    <form
      action={async (formData) => {
        trackEvent("lead_submit", {
          lead_source: String(formData.get("lead_source") ?? ""),
        });
        await submitParentLeadAction(formData);
      }}
      className="grid gap-4"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="lead_source" value="homepage_quick_form" />
      <Input name="child_grade" required placeholder={labels.grade} autoComplete="off" />
      <Input name="subject" required placeholder={labels.subject} autoComplete="off" />
      <Input name="district" placeholder={labels.district} autoComplete="off" />
      <Input
        name="budget_max"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder={labels.budget}
        autoComplete="off"
      />
      <Input name="phone" required placeholder={labels.phone} autoComplete="tel" />
      <Button type="submit">{labels.submit}</Button>
    </form>
  );
}
