export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type CategorySlug =
  | 'vpc'
  | 'route53'
  | 'elb'
  | 'ec2'
  | 's3'
  | 'rds'
  | 'lambda'
  | 'iam'
  | 'cloudfront'
  | 'containers'
  | 'monitoring'
  | 'migration'
  | 'analytics'

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

// 章立ては docs/curriculum.md（SAA-C03 の対象サービス一覧と突き合わせたもの）に合わせる。
// slug は URL に使うため変えない（表示名だけ広げている）。
export const CATEGORIES: Category[] = [
  {
    slug: 'vpc',
    name: 'VPC・ネットワーク',
    nameEn: 'Amazon VPC / Networking',
    description: 'AWS上の仮想ネットワーク。サブネット、ルーティング、SG・NACL、ピアリング、Transit Gateway、VPCエンドポイント、VPN・Direct Connectを学ぶ',
    icon: '🌐',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    slug: 'route53',
    name: 'Route 53・DNS',
    nameEn: 'Amazon Route 53',
    description: 'DNSの仕組みとRoute 53。ホストゾーン、レコード（A・CNAME・Alias）、ルーティングポリシー、ヘルスチェック、プライベートホストゾーンを学ぶ',
    icon: '🧭',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    slug: 'elb',
    name: 'ELB・Auto Scaling',
    nameEn: 'Elastic Load Balancing / EC2 Auto Scaling',
    description: '負荷分散と台数の自動調整。ALB・NLB・GWLBの使い分け、ヘルスチェック、マルチAZ、スケーリングポリシーを学ぶ',
    icon: '⚖️',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    slug: 'ec2',
    name: 'EC2・コンピュート',
    nameEn: 'Amazon EC2',
    description: 'AWSの仮想サーバー。インスタンスタイプ、AMI、購入オプション（スポット・Savings Plans）、プレイスメントグループを学ぶ',
    icon: '💻',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    slug: 's3',
    name: 'ストレージ',
    nameEn: 'Amazon S3 / EBS / EFS / FSx',
    description: 'S3のストレージクラスとライフサイクル、EBS・EFS・FSxの使い分け、Storage Gateway、AWS Backupを学ぶ',
    icon: '🗂️',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    slug: 'rds',
    name: 'データベース',
    nameEn: 'Amazon RDS / Aurora / DynamoDB',
    description: 'RDSのMulti-AZとリードレプリカ、Aurora、DynamoDB、ElastiCache、Redshiftの使い分けを学ぶ',
    icon: '🗄️',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    slug: 'lambda',
    name: '疎結合・サーバーレス',
    nameEn: 'SQS / SNS / EventBridge / Lambda',
    description: 'SQS・SNS・EventBridgeでシステムを疎結合にする方法と、Lambda・API Gateway・Step Functions・Kinesisを学ぶ',
    icon: '⚡',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    slug: 'iam',
    name: 'セキュリティ・ID',
    nameEn: 'IAM / KMS / WAF',
    description: 'IAMとOrganizations、IAM Identity Center、KMSとSecrets Managerによる暗号化、WAF・Shield・GuardDutyを学ぶ',
    icon: '🔐',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    slug: 'cloudfront',
    name: 'CDN・グローバル配信',
    nameEn: 'Amazon CloudFront / Global Accelerator',
    description: 'CloudFrontのキャッシュとオリジン、署名付きURL、Global Acceleratorとの使い分けを学ぶ',
    icon: '🚀',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    slug: 'containers',
    name: 'コンテナ',
    nameEn: 'Amazon ECS / EKS / Fargate',
    description: 'ECS・EKSの違い、Fargateによるサーバーレスなコンテナ実行、ECRを学ぶ',
    icon: '📦',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
  },
  {
    slug: 'monitoring',
    name: '監視・運用',
    nameEn: 'CloudWatch / CloudTrail / Config',
    description: 'CloudWatchのメトリクスとアラーム、CloudTrailによる操作記録、Config、Systems Manager、CloudFormationを学ぶ',
    icon: '📈',
    color: 'text-lime-600',
    bgColor: 'bg-lime-50',
  },
  {
    slug: 'migration',
    name: '移行・ハイブリッド',
    nameEn: 'DMS / DataSync / Snow Family',
    description: 'オンプレミスからAWSへの移行。DMS、DataSync、Snow Family、Transfer Family、Application Migration Serviceの使い分けを学ぶ',
    icon: '🚚',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    slug: 'analytics',
    name: '分析・機械学習',
    nameEn: 'Athena / Glue / AI services',
    description: 'Athena・Glue・EMRなどの分析サービスと、Rekognition・Comprehendなどの機械学習サービスを「用途から選ぶ」観点で学ぶ',
    icon: '🔎',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
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
