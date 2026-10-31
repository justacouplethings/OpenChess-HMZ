import React from 'react';

export type PieceColor = 'w' | 'b' | 'R' | 'B' | 'Y' | 'G';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

interface PieceProps {
  color: PieceColor;
  type: PieceType;
  className?: string;
  size?: number | string;
}

// Color palettes
const COLOR_FILLS: Record<PieceColor, { body: string; stroke: string; highlight: string }> = {
  w: { body: '#ffffff', stroke: '#1e1c18', highlight: '#f0f0f0' },
  b: { body: '#262421', stroke: '#0e0d0c', highlight: '#3a3733' },
  R: { body: '#e03e3e', stroke: '#7a1414', highlight: '#f26868' },
  B: { body: '#2b78e4', stroke: '#113e7d', highlight: '#5599f5' },
  Y: { body: '#f1c40f', stroke: '#8c7308', highlight: '#f7dc6f' },
  G: { body: '#27ae60', stroke: '#145a32', highlight: '#52be80' },
};

export const ChessPieceSVG: React.FC<PieceProps> = ({ color, type, className = '', size = '100%' }) => {
  const c = COLOR_FILLS[color] || COLOR_FILLS.w;
  const isDark = color === 'b';
  const innerStroke = isDark ? '#4a4641' : '#d1d1d1';

  const renderPaths = () => {
    switch (type.toLowerCase()) {
      case 'p':
        return (
          <g>
            <path
              d="M22.5 9c-2.2 0-4 1.8-4 4 0 1.2.5 2.2 1.4 3-1.6 1-3.4 3.2-3.4 6 0 1.6.6 3 1.5 4h9c.9-1 1.5-2.4 1.5-4 0-2.8-1.8-5-3.4-6 .9-.8 1.4-1.8 1.4-3 0-2.2-1.8-4-4-4z"
              fill={c.body}
              stroke={c.stroke}
              strokeWidth="1.5"
            />
            <path
              d="M12 36c0-3.5 3-6 7-7h7c4 1 7 3.5 7 7v2H12v-2z"
              fill={c.body}
              stroke={c.stroke}
              strokeWidth="1.5"
            />
            <path d="M15 33c3-1.5 12-1.5 15 0" stroke={innerStroke} strokeWidth="1" fill="none" />
          </g>
        );
      case 'n':
        return (
          <g>
            <path
              d="M22 10c-3 0-5 2-6 5s1 7-2 9c-2 1-4 2-5 5 2 0 4-1 6-1-1 3-1 6 2 7 2 1 6 1 8-1 2-2 3-6 4-9 1-3 1-6-1-9-1.5-2.5-3.5-3.5-6-6z"
              fill={c.body}
              stroke={c.stroke}
              strokeWidth="1.5"
            />
            <circle cx="16" cy="16" r="1.5" fill={c.stroke} />
            <path
              d="M11 36c1-4 4-6 9-6h5c5 0 8 2 9 6v2H11v-2z"
              fill={c.body}
              stroke={c.stroke}
              strokeWidth="1.5"
            />
          </g>
        );
      case 'b':
        return (
          <g>
            <path
              d="M22.5 8c-3 0-6 4-6 9 0 3 1.5 5.5 3.5 7-1.5 1.5-3 3.5-3 6h11c0-2.5-1.5-4.5-3-6 2-1.5 3.5-4 3.5-7 0-5-3-9-6-9z"
              fill={c.body}
              stroke={c.stroke}
              strokeWidth="1.5"
            />
            <circle cx="22.5" cy="6" r="1.5" fill={c.body} stroke={c.stroke} strokeWidth="1" />
            <path d="M22.5 12v6M19.5 15h6" stroke={innerStroke} strokeWidth="1.5" strokeLinecap="round" />
            <path
              d="M12 36c1-3.5 4-6 8-6h5c4 0 7 2.5 8 6v2H12v-2z"
              fill={c.body}
              stroke={c.stroke}
              strokeWidth="1.5"
            />
          </g>
        );
      case 'r':
        return (
          <g>
            <path
              d="M12 12h21v5h-2v9h3v3H11v-3h3v-9h-2v-5z"
              fill={c.body}
              stroke={c.stroke}
              strokeWidth="1.5"
            />
            <path d="M16 12v3M22.5 12v3M29 12v3" stroke={c.stroke} strokeWidth="1.5" />
            <path
              d="M10 36c1-3 3-5 8-5h9c5 0 7 2 8 5v2H10v-2z"
              fill={c.body}
              stroke={c.stroke}
              strokeWidth="1.5"
            />
          </g>
        );
      case 'q':
        return (
          <g>
            <path
              d="M12 18l3 10h15l3-10-5.5 5-5-10-5 10L12 18z"
              fill={c.body}
              stroke={c.stroke}
              strokeWidth="1.5"
            />
            <circle cx="12" cy="16" r="1.5" fill={c.body} stroke={c.stroke} strokeWidth="1" />
            <circle cx="17.5" cy="12" r="1.5" fill={c.body} stroke={c.stroke} strokeWidth="1" />
            <circle cx="22.5" cy="10" r="1.5" fill={c.body} stroke={c.stroke} strokeWidth="1" />
            <circle cx="27.5" cy="12" r="1.5" fill={c.body} stroke={c.stroke} strokeWidth="1" />
            <circle cx="33" cy="16" r="1.5" fill={c.body} stroke={c.stroke} strokeWidth="1" />
            <path
              d="M11 36c1-3.5 4-6 9-6h5c5 0 8 2.5 9 6v2H11v-2z"
              fill={c.body}
              stroke={c.stroke}
              strokeWidth="1.5"
            />
          </g>
        );
      case 'k':
        return (
          <g>
            <path
              d="M22.5 6v4M20.5 8h4"
              stroke={c.stroke}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M15 14c-1 3 1 7 4 9 0 2-2 4-4 6h15c-2-2-4-4-4-6 3-2 5-6 4-9-2 2-5 3-7.5 3S17 16 15 14z"
              fill={c.body}
              stroke={c.stroke}
              strokeWidth="1.5"
            />
            <path
              d="M10 36c1-3.5 4-6 9-6h7c5 0 8 2.5 9 6v2H10v-2z"
              fill={c.body}
              stroke={c.stroke}
              strokeWidth="1.5"
            />
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
      className={`inline-block pointer-events-none drop-shadow ${className}`}
    >
      {renderPaths()}
    </svg>
  );
};

export const PieceIcon: React.FC<{ code: string; size?: number | string; className?: string }> = ({
  code,
  size = 40,
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
