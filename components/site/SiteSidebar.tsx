'use client'

// サイト共通のコース目次（章＝カテゴリ、その下に図解レッスンと難易度別ページ）

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export type SidebarItem = { href: string; label: string; kind: 'overview' | 'lesson' | 'level' }
export type SidebarChapter = { slug: string; name: string; color: string; items: SidebarItem[] }

export default function SiteSidebar({ chapters }: { chapters: SidebarChapter[] }) {
  const pathname = usePathname() ?? '/'
  const current = chapters.find((c) => c.items.some((i) => i.href === pathname))
  const [open, setOpen] = useState<Set<string>>(() => new Set(current ? [current.slug] : []))

  const toggle = (slug: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })

  const lessonCount = chapters.reduce((n, c) => n + c.items.filter((i) => i.kind === 'lesson').length, 0)

  return (
    <nav className="site-side" aria-label="コース目次">
      <div className="site-side-hd">
        <span>コース</span>
        <small>SAA-C03</small>
      </div>

      {chapters.map((c, idx) => {
        const isOpen = open.has(c.slug) || current?.slug === c.slug
        return (
          <div key={c.slug}>
            <button type="button" className="site-chap" onClick={() => toggle(c.slug)} aria-expanded={isOpen}>
              <span className={`site-caret${isOpen ? ' open' : ''}`} aria-hidden>›</span>
              <span className="site-dot" style={{ background: c.color }} aria-hidden />
              <span className="site-chap-name">
                {String(idx + 1).padStart(2, '0')}. {c.name}
              </span>
              <span className="site-cnt">{c.items.filter((i) => i.kind !== 'overview').length}</span>
            </button>
            {isOpen && (
              <div className="site-lessons">
                {c.items.map((i) => (
                  <Link key={i.href} href={i.href} className={pathname === i.href ? 'on' : ''} aria-current={pathname === i.href ? 'page' : undefined}>
                    {i.kind === 'lesson' && <span className="site-badge">図解</span>}
                    {i.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div className="site-side-ft">
        <span>図解レッスン</span>
        <span>{lessonCount}</span>
      </div>
    </nav>
  )
}
