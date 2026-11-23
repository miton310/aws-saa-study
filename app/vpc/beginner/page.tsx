import GuidePage from '@/components/guide/GuidePage'
import VPCBeginnerStepper from '@/components/visualizations/VPCBeginnerStepper'

export default function VPCBeginnerPage() {
  return <GuidePage category="vpc" difficulty="beginner" visual={<VPCBeginnerStepper />} />
}
