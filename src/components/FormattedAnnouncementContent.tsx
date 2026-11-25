import React from "react";

/**
 * دالة مساعدة لتنسيق النصوص داخل الأسطر (غامق، أحمر، تظليل)
 */
function parseInlineFormatting(text: string): React.ReactNode[] {
  // Regex يتعرف على:
  // 1. [red: نص] أو [red]نص[/red]
  // 2. [hl: نص] أو [hl]نص[/hl]
  // 3. **نص عريض**
  const regex = /(\[red:\s*(.*?)\]|\[red\](.*?)\[\/red\]|\[hl:\s*(.*?)\]|\[hl\](.*?)\[\/hl\]|\*\*(.*?)\*\*)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.substring(lastIndex, match.index));
    }

    const redContent = match[2] || match[3];
    const hlContent = match[4] || match[5];
    const boldContent = match[6];

    if (redContent !== undefined) {
      nodes.push(
        <span key={`red_${match.index}`} className="text-red-600 font-black">
          {redContent}
        </span>
      );
    } else if (hlContent !== undefined) {
      nodes.push(
        <mark key={`hl_${match.index}`} className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-bold">
          {hlContent}
        </mark>
      );
    } else if (boldContent !== undefined) {
      nodes.push(
        <strong key={`bold_${match.index}`} className="font-black text-slate-900">
          {boldContent}
        </strong>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.substring(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

/**
 * مكون عرض نصوص الإعلانات بتنسيق متقدم (مطات وقوائم، خط عريض، خط أحمر، تظليل)
 */
export default function FormattedAnnouncementContent({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className={`space-y-2 leading-relaxed text-slate-800 text-xs sm:text-sm select-text ${className}`} dir="rtl">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // فحص إذا كان السطر يبدأ بشرطة أو نقطة قائمة (- أو • أو *)
        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("• ") || trimmed.startsWith("* ");
        const textToParse = isBullet ? trimmed.replace(/^[-•*]\s*/, "") : line;

        const inlineNodes = parseInlineFormatting(textToParse);

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pr-1 py-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 mt-2 shrink-0 shadow-2xs"></span>
              <div className="flex-1 font-medium">{inlineNodes}</div>
            </div>
          );
        }

        // سطر فارغ كفاصل
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        return (
          <p key={idx} className="font-medium min-h-[1.3em]">
            {inlineNodes}
          </p>
        );
      })}
    </div>
  );
}
