// 「読む解説＋問題集」ページ（カテゴリ × 難易度）の共通レイアウト
// 図解レッスンへの導線 → アニメーション（あれば）→ 文章の解説 → 練習問題 → 参考書

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import QuizSection from '@/components/QuizSection'
import { CHAPTER_COLORS, chapterLabel } from '@/components/site/chapters'
import { DIFFICULTIES, getCategoryBySlug, getDifficultyBySlug } from '@/lib/categories'
import { getContent } from '@/lib/content'
import { LESSONS } from '@/lib/lessons'
import './guide.css'

const LEVEL_COLORS: Record<string, string> = { beginner: '#cfe8b8', intermediate: '#f6e2a4', advanced: '#f3b7b0' }

type Props = {
  category: string
  difficulty: string
  /** p5 のステッパーなど、ページ固有のアニメーション */
  visual?: ReactNode
}

export default function GuidePage({ category, difficulty, visual }: Props) {
  const cat = getCategoryBySlug(category)
  const diff = getDifficultyBySlug(difficulty)
  const content = getContent(category, difficulty)
  if (!cat || !diff || !content) notFound()

  const lessons = LESSONS.filter((l) => l.category === cat.slug)
  const idx = DIFFICULTIES.findIndex((d) => d.slug === diff.slug)
  const next = DIFFICULTIES[idx + 1]

  return (
    <div className="gd">
      <nav className="gd-crumb" aria-label="パンくず">
        <Link href="/">ホーム</Link>
        <span>/</span>
        <Link href={`/${cat.slug}`}>{chapterLabel(cat.slug)}</Link>
        <span>/</span>
        <span>{diff.label}編</span>
      </nav>

      <header className="gd-card gd-head">
        <div className="gd-head-top">
          <span className="gd-dot" style={{ background: CHAPTER_COLORS[cat.slug] }} />
          <span className="gd-mono">{cat.nameEn}</span>
          <span className="gd-pill" style={{ background: LEVEL_COLORS[diff.slug] }}>{diff.label}</span>
        </div>
        <h1>
          {cat.name}　<small>{diff.label}編</small>
        </h1>
        <p>{content.overview}</p>
      </header>

      <div className="gd-levels" role="tablist" aria-label="難易度">
        {DIFFICULTIES.map((d) => (
          <Link key={d.slug} href={`/${cat.slug}/${d.slug}`} className={d.slug === diff.slug ? 'on' : ''} aria-current={d.slug === diff.slug ? 'page' : undefined}>
            <b>{d.label}</b>
            <span>{d.description}</span>
          </Link>
        ))}
      </div>

      <RelatedLessons lessons={lessons} />

      {visual && (
        <section className="gd-section">
          <h2>アニメーションで見る</h2>
          <div className="gd-card gd-visual">{visual}</div>
        </section>
      )}

      <section className="gd-section">
        <h2>解説</h2>
        <div className="gd-sections">
          {content.sections.map((s, i) => (
            <article key={s.title} className="gd-card gd-article">
              <h3>
                <span className="gd-num">{i + 1}</span>
                {s.title}
              </h3>
              <p>{s.body}</p>
              <ul>
                {s.keyPoints.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="gd-section">
        <QuizSection questions={content.quiz} />
      </section>

      {content.affiliateLinks.length > 0 && (
        <section className="gd-section">
          <h2>おすすめ参考書</h2>
          <div className="gd-books">
            {content.affiliateLinks.map((b) => (
              <a key={b.url} href={b.url} target="_blank" rel="noopener noreferrer sponsored" className="gd-card gd-book">
                <span className="gd-pill" style={{ background: '#f6c191' }}>{b.badge}</span>
                <h3>{b.title}</h3>
                <p>{b.description}</p>
                <span className="gd-link">Amazonで見る →</span>
              </a>
            ))}
          </div>
          <p className="gd-note">※本ページのリンクにはアフィリエイト広告が含まれます。</p>
        </section>
      )}

      <nav className="gd-foot">
        <Link href={`/${cat.slug}`} className="gd-btn">← {cat.name}の概要</Link>
        {next ? (
          <Link href={`/${cat.slug}/${next.slug}`} className="gd-btn primary">{next.label}編へ →</Link>
        ) : (
          <Link href="/#categories" className="gd-btn primary">ほかのカテゴリへ →</Link>
        )}
      </nav>
    </div>
  )
}

export function RelatedLessons({ lessons }: { lessons: typeof LESSONS }) {
  if (lessons.length === 0) {
    return (
      <aside className="gd-related empty">
        <span className="gd-tag">図解レッスン</span>
        <p>このカテゴリの図解レッスンは準備中です。</p>
      </aside>
    )
  }
  return (
    <aside className="gd-card gd-related">
      <div className="gd-related-hd">
        <span className="gd-tag">図解レッスン</span>
        <p>まずは図解で、通信を流しながら仕組みをつかむのがおすすめです。</p>
      </div>
      <div className="gd-related-list">
        {lessons.map((l) => (
          <Link key={l.slug} href={`/learn/${l.slug}`}>
            <b>{l.title}</b>
            <span className="gd-mono">◷ {l.minutes}分 ・ {l.steps.length}ステップ</span>
            <span aria-hidden>→</span>
          </Link>
        ))}
      </div>
    </aside>
  )
}
