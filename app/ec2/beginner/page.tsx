import GuidePage from '@/components/guide/GuidePage'
import EC2BeginnerStepper from '@/components/visualizations/EC2BeginnerStepper'

export default function EC2BeginnerPage() {
  return <GuidePage category="ec2" difficulty="beginner" visual={<EC2BeginnerStepper />} />
}
