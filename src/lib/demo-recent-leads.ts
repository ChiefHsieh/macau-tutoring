/** Fallback rows when `parent_lead_public_feed` is temporarily empty. */

export type DemoLeadRow = {
  lead_id: string;
  child_grade: string;
  subject: string;
  district: string | null;
  budget_max: number | null;
  created_at: string;
};

export function getDemoRecentLeadRows(locale: string): DemoLeadRow[] {
  if (locale === "en") {
    return [
      {
        lead_id: "req-en-20260427-01",
        child_grade: "A-LEVEL",
        subject: "Math",
        district: "Macau Peninsula",
        budget_max: 250,
        created_at: "2026-04-27T12:00:00+08:00",
      },
      {
        lead_id: "req-en-20260426-02",
        child_grade: "IB",
        subject: "Physics",
        district: "Taipa",
        budget_max: 280,
        created_at: "2026-04-26T12:00:00+08:00",
      },
      {
        lead_id: "req-en-20260425-03",
        child_grade: "DSE",
        subject: "English",
        district: "Cotai",
        budget_max: 230,
        created_at: "2026-04-25T12:00:00+08:00",
      },
      {
        lead_id: "req-en-20260424-04",
        child_grade: "IGCSE",
        subject: "Math",
        district: "Macau Peninsula",
        budget_max: 220,
        created_at: "2026-04-24T12:00:00+08:00",
      },
      {
        lead_id: "req-en-20260423-05",
        child_grade: "Form 4-6",
        subject: "Physics",
        district: "Taipa",
        budget_max: 200,
        created_at: "2026-04-23T12:00:00+08:00",
      },
      {
        lead_id: "req-en-20260422-06",
        child_grade: "Primary 5-6",
        subject: "English",
        district: "Macau Peninsula",
        budget_max: 130,
        created_at: "2026-04-22T12:00:00+08:00",
      },
      {
        lead_id: "req-en-20260421-07",
        child_grade: "Form 1-3",
        subject: "Math",
        district: "Coloane",
        budget_max: 150,
        created_at: "2026-04-21T12:00:00+08:00",
      },
      {
        lead_id: "req-en-20260420-08",
        child_grade: "A-LEVEL",
        subject: "English",
        district: "Taipa",
        budget_max: 260,
        created_at: "2026-04-20T12:00:00+08:00",
      },
    ];
  }

  return [
    {
      lead_id: "req-zh-20260427-01",
      child_grade: "A-LEVEL",
      subject: "數學",
      district: "澳門半島",
      budget_max: 250,
      created_at: "2026-04-27T12:00:00+08:00",
    },
    {
      lead_id: "req-zh-20260426-02",
      child_grade: "IB",
      subject: "物理",
      district: "氹仔",
      budget_max: 280,
      created_at: "2026-04-26T12:00:00+08:00",
    },
    {
      lead_id: "req-zh-20260425-03",
      child_grade: "DSE",
      subject: "英文",
      district: "路氹城",
      budget_max: 230,
      created_at: "2026-04-25T12:00:00+08:00",
    },
    {
      lead_id: "req-zh-20260424-04",
      child_grade: "IGCSE",
      subject: "數學",
      district: "澳門半島",
      budget_max: 220,
      created_at: "2026-04-24T12:00:00+08:00",
    },
    {
      lead_id: "req-zh-20260423-05",
      child_grade: "Form 4-6",
      subject: "物理",
      district: "氹仔",
      budget_max: 200,
      created_at: "2026-04-23T12:00:00+08:00",
    },
    {
      lead_id: "req-zh-20260422-06",
      child_grade: "Primary 5-6",
      subject: "英文",
      district: "澳門半島",
      budget_max: 130,
      created_at: "2026-04-22T12:00:00+08:00",
    },
    {
      lead_id: "req-zh-20260421-07",
      child_grade: "Form 1-3",
      subject: "數學",
      district: "路環",
      budget_max: 150,
      created_at: "2026-04-21T12:00:00+08:00",
    },
    {
      lead_id: "req-zh-20260420-08",
      child_grade: "A-LEVEL",
      subject: "英文",
      district: "氹仔",
      budget_max: 260,
      created_at: "2026-04-20T12:00:00+08:00",
    },
  ];
}
