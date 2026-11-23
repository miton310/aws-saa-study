import type { Metadata } from 'next'
import { Geist, IBM_Plex_Sans_JP, JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteSidebar, { type SidebarChapter } from '@/components/site/SiteSidebar'
import { CHAPTER_COLORS } from '@/components/site/chapters'
import { CATEGORIES, DIFFICULTIES, type CategorySlug } from '@/lib/categories'
import { getContent } from '@/lib/content'
import { LESSONS } from '@/lib/lessons'
import './globals.css'
import '@/components/site/site.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const sans = IBM_Plex_Sans_JP({ weight: ['400', '500', '700'], subsets: ['latin'], variable: '--lp-font-sans', preload: false })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--lp-font-mono' })

export const metadata: Metadata = {
  title: 'AWS SAA 学習サイト | 図解で学ぶ Solutions Architect Associate',
  description:
    'AWS認定ソリューションアーキテクト-アソシエイト（SAA）を図解アニメーションで楽しく学べる無料学習サイト。VPC、EC2、S3、IAM、RDS、Lambdaなど全サービスを初級・中級・上級の3段階で解説。',
}

// app/ 直下に静的ページがあるカテゴリ（content が無くても難易度別ページが開ける）
const STATIC_LEVEL_PAGES: CategorySlug[] = ['vpc', 'ec2', 's3']

const CHAPTERS: SidebarChapter[] = CATEGORIES.map((cat) => ({
  slug: cat.slug,
  name: cat.name,
  color: CHAPTER_COLORS[cat.slug],
  items: [
    { href: `/${cat.slug}`, label: '概要', kind: 'overview' as const },
    ...LESSONS.filter((l) => l.category === cat.slug).map((l) => ({ href: `/learn/${l.slug}`, label: l.title, kind: 'lesson' as const })),
    ...DIFFICULTIES.filter((d) => STATIC_LEVEL_PAGES.includes(cat.slug) || getContent(cat.slug, d.slug)).map((d) => ({
      href: `/${cat.slug}/${d.slug}`,
      label: `${d.label}編`,
      kind: 'level' as const,
    })),
  ],
}))

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} ${sans.variable} ${mono.variable}`}>
      <body className="site-body min-h-screen flex flex-col">
        <SiteHeader />

        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1600px] lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
            <aside className="hidden lg:block site-side-wrap">
              <SiteSidebar chapters={CHAPTERS} />
            </aside>
            <div className="min-w-0">{children}</div>
          </div>
        </main>

        <footer className="bg-gray-800 text-gray-300">
          <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-white font-semibold mb-3">☁️ AWS SAA 学習サイト</h3>
                <p className="text-sm leading-relaxed">
                  AWS認定ソリューションアーキテクトを目指すすべての方のための無料学習サイトです。
                  図解アニメーションで直感的に理解できます。
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3">主要カテゴリ</h3>
                <ul className="space-y-1 text-sm">
                  {['VPC', 'EC2', 'S3', 'IAM', 'RDS', 'Lambda'].map((s) => (
                    <li key={s}>
                      <Link href={`/${s.toLowerCase()}`} className="hover:text-white transition-colors">
                        {s}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3">おすすめ教材</h3>
                <p className="text-sm leading-relaxed mb-2">
                  本サイトでの学習に加えて、参考書や問題集での演習をお勧めします。
                </p>
                <p className="text-xs text-gray-500">
                  ※本サイトのリンクにはアフィリエイト広告が含まれる場合があります。
                </p>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-6 text-center text-xs text-gray-500">
              © {new Date().getFullYear()} AWS SAA 学習サイト. AWS および関連サービス名は Amazon Web Services, Inc. の商標です。
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
