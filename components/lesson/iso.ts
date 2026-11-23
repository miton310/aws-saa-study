// アイソメトリック投影の共通ヘルパー
import type { IsoNode } from '@/lib/lessons/types'

export const ISO_W = 46
export const ISO_H = 26.5

export type Pt = [number, number]

/** グリッド座標 (x, y, 高さz[px]) → SVG座標 */
export const P = (x: number, y: number, z = 0): Pt => [(x - y) * ISO_W, (x + y) * ISO_H - z]

export const pts = (a: Pt[]) => a.map((p) => p.join(',')).join(' ')

/** #rrggbb を amt(0〜1) だけ暗くする */
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16)
  const f = (v: number) => Math.round(v * (1 - amt))
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`
}

/** パケットや線をつなぐ位置（ノードの中腹） */
export const anchorOf = (n: IsoNode): Pt => P(n.x, n.y, n.h * 0.5)

/** ノード上面の中心 */
export const topOf = (n: IsoNode): Pt => P(n.x, n.y, n.h)
