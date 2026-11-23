import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { IBM_Plex_Sans_JP, JetBrains_Mono } from 'next/font/google'
import LessonPlayer from '@/components/lesson/LessonPlayer'
import { LESSONS, getLesson } from '@/lib/lessons'

const sans = IBM_Plex_Sans_JP({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--lp-font-sans',
  preload: false,
})
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--lp-font-mono' })

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = getLesson((await params).slug)
  if (!lesson) return {}
  return {
    title: `${lesson.title} | 図解で学ぶ AWS SAA`,
    description: lesson.description ?? lesson.lead,
  }
}

export default async function LessonPage({ params }: Props) {
  const lesson = getLesson((await params).slug)
  if (!lesson) notFound()
  return (
    <div className={`${sans.variable} ${mono.variable}`}>
      <LessonPlayer key={lesson.slug} lesson={lesson} />
    </div>
  )
}
