import DiagramRenderer from '@/components/DiagramRenderer'
import GuidePage from '@/components/guide/GuidePage'

export default async function LearningPage({ params }: { params: Promise<{ category: string; difficulty: string }> }) {
  const { category, difficulty } = await params
  return <GuidePage category={category} difficulty={difficulty} visual={<DiagramRenderer category={category} />} />
}
