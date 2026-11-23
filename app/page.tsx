import Link from 'next/link'
import { CATEGORIES, type CategorySlug } from '@/lib/categories'
import { LESSONS } from '@/lib/lessons'
import HeroScene from '@/components/site/HeroScene'
import { CHAPTER_COLORS } from '@/components/site/chapters'
import './home.css'

// 公開予定のレッスン（実装したら lib/lessons に移し、ここから消す）
const UPCOMING: { category: CategorySlug; title: string }[] = [
  { category: 'vpc', title: 'ピアリングとTransit Gateway' },
  { category: 'vpc', title: 'VPCエンドポイント' },
  { category: 'elb', title: 'ELBとAuto Scaling' },
  { category: 's3', title: 'ストレージクラスとライフサイクル' },
]

/** サイドナビと同じ「01. VPC・ネットワーク」形式の章名 */
const chapterLabel = (slug: CategorySlug) => {
  const i = CATEGORIES.findIndex((c) => c.slug === slug)
  return `${String(i + 1).padStart(2, '0')}. ${CATEGORIES[i].name}`
}

const FEATURES = [
  { color: '#bcd4f0', title: '通信が動く図', desc: 'リクエストや攻撃がどこを通り、どこで止まるのか。パケットの動きで仕組みが見える。' },
  { color: '#f6e2a4', title: '用語はその場で', desc: 'ALB、NAT、ステートフル…。下線の付いた用語に触れると、一言説明とたとえが出る。' },
  { color: '#cfe8b8', title: '1ステップずつ', desc: '構成を1つずつ組み立て、最後に試験で狙われるポイントと確認問題で仕上げる。' },
]

const BOOKS = [
  { title: 'AWS認定ソリューションアーキテクト-アソシエイト問題集', badge: 'ベストセラー', desc: '1000問以上の模擬問題。', url: 'https://amzn.to/3SAA001' },
  { title: 'AWS認定資格試験テキスト SAA', badge: '公式推薦', desc: '図解で丁寧に解説。', url: 'https://amzn.to/3SAA002' },
]

export default function HomePage() {
  const first = LESSONS[0]
  const heroStep = first.steps[first.steps.length - 1]

  return (
    <div className="home">
      {/* Hero */}
      <section className="home-card home-hero">
        <div className="home-hero-text">
          <span className="home-pill">SAA-C03 対応 ・ 無料</span>
          <h1>
            AWS SAA を、
            <br />
            <mark>動く図解</mark>で。
          </h1>
          <p>
            VPC、セキュリティグループ、NATゲートウェイ…。文字だけでは掴みにくい仕組みを、通信が流れるアイソメトリック図で1ステップずつ組み立てて理解します。
          </p>
          <div className="home-cta">
            <Link href={`/learn/${first.slug}`} className="home-btn primary">
              最初のレッスンを始める <span aria-hidden>→</span>
            </Link>
            <a href="#lessons" className="home-btn">
              レッスン一覧
            </a>
          </div>
        </div>
        <div className="home-hero-visual">
          <HeroScene nodes={first.nodes} zones={first.zones} step={heroStep} label={`${first.title}の構成図`} />
          <div className="home-hero-caption">
            ▲ レッスン「{first.title}」の完成図。図形に触れると用語の説明が出ます。
          </div>
        </div>
      </section>

      {/* 図解レッスン */}
      <section id="lessons" className="home-section">
        <div className="home-hd">
          <h2>図解レッスン</h2>
          <span>{LESSONS.length} 本公開中</span>
        </div>
        <div className="home-grid">
          {LESSONS.map((l) => (
            <Link key={l.slug} href={`/learn/${l.slug}`} className="home-card home-lesson">
              <div className="home-lesson-top">
                <span className="home-dot" style={{ background: CHAPTER_COLORS[l.category] }} />
                <span className="home-mono">{chapterLabel(l.category)}</span>
              </div>
              <h3>{l.title}</h3>
              <p>{l.lead}</p>
              <div className="home-meta">
                <span className="home-badge" style={{ background: '#f6e2a4' }}>◷ {l.minutes} 分</span>
                <span className="home-badge" style={{ background: '#d9cdf2' }}>{l.steps.length} ステップ</span>
                <span className="home-badge" style={{ background: '#cfe8b8' }}>{l.badge}</span>
                <span className="home-go" aria-hidden>→</span>
              </div>
            </Link>
          ))}
          {UPCOMING.map((u) => (
            <div key={u.title} className="home-upcoming">
              <span className="home-mono">{chapterLabel(u.category)}</span>
              <h3>{u.title}</h3>
              <span className="home-soon">近日公開</span>
            </div>
          ))}
        </div>
      </section>

      {/* 学び方 */}
      <section className="home-section">
        <div className="home-hd">
          <h2>この形式で学べること</h2>
        </div>
        <div className="home-features">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="home-card home-feature">
              <span className="home-num" style={{ background: f.color }}>{i + 1}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* カテゴリ */}
      <section id="categories" className="home-section">
        <div className="home-hd">
          <h2>カテゴリから探す</h2>
          <span>各カテゴリに初級・中級・上級の解説もあります</span>
        </div>
        <div className="home-cats">
          {CATEGORIES.map((c, i) => {
            const n = LESSONS.filter((l) => l.category === c.slug).length
            return (
              <Link key={c.slug} href={`/${c.slug}`} className="home-card home-cat">
                <div className="home-cat-top">
                  <span className="home-dot" style={{ background: CHAPTER_COLORS[c.slug] }} />
                  <span className="home-mono">{String(i + 1).padStart(2, '0')}</span>
                  {n > 0 && <span className="home-tag">図解 {n}</span>}
                </div>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* 参考書 */}
      <section className="home-section">
        <div className="home-hd">
          <h2>参考書でさらに深く</h2>
          <span>図解で仕組みを掴んだら、問題集で演習を</span>
        </div>
        <div className="home-books">
          {BOOKS.map((b) => (
            <a key={b.title} href={b.url} target="_blank" rel="noopener noreferrer sponsored" className="home-card home-book">
              <span className="home-tag">{b.badge}</span>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
              <span className="home-link">Amazonで見る →</span>
            </a>
          ))}
        </div>
        <p className="home-note">※Amazonアソシエイト・プログラムに参加しています。</p>
      </section>
    </div>
  )
}
