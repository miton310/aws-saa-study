import GuidePage from '@/components/guide/GuidePage'
import VPCAdvancedStepper from '@/components/visualizations/VPCAdvancedStepper'

export default function VPCAdvancedPage() {
  return <GuidePage category="vpc" difficulty="advanced" visual={<VPCAdvancedStepper />} />
}
