import { CategorySlug, Difficulty } from './categories'

export interface QuizQuestion {
  question: string
  options: string[]
  answer: number
  explanation: string
}

export interface ContentSection {
  title: string
  body: string
  keyPoints: string[]
}

export interface LearningContent {
  overview: string
  sections: ContentSection[]
  quiz: QuizQuestion[]
  affiliateLinks: AffiliateLink[]
}

export interface AffiliateLink {
  title: string
  description: string
  url: string
  badge: string
}

const AFFILIATE_BOOKS: AffiliateLink[] = [
  {
    title: 'AWS認定ソリューションアーキテクト-アソシエイト問題集',
    description: '1000問以上の模擬問題。SAA合格者が厳選した重要問題を収録。',
    url: 'https://amzn.to/3SAA001',
    badge: 'ベストセラー',
  },
  {
    title: 'AWS認定資格試験テキスト AWS認定ソリューションアーキテクト-アソシエイト',
    description: 'AWS公式テキスト。図解で丁寧に解説。試験合格への最短ルート。',
    url: 'https://amzn.to/3SAA002',
    badge: '公式推薦',
  },
]

type ContentMap = Partial<Record<CategorySlug, Partial<Record<Difficulty, LearningContent>>>>

export const CONTENT: ContentMap = {
  vpc: {
    beginner: {
      overview:
        'VPC（Virtual Private Cloud）は、AWS上に構築するあなた専用の仮想ネットワーク空間です。インターネットから隔離された環境でAWSリソースを安全に配置できます。',
      sections: [
        {
          title: 'VPCとは何か',
          body: 'VPCはAWSクラウド内の論理的に分離された仮想ネットワークです。自分専用のデータセンターをクラウド上に持つイメージです。CIDRブロック（例：10.0.0.0/16）でIPアドレス範囲を定義します。',
          keyPoints: [
            'リージョン内に作成される仮想ネットワーク',
            'CIDRブロックでIPアドレス範囲を指定（例：10.0.0.0/16）',
            '1アカウントにつき最大5つのVPCを作成可能（上限緩和申請あり）',
            'デフォルトVPCが各リージョンに自動作成される',
          ],
        },
        {
          title: 'サブネット',
          body: 'サブネットはVPC内をさらに分割したネットワーク区画です。パブリックサブネット（インターネットからアクセス可）とプライベートサブネット（内部のみ）に分けて使います。サブネットは必ず1つのアベイラビリティゾーン（AZ）に紐づきます。',
          keyPoints: [
            'パブリックサブネット：インターネットゲートウェイ経由でインターネット接続可能',
            'プライベートサブネット：NATゲートウェイ経由でのみ外部通信可能',
            'サブネットは単一のAZにのみ配置できる',
            '可用性向上のため、複数AZにサブネットを作成するのが推奨',
          ],
        },
        {
          title: 'インターネットゲートウェイ（IGW）',
          body: 'インターネットゲートウェイはVPCとインターネットを接続するコンポーネントです。パブリックサブネットのEC2インスタンスがインターネットと通信するために必要です。',
          keyPoints: [
            'VPCに1つアタッチするだけで利用可能',
            '冗長性・高可用性はAWSが管理',
            'パブリックIPアドレスまたはElastic IPが必要',
            'ルートテーブルに 0.0.0.0/0 → IGW の設定が必要',
          ],
        },
      ],
      quiz: [
        {
          question: 'VPCのサブネットについて正しい説明はどれですか？',
          options: [
            'サブネットは複数のアベイラビリティゾーンにまたがって作成できる',
            'サブネットは必ず1つのアベイラビリティゾーンに紐づく',
            'パブリックサブネットはインターネットから直接アクセスできない',
            '1つのVPCに作成できるサブネット数は最大5つまで',
          ],
          answer: 1,
          explanation:
            'サブネットは1つのAZにのみ配置できます。高可用性のために複数AZに複数のサブネットを作成します。',
        },
        {
          question: 'パブリックサブネットのEC2インスタンスがインターネットと通信するために必要なコンポーネントはどれですか？',
          options: ['NATゲートウェイ', 'VPCピアリング', 'インターネットゲートウェイ', 'Direct Connect'],
          answer: 2,
          explanation:
            'インターネットゲートウェイ（IGW）をVPCにアタッチし、ルートテーブルに0.0.0.0/0→IGWのルートを追加することでインターネット接続が可能になります。',
        },
        {
          question: 'デフォルトVPCについて正しいものはどれですか？',
          options: [
            '手動で作成する必要がある',
            '各リージョンに自動的に作成される',
            '削除しても自動的に再作成されない',
            'CIDRブロックを変更できる',
          ],
          answer: 1,
          explanation: 'デフォルトVPCは各AWSリージョンに自動作成されます。誤って削除した場合はAWSコンソールから再作成可能です。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
    intermediate: {
      overview:
        'VPCのセキュリティ制御（セキュリティグループとネットワークACL）、NATゲートウェイ、VPCピアリングなどの中級トピックを学びます。設計パターンと高可用性アーキテクチャを理解しましょう。',
      sections: [
        {
          title: 'セキュリティグループ vs ネットワークACL',
          body: 'セキュリティグループはEC2インスタンスレベルのファイアウォール（ステートフル）、ネットワークACLはサブネットレベルのファイアウォール（ステートレス）です。',
          keyPoints: [
            'セキュリティグループ：ステートフル（戻りトラフィックを自動許可）、インバウンド/アウトバウンドルール',
            'ネットワークACL：ステートレス（戻りトラフィックも明示的に許可が必要）、番号順に評価',
            'セキュリティグループはデフォルトで全インバウンド拒否、全アウトバウンド許可',
            'ネットワークACLはデフォルトで全許可（デフォルトACL）または全拒否（カスタムACL）',
          ],
        },
        {
          title: 'NATゲートウェイ',
          body: 'プライベートサブネットのEC2インスタンスがインターネットへのアウトバウンド通信（ソフトウェア更新など）を行うためのコンポーネントです。インバウンド通信は遮断されます。',
          keyPoints: [
            'パブリックサブネットに配置し、Elastic IPを割り当てる',
            '各AZに1つずつ配置するのがベストプラクティス（単一障害点を避ける）',
            'NATゲートウェイはAWSマネージド（高可用性）',
            'NATインスタンスは自己管理型（コスト安だが可用性が低い）',
          ],
        },
        {
          title: 'VPCピアリング',
          body: '異なるVPC間をプライベートに接続する機能です。同一リージョン、異なるリージョン、異なるAWSアカウント間で接続できます。',
          keyPoints: [
            'CIDRブロックが重複していると接続不可',
            'トランジティブルーティング不可（A-B-C接続でA-C通信不可）',
            '双方向のルートテーブル設定が必要',
            'Transit Gatewayを使えばハブ＆スポーク型の接続が可能',
          ],
        },
      ],
      quiz: [
        {
          question: 'セキュリティグループとネットワークACLの違いとして正しいものはどれですか？',
          options: [
            'セキュリティグループはステートレス、ネットワークACLはステートフル',
            'セキュリティグループはステートフル、ネットワークACLはステートレス',
            '両方ともステートフル',
            '両方ともステートレス',
          ],
          answer: 1,
          explanation:
            'セキュリティグループはステートフル（戻りトラフィックを自動許可）、ネットワークACLはステートレス（明示的なルールが必要）です。',
        },
        {
          question: 'NATゲートウェイについて正しくないものはどれですか？',
          options: [
            'パブリックサブネットに配置する必要がある',
            'Elastic IPが必要',
            'プライベートサブネットからインターネットへの通信を可能にする',
            'インターネットからプライベートサブネットへの直接アクセスを許可する',
          ],
          answer: 3,
          explanation:
            'NATゲートウェイはアウトバウンド（プライベート→インターネット）のみを許可します。インターネットからのインバウンドアクセスは遮断されます。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
    advanced: {
      overview:
        'VPCの高度な設計パターン、Transit Gateway、VPN・Direct Connect、VPCエンドポイントなど試験頻出の上級トピックを学びます。',
      sections: [
        {
          title: 'Transit Gateway',
          body: '複数のVPCとオンプレミスネットワークを一元管理するハブです。ピアリングのN対N接続問題を解消します。',
          keyPoints: [
            'ハブ＆スポーク型で多数のVPCを接続できる',
            'リージョン間ピアリングで複数リージョンのVPCを接続可能',
            'VPNとDirect Connectの接続先としても利用可能',
            '帯域制限なし、高スループット',
          ],
        },
        {
          title: 'VPCエンドポイント',
          body: 'インターネットを経由せずにAWSサービスに接続するためのプライベートエンドポイントです。セキュリティとパフォーマンスが向上します。',
          keyPoints: [
            'ゲートウェイ型：S3、DynamoDB（無料）',
            'インターフェイス型（AWS PrivateLink）：多くのAWSサービス、ENIを使用',
            'インターネットゲートウェイ不要でAWSサービスに接続可能',
            'セキュリティグループでアクセス制御が可能（インターフェイス型）',
          ],
        },
        {
          title: 'AWS Site-to-Site VPN vs Direct Connect',
          body: 'オンプレミスとAWSを接続する2つの主要な方法の違いを理解することが重要です。',
          keyPoints: [
            'Site-to-Site VPN：インターネット経由の暗号化接続、即時設定可能、帯域不安定',
            'Direct Connect：専用回線接続、低レイテンシー・高帯域、開通に数週間',
            'Direct Connect + VPN：バックアップとして両方使用するパターン',
            'Direct Connect Gatewayで複数リージョン接続が可能',
          ],
        },
      ],
      quiz: [
        {
          question: 'S3へのアクセスをインターネット経由せずにプライベートに行いたい場合、最適な選択はどれですか？',
          options: ['NAT Gateway', 'Internet Gateway', 'S3用ゲートウェイ型VPCエンドポイント', 'Direct Connect'],
          answer: 2,
          explanation:
            'S3へのプライベート接続にはゲートウェイ型VPCエンドポイントを使用します。無料で利用でき、インターネットを経由しないため安全です。',
        },
        {
          question: '多数のVPCを効率的に接続する最適なサービスはどれですか？',
          options: ['VPCピアリング', 'Transit Gateway', 'Direct Connect', 'Site-to-Site VPN'],
          answer: 1,
          explanation:
            'Transit Gatewayはハブ&スポーク型で多数のVPCを効率的に接続できます。VPCピアリングはN対N接続が必要になり管理が複雑になります。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
  },
  ec2: {
    beginner: {
      overview:
        'EC2（Elastic Compute Cloud）はAWSが提供する仮想サーバーサービスです。数分以内にサーバーを起動でき、使った分だけ課金されます。',
      sections: [
        {
          title: 'EC2インスタンスタイプ',
          body: 'インスタンスタイプはCPU、メモリ、ストレージ、ネットワーク性能の組み合わせです。ワークロードに合わせて最適なタイプを選ぶことが重要です。',
          keyPoints: [
            '汎用（M, T系）：バランスの取れたリソース、Webサーバー向け',
            'コンピューティング最適化（C系）：高CPU処理、バッチ処理向け',
            'メモリ最適化（R, X系）：大量メモリ、データベース向け',
            'ストレージ最適化（I, D系）：高I/O、NoDBデータベース向け',
            'GPU（P, G系）：機械学習、グラフィックス処理向け',
          ],
        },
        {
          title: 'AMI（Amazon Machine Image）',
          body: 'AMIはEC2インスタンスの起動テンプレートです。OS、アプリケーション、設定が含まれており、同じ環境のインスタンスを素早く複製できます。',
          keyPoints: [
            'AWS提供のAMI（Amazon Linux 2, Ubuntu等）が利用可能',
            'カスタムAMIを作成して独自環境を保存可能',
            'AMIはリージョン固有（他リージョンにコピー可能）',
            'AWS Marketplaceで商用AMIも購入可能',
          ],
        },
        {
          title: '購入オプション',
          body: 'EC2には用途に合わせた複数の購入オプションがあります。適切な選択でコストを大幅に削減できます。',
          keyPoints: [
            'オンデマンド：従量課金、最も高いが柔軟性最大',
            'リザーブドインスタンス：1〜3年契約で最大72%割引',
            'スポットインスタンス：空きキャパシティを活用、最大90%割引（中断あり）',
            'Savings Plans：より柔軟なコミットメント型割引',
          ],
        },
      ],
      quiz: [
        {
          question: '急なトラフィック増加に対応できるが、処理が中断されても問題ないバッチ処理に最適なEC2購入オプションはどれですか？',
          options: ['オンデマンドインスタンス', 'リザーブドインスタンス', 'スポットインスタンス', 'Dedicated Host'],
          answer: 2,
          explanation:
            'スポットインスタンスは最大90%の割引がありますが、AWSの都合で中断される場合があります。中断を許容できるバッチ処理に最適です。',
        },
        {
          question: 'EC2インスタンスのAMIについて正しいものはどれですか？',
          options: [
            'AMIはグローバルに共通で使用できる',
            'AMIはリージョン固有だが、他リージョンにコピー可能',
            'AMIにはOSのみが含まれ、アプリケーションは含まれない',
            'カスタムAMIは作成できない',
          ],
          answer: 1,
          explanation:
            'AMIはリージョン固有ですが、他リージョンにコピーして使用することが可能です。OSだけでなく、アプリケーションや設定も含めることができます。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
    intermediate: {
      overview:
        'EC2の高可用性設計、Auto Scaling、EBS（ストレージ）、ネットワーク設定など中級トピックを学びます。',
      sections: [
        {
          title: 'Auto Scaling',
          body: 'EC2 Auto Scalingはトラフィックに応じてインスタンス数を自動的に増減させるサービスです。コスト最適化と高可用性を両立します。',
          keyPoints: [
            'スケールアウト：負荷増加時にインスタンスを追加',
            'スケールイン：負荷低下時にインスタンスを削除',
            'ターゲット追跡スケーリング（推奨）：CPU使用率等の目標値を維持',
            'ステップスケーリング：段階的なスケーリング設定',
            '起動テンプレートでインスタンスの設定を定義',
          ],
        },
        {
          title: 'EBS（Elastic Block Store）',
          body: 'EBSはEC2に接続するブロックストレージです。同一AZ内のEC2にアタッチして使用します。',
          keyPoints: [
            'gp3：汎用SSD、コスト効率が良い（推奨デフォルト）',
            'io2 Block Express：高性能SSD、データベース向け',
            'st1：スループット最適化HDD、大量データのシーケンシャルアクセス向け',
            'sc1：コールドHDD、アクセス頻度の低いデータ向け',
            'EBSスナップショットでバックアップ作成（S3に保存）',
          ],
        },
      ],
      quiz: [
        {
          question: 'EC2 Auto Scalingのターゲット追跡スケーリングで追跡できるメトリクスはどれですか？',
          options: [
            'EBSの使用量',
            '平均CPU使用率',
            'VPCのルートテーブル数',
            'IAMポリシーの数',
          ],
          answer: 1,
          explanation:
            'ターゲット追跡スケーリングでは平均CPU使用率、ネットワーク入出力量、ELBのリクエスト数などをメトリクスとして追跡できます。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
    advanced: {
      overview:
        'EC2の上級トピック：プレイスメントグループ、Elastic Network Adapter、Nitroシステム、ハイバネーションなど試験頻出の内容を学びます。',
      sections: [
        {
          title: 'プレイスメントグループ',
          body: 'EC2インスタンスをどのように配置するかを制御する機能です。ワークロードの特性に応じて選択します。',
          keyPoints: [
            'クラスタープレイスメントグループ：同一AZ内に密集配置、低レイテンシー・高スループット（HPC向け）',
            'スプレッドプレイスメントグループ：異なるハードウェアに分散配置、高可用性（最大7インスタンス/AZ）',
            'パーティションプレイスメントグループ：ラック単位で分離、Hadoop/Kafkaなどの分散システム向け',
          ],
        },
        {
          title: 'ハイバネーション',
          body: 'ハイバネーションはEC2インスタンスのRAM状態をEBSに保存して停止し、再起動時に高速起動を実現する機能です。',
          keyPoints: [
            '起動時間が大幅に短縮される',
            'ルートEBSは暗号化が必須',
            'RAMのサイズは150GB以下が必要',
            '60日以上のハイバネーションは不可',
          ],
        },
      ],
      quiz: [
        {
          question: 'HPC（高性能コンピューティング）ワークロードで低レイテンシー通信が必要な場合、最適なプレイスメントグループはどれですか？',
          options: [
            'スプレッドプレイスメントグループ',
            'クラスタープレイスメントグループ',
            'パーティションプレイスメントグループ',
            'プレイスメントグループは不要',
          ],
          answer: 1,
          explanation:
            'クラスタープレイスメントグループは同一AZ内に密集配置し、最低レイテンシーと最大スループットを実現します。HPC向けに最適です。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
  },
  s3: {
    beginner: {
      overview:
        'S3（Simple Storage Service）はAWSのオブジェクトストレージサービスです。容量無制限で、あらゆるデータを安全に保存できます。',
      sections: [
        {
          title: 'S3の基本概念',
          body: 'S3はバケット（コンテナ）の中にオブジェクト（ファイル）を格納します。グローバルに一意なバケット名が必要です。',
          keyPoints: [
            'バケット名はグローバルで一意（全AWSユーザー間で重複不可）',
            'オブジェクトサイズは最大5TB（マルチパートアップロードで5GBを超える場合）',
            'キー（パス）でオブジェクトを識別（例：images/photo.jpg）',
            'バケットはリージョン固有だが、バケット名はグローバルで一意',
          ],
        },
        {
          title: 'ストレージクラス',
          body: 'データのアクセス頻度と保存コストに応じて適切なストレージクラスを選択します。',
          keyPoints: [
            'S3 Standard：頻繁アクセス、高可用性（99.99%）、高コスト',
            'S3 Intelligent-Tiering：アクセスパターン不明時に自動最適化',
            'S3 Standard-IA：低頻度アクセス、低ストレージコスト・高取得コスト',
            'S3 Glacier：長期アーカイブ、低コスト、取得に分単位〜時間',
            'S3 Glacier Deep Archive：最低コスト、取得に12時間',
          ],
        },
        {
          title: 'S3のセキュリティ',
          body: 'S3バケットはデフォルトで非公開です。適切なアクセス制御の設定が重要です。',
          keyPoints: [
            'デフォルトでパブリックアクセスブロックが有効',
            'バケットポリシー：バケット全体のアクセス制御',
            'IAMポリシー：ユーザー/ロール単位のアクセス制御',
            'ACL（非推奨）：オブジェクト単位の制御',
            'SSE-S3、SSE-KMS、SSE-Cで暗号化可能',
          ],
        },
      ],
      quiz: [
        {
          question: 'S3バケット名について正しいものはどれですか？',
          options: [
            'バケット名はリージョン内で一意であれば良い',
            'バケット名はAWSアカウント内で一意であれば良い',
            'バケット名はグローバル（全AWSユーザー）で一意である必要がある',
            'バケット名の制限はない',
          ],
          answer: 2,
          explanation:
            'S3バケット名はグローバルで一意です。世界中のAWSユーザー間で重複することができません。',
        },
        {
          question: 'ほとんどアクセスされないデータを最低コストで長期保存したい場合、最適なS3ストレージクラスはどれですか？',
          options: [
            'S3 Standard',
            'S3 Standard-IA',
            'S3 Glacier',
            'S3 Glacier Deep Archive',
          ],
          answer: 3,
          explanation:
            'S3 Glacier Deep Archiveは最低コストのストレージクラスです。取得に最大12時間かかりますが、めったにアクセスしない長期保存データに最適です。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
    intermediate: {
      overview:
        'S3のライフサイクル管理、バージョニング、レプリケーション、静的Webサイトホスティングなど中級トピックを学びます。',
      sections: [
        {
          title: 'S3バージョニング',
          body: 'バージョニングを有効にすると、同一オブジェクトの複数バージョンを保持できます。誤削除や上書きからデータを保護します。',
          keyPoints: [
            '一度有効にしたバージョニングは無効にできない（停止は可能）',
            '削除マーカーでオブジェクトを「論理削除」',
            'MFA削除でさらに強固な保護が可能',
            'すべてのバージョン分のストレージコストが発生',
          ],
        },
        {
          title: 'S3ライフサイクルポリシー',
          body: 'データの経年に応じてストレージクラスを自動移行したり、不要データを自動削除する設定です。',
          keyPoints: [
            'Standard → Standard-IA → Glacier → Glacier Deep Archive の順に移行可能',
            '現行バージョンと旧バージョンに別々のルールを適用可能',
            '不完全なマルチパートアップロードの自動削除も設定可能',
          ],
        },
        {
          title: 'S3レプリケーション',
          body: 'オブジェクトを別のバケットに自動的にコピーする機能です。',
          keyPoints: [
            'CRR（Cross-Region Replication）：異なるリージョン間でのレプリケーション、災害対策に有効',
            'SRR（Same-Region Replication）：同一リージョン内でのレプリケーション、ログ集約に有効',
            '送信元と送信先両方でバージョニングを有効にする必要あり',
            'レプリケーション設定前の既存オブジェクトはコピーされない',
          ],
        },
      ],
      quiz: [
        {
          question: 'S3バージョニングについて正しくないものはどれですか？',
          options: [
            '誤って削除したオブジェクトを復元できる',
            '一度有効にすると無効化（Disabled状態）に戻せない',
            'バージョニング対応オブジェクトを削除すると削除マーカーが付く',
            'バージョニングを有効にするとストレージコストは増加しない',
          ],
          answer: 3,
          explanation:
            'バージョニングを有効にすると、すべてのバージョン分のストレージコストが発生します。古いバージョンのデータも保存されるためコストが増加します。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
    advanced: {
      overview:
        'S3の上級機能：S3 Transfer Acceleration、マルチパートアップロード、S3 Object Lock、Presigned URL、イベント通知などを学びます。',
      sections: [
        {
          title: 'S3 Transfer Acceleration',
          body: 'CloudFrontのエッジロケーションを経由して、グローバルのS3アップロードを高速化するサービスです。',
          keyPoints: [
            '遠距離からのアップロードを最大300%高速化',
            'エッジロケーションからAWSバックボーンネットワークを経由',
            '速度が改善しない場合は追加料金なし',
          ],
        },
        {
          title: 'S3 Object Lock',
          body: 'WORM（Write Once Read Many）モデルでオブジェクトを不変にする機能です。法規制やコンプライアンス要件に対応します。',
          keyPoints: [
            'ガバナンスモード：特定の権限を持つユーザーのみ変更可能',
            'コンプライアンスモード：誰も削除・変更不可（ルートユーザーも不可）',
            'リーガルホールド：期間制限なしのロック（s3:PutObjectLegalHold権限が必要）',
            'バージョニングの有効化が前提',
          ],
        },
      ],
      quiz: [
        {
          question: '法的な保管要件で誰もデータを削除・変更できないようにする必要がある場合、S3 Object Lockのどのモードが適切ですか？',
          options: [
            'ガバナンスモード',
            'コンプライアンスモード',
            'リーガルホールド',
            'バージョニングで十分',
          ],
          answer: 1,
          explanation:
            'コンプライアンスモードはルートユーザーを含む誰も保持期間中はオブジェクトを削除・変更できません。厳格なコンプライアンス要件に対応します。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
  },
  iam: {
    beginner: {
      overview:
        'IAM（Identity and Access Management）はAWSリソースへのアクセスを安全に管理するサービスです。誰がどのリソースに何をできるかを定義します。',
      sections: [
        {
          title: 'IAMの構成要素',
          body: 'IAMはユーザー、グループ、ロール、ポリシーの4つの主要な構成要素で成り立っています。',
          keyPoints: [
            'IAMユーザー：個人またはアプリケーションを表すAWSアカウントのエンティティ',
            'IAMグループ：IAMユーザーの集合。グループにポリシーを適用して一括管理',
            'IAMロール：AWS サービスや外部ユーザーが一時的に引き受けるアクセス権限',
            'IAMポリシー：JSON形式でアクセス権限を定義するドキュメント',
          ],
        },
        {
          title: 'IAMポリシーの基本',
          body: 'ポリシーはどのAWSリソースに対してどのアクションを許可または拒否するかを定義します。',
          keyPoints: [
            'Allow（許可）とDeny（拒否）を明示的に定義',
            '明示的なDenyはAllowより優先される',
            'デフォルトはすべて拒否（暗黙のDeny）',
            'Effect、Action、Resource、Conditionがポリシーの主要要素',
          ],
        },
        {
          title: 'ベストプラクティス',
          body: 'セキュリティを高めるためのIAMのベストプラクティスを理解しましょう。',
          keyPoints: [
            'ルートアカウントは日常業務に使用しない',
            'MFA（多要素認証）を有効にする',
            '最小権限の原則：必要最小限のアクセス権のみ付与',
            'アクセスキーは定期的にローテーション',
            'IAMユーザーの代わりにIAMロールを使用する（特にEC2から）',
          ],
        },
      ],
      quiz: [
        {
          question: 'IAMポリシーのDenyとAllowが同時に設定されている場合、どちらが優先されますか？',
          options: [
            '後から設定したものが優先される',
            'Allowが常に優先される',
            '明示的なDenyが優先される',
            '管理者が設定したものが優先される',
          ],
          answer: 2,
          explanation:
            '明示的なDenyは常にAllowより優先されます。AWSはデフォルトですべてを拒否し（暗黙のDeny）、明示的なAllowがある場合のみアクセスを許可します。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
    intermediate: {
      overview:
        'IAMロールの詳細、STS（Security Token Service）、クロスアカウントアクセス、ポリシーの評価ロジックを学びます。',
      sections: [
        {
          title: 'IAMロールとSTS',
          body: 'IAMロールは一時的な認証情報を使って権限を委任する仕組みです。STSが一時的なアクセスキーを発行します。',
          keyPoints: [
            'ロールのAssumeで一時認証情報（15分〜12時間）を取得',
            'EC2インスタンスプロファイルでEC2にロールを割り当て',
            'クロスアカウントロールで他のAWSアカウントに安全にアクセス',
            'IDフェデレーションでSSO（シングルサインオン）を実現',
          ],
        },
      ],
      quiz: [
        {
          question: 'EC2インスタンスがS3にアクセスする最も安全な方法はどれですか？',
          options: [
            'EC2インスタンスにアクセスキーをハードコード',
            'EC2インスタンスにIAMロールを割り当て（インスタンスプロファイル）',
            '環境変数にアクセスキーを設定',
            'S3バケットを完全公開にする',
          ],
          answer: 1,
          explanation:
            'EC2インスタンスにIAMロールを割り当て（インスタンスプロファイル）が最もセキュアです。アクセスキーをコード内に保存する必要がなく、認証情報のローテーションも自動的に行われます。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
    advanced: {
      overview:
        'IAMの高度なトピック：Permission Boundaries、Service Control Policies（SCP）、AWS Organizations、IAM Access Analyzerを学びます。',
      sections: [
        {
          title: 'Permission Boundaries',
          body: 'IAMエンティティが持てる最大権限を制限する機能です。権限の委任時に使用します。',
          keyPoints: [
            'ユーザーやロールに設定できる最大権限の境界',
            'Permission BoundaryとIAMポリシーの積集合が実効権限',
            '開発者が自分より強い権限を作成できないように制限',
          ],
        },
        {
          title: 'Service Control Policies（SCP）',
          body: 'AWS Organizationsで組織全体のアカウントに適用できる権限制限です。',
          keyPoints: [
            'Organizationsの管理アカウントから設定',
            'OU（組織単位）またはアカウントに適用',
            'マスターアカウントには適用されない',
            'SCPはガードレールとして機能し、最大権限を制限',
          ],
        },
      ],
      quiz: [
        {
          question: 'AWS OrganizationsのSCP（Service Control Policies）について正しいものはどれですか？',
          options: [
            'SCPは管理アカウント（ルートアカウント）にも適用される',
            'SCPは組織内のメンバーアカウントの最大権限を制限する',
            'SCPがなくてもIAMポリシーだけで組織全体を管理できる',
            'SCPを設定しても個々のIAMポリシーはそのまま有効になる',
          ],
          answer: 1,
          explanation:
            'SCPは組織内のメンバーアカウントに対して最大権限を設定します。管理アカウントにはSCPは適用されません。SCPとIAMポリシーの積集合が実効権限となります。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
  },
  lambda: {
    beginner: {
      overview:
        'AWS Lambdaはサーバーを管理せずにコードを実行できるサーバーレスコンピュートサービスです。イベントに応じてコードが自動実行されます。',
      sections: [
        {
          title: 'Lambdaの基本',
          body: 'Lambdaはサーバーのプロビジョニングや管理なしにコードを実行できます。実行時間（最大15分）とメモリ（最大10GB）が設定可能です。',
          keyPoints: [
            'サポート言語：Node.js、Python、Java、Go、Ruby、.NET等',
            '実行時間は最大15分（タイムアウト設定可能）',
            'メモリは128MB〜10GB（CPUはメモリに比例して割り当て）',
            'コードが実行されていない時間は課金なし（コスト効率が高い）',
          ],
        },
        {
          title: 'イベントソース',
          body: 'Lambdaはさまざまなイベントをトリガーとして実行できます。',
          keyPoints: [
            'API Gateway：HTTP APIリクエストをトリガーにRESTful API構築',
            'S3：オブジェクトのアップロード/削除をトリガー',
            'DynamoDB Streams：DB変更をトリガー',
            'SQS：メッセージキューのメッセージをトリガー',
            'CloudWatch Events/EventBridge：スケジュール実行',
          ],
        },
      ],
      quiz: [
        {
          question: 'AWS Lambdaのタイムアウトとメモリについて正しいものはどれですか？',
          options: [
            'タイムアウトは最大1時間、メモリは最大100GB',
            'タイムアウトは最大15分、メモリは最大10GB',
            'タイムアウトは最大5分、メモリは最大1GB',
            'タイムアウトとメモリに制限はない',
          ],
          answer: 1,
          explanation:
            'Lambdaのタイムアウトは最大15分（900秒）、メモリは128MB〜10GBの範囲で設定できます。CPUはメモリに比例して自動割り当てされます。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
    intermediate: {
      overview:
        'Lambdaのコールドスタート対策、Layerの活用、同時実行数制限、VPC統合、環境変数の管理を学びます。',
      sections: [
        {
          title: 'コールドスタートとウォームスタート',
          body: 'Lambdaの初回実行時（コールドスタート）にはコンテナ初期化で遅延が発生します。対策を理解することが重要です。',
          keyPoints: [
            'コールドスタート：初回起動時のコンテナ初期化（数百ms〜数秒）',
            'Provisioned Concurrency：コンテナを事前に準備してコールドスタートを排除',
            'VPC接続はコールドスタートを悪化させる可能性がある',
            'ランタイム選択（軽量なNode.js/Pythonがコールドスタートが短い）',
          ],
        },
      ],
      quiz: [
        {
          question: 'Lambda関数のコールドスタートを排除する最も効果的な方法はどれですか？',
          options: [
            'メモリを増やす',
            'タイムアウトを増やす',
            'Provisioned Concurrencyを設定する',
            'Lambda Layerを使用する',
          ],
          answer: 2,
          explanation:
            'Provisioned Concurrencyを設定することで、Lambdaコンテナを事前に起動・初期化した状態で待機させ、コールドスタートを完全に排除できます。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
    advanced: {
      overview:
        'Lambda@Edge、Destinations、Power Tuning、Step Functions連携など上級トピックを学びます。',
      sections: [
        {
          title: 'Lambda@Edge',
          body: 'CloudFrontのエッジロケーションでLambda関数を実行する機能です。ユーザーに近い場所でコードを実行して低レイテンシーを実現します。',
          keyPoints: [
            'CloudFrontの4つのイベントでトリガー可能（Viewer Request/Response、Origin Request/Response）',
            'us-east-1（バージニア）にのみ関数をデプロイ（自動でグローバル配信）',
            'タイムアウトは最大5秒（Viewer系）または30秒（Origin系）',
            'メモリは最大10GBではなく128MB〜10GB（制限あり）',
          ],
        },
      ],
      quiz: [
        {
          question: 'Lambda@Edgeについて正しくないものはどれですか？',
          options: [
            'CloudFrontのエッジロケーションでコードを実行できる',
            '関数はus-east-1リージョンにデプロイする必要がある',
            'タイムアウトは通常のLambdaと同じ15分',
            'Viewer Requestイベントでリクエストを変更できる',
          ],
          answer: 2,
          explanation:
            'Lambda@EdgeのタイムアウトはViewer系が5秒、Origin系が30秒です。通常のLambdaの15分とは異なります。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
  },
  rds: {
    beginner: {
      overview:
        'RDS（Relational Database Service）はAWSのマネージドリレーショナルデータベースサービスです。パッチ適用やバックアップをAWSが自動管理します。',
      sections: [
        {
          title: 'RDSの特徴',
          body: 'RDSはMySQL、PostgreSQL、MariaDB、Oracle、SQL Server、Auroraをサポートするマネージドサービスです。',
          keyPoints: [
            'OS/DBエンジンのパッチ適用をAWSが管理',
            '自動バックアップ（保存期間：1〜35日）',
            'マルチAZ配置でフェイルオーバーをサポート',
            'インスタンスクラスでCPU/メモリを選択',
          ],
        },
        {
          title: 'Multi-AZとリードレプリカ',
          body: 'RDSの高可用性とスケーリング機能の2つの重要な仕組みです。目的が異なるため混同しないようにしましょう。',
          keyPoints: [
            'Multi-AZ：高可用性目的（フェイルオーバー）、スタンバイはアクティブでない',
            'リードレプリカ：読み取りスケーリング目的、非同期レプリケーション',
            'Multi-AZは同期レプリケーション、リードレプリカは非同期',
            'フェイルオーバーはDNS名が自動的にスタンバイに切り替わる',
          ],
        },
      ],
      quiz: [
        {
          question: 'RDSのMulti-AZとリードレプリカの目的として正しいものはどれですか？',
          options: [
            'Multi-AZは読み取りパフォーマンス向上、リードレプリカは高可用性',
            'Multi-AZは高可用性（フェイルオーバー）、リードレプリカは読み取りスケーリング',
            '両方とも読み取りパフォーマンス向上のため',
            '両方とも高可用性のため',
          ],
          answer: 1,
          explanation:
            'Multi-AZは障害時の自動フェイルオーバーによる高可用性が目的です。リードレプリカは読み取り負荷の分散（スケーリング）が目的で、スタンバイはアクティブに使用されます。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
    intermediate: {
      overview: 'Amazon Auroraの特徴、RDSのバックアップ戦略、パラメータグループ、セキュリティ設定を学びます。',
      sections: [
        {
          title: 'Amazon Aurora',
          body: 'AuroraはAWSがクラウド向けに再設計したMySQLおよびPostgreSQL互換のデータベースエンジンです。',
          keyPoints: [
            'MySQL/PostgreSQL互換で移行が容易',
            '標準RDSより最大5倍（MySQL比）・3倍（PostgreSQL比）高性能',
            'ストレージは自動拡張（10GBから最大128TB）',
            '最大15のリードレプリカ（標準RDSは5まで）',
            '6ウェイレプリケーション（3AZ×2コピー）でデータ耐久性を確保',
          ],
        },
      ],
      quiz: [
        {
          question: 'Amazon Auroraについて正しくないものはどれですか？',
          options: [
            'MySQLとPostgreSQL互換がある',
            'ストレージは自動的に拡張される',
            '最大5つのリードレプリカを持てる',
            '標準RDSより高性能',
          ],
          answer: 2,
          explanation:
            'Auroraは最大15のリードレプリカを持てます（標準RDSは5まで）。また3つのAZにデータが6コピーでレプリケーションされます。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
    advanced: {
      overview:
        'Aurora Serverless、RDS Proxy、Blue/Greenデプロイ、パフォーマンスインサイトなど上級トピックを学びます。',
      sections: [
        {
          title: 'Aurora Serverless',
          body: 'データベースキャパシティを自動的にスケールアップ/ダウンするAuroraの機能です。',
          keyPoints: [
            '使用していない時間は0にスケールダウン（v2は最小0.5 ACU）',
            '予測不能なワークロードや使用頻度の低いアプリに最適',
            'ACU（Aurora Capacity Units）単位でスケーリング',
            'v2はほぼ瞬時のスケーリングが可能',
          ],
        },
        {
          title: 'RDS Proxy',
          body: 'RDSとアプリケーションの間に接続プールを管理するプロキシです。Lambda等からの大量接続を効率化します。',
          keyPoints: [
            '接続プーリングでDB接続数を削減',
            'Lambdaからの接続に特に有効（Lambdaはスケールアウトで多数の接続を生成）',
            'フェイルオーバー時間を短縮',
            'IAM認証とSecretsManagerによる認証情報管理',
          ],
        },
      ],
      quiz: [
        {
          question: 'Lambda関数からRDSへの接続が多すぎてDBが過負荷になる問題を解決するために最適なサービスはどれですか？',
          options: [
            'Multi-AZを有効にする',
            'リードレプリカを追加する',
            'RDS Proxyを使用する',
            'インスタンスクラスをアップグレードする',
          ],
          answer: 2,
          explanation:
            'RDS Proxyはデータベース接続プールを管理し、Lambdaのスケールアウト時に発生する大量の接続をプールすることで、RDSへの接続数を大幅に削減できます。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
  },
  elb: {
    beginner: {
      overview:
        'ELB（Elastic Load Balancing）は受信トラフィックを複数のEC2インスタンスに自動的に分散するサービスです。高可用性とスケーラビリティを実現します。',
      sections: [
        {
          title: 'ELBの種類',
          body: '3種類のロードバランサーがあり、用途に応じて使い分けます。',
          keyPoints: [
            'ALB（Application Load Balancer）：HTTP/HTTPS、L7の高度なルーティング',
            'NLB（Network Load Balancer）：TCP/UDP/TLS、超低レイテンシー、L4',
            'GLB（Gateway Load Balancer）：ネットワーク仮想アプライアンス（ファイアウォール等）向け',
          ],
        },
        {
          title: 'ALBのルーティング',
          body: 'ALBはリクエストの内容に基づいて異なるターゲットグループにルーティングできます。',
          keyPoints: [
            'パスベースルーティング（/api/* → APIサーバー、/images/* → 画像サーバー）',
            'ホストベースルーティング（api.example.com → APIサーバー）',
            'HTTPヘッダー、クエリ文字列、メソッドベースのルーティング',
            'Lambdaをターゲットとして設定可能',
          ],
        },
      ],
      quiz: [
        {
          question: 'パスベースのルーティング（/api と /web で異なるEC2グループに振り分け）を実現するにはどのELBを使用すべきですか？',
          options: [
            'NLB（Network Load Balancer）',
            'ALB（Application Load Balancer）',
            'CLB（Classic Load Balancer）',
            'GLB（Gateway Load Balancer）',
          ],
          answer: 1,
          explanation:
            'ALBはL7（アプリケーション層）で動作し、URLパス、ホスト名、HTTPヘッダーなどに基づく高度なルーティングが可能です。NLBはL4でTCP/UDPのみを扱います。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
    intermediate: {
      overview: 'ELBのヘルスチェック、スティッキーセッション、SSL/TLS終端、クロスゾーン負荷分散を学びます。',
      sections: [
        {
          title: 'ヘルスチェック',
          body: 'ELBは定期的にターゲットのヘルスチェックを実行し、異常なインスタンスへのトラフィックを自動的に停止します。',
          keyPoints: [
            'HTTP/HTTPS/TCPのヘルスチェックをサポート',
            'しきい値（連続成功/失敗回数）でHealthy/Unhealthyを判定',
            'Unhealthyなターゲットにはトラフィックを送らない',
            'Auto Scalingと連携してUnhealthyなインスタンスを自動置換',
          ],
        },
      ],
      quiz: [
        {
          question: 'ALBのスティッキーセッション（セッションの維持）はどのような仕組みですか？',
          options: [
            'ユーザーのIPアドレスで同じインスタンスに振り分ける',
            'Cookieを使用して同じターゲットインスタンスに継続的に振り分ける',
            'DNSレコードを使用して同じインスタンスに振り分ける',
            'セッション情報をELBに保存する',
          ],
          answer: 1,
          explanation:
            'ALBのスティッキーセッションはCookie（AWSALB）を使用して、同一ユーザーのリクエストを同じターゲットに継続的に振り分けます。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
    advanced: {
      overview: 'Connection Draining、デプロイパターン（Blue/Green、Canary）、ELBとGlobal Acceleratorの使い分けを学びます。',
      sections: [
        {
          title: 'Connection Draining（登録解除の遅延）',
          body: 'インスタンスの登録解除時に、既存の接続が完了するまで待機する機能です。',
          keyPoints: [
            'デフォルト300秒（1〜3600秒で設定可能）',
            '0に設定すると即時登録解除',
            'ALBではDeregistration Delayと呼ばれる',
            'ローリングデプロイ時のサービス中断防止に重要',
          ],
        },
      ],
      quiz: [
        {
          question: 'ELBのConnection Drainingが必要な場面はどれですか？',
          options: [
            '新しいインスタンスを追加するとき',
            'インスタンスを登録解除または停止するとき、既存の接続を完了させるため',
            'SSL証明書を更新するとき',
            'ヘルスチェックの間隔を変更するとき',
          ],
          answer: 1,
          explanation:
            'Connection Drainingはインスタンスを登録解除や停止する際、処理中のリクエスト（既存接続）が完了するまで一定時間待機することで、リクエストの中断を防ぎます。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
  },
  cloudfront: {
    beginner: {
      overview:
        'CloudFrontはAWSのCDN（コンテンツ配信ネットワーク）サービスです。世界中のエッジロケーションにコンテンツをキャッシュし、低レイテンシーで配信します。',
      sections: [
        {
          title: 'CloudFrontの仕組み',
          body: 'ユーザーのリクエストは最も近いエッジロケーションで処理されます。キャッシュがあればオリジンサーバーへのアクセスなしに即座に応答します。',
          keyPoints: [
            '400以上のエッジロケーションを世界中に配置',
            'オリジン：S3、ALB、EC2、カスタムHTTPサーバー',
            'TTL（Time To Live）でキャッシュの有効期限を設定',
            '地理的制限（Geo Restriction）で特定国のアクセスをブロック可能',
          ],
        },
        {
          title: 'S3との連携',
          body: 'CloudFront + S3は静的コンテンツ配信の典型的なパターンです。',
          keyPoints: [
            'OAC（Origin Access Control）でS3をプライベートに保ちながらCloudFrontからのみアクセス可能にする',
            'S3の静的Webサイトホスティングとの組み合わせ',
            '署名付きURL/Cookieでプレミアムコンテンツのアクセス制御',
          ],
        },
      ],
      quiz: [
        {
          question: 'CloudFrontのOAC（Origin Access Control）の目的は何ですか？',
          options: [
            'CloudFrontのパフォーマンスを向上させる',
            'S3バケットをプライベートに保ち、CloudFront経由のアクセスのみを許可する',
            'HTTPSを強制する',
            'エッジロケーションの数を増やす',
          ],
          answer: 1,
          explanation:
            'OACはS3バケットをパブリックに公開せず、CloudFrontからのリクエストのみを許可する仕組みです。S3への直接アクセスを防いでセキュリティを高めます。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
    intermediate: {
      overview: 'CloudFrontのキャッシュ動作設定、カスタムエラーページ、WAF統合、HTTPSの強制設定を学びます。',
      sections: [
        {
          title: 'キャッシュ動作',
          body: 'パスパターンごとに異なるキャッシュ動作を設定できます。',
          keyPoints: [
            '/api/* → キャッシュなし（動的コンテンツ）',
            '/images/* → 長期キャッシュ（静的コンテンツ）',
            'Cache-Control、ETag、Last-Modifiedでキャッシュ制御',
            'CloudFront Functionsで軽量なエッジ処理が可能',
          ],
        },
      ],
      quiz: [
        {
          question: 'CloudFrontで動的コンテンツ（APIレスポンス等）をキャッシュさせたくない場合の設定はどれですか？',
          options: [
            'TTLを9999秒に設定する',
            'そのパスのCache BehaviorでTTLを0に設定するかno-cacheを設定する',
            'オリジンをLambdaに変更する',
            'HTTPSを無効にする',
          ],
          answer: 1,
          explanation:
            'キャッシュを無効にするにはTTLを0に設定するか、Cache-Control: no-cacheヘッダーを使用します。また、CloudFrontの「キャッシュポリシー」でCachingDisabledを選択することもできます。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
    advanced: {
      overview: 'CloudFront Functions、Lambda@Edge、フィールドレベル暗号化、リアルタイムログを学びます。',
      sections: [
        {
          title: 'CloudFront Functions vs Lambda@Edge',
          body: '両方ともエッジでコードを実行しますが、用途と性能が異なります。',
          keyPoints: [
            'CloudFront Functions：サブミリ秒レイテンシー、安価、Viewer Request/Responseのみ、JavaScriptのみ',
            'Lambda@Edge：ミリ秒レイテンシー、高機能、4つのイベント、複数言語対応',
            'URLリライト・ヘッダー操作はCloudFront Functions推奨',
            '外部APIコールやDBアクセスはLambda@Edge',
          ],
        },
      ],
      quiz: [
        {
          question: 'URLリダイレクトやヘッダー追加などのシンプルな処理をエッジで行う場合、CloudFront FunctionsとLambda@Edgeのどちらが適切ですか？',
          options: [
            'Lambda@Edge（より高機能のため）',
            'CloudFront Functions（低レイテンシー・低コストのため）',
            '両方同等なので任意でよい',
            'エッジでは処理できないためオリジンで行う',
          ],
          answer: 1,
          explanation:
            'URLリダイレクトやヘッダー操作などシンプルな処理はCloudFront Functionsが最適です。サブミリ秒のレイテンシーでコストも低く、Viewer Request/Responseで実行可能です。',
        },
      ],
      affiliateLinks: AFFILIATE_BOOKS,
    },
  },
}

export function getContent(category: string, difficulty: string): LearningContent | null {
  const cat = CONTENT[category as CategorySlug]
  if (!cat) return null
  return cat[difficulty as Difficulty] ?? null
}
