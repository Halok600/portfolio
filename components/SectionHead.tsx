export function SectionHead({ id, title, note }: { id: string; title: string; note?: string }) {
  return (
    <div className="sh">
      <h2 id={`${id}-title`}>{title}</h2>
      {note && <span className="mono">{note}</span>}
    </div>
  );
}
