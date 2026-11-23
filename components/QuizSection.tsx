'use client'

// 練習問題（解説ページ用）。全問に答えてから答え合わせをする
// 見た目は components/guide/guide.css の .gd-quiz 以下

import { useState } from 'react'
import { QuizQuestion } from '@/lib/content'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function QuizSection({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null))
  const [submitted, setSubmitted] = useState(false)

  const score = answers.filter((a, i) => a === questions[i].answer).length
  const allAnswered = answers.every((a) => a !== null)

  function handleSelect(qi: number, oi: number) {
    if (submitted) return
    setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))
  }

  function handleReset() {
    setAnswers(Array(questions.length).fill(null))
    setSubmitted(false)
  }

  const scoreClass = score === questions.length ? 'ok' : score >= questions.length / 2 ? 'mid' : 'ng'
  const scoreText = score === questions.length ? '全問正解です' : score >= questions.length / 2 ? 'あと少しです' : 'もう一度復習しましょう'

  return (
    <div className="gd-quiz">
      <div className="gd-quiz-hd">
        <h2>練習問題</h2>
        <span>全{questions.length}問。すべて選んでから答え合わせ</span>
      </div>

      {submitted && (
        <div className={`gd-card gd-score ${scoreClass}`} role="status">
          {scoreText}
          <small>
            {questions.length}問中 {score}問正解
          </small>
        </div>
      )}

      {questions.map((q, qi) => {
        const selected = answers[qi]
        const state = !submitted || selected === null ? '' : selected === q.answer ? 'ok' : 'ng'
        return (
          <div key={qi} className={`gd-card gd-q ${state}`}>
            <p className="gd-q-title">
              <span className="gd-pill">Q{qi + 1}</span>
              {q.question}
            </p>
            <div className="gd-opts">
              {q.options.map((opt, oi) => {
                let cls = ''
                if (!submitted && selected === oi) cls = 'sel'
                if (submitted && oi === q.answer) cls = 'ok'
                else if (submitted && selected === oi) cls = 'ng'
                return (
                  <button key={oi} type="button" className={cls} onClick={() => handleSelect(qi, oi)} disabled={submitted} aria-pressed={selected === oi}>
                    <b>{LETTERS[oi]}.</b>
                    {opt}
                    {submitted && oi === q.answer && '　✓ 正解'}
                  </button>
                )
              })}
            </div>
            {submitted && (
              <div className="gd-exp">
                <b>解説：</b>
                {q.explanation}
              </div>
            )}
          </div>
        )
      })}

      <div className="gd-quiz-actions">
        {!submitted ? (
          <button type="button" className="gd-btn primary" onClick={() => setSubmitted(true)} disabled={!allAnswered}>
            答え合わせ
          </button>
        ) : (
          <button type="button" className="gd-btn" onClick={handleReset}>
            もう一度解く
          </button>
        )}
      </div>
    </div>
  )
}
