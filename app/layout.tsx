import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import AwsServiceIcon from '@/components/AwsServiceIcon'
import { CATEGORIES } from '@/lib/categories'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'AWS SAA 学習サイト | 図解で学ぶ Solutions Architect Associate',
  description:
    'AWS認定ソリューションアーキテクト-アソシエイト（SAA）を図解アニメーションで楽しく学べる無料学習サイト。VPC、EC2、S3、IAM、RDS、Lambdaなど全サービスを初級・中級・上級の3段階で解説。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={geist.variable}>
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-aws-orange hover:opacity-80 transition-opacity">
                <Image src="/images/logo.png" alt="AWS SAA 学習サイト ロゴ" width={30} height={30} />
              <span>AWS SAA 学習サイト</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                ホーム
              </Link>
              <Link
                href="/#categories"
                className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors"
              >
                学習を始める
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 bg-white">
          <div className="mx-auto w-full max-w-[1400px] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="hidden lg:block border-r border-gray-200 bg-gray-50">
              <div className="sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto px-4 py-6">
                <p className="text-[11px] tracking-[0.16em] font-semibold text-orange-400 mb-4 uppercase">Study Navigation</p>
                <nav className="space-y-2 mb-6">
                  <Link
                    href="/"
                    className="block rounded px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    ホーム
                  </Link>
                  <Link
                    href="/#categories"
                    className="block rounded px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    カテゴリ一覧
                  </Link>
                </nav>

                <p className="text-xs font-semibold text-gray-500 mb-3">主要カテゴリ</p>
                <nav className="space-y-1">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/${cat.slug}`}
                      className="group flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      <AwsServiceIcon service={cat.slug} size={20} />
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                </nav>
              </div>
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
