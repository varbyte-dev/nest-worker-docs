import {
  BookOpen,
  Check,
  ChevronRight,
  Cloud,
  Code2,
  Database,
  Github,
  Languages,
  Menu,
  Package,
  Search,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import toml from "react-syntax-highlighter/dist/esm/languages/prism/toml";
import ts from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { content, DocSection, Lang } from "./content";

SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("toml", toml);
SyntaxHighlighter.registerLanguage("ts", ts);
SyntaxHighlighter.registerLanguage("typescript", ts);

const icons: Record<string, ComponentType<{ size?: number }>> = {
  Start: Terminal,
  Inicio: Terminal,
  Core: Code2,
  Data: Database,
  Datos: Database,
  Runtime: ShieldCheck,
  Tools: Package,
  Herramientas: Package,
  Deploy: Cloud,
};

function parseHash(): { lang: Lang; section: string } {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [maybeLang, maybeSection] = raw.split("/");
  const lang: Lang = maybeLang === "es" ? "es" : "en";
  return { lang, section: maybeSection || "getting-started" };
}

function setHash(lang: Lang, section: string) {
  window.location.hash = `/${lang}/${section}`;
}

export function App() {
  const initial = parseHash();
  const [lang, setLang] = useState<Lang>(initial.lang);
  const [activeId, setActiveId] = useState(initial.section);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const page = content[lang];

  useEffect(() => {
    const onHash = () => {
      const next = parseHash();
      setLang(next.lang);
      setActiveId(next.section);
    };
    window.addEventListener("hashchange", onHash);
    if (!window.location.hash) setHash("en", "getting-started");
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const filteredSections = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return page.sections;
    return page.sections.filter((section) => {
      const haystack = [
        section.group,
        section.title,
        section.description,
        ...section.body,
        ...(section.bullets ?? []),
      ].join(" ").toLowerCase();
      return haystack.includes(term);
    });
  }, [page.sections, query]);

  const active = page.sections.find((section) => section.id === activeId) ?? page.sections[0];
  const grouped = groupSections(filteredSections);

  function navigate(section: DocSection) {
    setActiveId(section.id);
    setHash(lang, section.id);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function switchLanguage() {
    const next = lang === "en" ? "es" : "en";
    setLang(next);
    setHash(next, activeId);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button mobile-only" onClick={() => setMenuOpen(true)} aria-label="Open navigation">
          <Menu size={19} />
        </button>
        <a className="brand" href={`#/${lang}/getting-started`}>
          <span className="brand-mark">nw</span>
          <span>
            <strong>nest-worker</strong>
            <small>v0.2.0 docs</small>
          </span>
        </a>
        <div className="topbar-actions">
          <a className="ghost-link" href="https://www.npmjs.com/package/@varbyte/nest-worker" target="_blank" rel="noreferrer">
            npm
          </a>
          <a className="icon-link" href="https://github.com/varbyte-dev/nest-worker" target="_blank" rel="noreferrer" aria-label="GitHub">
            <Github size={18} />
          </a>
          <button className="language-button" onClick={switchLanguage}>
            <Languages size={16} />
            {page.switchLabel}
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
          <div className="mobile-nav-head">
            <strong>Documentation</strong>
            <button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Close navigation">
              <X size={19} />
            </button>
          </div>
          <label className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={page.searchPlaceholder}
            />
          </label>
          <nav className="nav-list" aria-label="Documentation sections">
            {filteredSections.length === 0 ? (
              <p className="empty-state">{page.noResults}</p>
            ) : (
              Object.entries(grouped).map(([group, sections]) => {
                const Icon = icons[group] ?? BookOpen;
                return (
                  <div className="nav-group" key={group}>
                    <div className="nav-group-label">
                      <Icon size={15} />
                      {group}
                    </div>
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        className={section.id === active.id ? "nav-item active" : "nav-item"}
                        onClick={() => navigate(section)}
                      >
                        <span>{section.title}</span>
                        {section.id === active.id ? <ChevronRight size={15} /> : null}
                      </button>
                    ))}
                  </div>
                );
              })
            )}
          </nav>
        </aside>

        <main className="content">
          <section className="intro">
            <div className="intro-copy">
              <div className="eyebrow">
                <span className="pulse" />
                {page.label}
              </div>
              <h1>{page.title}</h1>
              <p>{page.subtitle}</p>
              <div className="quick-install">
                <code>{page.installCommand}</code>
              </div>
              <div className="badge-row">
                {page.badges.map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              </div>
            </div>
            <div className="visual-panel" aria-hidden="true">
              <img src={`${import.meta.env.BASE_URL}nest-worker-mark.svg`} alt="" />
              <div className="terminal-mini">
                <div>
                  <span />
                  <span />
                  <span />
                </div>
                <pre>nest-worker doctor{"\n"}✓ All checks passed</pre>
              </div>
            </div>
          </section>

          <article className="doc-article">
            <div className="section-heading">
              <span>{active.group}</span>
              <h2>{active.title}</h2>
              <p>{active.description}</p>
            </div>

            {active.body.map((paragraph) => (
              <p key={paragraph} dangerouslySetInnerHTML={{ __html: inlineCode(paragraph) }} />
            ))}

            {active.bullets ? (
              <ul className="check-list">
                {active.bullets.map((bullet) => (
                  <li key={bullet}>
                    <Check size={16} />
                    <span dangerouslySetInnerHTML={{ __html: inlineCode(bullet) }} />
                  </li>
                ))}
              </ul>
            ) : null}

            {active.code?.map((block) => <CodeBlockView block={block} key={block.label} />)}

            {active.table ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {active.table.columns.map((column) => <th key={column}>{column}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {active.table.rows.map((row) => (
                      <tr key={row.join("-")}>
                        {row.map((cell, index) => (
                          <td key={cell}>
                            {index === 0 ? <code>{cell}</code> : cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </article>
        </main>
      </div>
    </div>
  );
}

function CodeBlockView({ block }: { block: { label: string; language: string; code: string } }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(block.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="code-card">
      <div className="code-head">
        <span>{block.label}</span>
        <small>{block.language}</small>
        <button onClick={copy}>{copied ? "Copied" : "Copy"}</button>
      </div>
      <SyntaxHighlighter
        language={block.language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "18px",
          background: "#020617",
          fontSize: "0.9rem",
          lineHeight: 1.7,
        }}
        codeTagProps={{
          style: {
            fontFamily: "\"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace",
          },
        }}
      >
        {block.code}
      </SyntaxHighlighter>
    </div>
  );
}

function groupSections(sections: DocSection[]) {
  return sections.reduce<Record<string, DocSection[]>>((groups, section) => {
    groups[section.group] ??= [];
    groups[section.group].push(section);
    return groups;
  }, {});
}

function inlineCode(value: string) {
  return value.replace(/`([^`]+)`/g, "<code>$1</code>");
}
