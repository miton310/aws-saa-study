// レッスンの登録簿。新しいレッスンはここに追加するだけで /learn/<slug> が生える。
import type { Lesson } from './types'
import { vpcNatLesson } from './vpc-nat'
import { sgNaclLesson } from './sg-nacl'
import { peeringTgwLesson } from './peering-tgw'
import { vpcEndpointLesson } from './vpc-endpoint'
import { elbAsgLesson } from './elb-asg'
import { s3StorageLesson } from './s3-storage'
import { route53BasicsLesson } from './route53-basics'
import { rdsMultiAzLesson } from './rds-multiaz'
import { iamBasicsLesson } from './iam-basics'
import { sqsSnsEventBridgeLesson } from './sqs-sns-eventbridge'
import { ec2PurchasingLesson } from './ec2-purchasing'
import { ebsEfsFsxLesson } from './ebs-efs-fsx'
import { cloudfrontCacheLesson } from './cloudfront-cache'
import { dynamodbBasicsLesson } from './dynamodb-basics'
import { cloudwatchCloudtrailLesson } from './cloudwatch-cloudtrail'

export const LESSONS: Lesson[] = [vpcNatLesson, sgNaclLesson, peeringTgwLesson, vpcEndpointLesson, route53BasicsLesson, elbAsgLesson, s3StorageLesson, rdsMultiAzLesson, iamBasicsLesson, sqsSnsEventBridgeLesson, ec2PurchasingLesson, ebsEfsFsxLesson, cloudfrontCacheLesson, dynamodbBasicsLesson, cloudwatchCloudtrailLesson]

export const getLesson = (slug: string) => LESSONS.find((l) => l.slug === slug)
