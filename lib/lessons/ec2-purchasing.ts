import type { Chip, Lesson, Packet } from './types'

const BASE = (v: string, tone?: Chip['tone']): Chip => ({ label: '常に動く2台', value: v, tone })
const PEAK = (v: string, tone?: Chip['tone']): Chip => ({ label: 'ピークの追加分', value: v, tone })
const BATCH = (v: string, tone?: Chip['tone']): Chip => ({ label: '夜間バッチ', value: v, tone })

// パケットの流れ表に出す通信（判定の列には、その通信を処理したインスタンスの料金を書く）
const pk = (src: string, dst: string, proto: string, result: string, ok = true): Packet => ({ src, dst, proto, result, ok })
const USER = '198.51.100.7'
const W1 = '10.0.2.10'
const W2 = '10.0.2.11'
const W3 = '10.0.2.12'
const B1 = '10.0.4.10'
const B2 = '10.0.4.11'
const HTTPS = 'TCP 443（HTTPS）'
const WEB = (to: string, ip: string, price: string, delay = 0) => ({
  path: ['user', 'alb', to],
  color: 'req' as const,
  delay,
  packet: pk(USER, `${ip}:443`, HTTPS, price),
})

export const ec2PurchasingLesson: Lesson = {
  slug: 'ec2-purchasing',
  category: 'ec2',
  lessonLabel: 'レッスン 1',
  title: 'EC2の購入オプションの選び方',
  lead: '同じEC2でも、払い方しだいで料金は大きく変わる。「いつも動く分」「ピークの分」「止まってもよい分」に分けて、購入オプションを組み合わせる。',
  description:
    'EC2の購入オプション（オンデマンド、Savings Plans とリザーブドインスタンス、スポットインスタンス、専有ホストと専有インスタンス）を、図解で学ぶ。割引率、スポットの中断、ワークロードごとの組み合わせ方までSAA頻出ポイントを解説。',
  minutes: 12,
  badge: '頻出',

  nodes: [
    { id: 'user', x: -3.6, y: 0.8, s: 0.5, h: 24, fill: '#f4efe6', label: 'ユーザー', kind: 'person', sub: USER },
    { id: 'alb', x: -1.2, y: 0.8, s: 0.58, h: 32, fill: '#bcd4f0', label: 'ALB', term: 'alb' },
    { id: 'w1', x: 1.4, y: 0.8, s: 0.52, h: 36, fill: '#f6c191', label: 'EC2', kind: 'server', term: 'ec2', sub: W1 },
    { id: 'w2', x: 3.3, y: 0.8, s: 0.52, h: 36, fill: '#f6c191', label: 'EC2', kind: 'server', term: 'ec2', sub: W2 },
    { id: 'w3', x: 5.4, y: 0.8, s: 0.52, h: 36, fill: '#f6c191', label: 'EC2', kind: 'server', term: 'ec2', sub: W3 },
    { id: 'jobs', x: -1.2, y: 4.0, s: 0.55, h: 28, fill: '#f6e2a4', label: 'SQS', term: 'sqs', sub: 'ジョブのキュー' },
    { id: 's1', x: 1.6, y: 4.0, s: 0.52, h: 36, fill: '#cfe8b8', label: 'EC2', kind: 'server', term: 'ec2', sub: B1 },
    { id: 's2', x: 3.3, y: 4.0, s: 0.52, h: 36, fill: '#cfe8b8', label: 'EC2', kind: 'server', term: 'ec2', sub: B2 },
    { id: 'dh', x: 7.0, y: 4.5, s: 0.55, h: 38, fill: '#d9cdf2', label: 'EC2', kind: 'server', term: 'ec2', sub: '専有ホスト上' },
  ],
  zones: [
    { x0: 0.6, y0: -0.2, x1: 6.2, y1: 1.8, fill: 'rgba(246,193,145,.22)', dash: '6 5', label: 'Web（Auto Scaling）', labelAt: 'top', term: 'asg' },
    { x0: 0.8, y0: 3.0, x1: 4.1, y1: 5.0, fill: 'rgba(207,232,184,.35)', dash: '6 5', label: '夜間バッチ', labelAt: 'top' },
    { x0: 5.2, y0: 2.6, x1: 8.0, y1: 5.4, fill: 'rgba(217,205,242,.4)', label: '専有ホスト', labelAt: 'top', term: 'dedicatedhost' },
  ],

  steps: [
    {
      short: 'オンデマンド', tag: '概要', title: 'オンデマンド：使った分だけ、定価で払う',
      body: [
        'EC2を何も考えずに起動すると、{{ondemand:オンデマンド}}の料金になります。**契約の期間はなく**、動かした時間だけ払い、いつでも止められます。',
        'いちばん自由ですが、いちばん高い払い方でもあります。このレッスンでは、Webサーバー3台と夜間バッチを例に、**動き方に合わせて払い方を変える**と、どれだけ安くできるかを見ていきます。',
      ],
      changes: [{ kind: 'add', text: 'Web用の EC2 を3台、すべてオンデマンドで起動' }],
      focus: ['user', 'alb', 'w1', 'w2', 'w3'],
      flows: [WEB('w1', W1, 'オンデマンド（定価）'), WEB('w2', W2, 'オンデマンド（定価）', 0.3), WEB('w3', W3, 'オンデマンド（定価）', 0.6)],
      callouts: [{ node: 'w2', text: '全部 定価' }],
      chips: [BASE('オンデマンド'), PEAK('オンデマンド'), BATCH('—')],
      card: { title: 'オンデマンドが向いている場面', lines: ['短期間だけ使う・検証する', '使い方がまだ読めない新しいアプリ', '中断されると困る、一時的な処理'], highlight: 1 },
    },
    {
      short: 'Savings Plans', tag: '基礎', title: 'いつも動く分は、1年か3年の約束で安くする',
      body: [
        '1日中・1年中動いている2台は、使い方がはっきりしています。こうした分は、**1年または3年の利用を約束**する代わりに割引を受けられる、{{savingsplans:Savings Plans}} か{{ri:リザーブドインスタンス}}にします。',
        {
          list: [
            '**Compute Savings Plans**：最大66%引き。インスタンスファミリー・リージョンを変えても、Fargate や Lambda にも効く。',
            '**EC2 Instance Savings Plans**：最大72%引き。1つのリージョンの1つのインスタンスファミリーに約束する。',
            '**リザーブドインスタンス**：最大72%引き。AWSは今は Savings Plans をすすめている。',
          ],
        },
      ],
      note: 'Savings Plans は「1時間あたり何ドル分使う」という金額で約束します。約束した金額を超えた分は、オンデマンドの料金になります。',
      changes: [{ kind: 'add', text: 'Compute Savings Plans を3年で購入（2台分の金額を約束）' }],
      focus: ['user', 'alb', 'w1', 'w2'],
      flows: [WEB('w1', W1, 'Savings Plans の割引価格'), WEB('w2', W2, 'Savings Plans の割引価格', 0.35)],
      callouts: [{ node: 'w1', text: '最大72%引き', tone: '#cfe8b8' }],
      chips: [BASE('Savings Plans', 'good'), PEAK('—'), BATCH('—')],
      card: { title: '割引の目安（オンデマンド比）', lines: ['Compute Savings Plans：最大66%', 'EC2 Instance Savings Plans：最大72%', 'リザーブドインスタンス：最大72%'], highlight: 0 },
    },
    {
      short: 'ピーク', tag: '基礎', title: 'ピークの追加分は、オンデマンドのまま',
      body: [
        'セールの時期などに、{{asg:Auto Scaling}} で3台目が起動します。いつ・どれだけ増えるか分からない分まで約束すると、使わなかった時間も払うことになります。',
        'そこで、**いつも動く分だけを約束し、増えた分はオンデマンド**で払うのが基本の形です。Savings Plans の約束を超えた3台目は、自動でオンデマンドの料金になります。',
      ],
      changes: [{ kind: 'mod', text: 'Auto Scaling：最小2台、最大3台（ピーク時に1台追加）' }],
      focus: ['user', 'alb', 'w1', 'w2', 'w3'],
      flows: [WEB('w1', W1, 'Savings Plans の割引価格'), WEB('w2', W2, 'Savings Plans の割引価格', 0.3), WEB('w3', W3, '約束を超えた分 → オンデマンド', 0.6)],
      callouts: [{ node: 'w3', text: 'ピーク時だけ' }],
      chips: [BASE('Savings Plans', 'good'), PEAK('オンデマンド'), BATCH('—')],
      card: { title: 'Web の払い方', lines: ['1台目・2台目：Savings Plans（約束の範囲内）', '3台目：オンデマンド（約束を超えた分）'], highlight: 1 },
    },
    {
      short: 'スポット', tag: '基礎', title: 'スポット：余っている容量を、最大90%引きで',
      body: [
        '{{spot:スポットインスタンス}}は、AWSで**使われていない容量**を、オンデマンドより**最大90%安く**使える払い方です。約束の期間もありません。',
        'その代わり、AWSがその容量を必要としたときは、**2分前の通知のあとで中断**されます。夜間バッチ・データ分析・CI/CD など、**止まってもやり直せる処理**に向いています。',
      ],
      changes: [
        { kind: 'add', text: 'ジョブ用の SQS キューを作成' },
        { kind: 'add', text: 'バッチ用の EC2 を2台、スポットで起動' },
      ],
      focus: ['jobs', 's1', 's2'],
      flows: [
        { path: ['jobs', 's1'], color: 'out', packet: pk(B1, 'ジョブのキュー', 'ReceiveMessage', 'ジョブ #1 を処理（スポット価格）') },
        { path: ['jobs', 's2'], color: 'out', delay: 0.35, packet: pk(B2, 'ジョブのキュー', 'ReceiveMessage', 'ジョブ #2 を処理（スポット価格）') },
      ],
      callouts: [{ node: 's1', text: '最大90%引き', tone: '#cfe8b8' }],
      chips: [BASE('Savings Plans', 'good'), PEAK('オンデマンド'), BATCH('スポット', 'good')],
      card: { title: 'スポットが向いている処理', lines: ['バッチ処理・データ分析', 'CI/CD のビルド・テスト', '状態を持たない Web サーバー'], highlight: 0 },
    },
    {
      short: '中断', tag: 'テクニック', title: 'スポットは中断される前提で作る',
      body: [
        'スポットインスタンスが中断されるときは、**2分前に通知**が届きます。通知はインスタンスのメタデータと EventBridge で受け取れるので、その間に途中経過を保存（チェックポイント）します。',
        'ジョブを SQS のキューから取る作りにしておけば、処理中に中断されても、ジョブはキューに戻って**ほかのインスタンスがやり直します**（前のレッスンの可視性タイムアウト）。',
      ],
      note: 'データベースのように止まると困るもの、途中から再開できない長い処理には、スポットは向きません。',
      changes: [{ kind: 'mod', text: '中断の通知を受けたら、途中経過を S3 に保存する処理を追加' }],
      focus: ['jobs', 's1', 's2'],
      flows: [
        { path: ['jobs', 's1'], color: 'atk', fail: true, packet: pk(B1, 'ジョブのキュー', 'ReceiveMessage', 'ジョブ #3 の処理中に中断（2分前に通知）', false) },
        { path: ['jobs', 's2'], color: 'out', delay: 0.5, packet: pk(B2, 'ジョブのキュー', 'ReceiveMessage', 'キューに戻ったジョブ #3 をやり直す') },
      ],
      callouts: [
        { node: 's1', text: '2分後に中断', tone: '#f3b7b0' },
        { node: 's2', text: '続きを引き継ぐ' },
      ],
      chips: [BASE('Savings Plans', 'good'), PEAK('オンデマンド'), BATCH('スポット（中断に備える）', 'good')],
      card: { title: '中断への備え', lines: ['2分前の通知を受けて途中経過を保存', 'ジョブはキューから取る（中断されたら戻る）', '複数のインスタンスタイプ・AZ に分散'], highlight: 1 },
    },
    {
      short: '専有', tag: 'テクニック', title: '専有ホストと専有インスタンス',
      body: [
        '通常のEC2は、1台の物理サーバーをほかのAWSアカウントと共有しています。規則やライセンスの都合で、**物理サーバーを自分だけで使いたい**ときの選択肢が2つあります。',
        {
          list: [
            '**{{dedicatedinstance:専有インスタンス}}**：自分のアカウント専用のハードウェアで動く。ただし、どの物理サーバーに置くかは選べない。',
            '**{{dedicatedhost:専有ホスト}}**：物理サーバー1台をまるごと借りる。**ソケット数・コア数が見え**、インスタンスを置くサーバーも指定できるので、**ソケット単位・コア単位のライセンスを持ち込める**（Windows Server、SQL Server など）。',
          ],
        },
        '「既存のソケット単位・コア単位のライセンスを使いたい」と書かれていたら、専有ホストです。',
      ],
      changes: [{ kind: 'add', text: '専有ホストを確保し、ライセンス持ち込みの EC2 を起動' }],
      focus: ['dh'],
      flows: [],
      callouts: [{ node: 'dh', text: 'ソケット・コアが見える' }],
      chips: [BASE('Savings Plans', 'good'), PEAK('オンデマンド'), BATCH('スポット', 'good')],
      card: { title: '専有インスタンス と 専有ホスト', lines: ['物理サーバーを他社と共有しない：どちらも', '置く場所を指定：専有ホストだけ', 'ソケット・コア単位のライセンス：専有ホスト'], highlight: 2 },
    },
    {
      short: 'まとめ', tag: '試験対策', title: '購入オプションで押さえるポイント',
      body: [
        {
          list: [
            '**オンデマンド**：約束なし・定価。短期間・読めない使い方・中断されると困る一時的な処理。',
            '**Savings Plans／リザーブドインスタンス**：1年か3年の約束で最大72%引き。**いつも動いている分**に。',
            '**スポット**：最大90%引き、ただし2分前の通知で中断される。**止まってもやり直せる処理**に。',
            '**専有ホスト**：物理サーバーをまるごと。ソケット・コア単位のライセンスの持ち込み。',
            '組み合わせの基本：**いつもの分は約束、ピークはオンデマンド、やり直せる処理はスポット**。',
          ],
        },
      ],
      changes: [],
      focus: ['user', 'alb', 'w1', 'w2', 'w3', 'jobs', 's1', 's2'],
      flows: [
        WEB('w1', W1, 'Savings Plans'),
        WEB('w3', W3, 'オンデマンド', 0.3),
        { path: ['jobs', 's2'], color: 'out', delay: 0.6, packet: pk(B2, 'ジョブのキュー', 'ReceiveMessage', 'スポット') },
      ],
      callouts: [
        { node: 'w1', text: '約束で割引', tone: '#cfe8b8' },
        { node: 's2', text: 'スポットで格安', tone: '#cfe8b8' },
      ],
      chips: [BASE('Savings Plans', 'good'), PEAK('オンデマンド'), BATCH('スポット', 'good')],
      card: { title: '要件 → 購入オプション', lines: ['1年以上いつも動く → Savings Plans／RI', 'いつ増えるか読めない → オンデマンド', '中断されてもやり直せる → スポット', 'ライセンスの持ち込み → 専有ホスト'] },
      quiz: {
        question: 'Webアプリは1年を通して常に4台が必要で、繁忙期には最大10台まで増える。この状態は今後3年続く見込みである。可用性を保ちつつ、コストを最も抑えられる購入方法は？',
        options: [
          '10台すべてをスポットインスタンスで運用する',
          '10台すべてをオンデマンドインスタンスで運用する',
          '常に必要な4台分を Savings Plans（3年）で約束し、増えた分はオンデマンドで運用する',
          '10台すべてを専有ホストで運用する',
        ],
        answer: 2,
        explanation: 'いつも動いている4台は使い方が読めるので、3年の約束で大きな割引を受けられます。繁忙期の追加分は、いつ・どれだけ必要か読めないので、約束なしのオンデマンドが向いています。すべてスポットにすると、中断されたときに必要な台数を保てない恐れがあります。すべてオンデマンドは割高で、専有ホストはライセンスや規則の要件がない限り不要です。',
      },
    },
  ],

  learn: [
    { text: 'オンデマンドの特徴', atStep: 0 },
    { text: 'Savings Plans とリザーブドインスタンス', atStep: 1 },
    { text: '約束の範囲とオンデマンドの組み合わせ', atStep: 2 },
    { text: 'スポットインスタンスの特徴', atStep: 3 },
    { text: 'スポットの中断への備え', atStep: 4 },
    { text: '専有ホストと専有インスタンス', atStep: 5 },
  ],
  prev: { title: 'SQS・SNS・EventBridge', href: '/learn/sqs-sns-eventbridge' },
  next: { title: 'EBS・EFS・FSx の使い分け', href: '/learn/ebs-efs-fsx' },
}
