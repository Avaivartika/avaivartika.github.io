import { getCollection, type CollectionEntry, type CollectionKey } from "astro:content";
import readingTime from "reading-time";

export async function getPublishedCollection<K extends CollectionKey>(kind: K) {
  const items = await getCollection(kind, ({ data }) => !data.draft);
  return items.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function getReadingLabel(entry: CollectionEntry<"blog"> | CollectionEntry<"notes">) {
  return readingTime(entry.body ?? "").text;
}

export async function getSearchDocuments() {
  const [blog, notes, projects] = await Promise.all([
    getPublishedCollection("blog"),
    getPublishedCollection("notes"),
    getPublishedCollection("projects")
  ]);

  return [
    ...blog.map((entry) => mapEntry(entry, "文章", `/blog/${entry.id}/`)),
    ...notes.map((entry) => mapEntry(entry, "笔记", `/notes/${entry.id}/`)),
    ...projects.map((entry) => mapEntry(entry, "项目", `/projects/${entry.id}/`))
  ];
}

function mapEntry(
  entry: CollectionEntry<CollectionKey>,
  kind: string,
  href: string
) {
  return {
    kind,
    href,
    title: entry.data.title,
    description: entry.data.description,
    tags: entry.data.tags
  };
}
