import Link from 'next/link'
import { CATEGORIES, DIFFICULTIES, type CategorySlug } from '@/lib/categories'
import AwsServiceIcon from '@/components/AwsServiceIcon'
import { ArchitectureGroupAWSCloudlogo } from 'aws-react-icons'

const CATEGORY_TEXT: Record<string, string> = {
  vpc: 'text-blue-700',
  ec2: 'text-orange-700',
  s3: 'text-green-700',
  iam: 'text-red-700',
  rds: 'text-purple-700',
  lambda: 'text-yellow-700',
  elb: 'text-teal-700',
  cloudfront: 'text-indigo-700',
}

const CATEGORY_HOVER: Record<string, string> = {
  vpc: 'hover:border-blue-500',
  ec2: 'hover:border-orange-500',
  s3: 'hover:border-green-500',
  iam: 'hover:border-red-500',
  rds: 'hover:border-purple-500',
  lambda: 'hover:border-yellow-500',
  elb: 'hover:border-teal-500',
  cloudfront: 'hover:border-indigo-500',
}

const DIFFICULTY_STYLES: Record<string, { label: string; border: string; text: string; bg: string }> = {
  beginner: { label: '初級', border: 'border-green-300', text: 'text-green-700', bg: 'bg-green-100' },
  intermediate: { label: '中級', border: 'border-yellow-300', text: 'text-yellow-700', bg: 'bg-yellow-100' },
  advanced: { label: '上級', border: 'border-red-300', text: 'text-red-700', bg: 'bg-red-100' },
}

export default function HomePage() {
  return (
    <div className="bg-white text-gray-900">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 py-24 px-4 border-b border-gray-100">
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="mb-6 flex justify-center" aria-label="AWS Cloud ロゴ">
            <ArchitectureGroupAWSCloudlogo size={96} aria-hidden />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight tracking-tight">
            AWS SAA を<br />
            <span className="text-orange-400">図解アニメーション</span>で学ぼう
          </h1>
          <p className="text-sm text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            AWS認定ソリューションアーキテクト-アソシエイト（SAA-C03）の合格を目指す方へ。<br />
            VPC・EC2・S3など主要サービスを、動くビジュアルで直感的に理解できます。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#categories"
              className="bg-orange-500 hover:bg-orange-400 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              今すぐ学習する →
            </a>
            <a
              href="#howto"
              className="border border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900 font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              使い方を見る
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-200 bg-white py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '8', label: 'サービスカテゴリ' },
            { value: '24', label: '学習コンテンツ' },
            { value: '60+', label: '練習問題' },
            { value: '無料', label: '完全無料' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-orange-400">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How to use */}
      <section id="howto" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-center text-orange-400 mb-2 tracking-widest uppercase">How it works</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">このサイトの使い方</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {[
              {
                step: '01',
                service: 'vpc' as CategorySlug,
                title: 'カテゴリを選ぶ',
                desc: 'VPC、EC2、S3 など学びたいAWSサービスのカテゴリを選択します。',
              },
              {
                step: '02',
                service: 'elb' as CategorySlug,
                title: '難易度を選ぶ',
                desc: '初級（基本概念）・中級（設計パターン）・上級（試験対策）から選べます。',
              },
              {
                step: '03',
                service: 'lambda' as CategorySlug,
                title: 'アニメーションで学ぶ',
                desc: 'p5.jsアニメーションで動きを視覚的に理解し、練習問題で定着させましょう。',
              },
            ].map((item) => (
              <div key={item.step} className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-orange-300 transition-colors">
                <div className="text-4xl font-extrabold text-gray-200 mb-3 tabular-nums">{item.step}</div>
                <div className="mb-3" aria-label={`${item.title} アイコン`}>
                  <AwsServiceIcon service={item.service} size={48} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-20 px-4 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-center text-orange-400 mb-2 tracking-widest uppercase">Categories</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">学習カテゴリ</h2>
          <p className="text-center text-gray-600 text-xs mb-10">
            AWSサービス別に体系的に学習できます。各カテゴリに初級・中級・上級のコンテンツがあります。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                className={`group block bg-white border border-gray-200 ${CATEGORY_HOVER[cat.slug]} rounded-xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
              >
                <div className="mb-3" aria-label={`${cat.name} アイコン`}>
                  <AwsServiceIcon service={cat.slug} size={44} />
                </div>
                <h3 className={`font-bold text-sm mb-1 ${CATEGORY_TEXT[cat.slug] ?? 'text-gray-900'}`}>
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">{cat.description}</p>
                <div className="flex gap-1 flex-wrap">
                  {DIFFICULTIES.map((d) => {
                    const ds = DIFFICULTY_STYLES[d.slug]
                    return (
                      <span
                        key={d.slug}
                        className={`text-xs px-2 py-0.5 rounded ${ds.bg} ${ds.text} font-medium`}
                      >
                        {ds.label}
                      </span>
                    )
                  })}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Difficulty guide */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-center text-orange-400 mb-2 tracking-widest uppercase">Difficulty</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">難易度ガイド</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DIFFICULTIES.map((d) => {
              const ds = DIFFICULTY_STYLES[d.slug]
              return (
                <div key={d.slug} className={`rounded-xl p-6 bg-gray-50 border-t-2 ${ds.border}`}>
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded ${ds.bg} ${ds.text} mb-3`}>
                    {ds.label}
                  </span>
                  <h3 className="font-bold text-base mb-3 text-gray-900">{d.description}</h3>
                  <ul className="text-xs text-gray-700 space-y-1.5">
                    {d.slug === 'beginner' && (
                      <>
                        <li className="flex gap-2"><span className="text-orange-400 shrink-0">—</span>AWSの基本用語と概念</li>
                        <li className="flex gap-2"><span className="text-orange-400 shrink-0">—</span>各サービスの役割と特徴</li>
                        <li className="flex gap-2"><span className="text-orange-400 shrink-0">—</span>基本的なユースケース</li>
                      </>
                    )}
                    {d.slug === 'intermediate' && (
                      <>
                        <li className="flex gap-2"><span className="text-orange-400 shrink-0">—</span>高可用性設計パターン</li>
                        <li className="flex gap-2"><span className="text-orange-400 shrink-0">—</span>セキュリティのベストプラクティス</li>
                        <li className="flex gap-2"><span className="text-orange-400 shrink-0">—</span>コスト最適化の考え方</li>
                      </>
                    )}
                    {d.slug === 'advanced' && (
                      <>
                        <li className="flex gap-2"><span className="text-orange-400 shrink-0">—</span>試験頻出の難問対策</li>
                        <li className="flex gap-2"><span className="text-orange-400 shrink-0">—</span>複合サービスの連携パターン</li>
                        <li className="flex gap-2"><span className="text-orange-400 shrink-0">—</span>実践的な設計判断</li>
                      </>
                    )}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA / Affiliate */}
      <section className="py-20 px-4 bg-gray-50 border-t border-gray-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3 text-gray-900">参考書でさらに深く学ぼう</h2>
          <p className="text-gray-600 mb-8 leading-relaxed text-sm">
            本サイトと合わせて参考書や問題集を活用することで、SAA合格の可能性がさらに高まります。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: 'AWS認定ソリューションアーキテクト-アソシエイト問題集',
                badge: 'ベストセラー',
                desc: '1000問以上の模擬問題。',
                url: 'https://amzn.to/3SAA001',
              },
              {
                title: 'AWS認定資格試験テキスト SAA',
                badge: '公式推薦',
                desc: '図解で丁寧に解説。',
                url: 'https://amzn.to/3SAA002',
              },
            ].map((book) => (
              <a
                key={book.title}
                href={book.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-colors rounded-xl p-5 text-left block"
              >
                <span className="inline-block text-xs bg-orange-500 text-white px-2 py-0.5 rounded mb-2 font-medium">
                  {book.badge}
                </span>
                <div className="font-semibold text-sm text-gray-900 mb-1">{book.title}</div>
                <div className="text-gray-600 text-xs">{book.desc}</div>
                <div className="text-orange-400 text-xs mt-2 font-medium">Amazonで見る →</div>
              </a>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            ※Amazonアソシエイト・プログラムに参加しています。
          </p>
        </div>
      </section>

    </div>
  )
}
