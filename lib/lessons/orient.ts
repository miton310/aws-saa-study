// 門（ゲートウェイ）とキューの向きを、つながる相手の位置から決める。
// レッスンの全ステップの流れ（flows）で隣り合うノードを集め、x 方向と y 方向のどちらに多くつながるかで axis を付ける。
import type { Lesson } from './types'

const ORIENTED = new Set(['gateway', 'nat', 'queue', 'lb'])

export function orientNodes(lesson: Lesson): Lesson {
  const byId = Object.fromEntries(lesson.nodes.map((n) => [n.id, n]))
  const score: Record<string, { x: number; y: number }> = {}
  for (const step of lesson.steps) {
    for (const f of step.flows) {
      for (let i = 0; i < f.path.length; i++) {
        const n = byId[f.path[i]]
        if (!n || !ORIENTED.has(n.kind ?? '')) continue
        for (const j of [i - 1, i + 1]) {
          const m = byId[f.path[j]]
          if (!m) continue
          const s = (score[n.id] ??= { x: 0, y: 0 })
          s.x += Math.abs(m.x - n.x)
          s.y += Math.abs(m.y - n.y)
        }
      }
    }
  }
  return {
    ...lesson,
    nodes: lesson.nodes.map((n) => {
      if (n.axis || !score[n.id]) return n
      return { ...n, axis: score[n.id].x >= score[n.id].y ? 'x' : 'y' }
    }),
  }
}
