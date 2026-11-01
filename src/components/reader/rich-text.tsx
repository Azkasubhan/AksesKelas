import * as React from "react";
import { parseRichText, type RichBlock } from "@/shared/utils/rich-text";
import { Lightbulb, HelpCircle, Info, Table2 } from "lucide-react";

interface RichTextProps {
  text: string;
  lineHeight?: number;
  className?: string;
  markerClassName?: string;
  highlight?: string;
}

/**
 * Menemukan rentang teks yang perlu disorot (misal rujukan Kartu Fokus pada teks sumber).
 */
function getHighlightRanges(
  fullText: string,
  highlightText?: string,
): { start: number; end: number }[] {
  if (!highlightText || !fullText) return [];
  const rawTarget = highlightText.trim();
  if (rawTarget.length < 5) return [];

  // 1. Coba pencocokan langsung
  const normFull = fullText.toLowerCase();
  const normTarget = rawTarget.toLowerCase();
  const exactIdx = normFull.indexOf(normTarget);
  if (exactIdx !== -1) {
    return [{ start: exactIdx, end: exactIdx + normTarget.length }];
  }

  // 2. Pencocokan per kalimat jika target terdiri dari beberapa kalimat
  const sentences = rawTarget
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15);

  const ranges: { start: number; end: number }[] = [];

  for (const sentence of sentences) {
    try {
      const escaped = sentence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
      const regex = new RegExp(escaped, "i");
      const match = regex.exec(fullText);
      if (match && match.index !== undefined) {
        ranges.push({ start: match.index, end: match.index + match[0].length });
      }
    } catch {
      // abaikan regex error
    }
  }

  if (ranges.length > 0) {
    ranges.sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [ranges[0]];
    for (let i = 1; i < ranges.length; i++) {
      const last = merged[merged.length - 1];
      const cur = ranges[i];
      if (cur.start <= last.end + 5) {
        last.end = Math.max(last.end, cur.end);
      } else {
        merged.push(cur);
      }
    }
    return merged;
  }

  return [];
}

/**
 * Merender teks dengan fragmen yang disorot secara mulus.
 */
function renderHighlightedText(text: string, highlight?: string): React.ReactNode {
  if (!highlight || !text) return text;
  const ranges = getHighlightRanges(text, highlight);
  if (!ranges.length) return text;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  ranges.forEach((range, idx) => {
    if (range.start > lastIndex) {
      nodes.push(text.slice(lastIndex, range.start));
    }
    nodes.push(
      <mark
        key={idx}
        className="rounded bg-emerald-subtle px-1.5 py-0.5 font-medium text-ink border border-emerald-border/80 shadow-xs"
        title="Bagian teks sumber yang diadaptasikan menjadi kartu fokus ini"
      >
        {text.slice(range.start, range.end)}
      </mark>,
    );
    lastIndex = range.end;
  });

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <>{nodes}</>;
}

/**
 * Menampilkan teks materi pembelajaran dengan visual yang rapi, berkelas,
 * dan hierarkis (Sub-topik, Poin Pelajaran, Kotak Contoh/Pemantik, dsb.)
 * Mendukung penyorotan teks rujukan saat meninjau Kartu Fokus.
 */
export function RichText({
  text,
  lineHeight,
  className = "",
  markerClassName = "marker:text-primary marker:font-semibold",
  highlight,
}: RichTextProps) {
  const blocks = React.useMemo(() => parseRichText(text), [text]);
  const style = lineHeight ? { lineHeight } : undefined;

  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((b, i) => (
        <BlockRenderer
          key={i}
          block={b}
          style={style}
          markerClassName={markerClassName}
          highlight={highlight}
        />
      ))}
    </div>
  );
}

function BlockRenderer({
  block,
  style,
  markerClassName,
  highlight,
}: {
  block: RichBlock;
  style?: React.CSSProperties;
  markerClassName: string;
  highlight?: string;
}) {
  switch (block.type) {
    case "section-banner":
      return (
        <div className="rounded-2xl border border-line bg-surface-subtle/60 p-4 sm:p-5 my-3 shadow-2xs">
          <span className="inline-block rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            {block.tag}
          </span>
          <h3 className="mt-1.5 font-heading text-base sm:text-lg font-bold text-ink tracking-tight">
            {block.title}
          </h3>
        </div>
      );

    case "sub-topic":
      return (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary text-white font-heading font-bold text-xs shadow-xs">
              {block.num}
            </span>
            <h3 className="font-heading text-base sm:text-lg font-bold text-ink leading-snug">
              {renderHighlightedText(block.title, highlight)}
            </h3>
          </div>
          {block.body && (
            <p style={style} className="text-ink/90 pl-9">
              {renderHighlightedText(block.body, highlight)}
            </p>
          )}
          {block.bullets && block.bullets.length > 0 && (
            <ul
              style={style}
              className={`list-disc pl-14 space-y-1.5 ${markerClassName}`}
            >
              {block.bullets.map((item, idx) => (
                <li key={idx} className="pl-1">
                  {renderHighlightedText(item, highlight)}
                </li>
              ))}
            </ul>
          )}
        </div>
      );

    case "callout": {
      const isExample = block.variant === "example";
      const isQuestion = block.variant === "question";

      const cardBg = isExample
        ? "border-amber-500/25 bg-amber-500/5 text-ink"
        : isQuestion
        ? "border-primary/25 bg-primary/5 text-ink"
        : "border-line bg-surface-subtle/70 text-ink";

      const badgeColor = isExample
        ? "text-amber-700 dark:text-amber-400"
        : isQuestion
        ? "text-primary"
        : "text-muted";

      const Icon = isExample ? Lightbulb : isQuestion ? HelpCircle : Info;

      return (
        <div className={`rounded-2xl border p-4 sm:p-5 my-3 shadow-2xs ${cardBg}`}>
          <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2 ${badgeColor}`}>
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{block.label}</span>
          </div>
          <p style={style} className="text-sm leading-relaxed text-ink/90">
            {renderHighlightedText(block.text, highlight)}
          </p>
        </div>
      );
    }

    case "table-note":
      return (
        <div className="rounded-xl border border-line bg-surface-subtle/50 px-4 py-2.5 my-2 flex items-start gap-2.5 text-xs text-muted">
          <Table2 className="size-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <span className="font-semibold text-ink block">{block.caption}</span>
            {block.body && (
              <p className="italic">{renderHighlightedText(block.body, highlight)}</p>
            )}
          </div>
        </div>
      );

    case "p":
      return (
        <p style={style} className="text-ink/90">
          {renderHighlightedText(block.text, highlight)}
        </p>
      );

    case "ul":
      return (
        <div className="space-y-1.5">
          {block.lead && (
            <p style={style} className="text-ink font-medium">
              {renderHighlightedText(block.lead, highlight)}
            </p>
          )}
          <ul
            style={style}
            className={`list-disc pl-6 space-y-1.5 ${markerClassName}`}
          >
            {block.items.map((it, j) => (
              <li key={j} className="pl-1">
                {renderHighlightedText(it.text, highlight)}
                {it.children && it.children.length > 0 && (
                  <ul className={`mt-1.5 list-disc pl-5 space-y-1 ${markerClassName}`}>
                    {it.children.map((c, k) => (
                      <li key={k} className="pl-1">
                        {renderHighlightedText(c, highlight)}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      );

    case "ol":
      return (
        <div className="space-y-1.5">
          {block.lead && (
            <p style={style} className="text-ink font-medium">
              {renderHighlightedText(block.lead, highlight)}
            </p>
          )}
          <ol
            start={block.start}
            style={style}
            className={`list-decimal pl-6 space-y-1.5 ${markerClassName}`}
          >
            {block.items.map((it, j) => (
              <li key={j} className="pl-1">
                {renderHighlightedText(it.text, highlight)}
                {it.children && it.children.length > 0 && (
                  <ul className={`mt-1.5 list-disc pl-5 space-y-1 ${markerClassName}`}>
                    {it.children.map((c, k) => (
                      <li key={k} className="pl-1">
                        {renderHighlightedText(c, highlight)}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </div>
      );

    default:
      return null;
  }
}
