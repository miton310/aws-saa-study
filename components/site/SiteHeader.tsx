'use client'

// サイト共通ヘッダー（ソフト・ネオブルータリズム）

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: '学ぶ', match: (p: string) => p === '/' || p.startsWith('/learn') },
  { href: '/#categories', label: 'カテゴリ一覧', match: () => false },
]

export default function SiteHeader() {
  const pathname = usePathname() ?? '/'
  return (
    <header className="site-header">
      <Link href="/" className="site-brand">
        <span className="site-logo">
          <Image src="/images/logo.png" alt="" width={20} height={20} />
        </span>
        AWS SAA <mark>図解</mark>
      </Link>
      <nav className="site-nav" aria-label="メイン">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={n.match(pathname) ? 'on' : ''}>
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="site-search" aria-disabled="true" title="検索は準備中です">
        <span aria-hidden>⌕</span> レッスンと用語を検索…<kbd>準備中</kbd>
      </div>
    </header>
  )
}
