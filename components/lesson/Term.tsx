'use client'

// 用語ツールチップ
// - <Term id="alb" />            : 用語を下線付きで表示（ホバー／タップ／フォーカスで説明）
// - <RichText text="..." />      : {{id}} {{id:表示}} **強調** を含む文字列を描画
// - <TermTooltip />              : ページに1つ置く。data-term を持つ要素（SVG含む）すべてに反応
// - hideTermTip()                : ステップ切り替え時などに閉じる

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { TERMS } from '@/lib/terms'

const HIDE_EVENT = 'term-tip:hide'
export const hideTermTip = () => window.dispatchEvent(new Event(HIDE_EVENT))

export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const t = TERMS[id]
  if (!t) return <>{children ?? id}</>
  return (
    <span className="term-link" data-term={id} tabIndex={0}>
      {children ?? t.name}
    </span>
  )
}

const TOKEN_SRC = /\{\{([\w-]+)(?::([^}]+))?\}\}|\*\*(.+?)\*\*/.source

export function RichText({ text }: { text: string }) {
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  // 再帰（**強調** の中の {{用語}}）でも状態を共有しないよう、呼び出しごとに生成
  const token = new RegExp(TOKEN_SRC, 'g')
  while ((m = token.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1]) out.push(<Term key={m.index} id={m[1]}>{m[2]}</Term>)
    else out.push(<b key={m.index}><RichText text={m[3]} /></b>)
    last = token.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return <>{out.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</>
}

export function TermTooltip() {
  const [active, setActive] = useState<{ id: string; el: Element } | null>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(active)
  const hideTimer = useRef<number | undefined>(undefined)
  const shownAt = useRef(0)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  // 表示位置：対象の下（入らなければ上）、画面からはみ出さない
  useLayoutEffect(() => {
    const tip = tipRef.current
    if (!tip || !active) return
    const r = active.el.getBoundingClientRect()
    const tw = tip.offsetWidth
    const th = tip.offsetHeight
    const left = Math.min(Math.max(r.left + r.width / 2 - tw / 2, 8), window.innerWidth - tw - 8)
    let top = r.bottom + 8
    if (top + th > window.innerHeight - 8) top = Math.max(8, r.top - th - 8)
    tip.style.left = `${left}px`
    tip.style.top = `${top}px`
  }, [active])

  useEffect(() => {
    const isTouch = window.matchMedia('(hover: none)').matches
    const termOf = (e: Event) => (e.target as Element | null)?.closest?.('[data-term]') ?? null
    const inTip = (e: Event) => !!(e.target as Element | null)?.closest?.('.term-tip')

    const show = (el: Element) => {
      const id = el.getAttribute('data-term')
      if (!id || !TERMS[id]) return
      window.clearTimeout(hideTimer.current)
      const cur = activeRef.current
      if (cur?.el !== el) {
        cur?.el.classList.remove('on')
        shownAt.current = performance.now()
      }
      el.classList.add('on')
      setActive({ id, el })
    }
    const hide = (now = false) => {
      window.clearTimeout(hideTimer.current)
      const run = () => {
        activeRef.current?.el.classList.remove('on')
        setActive(null)
      }
      if (now) run()
      else hideTimer.current = window.setTimeout(run, 150)
    }

    const onOver = (e: MouseEvent) => {
      if (isTouch) return
      const t = termOf(e)
      if (t) show(t)
      else if (inTip(e)) window.clearTimeout(hideTimer.current)
    }
    const onOut = (e: MouseEvent) => {
      if (isTouch) return
      if (termOf(e) || inTip(e)) hide()
    }
    const onClick = (e: MouseEvent) => {
      const t = termOf(e)
      if (t) {
        const cur = activeRef.current
        if (cur?.el === t && performance.now() - shownAt.current > 400) hide(true)
        else show(t)
      } else if (!inTip(e)) hide(true)
    }
    const onFocusIn = (e: FocusEvent) => {
      const t = termOf(e)
      if (t) show(t)
    }
    const onFocusOut = (e: FocusEvent) => {
      if (termOf(e)) hide()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide(true)
    }
    const onHide = () => hide(true)
    const onScroll = (e: Event) => {
      if (!inTip(e)) hide(true)
    }

    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    document.addEventListener('click', onClick)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    document.addEventListener('keydown', onKey)
    document.addEventListener('scroll', onScroll, true)
    window.addEventListener(HIDE_EVENT, onHide)
    return () => {
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      document.removeEventListener('click', onClick)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener(HIDE_EVENT, onHide)
      window.clearTimeout(hideTimer.current)
    }
  }, [])

  if (!active) return null
  const t = TERMS[active.id]
  return (
    <div ref={tipRef} className="term-tip" role="tooltip">
      <span className="term-tip-name">{t.name}</span>
      {t.full && <span className="term-tip-full">{t.full}</span>}
      <p>{t.desc}</p>
      {t.analogy && (
        <div className="term-tip-analogy">
          <b>たとえ</b>
          {t.analogy}
        </div>
      )}
    </div>
  )
}
