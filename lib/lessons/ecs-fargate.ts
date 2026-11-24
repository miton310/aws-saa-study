import type { Chip, Lesson, Packet } from './types'

const RUN = (v: string, tone?: Chip['tone']): Chip => ({ label: '動かす場所', value: v, tone })
const CNT = (v: string, tone?: Chip['tone']): Chip => ({ label: 'タスクの数', value: v, tone })
const SRV = (v: string, tone?: Chip['tone']): Chip => ({ label: 'サーバーの管理', value: v, tone })

// パケットの流れ表に出す通信
const pk = (src: string, dst: string, proto: string, result: string, ok = true): Packet => ({ src, dst, proto, result, ok })
const USER = '198.51.100.7'
const T1 = '10.0.2.21'
const T2 = '10.0.2.22'
const IMG = 'web:1.4（ECR）'
const HTTPS = 'TCP 443（HTTPS）'

export const ecsFargateLesson: Lesson = {
  slug: 'ecs-fargate',
  category: 'containers',
  lessonLabel: 'レッスン 1',
  title: 'ECS と Fargate',
  lead: 'アプリを「コンテナ」に詰めて、決めた数だけ動かし続ける ECS。サーバーを持たない Fargate、タスク定義、サービスとALB、2つのロールまで。',
  description:
    'Amazon ECS と AWS Fargate を、通信が流れるアニメーション図解で学ぶ。コンテナとECR、タスク定義、Fargate と EC2 起動タイプ、サービスとALB、タスクの自動入れ替え、タスクロールとタスク実行ロール、EKS との違いまでSAA頻出ポイントを解説。',
  minutes: 13,
  badge: '頻出',

  nodes: [
    { id: 'user', x: -3.6, y: 1.6, s: 0.5, h: 24, fill: '#f4efe6', label: 'ユーザー', kind: 'person', sub: USER },
    { id: 'alb', x: -0.8, y: 1.6, s: 0.55, h: 32, fill: '#bcd4f0', label: 'ALB', kind: 'lb', term: 'alb' },
    { id: 'task1', x: 2.4, y: 0.7, s: 0.5, h: 34, fill: '#f6c191', label: 'タスク', fontSize: 11, term: 'ecstask', sub: T1 },
    { id: 'task2', x: 2.4, y: 2.6, s: 0.5, h: 34, fill: '#f6c191', label: 'タスク', fontSize: 11, term: 'ecstask', sub: T2 },
    { id: 'ecr', x: 5.8, y: 0.4, s: 0.55, h: 32, fill: '#d9cdf2', label: 'ECR', term: 'ecr', sub: 'イメージ web:1.4' },
    { id: 's3', x: 5.8, y: 3.0, s: 0.55, h: 40, fill: '#cfe8b8', label: 'S3', kind: 'cyl', term: 's3', sub: 'uploads バケット' },
    { id: 'host', x: 1.0, y: 5.4, s: 0.6, h: 40, fill: '#e9e4da', label: 'EC2', kind: 'server', term: 'ec2', sub: 'EC2 起動タイプ' },
  ],
  zones: [
    { x0: 1.5, y0: -0.2, x1: 3.3, y1: 3.5, fill: 'rgba(246,193,145,.22)', dash: '6 5', label: 'サービス web（Fargate）', labelAt: 'top', term: 'ecsservice' },
  ],

  steps: [
    {
      short: '全体像', tag: '概要', title: 'コンテナを、AWS で動かし続ける',
      body: [
        '{{container:コンテナ}}は、アプリと、その動作に必要なライブラリや設定を1つにまとめたものです。手元でも本番でも同じように動きます。コンテナの元になる**イメージ**は、{{ecr:ECR}}（コンテナイメージの置き場所）に保存します。',
        '{{ecs:ECS}}は、イメージからコンテナを起動し、**決めた数を動かし続ける**サービスです。ECS では、一緒に動かすコンテナのまとまりを**タスク**と呼びます。',
      ],
      changes: [
        { kind: 'add', text: 'ECR にイメージ web:1.4 を登録' },
        { kind: 'add', text: 'ECS でタスクを起動' },
      ],
      focus: ['ecr', 'task1'], hide: ['host'],
      flows: [
        { path: ['ecr', 'task1'], color: 'out', packet: pk(IMG, `タスク ${T1}`, 'イメージの取得', 'イメージを取り出してコンテナを起動') },
      ],
      callouts: [{ node: 'ecr', text: 'イメージの置き場所' }],
      chips: [RUN('ECS'), CNT('1'), SRV('—')],
      card: { title: '登場するもの', lines: ['イメージ：コンテナの元（ECR に保存）', 'コンテナ：イメージから起動したもの', 'タスク：一緒に動くコンテナのまとまり'], highlight: 2 },
    },
    {
      short: 'タスク定義', tag: '基礎', title: 'タスク定義：タスクの設計図',
      body: [
        'タスクをどう動かすかは、{{taskdef:タスク定義}}に書きます。使うイメージ、CPU とメモリの量、コンテナのポート、ネットワークの方式、IAM ロールなどです。',
        '同じタスク定義から、**同じ中身のタスクをいくつでも**起動できます。イメージを新しくしたら、タスク定義の新しいリビジョン（版）を作って入れ替えます。',
      ],
      changes: [{ kind: 'add', text: 'タスク定義 web:7 を登録（イメージ web:1.4、0.5 vCPU、1GB）' }],
      focus: ['ecr', 'task1', 'task2'], hide: ['host'],
      flows: [
        { path: ['ecr', 'task1'], color: 'out', packet: pk(IMG, `タスク ${T1}`, 'イメージの取得', 'タスク定義 web:7 から起動') },
        { path: ['ecr', 'task2'], color: 'out', delay: 0.35, packet: pk(IMG, `タスク ${T2}`, 'イメージの取得', '同じタスク定義から2つ目') },
      ],
      callouts: [{ node: 'task2', text: '同じ設計図から' }],
      chips: [RUN('ECS'), CNT('2'), SRV('—')],
      card: { title: 'タスク定義 web:7（抜粋）', lines: ['image：…/web:1.4', 'cpu：512（0.5 vCPU）  memory：1024', 'portMappings：containerPort 8080', 'networkMode：awsvpc'], highlight: 0 },
    },
    {
      short: 'Fargate', tag: '基礎', title: 'Fargate と EC2 起動タイプ',
      body: [
        'タスクを動かす場所は、主に2つから選びます。',
        {
          list: [
            '**{{fargate:Fargate}}**：サーバーを用意しない。タスクごとに必要な CPU・メモリを指定するだけで、**OS のパッチ当てや台数の管理は AWS に任せられる**。',
            '**EC2 起動タイプ**：自分で用意した EC2（コンテナインスタンス）の上でタスクを動かす。インスタンスの管理は必要だが、インスタンスの種類を選べ、リザーブドやスポットで安くできる。',
          ],
        },
        'Fargate のタスクは **awsvpc** というネットワーク方式で動き、**タスクごとに ENI とプライベートIP**を持ちます。セキュリティグループもタスクごとに付けられます。',
      ],
      changes: [{ kind: 'mod', text: '起動タイプ：Fargate（タスクごとに ENI を持つ）' }],
      focus: ['task1', 'task2', 'host'],
      flows: [
        { path: ['alb', 'task1'], color: 'req', packet: pk('ALB', `${T1}:8080`, 'TCP 8080', 'タスクの IP に直接届く') },
        { path: ['alb', 'task2'], color: 'req', delay: 0.35, packet: pk('ALB', `${T2}:8080`, 'TCP 8080', 'タスクごとに別の IP') },
      ],
      callouts: [{ node: 'host', text: '自分で管理する' }],
      chips: [RUN('Fargate', 'good'), CNT('2'), SRV('不要（AWS が管理）', 'good')],
      card: { title: 'Fargate と EC2 起動タイプ', lines: ['サーバーの管理：不要　／　必要', '料金：タスクの CPU・メモリ　／　EC2 の料金', '細かい調整：少ない　／　多い'], highlight: 0 },
    },
    {
      short: 'サービス', tag: '基礎', title: 'サービス：決めた数を動かし続け、ALB につなぐ',
      body: [
        '{{ecsservice:サービス}}を作ると、ECS は**希望するタスク数（desiredCount）**を保つように動かし続けます。ALB を指定すると、起動したタスクは自動で**ターゲットグループに登録**され、リクエストが振り分けられます。',
        'Fargate（awsvpc）のタスクは IP アドレスで登録するので、ターゲットグループの種類は **ip** にします。タスク数は、CPU 使用率などに合わせて自動で増減させることもできます。',
      ],
      changes: [
        { kind: 'add', text: 'サービス web を作成（desiredCount：2）' },
        { kind: 'mod', text: 'ALB のターゲットグループ（種類：ip）に自動で登録' },
      ],
      focus: ['user', 'alb', 'task1', 'task2'], hide: ['host'],
      flows: [
        { path: ['user', 'alb', 'task1'], color: 'req', packet: pk(USER, 'ALB:443', HTTPS, `→ タスク ${T1}`) },
        { path: ['user', 'alb', 'task2'], color: 'req', delay: 0.4, packet: pk(USER, 'ALB:443', HTTPS, `→ タスク ${T2}`) },
      ],
      callouts: [{ node: 'alb', text: 'タスクに振り分け' }],
      chips: [RUN('Fargate', 'good'), CNT('2（希望 2）', 'good'), SRV('不要（AWS が管理）', 'good')],
      card: { title: 'サービス web', lines: ['タスク定義：web:7', '希望するタスク数：2', 'ロードバランサー：ALB（ターゲットの種類 ip）'], highlight: 1 },
    },
    {
      short: '入れ替え', tag: 'テクニック', title: '異常なタスクは、自動で入れ替わる',
      body: [
        'タスクが止まったり、ALB のヘルスチェックに失敗したりすると、サービスは**新しいタスクを起動して入れ替えます**。希望するタスク数を保つためです。',
        '新しいタスクも同じタスク定義から起動するので、ECR からイメージを取り出して、同じ状態で立ち上がります。',
      ],
      changes: [{ kind: 'mod', text: 'タスク 10.0.2.22 がヘルスチェックに失敗 → 新しいタスクに入れ替え' }],
      focus: ['alb', 'task1', 'task2', 'ecr'], hide: ['host'],
      flows: [
        { path: ['alb', 'task2'], color: 'atk', fail: true, packet: pk('ALB', `${T2}:8080/health`, 'ヘルスチェック', '失敗 → 異常と判定', false) },
        { path: ['ecr', 'task2'], color: 'out', delay: 0.45, packet: pk(IMG, 'タスク 10.0.2.23', 'イメージの取得', '新しいタスクを起動して入れ替え') },
        { path: ['alb', 'task1'], color: 'req', delay: 0.8, packet: pk('ALB', `${T1}:8080`, 'TCP 8080', 'その間は正常なタスクに振り分け') },
      ],
      callouts: [{ node: 'task2', text: '入れ替え中', tone: '#f6e2a4' }],
      chips: [RUN('Fargate', 'good'), CNT('1 → 2 に戻す'), SRV('不要（AWS が管理）', 'good')],
      card: { title: 'サービスのイベント', lines: ['タスク 10.0.2.22：ヘルスチェック失敗で停止', 'タスク 10.0.2.23：起動して登録', '実行中 2 ／ 希望 2'], highlight: 1 },
    },
    {
      short: 'ロール', tag: 'テクニック', title: 'タスクロールとタスク実行ロール',
      body: [
        'ECS のタスクには、役目の違う2つの IAM ロールがあります。試験でよく取り違えられます。',
        {
          list: [
            '**{{taskexecrole:タスク実行ロール}}**：ECS（Fargate）が**タスクを起動するため**に使う。ECR からイメージを取り出す、ログを CloudWatch Logs に送る、など。',
            '**{{taskrole:タスクロール}}**：コンテナの中の**アプリのコード**が使う。S3 や DynamoDB など、ほかの AWS サービスを呼ぶときの権限。',
          ],
        },
        'EC2 にロールを付けるのと同じで、アプリにアクセスキーを持たせる必要はありません。',
      ],
      changes: [
        { kind: 'add', text: 'タスク実行ロール：ECR からの取得と CloudWatch Logs への送信を許可' },
        { kind: 'add', text: 'タスクロール：uploads バケットへの s3:PutObject を許可' },
      ],
      focus: ['ecr', 'task1', 's3'], hide: ['host'],
      flows: [
        { path: ['ecr', 'task1'], color: 'out', packet: pk(IMG, `タスク ${T1}`, 'イメージの取得', 'タスク実行ロールの権限で') },
        { path: ['task1', 's3'], color: 'req', delay: 0.45, packet: pk(`アプリ（${T1}）`, 's3://uploads', 'PutObject', 'タスクロールの権限で') },
      ],
      callouts: [
        { node: 'ecr', text: '実行ロール' },
        { node: 's3', text: 'タスクロール', tone: '#cfe8b8' },
      ],
      chips: [RUN('Fargate', 'good'), CNT('2'), SRV('不要（AWS が管理）', 'good')],
      card: { title: 'だれが使うロールか', lines: ['タスク実行ロール：ECS（イメージ取得・ログ送信）', 'タスクロール：アプリのコード（S3 などを呼ぶ）'], highlight: 1 },
    },
    {
      short: 'EKS', tag: '試験対策', title: 'ECS と EKS の違い',
      body: [
        'コンテナを動かすサービスには、ECS のほかに **{{eks:EKS}}**（Kubernetes を AWS で動かすサービス）があります。',
        {
          list: [
            '**ECS**：AWS 独自の仕組み。設定がシンプルで、ほかの AWS サービスと組み合わせやすい。',
            '**EKS**：業界標準の **Kubernetes**。すでに Kubernetes を使っている、ほかのクラウドやオンプレミスと同じ仕組みで動かしたい場合に。',
          ],
        },
        'どちらも、タスク（EKS では Pod）を **Fargate** で動かすこともできます。',
      ],
      changes: [],
      focus: ['alb', 'task1', 'task2'], hide: ['host'],
      flows: [
        { path: ['alb', 'task1'], color: 'req', packet: pk('ALB', `${T1}:8080`, 'TCP 8080', 'ECS のタスク') },
        { path: ['alb', 'task2'], color: 'req', delay: 0.35, packet: pk('ALB', `${T2}:8080`, 'TCP 8080', 'EKS なら Pod') },
      ],
      callouts: [{ node: 'task1', text: 'EKS では Pod' }],
      chips: [RUN('ECS か EKS'), CNT('2'), SRV('Fargate なら不要', 'good')],
      card: { title: 'ECS と EKS', lines: ['ECS：AWS 独自、シンプル', 'EKS：Kubernetes、移植しやすい', 'どちらも Fargate で動かせる'] },
    },
    {
      short: 'まとめ', tag: '試験対策', title: 'ECS と Fargate で押さえるポイント',
      body: [
        {
          list: [
            'イメージは **ECR**、設計図は**タスク定義**、動いているものが**タスク**。',
            '**Fargate**：サーバー管理なし（OS のパッチ当て・台数管理が不要）。**EC2 起動タイプ**：インスタンスを自分で管理。',
            '**サービス**は希望するタスク数を保ち、異常なタスクを入れ替え、ALB に自動で登録する（ターゲットの種類は ip）。',
            'ECR からの取得・ログ送信 → **タスク実行ロール**、アプリから AWS を呼ぶ → **タスクロール**。',
            'Kubernetes を使いたい → **EKS**。',
          ],
        },
      ],
      changes: [],
      focus: ['user', 'alb', 'task1', 'task2', 'ecr', 's3'], hide: ['host'],
      flows: [
        { path: ['user', 'alb', 'task1'], color: 'req', packet: pk(USER, 'ALB:443', HTTPS, `→ タスク ${T1}`) },
        { path: ['user', 'alb', 'task2'], color: 'req', delay: 0.35, packet: pk(USER, 'ALB:443', HTTPS, `→ タスク ${T2}`) },
        { path: ['task1', 's3'], color: 'req', delay: 0.7, packet: pk(`アプリ（${T1}）`, 's3://uploads', 'PutObject', 'タスクロールで') },
      ],
      callouts: [{ node: 'alb', text: 'サービスが数を保つ', tone: '#f6e2a4' }],
      chips: [RUN('Fargate', 'good'), CNT('2（希望 2）', 'good'), SRV('不要（AWS が管理）', 'good')],
      card: { title: '要件 → 使うもの', lines: ['サーバー管理なしでコンテナ → ECS on Fargate', 'インスタンスを選びたい・安くしたい → EC2 起動タイプ', 'アプリから S3 など → タスクロール', 'Kubernetes を使いたい → EKS'] },
      quiz: {
        question: 'コンテナ化した Web アプリを AWS で動かしたい。サーバーの OS のパッチ当てや、台数の管理は行いたくない。また、タスクが異常になったときは自動で入れ替えたい。最も適切な構成は？',
        options: [
          'EC2 インスタンスに Docker を入れ、cron でコンテナを監視する',
          'ECS の EC2 起動タイプでサービスを作り、Auto Scaling グループでインスタンスを管理する',
          'ECS の Fargate でサービスを作り、ALB のターゲットグループに登録する',
          'コンテナイメージを S3 に置き、Lambda から起動する',
        ],
        answer: 2,
        explanation: 'Fargate を使うとサーバーを用意する必要がなく、OS のパッチ当てや台数の管理は AWS に任せられます。ECS のサービスは希望するタスク数を保ち、ヘルスチェックに失敗したタスクを自動で入れ替えます。EC2 起動タイプや EC2 に Docker を入れる方法では、インスタンスの管理が残ります。',
      },
    },
  ],

  learn: [
    { text: 'コンテナ・イメージ・タスク', atStep: 0 },
    { text: 'タスク定義', atStep: 1 },
    { text: 'Fargate と EC2 起動タイプ', atStep: 2 },
    { text: 'サービスと ALB', atStep: 3 },
    { text: 'タスクの自動入れ替え', atStep: 4 },
    { text: 'タスクロールとタスク実行ロール', atStep: 5 },
    { text: 'ECS と EKS の違い', atStep: 6 },
  ],
  prev: { title: 'KMS と暗号化', href: '/learn/kms-encryption' },
  next: { title: 'VPN と Direct Connect' },
}
