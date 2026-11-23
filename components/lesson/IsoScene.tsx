'use client'

// アイソメトリック図解：ゾーン・ノード・接続線・吹き出し・パケットを描く
// - ゾーン／ノード／接続線は JSX で描画
// - 吹き出しは文字幅と図形の位置を測ってから置くため、useLayoutEffect で命令的に描画
// - パケットは毎フレーム動くため、requestAnimationFrame で命令的に描画

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { FlowColor, IsoNode, IsoZone, LessonStep } from '@/lib/lessons/types'
import { ISO_H, ISO_W, P, anchorOf, pts, shade, type Pt } from './iso'

export const FLOW_COLORS: Record<FlowColor, string> = {
  req: '#a58be0',
  res: '#8cc97a',
  out: '#f0b23c',
  atk: '#e5534b',
}

const INK = '#1f1b16'
const MUTED = '#6f655a'
const SVG_NS = 'http://www.w3.org/2000/svg'

// パケット：1周期 CYCLE ms のうち、前半 TRAVEL の割合で移動する
const CYCLE = 2800
const TRAVEL = 0.55
const FAIL_MARK_UNTIL = 1.6 // 移動完了後、×印を出しておく長さ（TRAVEL比）

// 吹き出し
const PILL_H = 23
const PILL_GAP = 8

type Box = { x0: number; y0: number; x1: number; y1: number }
const hit = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
  parent: Element,
): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVG_NS, tag)
  for (const k in attrs) e.setAttribute(k, String(attrs[k]))
  parent.appendChild(e)
  return e
}

type Props = {
  nodes: IsoNode[]
  zones: IsoZone[]
  step: LessonStep
  playing: boolean
  /** 値が変わるとアニメーションを最初から再生 */
  replayKey: number
  ariaLabel?: string
  /** 画面に出ているパケット（flows の番号）が変わったときに呼ばれる */
  onActiveChange?: (active: number[]) => void
}

export default function IsoScene({ nodes, zones, step, playing, replayKey, ariaLabel, onActiveChange }: Props) {
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes])
  const sorted = useMemo(() => [...nodes].sort((a, b) => a.x + a.y - (b.x + b.y)), [nodes])

  const svgRef = useRef<SVGSVGElement>(null)
  const staticRef = useRef<SVGGElement>(null)
  const nodesRef = useRef<SVGGElement>(null)
  const calloutRef = useRef<SVGGElement>(null)
  const packetRef = useRef<SVGGElement>(null)
  const [viewBox, setViewBox] = useState('-460 -150 940 660')

  // 図の実寸に合わせて viewBox を詰める（上は吹き出し用に余白）
  useLayoutEffect(() => {
    const g = staticRef.current
    if (!g) return
    const b = g.getBBox()
    setViewBox(`${b.x - 16} ${b.y - 48} ${b.width + 32} ${b.height + 60}`)
  }, [nodes, zones])

  /** ノードの外形（影を除く） */
  const nodeBox = (id: string): Box | null => {
    const g = nodesRef.current?.querySelector<SVGGElement>(`[data-node="${id}"]`)
    if (!g) return null
    let b: Box | null = null
    Array.from(g.children)
      .slice(1)
      .forEach((c) => {
        const r = (c as SVGGraphicsElement).getBBox()
        const box = { x0: r.x, y0: r.y, x1: r.x + r.width, y1: r.y + r.height }
        b = b
          ? { x0: Math.min(b.x0, box.x0), y0: Math.min(b.y0, box.y0), x1: Math.max(b.x1, box.x1), y1: Math.max(b.y1, box.y1) }
          : box
      })
    return b
  }

  // 吹き出し：上 → 右 → 左 → 下 … の順に、図形・他の吹き出し・枠外と重ならない位置を探す
  useLayoutEffect(() => {
    const g = calloutRef.current
    const svg = svgRef.current
    if (!g || !svg) return
    g.replaceChildren()
    const vb = svg.viewBox.baseVal
    const hidden = new Set(step.hide ?? [])
    const obstacles = nodes
      .filter((n) => !hidden.has(n.id))
      .map((n) => nodeBox(n.id))
      .filter((b): b is Box => !!b)
    // ゾーン名（回転した文字もあるので、画面上の矩形をSVG座標に戻して使う）
    const inv = svg.getScreenCTM()?.inverse()
    if (inv) {
      svg.querySelectorAll('[data-zone-label]').forEach((el) => {
        const r = el.getBoundingClientRect()
        const p1 = new DOMPoint(r.left, r.top).matrixTransform(inv)
        const p2 = new DOMPoint(r.right, r.bottom).matrixTransform(inv)
        obstacles.push({ x0: Math.min(p1.x, p2.x), y0: Math.min(p1.y, p2.y), x1: Math.max(p1.x, p2.x), y1: Math.max(p1.y, p2.y) })
      })
    }
    const taken: Box[] = []

    step.callouts.forEach((c) => {
      const nb = nodeBox(c.node)
      if (!nb) return
      const pg = svgEl('g', { class: 'lp-pill' }, g)
      const text = svgEl('text', { 'text-anchor': 'middle' }, pg)
      text.textContent = c.text
      const w = text.getBBox().width + 20
      const cx = (nb.x0 + nb.x1) / 2
      const cy = (nb.y0 + nb.y1) / 2
      const cands: Pt[] = [
        [cx, nb.y0 - PILL_GAP - PILL_H / 2],
        [nb.x1 + PILL_GAP + w / 2, cy],
        [nb.x0 - PILL_GAP - w / 2, cy],
        [cx, nb.y1 + PILL_GAP + PILL_H / 2],
        [nb.x1 + PILL_GAP + w / 2, nb.y0 - PILL_H / 2],
        [nb.x0 - PILL_GAP - w / 2, nb.y0 - PILL_H / 2],
      ]
      // 枠外は重く、重なりは数に応じて減点。最も点の低い（同点なら先の）候補を選ぶ
      let pos = cands[0]
      let best = Infinity
      for (const [x, y] of cands) {
        const r = { x0: x - w / 2 - 2, y0: y - PILL_H / 2 - 2, x1: x + w / 2 + 5, y1: y + PILL_H / 2 + 5 }
        const inside = r.x0 > vb.x && r.y0 > vb.y && r.x1 < vb.x + vb.width && r.y1 < vb.y + vb.height
        const score = (inside ? 0 : 100) + obstacles.concat(taken).filter((o) => hit(r, o)).length * 10
        if (score < best) {
          best = score
          pos = [x, y]
          if (score === 0) break
        }
      }
      const [x, y] = pos
      text.setAttribute('x', String(x))
      text.setAttribute('y', String(y + 4))
      const shadow = svgEl('rect', { x: x - w / 2 + 2.5, y: y - PILL_H / 2 + 2.5, width: w, height: PILL_H, rx: 11 }, pg)
      shadow.style.fill = INK
      const body = svgEl('rect', { x: x - w / 2, y: y - PILL_H / 2, width: w, height: PILL_H, rx: 11 }, pg)
      if (c.tone) body.style.fill = c.tone
      pg.appendChild(text) // 文字を最前面へ
      taken.push({ x0: x - w / 2, y0: y - PILL_H / 2, x1: x + w / 2 + 3, y1: y + PILL_H / 2 + 3 })
    })
  }, [step, viewBox, nodes])

  // パケット
  const stepRef = useRef(step)
  const onActiveRef = useRef(onActiveChange)
  const lastActiveRef = useRef('')
  useEffect(() => {
    onActiveRef.current = onActiveChange
  }, [onActiveChange])
  const playingRef = useRef(playing)
  const elapsedRef = useRef(0)
  useEffect(() => {
    stepRef.current = step
    elapsedRef.current = 0
  }, [step, replayKey])
  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  useEffect(() => {
    const along = (path: string[], f: number): Pt => {
      const ps = path.map((id) => anchorOf(byId[id]))
      const lens: number[] = []
      let total = 0
      for (let i = 0; i < ps.length - 1; i++) {
        const d = Math.hypot(ps[i + 1][0] - ps[i][0], ps[i + 1][1] - ps[i][1])
        lens.push(d)
        total += d
      }
      let r = f * total
      for (let i = 0; i < lens.length; i++) {
        if (r <= lens[i]) {
          const k = r / lens[i]
          return [ps[i][0] + (ps[i + 1][0] - ps[i][0]) * k, ps[i][1] + (ps[i + 1][1] - ps[i][1]) * k]
        }
        r -= lens[i]
      }
      return ps[ps.length - 1]
    }

    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      if (playingRef.current) elapsedRef.current += now - last
      last = now
      const g = packetRef.current
      if (g) {
        g.replaceChildren()
        const phase = (elapsedRef.current % CYCLE) / CYCLE
        const active: number[] = []
        stepRef.current.flows.forEach((f, fi) => {
          let l = phase - (f.delay ?? 0)
          if (l < 0) l += 1
          const k = l / TRAVEL
          if (k <= 1 || (f.fail && k < FAIL_MARK_UNTIL)) active.push(fi)
          if (k <= 1) {
            const [x, y] = along(f.path, k)
            svgEl('circle', { cx: x, cy: y, r: 6.5, fill: FLOW_COLORS[f.color], stroke: INK, 'stroke-width': 2 }, g)
          } else if (f.fail && k < FAIL_MARK_UNTIL) {
            const [x, y] = anchorOf(byId[f.path[f.path.length - 1]])
            svgEl('circle', { cx: x, cy: y, r: 10, fill: FLOW_COLORS.atk, stroke: INK, 'stroke-width': 2 }, g)
            svgEl('path', { d: `M${x - 4},${y - 4}L${x + 4},${y + 4}M${x + 4},${y - 4}L${x - 4},${y + 4}`, stroke: '#fff', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g)
          }
        })
        const key = active.join(',')
        if (key !== lastActiveRef.current) {
          lastActiveRef.current = key
          onActiveRef.current?.(active)
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [byId])

  // 接続線（このステップで流れる経路だけ）
  const edges = useMemo(() => {
    const seen = new Set<string>()
    const out: { key: string; a: Pt; b: Pt; fail: boolean }[] = []
    step.flows.forEach((f) => {
      for (let i = 0; i < f.path.length - 1; i++) {
        const key = [f.path[i], f.path[i + 1]].sort().join('-') + (f.fail ? '-fail' : '')
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ key, a: anchorOf(byId[f.path[i]]), b: anchorOf(byId[f.path[i + 1]]), fail: !!f.fail })
      }
    })
    return out
  }, [step, byId])

  const focused = (id: string) => step.focus === 'all' || step.focus.includes(id)
  const isHidden = (id: string) => !!step.hide?.includes(id)

  return (
    <svg ref={svgRef} className="lp-scene" viewBox={viewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label={ariaLabel}>
      <g ref={staticRef}>
        {/* ゾーン（面） */}
        <g>
          {zones.map((z, i) => (
            <polygon
              key={i}
              points={pts([P(z.x0, z.y0), P(z.x1, z.y0), P(z.x1, z.y1), P(z.x0, z.y1)])}
              fill={z.fill}
              stroke={INK}
              strokeWidth={z.dash ? 2 : 1.5}
              strokeDasharray={z.dash}
              strokeOpacity={z.dash ? 0.7 : 0.35}
            />
          ))}
        </g>

        {/* 接続線 */}
        <g>
          {edges.map((e) => (
            <line key={e.key} x1={e.a[0]} y1={e.a[1]} x2={e.b[0]} y2={e.b[1]} className={`lp-edge${e.fail ? ' fail' : ''}`} />
          ))}
        </g>

        {/* ゾーン名（接続線より上、ノードより下） */}
        <g>
          {zones.map((z, i) => {
            const [lx, ly] = z.labelAt === 'top' ? P(z.x0, z.y0) : P((z.x0 + z.x1) / 2, z.y1 + 0.3)
            const common = { textAnchor: 'middle' as const, fontWeight: 700, fill: MUTED, stroke: '#fbf5ec', strokeWidth: 3, paintOrder: 'stroke' as const, strokeLinejoin: 'round' as const, 'data-term': z.term, 'data-zone-label': true }
            return z.labelAt === 'top' ? (
              <text key={i} x={lx} y={ly - 12} fontSize={12} {...common}>
                {z.label}
              </text>
            ) : (
              <text key={i} x={lx} y={ly} fontSize={11} dominantBaseline="middle" transform={`rotate(30 ${lx} ${ly})`} {...common}>
                {z.label}
              </text>
            )
          })}
        </g>

        {/* ノード（奥から手前の順） */}
        <g ref={nodesRef}>
          {sorted.map((n) => (
            <IsoNodeShape key={n.id} n={n} dim={!focused(n.id)} hidden={isHidden(n.id)} />
          ))}
        </g>
      </g>
      <g ref={calloutRef} />
      <g ref={packetRef} />
    </svg>
  )
}

function IsoNodeShape({ n, dim, hidden }: { n: IsoNode; dim: boolean; hidden: boolean }) {
  const st = { stroke: INK, strokeWidth: 2.4, strokeLinejoin: 'round' as const }
  const [gx, gy] = P(n.x, n.y)
  const [tx, ty] = P(n.x, n.y, n.h)
  let shape: ReactNode

  if (n.kind === 'cyl') {
    const r = n.s * 0.95
    const rx = Math.SQRT2 * r * ISO_W
    const ry = Math.SQRT2 * r * ISO_H
    shape = (
      <>
        <path d={`M${gx - rx},${ty} L${gx - rx},${gy} A${rx},${ry} 0 0 0 ${gx + rx},${gy} L${gx + rx},${ty} Z`} fill={shade(n.fill, 0.12)} {...st} />
        <ellipse cx={gx} cy={ty} rx={rx} ry={ry} fill={n.fill} {...st} />
      </>
    )
  } else {
    const { x, y, s, h } = n
    const t = n.sy ?? s
    const A = P(x - s, y - t, h), B = P(x + s, y - t, h), C = P(x + s, y + t, h), D = P(x - s, y + t, h)
    const B0 = P(x + s, y - t), C0 = P(x + s, y + t), D0 = P(x - s, y + t)
    shape = (
      <>
        <polygon points={pts([B, C, C0, B0])} fill={shade(n.fill, 0.1)} {...st} />
        <polygon points={pts([D, C, C0, D0])} fill={shade(n.fill, 0.2)} {...st} />
        <polygon points={pts([A, B, C, D])} fill={n.fill} {...st} />
      </>
    )
  }

  return (
    <g className={`lp-node${dim ? ' dim' : ''}${hidden ? ' is-hidden' : ''}`} data-node={n.id} data-term={hidden ? undefined : n.term} aria-hidden={hidden || undefined}>
      {/* 影（先頭の子要素。外形計算では除外する） */}
      <ellipse cx={gx + 6} cy={gy + 8} rx={Math.min(n.s, n.sy ?? n.s) * ISO_W * 1.6} ry={Math.min(n.s, n.sy ?? n.s) * ISO_H * 1.6} fill="rgba(31,27,22,.10)" />
      {shape}
      <text x={tx} y={ty + 4} textAnchor="middle" fontSize={n.fontSize ?? 13} fontWeight={700} fill={INK} stroke="#fffaf3" strokeWidth={3} paintOrder="stroke" strokeLinejoin="round">
        {n.label}
      </text>
    </g>
  )
}
