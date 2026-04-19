# Personal Router Blog

一个仿照 `4router.net` 前端气质的个人博客骨架，重点连接：

- 博客文章
- Obsidian 笔记
- GitHub 项目

## 开始

```bash
npm install
npm run dev
```

## 环境变量

创建 `.env`：

```bash
SITE_TITLE="Your Name / Personal Router"
SITE_DESCRIPTION="你的个人博客介绍"
GITHUB_USERNAME="your-github-name"
GITHUB_TOKEN="ghp_xxx_optional"
```

说明：

- `GITHUB_TOKEN` 可选，但配置后可以更稳定地读取 pinned repos。
- 当前已默认配置为 GitHub Pages 用户站点：`https://avaivartika.github.io`

## 部署到 GitHub Pages

仓库名请使用：

```bash
avaivartika.github.io
```

然后：

1. 把当前项目代码推送到这个仓库
2. 在 GitHub 仓库里打开 `Settings -> Pages`
3. `Source` 选择 `GitHub Actions`
4. 保持默认分支为 `main`

项目里已经包含自动部署工作流：

```bash
.github/workflows/deploy.yml
```

只要推送到 `main`，GitHub Pages 就会自动构建并发布。

## Obsidian 同步

```bash
npm run sync:obsidian -- "/absolute/path/to/your/vault"
```

同步脚本会把 Markdown 复制到 `src/content/notes`，没有 frontmatter 的笔记会自动补上最基本的元数据。

## 内容目录

- `src/content/blog`: 正式博客文章
- `src/content/notes`: 公开笔记
- `src/content/projects`: 项目页
