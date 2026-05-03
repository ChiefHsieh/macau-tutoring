-- Seed 8 fixed "最近家長需求" cards for showcase/testing.
-- Safe to re-run: removes prior rows with the same lead_source first.
-- Requires existing trigger `parent_leads_mirror_public_feed` on parent_leads.

begin;

delete from public.parent_leads
where lead_source = 'showcase_202604_cards';

insert into public.parent_leads (
  child_grade,
  subject,
  phone,
  lead_source,
  district,
  budget_max,
  notes,
  created_at
)
values
  ('A-LEVEL', '數學', 'showcase-202604-01', 'showcase_202604_cards', '澳門半島', 250, 'seed-card-1', '2026-04-27T12:00:00+08:00'),
  ('初中1-3年級', '物理', 'showcase-202604-02', 'showcase_202604_cards', '氹仔', 280, 'seed-card-2', '2026-04-26T12:00:00+08:00'),
  ('IELTS', '英文', 'showcase-202604-03', 'showcase_202604_cards', '路氹城', 230, 'seed-card-3', '2026-04-25T12:00:00+08:00'),
  ('小學1-6年級', '數學', 'showcase-202604-04', 'showcase_202604_cards', '澳門半島', 220, 'seed-card-4', '2026-04-24T12:00:00+08:00'),
  ('高二', '物理', 'showcase-202604-05', 'showcase_202604_cards', '氹仔', 200, 'seed-card-5', '2026-04-23T12:00:00+08:00'),
  ('小學1-6年級', '英文', 'showcase-202604-06', 'showcase_202604_cards', '澳門半島', 130, 'seed-card-6', '2026-04-22T12:00:00+08:00'),
  ('初中1-3年級', '數學', 'showcase-202604-07', 'showcase_202604_cards', '路環', 150, 'seed-card-7', '2026-04-21T12:00:00+08:00'),
  ('澳門四校聯考', '數學', 'showcase-202604-08', 'showcase_202604_cards', '氹仔', 260, 'seed-card-8', '2026-04-20T12:00:00+08:00');

commit;

