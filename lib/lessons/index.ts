// レッスンの登録簿。新しいレッスンはここに追加するだけで /learn/<slug> が生える。
import type { Lesson } from './types'
import { vpcNatLesson } from './vpc-nat'
import { sgNaclLesson } from './sg-nacl'
import { peeringTgwLesson } from './peering-tgw'
import { vpcEndpointLesson } from './vpc-endpoint'
import { elbAsgLesson } from './elb-asg'
import { s3StorageLesson } from './s3-storage'
import { route53BasicsLesson } from './route53-basics'

export const LESSONS: Lesson[] = [vpcNatLesson, sgNaclLesson, peeringTgwLesson, vpcEndpointLesson, route53BasicsLesson, elbAsgLesson, s3StorageLesson]

export const getLesson = (slug: string) => LESSONS.find((l) => l.slug === slug)
