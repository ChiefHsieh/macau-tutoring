"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useFieldArray,
  useForm,
  useWatch,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { z } from "zod";
import { Plus } from "lucide-react";
import { saveTutorProfileAction } from "@/app/[locale]/tutor/profile/setup/actions";
import { trackEvent } from "@/lib/analytics";
import {
  uploadTutorVerificationPdfAction,
  uploadTutorAvatarImageAction,
  type VerificationDocType,
} from "@/app/[locale]/tutor/profile/setup/upload-actions";
import type { TutorProfilePayload } from "@/lib/tutor-profile-schema";
import { tutorProfilePayloadSchema } from "@/lib/tutor-profile-schema";
import {
  flattenSubjectGroups,
  gradeLevelValues,
  isPresetTeachableSubject,
  macauRegionValues,
  macauSubareasByRegion,
  type MacauRegion,
  serializeEducationForDb,
  teachableSubjectOptions,
  type EducationEntry,
  type GradeLevel,
  type SubjectGroup,
} from "@/lib/tutor-setup-form-helpers";
import { displayMacauRegion, displayMacauSubarea } from "@/lib/macau-location-display";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const serviceTypeValues = ["in-person", "online", "both"] as const;
const EXPERIENCE_MAX_MONTHS = 120;
const AVATAR_CROP_WIDTH = 960;
const AVATAR_CROP_HEIGHT = 540;

function clampExperienceMonths(value: number) {
  return Math.max(0, Math.min(EXPERIENCE_MAX_MONTHS, Math.round(value)));
}

function formatExperienceLabel(months: number, t: (key: string, values?: Record<string, string | number>) => string) {
  const safe = clampExperienceMonths(months);
  if (safe >= EXPERIENCE_MAX_MONTHS) return t("experienceLabel10Plus");
  if (safe === 0) return t("experienceLabelZero");
  const years = Math.floor(safe / 12);
  const restMonths = safe % 12;
  return t("experienceLabelDetailed", { years, months: restMonths });
}

async function getCroppedImageBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const img = document.createElement("img");
  img.src = imageSrc;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image."));
  });

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_CROP_WIDTH;
  canvas.height = AVATAR_CROP_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create canvas context.");

  ctx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    AVATAR_CROP_WIDTH,
    AVATAR_CROP_HEIGHT,
  );

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to crop image."));
        return;
      }
      resolve(blob);
    }, "image/jpeg", 0.92);
  });
}

function buildClientFormSchema(t: (key: string) => string) {
  const educationEntrySchema = z
    .object({
      degree_type: z.string(),
      university: z.string(),
      field_of_study: z.string().min(2),
      year_period: z.string(),
    })
    .superRefine((entry, ctx) => {
      const d = entry.degree_type.trim();
      const u = entry.university.trim();
      const f = entry.field_of_study.trim();
      const y = entry.year_period.trim();
      const legacyOk = d.length === 0 && u.length === 0 && y.length === 0 && f.length >= 5;
      const structuredOk =
        d.length >= 1 && u.length >= 1 && f.length >= 1 && y.length >= 1;
      if (legacyOk || structuredOk) return;
      ctx.addIssue({
        code: "custom",
        message: t("educationRowRule"),
        path: ["field_of_study"],
      });
    });

  return z
    .object({
      district: z.enum(macauRegionValues),
      service_areas: z.array(z.string().min(1)).min(1, { message: t("serviceAreasRequired") }),
      hourly_rate: z.coerce.number().int().gt(0, { message: t("hourlyRateMinRule") }),
      working_period_start: z.string().min(1),
      working_period_end: z.string().min(1),
      service_type: z.enum(serviceTypeValues),
      subject_groups: z
        .array(
          z.object({
            subject_names: z.array(z.string().min(1)).min(1, { message: t("subjectRequired") }),
            grade_levels: z.array(z.enum(gradeLevelValues)).min(1, { message: t("subjectRequired") }),
          }),
        )
        .min(1, { message: t("subjectRequired") }),
      education_entries: z.array(educationEntrySchema).min(1),
      teaching_experience_months: z.coerce.number().int().min(0).max(EXPERIENCE_MAX_MONTHS),
      bio: z.string().optional(),
      profile_photo: z.string().optional(),
      verification_document: z.string().min(5),
    })
    .refine(
      (value) => {
        const start = new Date(value.working_period_start);
        const end = new Date(value.working_period_end);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
        const diff = end.getTime() - start.getTime();
        return diff / (1000 * 60 * 60 * 24) >= 28;
      },
      { message: t("periodRule"), path: ["working_period_end"] },
    );
}

function pickStepFromClientErrors(errs: FieldErrors<ClientFormInput>): number {
  if (errs.district || errs.service_areas) return 0;
  if (errs.hourly_rate || errs.working_period_start || errs.working_period_end || errs.service_type) {
    return 1;
  }
  if (errs.subject_groups) return 2;
  if (errs.education_entries || errs.teaching_experience_months || errs.bio || errs.profile_photo) return 3;
  if (errs.verification_document) return 4;
  return 0;
}

function firstNestedErrorMessage(errs: FieldErrors<ClientFormInput>): string | null {
  for (const v of Object.values(errs)) {
    if (v == null) continue;
    if (typeof v === "object" && "message" in v && typeof (v as { message?: string }).message === "string") {
      return (v as { message: string }).message;
    }
    if (typeof v === "object") {
      const inner = firstNestedErrorMessage(v as FieldErrors<ClientFormInput>);
      if (inner) return inner;
    }
  }
  return null;
}

export type ClientFormInput = {
  district: MacauRegion;
  service_areas: string[];
  hourly_rate: number;
  working_period_start: string;
  working_period_end: string;
  service_type: (typeof serviceTypeValues)[number];
  subject_groups: SubjectGroup[];
  education_entries: EducationEntry[];
  teaching_experience_months: number;
  bio?: string;
  profile_photo?: string;
  verification_document: string;
};

type TutorProfileSetupFormProps = {
  locale: string;
  initialValues: ClientFormInput;
};

function toServerPayload(values: ClientFormInput): TutorProfilePayload {
  const subjects = flattenSubjectGroups(values.subject_groups as SubjectGroup[]);
  const education_background = serializeEducationForDb(values.education_entries as EducationEntry[]);
  const expMonths = clampExperienceMonths(values.teaching_experience_months);
  const years = Math.floor(expMonths / 12);
  const months = expMonths % 12;
  const teachingExperience =
    expMonths >= EXPERIENCE_MAX_MONTHS ? "10+ years" : `${years} years ${months} months`;

  return {
    district: values.district,
    service_areas: values.service_areas,
    hourly_rate: Number(values.hourly_rate),
    working_period_start: values.working_period_start,
    working_period_end: values.working_period_end,
    service_type: values.service_type,
    subjects,
    education_background,
    teaching_experience: teachingExperience,
    bio: values.bio,
    profile_photo: values.profile_photo,
    verification_document: values.verification_document,
  };
}

export function TutorProfileSetupForm({ locale, initialValues }: TutorProfileSetupFormProps) {
  const t = useTranslations("TutorSetup");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [verificationDocType, setVerificationDocType] = useState<VerificationDocType | "">("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarCropPixels, setAvatarCropPixels] = useState<Area | null>(null);
  /** Shown next to file input (native “No file chosen” hidden via CSS). */
  const [avatarPickLine, setAvatarPickLine] = useState("");
  const [pdfPickLine, setPdfPickLine] = useState("");
  const [isAdvancingStep, setIsAdvancingStep] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const clientFormSchema = useMemo(() => buildClientFormSchema(t), [t]);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    clearErrors,
    formState: { errors, touchedFields, isSubmitted },
  } = useForm<ClientFormInput>({
    resolver: zodResolver(clientFormSchema) as Resolver<ClientFormInput>,
    defaultValues: initialValues,
  });

  const { fields: subjectFields } = useFieldArray({
    control,
    name: "subject_groups",
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control,
    name: "education_entries",
  });

  const watchedSubjectGroups = useWatch({ control, name: "subject_groups" });
  const watchedDistrict = useWatch({ control, name: "district" });
  const watchedAreas = useWatch({ control, name: "service_areas" });
  const watchedRate = useWatch({ control, name: "hourly_rate" });
  const watchedExpMonths = useWatch({ control, name: "teaching_experience_months" });
  const watchedPhoto = useWatch({ control, name: "profile_photo" });
  const watchedVerification = useWatch({ control, name: "verification_document" });

  const stepFields = useMemo(
    () =>
      [
        ["district", "service_areas"],
        ["hourly_rate", "working_period_start", "working_period_end", "service_type"],
        ["subject_groups"],
        ["education_entries", "teaching_experience_months", "bio", "profile_photo"],
        ["verification_document"],
      ] as const,
    [],
  );

  const toggleGradeLevel = (groupIndex: number, grade: GradeLevel) => {
    const path = `subject_groups.${groupIndex}.grade_levels` as const;
    const cur = (getValues(path) ?? []) as GradeLevel[];
    const next = cur.includes(grade) ? cur.filter((g) => g !== grade) : [...cur, grade];
    setValue(path, next, { shouldDirty: true, shouldValidate: true });
  };

  const toggleSubjectName = (groupIndex: number, name: string) => {
    const path = `subject_groups.${groupIndex}.subject_names` as const;
    const cur = (getValues(path) ?? []) as string[];
    const next = cur.includes(name) ? cur.filter((s) => s !== name) : [...cur, name];
    setValue(path, next, { shouldDirty: true, shouldValidate: true });
  };

  const toggleServiceArea = (area: string) => {
    const cur = (getValues("service_areas") ?? []) as string[];
    const next = cur.includes(area) ? cur.filter((x) => x !== area) : [...cur, area];
    setValue("service_areas", next, { shouldDirty: true, shouldValidate: true });
  };

  const nextStep = async () => {
    setIsAdvancingStep(true);
    try {
      setSubmitError(null);
      const ok = await trigger(stepFields[step] as never);
      if (!ok) return;
      // Avoid showing step-5 required error before user reaches/submits step 5.
      if (step < 4) clearErrors("verification_document");
      setStep((prev) => Math.min(prev + 1, 4));
    } finally {
      setIsAdvancingStep(false);
    }
  };

  const prevStep = () => {
    setSubmitError(null);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const onInvalid = (formErrors: FieldErrors<ClientFormInput>) => {
    const detail = firstNestedErrorMessage(formErrors);
    setSubmitError(
      detail ? `${t("submitBlockedFixEarlierSteps")}（${detail}）` : t("submitBlockedFixEarlierSteps"),
    );
    setStep(pickStepFromClientErrors(formErrors));
  };

  const mapServerSubmitError = (raw: string) => {
    if (raw === "tutor_hourly_rate_positive") return t("hourlyRateMinRule");
    return raw;
  };

  const onSubmit = (values: ClientFormInput) => {
    setSubmitError(null);
    setIsSaving(true);
    (async () => {
      try {
        const payload = toServerPayload(values);
        const parsed = tutorProfilePayloadSchema.safeParse(payload);
        if (!parsed.success) {
          const msg = parsed.error.issues[0]?.message ?? "Invalid input.";
          const path0 = parsed.error.issues[0]?.path[0];
          if (path0 === "district" || path0 === "service_areas") {
            setStep(0);
          } else if (path0 === "working_period_start" || path0 === "working_period_end") {
            setStep(1);
          } else if (path0 === "subjects") {
            setStep(2);
          } else if (
            path0 === "education_background" ||
            path0 === "teaching_experience" ||
            path0 === "bio" ||
            path0 === "profile_photo"
          ) {
            setStep(3);
          } else if (path0 === "verification_document") {
            setStep(4);
          }
          setSubmitError(msg);
          return;
        }

        trackEvent("tutor_setup_submit", { locale });
        const result = await saveTutorProfileAction({ locale, payload: parsed.data });
        if (!result.ok) {
          setSubmitError(mapServerSubmitError(result.error ?? "Save failed."));
          return;
        }

        router.push(`/${locale}/tutor/profile/submitted?saved=1`);
        router.refresh();
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Save failed.");
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const handlePdfFileSelect = () => {
    setUploadError(null);
    const file = pdfInputRef.current?.files?.[0];
    if (!file) {
      setPdfPickLine("");
      return;
    }
    if (file.type !== "application/pdf") {
      setUploadError(t("verificationPdfTypeRule"));
      setPdfPickLine("");
      if (pdfInputRef.current) pdfInputRef.current.value = "";
      return;
    }
    setPdfPickLine(file.name);
  };

  const handlePdfUpload = async () => {
    setUploadError(null);
    const input = pdfInputRef.current;
    const file = input?.files?.[0];
    if (!verificationDocType) {
      setUploadError(t("pickDocType"));
      return;
    }
    if (!file) {
      setUploadError(t("pickPdfFile"));
      return;
    }

    const fd = new FormData();
    fd.append("locale", locale);
    fd.append("documentType", verificationDocType);
    fd.append("file", file);

    setIsUploadingPdf(true);
    try {
      const res = await uploadTutorVerificationPdfAction(fd);
      if (!res.ok) {
        setUploadError(res.error);
        return;
      }
      setValue("verification_document", res.publicUrl, { shouldValidate: true, shouldDirty: true });
      setPdfPickLine(t("verificationPdfAfterUploadLine"));
      trackEvent("upload_success", { locale });
      toast.success(t("uploadSuccessToast"));
      if (input) input.value = "";
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleAvatarFileSelect = () => {
    setAvatarUploadError(null);
    const file = avatarInputRef.current?.files?.[0];
    if (!file) {
      setAvatarPickLine("");
      return;
    }
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setAvatarUploadError(t("avatarTypeRule"));
      setAvatarPickLine("");
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }
    setAvatarPickLine(file.name);
    if (avatarSrc) URL.revokeObjectURL(avatarSrc);
    const objectUrl = URL.createObjectURL(file);
    setAvatarSrc(objectUrl);
    setAvatarZoom(1);
    setAvatarCrop({ x: 0, y: 0 });
    setAvatarCropPixels(null);
  };

  useEffect(() => {
    return () => {
      if (avatarSrc) URL.revokeObjectURL(avatarSrc);
    };
  }, [avatarSrc]);

  useEffect(() => {
    let cancelled = false;
    const buildPreview = async () => {
      if (!avatarSrc || !avatarCropPixels) {
        setAvatarPreviewUrl(null);
        return;
      }
      try {
        const blob = await getCroppedImageBlob(avatarSrc, avatarCropPixels);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setAvatarPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch {
        if (!cancelled) setAvatarPreviewUrl(null);
      }
    };
    void buildPreview();
    return () => {
      cancelled = true;
    };
  }, [avatarSrc, avatarCropPixels]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const handleAvatarUpload = async () => {
    setAvatarUploadError(null);
    if (!avatarSrc || !avatarCropPixels) {
      setAvatarUploadError(t("avatarPickAndCrop"));
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const croppedBlob = await getCroppedImageBlob(avatarSrc, avatarCropPixels);
      const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      const fd = new FormData();
      fd.append("locale", locale);
      fd.append("file", croppedFile);

      const res = await uploadTutorAvatarImageAction(fd);
      if (!res.ok) {
        setAvatarUploadError(res.error);
        return;
      }
      setValue("profile_photo", res.publicUrl, { shouldDirty: true, shouldValidate: true });
      toast.success(t("avatarUploadSuccess"));
      trackEvent("avatar_upload_success", { locale });
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      URL.revokeObjectURL(avatarSrc);
      setAvatarSrc(null);
      setAvatarPickLine(t("avatarAfterUploadLine"));
    } catch (error) {
      setAvatarUploadError(error instanceof Error ? error.message : t("avatarUploadFailed"));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      <p className="text-sm text-[#E2E8F0]">{t(`step${step + 1}Instruction`)}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Badge>
          {t("step")} {step + 1} / 5
        </Badge>
        <Tabs value={`step-${step}`} className="w-full overflow-x-auto">
          <TabsList className="grid min-w-[360px] grid-cols-5 md:min-w-0 md:w-full">
            {[0, 1, 2, 3, 4].map((idx) => (
              <TabsTrigger key={idx} value={`step-${idx}`} disabled>
                {idx + 1}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {step >= 1 ? (
        <Card className="border border-[#1A2456] bg-[#0A0F35]">
          <CardContent className="space-y-1 pt-4 text-xs text-[#E2E8F0]">
            <p className="font-semibold text-[#FFFFFF]">{t("summaryTitle")}</p>
            <p>
              {t("summaryDistrict", {
                district: displayMacauRegion(locale, watchedDistrict ?? "—"),
              })}
            </p>
            <p>{t("summaryAreas", { count: watchedAreas?.length ?? 0 })}</p>
            <p>{t("summaryRate", { rate: watchedRate != null ? String(watchedRate) : "—" })}</p>
            <p>{t("summarySubjects", { count: watchedSubjectGroups?.length ?? 0 })}</p>
            <p>
              {t("summaryExperience", {
                snippet: formatExperienceLabel(watchedExpMonths ?? 0, t),
              })}
            </p>
            <p>
              {t("summaryVerification", {
                state: t(
                  (watchedVerification ?? "").trim().length >= 5
                    ? "summaryVerificationYes"
                    : "summaryVerificationNo",
                ),
              })}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {step === 0 ? (
        <Card>
          <CardContent className="grid gap-4 pt-6">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-white">{t("district")}</legend>
              <input type="hidden" {...register("district")} />
              <div className="flex flex-wrap gap-2">
                {macauRegionValues.map((item) => (
                  <Button
                    key={item}
                    type="button"
                    size="sm"
                    variant={watchedDistrict === item ? "default" : "outline"}
                    className="text-xs"
                    onClick={() => {
                      setValue("district", item, { shouldDirty: true, shouldValidate: true });
                    }}
                  >
                    {displayMacauRegion(locale, item)}
                  </Button>
                ))}
              </div>
              {errors.district ? (
                <p className="mt-1 text-xs text-red-600">{errors.district.message as string}</p>
              ) : null}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-white">{t("serviceAreas")}</legend>
              <div className="flex flex-wrap gap-2">
                {macauSubareasByRegion[watchedDistrict ?? "澳門半島"].map((area) => {
                  const selected = watchedAreas?.includes(area) ?? false;
                  return (
                    <Button
                      key={area}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      onClick={() => toggleServiceArea(area)}
                    >
                      {displayMacauSubarea(locale, area)}
                    </Button>
                  );
                })}
              </div>
              {errors.service_areas ? (
                <p className="mt-1 text-xs text-red-600">{errors.service_areas.message as string}</p>
              ) : null}
            </fieldset>
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <CardContent className="grid gap-4 pt-6">
            <label className="text-sm">
              {t("hourlyRate")}
              <Input
                type="number"
                min={1}
                {...register("hourly_rate")}
                className="mt-1 w-full"
              />
              {errors.hourly_rate ? (
                <p className="mt-1 text-xs text-red-600">{errors.hourly_rate.message}</p>
              ) : null}
            </label>
            <label className="text-sm">
              {t("workingStart")}
              <Input type="date" {...register("working_period_start")} className="mt-1 w-full" />
            </label>
            <label className="text-sm">
              {t("workingEnd")}
              <Input type="date" {...register("working_period_end")} className="mt-1 w-full" />
              {errors.working_period_end ? (
                <p className="mt-1 text-xs text-red-600">{errors.working_period_end.message}</p>
              ) : null}
            </label>
            <label className="text-sm">
              {t("serviceType")}
              <Select {...register("service_type")} className="mt-1 w-full">
                {serviceTypeValues.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </label>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-[#4E5969]">{t("subjectGradesHint")}</p>
            {subjectFields.map((field, index) => {
              const names = watchedSubjectGroups?.[index]?.subject_names ?? [];
              const extras = names.filter((n) => !isPresetTeachableSubject(n));
              return (
                <div key={field.id} className="grid gap-3 rounded-md border border-[#1A2456] bg-[#0A0F35] p-3">
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-white">{t("subject")}</legend>
                    <div className="flex flex-wrap gap-2">
                      {teachableSubjectOptions.map((subj) => {
                        const selected = names.includes(subj);
                        return (
                          <Button
                            key={subj}
                            type="button"
                            variant={selected ? "default" : "outline"}
                            size="sm"
                            className="text-xs"
                            onClick={() => toggleSubjectName(index, subj)}
                          >
                            {subj}
                          </Button>
                        );
                      })}
                    </div>
                    {extras.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-[#4E5969]">{t("savedSubjectsNotInList")}</span>
                        {extras.map((n) => (
                          <Button
                            key={n}
                            type="button"
                            variant="default"
                            size="sm"
                            className="text-xs"
                            onClick={() => toggleSubjectName(index, n)}
                          >
                            {n} ×
                          </Button>
                        ))}
                      </div>
                    ) : null}
                    {errors.subject_groups?.[index]?.subject_names ? (
                      <p className="text-xs text-red-600">
                        {errors.subject_groups[index]?.subject_names?.message as string}
                      </p>
                    ) : null}
                  </fieldset>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-white">{t("gradeLevels")}</legend>
                    <div className="flex flex-wrap gap-2">
                      {gradeLevelValues.map((grade) => {
                        const selected =
                          watchedSubjectGroups?.[index]?.grade_levels?.includes(grade) ?? false;
                        return (
                          <Button
                            key={grade}
                            type="button"
                            variant={selected ? "default" : "outline"}
                            size="sm"
                            className="text-xs"
                            onClick={() => toggleGradeLevel(index, grade)}
                          >
                            {grade}
                          </Button>
                        );
                      })}
                    </div>
                    {errors.subject_groups?.[index]?.grade_levels ? (
                      <p className="text-xs text-red-600">
                        {errors.subject_groups[index]?.grade_levels?.message as string}
                      </p>
                    ) : null}
                  </fieldset>
                </div>
              );
            })}

            {errors.subject_groups?.root?.message ? (
              <p className="text-xs text-red-600">{errors.subject_groups.root.message as string}</p>
            ) : null}
            {typeof errors.subject_groups?.message === "string" ? (
              <p className="text-xs text-red-600">{errors.subject_groups.message}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <CardContent className="grid gap-4 pt-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">{t("education")}</p>
              {educationFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-md border border-[#1A2456] bg-[#0A0F35] p-3 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <label className="text-sm">
                    {t("degreeType")}
                    <Input {...register(`education_entries.${index}.degree_type`)} className="mt-1 w-full" />
                    {errors.education_entries?.[index]?.degree_type ? (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.education_entries[index]?.degree_type?.message as string}
                      </p>
                    ) : null}
                  </label>
                  <label className="text-sm">
                    {t("university")}
                    <Input {...register(`education_entries.${index}.university`)} className="mt-1 w-full" />
                    {errors.education_entries?.[index]?.university ? (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.education_entries[index]?.university?.message as string}
                      </p>
                    ) : null}
                  </label>
                  <label className="text-sm">
                    {t("fieldOfStudy")}
                    <Input {...register(`education_entries.${index}.field_of_study`)} className="mt-1 w-full" />
                    {errors.education_entries?.[index]?.field_of_study ? (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.education_entries[index]?.field_of_study?.message as string}
                      </p>
                    ) : null}
                  </label>
                  <label className="text-sm">
                    {t("yearPeriod")}
                    <Input {...register(`education_entries.${index}.year_period`)} className="mt-1 w-full" />
                    {errors.education_entries?.[index]?.year_period ? (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.education_entries[index]?.year_period?.message as string}
                      </p>
                    ) : null}
                  </label>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEducation(index)}
                      disabled={educationFields.length <= 1}
                    >
                      {t("removeEducation")}
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="default"
                size="default"
                className="w-full gap-2 shadow-md sm:w-auto"
                onClick={() =>
                  appendEducation({
                    degree_type: "",
                    university: "",
                    field_of_study: "",
                    year_period: "",
                  })
                }
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                {t("addEducation")}
              </Button>
              {errors.education_entries?.root?.message ? (
                <p className="text-xs text-red-600">{errors.education_entries.root.message as string}</p>
              ) : null}
            </div>

            <label className="text-sm">
              {t("experience")}
              <input
                type="range"
                min={0}
                max={EXPERIENCE_MAX_MONTHS}
                step={1}
                {...register("teaching_experience_months", { valueAsNumber: true })}
                className="mt-2 w-full"
              />
              <p className="mt-2 text-sm text-[#4E5969]">
                {formatExperienceLabel(watchedExpMonths ?? 0, t)}
              </p>
              <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                <span>{t("experienceMinLabel")}</span>
                <span>{t("experienceMaxLabel")}</span>
              </div>
              {errors.teaching_experience_months ? (
                <p className="mt-1 text-xs text-red-600">{errors.teaching_experience_months.message}</p>
              ) : null}
            </label>
            <label className="text-sm">
              {t("bio")}
              <Textarea {...register("bio")} rows={3} className="mt-1 w-full" />
            </label>
            <label className="text-sm">
              {t("profilePhoto")}
              <input type="hidden" {...register("profile_photo")} />
              <div className="mt-2 space-y-3 rounded-md border border-[#1A2456] bg-[#0A0F35] p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleAvatarFileSelect}
                    className="ui-file-input ui-file-input--no-native-name block w-full min-w-0 cursor-pointer text-sm sm:max-w-[min(100%,280px)]"
                  />
                  <p
                    className="min-w-0 flex-1 pt-0 text-xs leading-snug text-zinc-400 sm:pt-2"
                    aria-live="polite"
                  >
                    {avatarPickLine ||
                      (watchedPhoto ? t("avatarExistingPhotoHint") : t("avatarNoFileSelected"))}
                  </p>
                </div>
                {avatarSrc ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="relative h-56 w-full overflow-hidden rounded-md border bg-black/10">
                        <Cropper
                          image={avatarSrc}
                          crop={avatarCrop}
                          zoom={avatarZoom}
                          aspect={16 / 9}
                          onCropChange={setAvatarCrop}
                          onZoomChange={setAvatarZoom}
                          onCropComplete={(_, croppedAreaPixels) => setAvatarCropPixels(croppedAreaPixels)}
                        />
                      </div>
                      <label className="text-xs">
                        {t("avatarZoom")}
                        <input
                          type="range"
                          min={1}
                          max={3}
                          step={0.05}
                          value={avatarZoom}
                          onChange={(e) => setAvatarZoom(Number(e.target.value))}
                          className="mt-1 w-full"
                        />
                      </label>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-white">{t("avatarCardPreviewTitle")}</p>
                      <div className="overflow-hidden rounded-md border bg-white">
                        <div className="relative aspect-[16/9] w-full bg-[#101742]">
                          {avatarPreviewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={avatarPreviewUrl}
                              alt="avatar preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                              {t("avatarPreviewEmpty")}
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 rounded-md bg-[#1D2129]/80 px-2 py-1 text-[10px] font-semibold text-white">
                            MOP{watchedRate ?? 100}/hr
                          </div>
                        </div>
                        <div className="space-y-1 p-2">
                          <p className="text-sm font-semibold text-white">{t("avatarPreviewTutorName")}</p>
                          <p className="text-xs text-zinc-600">
                            {displayMacauRegion(locale, watchedDistrict ?? "澳門半島")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" onClick={handleAvatarUpload} disabled={isUploadingAvatar}>
                    {isUploadingAvatar ? t("avatarUploading") : t("avatarUploadCropped")}
                  </Button>
                  {watchedPhoto ? <Badge variant="success">{t("avatarLinkedBadge")}</Badge> : null}
                </div>
                {avatarUploadError ? <p className="text-xs text-red-600">{avatarUploadError}</p> : null}
                <p className="text-xs text-zinc-500">{t("avatarHint")}</p>
                <p className="text-xs text-zinc-500">{t("avatarReplaceHint")}</p>
              </div>
              {errors.profile_photo ? (
                <p className="mt-1 text-xs text-red-600">{errors.profile_photo.message as string}</p>
              ) : null}
            </label>
          </CardContent>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card>
          <CardContent className="grid gap-4 pt-6">
            <input type="hidden" {...register("verification_document")} />
            <p className="text-sm text-[#4E5969]">{t("verificationPdfIntro")}</p>
            <p className="text-xs text-zinc-600">{t("verificationSampleNote")}</p>
            <label className="text-sm">
              {t("verificationDocType")}
              <Select
                className="mt-1 w-full"
                value={verificationDocType}
                onChange={(e) =>
                  setVerificationDocType((e.target.value || "") as VerificationDocType | "")
                }
              >
                <option value="">{t("verificationDocTypePlaceholder")}</option>
                <option value="transcript">{t("docTypeTranscript")}</option>
                <option value="offer">{t("docTypeOffer")}</option>
                <option value="proof">{t("docTypeProof")}</option>
              </Select>
            </label>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">{t("verificationPdfFile")}</label>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfFileSelect}
                  className="ui-file-input ui-file-input--no-native-name block w-full min-w-0 cursor-pointer text-sm sm:max-w-[min(100%,280px)]"
                />
                <p
                  className="min-w-0 flex-1 pt-0 text-xs leading-snug text-zinc-400 sm:pt-2"
                  aria-live="polite"
                >
                  {pdfPickLine ||
                    (watchedVerification ? t("verificationPdfExistingHint") : t("verificationPdfNoFileSelected"))}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" disabled={isUploadingPdf} onClick={handlePdfUpload}>
                  {isUploadingPdf ? t("uploadingPdf") : t("uploadPdf")}
                </Button>
                {watchedVerification ? <Badge variant="success">{t("uploadLinkedBadge")}</Badge> : null}
              </div>
              {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
              <p className="text-xs text-zinc-500">{t("verificationPdfReplaceHint")}</p>
            </div>
            {errors.verification_document && (touchedFields.verification_document || isSubmitted) ? (
              <p className="mt-1 text-xs text-red-600">{errors.verification_document.message}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-1 md:flex-nowrap">
        {submitError ? (
          <p className="w-full rounded-md bg-red-100 px-3 py-2 text-sm" style={{ color: "#000000" }}>
            {submitError}
          </p>
        ) : null}
        <Button type="button" onClick={prevStep} variant="outline" disabled={step === 0 || isSaving} className="w-[48%] md:w-auto">
          {t("previous")}
        </Button>

        {step < 4 ? (
          <Button type="button" onClick={nextStep} disabled={isSaving || isAdvancingStep} className="w-[48%] md:w-auto">
            {isAdvancingStep ? tCommon("loading") : t("next")}
          </Button>
        ) : (
          <Button type="submit" disabled={isSaving} className="w-[48%] md:w-auto">
            {isSaving ? t("saving") : t("submit")}
          </Button>
        )}
      </div>

      {errors.working_period_start || errors.working_period_end ? (
        <p className="text-xs text-red-600">{errors.working_period_end?.message ?? t("periodRule")}</p>
      ) : null}
    </form>
  );
}

