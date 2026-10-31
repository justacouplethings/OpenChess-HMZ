import React from 'react';

export type PieceColor = 'w' | 'b' | 'R' | 'B' | 'Y' | 'G';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

interface PieceProps {
  color: PieceColor;
  type: PieceType;
  className?: string;
  size?: number | string;
}

// Color palettes matching Chess.com Neo set
const PALETTES: Record<PieceColor, { fill: string; stroke: string; strokeSecondary: string; highlight: string }> = {
  w: { fill: '#ffffff', stroke: '#1e1c18', strokeSecondary: '#403d39', highlight: '#f0f0f0' },
  b: { fill: '#312e2b', stroke: '#1a1816', strokeSecondary: '#4a4642', highlight: '#3f3c38' },
  R: { fill: '#db3939', stroke: '#751313', strokeSecondary: '#942222', highlight: '#ea6565' },
  B: { fill: '#2563eb', stroke: '#12398a', strokeSecondary: '#1d4ed8', highlight: '#60a5fa' },
  Y: { fill: '#eab308', stroke: '#785b03', strokeSecondary: '#a17a04', highlight: '#facc15' },
  G: { fill: '#16a34a', stroke: '#0d5c2a', strokeSecondary: '#15803d', highlight: '#4ade80' },
};

export const ChessPieceSVG: React.FC<PieceProps> = ({ color, type, className = '', size = '100%' }) => {
  const p = PALETTES[color] || PALETTES.w;
  const isWhite = color === 'w';

  const renderShape = () => {
    switch (type.toLowerCase()) {
      case 'p':
        return (
          <g>
            {/* Base */}
            <path
              d="M12 37.5c0-2.5 3-4.5 10.5-4.5s10.5 2 10.5 4.5v1.5H12v-1.5z"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Body */}
            <path
              d="M16 33c1.5-6 3-8 3-12 0-3-1.5-4.5-1.5-4.5h10s-1.5 1.5-1.5 4.5c0 4 1.5 6 3 12H16z"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Collar ring */}
            <ellipse
              cx="22.5"
              cy="16.5"
              rx="5"
              ry="1.8"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
            />
            {/* Head */}
            <circle
              cx="22.5"
              cy="11.5"
              r="4.8"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
            />
            {/* Inner highlight */}
            {isWhite ? (
              <path
                d="M19 10a3 3 0 0 1 3-3"
                stroke="#d6d6d6"
                strokeWidth="1"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <path
                d="M19 10a3 3 0 0 1 3-3"
                stroke="#4a4642"
                strokeWidth="1"
                strokeLinecap="round"
                fill="none"
              />
            )}
          </g>
        );

      case 'n':
        return (
          <g>
            {/* Knight base */}
            <path
              d="M11.5 38c0-3 3.5-4.5 11-4.5s11 1.5 11 4.5v1.5h-22V38z"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Knight Head & Mane - iconic Neo shape */}
            <path
              d="M22.5 10c-3.5 0-6 2.5-7 5.5s1 8-2 10.5c-2.5 2-4.5 2.5-5 5.5 2 0 4.5-.8 6.5-1.8-1 3.5.5 5 2.5 5 3 0 5-1.5 6-3 1.5 2 3.5 2 6 0 1.5-1.5 2-4.5 2.5-8 .5-4 1.5-7.5-1.5-11-2-2.5-4.5-2.7-8-2.7z"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Ear */}
            <path
              d="M18 10l-1.5-4 3 2.5"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Eye */}
            <circle cx="16.5" cy="15.5" r="1.5" fill={p.stroke} />
            {/* Mane groove */}
            <path
              d="M27 15c-1 3-1.5 7-1 11"
              stroke={p.stroke}
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Nostril */}
            <circle cx="12" cy="22" r="0.8" fill={p.stroke} />
          </g>
        );

      case 'b':
        return (
          <g>
            {/* Base */}
            <path
              d="M11.5 38c0-3 3.5-4.5 11-4.5s11 1.5 11 4.5v1.5h-22V38z"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Mitre Body */}
            <path
              d="M22.5 8.5c-4 0-7 4-7 10 0 3.5 1.5 6 3.5 8-1.5 1.5-3 3.5-3 6.5h13c0-3-1.5-5-3-6.5 2-2 3.5-4.5 3.5-8 0-6-3-10-7-10z"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Finial Ball */}
            <circle
              cx="22.5"
              cy="6"
              r="2"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.3"
            />
            {/* Diagonal Mitre Slit */}
            <path
              d="M20 13l5 5M22.5 11v8"
              stroke={p.stroke}
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </g>
        );

      case 'r':
        return (
          <g>
            {/* Base */}
            <path
              d="M10.5 38c0-3 3.5-4.5 12-4.5s12 1.5 12 4.5v1.5h-24V38z"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Tower Body */}
            <path
              d="M14.5 33.5l1.5-15h13l1.5 15h-16z"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Castle Ramparts with Crenellations */}
            <path
              d="M12 18.5h21v-6h-3.5v3h-3.5v-3h-7v3h-3.5v-3H12v6z"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'q':
        return (
          <g>
            {/* Base */}
            <path
              d="M10.5 38c0-3 3.5-4.5 12-4.5s12 1.5 12 4.5v1.5h-24V38z"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Body */}
            <path
              d="M14 33.5c1-5 2-10 1-13l7.5 8 7.5-8c-1 3 0 8 1 13H14z"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Crown with 5 spikes */}
            <path
              d="M12 18.5l3 9h15l3-9-5 4-5.5-10-5.5 10-5-4z"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Crown Jewels */}
            <circle cx="12" cy="17" r="1.6" fill={p.fill} stroke={p.stroke} strokeWidth="1.2" />
            <circle cx="17" cy="12.5" r="1.6" fill={p.fill} stroke={p.stroke} strokeWidth="1.2" />
            <circle cx="22.5" cy="10.5" r="1.6" fill={p.fill} stroke={p.stroke} strokeWidth="1.2" />
            <circle cx="28" cy="12.5" r="1.6" fill={p.fill} stroke={p.stroke} strokeWidth="1.2" />
            <circle cx="33" cy="17" r="1.6" fill={p.fill} stroke={p.stroke} strokeWidth="1.2" />
          </g>
        );

      case 'k':
        return (
          <g>
            {/* Base */}
            <path
              d="M10.5 38c0-3 3.5-4.5 12-4.5s12 1.5 12 4.5v1.5h-24V38z"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Cross Finial */}
            <path
              d="M22.5 5v5M20 7.5h5"
              stroke={p.stroke}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* King Crown */}
            <path
              d="M15 14c-1 3 1 7 4 9 0 2-2 4-4 6h15c-2-2-4-4-4-6 3-2 5-6 4-9-2 2-5 3-7.5 3S17 16 15 14z"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="22.5" cy="12" r="1.8" fill={p.fill} stroke={p.stroke} strokeWidth="1.2" />
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 45 45"
      width={size}
      height={size}
      className={`inline-block pointer-events-none drop-shadow-md ${className}`}
    >
      {renderShape()}
    </svg>
  );
};

export const PieceIcon: React.FC<{ code: string; size?: number | string; className?: string }> = ({
  code,
  size = 42,
  className = '',
}) => {
  if (!code) return null;

  let color: PieceColor = 'w';
  let type: PieceType = 'p';

  if (code.length === 1) {
    color = code === code.toUpperCase() ? 'w' : 'b';
    type = code.toLowerCase() as PieceType;
  } else if (code.length >= 2) {
    const prefix = code[0];
    const letter = code[1].toLowerCase() as PieceType;
    if (['R', 'B', 'Y', 'G'].includes(prefix)) {
      color = prefix as PieceColor;
      type = letter;
    } else if (prefix === 'w' || prefix === 'b') {
      color = prefix as PieceColor;
      type = letter;
    }
  }

  return <ChessPieceSVG color={color} type={type} size={size} className={className} />;
};
