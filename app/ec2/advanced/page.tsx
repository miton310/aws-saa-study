import GuidePage from '@/components/guide/GuidePage'
import EC2AdvancedStepper from '@/components/visualizations/EC2AdvancedStepper'

export default function EC2AdvancedPage() {
  return <GuidePage category="ec2" difficulty="advanced" visual={<EC2AdvancedStepper />} />
}
