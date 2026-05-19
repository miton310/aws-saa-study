export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type CategorySlug = 'vpc' | 'ec2' | 's3' | 'iam' | 'rds' | 'lambda' | 'elb' | 'cloudfront'

export interface Category {
  slug: CategorySlug
  name: string
  nameEn: string
  description: string
  icon: string
  color: string
  bgColor: string
}

export interface DifficultyInfo {
  slug: Difficulty
  label: string
  description: string
  color: string
  bg: string
  border: string
}

export const CATEGORIES: Category[] = [
  {
    slug: 'vpc',
    name: 'VPC・ネットワーク',
    nameEn: 'Virtual Private Cloud',
    description: 'AWS上の仮想ネットワーク。サブネット、ルーティング、セキュリティグループを学ぶ',
    icon: '🌐',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    slug: 'ec2',
    name: 'EC2・コンピュート',
    nameEn: 'Elastic Compute Cloud',
    description: 'AWSの仮想サーバー。インスタンスタイプ、AMI、Auto Scalingを学ぶ',
    icon: '💻',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    slug: 's3',
    name: 'S3・ストレージ',
    nameEn: 'Simple Storage Service',
    description: 'オブジェクトストレージサービス。バケット、ストレージクラス、ライフサイクルを学ぶ',
    icon: '🗂️',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    slug: 'iam',
    name: 'IAM・セキュリティ',
    nameEn: 'Identity and Access Management',
    description: 'AWSリソースへのアクセス制御。ユーザー、ロール、ポリシーを学ぶ',
    icon: '🔐',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    slug: 'rds',
    name: 'RDS・データベース',
    nameEn: 'Relational Database Service',
    description: 'マネージドリレーショナルDB。Multi-AZ、リードレプリカ、バックアップを学ぶ',
    icon: '🗄️',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    slug: 'lambda',
    name: 'Lambda・サーバーレス',
    nameEn: 'AWS Lambda',
    description: 'サーバーレスコンピュート。イベント駆動型アーキテクチャを学ぶ',
    icon: '⚡',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    slug: 'elb',
    name: 'ELB・負荷分散',
    nameEn: 'Elastic Load Balancing',
    description: 'トラフィックの分散。ALB、NLB、GLBの違いと使い分けを学ぶ',
    icon: '⚖️',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    slug: 'cloudfront',
    name: 'CloudFront・CDN',
    nameEn: 'Amazon CloudFront',
    description: 'コンテンツ配信ネットワーク。キャッシュ、オリジン、エッジロケーションを学ぶ',
    icon: '🚀',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
]

export const DIFFICULTIES: DifficultyInfo[] = [
  {
    slug: 'beginner',
    label: '初級',
    description: '基本概念と用語を理解する',
    color: 'text-green-700',
    bg: 'bg-green-100',
    border: 'border-green-300',
  },
  {
    slug: 'intermediate',
    label: '中級',
    description: '設計パターンとベストプラクティス',
    color: 'text-yellow-700',
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
  },
  {
    slug: 'advanced',
    label: '上級',
    description: '試験頻出問題と実践的な応用',
    color: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-300',
  },
]

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug)
}

export function getDifficultyBySlug(slug: string): DifficultyInfo | undefined {
  return DIFFICULTIES.find((d) => d.slug === slug)
}
