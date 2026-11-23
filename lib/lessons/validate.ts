// レッスンデータの検証
// ノードIDや用語IDの打ち間違いなど、画面が壊れる・何も出ない原因になるミスを洗い出す。
// app/learn/[slug]/page.tsx の generateStaticParams から呼ばれ、問題があれば
// `npm run build` と開発中のページ表示がエラーで止まる。

import { TERMS } from '@/lib/terms'
import type { Lesson, Rich } from './types'

const TERM_TOKEN = /\{\{([\w-]+)(?::[^}]+)?\}\}/g

function termIdsIn(text: Rich): string[] {
  return [...text.matchAll(TERM_TOKEN)].map((m) => m[1])
}

export function validateLesson(lesson: Lesson, allSlugs: Set<string>): string[] {
  const errors: string[] = []
  const err = (where: string, msg: string) => errors.push(`[${lesson.slug}] ${where}: ${msg}`)

  // ノード・ゾーン
  const nodeIds = new Set<string>()
  lesson.nodes.forEach((n) => {
    if (nodeIds.has(n.id)) err(`nodes`, `ノードID "${n.id}" が重複しています`)
    nodeIds.add(n.id)
    if (n.term && !TERMS[n.term]) err(`nodes.${n.id}`, `用語 "${n.term}" が lib/terms.ts にありません`)
  })
  lesson.zones.forEach((z, i) => {
    if (z.term && !TERMS[z.term]) err(`zones[${i}]`, `用語 "${z.term}" が lib/terms.ts にありません`)
  })
  const checkNode = (where: string, id: string) => {
    if (!nodeIds.has(id)) err(where, `ノード "${id}" がありません`)
  }
  const checkRich = (where: string, text: Rich) => {
    termIdsIn(text).forEach((id) => {
      if (!TERMS[id]) err(where, `用語 "{{${id}}}" が lib/terms.ts にありません`)
    })
  }

  if (lesson.steps.length === 0) err('steps', 'ステップが1つもありません')

  lesson.steps.forEach((s, i) => {
    const at = `steps[${i}]「${s.short}」`
    const hidden = new Set(s.hide ?? [])

    if (s.focus !== 'all') s.focus.forEach((id) => checkNode(`${at}.focus`, id))
    s.hide?.forEach((id) => checkNode(`${at}.hide`, id))

    s.flows.forEach((f, j) => {
      if (f.path.length < 2) err(`${at}.flows[${j}]`, '経路は2ノード以上必要です')
      f.path.forEach((id) => {
        checkNode(`${at}.flows[${j}]`, id)
        if (hidden.has(id)) err(`${at}.flows[${j}]`, `非表示のノード "${id}" を通っています`)
      })
      if (f.delay !== undefined && (f.delay < 0 || f.delay >= 1)) err(`${at}.flows[${j}]`, 'delay は 0 以上 1 未満にしてください')
    })

    s.callouts.forEach((c, j) => {
      checkNode(`${at}.callouts[${j}]`, c.node)
      if (hidden.has(c.node)) err(`${at}.callouts[${j}]`, `非表示のノード "${c.node}" に吹き出しを付けています`)
    })

    s.body.forEach((b, j) => {
      if (typeof b === 'string') checkRich(`${at}.body[${j}]`, b)
      else b.list.forEach((t, k) => checkRich(`${at}.body[${j}].list[${k}]`, t))
    })
    if (s.note) checkRich(`${at}.note`, s.note)
    s.changes.forEach((c, j) => checkRich(`${at}.changes[${j}]`, c.text))

    if (s.card.highlight !== undefined && (s.card.highlight < 0 || s.card.highlight >= s.card.lines.length)) {
      err(`${at}.card`, `highlight ${s.card.highlight} が行数（${s.card.lines.length}）の範囲外です`)
    }
    if (s.quiz && (s.quiz.answer < 0 || s.quiz.answer >= s.quiz.options.length)) {
      err(`${at}.quiz`, `answer ${s.quiz.answer} が選択肢の範囲外です`)
    }
  })

  lesson.learn.forEach((l, i) => {
    if (l.atStep < 0 || l.atStep >= lesson.steps.length) err(`learn[${i}]`, `atStep ${l.atStep} がステップ数の範囲外です`)
  })

  for (const key of ['prev', 'next'] as const) {
    const href = lesson[key]?.href
    if (!href) continue
    const m = href.match(/^\/learn\/([\w-]+)$/)
    if (m && !allSlugs.has(m[1])) err(key, `リンク先のレッスン "${m[1]}" が登録されていません`)
  }

  return errors
}

export function validateLessons(lessons: Lesson[]): void {
  const slugs = new Set<string>()
  const errors: string[] = []
  lessons.forEach((l) => {
    if (slugs.has(l.slug)) errors.push(`[${l.slug}] slug が重複しています`)
    slugs.add(l.slug)
  })
  lessons.forEach((l) => errors.push(...validateLesson(l, slugs)))
  if (errors.length) {
    throw new Error(`レッスンデータに ${errors.length} 件の問題があります:\n- ${errors.join('\n- ')}`)
  }
}
