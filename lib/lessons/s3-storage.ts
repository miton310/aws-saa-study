import type { Chip, Lesson, Packet } from './types'

const FEE = (v: string, tone?: Chip['tone']): Chip => ({ label: '保存の料金', value: v, tone })
const GET = (v: string, tone?: Chip['tone']): Chip => ({ label: '取り出し', value: v, tone })
const AZS = (v: string, tone?: Chip['tone']): Chip => ({ label: '保存先のAZ', value: v, tone })

// パケットの流れ表に出す操作
const pk = (src: string, dst: string, proto: string, result: string, ok = true): Packet => ({ src, dst, proto, result, ok })
const APP = 'アプリ 10.0.2.10'
const OBJ = 's3://logs/app.log'

const TIERS = ['ia', 'oz', 'gir', 'gfr', 'gda', 'it']

export const s3StorageLesson: Lesson = {
  slug: 's3-storage',
  category: 's3',
  lessonLabel: 'レッスン 1',
  title: 'ストレージクラスとライフサイクル',
  lead: 'よく使うデータは速く、めったに使わないデータは安く。S3のストレージクラスの違いと、自動で移すライフサイクルを確かめる。',
  description:
    'S3のストレージクラス（Standard・Standard-IA・One Zone-IA・Glacier 3種類・Intelligent-Tiering）の違いと、ライフサイクルルールを、アニメーション図解で学ぶ。取り出し時間、最低保存期間、料金の考え方までSAA頻出ポイントを解説。',
  minutes: 12,
  badge: '頻出',

  nodes: [
    { id: 'app', x: 0.2, y: 7.2, s: 0.5, h: 34, fill: '#f6c191', label: 'アプリ', fontSize: 12, term: 'ec2', sub: '10.0.2.10' },
    { id: 'std', x: 1.6, y: 1.0, s: 0.55, h: 46, fill: '#cfe8b8', label: 'Standard', fontSize: 11, kind: 'cyl', term: 'storageclass', sub: 'ms・3AZ以上' },
    { id: 'ia', x: 4.0, y: 1.0, s: 0.55, h: 40, fill: '#bcd4f0', label: 'Standard-IA', fontSize: 10, kind: 'cyl', term: 'standardia', sub: 'ms・取り出し課金' },
    { id: 'oz', x: 6.4, y: 1.0, s: 0.55, h: 34, fill: '#e9e4da', label: 'One Zone-IA', fontSize: 10, kind: 'cyl', term: 'onezoneia', sub: 'ms・1AZのみ' },
    { id: 'gir', x: 1.6, y: 3.6, s: 0.55, h: 30, fill: '#d9cdf2', label: 'Glacier IR', fontSize: 10, kind: 'cyl', term: 'glacierir', sub: 'ms・90日〜' },
    { id: 'gfr', x: 4.0, y: 3.6, s: 0.55, h: 24, fill: '#c9d2f2', label: 'Glacier FR', fontSize: 10, kind: 'cyl', term: 'glacierfr', sub: '数分〜12時間' },
    { id: 'gda', x: 6.4, y: 3.6, s: 0.55, h: 18, fill: '#b9e3dc', label: 'Deep Archive', fontSize: 9.5, kind: 'cyl', term: 'deeparchive', sub: '9〜48時間' },
    { id: 'it', x: 8.6, y: 2.3, s: 0.6, h: 40, fill: '#f6e2a4', label: 'Intelligent', fontSize: 10, kind: 'cyl', term: 'intelligent', sub: '自動で層を移動' },
  ],
  zones: [
    { x0: 0.4, y0: -0.2, x1: 9.8, y1: 4.8, fill: 'rgba(255,255,255,.4)', dash: '8 6', label: 'S3 バケット（logs）', labelAt: 'top', term: 'bucket' },
    { x0: 0.6, y0: 0.1, x1: 7.4, y1: 1.9, fill: 'rgba(207,232,184,.35)', label: 'すぐ読める（ミリ秒）', labelAt: 'edge' },
    { x0: 0.6, y0: 2.7, x1: 7.4, y1: 4.5, fill: 'rgba(217,205,242,.4)', label: 'Glacier（長期保管）', labelAt: 'edge' },
  ],

  steps: [
    {
      short: '全体像', tag: '概要', title: 'S3はまず Standard に入る',
      body: [
        '{{s3:S3}}にファイル（{{object:オブジェクト}}）を保存すると、指定しなければ **S3 Standard** に入ります。データは**3つ以上の{{az:AZ}}**に複製され、いつでもミリ秒で読み出せます。',
        'ただし、すべてを Standard に置き続けるのは高くつきます。アクセスの頻度に合わせて**{{storageclass:ストレージクラス}}**を選ぶのが、このレッスンのテーマです。',
      ],
      changes: [{ kind: 'add', text: 'アプリのログを S3 Standard に保存' }],
      focus: ['app', 'std'], hide: TIERS,
      flows: [
        { path: ['app', 'std'], color: 'req', packet: pk(APP, OBJ, 'PUT', '保存（Standard）') },
        { path: ['std', 'app'], color: 'res', delay: 0.45, packet: pk(OBJ, APP, 'GET', '取り出し（ミリ秒・取り出し料金なし）') },
      ],
      callouts: [{ node: 'std', text: '3つ以上のAZに複製' }],
      chips: [FEE('基準'), GET('ミリ秒・無料'), AZS('3つ以上', 'good')],
      card: { title: 'S3 Standard', lines: ['よく使うデータ向け', '取り出し：ミリ秒・料金なし', '最低保存期間：なし'] },
    },
    {
      short: 'Standard-IA', tag: '基礎', title: 'あまり使わないなら Standard-IA',
      body: [
        '月に1回読むかどうか、というデータには{{standardia:S3 Standard-IA}}（低頻度アクセス）が向いています。保存の料金は Standard より安く、読むときもミリ秒です。',
        'その代わり、**取り出すたびに料金**がかかり、**最低30日分**の保存料金がかかります。頻繁に読むデータに使うと、かえって高くなります。',
      ],
      changes: [{ kind: 'add', text: '月1回だけ読むレポートを Standard-IA に保存' }],
      focus: ['app', 'std', 'ia'], hide: ['oz', 'gir', 'gfr', 'gda', 'it'],
      flows: [
        { path: ['app', 'ia'], color: 'req', packet: pk(APP, 's3://logs/report.csv', 'GET', '取り出し（ミリ秒・取り出し料金あり）') },
        { path: ['ia', 'app'], color: 'res', delay: 0.45, packet: pk('s3://logs/report.csv', APP, '応答', 'データを返す') },
      ],
      callouts: [{ node: 'ia', text: '読むたびに課金' }],
      chips: [FEE('Standardより安い', 'good'), GET('ミリ秒・有料'), AZS('3つ以上', 'good')],
      card: { title: 'S3 Standard-IA', lines: ['低頻度アクセス向け', '取り出し：ミリ秒・料金あり', '最低保存期間：30日'], highlight: 1 },
    },
    {
      short: 'One Zone-IA', tag: '落とし穴', title: 'One Zone-IA は1つのAZだけ',
      body: [
        '{{onezoneia:S3 One Zone-IA}}は、データを**1つのAZにだけ**保存するぶん、Standard-IA よりさらに安くなります。',
        'ただし、そのAZが失われればデータも失われます。**作り直せるデータ**（ほかに元データがある画像のサムネイルなど）や、別リージョンにコピー済みのデータに使います。',
      ],
      changes: [{ kind: 'add', text: '作り直せるサムネイルを One Zone-IA に保存' }],
      focus: ['app', 'oz', 'ia'], hide: ['gir', 'gfr', 'gda', 'it'],
      flows: [
        { path: ['app', 'oz'], color: 'req', packet: pk(APP, 's3://logs/thumb.jpg', 'PUT', '保存（1つのAZだけ）') },
        { path: ['oz', 'app'], color: 'res', delay: 0.45, packet: pk('s3://logs/thumb.jpg', APP, 'GET', '取り出し（ミリ秒・取り出し料金あり）') },
      ],
      callouts: [{ node: 'oz', text: 'AZ障害で失われうる', tone: '#f3b7b0' }],
      chips: [FEE('さらに安い', 'good'), GET('ミリ秒・有料'), AZS('1つ', 'bad')],
      card: { title: 'S3 One Zone-IA', lines: ['作り直せるデータ向け', '保存先：1つのAZ', '最低保存期間：30日'], highlight: 1 },
    },
    {
      short: 'Glacier', tag: 'テクニック', title: 'Glacier は3種類。違いは取り出し時間',
      body: [
        '長く保管するだけのデータは、さらに安い **S3 Glacier** に置きます。3種類あり、**取り出しにかかる時間**と最低保存期間が違います。',
        {
          list: [
            '{{glacierir:Glacier Instant Retrieval}}：ミリ秒で読める。最低90日。四半期に1回程度読むデータ向け。',
            '{{glacierfr:Glacier Flexible Retrieval}}：取り出しに数分〜12時間。最低90日。',
            '{{deeparchive:Glacier Deep Archive}}：いちばん安い。取り出しに9〜48時間。最低180日。',
          ],
        },
        'Flexible Retrieval と Deep Archive のオブジェクトは、そのままでは読めません。先に**復元**（一時的なコピーを作る）してから読み出します。',
      ],
      changes: [{ kind: 'add', text: '古いログを Glacier の3種類に分けて保管' }],
      focus: ['app', 'gir', 'gfr', 'gda'], hide: ['it'],
      flows: [
        { path: ['app', 'gir'], color: 'req', packet: pk(APP, 's3://logs/2025-q3.log', 'GET', '取り出し（ミリ秒）') },
        { path: ['app', 'gfr'], color: 'req', fail: true, delay: 0.3, packet: pk(APP, 's3://logs/2024.log', 'GET', 'すぐには読めない（先に復元：数分〜12時間）', false) },
        { path: ['app', 'gda'], color: 'req', fail: true, delay: 0.6, packet: pk(APP, 's3://logs/2019.log', 'GET', 'すぐには読めない（先に復元：9〜48時間）', false) },
      ],
      callouts: [{ node: 'gda', text: 'いちばん安い' }],
      chips: [FEE('とても安い', 'good'), GET('ミリ秒〜48時間'), AZS('3つ以上', 'good')],
      card: { title: '最低保存期間', lines: ['Glacier Instant Retrieval：90日', 'Glacier Flexible Retrieval：90日', 'Glacier Deep Archive：180日'] },
    },
    {
      short: 'ライフサイクル', tag: 'テクニック', title: 'ライフサイクルルールで自動で移す',
      body: [
        '「最初はよく読むが、時間がたつと読まなくなる」データは多くあります。{{lifecycle:ライフサイクルルール}}を作ると、**日数に応じて自動でストレージクラスを移し**、最後は削除までできます。',
        '手作業で移す必要はなく、保存料金が日数とともに自動で下がっていきます。',
      ],
      note: '最低保存期間より前に移したり削除したりすると、残りの期間分の料金がかかります。日数はクラスごとの最低保存期間を意識して決めます。',
      changes: [
        { kind: 'add', text: 'ライフサイクルルールを作成（30日→IA、90日→Glacier FR、365日→Deep Archive）' },
        { kind: 'add', text: '7年後に削除（有効期限）' },
      ],
      focus: ['std', 'ia', 'gfr', 'gda'], hide: ['it'],
      flows: [
        { path: ['std', 'ia'], color: 'out', packet: pk(OBJ, 'Standard-IA', '移行', '30日後に自動で移行') },
        { path: ['ia', 'gfr'], color: 'out', delay: 0.33, packet: pk(OBJ, 'Glacier FR', '移行', '90日後に自動で移行') },
        { path: ['gfr', 'gda'], color: 'out', delay: 0.66, packet: pk(OBJ, 'Deep Archive', '移行', '365日後に自動で移行') },
      ],
      callouts: [{ node: 'ia', text: '日数で自動移行' }],
      chips: [FEE('日数とともに下がる', 'good'), GET('移行先による'), AZS('3つ以上', 'good')],
      card: { title: 'ライフサイクルルール', lines: ['30日後  → Standard-IA', '90日後  → Glacier Flexible Retrieval', '365日後 → Glacier Deep Archive', '7年後   → 削除'], highlight: 0 },
    },
    {
      short: 'Intelligent', tag: 'テクニック', title: '使い方が読めないなら Intelligent-Tiering',
      body: [
        'アクセスのパターンが予測できないデータには{{intelligent:S3 Intelligent-Tiering}}が向いています。S3が読まれ方を見て、**オブジェクトごとに自動で安い層へ移し**、また読まれれば戻します。',
        '**取り出し料金と最低保存期間はありません**。その代わり、オブジェクトの数に応じた少額の監視・自動化料金がかかります。',
      ],
      changes: [{ kind: 'add', text: '読まれ方が読めないデータを Intelligent-Tiering に保存' }],
      focus: ['app', 'it'], hide: ['gir', 'gfr', 'gda'],
      flows: [
        { path: ['app', 'it'], color: 'req', packet: pk(APP, 's3://logs/user-upload.png', 'PUT', '保存（Intelligent-Tiering）') },
        { path: ['it', 'app'], color: 'res', delay: 0.45, packet: pk('s3://logs/user-upload.png', APP, 'GET', '取り出し（取り出し料金なし）') },
      ],
      callouts: [{ node: 'it', text: '読まれ方で自動移動' }],
      chips: [FEE('自動で最適化', 'good'), GET('取り出し料金なし', 'good'), AZS('3つ以上', 'good')],
      card: { title: 'S3 Intelligent-Tiering', lines: ['アクセスパターンが不明なデータ向け', '取り出し料金：なし', '最低保存期間：なし', '監視・自動化の少額料金あり'], highlight: 0 },
    },
    {
      short: 'まとめ', tag: '試験対策', title: 'ストレージクラスの選び方',
      body: [
        {
          list: [
            '**よく読む** → Standard。**月1回程度** → Standard-IA（取り出し料金・最低30日）。',
            '**作り直せる・1AZで良い** → One Zone-IA。',
            '**長期保管** → Glacier。ミリ秒で必要なら Instant Retrieval、数時間待てるなら Flexible Retrieval、最安で半日〜2日待てるなら Deep Archive。',
            '**読まれ方が読めない** → Intelligent-Tiering。**日数で決まっている** → ライフサイクルルール。',
          ],
        },
      ],
      changes: [],
      focus: 'all', hide: [],
      flows: [
        { path: ['std', 'ia'], color: 'out', packet: pk(OBJ, 'Standard-IA', '移行', '30日後') },
        { path: ['ia', 'gfr'], color: 'out', delay: 0.33, packet: pk(OBJ, 'Glacier FR', '移行', '90日後') },
        { path: ['gfr', 'gda'], color: 'out', delay: 0.66, packet: pk(OBJ, 'Deep Archive', '移行', '365日後') },
      ],
      callouts: [{ node: 'gda', text: '最安', tone: '#f6e2a4' }],
      chips: [FEE('用途で選ぶ', 'good'), GET('ミリ秒〜48時間'), AZS('One Zone以外は3つ以上', 'good')],
      card: { title: '取り出し時間の目安', lines: ['Standard / IA / Glacier IR：ミリ秒', 'Glacier Flexible Retrieval：数分〜12時間', 'Glacier Deep Archive：9〜48時間'] },
      quiz: {
        question: '監査用のログを7年間保管する必要がある。ほとんど参照されず、必要になったときは48時間以内に取り出せればよい。最もコストが低いストレージクラスは？',
        options: ['S3 Standard-IA', 'S3 One Zone-IA', 'S3 Glacier Flexible Retrieval', 'S3 Glacier Deep Archive'],
        answer: 3,
        explanation: 'Glacier Deep Archive は最も保存料金が安く、取り出しは9〜48時間なので「48時間以内」の条件を満たします。Flexible Retrieval も条件は満たしますが、Deep Archive より高くなります。IA系はミリ秒で読める分だけ高く、One Zone-IA は1つのAZにしか保存しないため監査ログには向きません。',
      },
    },
  ],

  learn: [
    { text: 'Standard と複数AZへの複製', atStep: 0 },
    { text: 'IA系の取り出し料金と最低保存期間', atStep: 1 },
    { text: 'Glacier 3種類の取り出し時間', atStep: 3 },
    { text: 'ライフサイクルルールで自動移行', atStep: 4 },
    { text: 'Intelligent-Tiering の使いどころ', atStep: 5 },
  ],
  prev: { title: 'ELBとAuto Scaling', href: '/learn/elb-asg' },
  next: { title: 'Multi-AZとリードレプリカ' },
}
