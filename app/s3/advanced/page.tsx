import GuidePage from '@/components/guide/GuidePage'
import S3AdvancedStepper from '@/components/visualizations/S3AdvancedStepper'

export default function S3AdvancedPage() {
  return <GuidePage category="s3" difficulty="advanced" visual={<S3AdvancedStepper />} />
}
