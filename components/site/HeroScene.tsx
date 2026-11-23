'use client'

// トップページのヒーローに置く、実際のレッスン図（パケットが流れ続ける）

import IsoScene from '@/components/lesson/IsoScene'
import { TermTooltip } from '@/components/lesson/Term'
import type { IsoNode, IsoZone, LessonStep } from '@/lib/lessons/types'
import '@/components/lesson/lesson.css'

type Props = { nodes: IsoNode[]; zones: IsoZone[]; step: LessonStep; label: string }

export default function HeroScene({ nodes, zones, step, label }: Props) {
  return (
    <div className="home-scene">
      <IsoScene nodes={nodes} zones={zones} step={step} playing replayKey={0} ariaLabel={label} />
      <TermTooltip />
    </div>
  )
}
