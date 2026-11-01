import * as React from "react";
import { parseRichText } from "@/shared/utils/rich-text";

interface RichTextProps {
  text: string;
  lineHeight?: number;
  className?: string;
  /** Warna penanda poin/nomor */
  markerClassName?: string;
}

/**
 * Menampilkan teks dengan struktur asli dokumen: paragraf, poin, dan
 * daftar bernomor yang turun ke bawah.
 */
export function RichText({
  text,
  lineHeight,
  className = "",
  markerClassName = "marker:text-primary marker:font-semibold",
}: RichTextProps) {
  const blocks = React.useMemo(() => parseRichText(text), [text]);
  const style = lineHeight ? { lineHeight } : undefined;

  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((b, i) => {
        if (b.type === "p") {
          return (
            <p key={i} style={style}>
              {b.text}
            </p>
          );
        }
        const Tag = b.type === "ol" ? "ol" : "ul";
        return (
          <Tag
            key={i}
            style={style}
            className={`${
              b.type === "ol" ? "list-decimal" : "list-disc"
            } pl-6 space-y-2 ${markerClassName}`}
          >
            {b.items.map((it, j) => (
              <li key={j} className="pl-1">
                {it.text}
                {it.children && it.children.length > 0 && (
                  <ul className={`mt-2 list-disc pl-5 space-y-1.5 ${markerClassName}`}>
                    {it.children.map((c, k) => (
                      <li key={k} className="pl-1">
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </Tag>
        );
      })}
    </div>
  );
}
