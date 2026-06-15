"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Docs code surfaces. Highlighting is a small line-based tokenizer in the
 * same spirit as the hand-coloured terminals elsewhere in the app — no
 * dependency, a restrained palette, and amber reserved for the things
 * Dispatch actually cares about: keywords and ISO timestamps.
 */

export type CodeLang =
  | "bash"
  | "json"
  | "js"
  | "python"
  | "go"
  | "php"
  | "nginx"
  | "ini"
  | "text";

const LANG_LABEL: Record<CodeLang, string> = {
  bash: "shell",
  json: "json",
  js: "node.js",
  python: "python",
  go: "go",
  php: "php",
  nginx: "nginx",
  ini: "env",
  text: "output",
};

const KEYWORDS: Partial<Record<CodeLang, ReadonlySet<string>>> = {
  js: new Set([
    "const", "let", "var", "function", "return", "if", "else", "try",
    "catch", "throw", "new", "import", "from", "export", "default",
    "async", "await", "typeof", "of", "in", "class", "null", "true",
    "false", "undefined",
  ]),
  python: new Set([
    "def", "return", "if", "elif", "else", "try", "except", "raise",
    "import", "from", "as", "with", "async", "await", "not", "and",
    "or", "in", "is", "None", "True", "False", "for", "while", "class",
    "lambda", "pass",
  ]),
  go: new Set([
    "func", "package", "import", "return", "if", "else", "nil", "var",
    "const", "type", "struct", "map", "string", "int", "any", "go",
    "defer", "range", "for", "chan", "select", "case", "switch",
    "error", "bool", "byte", "make", "log", "main",
  ]),
  php: new Set([
    "function", "return", "if", "else", "echo", "exit", "true", "false",
    "null", "isset", "array", "new", "throw", "try", "catch", "foreach",
    "as", "use", "require", "namespace", "match",
  ]),
  json: new Set(["true", "false", "null"]),
  bash: new Set([
    "curl", "cd", "npm", "npx", "node", "git", "echo", "cp", "pm2",
    "ngrok", "mysql", "export", "sudo", "certbot", "ln", "systemctl",
  ]),
  nginx: new Set([
    "server", "listen", "server_name", "location", "proxy_pass",
    "proxy_set_header", "proxy_http_version", "upstream",
  ]),
};

/** Languages where keywords read as bright commands, not amber syntax. */
const COMMAND_LANGS: ReadonlySet<CodeLang> = new Set(["bash", "nginx", "ini"]);

type Token = { text: string; className?: string };

const regexCache = new Map<CodeLang, RegExp>();

function buildRegex(lang: CodeLang): RegExp {
  const comment =
    lang === "js" || lang === "go"
      ? "\\/\\/.*"
      : lang === "php"
        ? "\\/\\/.*|#.*"
        : lang === "json" || lang === "text"
          ? "(?!x)x" // never matches
          : "#.*";
  const flag = lang === "bash" ? "(?<=\\s|^)-{1,2}[\\w-]+" : "(?!x)x";
  const punct = lang === "json" ? "[{}\\[\\]:,]+" : "(?!x)x";
  return new RegExp(
    `("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\`)` +
      `|(${comment})|(${flag})|(\\b\\d[\\w.]*)|([A-Za-z_$][\\w$]*)|(${punct})`,
    "g"
  );
}

const ISO_STRING = /^["'`]\d{4}-\d{2}-\d{2}T/;

function tokenizeLine(line: string, lang: CodeLang): Token[] {
  let re = regexCache.get(lang);
  if (!re) {
    re = buildRegex(lang);
    regexCache.set(lang, re);
  }
  re.lastIndex = 0;

  const tokens: Token[] = [];
  let last = 0;

  for (let m = re.exec(line); m !== null; m = re.exec(line)) {
    if (m.index > last) tokens.push({ text: line.slice(last, m.index) });
    const text = m[0];
    let className: string | undefined;

    if (m[1] !== undefined) {
      // Strings — JSON keys stay dim, scheduled moments glow amber.
      if (ISO_STRING.test(text)) className = "text-amber-300";
      else if (lang === "json" && /^\s*:/.test(line.slice(m.index + text.length)))
        className = "text-zinc-400";
      else className = "text-zinc-200";
    } else if (m[2] !== undefined) {
      className = "text-zinc-600";
    } else if (m[3] !== undefined) {
      className = "text-zinc-500";
    } else if (m[4] !== undefined) {
      className = "text-sky-300/90";
    } else if (m[5] !== undefined) {
      if (lang === "ini" && line[m.index + text.length] === "=") {
        className = "text-zinc-100";
      } else if (lang === "php" && text.startsWith("$")) {
        className = "text-zinc-100";
      } else if (KEYWORDS[lang]?.has(text)) {
        className = COMMAND_LANGS.has(lang)
          ? "text-zinc-100"
          : "text-amber-300/90";
      }
    } else if (m[6] !== undefined) {
      className = "text-zinc-600";
    }

    tokens.push({ text, className });
    last = m.index + text.length;
  }

  if (last < line.length) tokens.push({ text: line.slice(last) });
  return tokens;
}

function Code({ code, lang }: { code: string; lang: CodeLang }) {
  const lines = useMemo(
    () => code.split("\n").map((line) => tokenizeLine(line, lang)),
    [code, lang]
  );

  return (
    <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-6 text-zinc-300">
      <code>
        {lines.map((tokens, i) => (
          <div key={i}>
            {tokens.length > 0
              ? tokens.map((token, j) =>
                  token.className ? (
                    <span key={j} className={token.className}>
                      {token.text}
                    </span>
                  ) : (
                    token.text
                  )
                )
              : " "}
          </div>
        ))}
      </code>
    </pre>
  );
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the block is still selectable
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={copied ? "Copied" : "Copy code"}
      onClick={handleCopy}
      className="text-zinc-500 hover:text-zinc-100"
    >
      {copied ? <Check className="text-emerald-400" /> : <Copy />}
    </Button>
  );
}

export function CodeBlock({
  code,
  lang,
  title,
  className,
}: {
  code: string;
  lang: CodeLang;
  /** Header label; defaults to the language name. */
  title?: string;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "min-w-0 overflow-hidden border border-zinc-800 bg-zinc-950/90",
        className
      )}
    >
      <figcaption className="flex h-9 items-center justify-between border-b border-zinc-800/80 pr-1.5 pl-4">
        <span className="truncate font-mono text-[11px] text-zinc-500">
          {title ?? LANG_LABEL[lang]}
        </span>
        <CopyButton code={code} />
      </figcaption>
      <Code code={code} lang={lang} />
    </figure>
  );
}

export function CodeTabs({
  tabs,
  className,
}: {
  tabs: { label: string; code: string; lang: CodeLang }[];
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const tab = tabs[active] ?? tabs[0];

  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden border border-zinc-800 bg-zinc-950/90",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-800/80 pr-1.5">
        <div role="tablist" className="flex overflow-x-auto">
          {tabs.map((t, i) => (
            <button
              key={t.label}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "relative shrink-0 px-4 py-2.5 font-mono text-[11px] tracking-wider transition-colors outline-none",
                i === active
                  ? "text-amber-400"
                  : "text-zinc-500 hover:text-zinc-200"
              )}
            >
              {i === active ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-px bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                />
              ) : null}
              {t.label}
            </button>
          ))}
        </div>
        <CopyButton code={tab.code} />
      </div>
      <Code code={tab.code} lang={tab.lang} />
    </div>
  );
}
