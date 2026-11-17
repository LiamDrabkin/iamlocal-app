/** Stylised Hout Bay: sea, beach, harbour pier, mountains, Main Road and Harbour Road. Positions are approximate, not survey-accurate. */
export default function MapBase() {
  const t = { font: "600 13px Figtree,sans-serif", fill: 'var(--i3)' } as const;
  return (
    <svg className="base" viewBox="0 0 390 700" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Stylised map of Hout Bay. Positions are approximate.">
      <rect width="390" height="700" style={{ fill: 'var(--sea)' }} />
      <path d="M150 0 L168 100 L150 124 L90 124 L90 138 L128 140 L130 215 C118 250 92 290 100 340 C110 400 120 470 135 540 C150 600 120 640 170 700 L390 700 L390 0 Z" style={{ fill: 'var(--land)' }} />
      <path d="M130 215 C118 250 92 290 100 340 C110 400 120 470 135 540" style={{ fill: 'none', stroke: 'var(--beach)', strokeWidth: 10, strokeLinecap: 'round' }} />
      <path d="M150 126 L84 126" style={{ fill: 'none', stroke: 'var(--land)', strokeWidth: 9, strokeLinecap: 'round' }} />
      {[[340, 110, 110, 80], [340, 110, 70, 50], [90, 640, 120, 70], [90, 640, 75, 42]].map(([cx, cy, rx, ry], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} style={{ fill: 'none', stroke: 'var(--ln)', strokeWidth: 2 }} />
      ))}
      <path d="M150 150 C190 170 210 200 230 260 C240 300 235 330 215 350" style={{ fill: 'none', stroke: 'var(--road)', strokeWidth: 7, strokeLinecap: 'round' }} />
      <path d="M130 360 C190 340 250 330 330 350 L390 360" style={{ fill: 'none', stroke: 'var(--road)', strokeWidth: 7, strokeLinecap: 'round' }} />
      <path d="M215 350 C205 410 190 450 175 470 C160 500 150 540 135 560" style={{ fill: 'none', stroke: 'var(--road)', strokeWidth: 7, strokeLinecap: 'round' }} />
      <text x="20" y="420" style={t} transform="rotate(-90 20 420)">Atlantic Ocean</text>
      <text x="20" y="206" style={t}>Harbour</text>
      <text x="270" y="318" style={t}>Main Road</text>
      <text x="300" y="200" style={t}>Hout Bay</text>
    </svg>
  );
}
