import Link from 'next/link'
import { CATEGORIES, DIFFICULTIES } from '@/lib/categories'

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">☁️</div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            AWS SAA を<br className="md:hidden" />
            <span className="text-orange-400">図解アニメーション</span>で学ぼう
          </h1>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            AWS認定ソリューションアーキテクト-アソシエイト（SAA-C03）の合格を目指す方へ。
            VPC・EC2・S3など主要サービスを、動くビジュアルで直感的に理解できます。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#categories"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-full transition-colors text-lg"
            >
              今すぐ学習する →
            </a>
            <a
              href="#howto"
              className="border border-slate-400 text-slate-200 hover:bg-slate-700 font-semibold px-8 py-3 rounded-full transition-colors text-lg"
            >
              使い方を見る
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-orange-500 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-center">
          {[
            { value: '8', label: 'サービスカテゴリ' },
            { value: '24', label: '学習コンテンツ' },
            { value: '60+', label: '練習問題' },
            { value: '無料', label: '完全無料' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold">{s.value}</div>
              <div className="text-sm text-orange-100">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How to use */}
      <section id="howto" className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">
            📖 このサイトの使い方
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                icon: '🗂️',
                title: 'カテゴリを選ぶ',
                desc: 'VPC、EC2、S3 など学びたいAWSサービスのカテゴリを選択します。',
              },
              {
                step: '2',
                icon: '📊',
                title: '難易度を選ぶ',
                desc: '初級（基本概念）・中級（設計パターン）・上級（試験対策）から選べます。',
              },
              {
                step: '3',
                icon: '✅',
                title: 'アニメーションで学ぶ',
                desc: 'p5.jsアニメーションで動きを視覚的に理解し、練習問題で定着させましょう。',
              },
            ].map((item) => (
              <div key={item.step} className="text-center p-6 bg-slate-50 rounded-2xl">
                <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  {item.step}
                </div>
                <div className="text-4xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            🎯 学習カテゴリ
          </h2>
          <p className="text-center text-gray-500 text-sm mb-10">
            AWSサービス別に体系的に学習できます。各カテゴリに初級・中級・上級のコンテンツがあります。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                className={`group block ${cat.bgColor} rounded-2xl p-5 border-2 border-transparent hover:shadow-md transition-all duration-200`}
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className={`font-bold text-lg mb-1 ${cat.color}`}>
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{cat.description}</p>
                <div className="flex gap-1 flex-wrap">
                  {DIFFICULTIES.map((d) => (
                    <span
                      key={d.slug}
                      className={`text-xs px-2 py-0.5 rounded-full ${d.bg} ${d.color} font-medium`}
                    >
                      {d.label}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Difficulty guide */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">
            📈 難易度ガイド
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DIFFICULTIES.map((d) => (
              <div key={d.slug} className={`rounded-2xl p-6 border-2 ${d.border} ${d.bg}`}>
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${d.bg} ${d.color} border ${d.border} mb-3`}>
                  {d.label}
                </span>
                <h3 className={`font-bold text-lg mb-2 ${d.color}`}>{d.description}</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {d.slug === 'beginner' && (
                    <>
                      <li>• AWSの基本用語と概念</li>
                      <li>• 各サービスの役割と特徴</li>
                      <li>• 基本的なユースケース</li>
                    </>
                  )}
                  {d.slug === 'intermediate' && (
                    <>
                      <li>• 高可用性設計パターン</li>
                      <li>• セキュリティのベストプラクティス</li>
                      <li>• コスト最適化の考え方</li>
                    </>
                  )}
                  {d.slug === 'advanced' && (
                    <>
                      <li>• 試験頻出の難問対策</li>
                      <li>• 複合サービスの連携パターン</li>
                      <li>• 実践的な設計判断</li>
                    </>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Affiliate */}
      <section className="py-16 px-4 bg-slate-800 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">📚 参考書でさらに深く学ぼう</h2>
          <p className="text-slate-300 mb-8 leading-relaxed">
            本サイトと合わせて参考書や問題集を活用することで、SAA合格の可能性がさらに高まります。
            Amazonで人気のSAA対策本をチェックしてみてください。
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
                className="bg-slate-700 hover:bg-slate-600 transition-colors rounded-xl p-5 text-left block"
              >
                <span className="inline-block text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full mb-2 font-medium">
                  {book.badge}
                </span>
                <div className="font-semibold text-sm mb-1">{book.title}</div>
                <div className="text-slate-400 text-xs">{book.desc}</div>
                <div className="text-orange-400 text-xs mt-2 font-medium">Amazonで見る →</div>
              </a>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            ※Amazonアソシエイト・プログラムに参加しています。
          </p>
        </div>
      </section>
    </div>
  )
}
