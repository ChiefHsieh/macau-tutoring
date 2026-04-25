# 路线图执行状态（摘要）

本文跟踪用户路线图各阶段完成情况；详细发版验证见 `REGRESSION-CHECKLIST.md`。

## 第 0 阶段（稳定性）

- [x] 导师多步表单可提交、错误可见、上传后保存链路
- [x] `display_name` 等列：见 `supabase/fix-tutor-profiles-display-name.sql` 与代码回退
- [x] 上传策略：桶名 / policy SQL 仓库内可查；客户端错误提示与 Badge 状态
- [x] 提交失败可见化（`onInvalid`、分步 `trigger`、`submitError`）
- [x] 成功反馈：toast（Sonner）、待审核页、`?saved=1` query
- [x] 最小回归清单：`docs/REGRESSION-CHECKLIST.md`
- [x] 基础埋点：`lead_submit`、`tutor_setup_submit`、`upload_success`、`match_created`（→ `/api/analytics`）

## 第 1 阶段（核心成交路径）

- [x] 首页即时价值文案、三指标卡、平台保障模块、最新导师区（标题与数据）
- [x] 家长精简留资 + `lead_source` / 地区 / 预算（需执行 `parent-leads-extend.sql`）
- [x] 导师：上传回填、文件说明、步骤摘要、待审核状态页
- [x] 「最近学生需求」卡片流：无 `parent_lead_public_feed` 时用本地化示例；执行 SQL 后与触发器同步真数据
- [ ] Step 导航可点击回看（当前为只读 Tabs 指示）

## 第 2 阶段（平台感）

- [ ] 规则评分匹配 + TOP N 展示 + 日志表
- [ ] Feed 统一卡片与排序策略
- [ ] FAQ 扩展为独立政策条款页（当前为高频 8 条 FAQ）

## 第 3–4 阶段

- [ ] 线索 CRM、通知、费用透明、SEO/性能/A/B 等（未启动）

---

**节奏建议**：周一冻结需求 → 周二至周四开发与联调 → 周五灰度 → 周六复盘更新本文件勾选。
