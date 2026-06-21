'use client';

const BLOBS = [
  { w: 280, top: '8%', left: '4%' },
  { w: 200, top: '22%', right: '6%' },
  { w: 160, top: '48%', left: '12%' },
  { w: 240, top: '62%', right: '10%' },
  { w: 180, top: '78%', left: '28%' },
  { w: 140, top: '35%', left: '48%' },
  { w: 220, top: '88%', right: '22%' },
] as const;

/** Deep-yellow ambient spots distributed down the page */
export function YellowScatter() {
  return (
    <div className="yellow-scatter" aria-hidden>
      {BLOBS.map((blob, i) => (
        <div
          key={i}
          className="yellow-blob"
          style={{
            width: blob.w,
            height: blob.w,
            top: blob.top,
            left: 'left' in blob ? blob.left : undefined,
            right: 'right' in blob ? blob.right : undefined,
          }}
        />
      ))}
    </div>
  );
}
