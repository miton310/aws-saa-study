import Link from 'next/link'
import { getCategoryBySlug, getDifficultyBySlug, DIFFICULTIES } from '@/lib/categories'
import { getContent } from '@/lib/content'
import EC2IntermediateStepper from '@/components/visualizations/EC2IntermediateStepper'
import QuizSection from '@/components/QuizSection'

export default function EC2IntermediatePage() {
  const cat     = getCategoryBySlug('ec2')!
  const diff    = getDifficultyBySlug('intermediate')!
  const content = getContent('ec2', 'intermediate')!

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-gray-700">ホーム</Link>
        <span>/</span>
        <Link href="/ec2" className="hover:text-gray-700">{cat.name}</Link>
        <span>/</span>
        <span className={`font-semibold ${diff.color}`}>{diff.label}</span>
      </nav>

      {/* Header */}
      <div className={`${cat.bgColor} rounded-3xl p-6 mb-8 flex items-start gap-4`}>
        <div className="text-5xl">{cat.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className={`text-2xl font-extrabold ${cat.color}`}>{cat.name}</h1>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${diff.bg} ${diff.color} border ${diff.border}`}>
              {diff.label}
            </span>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{content.overview}</p>
        </div>
      </div>

      {/* Difficulty tabs */}
      <div className="flex gap-2 mb-8">
        {DIFFICULTIES.map((d) => (
          <Link
            key={d.slug}
            href={`/ec2/${d.slug}`}
            className={`flex-1 text-center py-2 px-3 rounded-full text-sm font-semibold border-2 transition-all ${
              d.slug === 'intermediate'
                ? `${d.bg} ${d.color} ${d.border}`
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            {d.label}
          </Link>
        ))}
      </div>

      {/* Step-by-step stepper */}
      <EC2IntermediateStepper />

      {/* Quiz */}
      <div className="mb-10">
        <QuizSection questions={content.quiz} />
      </div>

      {/* Affiliate */}
      {content.affiliateLinks.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📚 おすすめ参考書</h2>
          <p className="text-xs text-gray-500 mb-3">※本ページのリンクにはアフィリエイト広告が含まれます。</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {content.affiliateLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white border-2 border-gray-200 hover:border-orange-300 hover:shadow-md transition-all rounded-xl p-4"
              >
                <span className="inline-block text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full mb-2 font-medium">
                  {link.badge}
                </span>
                <div className="font-semibold text-sm text-gray-800 mb-1">{link.title}</div>
                <div className="text-gray-500 text-xs leading-relaxed mb-2">{link.description}</div>
                <div className="text-orange-500 text-xs font-semibold">Amazonで確認する →</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <Link href="/ec2/beginner" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
          ← 初級に戻る
        </Link>
        <Link
          href="/ec2/advanced"
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-full text-sm transition-colors"
        >
          上級へ進む →
        </Link>
      </div>
    </div>
  )
}
