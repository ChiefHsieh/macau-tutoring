# Netlify 部署失败修复

## 错误：`publish directory cannot be the same as the base directory`

**原因**：Publish directory 留空时，Netlify 会默认成**仓库根目录** `/opt/build/repo`，与 `@netlify/plugin-nextjs` 冲突。

**正确设置**（UI 与 `netlify.toml` 保持一致）：

| 项 | 值 |
|----|-----|
| Build command | `npm run build` |
| **Publish directory** | **`.next`**（必须填写，不要留空，不要用 `out`） |
| Runtime | Next.js |
| Plugin | `@netlify/plugin-nextjs` |

步骤：

1. https://app.netlify.com/projects/astarmarktetplace/configuration/deploys
2. 把 **Publish directory** 改成 **`.next`** → Save
3. **Deploys → Clear cache and deploy site**

## 部署成功后验证

```bash
BASE_URL=https://astarmarktetplace.netlify.app node scripts/verify-download-portal.mjs
```

打开：https://astarmarktetplace.netlify.app/zh-HK/download
