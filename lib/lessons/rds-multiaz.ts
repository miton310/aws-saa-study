import type { Chip, Lesson, Packet } from './types'

const CFG = (v: string, tone?: Chip['tone']): Chip => ({ label: '構成', value: v, tone })
const WR = (v: string, tone?: Chip['tone']): Chip => ({ label: '書き込み先', value: v, tone })
const RD = (v: string, tone?: Chip['tone']): Chip => ({ label: '読み取り先', value: v, tone })

// パケットの流れ表に出す通信（MySQL は TCP 3306 番）
const pk = (src: string, dst: string, proto: string, result: string, ok = true): Packet => ({ src, dst, proto, result, ok })
const APP = '10.0.2.10'
const PRI = '10.0.3.10'
const STB = '10.0.4.10'
const RR = '10.0.3.20'
const OSK = '10.1.3.10'
const EP = 'mydb エンドポイント'
const RREP = 'mydb-replica エンドポイント'

export const rdsMultiAzLesson: Lesson = {
  slug: 'rds-multiaz',
  category: 'rds',
  lessonLabel: 'レッスン 1',
  title: 'Multi-AZとリードレプリカ',
  lead: '止まらないDBにするMulti-AZと、読み取りを分散するリードレプリカ。似ている2つの違いを、データの流れで見分ける。',
  description:
    'Amazon RDS の Multi-AZ 配置とリードレプリカを、データが流れるアニメーション図解で学ぶ。同期・非同期レプリケーション、フェイルオーバーとエンドポイント、クロスリージョンのリードレプリカと昇格、Multi-AZ DBクラスターまでSAA頻出ポイントを解説。',
  minutes: 12,
  badge: '頻出',

  nodes: [
    { id: 'app', x: 0.6, y: 2.5, s: 0.55, h: 36, fill: '#f6c191', label: 'EC2（アプリ）', fontSize: 10.5, term: 'ec2', sub: APP },
    { id: 'primary', x: 4.2, y: 1.0, s: 0.62, h: 46, fill: '#d9cdf2', label: 'プライマリ', fontSize: 11, kind: 'cyl', term: 'rds', sub: PRI },
    { id: 'standby', x: 4.2, y: 4.0, s: 0.62, h: 46, fill: '#e9e4da', label: 'スタンバイ', fontSize: 11, kind: 'cyl', term: 'standby', sub: STB },
    { id: 'replica', x: 7.0, y: 1.0, s: 0.58, h: 42, fill: '#bcd4f0', label: 'レプリカ', fontSize: 11, kind: 'cyl', term: 'readreplica', sub: RR },
    { id: 'osaka', x: 10.4, y: 2.5, s: 0.58, h: 42, fill: '#bcd4f0', label: 'レプリカ', fontSize: 11, kind: 'cyl', term: 'readreplica', sub: OSK },
  ],
  zones: [
    { x0: -0.4, y0: -0.4, x1: 8.6, y1: 5.4, fill: 'rgba(255,255,255,.3)', dash: '8 6', label: '東京リージョン', labelAt: 'top', term: 'region' },
    { x0: 2.8, y0: 0.0, x1: 8.2, y1: 2.0, fill: 'rgba(217,205,242,.4)', label: 'AZ-a', labelAt: 'edge', term: 'az' },
    { x0: 2.8, y0: 3.0, x1: 8.2, y1: 5.0, fill: 'rgba(207,232,184,.4)', label: 'AZ-c', labelAt: 'edge', term: 'az' },
    { x0: 9.4, y0: 1.4, x1: 11.4, y1: 3.6, fill: 'rgba(188,212,240,.35)', dash: '6 5', label: '大阪リージョン', labelAt: 'top', term: 'region' },
  ],

  steps: [
    {
      short: '全体像', tag: '概要', title: '1台だけのDBは単一障害点',
      body: [
        'アプリ（{{ec2:EC2}}）は、{{rds:RDS}}の**{{rdsendpoint:エンドポイント}}**（mydb.xxxx.ap-northeast-1.rds.amazonaws.com のようなDNS名）に接続して、読み書きをします。',
        'DBが1台だけだと、そのAZで障害が起きたときにアプリ全体が止まります。DBは典型的な{{spof:単一障害点}}です。このレッスンでは、これを**止まりにくくする方法**と、**読み取りの負荷を分ける方法**の2つを見ていきます。',
      ],
      changes: [{ kind: 'add', text: 'RDS（MySQL）を AZ-a に1台だけ作成' }],
      focus: ['app', 'primary'], hide: ['standby', 'replica'],
      flows: [
        { path: ['app', 'primary'], color: 'req', packet: pk(APP, `${EP}:3306`, 'TCP 3306（MySQL）', `INSERT（書き込み）→ ${PRI}`) },
        { path: ['primary', 'app'], color: 'res', delay: 0.4, packet: pk(PRI, APP, 'MySQL 応答', 'OK') },
      ],
      callouts: [{ node: 'primary', text: 'ここが止まると全部止まる', tone: '#f3b7b0' }],
      chips: [CFG('シングルAZ', 'bad'), WR('プライマリ'), RD('プライマリ')],
      card: { title: '接続先', lines: [`mydb.xxxx.rds.amazonaws.com → ${PRI}（AZ-a）`], highlight: 0 },
    },
    {
      short: 'Multi-AZ', tag: '基礎', title: 'Multi-AZ：別のAZに同期でコピー',
      body: [
        '{{multiaz:Multi-AZ}}を有効にすると、RDSが**別のAZに{{standby:スタンバイ}}を自動で作り**、プライマリへの書き込みを{{syncrep:同期レプリケーション}}でコピーし続けます。',
        '同期なので、書き込みはスタンバイにも書かれてから完了します。そのため、障害が起きてもデータがほぼ失われません。',
      ],
      note: '標準の Multi-AZ（Multi-AZ DBインスタンス）のスタンバイは、**読み取りには使えません**。待機専用です。読み取りの負荷分散には使えない点が試験でよく狙われます。',
      changes: [
        { kind: 'mod', text: 'DBインスタンスの「マルチAZ配置」を有効化' },
        { kind: 'add', text: 'AZ-c にスタンバイが自動で作成される' },
      ],
      focus: ['app', 'primary', 'standby'], hide: ['replica'],
      flows: [
        { path: ['app', 'primary'], color: 'req', packet: pk(APP, `${EP}:3306`, 'TCP 3306（MySQL）', 'INSERT（書き込み）') },
        { path: ['primary', 'standby'], color: 'out', delay: 0.35, packet: pk(PRI, STB, '同期レプリケーション', 'スタンバイにも書いてから完了') },
        { path: ['primary', 'app'], color: 'res', delay: 0.7, packet: pk(PRI, APP, 'MySQL 応答', 'OK') },
      ],
      callouts: [{ node: 'standby', text: '待機専用（読めない）' }],
      chips: [CFG('Multi-AZ', 'good'), WR('プライマリ'), RD('プライマリ')],
      card: { title: 'Multi-AZ DBインスタンス', lines: ['プライマリ：AZ-a（読み書き）', 'スタンバイ：AZ-c（待機のみ）', 'コピー：同期'], highlight: 1 },
    },
    {
      short: 'フェイルオーバー', tag: '基礎', title: '障害時はエンドポイントの向き先が切り替わる',
      body: [
        'プライマリのAZで障害が起きると、RDSは自動で**スタンバイをプライマリに昇格**させます。',
        'このとき、**エンドポイントのDNS名はそのまま**で、指す先のIPだけがスタンバイに切り替わります。アプリは接続し直すだけでよく、設定を変える必要はありません。切り替えには通常 **60〜120秒**ほどかかります。',
      ],
      note: 'アプリはDBのIPアドレスではなく、必ずエンドポイントのDNS名で接続します。IPを直接書いていると、フェイルオーバー後も古いIPに接続しようとしてしまいます。',
      changes: [{ kind: 'mod', text: 'エンドポイント mydb の向き先：10.0.3.10 → 10.0.4.10' }],
      focus: ['app', 'primary', 'standby'], hide: ['replica'],
      flows: [
        { path: ['app', 'primary'], color: 'atk', fail: true, packet: pk(APP, `${PRI}:3306`, 'TCP 3306（MySQL）', '応答なし（AZ-a で障害）', false) },
        { path: ['app', 'standby'], color: 'req', delay: 0.45, packet: pk(APP, `${EP}:3306`, 'TCP 3306（MySQL）', `再接続 → 新しいプライマリ ${STB}`) },
        { path: ['standby', 'app'], color: 'res', delay: 0.8, packet: pk(STB, APP, 'MySQL 応答', 'OK（データはそのまま）') },
      ],
      callouts: [
        { node: 'primary', text: '障害', tone: '#f3b7b0' },
        { node: 'standby', text: '新しいプライマリに昇格', tone: '#cfe8b8' },
      ],
      chips: [CFG('フェイルオーバー中'), WR('スタンバイ（昇格）', 'good'), RD('スタンバイ（昇格）', 'good')],
      card: { title: '接続先', lines: [`mydb.xxxx.rds.amazonaws.com → ${PRI}（AZ-a）`, `mydb.xxxx.rds.amazonaws.com → ${STB}（AZ-c）`], highlight: 1 },
    },
    {
      short: 'リードレプリカ', tag: '基礎', title: 'リードレプリカ：読み取りを別のDBに逃がす',
      body: [
        '{{readreplica:リードレプリカ}}は、プライマリのデータを{{asyncrep:非同期レプリケーション}}でコピーした**読み取り専用のDB**です。プライマリとは**別のエンドポイント**を持ちます。',
        '集計やレポートのような重い読み取りをリードレプリカに向ければ、プライマリは書き込みに専念できます。MySQL や PostgreSQL では、1つのプライマリに**最大15台**まで作れます。',
      ],
      note: '非同期なので、プライマリに書いた直後のデータがリードレプリカにはまだ届いていないことがあります（{{replicalag:レプリカラグ}}）。書いた直後に必ず読み直す処理は、プライマリから読みます。',
      changes: [
        { kind: 'add', text: 'リードレプリカ mydb-replica を作成' },
        { kind: 'mod', text: 'レポート処理の接続先を mydb-replica のエンドポイントに変更' },
      ],
      focus: ['app', 'primary', 'replica'], hide: ['standby'],
      flows: [
        { path: ['app', 'primary'], color: 'req', packet: pk(APP, `${EP}:3306`, 'TCP 3306（MySQL）', 'INSERT（書き込み）→ プライマリ') },
        { path: ['primary', 'replica'], color: 'out', delay: 0.35, packet: pk(PRI, RR, '非同期レプリケーション', '少し遅れて反映') },
        { path: ['app', 'replica'], color: 'req', delay: 0.7, packet: pk(APP, `${RREP}:3306`, 'TCP 3306（MySQL）', `SELECT（読み取り）→ ${RR}`) },
      ],
      callouts: [{ node: 'replica', text: '読み取り専用' }],
      chips: [CFG('リードレプリカ'), WR('プライマリ'), RD('リードレプリカ', 'good')],
      card: { title: 'エンドポイント', lines: ['mydb          → プライマリ（読み書き）', 'mydb-replica  → リードレプリカ（読み取りのみ）'], highlight: 1 },
    },
    {
      short: '別リージョン', tag: 'テクニック', title: '別リージョンのリードレプリカと昇格',
      body: [
        'リードレプリカは、**別のリージョン**（ここでは大阪）にも作れます。大阪の利用者がより近いDBから読めるようになり、東京リージョン全体の障害に備える**災害対策（DR）**にもなります。',
        '東京で大きな障害が起きたら、大阪のリードレプリカを**{{promote:昇格}}**させます。昇格するとレプリケーションが切れ、**読み書きできる独立したDB**になります。',
      ],
      note: 'Multi-AZ のフェイルオーバーは自動ですが、リードレプリカの昇格は**手動**（またはAPIからの操作）です。昇格後は、アプリの接続先も大阪のエンドポイントに切り替えます。',
      changes: [
        { kind: 'add', text: '大阪リージョンにリードレプリカを作成' },
        { kind: 'mod', text: '東京で障害 → 大阪のリードレプリカを昇格' },
      ],
      focus: ['app', 'primary', 'osaka'], hide: ['standby', 'replica'],
      flows: [
        { path: ['primary', 'osaka'], color: 'out', packet: pk(PRI, OSK, '非同期レプリケーション', 'リージョンをまたいでコピー') },
        { path: ['app', 'osaka'], color: 'req', delay: 0.5, packet: pk(APP, 'mydb-osaka エンドポイント:3306', 'TCP 3306（MySQL）', '昇格後は読み書きできる') },
      ],
      callouts: [{ node: 'osaka', text: '昇格すると独立したDBに', tone: '#f6e2a4' }],
      chips: [CFG('クロスリージョン'), WR('プライマリ（昇格後は大阪）'), RD('大阪のレプリカ', 'good')],
      card: { title: '大阪のリードレプリカ', lines: ['平常時：読み取り専用（非同期でコピー）', '障害時：昇格 → 読み書きできる独立DB'], highlight: 1 },
    },
    {
      short: '使い分け', tag: '試験対策', title: 'Multi-AZ とリードレプリカの違い',
      body: [
        '2つは「コピーを持つ」点が似ていますが、**目的が違います**。',
        {
          list: [
            '**目的**：Multi-AZ は**可用性**（止まらない）、リードレプリカは**読み取り性能**（負荷分散）。',
            '**コピーの方法**：Multi-AZ は**同期**、リードレプリカは**非同期**。',
            '**コピー先から読めるか**：Multi-AZ のスタンバイは**読めない**、リードレプリカは**読める**。',
            '**障害時**：Multi-AZ は**自動**でフェイルオーバー、リードレプリカは**手動**で昇格。',
            '**エンドポイント**：Multi-AZ は**同じ名前のまま**、リードレプリカは**別の名前**。',
          ],
        },
        '両方を同時に使うこともできます（プライマリを Multi-AZ にして、リードレプリカも作る）。',
      ],
      changes: [{ kind: 'mod', text: 'Multi-AZ ＋ リードレプリカを組み合わせた構成' }],
      focus: ['app', 'primary', 'standby', 'replica'],
      flows: [
        { path: ['app', 'primary'], color: 'req', packet: pk(APP, `${EP}:3306`, 'TCP 3306（MySQL）', '書き込み → プライマリ') },
        { path: ['primary', 'standby'], color: 'out', delay: 0.3, packet: pk(PRI, STB, '同期レプリケーション', '可用性のため') },
        { path: ['primary', 'replica'], color: 'out', delay: 0.45, packet: pk(PRI, RR, '非同期レプリケーション', '読み取り分散のため') },
        { path: ['app', 'replica'], color: 'req', delay: 0.75, packet: pk(APP, `${RREP}:3306`, 'TCP 3306（MySQL）', '読み取り → リードレプリカ') },
      ],
      callouts: [
        { node: 'standby', text: '同期・読めない' },
        { node: 'replica', text: '非同期・読める' },
      ],
      chips: [CFG('Multi-AZ＋レプリカ', 'good'), WR('プライマリ'), RD('リードレプリカ', 'good')],
      card: { title: 'Multi-AZ と リードレプリカ', lines: ['目的　　：可用性　／　読み取り性能', 'コピー　：同期　　／　非同期', '読めるか：いいえ　／　はい', '障害時　：自動　　／　手動で昇格'] },
    },
    {
      short: 'まとめ', tag: '試験対策', title: 'Multi-AZ とリードレプリカで押さえるポイント',
      body: [
        {
          list: [
            '「AZ障害でも止めたくない」→ **Multi-AZ**。同期コピー、自動フェイルオーバー（通常60〜120秒）、エンドポイントの名前は変わらない。',
            '「読み取りが重い」→ **リードレプリカ**。非同期コピー、読み取り専用、別のエンドポイント。最大15台（MySQL・PostgreSQL など）。',
            '「リージョン障害に備える」→ **別リージョンのリードレプリカ**を作り、障害時に昇格。',
            '「待機側からも読みたい・切り替えを速く」→ **{{mazcluster:Multi-AZ DBクラスター}}**（読み取りもできるスタンバイ2台、切り替えは通常35秒未満）。',
            '{{aurora:Aurora}} は、レプリカ（最大15台）がフェイルオーバー先と読み取り先を兼ねる。',
          ],
        },
      ],
      changes: [],
      focus: ['app', 'primary', 'standby', 'replica', 'osaka'],
      flows: [
        { path: ['primary', 'standby'], color: 'out', packet: pk(PRI, STB, '同期レプリケーション', '可用性') },
        { path: ['primary', 'replica'], color: 'out', delay: 0.3, packet: pk(PRI, RR, '非同期レプリケーション', '読み取り性能') },
        { path: ['primary', 'osaka'], color: 'out', delay: 0.6, packet: pk(PRI, OSK, '非同期レプリケーション', 'リージョン障害への備え') },
      ],
      callouts: [{ node: 'primary', text: '書き込みはここだけ', tone: '#f6e2a4' }],
      chips: [CFG('要件で選ぶ'), WR('プライマリ'), RD('レプリカに分散', 'good')],
      card: { title: '要件 → 構成', lines: ['AZ障害でも止めない → Multi-AZ', '読み取りを分散 → リードレプリカ', 'リージョン障害に備える → 別リージョンのレプリカ'] },
      quiz: {
        question: 'RDS for MySQL で、毎晩のレポート集計の重い SELECT のせいで、本番の書き込み処理が遅くなっている。アプリの変更は最小限にして、書き込みへの影響をなくしたい。最も適切な対応は？',
        options: [
          'Multi-AZ 配置を有効にし、レポート処理をスタンバイに接続する',
          'リードレプリカを作成し、レポート処理の接続先をリードレプリカのエンドポイントにする',
          'DBサブネットグループに、別のAZのサブネットを追加する',
          '毎晩スナップショットを取得し、Multi-AZ のフェイルオーバーを手動で実行する',
        ],
        answer: 1,
        explanation: 'リードレプリカは読み取り専用のコピーで、別のエンドポイントを持つため、レポート処理の接続先を変えるだけで読み取りの負荷をプライマリから外せます。標準の Multi-AZ のスタンバイは待機専用で、読み取りには使えません。サブネットの追加やフェイルオーバーでは、読み取りの負荷は分散されません。',
      },
    },
  ],

  learn: [
    { text: 'DBが単一障害点になる理由', atStep: 0 },
    { text: 'Multi-AZ と同期レプリケーション', atStep: 1 },
    { text: 'フェイルオーバーとエンドポイント', atStep: 2 },
    { text: 'リードレプリカと非同期レプリケーション', atStep: 3 },
    { text: '別リージョンのレプリカと昇格', atStep: 4 },
    { text: 'Multi-AZ とリードレプリカの使い分け', atStep: 5 },
  ],
  prev: { title: 'ストレージクラスとライフサイクル', href: '/learn/s3-storage' },
  next: { title: 'IAMポリシーとロール' },
}
