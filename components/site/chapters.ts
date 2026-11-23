import { CATEGORIES, type CategorySlug } from '@/lib/categories'

// 章（カテゴリ）ごとの色。サイドナビ・トップページ・解説ページ共通
export const CHAPTER_COLORS: Record<CategorySlug, string> = {
  vpc: '#cfe8b8',
  ec2: '#f6c191',
  s3: '#bcd4f0',
  iam: '#f3b7b0',
  rds: '#d9cdf2',
  lambda: '#f6e2a4',
  elb: '#b9e3dc',
  cloudfront: '#c9d2f2',
  route53: '#a8dcc5',
  containers: '#bcd4f0',
  monitoring: '#e9e4da',
  migration: '#f6c191',
  analytics: '#f3b7b0',
}

/** サイドナビと同じ「01. VPC・ネットワーク」形式の章名 */
export function chapterLabel(slug: CategorySlug) {
  const i = CATEGORIES.findIndex((c) => c.slug === slug)
  return `${String(i + 1).padStart(2, '0')}. ${CATEGORIES[i].name}`
}
