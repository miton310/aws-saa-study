import type { CategorySlug } from '@/lib/categories'

// 章（カテゴリ）ごとの色。サイドナビ・トップページ共通
export const CHAPTER_COLORS: Record<CategorySlug, string> = {
  vpc: '#cfe8b8',
  ec2: '#f6c191',
  s3: '#bcd4f0',
  iam: '#f3b7b0',
  rds: '#d9cdf2',
  lambda: '#f6e2a4',
  elb: '#b9e3dc',
  cloudfront: '#c9d2f2',
}
