import type { Lesson, Packet } from './types'

// パケットの流れ表に出す通信（VPC 内では、評価されるときのプライベートIPで表す）
const pk = (src: string, dst: string, proto: string, result: string, ok = true): Packet => ({ src, dst, proto, result, ok })
const USER = '198.51.100.7:52344'
const ALB = '10.0.1.20'
const EC2 = '10.0.2.10'
const RDS = '10.0.3.10'
const REPO = '192.0.2.80'

const CHIP_IN = (v: string) => ({ label: '入口', value: v })
const CHIP_IP = { label: 'EC2のパブリックIP', value: 'なし', tone: 'good' as const }
const CHIP_OUT_NG = { label: 'EC2→外部', value: '不可', tone: 'bad' as const }
const CHIP_OUT_OK = { label: 'EC2→外部', value: 'NAT経由で可', tone: 'good' as const }

export const vpcNatLesson: Lesson = {
  slug: 'vpc-nat',
  category: 'vpc',
  lessonLabel: 'レッスン 1 / 4',
  title: 'VPCとNATゲートウェイ',
  lead: '入口だけを公開して、アプリとDBは隠す。それでもサーバーから外には出られるようにする。',
  description:
    'ALBだけを公開し、EC2とRDSをプライベートサブネットに隠す3層構成を、パケットが流れるアニメーション図解で学ぶ。NATゲートウェイの役割と試験ポイントも解説。',
  minutes: 12,
  badge: '頻出',

  nodes: [
    { id: 'user', x: -2.6, y: 1.2, s: 0.5, h: 22, fill: '#f4efe6', label: 'ユーザー', sub: '198.51.100.7' },
    { id: 'attacker', x: -2.6, y: 3.4, s: 0.5, h: 22, fill: '#f3b7b0', label: '攻撃者', sub: '203.0.113.9' },
    { id: 'repo', x: -2.6, y: 5.6, s: 0.55, h: 22, fill: '#e9e4da', label: '外部リポジトリ', fontSize: 10.5, sub: '192.0.2.80' },
    { id: 'igw', x: 0, y: 3, s: 0.42, h: 28, fill: '#cfe8b8', label: 'IGW', term: 'igw' },
    { id: 'alb', x: 2.1, y: 1.9, s: 0.6, h: 34, fill: '#bcd4f0', label: 'ALB', term: 'alb', sub: '10.0.1.20' },
    { id: 'nat', x: 2.1, y: 4.2, s: 0.55, h: 30, fill: '#f6e2a4', label: 'NAT GW', term: 'nat' },
    { id: 'ec2', x: 5.6, y: 1.9, s: 0.62, h: 42, fill: '#f6c191', label: 'EC2', term: 'ec2', sub: '10.0.2.10' },
    { id: 'rds', x: 8.6, y: 2.2, s: 0.62, h: 46, fill: '#d9cdf2', label: 'RDS', kind: 'cyl', term: 'rds', sub: '10.0.3.10' },
  ],
  zones: [
    { x0: 0, y0: 0, x1: 10, y1: 6, fill: 'rgba(255,255,255,.35)', dash: '8 6', label: 'VPC 10.0.0.0/16', labelAt: 'top', term: 'vpc' },
    { x0: 0.6, y0: 0.5, x1: 3.6, y1: 5.5, fill: 'rgba(207,232,184,.45)', label: 'パブリック 10.0.1.0/24', labelAt: 'edge', term: 'public' },
    { x0: 4.2, y0: 0.5, x1: 7.0, y1: 5.5, fill: 'rgba(188,212,240,.45)', label: 'プライベート(App) 10.0.2.0/24', labelAt: 'edge', term: 'private' },
    { x0: 7.6, y0: 0.5, x1: 9.6, y1: 5.0, fill: 'rgba(217,205,242,.5)', label: 'プライベート(DB) 10.0.3.0/24', labelAt: 'edge', term: 'private' },
  ],

  steps: [
    {
      short: '全体像', tag: '概要', title: '3層構成をVPCに載せる',
      body: [
        'Webアプリを{{3tier:3層構成}}で{{vpc:VPC}}に載せる、SAAで最頻出の形です。入口の{{alb:ALB}}だけを{{public:パブリックサブネット}}に置き、アプリ（{{ec2:EC2}}）とDB（{{rds:RDS}}）は{{private:プライベートサブネット}}に隠します。',
        'このレッスンでは通信を1本ずつ流しながら、なぜこの配置になるのかを確認します。',
      ],
      changes: [
        { kind: 'add', text: '{{vpc:VPC}} {{cidr:10.0.0.0/16}} を作成' },
        { kind: 'add', text: '用途ごとに{{subnet:サブネット}}を3つに分割' },
      ],
      focus: 'all', flows: [], callouts: [],
      chips: [CHIP_IN('—'), CHIP_IP, CHIP_OUT_NG],
      card: { title: 'サブネット', lines: ['10.0.1.0/24  パブリック', '10.0.2.0/24  プライベート(App)', '10.0.3.0/24  プライベート(DB)'] },
    },
    {
      short: 'IGW', tag: '基礎', title: 'インターネットゲートウェイ',
      body: [
        '{{igw:インターネットゲートウェイ（IGW）}}は、VPCとインターネットをつなぐ出入口です。1つのVPCに{{attach:アタッチ}}できるのは1つだけで、AWS側で冗長化・スケールされるため、可用性を自分で設計する必要はありません。',
      ],
      note: 'サブネットが「パブリック」になるのは、そのサブネットの{{rt:ルートテーブル}}に {{default-route:0.0.0.0/0}} → IGW のルートがあるときです。名前や設定項目で決まるわけではありません。',
      changes: [
        { kind: 'add', text: 'IGWをVPCにアタッチ' },
        { kind: 'add', text: 'パブリックRTに 0.0.0.0/0 → igw' },
      ],
      focus: ['igw', 'user'], flows: [],
      callouts: [{ node: 'igw', text: 'VPCに1つだけ' }],
      chips: [CHIP_IN('IGW'), CHIP_IP, CHIP_OUT_NG],
      card: { title: 'パブリックサブネットのルートテーブル', lines: ['10.0.0.0/16 → local', '0.0.0.0/0  → igw-0a1b'], highlight: 1 },
    },
    {
      short: 'ALB', tag: '基礎', title: '公開する入口はALBだけ',
      body: [
        'ユーザーからのHTTPSリクエストは、{{igw:IGW}}を通って{{alb:ALB}}に届きます。ALBは{{public:パブリックサブネット}}に置き、インターネットに公開する**唯一の入口**にします。',
      ],
      note: 'インターネット向けALBには、2つ以上の{{az:AZ}}のサブネットを指定する必要があります。図では簡略化のため1つだけ描いています。',
      changes: [
        { kind: 'add', text: 'インターネット向けALBを作成' },
        { kind: 'mod', text: '{{sg:sg-alb}}：443 を 0.0.0.0/0 から許可' },
      ],
      focus: ['user', 'igw', 'alb'],
      flows: [{ path: ['user', 'igw', 'alb'], color: 'req', packet: pk(USER, `${ALB}:443`, 'TCP 443（HTTPS）', '許可（sg-alb の 443）') }],
      callouts: [{ node: 'alb', text: 'HTTPS :443' }],
      chips: [CHIP_IN('ALB :443'), CHIP_IP, CHIP_OUT_NG],
      card: { title: 'sg-alb（インバウンド）', lines: ['443/tcp  ← 0.0.0.0/0'], highlight: 0 },
    },
    {
      short: 'EC2', tag: 'テクニック', title: 'EC2はプライベートに置く',
      body: [
        'ALBは受け取ったリクエストを、{{private:プライベートサブネット}}の{{ec2:EC2}}（{{tg:ターゲットグループ}}）に転送します。',
        'EC2の{{sg:セキュリティグループ}}では、IPアドレスではなく**ALBのセキュリティグループ**をソースにして許可します。ALBのIPが変わっても設定を直す必要がありません。',
      ],
      note: 'セキュリティグループは{{stateful:ステートフル}}です。インバウンドで許可した通信の戻り（レスポンス）は、アウトバウンドのルールに関係なく自動で許可されます。',
      changes: [
        { kind: 'add', text: 'sg-app：80 を sg-alb から許可' },
        { kind: 'mod', text: 'ターゲットはプライベートのEC2' },
      ],
      focus: ['user', 'igw', 'alb', 'ec2'],
      flows: [
        { path: ['user', 'igw', 'alb', 'ec2'], color: 'req', packet: pk(`${ALB}:38120（ALB）`, `${EC2}:80`, 'TCP 80（HTTP）', '許可（sg-app：sg-alb から）') },
        { path: ['ec2', 'alb', 'igw', 'user'], color: 'res', delay: 0.45, packet: pk(`${EC2}:80`, `${ALB}:38120（ALB）`, 'TCP 応答', '許可（SG はステートフル）') },
      ],
      callouts: [{ node: 'ec2', text: 'SG：sg-albからのみ' }],
      chips: [CHIP_IN('ALB :443'), CHIP_IP, CHIP_OUT_NG],
      card: { title: 'sg-app（インバウンド）', lines: ['80/tcp  ← sg-alb', '（IPではなくSGを参照）'], highlight: 0 },
    },
    {
      short: 'RDS', tag: 'テクニック', title: 'DBはさらに奥へ',
      body: [
        'EC2はDB専用のプライベートサブネットにある{{rds:RDS}}へ接続します。DB用の{{sg:SG}}では、アプリ層のSGからの3306番だけを許可します。',
        'SGを数珠つなぎにすると、各層に入れる相手を1つの層に絞れます。',
      ],
      note: 'RDSは{{dbsg:DBサブネットグループ}}で2つ以上の{{az:AZ}}のサブネットを指定します。{{multiaz:Multi-AZ}}配置にすると、別のAZにスタンバイが作られます。',
      changes: [
        { kind: 'add', text: 'sg-db：3306 を sg-app から許可' },
        { kind: 'add', text: 'DBサブネットグループを作成' },
      ],
      focus: ['ec2', 'rds', 'alb'],
      flows: [
        { path: ['ec2', 'rds'], color: 'req', packet: pk(`${EC2}:45012`, `${RDS}:3306`, 'TCP 3306（MySQL）', '許可（sg-db：sg-app から）') },
        { path: ['rds', 'ec2'], color: 'res', delay: 0.45, packet: pk(`${RDS}:3306`, `${EC2}:45012`, 'TCP 応答', '許可（SG はステートフル）') },
      ],
      callouts: [{ node: 'rds', text: 'MySQL :3306' }],
      chips: [CHIP_IN('ALB :443'), CHIP_IP, CHIP_OUT_NG],
      card: { title: 'SGのチェーン', lines: ['sg-alb ← 0.0.0.0/0 :443', 'sg-app ← sg-alb   :80', 'sg-db  ← sg-app   :3306'], highlight: 2 },
    },
    {
      short: '攻撃', tag: 'セキュリティ', title: 'EC2に直接は届かない',
      body: [
        '攻撃者がEC2に直接アクセスしようとしても届きません。プライベートサブネットのEC2には{{publicip:パブリックIP}}がなく、インターネット側から宛先として指定する手段がないからです。',
        '仮にルーティングを誤っても、SGが2段目の防御になります。',
      ],
      changes: [{ kind: 'mod', text: '直接アクセスは失敗する' }],
      focus: ['attacker', 'igw', 'ec2'],
      flows: [{ path: ['attacker', 'igw'], color: 'atk', fail: true, packet: pk('203.0.113.9:40112', 'EC2 の公開アドレス（なし）', 'TCP 22（SSH）', '届かない（EC2 にパブリックIPがない）', false) }],
      callouts: [{ node: 'igw', text: 'EC2の宛先がない', tone: '#f3b7b0' }],
      chips: [CHIP_IN('ALB :443'), CHIP_IP, CHIP_OUT_NG],
      card: { title: '防御の層', lines: ['1. ルーティング：パブリックIPなし', '2. SG：sg-albからのみ許可', '3. ALB：公開ポートは443だけ'], highlight: 0 },
    },
    {
      short: 'NAT', tag: 'テクニック', title: 'NATゲートウェイで外へ出る',
      body: [
        '一方で、EC2からOSのアップデートや外部APIを呼びたい場面もあります。そこでパブリックサブネットに{{nat:NATゲートウェイ}}を置き、プライベートサブネットの{{rt:ルートテーブル（RT）}}に 0.0.0.0/0 → NAT を追加します。',
        'EC2から始めた通信の戻りは返ってきますが、**外部から始まる通信は通しません**。',
      ],
      note: 'パブリックNATゲートウェイには{{eip:Elastic IP}}が必要で、NAT自身はパブリックサブネットに置きます。プライベートサブネットに置くと外に出られません。',
      changes: [
        { kind: 'add', text: 'NAT GW＋Elastic IPを作成' },
        { kind: 'add', text: 'プライベートRTに 0.0.0.0/0 → nat' },
      ],
      focus: ['ec2', 'nat', 'igw', 'repo'],
      flows: [
        { path: ['ec2', 'nat', 'igw', 'repo'], color: 'out', packet: pk(`${EC2}:51000`, `${REPO}:443`, 'TCP 443（HTTPS）', '許可（NAT が送信元を EIP に変換）') },
        { path: ['repo', 'igw', 'nat', 'ec2'], color: 'res', delay: 0.45, packet: pk(`${REPO}:443`, `${EC2}:51000`, 'TCP 応答', '許可（NAT が EC2 に戻す）') },
        { path: ['repo', 'igw', 'nat'], color: 'atk', fail: true, delay: 0.2, packet: pk(`${REPO}:50500`, 'NAT の EIP:22', 'TCP 22（SSH）', '拒否（外から始まる通信は通さない）', false) },
      ],
      callouts: [{ node: 'nat', text: '内→外のみ' }],
      chips: [CHIP_IN('ALB :443'), CHIP_IP, CHIP_OUT_OK],
      card: { title: 'プライベート(App)のルートテーブル', lines: ['10.0.0.0/16 → local', '0.0.0.0/0  → nat-0c3d'], highlight: 1 },
    },
    {
      short: 'まとめ', tag: '試験対策', title: '試験で狙われるポイント',
      body: [
        {
          list: [
            '{{nat:NATゲートウェイ}}は**単一{{az:AZ}}のリソース**です。高可用性にするならAZごとにNATを置き、各AZのルートテーブルは同じAZのNATを向けます。',
            '{{s3:S3}}／{{dynamodb:DynamoDB}}への通信は**{{gwep:ゲートウェイ型VPCエンドポイント}}**を使えばNATを通らず、NATのデータ処理料金を削減できます。',
            '{{sg:SG}}は{{stateful:ステートフル}}で許可のみ。{{nacl:NACL}}は{{stateful:ステートレス}}で、拒否ルールも書けます。',
          ],
        },
      ],
      changes: [],
      focus: 'all',
      flows: [
        { path: ['user', 'igw', 'alb', 'ec2', 'rds'], color: 'req', packet: pk(USER, `${ALB}:443`, 'TCP 443（HTTPS）', '許可（ALB → EC2 → RDS）') },
        { path: ['ec2', 'nat', 'igw', 'repo'], color: 'out', delay: 0.5, packet: pk(`${EC2}:51000`, `${REPO}:443`, 'TCP 443（HTTPS）', '許可（NAT 経由）') },
      ],
      callouts: [{ node: 'nat', text: 'AZごとに1つ', tone: '#f6e2a4' }],
      chips: [CHIP_IN('ALB :443'), CHIP_IP, CHIP_OUT_OK],
      card: { title: '完成形', lines: ['公開：ALBだけ', 'App/DB：プライベート', '外向き：NAT GW経由'] },
      quiz: {
        question: 'プライベートサブネットのEC2がS3へ大量のデータを送っており、NATゲートウェイの料金が高い。最もコスト効率よく改善する方法は？',
        options: [
          'NATゲートウェイをNATインスタンスに置き換える',
          'S3用のゲートウェイ型VPCエンドポイントを作成し、ルートテーブルに追加する',
          'EC2をパブリックサブネットに移し、パブリックIPを付与する',
          'NATゲートウェイをAZごとに追加する',
        ],
        answer: 1,
        explanation: 'ゲートウェイ型VPCエンドポイント（S3／DynamoDB）は追加料金なしで使え、S3宛ての通信がNATを経由しなくなります。Cはセキュリティ要件を崩し、Dは可用性対策でありコスト削減にはなりません。',
      },
    },
  ],

  learn: [
    { text: 'IGWとパブリックサブネットの関係', atStep: 1 },
    { text: 'ALBを唯一の公開入口にする理由', atStep: 2 },
    { text: 'SGをSGで参照するチェーン設計', atStep: 4 },
    { text: 'NATゲートウェイの役割と配置', atStep: 6 },
    { text: 'NATのAZ冗長とコスト削減策', atStep: 7 },
  ],
  next: { title: 'SGとNACL', href: '/learn/sg-nacl' },
}
