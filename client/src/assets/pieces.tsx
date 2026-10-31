import React from 'react';

// Official Kaneo / Chess.com Neo Vector Assets
import wP from './pieces/wP.svg';
import wN from './pieces/wN.svg';
import wB from './pieces/wB.svg';
import wR from './pieces/wR.svg';
import wQ from './pieces/wQ.svg';
import wK from './pieces/wK.svg';

import bP from './pieces/bP.svg';
import bN from './pieces/bN.svg';
import bB from './pieces/bB.svg';
import bR from './pieces/bR.svg';
import bQ from './pieces/bQ.svg';
import bK from './pieces/bK.svg';

// 4-Player Variant Assets
import RP from './pieces/RP.svg';
import RN from './pieces/RN.svg';
import RB from './pieces/RB.svg';
import RR from './pieces/RR.svg';
import RQ from './pieces/RQ.svg';
import RK from './pieces/RK.svg';

import BP from './pieces/BP.svg';
import BN from './pieces/BN.svg';
import BB from './pieces/BB.svg';
import BR from './pieces/BR.svg';
import BQ from './pieces/BQ.svg';
import BK from './pieces/BK.svg';

import YP from './pieces/YP.svg';
import YN from './pieces/YN.svg';
import YB from './pieces/YB.svg';
import YR from './pieces/YR.svg';
import YQ from './pieces/YQ.svg';
import YK from './pieces/YK.svg';

import GP from './pieces/GP.svg';
import GN from './pieces/GN.svg';
import GB from './pieces/GB.svg';
import GR from './pieces/GR.svg';
import GQ from './pieces/GQ.svg';
import GK from './pieces/GK.svg';

export const PIECE_ASSETS: Record<string, string> = {
  // Standard White
  wP, wN, wB, wR, wQ, wK,
  P: wP, N: wN, B: wB, R: wR, Q: wQ, K: wK,
  wp: wP, wn: wN, wb: wB, wr: wR, wq: wQ, wk: wK,

  // Standard Black
  bP, bN, bB, bR, bQ, bK,
  p: bP, n: bN, b: bB, r: bR, q: bQ, k: bK,
  bp: bP, bn: bN, bb: bB, br: bR, bq: bQ, bk: bK,

  // 4-Player Red
  RP, RN, RB, RR, RQ, RK,
  R_P: RP, R_N: RN, R_B: RB, R_R: RR, R_Q: RQ, R_K: RK,
  R_p: RP, R_n: RN, R_b: RB, R_r: RR, R_q: RQ, R_k: RK,

  // 4-Player Blue
  BP, BN, BB, BR, BQ, BK,
  B_P: BP, B_N: BN, B_B: BB, B_R: BR, B_Q: BQ, B_K: BK,
  B_p: BP, B_n: BN, B_b: BB, B_r: BR, B_q: BQ, B_k: BK,

  // 4-Player Yellow
  YP, YN, YB, YR, YQ, YK,
  Y_P: YP, Y_N: YN, Y_B: YB, Y_R: YR, Y_Q: YQ, Y_K: YK,
  Y_p: YP, Y_n: YN, Y_b: YB, Y_r: YR, Y_q: YQ, Y_k: YK,

  // 4-Player Green
  GP, GN, GB, GR, GQ, GK,
  G_P: GP, G_N: GN, G_B: GB, G_R: GR, G_Q: GQ, G_K: GK,
  G_p: GP, G_n: GN, G_b: GB, G_r: GR, G_q: GQ, G_k: GK,
};

export const PieceIcon: React.FC<{
  code: string;
  size?: number | string;
  className?: string;
  draggable?: boolean;
}> = ({ code, size = '100%', className = '', draggable = false }) => {
  const asset = PIECE_ASSETS[code];
  if (!asset) return null;

  return (
    <img
      src={asset}
      alt={code}
      draggable={draggable}
      style={{ width: size, height: size }}
      className={`select-none pointer-events-none drop-shadow-md ${className}`}
    />
  );
};
