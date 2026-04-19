export const site = {
  title: import.meta.env.SITE_TITLE ?? "Catwarrior / Personal Router",
  description:
    import.meta.env.SITE_DESCRIPTION ??
    "仿照 4router 视觉语言打造的个人博客，连接博客、GitHub 与 Obsidian。",
  githubUsername: import.meta.env.GITHUB_USERNAME ?? "octocat",
  nav: [
    { href: "/", label: "Home" },
    { href: "/blog", label: "Blog" },
    { href: "/notes", label: "Notes" },
    { href: "/projects", label: "Projects" }
  ]
};

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}
