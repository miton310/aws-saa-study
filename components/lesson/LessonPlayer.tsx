'use client'

// ステップ再生式レッスン（図解キャンバス＋ステッパー＋解説パネル）

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { Block, Lesson } from '@/lib/lessons/types'
import IsoScene, { FLOW_COLORS } from './IsoScene'
import { RichText, TermTooltip, hideTermTip } from './Term'
import './lesson.css'

const LEGEND = [
  { color: FLOW_COLORS.req, label: 'リクエスト' },
  { color: FLOW_COLORS.res, label: 'レスポンス' },
  { color: FLOW_COLORS.out, label: 'アウトバウンド' },
  { color: FLOW_COLORS.atk, label: '攻撃・失敗' },
]

export default function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const { steps } = lesson
  const [cur, setCur] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [replayKey, setReplayKey] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const step = steps[cur]

  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= steps.length) return
      hideTermTip()
      setPicked(null)
      setCur(i)
    },
    [steps.length],
  )
  const replay = useCallback(() => {
    setReplayKey((k) => k + 1)
    setPlaying(true)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as Element).closest('input, textarea, select, [contenteditable]')) return
      if (e.key === 'ArrowRight') go(cur + 1)
      else if (e.key === 'ArrowLeft') go(cur - 1)
      else if (e.key === 'r' || e.key === 'R') replay()
      else if (e.key === ' ') {
        e.preventDefault()
        setPlaying((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cur, go, replay])

  const isLast = cur === steps.length - 1

  return (
    <div className="lp">
      <main className="lp-main">
        <section className="lp-card lp-head">
          <div className="lp-crumb">
            {lesson.chapter}　/　{lesson.lessonLabel}
          </div>
          <div className="lp-title-row">
            <h1>{lesson.title}</h1>
            <div className="lp-badges">
              <span className="lp-badge" style={{ background: 'var(--lp-yellow)' }}>◷ {lesson.minutes} 分</span>
              <span className="lp-badge" style={{ background: 'var(--lp-green)' }}>{lesson.badge}</span>
              <span className="lp-badge" style={{ background: 'var(--lp-purple)' }}>{steps.length} ステップ</span>
            </div>
          </div>
          <p className="lp-lead">{lesson.lead}</p>
        </section>

        <section className="lp-card lp-stage">
          <div className="lp-stage-top">
            <div className="lp-chips">
              {step.chips.map((c) => (
                <div key={c.label} className={`lp-chip ${c.tone ?? ''}`}>
                  <small>{c.label}</small>
                  <b>{c.value}</b>
                </div>
              ))}
            </div>
            <div className="lp-controls">
              <button type="button" className="lp-btn" onClick={replay}>↻ 再生</button>
              <button type="button" className="lp-btn" onClick={() => setPlaying((p) => !p)}>
                {playing ? 'Ⅱ 一時停止' : '▶ 再開'}
              </button>
            </div>
          </div>

          <IsoScene nodes={lesson.nodes} zones={lesson.zones} step={step} playing={playing} replayKey={replayKey} ariaLabel={`${lesson.title}の構成図`} />

          <div className="lp-stage-bottom">
            <div className="lp-legend">
              {LEGEND.map((l) => (
                <span key={l.label}>
                  <i style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
            <div className="lp-infocard">
              <h4>🔑 {step.card.title}</h4>
              {step.card.lines.map((l, i) => (
                <div key={l} className={`lp-ln${i === step.card.highlight ? ' hl' : ''}`}>{l}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-card lp-stepper">
          <div className="lp-stepper-hd">
            <span>このレッスン</span>
            <span>ステップ {cur + 1} / {steps.length}</span>
          </div>
          <div className="lp-track">
            {steps.map((s, i) => (
              <button type="button" key={s.short} className={`lp-st${i < cur ? ' done' : ''}${i === cur ? ' cur' : ''}`} onClick={() => go(i)} aria-current={i === cur ? 'step' : undefined}>
                <div className="lp-n">{i + 1}</div>
                <span>{s.short}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <div className="lp-right">
        <section className="lp-card lp-panel">
          <div className="lp-panel-top">
            <span>ステップ {cur + 1} / {steps.length}</span>
            <span className="lp-tag">{step.tag}</span>
          </div>
          <h2>{step.title}</h2>
          <div className="lp-body">
            {step.body.map((b, i) => (
              <BodyBlock key={i} block={b} />
            ))}
          </div>

          {step.note && (
            <div className="lp-note">
              <span className="lp-note-ic">!</span>
              <div>
                <b>注意</b>
                <br />
                <RichText text={step.note} />
              </div>
            </div>
          )}

          {step.changes.length > 0 && (
            <div className="lp-changes">
              <h5>変わったこと</h5>
              {step.changes.map((c, i) => (
                <div key={i}>
                  <span className={`lp-m ${c.kind}`}>{c.kind === 'add' ? '+' : '~'}</span>
                  <span><RichText text={c.text} /></span>
                </div>
              ))}
            </div>
          )}

          {step.quiz && (
            <div className="lp-quiz">
              <p>Q. {step.quiz.question}</p>
              {step.quiz.options.map((o, i) => {
                const cls = picked === null ? '' : i === step.quiz!.answer ? 'ok' : i === picked ? 'ng' : ''
                return (
                  <button type="button" key={o} className={cls} onClick={() => setPicked(i)}>
                    {'ABCD'[i]}. {o}
                  </button>
                )
              })}
              {picked !== null && <div className="lp-exp">{step.quiz.explanation}</div>}
            </div>
          )}

          <div className="lp-foot">
            <div className="lp-nav">
              {cur === 0 && lesson.prev?.href ? (
                <Link className="lp-btn" href={lesson.prev.href} title={`前のレッスン：${lesson.prev.title}`}>← 前へ</Link>
              ) : (
                <button type="button" className="lp-btn" onClick={() => go(cur - 1)} disabled={cur === 0}>← 戻る</button>
              )}
              {!isLast ? (
                <button type="button" className="lp-btn primary" onClick={() => go(cur + 1)}>
                  <span>次へ：{steps[cur + 1].short}</span>
                  <span>→</span>
                </button>
              ) : lesson.next?.href ? (
                <Link className="lp-btn primary" href={lesson.next.href}>
                  <span>次のレッスン：{lesson.next.title}</span>
                  <span>→</span>
                </Link>
              ) : (
                <button type="button" className="lp-btn primary" disabled>
                  <span>次のレッスン：{lesson.next?.title ?? '—'}（準備中）</span>
                </button>
              )}
            </div>
            <div className="lp-keys">
              <kbd>←</kbd> <kbd>→</kbd> ステップ ・ <kbd>R</kbd> 再生 ・ <kbd>Space</kbd> 一時停止
            </div>
          </div>
        </section>

        <section className="lp-card lp-learn">
          <h4>学べること</h4>
          {lesson.learn.map((l) => {
            const on = cur >= l.atStep
            return (
              <div key={l.text} className={`lp-learn-item${on ? ' on' : ''}`}>
                <span className="lp-box">{on ? '✓' : ''}</span>
                {l.text}
              </div>
            )
          })}
        </section>
      </div>

      <TermTooltip />
    </div>
  )
}

function BodyBlock({ block }: { block: Block }) {
  if (typeof block === 'string')
    return (
      <p>
        <RichText text={block} />
      </p>
    )
  return (
    <ul>
      {block.list.map((t, i) => (
        <li key={i}>
          <RichText text={t} />
        </li>
      ))}
    </ul>
  )
}
