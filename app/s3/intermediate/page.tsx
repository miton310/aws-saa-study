import GuidePage from '@/components/guide/GuidePage'
import S3IntermediateStepper from '@/components/visualizations/S3IntermediateStepper'

export default function S3IntermediatePage() {
  return <GuidePage category="s3" difficulty="intermediate" visual={<S3IntermediateStepper />} />
}
