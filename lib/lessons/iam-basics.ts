import type { Chip, Lesson, Packet } from './types'

const WHO = (v: string): Chip => ({ label: '誰が', value: v })
const ACT = (v: string): Chip => ({ label: '操作', value: v })
const RES = (v: string, tone?: Chip['tone']): Chip => ({ label: '判定', value: v, tone })

// パケットの流れ表に出すリクエスト（送信元は「誰として」、宛先は操作の対象）
const pk = (src: string, dst: string, proto: string, result: string, ok = true): Packet => ({ src, dst, proto, result, ok })
const ALICE = 'alice（IAMユーザー）'
const ROLE = 'app-role（ロール）'
const OBJ = '2026-11.csv'

// 図では分かりやすく、リクエストが IAM（権限の評価）を通って S3 に届く形で描く
const VIA = (from: string) => ({ path: [from, 'iam', 's3'], color: 'req' as const })

export const iamBasicsLesson: Lesson = {
  slug: 'iam-basics',
  category: 'iam',
  lessonLabel: 'レッスン 1',
  title: 'IAMポリシーとロール',
  lead: '「誰が・何を・どのリソースに」できるかを決めるIAM。ポリシーの評価の順番と、EC2にアクセスキーを置かずに済むロールの仕組みを押さえる。',
  description:
    'AWS IAM のユーザー・グループ・ロールとポリシーを、リクエストが流れるアニメーション図解で学ぶ。暗黙の拒否と明示的な拒否、ポリシーの評価の順番、EC2のロールと一時的な認証情報、S3のバケットポリシーまでSAA頻出ポイントを解説。',
  minutes: 13,
  badge: '頻出',

  nodes: [
    { id: 'dev', x: -2.8, y: 1.4, s: 0.5, h: 26, fill: '#f4efe6', label: '開発者', kind: 'person', term: 'iamuser', sub: 'alice' },
    { id: 'iam', x: 1.4, y: 1.4, s: 0.6, h: 38, fill: '#f3b7b0', label: 'IAM', term: 'iam', sub: '権限を評価' },
    { id: 's3', x: 5.4, y: 1.8, s: 0.6, h: 44, fill: '#cfe8b8', label: 'S3', kind: 'cyl', term: 'bucket', sub: 'reports バケット' },
    { id: 'ec2', x: 1.4, y: 4.6, s: 0.6, h: 40, fill: '#f6c191', label: 'EC2', kind: 'server', term: 'ec2', sub: 'ロール：app-role' },
    { id: 'imds', x: 4.4, y: 5.1, s: 0.48, h: 26, fill: '#e9e4da', label: 'IMDS', fontSize: 11, term: 'imds', sub: '169.254.169.254' },
  ],
  zones: [
    { x0: -0.4, y0: -0.2, x1: 6.8, y1: 6.0, fill: 'rgba(255,255,255,.3)', dash: '8 6', label: 'AWSアカウント 111122223333', labelAt: 'top' },
  ],

  steps: [
    {
      short: '全体像', tag: '概要', title: '最初は何もできない（暗黙の拒否）',
      body: [
        '{{iam:IAM}}は、「**誰が**（プリンシパル）・**何を**（アクション）・**どのリソースに**」できるかを決める仕組みです。',
        'AWSへのリクエストは、**許可するポリシーがなければすべて拒否**されます。これを{{implicitdeny:暗黙の拒否}}と呼びます（全権限を持つ{{rootuser:ルートユーザー}}だけは例外）。作ったばかりの{{iamuser:IAMユーザー}} alice は、S3のファイルを1つ読むこともできません。',
      ],
      note: '図では分かりやすく、リクエストが「IAM」を通ってからS3に届く形で描いています。実際には、リクエストを受けたAWSのサービス側で、関係するポリシーがまとめて評価されます。',
      changes: [{ kind: 'add', text: 'IAMユーザー alice を作成（ポリシーはまだなし）' }],
      focus: ['dev', 'iam', 's3'], hide: ['ec2', 'imds'],
      flows: [{ path: ['dev', 'iam'], color: 'atk', fail: true, packet: pk(ALICE, `s3://reports/${OBJ}`, 's3:GetObject', '拒否（許可するポリシーがない＝暗黙の拒否）', false) }],
      callouts: [{ node: 'iam', text: '許可がなければ拒否', tone: '#f3b7b0' }],
      chips: [WHO('alice'), ACT('s3:GetObject'), RES('拒否（暗黙）', 'bad')],
      card: { title: 'alice に付いているポリシー', lines: ['（なし）'] },
    },
    {
      short: 'ポリシー', tag: '基礎', title: 'ポリシーで「許可」を書く',
      body: [
        '権限は、JSONで書いた{{policy:ポリシー}}をユーザーなどに付けて与えます。1つの文（Statement）は、主に **Effect（Allow／Deny）・Action・Resource** の3つでできています。',
        '右のポリシーを alice に付けると、reports バケットのオブジェクトを**読むことだけ**ができるようになります。必要な操作だけを許可するのが{{leastpriv:最小権限の原則}}です。',
      ],
      changes: [{ kind: 'add', text: 'ポリシー ReadReports を alice に付ける' }],
      focus: ['dev', 'iam', 's3'], hide: ['ec2', 'imds'],
      flows: [
        { ...VIA('dev'), packet: pk(ALICE, `s3://reports/${OBJ}`, 's3:GetObject', '許可（ReadReports の Allow）') },
        { path: ['s3', 'iam', 'dev'], color: 'res', delay: 0.45, packet: pk('S3', ALICE, '応答', 'ファイルを返す') },
      ],
      callouts: [{ node: 'iam', text: 'Allow に一致', tone: '#cfe8b8' }],
      chips: [WHO('alice'), ACT('s3:GetObject'), RES('許可', 'good')],
      card: {
        title: 'ポリシー ReadReports',
        lines: ['"Effect": "Allow",', '"Action": "s3:GetObject",', '"Resource": "arn:aws:s3:::reports/*"'],
        highlight: 1,
      },
    },
    {
      short: 'グループ', tag: '基礎', title: 'グループにまとめて付ける',
      body: [
        '同じ仕事をする人が増えたら、1人ずつポリシーを付けるのではなく、{{iamgroup:IAMグループ}}に付けます。グループに付けたポリシーは、**所属するユーザー全員に効きます**。',
        '異動のときも、グループから外すだけで権限が外れます。管理の手間とミスが減ります。',
      ],
      note: 'ルートユーザーは日常の作業には使わず、MFA（多要素認証）を設定して保管しておきます。普段の作業は、権限を絞ったIAMユーザーやロールで行います。',
      changes: [
        { kind: 'add', text: 'グループ developers を作成し、alice と bob を追加' },
        { kind: 'mod', text: 'ReadReports を alice から外し、developers に付ける' },
      ],
      focus: ['dev', 'iam', 's3'], hide: ['ec2', 'imds'],
      flows: [
        { ...VIA('dev'), packet: pk(ALICE, `s3://reports/${OBJ}`, 's3:GetObject', '許可（グループ developers 経由の Allow）') },
        { path: ['s3', 'iam', 'dev'], color: 'res', delay: 0.45, packet: pk('S3', ALICE, '応答', 'ファイルを返す') },
      ],
      callouts: [{ node: 'dev', text: 'developers のメンバー' }],
      chips: [WHO('alice（developers）'), ACT('s3:GetObject'), RES('許可', 'good')],
      card: { title: 'グループ developers', lines: ['メンバー：alice、bob', 'ポリシー：ReadReports'], highlight: 1 },
    },
    {
      short: '明示的な拒否', tag: '基礎', title: '明示的な拒否は、どんな許可よりも強い',
      body: [
        'ポリシーには Deny も書けます。Deny に一致した操作は、**ほかのポリシーで許可されていても必ず拒否**されます。これが{{explicitdeny:明示的な拒否}}です。',
        'AWSはリクエストに関係するポリシーをすべて集めて、次の順番で判定します。',
        {
          list: [
            '**1. 明示的な拒否（Deny）が1つでもある → 拒否**',
            '**2. 許可（Allow）が1つでもある → 許可**',
            '**3. どちらもない → 拒否（暗黙の拒否）**',
          ],
        },
      ],
      changes: [{ kind: 'add', text: 'developers に「s3:DeleteObject を Deny」するポリシーを追加' }],
      focus: ['dev', 'iam', 's3'], hide: ['ec2', 'imds'],
      flows: [
        { ...VIA('dev'), packet: pk(ALICE, `s3://reports/${OBJ}`, 's3:GetObject', '許可（Allow に一致、Deny なし）') },
        { path: ['dev', 'iam'], color: 'atk', fail: true, delay: 0.5, packet: pk(ALICE, `s3://reports/${OBJ}`, 's3:DeleteObject', '拒否（明示的な Deny に一致）', false) },
      ],
      callouts: [{ node: 'iam', text: 'Deny が最優先', tone: '#f3b7b0' }],
      chips: [WHO('alice（developers）'), ACT('s3:DeleteObject'), RES('拒否（明示的）', 'bad')],
      card: { title: '判定の順番', lines: ['1. 明示的な Deny がある → 拒否', '2. Allow がある → 許可', '3. どちらもない → 拒否（暗黙）'], highlight: 0 },
    },
    {
      short: 'ロール', tag: '基礎', title: 'EC2にはアクセスキーではなくロールを付ける',
      body: [
        'EC2で動くアプリからS3を使うとき、IAMユーザーの**アクセスキーをサーバーに置くのは危険**です。漏れると、誰でもその権限を使えてしまいます。',
        '代わりに、{{iamrole:IAMロール}}を作ってEC2に付けます（{{instanceprofile:インスタンスプロファイル}}経由）。アプリはインスタンスの{{imds:メタデータ}}から**{{tempcred:一時的な認証情報}}**を受け取り、それでS3にアクセスします。認証情報はAWSが**自動で入れ替える**ので、キーを管理する必要がありません。',
      ],
      note: 'AWS SDK や AWS CLI は、EC2の上ではメタデータから認証情報を自動で取得します。アプリのコードにキーを書く必要はありません。',
      changes: [
        { kind: 'add', text: 'ロール app-role を作成（信頼する相手：EC2、権限：ReadReports）' },
        { kind: 'mod', text: 'EC2 に app-role を付ける' },
      ],
      focus: ['ec2', 'imds', 'iam', 's3'], hide: ['dev'],
      flows: [
        { path: ['ec2', 'imds'], color: 'req', packet: pk('EC2 のアプリ', '169.254.169.254', 'HTTP（メタデータ）', 'iam/security-credentials/app-role') },
        { path: ['imds', 'ec2'], color: 'res', delay: 0.3, packet: pk('IMDS', 'EC2 のアプリ', '応答', '一時的な認証情報（自動で更新）') },
        { ...VIA('ec2'), delay: 0.6, packet: pk(ROLE, `s3://reports/${OBJ}`, 's3:GetObject', '許可（app-role の Allow）') },
      ],
      callouts: [{ node: 'imds', text: '一時的な認証情報', tone: '#f6e2a4' }],
      chips: [WHO('app-role（EC2）'), ACT('s3:GetObject'), RES('許可', 'good')],
      card: { title: 'ロール app-role', lines: ['信頼ポリシー：ec2.amazonaws.com が使える', '権限ポリシー：ReadReports', 'アクセスキー：なし（一時的な認証情報）'], highlight: 2 },
    },
    {
      short: 'バケットポリシー', tag: 'テクニック', title: 'リソース側に付けるポリシー',
      body: [
        'ここまでのポリシーは、ユーザーやロールに付ける**アイデンティティベースのポリシー**でした。S3のバケットなどには、リソース側にも{{bucketpolicy:バケットポリシー}}（**リソースベースのポリシー**）を付けられます。',
        'リソースベースのポリシーには、**Principal（誰に）**を書きます。同じアカウントの中では、アイデンティティベースとリソースベースの**どちらかで許可されていれば**許可されます。ただし、どちらかに明示的な Deny があれば拒否です。',
      ],
      note: '別のアカウントからのアクセスでは、両方の側で許可が必要になります。',
      changes: [{ kind: 'add', text: 'reports バケットに、app-role の読み取りを許可するバケットポリシーを付ける' }],
      focus: ['ec2', 'iam', 's3'], hide: ['dev'],
      flows: [
        { ...VIA('ec2'), packet: pk(ROLE, `s3://reports/${OBJ}`, 's3:GetObject', '許可（バケットポリシーの Allow）') },
        { path: ['s3', 'iam', 'ec2'], color: 'res', delay: 0.45, packet: pk('S3', ROLE, '応答', 'ファイルを返す') },
      ],
      callouts: [{ node: 's3', text: 'バケット側にもポリシー' }],
      chips: [WHO('app-role（EC2）'), ACT('s3:GetObject'), RES('許可', 'good')],
      card: {
        title: 'reports のバケットポリシー',
        lines: ['"Effect": "Allow",', '"Principal": "…:role/app-role",', '"Action": "s3:GetObject",', '"Resource": "…:reports/*"'],
        highlight: 1,
      },
    },
    {
      short: 'まとめ', tag: '試験対策', title: 'IAMで押さえるポイント',
      body: [
        {
          list: [
            '最初は**すべて拒否**（暗黙の拒否）。必要な操作だけを Allow する（**最小権限**）。',
            '**明示的な Deny は、どんな Allow よりも優先**される。',
            '人の権限は**グループ**にまとめて付ける。ルートユーザーは日常で使わず、MFAを設定する。',
            '「EC2やLambdaからAWSのサービスを使う」→ **IAMロール**。アクセスキーをサーバーやコードに置かない。',
            'S3のバケットポリシーなどの**リソースベースのポリシー**は Principal を書く。別アカウントからの許可にも使う。',
          ],
        },
      ],
      changes: [],
      focus: ['dev', 'ec2', 'imds', 'iam', 's3'],
      flows: [
        { ...VIA('ec2'), packet: pk(ROLE, `s3://reports/${OBJ}`, 's3:GetObject', '許可（ロールの Allow）') },
        { path: ['dev', 'iam'], color: 'atk', fail: true, delay: 0.5, packet: pk(ALICE, `s3://reports/${OBJ}`, 's3:DeleteObject', '拒否（明示的な Deny）', false) },
      ],
      callouts: [{ node: 'iam', text: 'Deny ＞ Allow ＞ 暗黙の拒否', tone: '#f6e2a4' }],
      chips: [WHO('ユーザー・ロール'), ACT('必要なものだけ'), RES('Deny が最優先')],
      card: { title: '要件 → 使うもの', lines: ['人に権限を与える → グループ＋ポリシー', 'EC2・Lambda から使う → IAMロール', '必ず禁止したい → 明示的な Deny', 'バケット側で許可 → バケットポリシー'] },
      quiz: {
        question: 'EC2 上の Web アプリから S3 バケットに画像をアップロードする。認証情報をできるだけ安全に扱いたい。最も適切な方法は？',
        options: [
          'IAMユーザーのアクセスキーを作成し、アプリの設定ファイルに書く',
          'S3 への書き込みを許可した IAMロールを作成し、EC2 インスタンスに付ける',
          'ルートユーザーのアクセスキーを環境変数に設定する',
          'S3 バケットを公開し、誰でも書き込めるようにする',
        ],
        answer: 1,
        explanation: 'EC2 に IAMロールを付けると、アプリはインスタンスのメタデータから一時的な認証情報を受け取り、AWS が自動で入れ替えます。アクセスキーを設定ファイルや環境変数に置くと漏えいの危険があり、ルートユーザーのキーは特に避けるべきです。バケットを誰でも書き込めるようにするのは論外です。',
      },
    },
  ],

  learn: [
    { text: '暗黙の拒否とプリンシパル・アクション・リソース', atStep: 0 },
    { text: 'ポリシーの書き方と最小権限', atStep: 1 },
    { text: 'グループとルートユーザーの扱い', atStep: 2 },
    { text: '明示的な拒否と評価の順番', atStep: 3 },
    { text: 'EC2のロールと一時的な認証情報', atStep: 4 },
    { text: 'バケットポリシー（リソースベース）', atStep: 5 },
  ],
  prev: { title: 'Multi-AZとリードレプリカ', href: '/learn/rds-multiaz' },
  next: { title: 'SQS・SNS・EventBridge', href: '/learn/sqs-sns-eventbridge' },
}
