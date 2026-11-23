import type { Chip, Lesson, Packet } from './types'

// パケットの流れ表に出す通信（VPC 内では、評価されるときのプライベートIPで表す）
const pk = (src: string, dst: string, proto: string, result: string, ok = true): Packet => ({ src, dst, proto, result, ok })
const ALB = '10.0.0.20（ALB）'
const A1 = '10.0.1.11'
const A2 = '10.0.1.12'
const C1 = '10.0.3.11'
const C2 = '10.0.3.12'

const N = (v: string, tone?: Chip['tone']): Chip => ({ label: 'EC2の台数', value: v, tone })
const AZ = (v: string, tone?: Chip['tone']): Chip => ({ label: 'AZ', value: v, tone })
const DOWN = (v: string, tone?: Chip['tone']): Chip => ({ label: '1台が止まったら', value: v, tone })

const REQ_ALL = [
  { path: ['user', 'igw', 'alb', 'a1'], color: 'req' as const, packet: pk(ALB, `${A1}:80`, 'TCP 80（HTTP）', '振り分け（AZ-a の1台目）') },
  { path: ['user', 'igw', 'alb', 'c1'], color: 'req' as const, delay: 0.25, packet: pk(ALB, `${C1}:80`, 'TCP 80（HTTP）', '振り分け（AZ-c の1台目）') },
  { path: ['user', 'igw', 'alb', 'a2'], color: 'req' as const, delay: 0.5, packet: pk(ALB, `${A2}:80`, 'TCP 80（HTTP）', '振り分け（自動で追加した台）') },
  { path: ['user', 'igw', 'alb', 'c2'], color: 'req' as const, delay: 0.75, packet: pk(ALB, `${C2}:80`, 'TCP 80（HTTP）', '振り分け（自動で追加した台）') },
]

export const elbAsgLesson: Lesson = {
  slug: 'elb-asg',
  category: 'elb',
  chapter: '07. ELB・負荷分散',
  lessonLabel: 'レッスン 1',
  title: 'ELBとAuto Scaling',
  lead: '1台が止まっても、AZごと止まっても、アクセスが急に増えても動き続ける。可用性の定番構成を、通信を流して組み立てる。',
  description:
    'ELB（ALB）とAuto Scalingで高可用性の構成を作る流れを、パケットが流れるアニメーション図解で学ぶ。ヘルスチェック、マルチAZ、ターゲット追跡スケーリング、ALB・NLB・GWLBの使い分けまでSAA頻出ポイントを解説。',
  minutes: 12,
  badge: '頻出',

  nodes: [
    { id: 'user', x: -2.6, y: 3.0, s: 0.5, h: 22, fill: '#f4efe6', label: 'ユーザー', ip: '198.51.100.7' },
    { id: 'igw', x: 0, y: 3.0, s: 0.4, h: 26, fill: '#cfe8b8', label: 'IGW', term: 'igw' },
    { id: 'alb', x: 2.4, y: 3.0, s: 0.45, sy: 1.2, h: 34, fill: '#bcd4f0', label: 'ALB', term: 'alb', ip: '10.0.0.20' },
    { id: 'a1', x: 5.0, y: 1.1, s: 0.46, h: 36, fill: '#f6c191', label: 'EC2', term: 'ec2', ip: '10.0.1.11' },
    { id: 'a2', x: 7.4, y: 2.4, s: 0.46, h: 36, fill: '#f6c191', label: 'EC2', term: 'ec2', ip: '10.0.1.12' },
    { id: 'c1', x: 5.0, y: 4.85, s: 0.46, h: 36, fill: '#f6c191', label: 'EC2', term: 'ec2', ip: '10.0.3.11' },
    { id: 'c2', x: 7.0, y: 3.95, s: 0.46, h: 36, fill: '#f6c191', label: 'EC2', term: 'ec2', ip: '10.0.3.12' },
  ],
  zones: [
    { x0: 0, y0: 0, x1: 8.5, y1: 6, fill: 'rgba(255,255,255,.35)', dash: '8 6', label: 'VPC 10.0.0.0/16', labelAt: 'top', term: 'vpc' },
    { x0: 3.6, y0: 0.4, x1: 7.9, y1: 2.95, fill: 'rgba(207,232,184,.45)', label: 'AZ-a', labelAt: 'top', term: 'az' },
    { x0: 3.6, y0: 3.35, x1: 7.9, y1: 5.6, fill: 'rgba(188,212,240,.45)', label: 'AZ-c', labelAt: 'top', term: 'az' },
  ],

  steps: [
    {
      short: '1台構成', tag: '概要', title: 'EC2が1台だけの弱点',
      body: [
        'Webサーバーの{{ec2:EC2}}が1台だけの構成です。シンプルですが、**その1台が止まると、サービス全体が止まります**。',
        'OSの更新やハードウェアの故障、アクセスの急増。どれが起きても、ユーザーはページを開けなくなります。この1台のように「そこが止まると全体が止まる場所」を{{spof:単一障害点}}と呼びます。',
      ],
      changes: [{ kind: 'mod', text: 'EC2 1台をインターネットに直接公開している' }],
      focus: ['user', 'igw', 'a1'], hide: ['alb', 'a2', 'c1', 'c2'],
      flows: [{ path: ['user', 'igw', 'a1'], color: 'req', fail: true, packet: pk('198.51.100.7:52344', 'EC2 の公開アドレス:443', 'TCP 443（HTTPS）', '応答なし（唯一の EC2 が停止）', false) }],
      callouts: [{ node: 'a1', text: '止まると全停止', tone: '#f3b7b0' }],
      chips: [N('1台'), AZ('1つ'), DOWN('全停止', 'bad')],
      card: { title: 'いまの構成', lines: ['EC2 1台（パブリックIPで公開）', '障害 ＝ サービス停止'], highlight: 1 },
    },
    {
      short: 'ALB', tag: '基礎', title: 'ALBで複数台に振り分ける',
      body: [
        '{{alb:ALB}}を入口にして、後ろにEC2を2台並べます。ALBはリクエストを2台に振り分けるので、負荷も分散できます。',
        'ALBは{{healthcheck:ヘルスチェック}}で、各EC2が正常に応答するかを定期的に確かめます。**異常と判定したEC2には、リクエストを送りません**。1台が止まっても、残りの1台でサービスが続きます。',
      ],
      changes: [
        { kind: 'add', text: 'ALBを作成し、EC2 2台をターゲットグループに登録' },
        { kind: 'mod', text: 'EC2はALBの後ろに隠す（直接公開しない）' },
      ],
      focus: ['user', 'igw', 'alb', 'a1', 'a2'], hide: ['c1', 'c2'],
      flows: [
        { path: ['user', 'igw', 'alb', 'a1'], color: 'req', packet: pk(ALB, `${A1}:80`, 'TCP 80（HTTP）', '振り分け（healthy）') },
        { path: ['a1', 'alb', 'igw', 'user'], color: 'res', delay: 0.45, packet: pk(`${A1}:80`, ALB, 'TCP 応答', '応答（200 OK）') },
        { path: ['alb', 'a2'], color: 'atk', fail: true, delay: 0.2, packet: pk(ALB, `${A2}:80/health`, 'ヘルスチェック', '失敗 → 振り分け対象から除外', false) },
      ],
      callouts: [{ node: 'a2', text: '異常なので外す', tone: '#f3b7b0' }],
      chips: [N('2台'), AZ('1つ'), DOWN('残りで継続', 'good')],
      card: { title: 'ターゲットグループのヘルスチェック', lines: ['パス：/health', '間隔：30秒', '2台目：unhealthy → 振り分け対象から除外'], highlight: 2 },
    },
    {
      short: 'マルチAZ', tag: 'テクニック', title: '2つのAZに分けて置く',
      body: [
        '2台とも同じ{{az:AZ}}にあると、そのAZ全体に障害が起きたとき、まとめて止まってしまいます。',
        'そこでEC2を**別々のAZに1台ずつ**置きます。ALB自体も複数のAZにまたがって動くので、AZ-aが丸ごと止まっても、AZ-cのEC2でサービスが続きます。',
      ],
      note: 'ALBを作るときは、2つ以上のAZのサブネットを指定する必要があります。ALB自体の冗長化はAWSが行います。',
      changes: [{ kind: 'mod', text: 'EC2をAZ-aとAZ-cに1台ずつ配置' }],
      focus: ['user', 'igw', 'alb', 'a1', 'c1'], hide: ['a2', 'c2'],
      flows: [
        { path: ['user', 'igw', 'alb', 'c1'], color: 'req', packet: pk(ALB, `${C1}:80`, 'TCP 80（HTTP）', '振り分け（AZ-c）') },
        { path: ['c1', 'alb', 'igw', 'user'], color: 'res', delay: 0.45, packet: pk(`${C1}:80`, ALB, 'TCP 応答', '応答（200 OK）') },
        { path: ['alb', 'a1'], color: 'atk', fail: true, delay: 0.2, packet: pk(ALB, `${A1}:80/health`, 'ヘルスチェック', '失敗（AZ-a で障害）', false) },
      ],
      callouts: [{ node: 'a1', text: 'AZ-aで障害', tone: '#f3b7b0' }],
      chips: [N('2台'), AZ('2つ', 'good'), DOWN('AZごと止まっても継続', 'good')],
      card: { title: '配置', lines: ['ALB：AZ-a・AZ-c のサブネット', 'EC2：AZ-aに1台、AZ-cに1台'], highlight: 1 },
    },
    {
      short: 'Auto Scaling', tag: 'テクニック', title: 'Auto Scalingで台数を自動で増減',
      body: [
        '{{asg:Auto Scaling グループ}}にEC2を任せると、負荷に合わせて台数が自動で増減します。よく使うのは{{targettracking:ターゲット追跡スケーリング}}で、「平均CPU使用率を50%に保つ」のように目標を決めるだけです。',
        'アクセスが増えれば台数を増やし、落ち着けば減らします。止まったEC2も自動で新しいものに入れ替わります。',
      ],
      note: 'Auto Scalingのヘルスチェックの種類を「ELB」にすると、ALBのヘルスチェックで異常と判定されたEC2も入れ替え対象になります。初期設定はEC2のステータスチェックだけです。',
      changes: [
        { kind: 'add', text: 'Auto Scaling グループを作成（最小2・最大6）' },
        { kind: 'add', text: 'ターゲット追跡：平均CPU 50%' },
      ],
      focus: 'all', hide: [],
      flows: REQ_ALL,
      callouts: [{ node: 'a2', text: '自動で追加' }],
      chips: [N('2〜6台（自動）', 'good'), AZ('2つ', 'good'), DOWN('自動で入れ替え', 'good')],
      card: { title: 'Auto Scaling グループ', lines: ['最小 2 / 希望 2 / 最大 6', 'ターゲット追跡：平均CPU 50%', 'ヘルスチェック：ELB'], highlight: 1 },
    },
    {
      short: 'LBの種類', tag: '試験対策', title: 'ALB・NLB・GWLBの使い分け',
      body: [
        'ELBには主に3種類あり、試験では「どれを選ぶか」がよく問われます。',
        {
          list: [
            '**{{alb:ALB}}**：HTTP/HTTPSを扱うL7。URLのパスやホスト名で振り分け先を変えられる。Webアプリの定番。',
            '**{{nlb:NLB}}**：TCP/UDPを扱うL4。非常に低い遅延で大量の接続をさばけ、AZごとに固定のIPアドレスを持てる。',
            '**{{gwlb:GWLB}}**：ファイアウォールなどの仮想アプライアンスに、通信をまとめて通すためのもの。',
          ],
        },
      ],
      changes: [],
      focus: 'all', hide: [],
      flows: REQ_ALL.slice(0, 2),
      callouts: [{ node: 'alb', text: 'L7で振り分け' }],
      chips: [N('2〜6台（自動）', 'good'), AZ('2つ', 'good'), DOWN('自動で入れ替え', 'good')],
      card: { title: 'ロードバランサーの種類', lines: ['ALB ：L7（HTTP/HTTPS）', 'NLB ：L4（TCP/UDP）・固定IP', 'GWLB：仮想アプライアンス向け'], highlight: 0 },
    },
    {
      short: 'まとめ', tag: '試験対策', title: '可用性の定番構成',
      body: [
        {
          list: [
            '**ALB＋ヘルスチェック**：異常なEC2に送らない。1台止まっても続く。',
            '**マルチAZ**：EC2を2つ以上のAZに分ける。AZ障害でも続く。',
            '**Auto Scaling**：負荷に合わせて台数を増減し、壊れたEC2を入れ替える。ヘルスチェックの種類は「ELB」に。',
            '「HTTPならALB、TCP/UDP・固定IP・超低遅延ならNLB、仮想アプライアンスならGWLB」。',
          ],
        },
      ],
      changes: [],
      focus: 'all', hide: [],
      flows: [
        ...REQ_ALL,
        { path: ['c1', 'alb', 'igw', 'user'], color: 'res', delay: 0.6, packet: pk(`${C1}:80`, ALB, 'TCP 応答', '応答（200 OK）') },
      ],
      callouts: [{ node: 'alb', text: 'マルチAZ＋ASG', tone: '#f6e2a4' }],
      chips: [N('2〜6台（自動）', 'good'), AZ('2つ', 'good'), DOWN('自動で入れ替え', 'good')],
      card: { title: '完成形', lines: ['ALB × 2AZ', 'Auto Scaling：2〜6台', 'ヘルスチェック：ELB'] },
      quiz: {
        question: 'オンラインゲームのTCP通信を扱う。非常に低い遅延が求められ、さらに取引先のファイアウォールに登録するため、固定のIPアドレスが必要だ。最適なロードバランサーは？',
        options: [
          'Application Load Balancer（ALB）',
          'Network Load Balancer（NLB）',
          'Gateway Load Balancer（GWLB）',
          'Classic Load Balancer（CLB）',
        ],
        answer: 1,
        explanation: 'NLBはL4（TCP/UDP）で動き、遅延が非常に小さく、AZごとに固定IP（Elastic IPも割り当て可能）を持てます。ALBはHTTP/HTTPS向けで、IPアドレスは固定されません。GWLBは仮想アプライアンス向け、CLBは旧世代のロードバランサーです。',
      },
    },
  ],

  learn: [
    { text: '単一障害点という考え方', atStep: 0 },
    { text: 'ALBとヘルスチェック', atStep: 1 },
    { text: 'マルチAZでAZ障害に備える', atStep: 2 },
    { text: 'Auto Scalingとターゲット追跡', atStep: 3 },
    { text: 'ALB・NLB・GWLBの使い分け', atStep: 4 },
  ],
  prev: { title: 'VPCエンドポイント', href: '/learn/vpc-endpoint' },
  next: { title: 'ストレージクラスとライフサイクル' },
}
