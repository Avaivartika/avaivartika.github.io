import { useMemo, useState } from "react";
import Fuse from "fuse.js";

type SearchDocument = {
  kind: string;
  href: string;
  title: string;
  description: string;
  tags: string[];
};

export function SearchPanel({ documents }: { documents: SearchDocument[] }) {
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(documents, {
        keys: ["title", "description", "tags"],
        threshold: 0.35
      }),
    [documents]
  );

  const results = query
    ? fuse.search(query).map((item) => item.item)
    : documents.slice(0, 6);

  return (
    <section className="search-shell card">
      <div className="section-kicker">Search / Command</div>
      <h2>快速找到文章、笔记、项目</h2>
      <input
        className="search-input"
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="试试搜索 obsidian / github / workflow"
      />
      <div className="search-results">
        {results.map((item) => (
          <a key={item.href} href={item.href} className="search-item">
            <div>
              <span className="mini-pill">{item.kind}</span>
              <strong>{item.title}</strong>
            </div>
            <p>{item.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
