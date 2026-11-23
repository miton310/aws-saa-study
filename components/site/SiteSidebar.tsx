'use client'

// サイト共通のコース目次（章＝カテゴリ、その下に図解レッスンと難易度別ページ）

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { onStep, requestStep, type StepDetail } from '@/components/lesson/stepSync'

export type SidebarItem = { href: string; label: string; kind: 'overview' | 'lesson' | 'level'; steps?: string[] }
export type SidebarChapter = { slug: string; name: string; color: string; items: SidebarItem[] }

export default function SiteSidebar({ chapters }: { chapters: SidebarChapter[] }) {
  const pathname = usePathname() ?? '/'
  const current = chapters.find((c) => c.items.some((i) => i.href === pathname))
  // 今いるページの章は常に開く。それ以外は、最後に選んだ章を1つだけ開く（別の章を選ぶと前の章は閉じる）。
  // 選んだ章はページを移動したら解除する（移動先の章が「今いる章」として開く）。
  const [pick, setPick] = useState<{ path: string; slug: string } | null>(null)
  const picked = pick?.path === pathname ? pick.slug : null
  const [step, setStep] = useState<StepDetail | null>(null)
  useEffect(() => onStep(setStep), [])

  const toggle = (slug: string) => setPick(picked === slug ? null : { path: pathname, slug })

  const lessonCount = chapters.reduce((n, c) => n + c.items.filter((i) => i.kind === 'lesson').length, 0)

  return (
    <nav className="site-side" aria-label="コース目次">
      <div className="site-side-hd">
        <span>コース</span>
        <small>SAA-C03</small>
      </div>

      {chapters.map((c, idx) => {
        const isOpen = picked === c.slug || current?.slug === c.slug
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
                {c.items.map((i) => {
                  const here = pathname === i.href
                  const slug = i.href.replace('/learn/', '')
                  const cur = step?.slug === slug ? step.index : 0
                  return (
                    <div key={i.href}>
                      <Link href={i.href} className={here ? 'on' : ''} aria-current={here ? 'page' : undefined}>
                        {i.kind === 'lesson' && <span className="site-badge">図解</span>}
                        {i.label}
                      </Link>
                      {here && i.steps && (
                        <ol className="site-steps" aria-label={`${i.label}のステップ`}>
                          {i.steps.map((s, n) => (
                            <li key={s}>
                              <button
                                type="button"
                                className={n === cur ? 'cur' : n < cur ? 'done' : ''}
                                aria-current={n === cur ? 'step' : undefined}
                                onClick={() => requestStep({ slug, index: n })}
                              >
                                <span className="site-step-n">{n < cur ? '✓' : n + 1}</span>
                                {s}
                              </button>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )
                })}
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
