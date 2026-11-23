import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LessonPlayer from '@/components/lesson/LessonPlayer'
import { LESSONS, getLesson } from '@/lib/lessons'

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
    <LessonPlayer key={lesson.slug} lesson={lesson} />
  )
}
