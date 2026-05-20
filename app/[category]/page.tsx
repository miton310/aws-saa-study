import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCategoryBySlug, DIFFICULTIES } from '@/lib/categories'
import AwsServiceIcon from '@/components/AwsServiceIcon'

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const cat = getCategoryBySlug(category)
  if (!cat) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700">ホーム</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">{cat.name}</span>
      </nav>

      {/* Header */}
      <div className={`${cat.bgColor} rounded-3xl p-8 mb-10`}>
        <div className="mb-3" aria-label={`${cat.name} アイコン`}>
          <AwsServiceIcon service={cat.slug} size={72} />
        </div>
        <h1 className={`text-3xl font-extrabold ${cat.color} mb-2`}>{cat.name}</h1>
        <p className="text-sm font-medium text-gray-500 mb-2">{cat.nameEn}</p>
        <p className="text-gray-700 leading-relaxed max-w-xl">{cat.description}</p>
      </div>

      {/* Difficulty selection */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">難易度を選んでください</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {DIFFICULTIES.map((d, i) => (
          <Link
            key={d.slug}
            href={`/${cat.slug}/${d.slug}`}
            className={`block rounded-2xl p-6 border-2 ${d.border} ${d.bg} hover:shadow-md transition-all duration-200 group`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${d.bg} ${d.color} border ${d.border}`}>
                {d.label}
              </span>
              <span className="text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
            </div>
            <h3 className={`font-bold text-lg mb-2 ${d.color}`}>{d.description}</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              {i === 0 && (
                <>
                  <li>• 基本用語と概念の理解</li>
                  <li>• 主要コンポーネントの説明</li>
                  <li>• 基礎的な練習問題</li>
                </>
              )}
              {i === 1 && (
                <>
                  <li>• 実践的な設計パターン</li>
                  <li>• ベストプラクティス</li>
                  <li>• 中級の練習問題</li>
                </>
              )}
              {i === 2 && (
                <>
                  <li>• 試験頻出の難問</li>
                  <li>• サービス連携パターン</li>
                  <li>• 上級の練習問題</li>
                </>
              )}
            </ul>
          </Link>
        ))}
      </div>

      {/* Navigation to other categories */}
      <div className="mt-12">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">他のカテゴリ</h3>
        <Link href="/#categories" className="text-orange-500 hover:text-orange-600 font-medium text-sm">
          ← カテゴリ一覧に戻る
        </Link>
      </div>
    </div>
  )
}
