// 用語集データ（ツールチップ・用語集ページ共通）
// 本文では {{id}} または {{id:表示文字}} と書くと、ツールチップ付きで表示される。

export interface TermDef {
  name: string
  full?: string
  desc: string
  analogy?: string
}

export const TERMS: Record<string, TermDef> = {
  '3tier': { name: '3層構成', full: '3-tier architecture', desc: 'Webシステムを「入口（Web）」「処理（アプリ）」「データ（DB）」の3段に分ける構成。段ごとに守り方を変えられる。', analogy: '受付・事務室・金庫室' },
  vpc: { name: 'VPC', full: 'Virtual Private Cloud', desc: 'AWSの中に作る、自分専用の仮想ネットワーク。使うIPアドレスの範囲を決めて、その中にサーバーなどを置く。', analogy: '自分専用の敷地' },
  subnet: { name: 'サブネット', full: 'Subnet', desc: 'VPCのIPアドレス範囲を、さらに小さく区切った区画。1つのサブネットは1つのAZの中に作られる。', analogy: '敷地の中の区画' },
  public: { name: 'パブリックサブネット', desc: 'ルートテーブルにIGWへの経路（0.0.0.0/0 → IGW）があるサブネット。インターネットと直接やり取りできる。', analogy: '表通りに面した区画' },
  private: { name: 'プライベートサブネット', desc: 'IGWへの直接の経路がないサブネット。インターネットから直接は届かない。', analogy: '敷地の奥の区画' },
  igw: { name: 'IGW', full: 'Internet Gateway', desc: 'VPCとインターネットをつなぐ出入口。1つのVPCに1つだけ付けられる。', analogy: '敷地の正門' },
  attach: { name: 'アタッチ', full: 'attach', desc: 'AWSの部品同士を「取り付ける・関連付ける」こと。例：IGWをVPCにアタッチする。', analogy: '門を敷地に取り付ける' },
  rt: { name: 'ルートテーブル', full: 'Route Table', desc: '「この宛先への通信は、どこへ送るか」を書いた表。サブネットごとに1つ関連付ける。', analogy: '区画の出口にある道案内の看板' },
  'default-route': { name: '0.0.0.0/0', desc: '「すべての宛先」を表す書き方。ルートテーブルでは、ほかのどの行にも当てはまらない通信の行き先になる。', analogy: '「それ以外は全部こちら」の看板' },
  cidr: { name: 'CIDR表記', full: '例：10.0.0.0/16', desc: 'IPアドレスの範囲を表す書き方。「/」の後ろの数字が小さいほど範囲が広い。/16は65,536個、/24は256個。', analogy: '番地の範囲' },
  alb: { name: 'ALB', full: 'Application Load Balancer', desc: 'HTTP/HTTPSのリクエストを受け取り、後ろにある複数のサーバーに振り分ける。URLのパスなどで振り分け先を変えられる。', analogy: '受付係' },
  tg: { name: 'ターゲットグループ', full: 'Target Group', desc: 'ALBがリクエストを転送する先（EC2など）のまとまり。ヘルスチェックで正常なものだけに送る。', analogy: '受付が案内する担当部署' },
  ec2: { name: 'EC2', full: 'Elastic Compute Cloud', desc: 'AWS上で借りる仮想サーバー。OSを選んで、アプリを動かす。', analogy: '作業部屋のパソコン' },
  rds: { name: 'RDS', full: 'Relational Database Service', desc: 'MySQLやPostgreSQLなどのデータベースを、バックアップやパッチ適用などの運用込みで使えるサービス。', analogy: '管理人つきの書庫' },
  dbsg: { name: 'DBサブネットグループ', desc: 'RDSを置いてよいサブネットの組み合わせ。2つ以上のAZのサブネットを含める必要がある。', analogy: '書庫を建ててよい区画のリスト' },
  multiaz: { name: 'Multi-AZ', desc: '別のAZに待機用のコピー（スタンバイ）を置く構成。障害時は自動で切り替わる。', analogy: '別の建物にある予備の書庫' },
  az: { name: 'AZ', full: 'Availability Zone', desc: 'リージョン（東京など）の中にある、互いに独立したデータセンター群。複数のAZに分けて置くと、1つが止まってもサービスを続けられる。', analogy: '同じ街にある別々の建物' },
  sg: { name: 'セキュリティグループ（SG）', full: 'Security Group', desc: 'EC2やALBなどに付ける仮想のファイアウォール。「許可」のルールだけを書き、通信相手として別のSGを指定できる。', analogy: '各部屋のドアの鍵' },
  nacl: { name: 'NACL', full: 'Network ACL', desc: 'サブネット単位のファイアウォール。許可と拒否の両方を書け、ルールは番号の小さい順に評価される。', analogy: '区画の入口の検問所' },
  stateful: { name: 'ステートフル／ステートレス', desc: 'ステートフルは「行きを許可すれば戻りも自動で許可」（SG）。ステートレスは行きと戻りを別々に許可する必要がある（NACL）。', analogy: '帰りは顔パスか、帰りも検問か' },
  ephemeral: { name: 'エフェメラルポート', full: 'ephemeral port', desc: 'クライアントが通信のたびに一時的に使うポート番号。サーバーからの返事はこのポート宛てに届く。範囲はOSによって異なる。', analogy: '一時的に渡される受付番号札' },
  peering: { name: 'VPCピアリング', full: 'VPC Peering', desc: '2つのVPCを1対1でつなぐ接続。AWSのネットワーク内で通信でき、別アカウント・別リージョンのVPCともつなげる。中継はしない（非推移的）。', analogy: '2つの敷地をつなぐ専用の渡り廊下' },
  tgw: { name: 'Transit Gateway', full: 'AWS Transit Gateway', desc: '多数のVPCやVPN、Direct Connectをまとめてつなぐハブ。アタッチしたネットワーク同士の通信を中継する。', analogy: '路線が集まるターミナル駅' },
  vpn: { name: 'Site-to-Site VPN', desc: 'オンプレミスのネットワークとAWSを、インターネット上の暗号化された通信路でつなぐ接続。', analogy: '公道を走る、鍵付きの専用便' },
  dx: { name: 'Direct Connect', full: 'AWS Direct Connect', desc: 'オンプレミスとAWSを、インターネットを通らない専用線でつなぐサービス。帯域と品質が安定する。', analogy: '自社専用の私道' },
  onprem: { name: 'オンプレミス', full: 'on-premises', desc: '自社のデータセンターやオフィスに置いたサーバー・ネットワーク。クラウドに対して使う言葉。', analogy: '自社ビルのサーバールーム' },
  publicip: { name: 'パブリックIP', desc: 'インターネットから到達できるIPアドレス。これがないサーバーは、インターネット側から宛先に指定できない。', analogy: '外から見える住所' },
  nat: { name: 'NATゲートウェイ', full: 'NAT Gateway', desc: 'プライベートサブネットのサーバーがインターネットへ出ていく通信を中継する。外から始まる通信は通さない。', analogy: '中からしか開けられない勝手口' },
  eip: { name: 'Elastic IP', desc: '固定のパブリックIPv4アドレス。停止や再起動をしても変わらない。', analogy: '変わらない住所' },
  s3: { name: 'S3', full: 'Simple Storage Service', desc: 'ファイルを保存するストレージ。容量はほぼ無制限。', analogy: '巨大な倉庫' },
  dynamodb: { name: 'DynamoDB', desc: 'AWSのNoSQLデータベース。サーバー管理が不要で、大量の読み書きを高速にさばける。', analogy: '仕分け済みの高速ロッカー' },
  gwep: { name: 'ゲートウェイ型VPCエンドポイント', full: 'Gateway Endpoint', desc: 'VPCからS3やDynamoDBへ、インターネットやNATを通らずに接続するための経路。追加料金はかからない。', analogy: '倉庫への専用通路' },
}
