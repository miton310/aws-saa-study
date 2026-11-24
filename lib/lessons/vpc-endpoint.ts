import type { Chip, Lesson, Packet } from './types'

// パケットの流れ表に出す通信（VPC 内では、評価されるときのプライベートIPで表す）
const pk = (src: string, dst: string, proto: string, result: string, ok = true): Packet => ({ src, dst, proto, result, ok })
const EC2 = '10.0.2.10'
const ENI = '10.0.2.25'

const S3 = (v: string, tone?: Chip['tone']): Chip => ({ label: 'S3への経路', value: v, tone })
const FEE = (v: string, tone?: Chip['tone']): Chip => ({ label: 'NATの料金（S3分）', value: v, tone })
const SQS = (v: string, tone?: Chip['tone']): Chip => ({ label: 'SQSへの経路', value: v, tone })

export const vpcEndpointLesson: Lesson = {
  slug: 'vpc-endpoint',
  category: 'vpc',
  lessonLabel: 'レッスン 4 / 4',
  title: 'VPCエンドポイント',
  lead: 'S3やSQSへの通信を、NATもインターネットも通さずに届ける。2種類のエンドポイントの違いと使い分けを確かめる。',
  description:
    'VPCエンドポイント（ゲートウェイ型・インターフェース型）の違いを、パケットが流れるアニメーション図解で学ぶ。NATゲートウェイの料金削減、PrivateLink、エンドポイントポリシーまでSAA頻出ポイントを解説。',
  minutes: 10,
  badge: '頻出',

  nodes: [
    { id: 's3', x: -2.8, y: 0.9, s: 0.55, h: 40, fill: '#bcd4f0', label: 'S3', kind: 'cyl', term: 's3' },
    { id: 'other', x: -2.8, y: 2.65, s: 0.5, h: 28, fill: '#e9e4da', label: '別のバケット', fontSize: 9.5, kind: 'cyl', term: 's3' },
    { id: 'sqs', x: -2.8, y: 4.4, s: 0.5, h: 26, fill: '#f6c191', label: 'SQS', term: 'sqs' },
    { id: 'igw', x: 0, y: 1.2, s: 0.4, h: 26, fill: '#cfe8b8', label: 'IGW', term: 'igw' },
    { id: 'gwep', x: 0, y: 2.8, s: 0.4, h: 26, fill: '#b9e3dc', label: 'GW EP', fontSize: 10.5, term: 'gwep' },
    { id: 'nat', x: 2.1, y: 1.9, s: 0.5, h: 28, fill: '#f6e2a4', label: 'NAT GW', term: 'nat' },
    { id: 'ec2', x: 5.3, y: 1.8, s: 0.58, h: 40, fill: '#f6c191', label: 'EC2', kind: 'server', term: 'ec2', sub: '10.0.2.10' },
    { id: 'ifep', x: 5.2, y: 4.1, s: 0.4, h: 22, fill: '#d9cdf2', label: 'ENI', fontSize: 11, term: 'ifep', sub: '10.0.2.25' },
  ],
  zones: [
    { x0: -4.0, y0: 0, x1: -1.6, y1: 5.4, fill: 'rgba(233,228,218,.55)', dash: '4 4', label: 'AWSのサービス（VPCの外）', labelAt: 'top' },
    { x0: 0, y0: 0, x1: 7.2, y1: 5.4, fill: 'rgba(255,255,255,.35)', dash: '8 6', label: 'VPC 10.0.0.0/16', labelAt: 'top', term: 'vpc' },
    { x0: 0.5, y0: 0.5, x1: 3.0, y1: 4.9, fill: 'rgba(207,232,184,.45)', label: 'パブリック 10.0.1.0/24', labelAt: 'edge', term: 'public' },
    { x0: 3.6, y0: 0.5, x1: 6.8, y1: 4.9, fill: 'rgba(188,212,240,.45)', label: 'プライベート 10.0.2.0/24', labelAt: 'edge', term: 'private' },
  ],

  steps: [
    {
      short: 'NAT経由', tag: '概要', title: 'S3への通信がNATを通っている',
      body: [
        'プライベートサブネットのEC2から{{s3:S3}}にファイルを保存します。1本目のレッスンの構成では、この通信は{{nat:NATゲートウェイ}}と{{igw:IGW}}を通って、S3のパブリックな窓口に届きます。',
        '問題は**NATゲートウェイのデータ処理料金**です。毎日大量のデータをS3に送ると、そのぶん料金がかさみます。',
      ],
      changes: [{ kind: 'mod', text: 'S3への通信がNATを経由している' }],
      focus: ['ec2', 'nat', 'igw', 's3'], hide: ['gwep', 'ifep', 'sqs', 'other'],
      flows: [
        { path: ['ec2', 'nat', 'igw', 's3'], color: 'out', packet: pk(`${EC2}:51000`, 'S3 の公開アドレス:443', 'TCP 443（HTTPS）', '許可（NAT 経由・データ処理料金あり）') },
        { path: ['s3', 'igw', 'nat', 'ec2'], color: 'res', delay: 0.45, packet: pk('S3:443', `${EC2}:51000`, 'TCP 応答', '許可（NAT 経由）') },
      ],
      callouts: [{ node: 'nat', text: 'データ量に応じて課金', tone: '#f3b7b0' }],
      chips: [S3('NAT → IGW'), FEE('かかる', 'bad'), SQS('—')],
      card: { title: 'プライベートのルートテーブル', lines: ['10.0.0.0/16 → local', '0.0.0.0/0   → nat-0c3d'], highlight: 1 },
    },
    {
      short: 'ゲートウェイ型', tag: 'テクニック', title: 'ゲートウェイ型エンドポイントで近道する',
      body: [
        '{{gwep:ゲートウェイ型VPCエンドポイント}}を作ると、S3への通信がNATを通らずに直接届きます。使えるのは**S3とDynamoDBだけ**で、**追加料金はかかりません**。',
        '作成すると{{rt:ルートテーブル}}に「S3のアドレス範囲（{{prefixlist:プレフィックスリスト}}）→ エンドポイント」のルートが追加されます。0.0.0.0/0 より細かい指定なので、S3宛てはこちらが優先されます。',
      ],
      note: 'ゲートウェイ型エンドポイントは、そのVPCの中からしか使えません。VPNやDirect Connectでつないだオンプレミスや、ピアリング先のVPCからは使えません。',
      changes: [
        { kind: 'add', text: 'S3用のゲートウェイ型エンドポイントを作成' },
        { kind: 'add', text: 'ルートテーブルに pl-s3 → vpce が追加される' },
      ],
      focus: ['ec2', 'gwep', 's3'], hide: ['ifep', 'sqs', 'other'],
      flows: [
        { path: ['ec2', 'gwep', 's3'], color: 'out', packet: pk(`${EC2}:51000`, 'S3:443（pl-s3 に一致）', 'TCP 443（HTTPS）', '許可（vpce 経由・追加料金なし）') },
        { path: ['s3', 'gwep', 'ec2'], color: 'res', delay: 0.45, packet: pk('S3:443', `${EC2}:51000`, 'TCP 応答', '許可（vpce 経由）') },
      ],
      callouts: [{ node: 'gwep', text: 'S3・DynamoDB専用' }],
      chips: [S3('エンドポイント', 'good'), FEE('かからない', 'good'), SQS('—')],
      card: { title: 'プライベートのルートテーブル', lines: ['10.0.0.0/16 → local', '0.0.0.0/0   → nat-0c3d', 'pl-s3       → vpce-0a1b'], highlight: 2 },
    },
    {
      short: 'インターフェース型', tag: 'テクニック', title: 'ほかのサービスはインターフェース型',
      body: [
        '{{sqs:SQS}}など、S3・DynamoDB以外の多くのサービスには{{ifep:インターフェース型VPCエンドポイント}}を使います。仕組みは{{privatelink:PrivateLink}}で、サブネットの中に**プライベートIPを持つ{{eni:ENI}}**が作られます。',
        'EC2はこのENIに向けて通信するので、インターネットもNATも通りません。こちらは**時間料金とデータ処理料金**がかかります。',
      ],
      note: 'プライベートDNSを有効にすると、SQSのいつものURLがこのENIのプライベートIPに解決されます。アプリのコードを書き換える必要はありません。',
      changes: [
        { kind: 'add', text: 'SQS用のインターフェース型エンドポイントを作成' },
        { kind: 'add', text: 'プライベートサブネットにENIが作られる' },
      ],
      focus: ['ec2', 'ifep', 'sqs'], hide: ['other'],
      flows: [
        { path: ['ec2', 'ifep', 'sqs'], color: 'req', packet: pk(`${EC2}:51200`, `${ENI}:443（ENI）`, 'TCP 443（SQS）', '許可（PrivateLink）') },
        { path: ['sqs', 'ifep', 'ec2'], color: 'res', delay: 0.45, packet: pk(`${ENI}:443（ENI）`, `${EC2}:51200`, 'TCP 応答', '許可（PrivateLink）') },
      ],
      callouts: [{ node: 'ifep', text: 'VPC内の窓口' }],
      chips: [S3('エンドポイント', 'good'), FEE('かからない', 'good'), SQS('ENI（PrivateLink）', 'good')],
      card: { title: 'インターフェース型エンドポイント', lines: ['ENI 10.0.2.25（プライベートIP）', 'セキュリティグループを付けられる'], highlight: 0 },
    },
    {
      short: 'ポリシー', tag: 'セキュリティ', title: 'エンドポイントポリシーで行き先を絞る',
      body: [
        'エンドポイントには{{epolicy:エンドポイントポリシー}}を付けられます。「自社のバケットだけ許可」と書けば、このエンドポイント経由では、ほかのバケットにアクセスできません。',
        '内部の人が、社外のバケットへデータを持ち出すのを防げます。反対に、バケット側のポリシーで「このエンドポイント経由のアクセスだけ許可」（aws:SourceVpce）と書けば、バケットへの入口も絞れます。',
      ],
      note: 'エンドポイントポリシーの初期設定は「すべて許可」です。',
      changes: [{ kind: 'add', text: 'エンドポイントポリシーで my-bucket だけを許可' }],
      focus: ['ec2', 'gwep', 's3', 'other'], hide: [],
      flows: [
        { path: ['ec2', 'gwep', 's3'], color: 'out', packet: pk(`${EC2}:51000`, 'my-bucket:443', 'TCP 443（HTTPS）', '許可（エンドポイントポリシーに一致）') },
        { path: ['ec2', 'gwep'], color: 'atk', fail: true, delay: 0.45, packet: pk(`${EC2}:51010`, 'other-bucket:443', 'TCP 443（HTTPS）', '拒否（エンドポイントポリシー）', false) },
      ],
      callouts: [{ node: 'gwep', text: '自社バケットのみ' }],
      chips: [S3('エンドポイント', 'good'), { label: '別のバケットへ', value: '拒否', tone: 'good' }, SQS('ENI（PrivateLink）', 'good')],
      card: { title: 'エンドポイントポリシー（抜粋）', lines: ['"Effect": "Allow"', '"Action": "s3:*"', '"Resource": "arn:aws:s3:::my-bucket/*"'], highlight: 2 },
    },
    {
      short: 'まとめ', tag: '試験対策', title: '2種類のエンドポイントの使い分け',
      body: [
        {
          list: [
            '**ゲートウェイ型**：S3・DynamoDBのみ。ルートテーブルに追加する。無料。VPCの外（オンプレミス・ピアリング先）からは使えない。',
            '**インターフェース型（PrivateLink）**：多くのサービスに対応。サブネットにENI（プライベートIP）ができ、SGを付けられる。時間料金とデータ処理料金がかかる。オンプレミスからも使える。',
            '「NATの料金を下げたい」「S3へインターネットを通らずに」→ まずゲートウェイ型を考える。',
          ],
        },
      ],
      changes: [],
      focus: 'all', hide: ['other'],
      flows: [
        { path: ['ec2', 'gwep', 's3'], color: 'out', packet: pk(`${EC2}:51000`, 'S3:443（pl-s3 に一致）', 'TCP 443（HTTPS）', '許可（vpce 経由）') },
        { path: ['ec2', 'ifep', 'sqs'], color: 'req', delay: 0.5, packet: pk(`${EC2}:51200`, `${ENI}:443（ENI）`, 'TCP 443（SQS）', '許可（PrivateLink）') },
      ],
      callouts: [{ node: 'gwep', text: 'S3はまずこれ', tone: '#f6e2a4' }],
      chips: [S3('エンドポイント', 'good'), FEE('かからない', 'good'), SQS('ENI（PrivateLink）', 'good')],
      card: { title: '選び方', lines: ['S3・DynamoDB → ゲートウェイ型', 'それ以外・オンプレから → インターフェース型'] },
      quiz: {
        question: 'オンプレミスのサーバーから、Direct Connect経由で、インターネットを通らずにAmazon SQSへアクセスしたい。どれを使うべきか？',
        options: [
          'ゲートウェイ型VPCエンドポイント',
          'インターフェース型VPCエンドポイント',
          'NATゲートウェイ',
          'インターネットゲートウェイ',
        ],
        answer: 1,
        explanation: 'ゲートウェイ型はS3とDynamoDB専用で、VPCの外（オンプレミス）からは使えません。インターフェース型はENIのプライベートIPに向けて通信するので、Direct ConnectやVPN経由でも使えます。NATとIGWはインターネットに出るための経路です。',
      },
    },
  ],

  learn: [
    { text: 'NAT経由で起きるコストの問題', atStep: 0 },
    { text: 'ゲートウェイ型の仕組みと制約', atStep: 1 },
    { text: 'インターフェース型とPrivateLink', atStep: 2 },
    { text: 'エンドポイントポリシーで絞る', atStep: 3 },
    { text: '2種類の使い分け', atStep: 4 },
  ],
  prev: { title: 'ピアリングとTransit Gateway', href: '/learn/peering-tgw' },
  next: { title: 'DNSの仕組みとRoute 53', href: '/learn/route53-basics' },
}
