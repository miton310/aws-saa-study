# カリキュラム（章立て）

SAA-C03 の公式「対象サービス一覧」（In-Scope AWS Services）と突き合わせて決めた章立て。
章の定義は `lib/categories.ts`、章ごとの色は `components/site/chapters.ts`。
図解レッスンは `lib/lessons/`（`category` で章に所属）。

- 出典：https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html
- 重要度（★）は過去の出題傾向にもとづく判断で、公式の数値ではない。
- slug は URL に使うため変えない。章の表示名だけ広げている（例：`s3` →「ストレージ」）。

| # | slug | 章 | 主なサービス | 重要度 |
|---|---|---|---|---|
| 01 | vpc | VPC・ネットワーク | VPC、NAT、SG/NACL、ピアリング、Transit Gateway、VPCエンドポイント、PrivateLink、Site-to-Site VPN、Client VPN、Direct Connect | ★★★ |
| 02 | route53 | Route 53・DNS | Route 53 | ★★★ |
| 03 | elb | ELB・Auto Scaling | ELB（ALB・NLB・GWLB）、EC2 Auto Scaling | ★★★ |
| 04 | ec2 | EC2・コンピュート | EC2、購入オプション（オンデマンド・リザーブド・Savings Plans・スポット）、Elastic Beanstalk、Batch | ★★★ |
| 05 | s3 | ストレージ | S3、S3 Glacier、EBS、EFS、FSx、Storage Gateway、AWS Backup | ★★★ |
| 06 | rds | データベース | RDS、Aurora、DynamoDB、ElastiCache、Redshift | ★★★ |
| 07 | lambda | 疎結合・サーバーレス | SQS、SNS、EventBridge、Step Functions、Lambda、API Gateway、Kinesis | ★★★ |
| 08 | iam | セキュリティ・ID | IAM、Organizations、IAM Identity Center、KMS、Secrets Manager、ACM、WAF、Shield、GuardDuty、Cognito | ★★★ |
| 09 | cloudfront | CDN・グローバル配信 | CloudFront、Global Accelerator | ★★ |
| 10 | containers | コンテナ | ECS、EKS、Fargate、ECR | ★★ |
| 11 | monitoring | 監視・運用 | CloudWatch、CloudTrail、Config、Systems Manager、CloudFormation | ★★ |
| 12 | migration | 移行・ハイブリッド | DMS、DataSync、Snow Family、Transfer Family、Application Migration Service | ★ |
| 13 | analytics | 分析・機械学習 | Athena、Glue、EMR、OpenSearch、Rekognition、Comprehend、Textract など（用途から選ぶ問題が中心） | ★ |

## 図解レッスンの状況

| 章 | 公開済み | 次に作る候補 |
|---|---|---|
| 01 VPC・ネットワーク | VPCとNATゲートウェイ / SGとNACL / ピアリングとTransit Gateway / VPCエンドポイント | VPN と Direct Connect |
| 02 Route 53・DNS | DNSの仕組みとRoute 53 | Route 53 Resolver（ハイブリッドDNS）/ ヘルスチェックの詳細 |
| 03 ELB・Auto Scaling | ELBとAuto Scaling | — |
| 04 EC2・コンピュート | EC2の購入オプションの選び方 | プレイスメントグループ / EC2 のストレージ |
| 05 ストレージ | ストレージクラスとライフサイクル / EBS・EFS・FSx の使い分け | Storage Gateway / S3 のセキュリティ |
| 06 データベース | Multi-AZとリードレプリカ / DynamoDB の基本 | Aurora・ElastiCache |
| 07 疎結合・サーバーレス | SQS・SNS・EventBridge | Lambda と API Gateway / Step Functions |
| 08 セキュリティ・ID | IAMポリシーとロール / KMS と暗号化 | Organizations と SCP / WAF・Shield |
| 09 CDN・グローバル配信 | CloudFront とキャッシュ | Route 53 との組み合わせ / AWS WAF |
| 11 監視・運用 | CloudWatch と CloudTrail | Systems Manager / Trusted Advisor |
| 10・12・13 | — | 重要度の高い章のあとで着手 |

作る順番：重要度★★★の章から（Route 53 は公開済み）。
