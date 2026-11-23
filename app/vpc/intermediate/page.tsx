import GuidePage from '@/components/guide/GuidePage'
import VPCIntermediateStepper from '@/components/visualizations/VPCIntermediateStepper'

export default function VPCIntermediatePage() {
  return <GuidePage category="vpc" difficulty="intermediate" visual={<VPCIntermediateStepper />} />
}
