import type { Chip, Lesson, Packet } from './types'

const OP = (v: string): Chip => ({ label: '操作', value: v })
const SPEED = (v: string, tone?: Chip['tone']): Chip => ({ label: '応答の速さ', value: v, tone })
const CAP = (v: string, tone?: Chip['tone']): Chip => ({ label: 'キャパシティ', value: v, tone })

// パケットの流れ表に出すリクエスト（DynamoDB の API）
const pk = (src: string, dst: string, proto: string, result: string, ok = true): Packet => ({ src, dst, proto, result, ok })
const APP = 'アプリ（東京）'
const APPUS = 'アプリ（米国）'
const T = 'Orders テーブル'

export const dynamodbBasicsLesson: Lesson = {
  slug: 'dynamodb-basics',
  category: 'rds',
  lessonLabel: 'レッスン 2',
  title: 'DynamoDB の基本',
  lead: 'サーバーを持たず、どれだけ大きくなっても数ミリ秒で応えるNoSQL。キーの設計、キャパシティモード、DAX、グローバルテーブル、そしてRDSとの使い分け。',
  description:
    'Amazon DynamoDB の基本を、リクエストが流れるアニメーション図解で学ぶ。パーティションキーとソートキー、オンデマンドとプロビジョンドのキャパシティ、DAX、グローバルテーブル、RDS との使い分けまでSAA頻出ポイントを解説。',
  minutes: 12,
  badge: '頻出',

  nodes: [
    { id: 'app', x: -2.6, y: 1.2, s: 0.55, h: 36, fill: '#f6c191', label: 'アプリ', fontSize: 11, term: 'lambda', sub: 'Lambda（東京）' },
    { id: 'dax', x: 0.4, y: 1.2, s: 0.55, h: 30, fill: '#f3b7b0', label: 'DAX', term: 'dax', sub: 'インメモリキャッシュ' },
    { id: 'ddb', x: 3.6, y: 1.2, s: 0.6, h: 44, fill: '#d9cdf2', label: 'DynamoDB', fontSize: 9.5, kind: 'cyl', term: 'dynamodb', sub: 'Orders（東京）' },
    { id: 'appus', x: -2.6, y: 4.6, s: 0.55, h: 36, fill: '#f6c191', label: 'アプリ', fontSize: 11, term: 'lambda', sub: 'Lambda（米国）' },
    { id: 'ddbus', x: 3.6, y: 4.6, s: 0.6, h: 44, fill: '#d9cdf2', label: 'DynamoDB', fontSize: 9.5, kind: 'cyl', term: 'globaltable', sub: 'Orders（米国東部）' },
  ],
  zones: [
    { x0: 2.6, y0: 0.0, x1: 4.6, y1: 2.4, fill: 'rgba(188,212,240,.3)', dash: '6 5', label: '東京リージョン', labelAt: 'top', term: 'region' },
    { x0: 2.6, y0: 3.4, x1: 4.6, y1: 5.8, fill: 'rgba(207,232,184,.3)', dash: '6 5', label: '米国東部リージョン', labelAt: 'top', term: 'region' },
  ],

  steps: [
    {
      short: '全体像', tag: '概要', title: 'サーバーを持たない NoSQL データベース',
      body: [
        '{{dynamodb:DynamoDB}}は、キーを指定してデータを読み書きする**NoSQLのデータベース**です。サーバーやストレージの管理は要らず、テーブルを作ればすぐ使えます。',
        'ユーザーが10人でも1億人でも、1件の読み書きは**数ミリ秒（1桁ミリ秒）**で返ります。ショッピングカート、セッション情報、ゲームのデータなど、**キーで1件ずつ素早く読み書きする**用途が得意です。',
      ],
      changes: [{ kind: 'add', text: 'DynamoDB テーブル Orders を作成' }],
      focus: ['app', 'ddb'], hide: ['dax'],
      flows: [
        { path: ['app', 'ddb'], color: 'req', packet: pk(APP, T, 'PutItem', '注文 O-1001 を書き込む') },
        { path: ['ddb', 'app'], color: 'res', delay: 0.4, packet: pk(T, APP, '応答', '数ミリ秒で完了') },
      ],
      callouts: [{ node: 'ddb', text: 'サーバー管理なし', tone: '#cfe8b8' }],
      chips: [OP('PutItem'), SPEED('1桁ミリ秒', 'good'), CAP('—')],
      card: { title: 'DynamoDB が得意なこと', lines: ['キーを指定して1件ずつ読み書き', 'どれだけ大きくなっても速さが変わらない', 'サーバーの管理が要らない'], highlight: 0 },
    },
    {
      short: 'キー', tag: '基礎', title: 'パーティションキーとソートキー',
      body: [
        'テーブルを作るときに**主キー**を決めます。主キーは、{{partitionkey:パーティションキー}}だけ、またはパーティションキーと**ソートキー**の組み合わせです。',
        'たとえば「顧客ID」をパーティションキー、「注文日時」をソートキーにすると、**ある顧客の注文を日付順に**すばやく取り出せます（Query）。',
      ],
      note: 'キー以外の項目で検索したいときは、テーブル全体を読む Scan ではなく、グローバルセカンダリインデックス（GSI）を作ります。Scan は件数が多いほど遅く、高くなります。',
      changes: [{ kind: 'mod', text: '主キー：パーティションキー customerId ＋ ソートキー orderedAt' }],
      focus: ['app', 'ddb'], hide: ['dax'],
      flows: [
        { path: ['app', 'ddb'], color: 'req', packet: pk(APP, T, 'Query', 'customerId = C001 の注文を、新しい順に') },
        { path: ['ddb', 'app'], color: 'res', delay: 0.4, packet: pk(T, APP, '応答', '3件を日付順で返す') },
      ],
      callouts: [{ node: 'ddb', text: 'キーで一発' }],
      chips: [OP('Query'), SPEED('1桁ミリ秒', 'good'), CAP('—')],
      card: { title: 'Orders テーブル', lines: ['パーティションキー：customerId', 'ソートキー：orderedAt', 'C001 ／ 2026-11-20 ／ 3,200円', 'C001 ／ 2026-11-22 ／ 12,800円'], highlight: 0 },
    },
    {
      short: 'キャパシティ', tag: '基礎', title: 'オンデマンドとプロビジョンド',
      body: [
        '読み書きの処理能力（キャパシティ）の払い方は2つあります。',
        {
          list: [
            '**オンデマンド**：リクエストの数だけ払う。容量を決めなくても**自動で**増減する。アクセスが**読めない**ときや、新しいアプリに。',
            '**プロビジョンド**：1秒あたりの読み書きの量（RCU・WCU）を自分で決めて、時間単位で払う。オートスケーリングも使える。アクセスが**予測できる**ときに、安くできる。',
          ],
        },
      ],
      note: 'EC2 の購入オプションと同じ考え方です。「読めない・急に増える」ならオンデマンド、「一定で予測できる」ならプロビジョンド。',
      changes: [{ kind: 'mod', text: 'キャパシティモード：オンデマンド（アクセス数がまだ読めないため）' }],
      focus: ['app', 'ddb'], hide: ['dax'],
      flows: [
        { path: ['app', 'ddb'], color: 'req', packet: pk(APP, T, 'PutItem × 大量', 'セールで急増 → 自動で対応') },
        { path: ['ddb', 'app'], color: 'res', delay: 0.4, packet: pk(T, APP, '応答', 'リクエストの数だけ課金') },
      ],
      callouts: [{ node: 'ddb', text: '急増にも自動で' }],
      chips: [OP('PutItem'), SPEED('1桁ミリ秒', 'good'), CAP('オンデマンド', 'good')],
      card: { title: 'キャパシティモードの選び方', lines: ['アクセスが読めない・急増する → オンデマンド', 'アクセスが一定で予測できる → プロビジョンド'], highlight: 0 },
    },
    {
      short: 'DAX', tag: 'テクニック', title: 'DAX：読み取りをマイクロ秒に',
      body: [
        'ゲームのランキングのように、同じデータが何度も読まれ、**ミリ秒よりさらに速く**返したいときは、{{dax:DAX}}を使います。DynamoDB の前に置くインメモリキャッシュで、読み取りを**ミリ秒からマイクロ秒**に速くします（最大10倍）。',
        'DynamoDB と同じ API で使えるので、アプリはつなぎ先を DAX に変えるだけです。',
      ],
      note: 'DAX がキャッシュするのは、結果整合性の読み取り（初期設定の読み方）です。強い整合性の読み取りは、DAX をそのまま通り抜けて DynamoDB に届きます。',
      changes: [
        { kind: 'add', text: 'DAX クラスターを作成' },
        { kind: 'mod', text: 'アプリの接続先を DAX のエンドポイントに変更' },
      ],
      focus: ['app', 'dax', 'ddb'],
      flows: [
        { path: ['app', 'dax'], color: 'req', packet: pk(APP, 'DAX', 'GetItem', 'ランキング上位 → キャッシュヒット') },
        { path: ['dax', 'app'], color: 'res', delay: 0.3, packet: pk('DAX', APP, '応答', 'マイクロ秒で返す') },
        { path: ['app', 'dax', 'ddb'], color: 'req', delay: 0.6, packet: pk(APP, 'DAX', 'GetItem（強い整合性）', 'キャッシュせず DynamoDB へ') },
      ],
      callouts: [{ node: 'dax', text: 'マイクロ秒', tone: '#cfe8b8' }],
      chips: [OP('GetItem'), SPEED('マイクロ秒', 'good'), CAP('オンデマンド')],
      card: { title: 'DAX の読み取り', lines: ['結果整合性の読み取り → キャッシュから', '強い整合性の読み取り → DynamoDB へ通す', '書き込み → DAX 経由で DynamoDB へ'], highlight: 0 },
    },
    {
      short: 'グローバルテーブル', tag: 'テクニック', title: 'グローバルテーブル：どのリージョンでも読み書き',
      body: [
        '世界中の利用者に近い場所で読み書きしたいときは、{{globaltable:グローバルテーブル}}にします。選んだリージョンにテーブルのレプリカが作られ、**どのレプリカでも読み書きでき**（マルチアクティブ）、書き込みは**ほかのリージョンに自動で複製**されます。',
        'あるリージョンで障害が起きても、アプリの向き先を別のリージョンに変えれば、そのまま読み書きを続けられます。',
      ],
      note: 'RDS の別リージョンのリードレプリカは読み取り専用でした。グローバルテーブルは、どのリージョンでも書き込めるのが大きな違いです。',
      changes: [{ kind: 'add', text: 'Orders を米国東部リージョンにも複製（グローバルテーブル）' }],
      focus: ['app', 'ddb', 'appus', 'ddbus'], hide: ['dax'],
      flows: [
        { path: ['appus', 'ddbus'], color: 'req', packet: pk(APPUS, 'Orders（米国東部）', 'PutItem', '近くのリージョンに書き込む') },
        { path: ['ddbus', 'ddb'], color: 'out', delay: 0.4, packet: pk('Orders（米国東部）', 'Orders（東京）', 'レプリケーション', '東京にも自動で複製') },
        { path: ['app', 'ddb'], color: 'req', delay: 0.75, packet: pk(APP, 'Orders（東京）', 'GetItem', '米国で書いた注文も読める') },
      ],
      callouts: [{ node: 'ddbus', text: 'ここでも書ける', tone: '#cfe8b8' }],
      chips: [OP('PutItem / GetItem'), SPEED('近くのリージョンで速い', 'good'), CAP('オンデマンド')],
      card: { title: 'グローバルテーブル Orders', lines: ['東京：読み書きできる', '米国東部：読み書きできる', '書き込みはほかのリージョンへ自動で複製'], highlight: 1 },
    },
    {
      short: 'RDS との違い', tag: '試験対策', title: 'DynamoDB と RDS の使い分け',
      body: [
        '試験では「どちらのデータベースを選ぶか」がよく問われます。',
        {
          list: [
            '**RDS（リレーショナル）**：SQL で**表を結合（JOIN）**したり、複雑な条件で集計したりする。売上管理・会計など、表どうしの関係が大事なデータに。',
            '**DynamoDB（NoSQL）**：**キーで1件ずつ**読み書きする。アクセスが急に増えても速さが変わらず、サーバー管理も要らない。カート・セッション・ゲーム・IoT などに。',
          ],
        },
        '「サーバーレス」「どれだけ増えても1桁ミリ秒」「スキーマを柔軟に」と書かれていたら、DynamoDB が候補です。',
      ],
      changes: [],
      focus: ['app', 'ddb'], hide: ['dax'],
      flows: [
        { path: ['app', 'ddb'], color: 'req', packet: pk(APP, T, 'GetItem', 'キーで1件 → 得意') },
        { path: ['app', 'ddb'], color: 'atk', fail: true, delay: 0.45, packet: pk(APP, T, 'JOIN して集計したい', 'DynamoDB は不得意 → RDS を選ぶ', false) },
      ],
      callouts: [{ node: 'ddb', text: 'キーで引くのが得意' }],
      chips: [OP('要件で選ぶ'), SPEED('1桁ミリ秒', 'good'), CAP('—')],
      card: { title: 'RDS と DynamoDB', lines: ['問い合わせ：SQL・JOIN　／　キーで1件ずつ', '大きくなると：工夫が要る　／　速さが変わらない', '管理：インスタンスを選ぶ　／　サーバーレス'] },
    },
    {
      short: 'まとめ', tag: '試験対策', title: 'DynamoDB で押さえるポイント',
      body: [
        {
          list: [
            'DynamoDB は**サーバーレスの NoSQL**。キーでの読み書きが、規模に関係なく**1桁ミリ秒**。',
            '主キーは**パーティションキー**（＋**ソートキー**）。キー以外で探すなら **GSI**、Scan は避ける。',
            'アクセスが読めない → **オンデマンド**、予測できる → **プロビジョンド**（＋オートスケーリング）。',
            '読み取りを**マイクロ秒**に → **DAX**（結果整合性の読み取りをキャッシュ）。',
            '複数のリージョンで**読み書き** → **グローバルテーブル**（マルチアクティブ）。',
            'JOIN や複雑な集計 → **RDS**。',
          ],
        },
      ],
      changes: [],
      focus: ['app', 'dax', 'ddb', 'appus', 'ddbus'],
      flows: [
        { path: ['app', 'dax'], color: 'req', packet: pk(APP, 'DAX', 'GetItem', 'キャッシュヒット（マイクロ秒）') },
        { path: ['appus', 'ddbus'], color: 'req', delay: 0.35, packet: pk(APPUS, 'Orders（米国東部）', 'PutItem', '近くのリージョンに書く') },
        { path: ['ddbus', 'ddb'], color: 'out', delay: 0.7, packet: pk('Orders（米国東部）', 'Orders（東京）', 'レプリケーション', '自動で複製') },
      ],
      callouts: [{ node: 'dax', text: '読み取りを加速', tone: '#f6e2a4' }],
      chips: [OP('要件で選ぶ'), SPEED('ミリ秒〜マイクロ秒', 'good'), CAP('オンデマンド')],
      card: { title: '要件 → 使うもの', lines: ['キーで高速・サーバーレス → DynamoDB', '読み取りをマイクロ秒に → DAX', '複数リージョンで読み書き → グローバルテーブル', 'JOIN・複雑な集計 → RDS'] },
      quiz: {
        question: 'DynamoDB を使うゲームで、ランキングの読み取りが非常に多く、応答時間をマイクロ秒にまで短くしたい。アプリの変更はできるだけ少なくしたい。最も適切な方法は？',
        options: [
          'テーブルのキャパシティモードをプロビジョンドにして、読み取りの容量を増やす',
          'DynamoDB Accelerator（DAX）を導入し、アプリの接続先を DAX にする',
          'RDS のリードレプリカを作成して、ランキングを読む',
          'テーブルをグローバルテーブルにする',
        ],
        answer: 1,
        explanation: 'DAX は DynamoDB 用のインメモリキャッシュで、DynamoDB と同じ API のまま、読み取りの応答をミリ秒からマイクロ秒に短くします。容量を増やしても1件あたりの応答は1桁ミリ秒のままです。RDS は別のデータベースなので大きな作り直しになり、グローバルテーブルは複数リージョンでの読み書きのための機能です。',
      },
    },
  ],

  learn: [
    { text: 'DynamoDB の特徴', atStep: 0 },
    { text: 'パーティションキーとソートキー', atStep: 1 },
    { text: 'オンデマンドとプロビジョンド', atStep: 2 },
    { text: 'DAX でマイクロ秒の読み取り', atStep: 3 },
    { text: 'グローバルテーブル', atStep: 4 },
    { text: 'RDS との使い分け', atStep: 5 },
  ],
  prev: { title: 'CloudFront とキャッシュ', href: '/learn/cloudfront-cache' },
  next: { title: 'CloudWatch と CloudTrail', href: '/learn/cloudwatch-cloudtrail' },
}
