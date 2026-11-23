// レッスンの登録簿。新しいレッスンはここに追加するだけで /learn/<slug> が生える。
import type { Lesson } from './types'
import { vpcNatLesson } from './vpc-nat'
import { sgNaclLesson } from './sg-nacl'

export const LESSONS: Lesson[] = [vpcNatLesson, sgNaclLesson]

export const getLesson = (slug: string) => LESSONS.find((l) => l.slug === slug)
