import {
  ArchitectureServiceAmazonCloudFront,
  ArchitectureServiceAmazonEC2,
  ArchitectureServiceAmazonRDS,
  ArchitectureServiceAmazonSimpleStorageService,
  ArchitectureServiceAmazonVirtualPrivateCloud,
  ArchitectureServiceAWSIdentityandAccessManagement,
  ArchitectureServiceAWSLambda,
  ArchitectureServiceElasticLoadBalancing,
} from 'aws-react-icons'
import type { ComponentType } from 'react'
import { CategorySlug } from '@/lib/categories'

type AwsServiceIconProps = {
  service: CategorySlug
  size?: number
  className?: string
}

const ICONS: Record<CategorySlug, ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>> = {
  vpc: ArchitectureServiceAmazonVirtualPrivateCloud,
  ec2: ArchitectureServiceAmazonEC2,
  s3: ArchitectureServiceAmazonSimpleStorageService,
  iam: ArchitectureServiceAWSIdentityandAccessManagement,
  rds: ArchitectureServiceAmazonRDS,
  lambda: ArchitectureServiceAWSLambda,
  elb: ArchitectureServiceElasticLoadBalancing,
  cloudfront: ArchitectureServiceAmazonCloudFront,
}

export default function AwsServiceIcon({ service, size = 48, className }: AwsServiceIconProps) {
  const Icon = ICONS[service]

  return (
    <span className={className} aria-hidden>
      <Icon size={size} aria-hidden />
    </span>
  )
}