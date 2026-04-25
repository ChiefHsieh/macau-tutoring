/** Placeholder rows when `parent_lead_public_feed` is empty or unavailable. */

export type DemoLeadRow = {
  lead_id: string;
  child_grade: string;
  subject: string;
  district: string | null;
  budget_max: number | null;
  created_at: string;
};

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 3600000).toISOString();
}

export function getDemoRecentLeadRows(locale: string): DemoLeadRow[] {
  if (locale === "en") {
    return [
      {
        lead_id: "demo-en-1",
        child_grade: "P5",
        subject: "Mathematics",
        district: "Taipa",
        budget_max: 220,
        created_at: hoursAgoIso(3),
      },
      {
        lead_id: "demo-en-2",
        child_grade: "F3",
        subject: "English",
        district: "Macau Peninsula",
        budget_max: 280,
        created_at: hoursAgoIso(9),
      },
      {
        lead_id: "demo-en-3",
        child_grade: "S6",
        subject: "Physics",
        district: null,
        budget_max: null,
        created_at: hoursAgoIso(18),
      },
      {
        lead_id: "demo-en-4",
        child_grade: "P2",
        subject: "Chinese",
        district: "Coloane",
        budget_max: 180,
        created_at: hoursAgoIso(26),
      },
    ];
  }

  return [
    {
      lead_id: "demo-zh-1",
      child_grade: "小五",
      subject: "數學",
      district: "氹仔",
      budget_max: 200,
      created_at: hoursAgoIso(2),
    },
    {
      lead_id: "demo-zh-2",
      child_grade: "初三",
      subject: "英文",
      district: "澳門半島",
      budget_max: 260,
      created_at: hoursAgoIso(8),
    },
    {
      lead_id: "demo-zh-3",
      child_grade: "高三",
      subject: "物理",
      district: null,
      budget_max: null,
      created_at: hoursAgoIso(20),
    },
    {
      lead_id: "demo-zh-4",
      child_grade: "小二",
      subject: "中文",
      district: "路環",
      budget_max: 170,
      created_at: hoursAgoIso(30),
    },
  ];
}
