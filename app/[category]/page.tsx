import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RelatedLessons } from '@/components/guide/GuidePage'
import { CHAPTER_COLORS, chapterLabel } from '@/components/site/chapters'
import { DIFFICULTIES, getCategoryBySlug } from '@/lib/categories'
import { getContent } from '@/lib/content'
import { LESSONS } from '@/lib/lessons'
import '@/components/guide/guide.css'

const LEVEL_COLORS: Record<string, string> = { beginner: '#cfe8b8', intermediate: '#f6e2a4', advanced: '#f3b7b0' }
const LEVEL_POINTS: Record<string, string> = {
  beginner: '基本用語と概念、主要な構成要素を文章で整理し、基礎の問題で確かめます。',
  intermediate: '設計パターンとベストプラクティスを押さえ、実践的な問題を解きます。',
  advanced: '試験で狙われる難問と、ほかのサービスと組み合わせる構成に挑みます。',
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const cat = getCategoryBySlug(category)
  if (!cat) notFound()
  const lessons = LESSONS.filter((l) => l.category === cat.slug)
  const levels = DIFFICULTIES.filter((d) => getContent(cat.slug, d.slug))

  return (
    <div className="gd">
      <nav className="gd-crumb" aria-label="パンくず">
        <Link href="/">ホーム</Link>
        <span>/</span>
        <span>{chapterLabel(cat.slug)}</span>
      </nav>

      <header className="gd-card gd-head">
        <div className="gd-head-top">
          <span className="gd-dot" style={{ background: CHAPTER_COLORS[cat.slug] }} />
          <span className="gd-mono">{cat.nameEn}</span>
        </div>
        <h1>{cat.name}</h1>
        <p>{cat.description}</p>
      </header>

      <section className="gd-section">
        <h2>図解レッスン</h2>
        <RelatedLessons lessons={lessons} />
      </section>

      <section className="gd-section">
        <h2>解説と練習問題</h2>
        {levels.length === 0 && (
          <aside className="gd-related empty">
            <span className="gd-tag">解説</span>
            <p>この章の解説と練習問題は準備中です。</p>
          </aside>
        )}
        <div className="gd-levels-big">
          {levels.map((d) => (
            <Link key={d.slug} href={`/${cat.slug}/${d.slug}`} className="gd-card gd-level-card">
              <span className="gd-pill" style={{ background: LEVEL_COLORS[d.slug] }}>{d.label}編</span>
              <h3>{d.description}</h3>
              <p>{LEVEL_POINTS[d.slug]}</p>
              <span className="gd-go">読む →</span>
            </Link>
          ))}
        </div>
      </section>

      <nav className="gd-foot">
        <Link href="/#categories" className="gd-btn">← カテゴリ一覧</Link>
      </nav>
    </div>
  )
}
