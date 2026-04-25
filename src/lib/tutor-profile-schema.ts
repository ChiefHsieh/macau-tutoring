import { z } from "zod";

const districtValues = ["Macau Peninsula", "Taipa", "Coloane", "澳門半島", "氹仔", "路環", "路氹城"] as const;
const serviceTypeValues = ["in-person", "online", "both"] as const;
const gradeLevelValues = [
  "小學1-6年級",
  "初中1-3年級",
  "高一",
  "高二",
  "高三",
  "澳門四校聯考",
  "IGCSE",
  "IB",
  "A-Level",
  "IELTS",
  "TOEFL",
  "SAT",
] as const;

export const tutorProfilePayloadSchema = z
  .object({
    district: z.enum(districtValues),
    hourly_rate: z.number().int().min(100),
    working_period_start: z.string().min(1),
    working_period_end: z.string().min(1),
    service_type: z.enum(serviceTypeValues),
    subjects: z
      .array(
        z.object({
          subject: z.string().min(1),
          grade_level: z.enum(gradeLevelValues),
        }),
      )
      .min(1),
    education_background: z.string().min(5),
    teaching_experience: z.string().min(2),
    bio: z.string().optional(),
    profile_photo: z.string().optional(),
    verification_document: z.string().min(5),
    service_areas: z.array(z.string().min(1)).min(1),
  })
  .refine(
    (value) => {
      const start = new Date(value.working_period_start);
      const end = new Date(value.working_period_end);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
      const diff = end.getTime() - start.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      return days >= 28;
    },
    { message: "Working period must be at least 1 month.", path: ["working_period_end"] },
  );

export type TutorProfilePayload = z.infer<typeof tutorProfilePayloadSchema>;
