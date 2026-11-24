import type { Chip, Lesson, Packet } from './types'

const CFG = (v: string, tone?: Chip['tone']): Chip => ({ label: '構成', value: v, tone })
const DOWN = (v: string, tone?: Chip['tone']): Chip => ({ label: '処理側が止まったら', value: v, tone })
const MSG = (v: string, tone?: Chip['tone']): Chip => ({ label: 'メッセージ', value: v, tone })

// パケットの流れ表に出すメッセージのやり取り（送信元・宛先はサービス名で表す）
const pk = (src: string, dst: string, proto: string, result: string, ok = true): Packet => ({ src, dst, proto, result, ok })
const WEB = '注文受付'
const WORKER = '注文処理'
const Q = 'orders キュー'

export const sqsSnsEventBridgeLesson: Lesson = {
  slug: 'sqs-sns-eventbridge',
  category: 'lambda',
  lessonLabel: 'レッスン 1',
  title: 'SQS・SNS・EventBridge',
  lead: '処理を直接つなぐと、片方が止まっただけで全体が止まる。キュー・通知・イベントで間を切り離す「疎結合」の3つの道具を使い分ける。',
  description:
    'Amazon SQS・SNS・EventBridge による疎結合を、メッセージが流れるアニメーション図解で学ぶ。可視性タイムアウト、デッドレターキュー、標準キューとFIFOキュー、SNSのファンアウト、EventBridgeのルールまでSAA頻出ポイントを解説。',
  minutes: 14,
  badge: '頻出',

  nodes: [
    { id: 'web', x: -1.4, y: 2.4, s: 0.58, h: 38, fill: '#f6c191', label: '注文受付', fontSize: 11, kind: 'server', term: 'ec2', sub: 'EC2' },
    { id: 'queue', x: 2.0, y: 2.4, s: 0.62, h: 30, fill: '#f6e2a4', label: 'SQS', term: 'sqs', sub: 'orders キュー' },
    { id: 'worker', x: 5.4, y: 2.4, s: 0.58, h: 38, fill: '#f6c191', label: '注文処理', fontSize: 11, kind: 'server', term: 'ec2', sub: 'EC2' },
    { id: 'dlq', x: 5.4, y: 5.2, s: 0.5, h: 26, fill: '#f3b7b0', label: 'DLQ', term: 'dlq', sub: 'orders-dlq' },
    { id: 'sns', x: 2.0, y: -0.8, s: 0.58, h: 34, fill: '#d9cdf2', label: 'SNS', term: 'sns', sub: '注文トピック' },
    { id: 'eb', x: 2.0, y: -0.8, s: 0.62, h: 34, fill: '#bcd4f0', label: 'EventBridge', fontSize: 9.5, term: 'eventbridge', sub: 'イベントバス' },
    { id: 'mail', x: 5.4, y: -0.8, s: 0.54, h: 34, fill: '#cfe8b8', label: 'Lambda', fontSize: 11, term: 'lambda', sub: 'メール送信' },
  ],
  zones: [],

  steps: [
    {
      short: '密結合', tag: '概要', title: '直接つなぐと、片方が止まれば注文が消える',
      body: [
        '注文受付のサーバーが、注文処理のサーバーを**直接呼び出す**構成を考えます。処理側が混んでいたり止まっていたりすると、受付側も待たされ、最悪の場合は**注文が失われます**。',
        'このように、お互いの状態に強く依存している状態を**密結合**と呼びます。間にキューなどを挟んで依存を切り離すのが{{decoupling:疎結合}}で、SAAでは「処理が追いつかない」「片方が止まっても失いたくない」という問題文のときの定番の答えです。',
      ],
      changes: [{ kind: 'add', text: '注文受付 → 注文処理 を直接呼び出す' }],
      focus: ['web', 'worker'], hide: ['queue', 'dlq', 'sns', 'eb', 'mail'],
      flows: [
        { path: ['web', 'worker'], color: 'req', packet: pk(WEB, WORKER, 'HTTP（直接呼び出し）', '注文 #1001 を処理') },
        { path: ['web', 'worker'], color: 'atk', fail: true, delay: 0.5, packet: pk(WEB, WORKER, 'HTTP（直接呼び出し）', '応答なし → 注文 #1002 が失われる', false) },
      ],
      callouts: [{ node: 'worker', text: '止まると受け取れない', tone: '#f3b7b0' }],
      chips: [CFG('直接呼び出し'), DOWN('注文が失われる', 'bad'), MSG('ためておく場所なし')],
      card: { title: '密結合の問題', lines: ['処理側が遅いと、受付側も待たされる', '処理側が止まると、注文が失われる', '片方だけを増やすことが難しい'], highlight: 1 },
    },
    {
      short: 'SQS', tag: '基礎', title: 'SQS：キューにためて、処理側が取りに行く',
      body: [
        '間に{{sqs:SQS}}のキューを挟みます。受付側は注文をメッセージとして**キューに入れたら終わり**です。処理側は、自分のペースでキューからメッセージを**取りに行き（ポーリング）**、処理が終わったら削除します。',
        '処理側が止まっていても、メッセージは**キューに残ります**（初期設定で4日、最大14日）。また、キューにたまった数を見て処理側の台数を増減させる、という構成もよく使われます。',
      ],
      changes: [
        { kind: 'add', text: 'SQS キュー orders を作成' },
        { kind: 'mod', text: '受付は SendMessage、処理は ReceiveMessage → DeleteMessage' },
      ],
      focus: ['web', 'queue', 'worker'], hide: ['dlq', 'sns', 'eb', 'mail'],
      flows: [
        { path: ['web', 'queue'], color: 'req', packet: pk(WEB, Q, 'SendMessage', '注文 #1002 をキューに入れる') },
        { path: ['queue', 'worker'], color: 'out', delay: 0.45, packet: pk(WORKER, Q, 'ReceiveMessage', '#1002 を取り出して処理') },
        { path: ['worker', 'queue'], color: 'res', delay: 0.8, packet: pk(WORKER, Q, 'DeleteMessage', '処理が終わったので削除') },
      ],
      callouts: [{ node: 'queue', text: '止まっても残る', tone: '#cfe8b8' }],
      chips: [CFG('SQS で疎結合', 'good'), DOWN('キューで待つ', 'good'), MSG('初期4日・最大14日')],
      card: { title: 'キュー orders', lines: ['受付：SendMessage で入れる', '処理：ReceiveMessage で取り出す', '処理後：DeleteMessage で消す'], highlight: 2 },
    },
    {
      short: 'タイムアウト', tag: '基礎', title: '処理中のメッセージは、ほかから見えなくなる',
      body: [
        '処理側がメッセージを受け取ると、メッセージはキューに残ったまま、一定時間ほかの処理側から**見えなくなります**。これが{{visibility:可視性タイムアウト}}です（初期設定は30秒、最大12時間）。',
        'その時間内に削除されなければ、メッセージは**再び見えるようになり**、別の処理側がもう一度処理します。処理が途中で落ちても、メッセージは失われません。',
      ],
      note: '処理に時間がかかるのに可視性タイムアウトが短いと、処理中に同じメッセージがもう一度配られて、二重に処理されます。タイムアウトは処理時間より長めに設定し、同じメッセージを2回処理しても結果が変わらない作り（{{idempotent:冪等}}）にしておきます。',
      changes: [{ kind: 'mod', text: '可視性タイムアウトを、処理にかかる時間より長く設定（例：30秒 → 2分）' }],
      focus: ['queue', 'worker'], hide: ['dlq', 'sns', 'eb', 'mail'],
      flows: [
        { path: ['queue', 'worker'], color: 'out', packet: pk(WORKER, Q, 'ReceiveMessage', '#1003 を受け取る（ほかからは見えなくなる）') },
        { path: ['worker', 'queue'], color: 'atk', fail: true, delay: 0.45, packet: pk(WORKER, Q, 'DeleteMessage', '処理の途中で落ちた → 削除されない', false) },
        { path: ['queue', 'worker'], color: 'out', delay: 0.85, packet: pk(WORKER, Q, 'ReceiveMessage', 'タイムアウト後、#1003 がまた見える → 再処理') },
      ],
      callouts: [{ node: 'queue', text: '30秒は見えない' }],
      chips: [CFG('SQS'), DOWN('時間が来たら再処理', 'good'), MSG('処理中は非表示')],
      card: { title: '可視性タイムアウト', lines: ['初期設定：30秒', '範囲：0秒〜12時間', '時間内に削除しないと、また見える'], highlight: 2 },
    },
    {
      short: 'DLQ', tag: 'テクニック', title: '何度やっても失敗するメッセージは DLQ へ',
      body: [
        'データが壊れているなどの理由で、何度受け取っても処理に失敗するメッセージがあります。放っておくと、キューの中で**失敗と再処理を繰り返し**続けます。',
        '{{dlq:デッドレターキュー（DLQ）}}を設定しておくと、受け取られた回数が**最大受信数（maxReceiveCount）**を超えたメッセージを、自動でDLQに移せます。あとでDLQの中身を調べて、原因を探せます。',
      ],
      note: 'DLQはキューの種類を元のキューに合わせます（標準キューには標準キュー、FIFOキューにはFIFOキュー）。',
      changes: [
        { kind: 'add', text: 'SQS キュー orders-dlq を作成' },
        { kind: 'mod', text: 'orders の再処理ポリシー：最大受信数 3 で orders-dlq へ' },
      ],
      focus: ['queue', 'worker', 'dlq'], hide: ['sns', 'eb', 'mail'],
      flows: [
        { path: ['queue', 'worker'], color: 'atk', fail: true, packet: pk(WORKER, Q, 'ReceiveMessage', '#1004 の処理に失敗（3回目）', false) },
        { path: ['queue', 'dlq'], color: 'out', delay: 0.5, packet: pk(Q, 'orders-dlq', '再処理ポリシー', '最大受信数を超えたので DLQ へ移動') },
      ],
      callouts: [{ node: 'dlq', text: 'あとで原因を調べる', tone: '#f6e2a4' }],
      chips: [CFG('SQS ＋ DLQ', 'good'), DOWN('キューで待つ', 'good'), MSG('失敗は DLQ に隔離')],
      card: { title: 'orders の再処理ポリシー', lines: ['デッドレターキュー：orders-dlq', '最大受信数：3'], highlight: 1 },
    },
    {
      short: 'FIFO', tag: '試験対策', title: '標準キューと FIFO キュー',
      body: [
        'SQSのキューには2種類あります。',
        {
          list: [
            '**標準キュー**：ほぼ無制限の処理量。順番は「できるだけ」守る程度で、同じメッセージが**2回以上届くことがある**（少なくとも1回の配信）。',
            '**{{fifo:FIFOキュー}}**：送った**順番どおり**に届き、**1回だけ処理**される（重複しない）。そのぶん、1秒あたりの処理数に上限がある。キューの名前は **.fifo** で終わる。',
          ],
        },
        '「順番が大事（口座の入出金など）」「重複させたくない」と書かれていたら FIFO キューです。',
      ],
      changes: [{ kind: 'add', text: 'FIFO キュー payments.fifo を作成（順番が大事な処理用）' }],
      focus: ['web', 'queue', 'worker'], hide: ['dlq', 'sns', 'eb', 'mail'],
      flows: [
        { path: ['web', 'queue'], color: 'req', packet: pk(WEB, 'payments.fifo', 'SendMessage', '①入金 → ②出金 の順に送る') },
        { path: ['queue', 'worker'], color: 'out', delay: 0.5, packet: pk(WORKER, 'payments.fifo', 'ReceiveMessage', '①入金 → ②出金 の順で、1回だけ処理') },
      ],
      callouts: [{ node: 'queue', text: '順番どおり・重複なし' }],
      chips: [CFG('FIFO キュー'), DOWN('キューで待つ', 'good'), MSG('順番どおり', 'good')],
      card: { title: '標準 と FIFO', lines: ['順番　：できるだけ　／　厳密に守る', '重複　：ありうる　　／　なし', '処理量：ほぼ無制限　／　上限あり'] },
    },
    {
      short: 'SNS', tag: '基礎', title: 'SNS：1つのメッセージを、複数の宛先に配る',
      body: [
        '注文が入ったら、「注文処理」と「確認メールの送信」の**両方**を動かしたいとします。{{sns:SNS}}のトピックにメッセージを1回送ると、トピックを**購読している全員**に同時に配られます。',
        'SQSが「取りに来てもらう（プル型）」なのに対して、SNSは「こちらから配る（プッシュ型）」です。SNSから**複数のSQSキューに配る**構成を{{fanout:ファンアウト}}と呼び、宛先ごとに独立して、確実に処理できます。',
      ],
      changes: [
        { kind: 'add', text: 'SNS トピック「注文」を作成' },
        { kind: 'add', text: '購読：orders キュー、メール送信の Lambda' },
      ],
      focus: ['web', 'sns', 'queue', 'worker', 'mail'], hide: ['dlq', 'eb'],
      flows: [
        { path: ['web', 'sns'], color: 'req', packet: pk(WEB, '注文トピック', 'Publish', '注文 #1005 を1回だけ送る') },
        { path: ['sns', 'queue', 'worker'], color: 'out', delay: 0.4, packet: pk('注文トピック', Q, '配信', 'キュー経由で注文処理へ') },
        { path: ['sns', 'mail'], color: 'out', delay: 0.4, packet: pk('注文トピック', 'メール送信', '配信', '確認メールを送る') },
      ],
      callouts: [{ node: 'sns', text: '全員に配る', tone: '#f6e2a4' }],
      chips: [CFG('SNS → 複数の宛先', 'good'), DOWN('キューで待つ', 'good'), MSG('1回送れば全員に')],
      card: { title: 'トピック「注文」の購読', lines: ['SQS：orders キュー', 'Lambda：メール送信'], highlight: 0 },
    },
    {
      short: 'EventBridge', tag: 'テクニック', title: 'EventBridge：ルールに合ったイベントだけを届ける',
      body: [
        '{{eventbridge:EventBridge}}は、イベントを受け取って、**ルール（イベントパターン）に一致したものだけ**をターゲットに届けるサービスです。1つのルールには最大5つのターゲットを指定できます。',
        '自分のアプリのイベントだけでなく、**AWSのサービスのイベント**（EC2の状態の変化など）や、SaaSのイベントも受け取れます。「毎日9時に実行」のような**スケジュール**の起点にも使えます。',
      ],
      note: 'SNSは「購読者全員に配る」、EventBridgeは「中身を見て、条件に合うものだけを振り分ける」と覚えると区別しやすくなります（SNSにも購読ごとのフィルターはあります）。',
      changes: [
        { kind: 'add', text: 'ルール：金額が10万円以上の注文イベント' },
        { kind: 'mod', text: 'ターゲット：確認メールの Lambda（高額注文だけ担当者にも通知）' },
      ],
      focus: ['web', 'eb', 'mail'], hide: ['sns', 'dlq'],
      flows: [
        { path: ['web', 'eb'], color: 'req', packet: pk(WEB, 'イベントバス', 'PutEvents', '注文 #1006（金額 12万円）') },
        { path: ['eb', 'mail'], color: 'out', delay: 0.4, packet: pk('イベントバス', 'メール送信', 'ルールに一致', '高額注文として通知') },
        { path: ['web', 'eb'], color: 'req', delay: 0.75, packet: pk(WEB, 'イベントバス', 'PutEvents', '注文 #1007（金額 3千円）→ ルールに不一致で送らない', false) },
      ],
      callouts: [{ node: 'eb', text: '条件に合うものだけ', tone: '#f6e2a4' }],
      chips: [CFG('EventBridge のルール'), DOWN('—'), MSG('パターンで振り分け', 'good')],
      card: { title: 'ルールのイベントパターン', lines: ['"source": ["shop.orders"],', '"detail": { "amount": [{ "numeric": [">=", 100000] }] }'], highlight: 1 },
    },
    {
      short: 'まとめ', tag: '試験対策', title: '疎結合で押さえるポイント',
      body: [
        {
          list: [
            '「処理が追いつかない」「止まっても失いたくない」→ **SQS** でためて、処理側が取りに行く。',
            '**可視性タイムアウト**（初期30秒・最大12時間）は処理時間より長く。二重処理に備えて冪等に作る。',
            '何度も失敗するメッセージ → **DLQ**（最大受信数を超えたら移す）。',
            '「順番どおり・重複なし」→ **FIFO キュー**。それ以外は標準キュー。',
            '「1つのメッセージを複数の宛先へ」→ **SNS**（SNS＋複数のSQSで**ファンアウト**）。',
            '「条件で振り分け」「AWSのサービスのイベント」「スケジュール」→ **EventBridge**。',
          ],
        },
      ],
      changes: [],
      focus: ['web', 'sns', 'queue', 'worker', 'dlq', 'mail'], hide: ['eb'],
      flows: [
        { path: ['web', 'sns'], color: 'req', packet: pk(WEB, '注文トピック', 'Publish', '注文を1回送る') },
        { path: ['sns', 'queue', 'worker'], color: 'out', delay: 0.4, packet: pk('注文トピック', Q, '配信', 'キューにためて処理') },
        { path: ['sns', 'mail'], color: 'out', delay: 0.4, packet: pk('注文トピック', 'メール送信', '配信', 'メールを送る') },
        { path: ['queue', 'dlq'], color: 'out', delay: 0.85, packet: pk(Q, 'orders-dlq', '再処理ポリシー', '失敗が続いたものだけ隔離') },
      ],
      callouts: [{ node: 'queue', text: 'ためて切り離す', tone: '#f6e2a4' }],
      chips: [CFG('SNS ＋ SQS ＋ DLQ', 'good'), DOWN('キューで待つ', 'good'), MSG('要件で選ぶ')],
      card: { title: '要件 → サービス', lines: ['ためて後から処理 → SQS', '複数の宛先に配る → SNS', '条件で振り分け → EventBridge', '順番・重複なし → SQS FIFO'] },
      quiz: {
        question: '注文が入るたびに、在庫システムと配送システムの両方へ注文の情報を届けたい。どちらかが一時的に停止しても、注文の情報を失わずに、それぞれ独立して処理させたい。最も適切な構成は？',
        options: [
          'SQS キューを1つ作り、在庫システムと配送システムの両方がそのキューから受信する',
          'SNS トピックを作り、在庫用と配送用の2つの SQS キューに購読させる',
          '注文受付のサーバーから、在庫システムと配送システムを順番に直接呼び出す',
          'SQS FIFO キューを1つ作り、可視性タイムアウトを12時間にする',
        ],
        answer: 1,
        explanation: 'SNS トピックに2つの SQS キューを購読させるファンアウト構成なら、1回の送信で両方のキューにメッセージが届き、各システムが止まっていてもキューに残ります。1つのキューを共有すると、1つのメッセージはどちらか一方にしか処理されません。直接呼び出しは密結合で、相手が止まると情報が失われます。',
      },
    },
  ],

  learn: [
    { text: '密結合の問題と疎結合', atStep: 0 },
    { text: 'SQS のキューとポーリング', atStep: 1 },
    { text: '可視性タイムアウトと冪等性', atStep: 2 },
    { text: 'デッドレターキュー', atStep: 3 },
    { text: '標準キューと FIFO キュー', atStep: 4 },
    { text: 'SNS のファンアウト', atStep: 5 },
    { text: 'EventBridge のルール', atStep: 6 },
  ],
  prev: { title: 'IAMポリシーとロール', href: '/learn/iam-basics' },
  next: { title: 'EC2の購入オプションの選び方', href: '/learn/ec2-purchasing' },
}
