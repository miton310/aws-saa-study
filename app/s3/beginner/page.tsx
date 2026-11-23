import GuidePage from '@/components/guide/GuidePage'
import S3BeginnerStepper from '@/components/visualizations/S3BeginnerStepper'

export default function S3BeginnerPage() {
  return <GuidePage category="s3" difficulty="beginner" visual={<S3BeginnerStepper />} />
}
