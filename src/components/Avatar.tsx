import { useId } from 'react'

/** Personagem-recipiente que se enche de água. fill: 0..1 */
export function Avatar({ character, fill, size = 180, happy = false }: { character: string; fill: number; size?: number; happy?: boolean }) {
  const id = useId().replace(/:/g, '')
  const f = Math.max(0, Math.min(1, fill))
  const shape = SHAPES[character] ?? SHAPES.gota
  // nível da água no viewBox 0..100 (100 = fundo)
  const level = 100 - f * 100
  const pleno = f >= 1
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`Personagem ${character}, ${Math.round(f * 100)}% cheio`}>
      <defs>
        <clipPath id={`clip-${id}`}>{shape.body}</clipPath>
        <linearGradient id={`g-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--water-light)" />
          <stop offset="1" stopColor="var(--water-deep)" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#clip-${id})`}>
        <rect x="0" y="0" width="100" height="100" fill="var(--surface-2)" />
        <g style={{ transform: `translateY(${level}%)`, transition: 'transform 0.6s cubic-bezier(.3,1.3,.5,1)' }}>
          <g className="wave">
            <path d="M-100 6 Q -87.5 0 -75 6 T -50 6 T -25 6 T 0 6 T 25 6 T 50 6 T 75 6 T 100 6 T 125 6 T 150 6 T 175 6 T 200 6 V 200 H -100 Z" fill={`url(#g-${id})`}>
              <animateTransform attributeName="transform" type="translate" from="0 0" to="50 0" dur="2.4s" repeatCount="indefinite" />
            </path>
          </g>
          <circle cx="30" cy="40" r="2.2" fill="#fff" opacity="0.5"><animate attributeName="cy" values="60;20" dur="3s" repeatCount="indefinite" /></circle>
          <circle cx="62" cy="55" r="1.6" fill="#fff" opacity="0.5"><animate attributeName="cy" values="70;25" dur="4.2s" repeatCount="indefinite" /></circle>
        </g>
      </g>
      <g fill="none" stroke="var(--water-deep)" strokeWidth="2.5">{shape.body}</g>
      {shape.extras}
      {/* rosto */}
      <g>
        <circle cx={shape.face.x - 8} cy={shape.face.y} r="2.6" fill="var(--text)" />
        <circle cx={shape.face.x + 8} cy={shape.face.y} r="2.6" fill="var(--text)" />
        <circle cx={shape.face.x - 7} cy={shape.face.y - 1} r="0.9" fill="#fff" />
        <circle cx={shape.face.x + 9} cy={shape.face.y - 1} r="0.9" fill="#fff" />
        {pleno || happy ? (
          <path d={`M${shape.face.x - 6} ${shape.face.y + 7} Q ${shape.face.x} ${shape.face.y + 14} ${shape.face.x + 6} ${shape.face.y + 7}`} stroke="var(--text)" strokeWidth="2" fill="none" strokeLinecap="round" />
        ) : f < 0.25 ? (
          <path d={`M${shape.face.x - 5} ${shape.face.y + 9} Q ${shape.face.x} ${shape.face.y + 6} ${shape.face.x + 5} ${shape.face.y + 9}`} stroke="var(--text)" strokeWidth="2" fill="none" strokeLinecap="round" />
        ) : (
          <path d={`M${shape.face.x - 4} ${shape.face.y + 8} H ${shape.face.x + 4}`} stroke="var(--text)" strokeWidth="2" strokeLinecap="round" />
        )}
        <ellipse cx={shape.face.x - 13} cy={shape.face.y + 6} rx="3.5" ry="2" fill="#ff9aa2" opacity="0.6" />
        <ellipse cx={shape.face.x + 13} cy={shape.face.y + 6} rx="3.5" ry="2" fill="#ff9aa2" opacity="0.6" />
      </g>
      {pleno && <g opacity="0.9"><path d="M18 18 l3 0 M19.5 16.5 l0 3" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" /><path d="M80 24 l4 0 M82 22 l0 4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" /></g>}
    </svg>
  )
}

interface Shape { body: React.ReactElement; face: { x: number; y: number }; extras?: React.ReactElement }

const SHAPES: Record<string, Shape> = {
  gota: { body: <path d="M50 6 C 60 26, 84 42, 84 62 A 34 34 0 0 1 16 62 C 16 42, 40 26, 50 6 Z" />, face: { x: 50, y: 60 } },
  bolha: { body: <circle cx="50" cy="54" r="38" />, face: { x: 50, y: 52 } },
  baleia: {
    body: <path d="M14 58 C 14 36, 34 26, 56 26 C 78 26, 90 40, 90 56 C 90 72, 76 86, 56 86 C 36 86, 14 78, 14 58 Z" />,
    face: { x: 62, y: 52 },
    extras: <path d="M12 56 C 4 50, 4 70, 12 64 M 46 24 c -2 -8 2 -12 4 -8 c 2 -4 6 0 4 8" fill="none" stroke="var(--water-deep)" strokeWidth="2.5" strokeLinecap="round" />,
  },
  cacto: {
    body: <path d="M36 16 a 14 14 0 0 1 28 0 V 94 H 36 Z M 16 36 a 8 8 0 0 1 16 0 V 60 H 20 a 4 4 0 0 1 -4 -4 Z M 68 46 a 8 8 0 0 1 16 0 V 68 a 4 4 0 0 1 -4 4 H 68 Z" />,
    face: { x: 50, y: 46 },
    extras: <ellipse cx="50" cy="94" rx="28" ry="4" fill="var(--accent)" opacity="0.7" />,
  },
  pinguim: { body: <path d="M50 10 C 72 10, 82 36, 82 60 C 82 80, 68 92, 50 92 C 32 92, 18 80, 18 60 C 18 36, 28 10, 50 10 Z" />, face: { x: 50, y: 36 }, extras: <path d="M44 48 L 56 48 L 50 56 Z" fill="var(--accent)" /> },
  tartaruga: { body: <path d="M12 66 A 38 38 0 0 1 88 66 Z" />, face: { x: 50, y: 48 }, extras: <path d="M8 70 H 92 M 20 70 v 10 M 80 70 v 10" stroke="var(--water-deep)" strokeWidth="2.5" strokeLinecap="round" /> },
  axolote: { body: <path d="M22 50 a 28 28 0 1 1 56 0 V 80 a 14 14 0 0 1 -56 0 Z" />, face: { x: 50, y: 48 }, extras: <path d="M22 44 l -10 -6 M 22 52 l -12 0 M 22 60 l -10 6 M 78 44 l 10 -6 M 78 52 l 12 0 M 78 60 l 10 6" stroke="#ff9aa2" strokeWidth="3" strokeLinecap="round" /> },
  polvo: { body: <path d="M20 54 a 30 30 0 1 1 60 0 V 70 H 20 Z" />, face: { x: 50, y: 50 }, extras: <path d="M22 70 q -4 14 6 18 M 36 70 q 0 14 8 20 M 50 70 q 2 16 -2 22 M 64 70 q 2 14 -6 20 M 78 70 q 4 14 -6 18" fill="none" stroke="var(--water-deep)" strokeWidth="2.5" strokeLinecap="round" /> },
}

export const CHARACTER_IDS = Object.keys(SHAPES)
