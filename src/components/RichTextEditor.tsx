import { useEffect, useRef } from "react";
import { sanitizeHtml } from "@/lib/sanitize";

const TOOLS = [
  { cmd: "bold", icon: "bi-type-bold", label: "Gras" },
  { cmd: "italic", icon: "bi-type-italic", label: "Italique" },
  { cmd: "underline", icon: "bi-type-underline", label: "Souligné" },
  { cmd: "insertUnorderedList", icon: "bi-list-ul", label: "Liste à puces" },
  { cmd: "insertOrderedList", icon: "bi-list-ol", label: "Liste numérotée" },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Écrivez votre transmission…",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (node && node.innerHTML !== value) node.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false);
    onChange(sanitizeHtml(ref.current?.innerHTML ?? ""));
  };

  return (
    <div className="module-panel overflow-hidden">
      <div className="flex flex-wrap gap-1 border-b bg-muted/50 p-1">
        {TOOLS.map((tool) => (
          <button
            key={tool.cmd}
            type="button"
            title={tool.label}
            aria-label={tool.label}
            onClick={() => exec(tool.cmd)}
            className="rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <i className={`bi ${tool.icon}`} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Contenu de la transmission"
        data-placeholder={placeholder}
        onInput={() => onChange(sanitizeHtml(ref.current?.innerHTML ?? ""))}
        onBlur={() => onChange(sanitizeHtml(ref.current?.innerHTML ?? ""))}
        className="prose-dbm min-h-32 max-h-72 overflow-y-auto px-3 py-2 outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
