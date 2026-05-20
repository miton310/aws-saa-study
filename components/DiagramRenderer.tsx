'use client'

import dynamic from 'next/dynamic'
import AwsServiceIcon from '@/components/AwsServiceIcon'
import { getCategoryBySlug } from '@/lib/categories'

const VPCDiagram = dynamic(() => import('@/components/visualizations/VPCDiagram'), { ssr: false })
const EC2Diagram = dynamic(() => import('@/components/visualizations/EC2Diagram'), { ssr: false })
const S3Diagram = dynamic(() => import('@/components/visualizations/S3Diagram'), { ssr: false })
const IAMDiagram = dynamic(() => import('@/components/visualizations/IAMDiagram'), { ssr: false })
const RDSDiagram = dynamic(() => import('@/components/visualizations/RDSDiagram'), { ssr: false })
const LambdaDiagram = dynamic(() => import('@/components/visualizations/LambdaDiagram'), { ssr: false })
const ELBDiagram = dynamic(() => import('@/components/visualizations/ELBDiagram'), { ssr: false })
const CloudFrontDiagram = dynamic(() => import('@/components/visualizations/CloudFrontDiagram'), { ssr: false })

const DIAGRAM_MAP: Record<string, React.ComponentType> = {
  vpc: VPCDiagram,
  ec2: EC2Diagram,
  s3: S3Diagram,
  iam: IAMDiagram,
  rds: RDSDiagram,
  lambda: LambdaDiagram,
  elb: ELBDiagram,
  cloudfront: CloudFrontDiagram,
}

export default function DiagramRenderer({ category }: { category: string }) {
  const Diagram = DIAGRAM_MAP[category]
  if (!Diagram) return null
  const resolvedCategory = getCategoryBySlug(category)

  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
        {resolvedCategory ? <AwsServiceIcon service={resolvedCategory.slug} size={26} /> : null}
        アーキテクチャ図
      </h2>
      <Diagram />
      <p className="text-xs text-gray-400 mt-2 text-right">p5.js によるリアルタイムアニメーション</p>
    </div>
  )
}
