// 役割が形でわかる図形：ロードバランサー・ゲートウェイ（鳥居）・NATゲートウェイ・キュー
// IsoScene の IsoNodeShape から呼ばれる。どれも「奥から手前」の順に描く。

import type { ReactNode } from 'react'
import type { IsoNode } from '@/lib/lessons/types'
import { ISO_H, ISO_W, P, pts, shade, type Pt } from './iso'

const INK = '#1f1b16'
const PAPER = '#fffaf3'
const st = { stroke: INK, strokeWidth: 2.4, strokeLinejoin: 'round' as const }

export type SpecialKind = 'lb' | 'gateway' | 'nat' | 'queue'
export const isSpecial = (n: IsoNode): n is IsoNode & { kind: SpecialKind } =>
  n.kind === 'lb' || n.kind === 'gateway' || n.kind === 'nat' || n.kind === 'queue'

/** 通り抜ける向き：'x' なら x 方向に通る（門は y 方向に柱が並ぶ）。未指定は 'x' */
const axisOf = (n: IsoNode) => n.axis ?? 'x'

/** 通る向き a・横方向 b の局所座標 → グリッド座標 */
function local(n: IsoNode, a: number, b: number): [number, number] {
  return axisOf(n) === 'x' ? [n.x + a, n.y + b] : [n.x + b, n.y + a]
}

/** 中心 (a, b)・半径 (sa, sb)・高さ z〜z+h の箱（局所座標で指定） */
function box(n: IsoNode, a: number, b: number, sa: number, sb: number, z: number, h: number, fill: string, key: string) {
  const [x, y] = local(n, a, b)
  const [s, t] = axisOf(n) === 'x' ? [sa, sb] : [sb, sa]
  const A = P(x - s, y - t, z + h), B = P(x + s, y - t, z + h), C = P(x + s, y + t, z + h), D = P(x - s, y + t, z + h)
  const B0 = P(x + s, y - t, z), C0 = P(x + s, y + t, z), D0 = P(x - s, y + t, z)
  return (
    <g key={key}>
      <polygon points={pts([B, C, C0, B0])} fill={shade(fill, 0.1)} {...st} />
      <polygon points={pts([D, C, C0, D0])} fill={shade(fill, 0.2)} {...st} />
      <polygon points={pts([A, B, C, D])} fill={fill} {...st} />
    </g>
  )
}

/** 円柱（中心はグリッド座標） */
function cyl(x: number, y: number, r: number, z: number, h: number, fill: string, key: string) {
  const [gx, gy] = P(x, y, z)
  const [, ty] = P(x, y, z + h)
  const rx = Math.SQRT2 * r * ISO_W
  const ry = Math.SQRT2 * r * ISO_H
  return (
    <g key={key}>
      <path d={`M${gx - rx},${ty} L${gx - rx},${gy} A${rx},${ry} 0 0 0 ${gx + rx},${gy} L${gx + rx},${ty} Z`} fill={shade(fill, 0.12)} {...st} />
      <ellipse cx={gx} cy={ty} rx={rx} ry={ry} fill={fill} {...st} />
    </g>
  )
}

/** 地面などに寝かせた平たい矢印（グリッド座標で始点・向き・長さ） */
function flatArrow(x0: number, y0: number, dx: number, dy: number, len: number, z: number, w: number, key: string) {
  const l = Math.hypot(dx, dy)
  const [ux, uy] = [dx / l, dy / l]
  const [nx, ny] = [-uy, ux]
  const hb = len * 0.6
  const q = (a: number, b: number) => P(x0 + ux * a + nx * b, y0 + uy * a + ny * b, z)
  return (
    <polygon
      key={key}
      points={pts([q(0, -w), q(hb, -w), q(hb, -w * 2.4), q(len, 0), q(hb, w * 2.4), q(hb, w), q(0, w)])}
      fill={PAPER}
      stroke={INK}
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
  )
}

// ---- 寸法（描画・線の接続位置・下の文字の位置で共通に使う） ----

/** 門の高さ（箱の h より高くして、くぐれるようにする） */
const gateH = (n: IsoNode) => Math.max(n.h * 1.6, 44)
/** 門の柱の間隔（中心からの距離）と柱の太さ */
const gateSpan = (n: IsoNode) => n.s * 1.45
const pillar = (n: IsoNode) => n.s * 0.24
/** キューのトレイ：通る向きの半径・横の半径・高さ、封筒の高さ */
const tray = (n: IsoNode) => ({ la: n.s * 1.35, lb: n.s * 0.55, h: 9, env: Math.max(n.h - 6, 20) })
/** ロードバランサーの台座の半径・高さ */
const lbBase = (n: IsoNode) => ({ r: n.s * 1.1, h: Math.max(n.h * 0.45, 14) })

/** 線やパケットをつなぐ位置（ノードの中腹。門は柱の間のくぐる高さ） */
export function anchorOf(n: IsoNode): Pt {
  return P(n.x, n.y, isSpecial(n) ? specialAnchorZ(n) : n.h * 0.5)
}

/** 線やパケットをつなぐ高さ。門は柱の間（くぐる高さ） */
export function specialAnchorZ(n: IsoNode & { kind: SpecialKind }): number {
  if (n.kind === 'gateway' || n.kind === 'nat') return gateH(n) * 0.32
  if (n.kind === 'lb') return lbBase(n).h * 0.6
  return tray(n).h + tray(n).env * 0.4
}

/** 図形の下の文字の位置（図形のいちばん手前の点のすぐ下） */
export function specialSubAnchor(n: IsoNode & { kind: SpecialKind }): Pt {
  if (n.kind === 'lb' && !n.sy) {
    const [gx, gy] = P(n.x, n.y)
    return [gx, gy + Math.SQRT2 * lbBase(n).r * ISO_H + 14]
  }
  let a: number, b: number
  if (n.kind === 'lb') [a, b] = axisOf(n) === 'x' ? [n.s, n.sy ?? n.s] : [n.sy ?? n.s, n.s]
  else if (n.kind === 'queue') [a, b] = [tray(n).la, tray(n).lb]
  else [a, b] = [pillar(n) * 1.6, gateSpan(n) + pillar(n)]
  const [x, y] = axisOf(n) === 'x' ? [n.x + a, n.y + b] : [n.x + b, n.y + a]
  const [px, py] = P(x, y)
  return [px, py + 14]
}

/** 図形本体と、名前を置く高さ（画面の y） */
export function specialShape(n: IsoNode & { kind: SpecialKind }): { shape: ReactNode; labelY: number } {
  const out: ReactNode[] = []
  const [, cy] = P(n.x, n.y)

  if (n.kind === 'lb') {
    // 台座（円柱。横長に指定されたものは平たい箱）の上に白いハブと、3方向に分かれる矢印
    const { r, h } = lbBase(n)
    if (n.sy) out.push(box(n, 0, 0, axisOf(n) === 'x' ? n.s : n.sy, axisOf(n) === 'x' ? n.sy : n.s, 0, h, n.fill, 'base'))
    else out.push(cyl(n.x, n.y, r, 0, h, n.fill, 'base'))
    out.push(cyl(n.x, n.y, r * 0.22, h, 8, PAPER, 'hub'))
    const len = (n.sy ? Math.min(n.s, n.sy) : r) * 0.8
    const dirs: [number, number][] = [[1, -0.6], [1, 0.25], [0.35, 1]]
    dirs.forEach(([dx, dy], i) => out.push(flatArrow(n.x + dx * r * 0.2, n.y + dy * r * 0.2, dx, dy, len, h, r * 0.1, `a${i}`)))
    const topY = P(n.x, n.y, h + 8)[1] - Math.SQRT2 * r * ISO_H
    return { shape: out, labelY: topY - 6 }
  }

  if (n.kind === 'gateway' || n.kind === 'nat') {
    // 鳥居：奥の柱 → 下の横木 → 手前の柱 → 上の横木（笠木）の順。柱の間を線とパケットがくぐる
    const G = gateH(n), span = gateSpan(n), p = pillar(n)
    const backB = -span, frontB = span
    out.push(box(n, 0, backB, p, p, 0, G, n.fill, 'pb'))
    out.push(box(n, 0, 0, p * 0.55, span, G * 0.72, 6, n.fill, 'nuki'))
    if (n.kind === 'nat') {
      // 片開きの扉：手前の柱に付いて、通る向きに開いている（中からしか開かない勝手口）
      out.push(box(n, span * 0.42, frontB - p * 1.3, span * 0.4, 0.03, 0, G * 0.6, PAPER, 'door'))
    }
    out.push(box(n, 0, frontB, p, p, 0, G, n.fill, 'pf'))
    out.push(box(n, 0, 0, p * 1.1, span + p * 2.2, G, 9, n.fill, 'kasagi'))
    return { shape: out, labelY: P(n.x, n.y, G + 9)[1] - 16 }
  }

  // キュー：細長いトレイの上に、封筒が通る向きに順番に並ぶ
  const { la, lb, h, env } = tray(n)
  out.push(box(n, 0, 0, la, lb, 0, h, n.fill, 'tray'))
  const count = 4
  for (let i = 0; i < count; i++) {
    const a = -la * 0.72 + (i * (la * 1.44)) / (count - 1)
    out.push(box(n, a, 0, 0.045, lb * 0.72, h, env, PAPER, `e${i}`))
    // 封筒のふた（手前に見える面に V 字）
    const top = h + env
    const e = 0.045
    const [p1, p2, p3] = [P(...local(n, a + e, -lb * 0.72), top), P(...local(n, a + e, 0), top - env * 0.38), P(...local(n, a + e, lb * 0.72), top)]
    out.push(<polyline key={`v${i}`} points={pts([p1, p2, p3])} fill="none" stroke={INK} strokeWidth={1.2} />)
  }
  return { shape: out, labelY: Math.min(cy, P(n.x, n.y, h + env)[1]) - 22 }
}
