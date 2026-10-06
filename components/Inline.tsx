import { parseBold, parseEmphasis } from "@/lib/rich";

export function RichText({ text }: { text: string }) {
  return (
    <>
      {parseBold(text).map((s, i) => (s.bold ? <strong key={i}>{s.text}</strong> : <span key={i}>{s.text}</span>))}
    </>
  );
}

export function Emph({ text }: { text: string }) {
  return (
    <>
      {parseEmphasis(text).map((s, i) => (s.em ? <em key={i}>{s.text}</em> : <span key={i}>{s.text}</span>))}
    </>
  );
}
