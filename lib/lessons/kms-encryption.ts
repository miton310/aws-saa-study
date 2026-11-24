import type { Chip, Lesson, Packet } from './types'

const ENC = (v: string, tone?: Chip['tone']): Chip => ({ label: '暗号化の方式', value: v, tone })
const KEY = (v: string, tone?: Chip['tone']): Chip => ({ label: '鍵', value: v, tone })
const LOG = (v: string, tone?: Chip['tone']): Chip => ({ label: '鍵の使用の記録', value: v, tone })

// パケットの流れ表に出すリクエスト（S3 と KMS の API）
const pk = (src: string, dst: string, proto: string, result: string, ok = true): Packet => ({ src, dst, proto, result, ok })
const APP = 'app-role（EC2）'
const BOB = 'bob（IAMユーザー）'
const BUCKET = 's3://reports'
const KEYNAME = 'KMS キー（reports-key）'

export const kmsEncryptionLesson: Lesson = {
  slug: 'kms-encryption',
  category: 'iam',
  lessonLabel: 'レッスン 2',
  title: 'KMS と暗号化',
  lead: '保存したデータを暗号化する鍵を、だれが管理し、だれが使えるのか。S3 の暗号化を例に、KMS・エンベロープ暗号化・キーポリシーを押さえる。',
  description:
    'AWS KMS と S3 の暗号化を、リクエストが流れるアニメーション図解で学ぶ。SSE-S3 と SSE-KMS、データキーとエンベロープ暗号化、キーポリシーと kms:Decrypt、キーのローテーション、SSE-C と CloudHSM までSAA頻出ポイントを解説。',
  minutes: 13,
  badge: '頻出',

  nodes: [
    { id: 'app', x: -1.8, y: 1.0, s: 0.55, h: 38, fill: '#f6c191', label: 'アプリ', fontSize: 11, kind: 'server', term: 'ec2', sub: 'app-role' },
    { id: 's3', x: 1.2, y: 1.0, s: 0.6, h: 44, fill: '#cfe8b8', label: 'S3', kind: 'cyl', term: 'bucket', sub: 'reports バケット' },
    { id: 'kms', x: 1.2, y: 3.6, s: 0.6, h: 36, fill: '#f3b7b0', label: 'KMS', term: 'kms', sub: 'reports-key' },
    { id: 'dev', x: -1.8, y: 3.6, s: 0.5, h: 26, fill: '#f4efe6', label: '開発者', kind: 'person', term: 'iamuser', sub: 'bob' },
    { id: 'ct', x: 3.8, y: 3.6, s: 0.5, h: 30, fill: '#f6e2a4', label: 'CloudTrail', fontSize: 8.5, term: 'cloudtrail', sub: 'キーの使用を記録' },
  ],
  zones: [],

  steps: [
    {
      short: '全体像', tag: '概要', title: 'S3 のデータは、最初から暗号化されている',
      body: [
        'S3 に保存されるオブジェクトは、何も設定しなくても**自動で暗号化**されます。初期設定は **{{sses3:SSE-S3}}**（S3 が管理する鍵でのサーバー側暗号化）で、AES-256 を使います。',
        'ただ、SSE-S3 の鍵は S3 が管理するので、「鍵をだれが使えるか」を自分で決めたり、鍵の使用を記録したりはできません。それをしたいときに使うのが **{{kms:KMS}}**（Key Management Service）です。',
      ],
      changes: [],
      focus: ['app', 's3'],
      flows: [
        { path: ['app', 's3'], color: 'req', packet: pk(APP, BUCKET, 'PutObject', '2026-11.csv を保存') },
        { path: ['s3', 'app'], color: 'res', delay: 0.4, packet: pk('S3', APP, '応答', 'SSE-S3 で自動的に暗号化して保存') },
      ],
      callouts: [{ node: 's3', text: '初期設定は SSE-S3', tone: '#cfe8b8' }],
      chips: [ENC('SSE-S3（初期設定）'), KEY('S3 が管理'), LOG('—')],
      card: { title: 'バケット reports の暗号化', lines: ['方式：SSE-S3（初期設定）', '鍵：S3 が管理する鍵', 'アルゴリズム：AES-256'], highlight: 0 },
    },
    {
      short: 'SSE-KMS', tag: '基礎', title: 'SSE-KMS：KMS の鍵で暗号化する',
      body: [
        'バケットの暗号化を **{{ssekms:SSE-KMS}}** にして、自分で作った **{{kmskey:KMS キー}}**（カスタマー管理キー）を指定します。',
        'オブジェクトを保存するとき、S3 は KMS に **{{datakey:データキー}}**を作ってもらいます（GenerateDataKey）。KMS は、**そのままの（平文の）データキー**と、**KMS キーで暗号化したデータキー**の2つを返します。',
      ],
      note: 'KMS キーそのものは、KMS の外に平文で出ることはありません。外に出るのはデータキーだけです。',
      changes: [
        { kind: 'add', text: 'KMS でカスタマー管理キー reports-key を作成' },
        { kind: 'mod', text: 'バケットのデフォルト暗号化：SSE-KMS（reports-key）' },
      ],
      focus: ['app', 's3', 'kms'],
      flows: [
        { path: ['app', 's3'], color: 'req', packet: pk(APP, BUCKET, 'PutObject', '2026-11.csv を保存') },
        { path: ['s3', 'kms'], color: 'out', delay: 0.35, packet: pk('S3', KEYNAME, 'GenerateDataKey', 'データキーを作って') },
        { path: ['kms', 's3'], color: 'res', delay: 0.7, packet: pk(KEYNAME, 'S3', '応答', '平文のデータキー ＋ 暗号化したデータキー') },
      ],
      callouts: [{ node: 'kms', text: 'データキーを発行', tone: '#f6e2a4' }],
      chips: [ENC('SSE-KMS', 'good'), KEY('カスタマー管理キー'), LOG('—')],
      card: { title: 'GenerateDataKey の応答', lines: ['Plaintext：平文のデータキー', 'CiphertextBlob：KMS キーで暗号化したデータキー'], highlight: 1 },
    },
    {
      short: 'エンベロープ', tag: '基礎', title: 'エンベロープ暗号化：鍵を、別の鍵で包む',
      body: [
        'S3 は、**平文のデータキーでオブジェクトを暗号化**し、使い終わった平文のデータキーはすぐに捨てます。**暗号化したデータキー**は、オブジェクトと一緒に保存します。',
        '読み出すときは、S3 が暗号化したデータキーを KMS に送って**復号してもらい**（Decrypt）、それでオブジェクトを復号します。データを鍵で、その鍵をさらに KMS キーで包むので、{{envelope:エンベロープ暗号化}}（封筒の暗号化）と呼びます。',
      ],
      note: 'KMS に直接渡して暗号化できるデータは 4KB までです。大きなデータはデータキーで暗号化し、KMS にはデータキーだけを扱わせます。',
      changes: [],
      focus: ['app', 's3', 'kms'],
      flows: [
        { path: ['app', 's3'], color: 'req', packet: pk(APP, BUCKET, 'GetObject', '2026-11.csv を読む') },
        { path: ['s3', 'kms'], color: 'out', delay: 0.35, packet: pk('S3', KEYNAME, 'Decrypt', '暗号化したデータキーを復号して') },
        { path: ['kms', 's3', 'app'], color: 'res', delay: 0.7, packet: pk('S3', APP, '応答', 'データキーで復号したファイルを返す') },
      ],
      callouts: [{ node: 's3', text: 'データ＋包んだ鍵' }],
      chips: [ENC('SSE-KMS', 'good'), KEY('データキーを KMS キーで包む'), LOG('—')],
      card: { title: 'S3 に保存されているもの', lines: ['暗号化したデータ（データキーで暗号化）', '暗号化したデータキー（KMS キーで暗号化）', '平文のデータキー：保存しない'], highlight: 1 },
    },
    {
      short: 'キーポリシー', tag: 'テクニック', title: 'S3 の権限だけでは読めない',
      body: [
        'KMS キーには、**{{keypolicy:キーポリシー}}**（だれがこのキーを使えるか）が付いています。SSE-KMS で暗号化したオブジェクトを読むには、**s3:GetObject に加えて、KMS キーの kms:Decrypt の権限**が必要です。',
        '開発者 bob は S3 を読む権限は持っていますが、reports-key の kms:Decrypt を許可されていないので、**読み出しは失敗**します。データの置き場所の権限と、鍵の権限を**分けて管理できる**のが SSE-KMS の強みです。',
      ],
      note: 'KMS キーの使用（Decrypt など）は、すべて CloudTrail に記録されます。「だれがいつ、どのデータの鍵を使ったか」を後から調べられます。',
      changes: [{ kind: 'mod', text: 'キーポリシー：kms:Decrypt は app-role だけに許可' }],
      focus: ['dev', 's3', 'kms', 'ct'],
      flows: [
        { path: ['dev', 's3'], color: 'req', packet: pk(BOB, BUCKET, 'GetObject', 's3:GetObject は許可されている') },
        { path: ['s3', 'kms'], color: 'atk', fail: true, delay: 0.4, packet: pk('S3（bob として）', KEYNAME, 'Decrypt', '拒否（bob に kms:Decrypt がない）→ AccessDenied', false) },
        { path: ['kms', 'ct'], color: 'out', delay: 0.75, packet: pk('KMS', 'CloudTrail', 'イベントの記録', 'bob の Decrypt が拒否された') },
      ],
      callouts: [{ node: 'kms', text: '鍵の権限がない', tone: '#f3b7b0' }],
      chips: [ENC('SSE-KMS', 'good'), KEY('キーポリシーで制限', 'good'), LOG('CloudTrail に残る', 'good')],
      card: { title: 'reports-key のキーポリシー（抜粋）', lines: ['"Principal": "…:role/app-role",', '"Action": ["kms:Decrypt", "kms:GenerateDataKey"]', 'bob：許可なし'], highlight: 2 },
    },
    {
      short: 'ローテーション', tag: 'テクニック', title: 'キーのローテーション',
      body: [
        '同じ鍵を長く使い続けないように、KMS キーの**鍵の素材を定期的に新しく**できます（ローテーション）。',
        {
          list: [
            '**カスタマー管理キー**：自動ローテーションを有効にすると、**初期設定は1年ごと**。期間は **90〜2560日** で変えられる。',
            '**AWS 管理キー**（aws/s3 など）：AWS が**毎年自動で**ローテーションする。設定は変えられない。',
          ],
        },
        'ローテーションしても、キーの ID・ARN・ポリシーは変わりません。古い素材も残るので、**前に暗号化したデータもそのまま復号できます**。アプリの変更は要りません。',
      ],
      changes: [{ kind: 'mod', text: 'reports-key の自動ローテーションを有効化（365日ごと）' }],
      focus: ['kms', 's3'],
      flows: [
        { path: ['s3', 'kms'], color: 'out', packet: pk('S3', KEYNAME, 'Decrypt', '去年のデータキー → 古い素材で復号できる') },
        { path: ['s3', 'kms'], color: 'out', delay: 0.45, packet: pk('S3', KEYNAME, 'GenerateDataKey', '新しいデータ → 新しい素材で暗号化') },
      ],
      callouts: [{ node: 'kms', text: 'ID はそのまま' }],
      chips: [ENC('SSE-KMS', 'good'), KEY('1年ごとに新しい素材', 'good'), LOG('CloudTrail に残る', 'good')],
      card: { title: 'キーのローテーション', lines: ['カスタマー管理キー：任意（初期1年、90〜2560日）', 'AWS 管理キー：毎年自動（変更不可）', 'キー ID・ポリシー：変わらない'], highlight: 0 },
    },
    {
      short: '選び方', tag: '試験対策', title: 'S3 の暗号化方式の選び方',
      body: [
        {
          list: [
            '**SSE-S3**：初期設定。鍵の管理は S3 に任せる。追加の設定・料金なし。',
            '**SSE-KMS**：KMS キーで暗号化。**キーポリシーで使える人を絞れ、使用が CloudTrail に残る**。KMS へのリクエスト数の上限と料金に注意。',
            '**{{ssec:SSE-C}}**：鍵を**自分で用意し、リクエストのたびに渡す**。2026年4月から、新しいバケットでは初期設定で**無効**になった。',
            '**クライアント側暗号化**：アプリが暗号化してから S3 に送る。S3 には暗号化済みのデータしか届かない。',
          ],
        },
        '鍵を、他社と共有しない専用のハードウェア（HSM）で自分で管理したい場合は、**{{cloudhsm:CloudHSM}}** を使います。',
      ],
      changes: [],
      focus: ['app', 's3', 'kms', 'ct'],
      flows: [
        { path: ['app', 's3'], color: 'req', packet: pk(APP, BUCKET, 'PutObject', '保存') },
        { path: ['s3', 'kms'], color: 'out', delay: 0.35, packet: pk('S3', KEYNAME, 'GenerateDataKey', 'SSE-KMS なら KMS を使う') },
        { path: ['kms', 'ct'], color: 'out', delay: 0.7, packet: pk('KMS', 'CloudTrail', 'イベントの記録', '鍵の使用を記録') },
      ],
      callouts: [{ node: 'ct', text: '監査に強い', tone: '#cfe8b8' }],
      chips: [ENC('要件で選ぶ'), KEY('S3 / KMS / 自分'), LOG('SSE-KMS なら残る', 'good')],
      card: { title: '要件 → 暗号化の方式', lines: ['特に要件なし → SSE-S3', '鍵の使用を監査・権限を分けたい → SSE-KMS', '鍵を自分で持ちたい → SSE-C／クライアント側', '専用のHSMで管理 → CloudHSM'] },
    },
    {
      short: 'まとめ', tag: '試験対策', title: 'KMS と暗号化で押さえるポイント',
      body: [
        {
          list: [
            'S3 は初期設定で **SSE-S3** により自動で暗号化される。',
            '**SSE-KMS** は KMS キーでデータキーを作り、データキーでデータを暗号化する（**エンベロープ暗号化**）。',
            'SSE-KMS のデータを読むには、**s3:GetObject と kms:Decrypt の両方**が必要。キーの使用は **CloudTrail** に残る。',
            'カスタマー管理キーは自動ローテーションを選べる（初期1年、90〜2560日）。AWS 管理キーは毎年自動。',
            '専用の HSM で鍵を管理 → **CloudHSM**。',
          ],
        },
      ],
      changes: [],
      focus: ['app', 's3', 'kms', 'dev', 'ct'],
      flows: [
        { path: ['app', 's3', 'kms'], color: 'req', packet: pk(APP, BUCKET, 'GetObject', 'app-role は kms:Decrypt あり → 読める') },
        { path: ['dev', 's3'], color: 'atk', fail: true, delay: 0.45, packet: pk(BOB, BUCKET, 'GetObject', 'kms:Decrypt がない → 読めない', false) },
      ],
      callouts: [{ node: 'kms', text: '鍵の門番', tone: '#f6e2a4' }],
      chips: [ENC('SSE-KMS', 'good'), KEY('キーポリシーで制限', 'good'), LOG('CloudTrail に残る', 'good')],
      card: { title: '要件 → 使うもの', lines: ['鍵の使用を記録・権限を分ける → SSE-KMS', '大きなデータの暗号化 → エンベロープ暗号化', '鍵を定期的に新しく → 自動ローテーション', '専用ハードウェアで鍵管理 → CloudHSM'] },
      quiz: {
        question: 'S3 に保存する機密データを暗号化したい。暗号化の鍵を使える人を、バケットへのアクセス権とは別に管理し、鍵がいつ・だれに使われたかを監査できるようにしたい。最も適切な方法は？',
        options: [
          'S3 マネージドキーによるサーバー側暗号化（SSE-S3）を使う',
          'カスタマー管理の KMS キーによるサーバー側暗号化（SSE-KMS）を使う',
          'バケットポリシーで、HTTPS 以外のアクセスを拒否する',
          'S3 のバージョニングを有効にする',
        ],
        answer: 1,
        explanation: 'SSE-KMS でカスタマー管理キーを使うと、キーポリシーで鍵を使える人をバケットの権限とは別に絞れ、鍵の使用はすべて CloudTrail に記録されます。SSE-S3 は鍵を S3 が管理するため、鍵ごとの権限や使用の記録はできません。HTTPS の強制は通信の暗号化、バージョニングは上書き・削除への備えで、保存時の鍵の管理とは別の話です。',
      },
    },
  ],

  learn: [
    { text: 'S3 の初期設定の暗号化（SSE-S3）', atStep: 0 },
    { text: 'SSE-KMS とデータキー', atStep: 1 },
    { text: 'エンベロープ暗号化', atStep: 2 },
    { text: 'キーポリシーと kms:Decrypt', atStep: 3 },
    { text: 'キーのローテーション', atStep: 4 },
    { text: '暗号化方式の選び方', atStep: 5 },
  ],
  prev: { title: 'CloudWatch と CloudTrail', href: '/learn/cloudwatch-cloudtrail' },
  next: { title: 'ECS と Fargate' },
}
