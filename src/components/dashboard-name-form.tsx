import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { updateDisplayNameAction } from "@/actions/update-display-name";

type DashboardNameFormProps = {
  locale: string;
  returnTo: string;
  currentName: string;
  label: string;
  submitText: string;
  pendingText: string;
};

export function DashboardNameForm({
  locale,
  returnTo,
  currentName,
  label,
  submitText,
  pendingText,
}: DashboardNameFormProps) {
  return (
    <form action={updateDisplayNameAction} className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-200 p-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="return_to" value={returnTo} />
      <div className="min-w-[220px] flex-1">
        <label className="mb-1 block text-xs font-medium text-zinc-700">{label}</label>
        <Input name="full_name" required minLength={2} maxLength={80} defaultValue={currentName} />
      </div>
      <SubmitButton type="submit" size="sm" pendingLabel={pendingText}>
        {submitText}
      </SubmitButton>
    </form>
  );
}
