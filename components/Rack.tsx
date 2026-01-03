"use client";

export function Rack({
  rack,
  onPick,
}: {
  rack: Record<string, number>;
  onPick: (letter: string) => void;
}) {
  const entries = Object.entries(rack).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className="rackWrap">
      <div className="rackHeader">
        <h2>Rack</h2>
        <div className="meta">Click letters to type</div>
      </div>
      <div className="rack">
        {entries.length === 0 ? (
          <div className="pill">No letters left 😅</div>
        ) : (
          entries.map(([ch, n]) => (
            <button
              key={ch}
              className={"rackTile" + (n <= 0 ? " disabled" : "")}
              disabled={n <= 0}
              onClick={() => onPick(ch)}
              aria-label={`Add ${ch}`}
              title={`Add ${ch}`}
            >
              <span>{ch}</span>
              <span className="countBadge">{n}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
