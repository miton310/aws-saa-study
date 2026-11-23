// レッスンの登録簿。新しいレッスンはここに追加するだけで /learn/<slug> が生える。
import type { Lesson } from './types'
import { vpcNatLesson } from './vpc-nat'
import { sgNaclLesson } from './sg-nacl'
import { peeringTgwLesson } from './peering-tgw'
import { vpcEndpointLesson } from './vpc-endpoint'

export const LESSONS: Lesson[] = [vpcNatLesson, sgNaclLesson, peeringTgwLesson, vpcEndpointLesson]

export const getLesson = (slug: string) => LESSONS.find((l) => l.slug === slug)
