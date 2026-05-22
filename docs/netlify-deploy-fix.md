# Netlify 部署失败修复（必做一次）

若 GitHub 已 push 但 https://astarmarktetplace.netlify.app/zh-HK/download 仍 404：

1. 打开 https://app.netlify.com/projects/astarmarktetplace/configuration/deploys
2. **Build settings**：
   - Build command: `npm run build`
   - **Publish directory：留空**（删除 `out` 或 `.next`）
3. **Plugins**：保留 **@netlify/plugin-nextjs**（不要重复添加）
4. **Domain management → HTTPS**：开启 **Force HTTPS**
5. 点击 **Deploys → Trigger deploy → Deploy site**

部署成功后运行：

```bash
BASE_URL=https://astarmarktetplace.netlify.app node scripts/verify-download-portal.mjs
```
