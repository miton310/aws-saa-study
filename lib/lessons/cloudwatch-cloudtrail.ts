import type { Chip, Lesson, Packet } from './types'

const Q = (v: string): Chip => ({ label: '知りたいこと', value: v })
const SVC = (v: string, tone?: Chip['tone']): Chip => ({ label: '使うサービス', value: v, tone })
const KEEP = (v: string, tone?: Chip['tone']): Chip => ({ label: '残る期間', value: v, tone })

// パケットの流れ表に出す、記録や通知のやり取り
const pk = (src: string, dst: string, proto: string, result: string, ok = true): Packet => ({ src, dst, proto, result, ok })
const EC2 = 'EC2（10.0.2.10）'
const ADMIN = 'alice（IAMユーザー）'

export const cloudwatchCloudtrailLesson: Lesson = {
  slug: 'cloudwatch-cloudtrail',
  category: 'monitoring',
  lessonLabel: 'レッスン 1',
  title: 'CloudWatch と CloudTrail',
  lead: '「どう動いているか」は CloudWatch、「だれが何をしたか」は CloudTrail、「設定がどう変わったか」は Config。名前の似た監視サービスを、知りたいことで使い分ける。',
  description:
    'Amazon CloudWatch（メトリクス・アラーム・ログ）、AWS CloudTrail、AWS Config の違いを図解で学ぶ。基本モニタリングと詳細モニタリング、CloudWatch エージェント、アラームの通知、CloudTrail の90日のイベント履歴と証跡、Config ルールまでSAA頻出ポイントを解説。',
  minutes: 12,
  badge: '頻出',

  nodes: [
    { id: 'admin', x: -3.2, y: 0.6, s: 0.5, h: 26, fill: '#f4efe6', label: '管理者', kind: 'person', term: 'iamuser', sub: 'alice' },
    { id: 'ec2', x: 0.4, y: 0.6, s: 0.55, h: 38, fill: '#f6c191', label: 'EC2', kind: 'server', term: 'ec2', sub: '10.0.2.10' },
    { id: 'cw', x: 3.6, y: 0.6, s: 0.62, h: 40, fill: '#cfe8b8', label: 'CloudWatch', fontSize: 9, term: 'cloudwatch', sub: 'メトリクス・ログ' },
    { id: 'sns', x: 6.6, y: 0.6, s: 0.5, h: 30, fill: '#d9cdf2', label: 'SNS', term: 'sns', sub: 'メールで通知' },
    { id: 'ct', x: 0.4, y: 4.0, s: 0.6, h: 36, fill: '#f6e2a4', label: 'CloudTrail', fontSize: 9, term: 'cloudtrail', sub: 'API の記録' },
    { id: 's3', x: 3.6, y: 4.0, s: 0.55, h: 40, fill: '#cfe8b8', label: 'S3', kind: 'cyl', term: 's3', sub: '証跡のログ' },
    { id: 'cfg', x: -3.2, y: 4.0, s: 0.58, h: 34, fill: '#bcd4f0', label: 'Config', fontSize: 11, term: 'awsconfig', sub: '設定の記録' },
  ],
  zones: [],

  steps: [
    {
      short: '全体像', tag: '概要', title: '知りたいことで、使うサービスが変わる',
      body: [
        '監視・記録のサービスは名前が似ていますが、**答えてくれる質問**が違います。',
        {
          list: [
            '**{{cloudwatch:CloudWatch}}**：リソースが**どう動いているか**（CPU使用率、エラーの数、ログ）。',
            '**{{cloudtrail:CloudTrail}}**：**だれが・いつ・どのAPIを呼んだか**（操作の記録）。',
            '**{{awsconfig:AWS Config}}**：リソースの**設定がどう変わったか**、決めたルールに合っているか。',
          ],
        },
      ],
      changes: [],
      focus: ['admin', 'ec2', 'cw', 'ct', 'cfg'],
      flows: [
        { path: ['ec2', 'cw'], color: 'out', packet: pk(EC2, 'CloudWatch', 'メトリクス', 'CPU 使用率 35%') },
        { path: ['admin', 'ct'], color: 'req', delay: 0.35, packet: pk(ADMIN, 'CloudTrail', 'API の記録', 'StopInstances を呼んだ') },
        { path: ['admin', 'cfg'], color: 'req', delay: 0.7, packet: pk('Config', 'セキュリティグループ', '設定の記録', 'ルールが追加された') },
      ],
      callouts: [{ node: 'cw', text: 'どう動いている？' }, { node: 'ct', text: 'だれが何をした？' }],
      chips: [Q('3つの違い'), SVC('CloudWatch / CloudTrail / Config'), KEEP('—')],
      card: { title: '質問 → サービス', lines: ['どう動いている？ → CloudWatch', 'だれが何をした？ → CloudTrail', '設定はどう変わった？ → Config'] },
    },
    {
      short: 'メトリクス', tag: '基礎', title: 'メトリクス：数値で動きを見る',
      body: [
        'EC2 は、CPU使用率やネットワークの量などの{{metric:メトリクス}}を、自動で CloudWatch に送ります。初期設定（**基本モニタリング**）では **5分ごと**、有料の**詳細モニタリング**を有効にすると **1分ごと**になります。',
        'ただし、**メモリの使用率やディスクの空き容量**は、EC2 の外からは見えないので、初期設定では送られません。インスタンスに **{{cwagent:CloudWatch エージェント}}**を入れて送ります。',
      ],
      changes: [
        { kind: 'mod', text: 'EC2 の詳細モニタリングを有効化（1分ごと）' },
        { kind: 'add', text: 'CloudWatch エージェントを入れて、メモリ使用率も送る' },
      ],
      focus: ['ec2', 'cw'],
      flows: [
        { path: ['ec2', 'cw'], color: 'out', packet: pk(EC2, 'CloudWatch', 'メトリクス（標準）', 'CPUUtilization 35%（1分ごと）') },
        { path: ['ec2', 'cw'], color: 'out', delay: 0.45, packet: pk(EC2, 'CloudWatch', 'メトリクス（エージェント）', 'mem_used_percent 72%') },
      ],
      callouts: [{ node: 'ec2', text: 'メモリはエージェントで' }],
      chips: [Q('CPU・メモリの使用率'), SVC('CloudWatch', 'good'), KEEP('最長15か月')],
      card: { title: 'EC2 のメトリクス', lines: ['基本モニタリング：5分ごと（無料）', '詳細モニタリング：1分ごと（有料）', 'メモリ・ディスク：CloudWatch エージェントが必要'], highlight: 2 },
    },
    {
      short: 'アラーム', tag: '基礎', title: 'アラーム：しきい値を超えたら動く',
      body: [
        '{{cwalarm:CloudWatch アラーム}}は、メトリクスが**しきい値を超えた状態が続いたら**、決めた動作をします。',
        {
          list: [
            '**SNS で通知**する（メールや Slack など）。',
            '**Auto Scaling** で台数を増やす・減らす。',
            '**EC2 を停止・終了・再起動・復旧**する。',
          ],
        },
      ],
      changes: [{ kind: 'add', text: 'アラーム：CPU 使用率が 80% を 5分間超えたら SNS で通知' }],
      focus: ['ec2', 'cw', 'sns'],
      flows: [
        { path: ['ec2', 'cw'], color: 'out', packet: pk(EC2, 'CloudWatch', 'メトリクス', 'CPUUtilization 92%（5分続いた）') },
        { path: ['cw', 'sns'], color: 'atk', delay: 0.45, packet: pk('CloudWatch アラーム', 'SNS トピック', 'アラーム状態', '担当者にメールで通知') },
      ],
      callouts: [{ node: 'cw', text: '80% 超え → アラーム', tone: '#f3b7b0' }],
      chips: [Q('異常にすぐ気づきたい'), SVC('CloudWatch アラーム', 'good'), KEEP('—')],
      card: { title: 'アラーム high-cpu', lines: ['条件：CPUUtilization ＞ 80%（5分間）', '動作：SNS トピックに通知'], highlight: 0 },
    },
    {
      short: 'ログ', tag: '基礎', title: 'CloudWatch Logs：ログを集めて調べる',
      body: [
        'EC2 は、アプリのログを初期設定では CloudWatch に送りません。CloudWatch エージェントを入れると、ログファイルを **{{cwlogs:CloudWatch Logs}}** に集められます。Lambda のログは自動で送られます。',
        '集めたログは、**メトリクスフィルター**で「ERROR を含む行の数」などをメトリクスにでき、そこにアラームを付けられます。Logs Insights を使えば、ログを検索・集計することもできます。',
      ],
      changes: [
        { kind: 'add', text: 'エージェントで /var/log/app.log を CloudWatch Logs に送る' },
        { kind: 'add', text: 'メトリクスフィルター：ERROR の行数 → アラーム' },
      ],
      focus: ['ec2', 'cw', 'sns'],
      flows: [
        { path: ['ec2', 'cw'], color: 'out', packet: pk(EC2, 'CloudWatch Logs', 'ログ', 'ERROR: payment failed') },
        { path: ['cw', 'sns'], color: 'atk', delay: 0.45, packet: pk('メトリクスフィルター', 'SNS トピック', 'アラーム状態', 'ERROR が5分で10件を超えた → 通知') },
      ],
      callouts: [{ node: 'cw', text: 'ログからも通知' }],
      chips: [Q('アプリのエラー'), SVC('CloudWatch Logs', 'good'), KEEP('保持期間を設定')],
      card: { title: 'ロググループ /app/web', lines: ['送り元：CloudWatch エージェント', 'メトリクスフィルター：ERROR の行数', 'アラーム：5分で10件を超えたら通知'], highlight: 1 },
    },
    {
      short: 'CloudTrail', tag: '基礎', title: 'CloudTrail：だれが、いつ、何をしたか',
      body: [
        'CloudTrail は、コンソール・CLI・SDK から呼ばれた **API の操作を記録**します。「だれが EC2 を止めたのか」「いつセキュリティグループを変えたのか」を後から調べられます。',
        'アカウントを作った時点で有効になっていて、**過去90日分**の管理イベントは**イベント履歴**で無料で見られます。90日より長く残すには、**証跡（トレイル）**を作って **S3 にログを送ります**。',
      ],
      note: '証跡のログは CloudWatch Logs にも送れます。「ルートユーザーでサインインしたら通知」のような監視ができます。',
      changes: [{ kind: 'add', text: '証跡を作成し、全リージョンの操作を S3 に保存' }],
      focus: ['admin', 'ct', 's3'],
      flows: [
        { path: ['admin', 'ct'], color: 'req', packet: pk(ADMIN, 'CloudTrail', 'API の記録', '2026-11-24 09:12 StopInstances（i-0abc）') },
        { path: ['ct', 's3'], color: 'out', delay: 0.45, packet: pk('CloudTrail（証跡）', 'S3 バケット', 'ログの配信', '90日を超えて保管') },
      ],
      callouts: [{ node: 'ct', text: 'だれが何をした？', tone: '#f6e2a4' }],
      chips: [Q('だれが EC2 を止めた？'), SVC('CloudTrail', 'good'), KEEP('履歴は90日、証跡なら S3 に')],
      card: { title: 'CloudTrail のイベント', lines: ['だれが：alice（IAMユーザー）', 'いつ：2026-11-24 09:12', '何を：StopInstances（i-0abc）'], highlight: 0 },
    },
    {
      short: 'Config', tag: 'テクニック', title: 'Config：設定の変化を記録し、ルールで確かめる',
      body: [
        'AWS Config は、リソースの**設定の変化を記録**し続けます。「このセキュリティグループは、先週どんな設定だったか」を、時系列でさかのぼれます。',
        '**Config ルール**を決めておくと、設定がルールに合っているかを自動で確かめ、違反したリソースを**非準拠**として知らせます。たとえば「SSH（22番）を 0.0.0.0/0 に開けてはいけない」というルールです。',
      ],
      changes: [{ kind: 'add', text: 'Config ルール：22番ポートを全開放しているセキュリティグループを検出' }],
      focus: ['admin', 'cfg'],
      flows: [
        { path: ['admin', 'cfg'], color: 'atk', fail: true, packet: pk('Config', 'sg-web', '設定の変化を記録', '22番を 0.0.0.0/0 に開放 → 非準拠', false) },
      ],
      callouts: [{ node: 'cfg', text: 'ルール違反を検出', tone: '#f3b7b0' }],
      chips: [Q('設定はルールどおり？'), SVC('AWS Config', 'good'), KEEP('設定の履歴')],
      card: { title: 'Config ルールの評価', lines: ['sg-app：準拠', 'sg-web：非準拠（22番が全開放）'], highlight: 1 },
    },
    {
      short: 'まとめ', tag: '試験対策', title: '監視・記録のサービスで押さえるポイント',
      body: [
        {
          list: [
            '**CloudWatch メトリクス**：EC2 は初期設定で5分ごと、詳細モニタリングで1分ごと。**メモリ・ディスクはエージェント**が必要。',
            '**CloudWatch アラーム**：しきい値を超えたら SNS 通知・Auto Scaling・EC2 の操作。',
            '**CloudWatch Logs**：ログを集めて、メトリクスフィルターでアラームにも。',
            '**CloudTrail**：**だれが・いつ・どの API を**。イベント履歴は90日、長く残すなら証跡で S3 へ。',
            '**AWS Config**：**設定の変化の履歴**と、ルールに合っているかの確認。',
          ],
        },
      ],
      changes: [],
      focus: ['admin', 'ec2', 'cw', 'sns', 'ct', 's3', 'cfg'],
      flows: [
        { path: ['ec2', 'cw', 'sns'], color: 'out', packet: pk(EC2, 'CloudWatch', 'メトリクス → アラーム', '異常を通知') },
        { path: ['admin', 'ct', 's3'], color: 'req', delay: 0.4, packet: pk(ADMIN, 'CloudTrail', 'API の記録', '操作を S3 に保管') },
        { path: ['admin', 'cfg'], color: 'req', delay: 0.75, packet: pk('Config', 'リソース', '設定の記録', 'ルールで評価') },
      ],
      callouts: [{ node: 'ct', text: 'だれが？', tone: '#f6e2a4' }],
      chips: [Q('質問で選ぶ'), SVC('3つを使い分け'), KEEP('—')],
      card: { title: '質問 → サービス', lines: ['CPU やエラーの数 → CloudWatch', '異常を通知 → CloudWatch アラーム', 'だれが操作した → CloudTrail', '設定の履歴・ルール違反 → Config'] },
      quiz: {
        question: '本番環境のセキュリティグループが、何者かによって変更されていた。だれが、いつ変更したのかを調べたい。最も適切なサービスは？',
        options: ['Amazon CloudWatch のメトリクス', 'AWS CloudTrail', 'Amazon CloudWatch Logs Insights', 'Amazon Inspector'],
        answer: 1,
        explanation: 'CloudTrail は、だれが・いつ・どの API を呼んだかを記録します。セキュリティグループの変更（AuthorizeSecurityGroupIngress など）も、イベントとして残ります。CloudWatch のメトリクスは性能の数値で、操作した人はわかりません。Logs Insights はログを調べる機能で、CloudTrail のログを CloudWatch Logs に送っていなければ使えません。Inspector は脆弱性の診断サービスです。',
      },
    },
  ],

  learn: [
    { text: '3つのサービスの違い', atStep: 0 },
    { text: 'メトリクスとエージェント', atStep: 1 },
    { text: 'アラームでできること', atStep: 2 },
    { text: 'CloudWatch Logs とメトリクスフィルター', atStep: 3 },
    { text: 'CloudTrail のイベント履歴と証跡', atStep: 4 },
    { text: 'AWS Config とルール', atStep: 5 },
  ],
  prev: { title: 'DynamoDB の基本', href: '/learn/dynamodb-basics' },
  next: { title: 'KMS と暗号化' },
}
