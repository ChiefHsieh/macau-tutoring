# 发版前最小回归清单（约 10 条）

在灰度或正式发布前，用真实 Supabase 环境按顺序执行。未配置 Supabase 时跳过数据库相关步骤。

1. **首页加载**：打开 `/{locale}`（zh-HK / en），首屏无白屏、无控制台报错；三条价值文案与统计卡可见；「最近家長需求」橫滑卡片區可見（無真實數據時為示例 + 黃色說明）。
2. **家长快速表单**：填写年級、科目、電話（可選地區／預算）提交；应跳转 `?lead=1` 并出现成功提示与 toast；Supabase `parent_leads` 新增一行且 `lead_source = homepage_quick_form`。
3. **表单校验错误**：故意留空电话提交，应出现错误提示（URL `error=` + toast），不得静默失败。
4. **导师注册与登录**：新用户注册为导师，可进入资料设置页。
5. **导师资料 5 步全流程**：从第 1 步填到第 5 步，上传 PDF（桶与 policy 已配置），确认 URL 自动回填且显示「已保存文件連結」类反馈；最终保存成功跳转 `/tutor/profile/submitted?saved=1` 并出现成功 toast。
6. **导师资料校验**：在中间步故意触发校验错误，应跳转到对应步骤并显示具体错误文案。
7. **导师控制台**：从待审核页进入控制台，链接可用；无无限「保存中」卡住。
8. **导师目录**：`/tutors` 列表加载、筛选不报错。
9. **学生预约**：以学生身份进入预约页，若有可时段则创建预约；触发 `match_created` 埋点（开发环境见控制台 `[analytics]`）。
10. **FAQ 页**：`/faq` 双语内容与导航、页脚链接可访问。

---

**数据库提醒**：

- 若 `parent_leads` 尚无 `lead_source` / `district` / `budget_max` 列，请执行 `supabase/parent-leads-extend.sql`。
- 若首页需展示**真实匿名需求**（非示例卡片），请执行 `supabase/parent-lead-public-feed.sql`（含触发器与回填）；之后每条新留资会自动写入 `parent_lead_public_feed`。
- 脚本跑完后可用 `supabase/parent-lead-public-feed-verify.sql` 在 SQL Editor 里核对行数与触发器。
- 导师「僅此一次」可用时段依赖表 `tutor_availability_one_off`：请执行 `supabase/tutor-availability-one-off.sql`（或已合并的 `schema.sql` / `rls.sql` 新库）。
