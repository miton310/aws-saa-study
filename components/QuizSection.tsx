'use client'

import { useState } from 'react'
import { QuizQuestion } from '@/lib/content'

export default function QuizSection({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null))
  const [submitted, setSubmitted] = useState(false)

  const score = answers.filter((a, i) => a === questions[i].answer).length

  function handleSelect(qi: number, oi: number) {
    if (submitted) return
    setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))
  }

  function handleSubmit() {
    if (answers.some((a) => a === null)) return
    setSubmitted(true)
  }

  function handleReset() {
    setAnswers(Array(questions.length).fill(null))
    setSubmitted(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        ✅ 練習問題
        <span className="text-sm font-normal text-gray-500">（{questions.length}問）</span>
      </h2>

      {submitted && (
        <div className={`rounded-xl p-4 border-2 ${score === questions.length ? 'bg-green-50 border-green-300' : score >= questions.length / 2 ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300'}`}>
          <div className="text-lg font-bold">
            {score === questions.length ? '🎉 完璧です！' : score >= questions.length / 2 ? '👍 あと少し！' : '📚 もう一度復習しよう'}
          </div>
          <div className="text-sm text-gray-600">
            {questions.length}問中 <span className="font-bold text-lg">{score}</span> 問正解
          </div>
        </div>
      )}

      {questions.map((q, qi) => {
        const selected = answers[qi]
        const isCorrect = submitted && selected === q.answer
        const isWrong = submitted && selected !== null && selected !== q.answer

        return (
          <div key={qi} className={`border-2 rounded-xl p-5 transition-all ${
            isCorrect ? 'border-green-300 bg-green-50' :
            isWrong ? 'border-red-300 bg-red-50' :
            'border-gray-200 bg-white'
          }`}>
            <div className="flex items-start gap-2 mb-4">
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shrink-0">Q{qi + 1}</span>
              <p className="font-semibold text-gray-800 leading-relaxed">{q.question}</p>
            </div>

            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const isSelected = selected === oi
                const isAnswer = q.answer === oi
                let cls = 'border-gray-200 bg-gray-50 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                if (!submitted && isSelected) cls = 'border-orange-500 bg-orange-50 text-orange-800'
                if (submitted && isAnswer) cls = 'border-green-500 bg-green-100 text-green-800'
                if (submitted && isSelected && !isAnswer) cls = 'border-red-400 bg-red-100 text-red-800'

                return (
                  <button
                    key={oi}
                    onClick={() => handleSelect(qi, oi)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all ${cls} ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <span className="font-medium mr-2">{['A', 'B', 'C', 'D'][oi]}.</span>
                    {opt}
                    {submitted && isAnswer && <span className="ml-2 text-green-600 font-semibold">✓ 正解</span>}
                    {submitted && isSelected && !isAnswer && <span className="ml-2 text-red-600 font-semibold">✕</span>}
                  </button>
                )
              })}
            </div>

            {submitted && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <span className="font-semibold">💡 解説：</span>{q.explanation}
              </div>
            )}
          </div>
        )
      })}

      <div className="flex gap-3">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={answers.some((a) => a === null)}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-full transition-colors"
          >
            答え合わせ
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="bg-slate-700 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-full transition-colors"
          >
            もう一度解く
          </button>
        )}
      </div>
    </div>
  )
}
