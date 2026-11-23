import GuidePage from '@/components/guide/GuidePage'
import EC2IntermediateStepper from '@/components/visualizations/EC2IntermediateStepper'

export default function EC2IntermediatePage() {
  return <GuidePage category="ec2" difficulty="intermediate" visual={<EC2IntermediateStepper />} />
}
