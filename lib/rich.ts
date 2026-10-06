export type Span = { text: string; bold: boolean };

export function parseBold(input: string): Span[] {
  const out: Span[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    if (m.index > last) out.push({ text: input.slice(last, m.index), bold: false });
    out.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < input.length) out.push({ text: input.slice(last), bold: false });
  return out;
}

export type EmSpan = { text: string; em: boolean };

export function parseEmphasis(input: string): EmSpan[] {
  const out: EmSpan[] = [];
  const re = /(?<![\w])_([^_]+?)_(?![\w])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    if (m.index > last) out.push({ text: input.slice(last, m.index), em: false });
    out.push({ text: m[1], em: true });
    last = m.index + m[0].length;
  }
  if (last < input.length) out.push({ text: input.slice(last), em: false });
  return out;
}
