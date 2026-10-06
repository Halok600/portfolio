import { parseBold } from "@/lib/rich";

export function RichText({ text }: { text: string }) {
  return (
    <>
      {parseBold(text).map((s, i) =>
        s.bold ? (
          <strong key={i} className="font-semibold text-text">
            {s.text}
          </strong>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}
