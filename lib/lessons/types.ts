// レッスン（ステップ再生式のアイソメトリック図解）のデータ型
//
// テキスト中の記法（Rich）:
//   {{alb}}          → 用語ツールチップ付きで TERMS.alb.name を表示
//   {{alb:ロードバランサー}} → 表示文字だけ変える
//   **強調**          → 太字

import type { CategorySlug } from '@/lib/categories'

export type Rich = string

/** 本文ブロック。文字列は段落、{ list } は箇条書き */
export type Block = Rich | { list: Rich[] }

/** アイソメトリック座標（グリッド単位）。x は右下、y は左下に伸びる */
export interface IsoNode {
  id: string
  x: number
  y: number
  /** 半径（グリッド単位）。sy を指定すると x 方向の半径になる */
  s: number
  /** y 方向の半径（壁のような細長い箱に使う。省略時は s） */
  sy?: number
  /** 高さ（px） */
  h: number
  fill: string
  label: string
  fontSize?: number
  kind?: 'cube' | 'cyl'
  /** ホバーで出す用語（lib/terms.ts のキー） */
  term?: string
  /** 図形の下に小さく添えるIPアドレス（パケットの流れ表と対応させる） */
  ip?: string
}

export interface IsoZone {
  x0: number
  y0: number
  x1: number
  y1: number
  fill: string
  label: string
  /** top: 上の頂点に水平表示 / edge: 左下の辺に沿って表示 */
  labelAt: 'top' | 'edge'
  dash?: string
  term?: string
}

export type FlowColor = 'req' | 'res' | 'out' | 'atk'

/** ノードIDを順にたどるパケット */
export interface Flow {
  path: string[]
  color: FlowColor
  /** 周期内の開始位置（0〜1） */
  delay?: number
  /** 最後のノードで × を出して止まる */
  fail?: boolean
  /** パケットの流れ表に出す中身（省略すると表に出ない） */
  packet?: Packet
}

/** パケットの流れ表の1行 */
export interface Packet {
  /** 送信元（例：198.51.100.7:52344） */
  src: string
  /** 宛先（例：10.0.1.10:443） */
  dst: string
  /** 種類（例：TCP SYN、HTTPS） */
  proto: string
  /** 判定とその理由（例：許可（sg-web 443）） */
  result: string
  /** 通ったか */
  ok: boolean
}

export interface Callout {
  node: string
  text: string
  tone?: string
}

export interface Chip {
  label: string
  value: string
  tone?: 'good' | 'bad'
}

export interface InfoCard {
  title: string
  lines: string[]
  highlight?: number
}

export interface Quiz {
  question: string
  options: string[]
  answer: number
  explanation: string
}

export interface LessonStep {
  short: string
  tag: string
  title: string
  body: Block[]
  note?: Rich
  changes: { kind: 'add' | 'mod'; text: Rich }[]
  focus: 'all' | string[]
  /** このステップでは描かないノード（同じ位置に別のノードを置くときなどに使う） */
  hide?: string[]
  flows: Flow[]
  callouts: Callout[]
  chips: Chip[]
  card: InfoCard
  quiz?: Quiz
}

export interface Lesson {
  slug: string
  /** サイドナビで所属する章 */
  category: CategorySlug
  chapter: string
  lessonLabel: string
  title: string
  lead: string
  /** meta description（省略時は lead） */
  description?: string
  minutes: number
  badge: string
  nodes: IsoNode[]
  zones: IsoZone[]
  steps: LessonStep[]
  /** atStep 以上のステップに進むとチェックが付く（0始まり） */
  learn: { text: string; atStep: number }[]
  prev?: { title: string; href?: string }
  next?: { title: string; href?: string }
}
