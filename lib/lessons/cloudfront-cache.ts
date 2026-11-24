import type { Chip, Lesson, Packet } from './types'

const WHO = (v: string, tone?: Chip['tone']): Chip => ({ label: '答えたところ', value: v, tone })
const CACHE = (v: string, tone?: Chip['tone']): Chip => ({ label: 'キャッシュ', value: v, tone })
const S3D = (v: string, tone?: Chip['tone']): Chip => ({ label: 'S3 への直接アクセス', value: v, tone })

// パケットの流れ表に出す通信
const pk = (src: string, dst: string, proto: string, result: string, ok = true): Packet => ({ src, dst, proto, result, ok })
const USER = '198.51.100.7'
const CF = 'd111.cloudfront.net'
const IMG = '/images/logo.png'
const HTTPS = 'HTTPS GET'

export const cloudfrontCacheLesson: Lesson = {
  slug: 'cloudfront-cache',
  category: 'cloudfront',
  lessonLabel: 'レッスン 1',
  title: 'CloudFront とキャッシュ',
  lead: '利用者の近くでコンテンツを返すCDN、CloudFront。キャッシュのヒットとミス、TTL、S3を守るOAC、そしてよく比べられるGlobal Acceleratorまで。',
  description:
    'Amazon CloudFront の仕組みを、リクエストが流れるアニメーション図解で学ぶ。エッジロケーション、キャッシュヒットとミス、TTLと無効化、パスごとのオリジン、OAC、署名付きURL、AWS Global Accelerator との違いまでSAA頻出ポイントを解説。',
  minutes: 13,
  badge: '頻出',

  nodes: [
    { id: 'user', x: -3.6, y: 1.0, s: 0.5, h: 24, fill: '#f4efe6', label: 'ユーザー', kind: 'person', sub: USER },
    { id: 'edge', x: -0.8, y: 2.4, s: 0.6, h: 34, fill: '#f3b7b0', label: 'エッジ', fontSize: 11, term: 'edge', sub: 'CloudFront（大阪）' },
    { id: 's3', x: 3.6, y: -0.2, s: 0.58, h: 42, fill: '#cfe8b8', label: 'S3', kind: 'cyl', term: 'origin', sub: 'オリジン：画像' },
    { id: 'alb', x: 3.6, y: 3.0, s: 0.58, h: 32, fill: '#bcd4f0', label: 'ALB', term: 'origin', sub: 'オリジン：API' },
    { id: 'ga', x: -0.8, y: 5.2, s: 0.6, h: 30, fill: '#d9cdf2', label: 'GA', term: 'globalaccel', sub: '固定IP 2つ' },
  ],
  zones: [
    { x0: 2.6, y0: -1.2, x1: 4.6, y1: 4.2, fill: 'rgba(188,212,240,.3)', dash: '6 5', label: '東京リージョン', labelAt: 'top', term: 'region' },
  ],

  steps: [
    {
      short: '全体像', tag: '概要', title: '利用者の近くのエッジから返す',
      body: [
        '{{cloudfront:CloudFront}}は、AWSのCDN（コンテンツ配信ネットワーク）です。世界中にある{{edge:エッジロケーション}}がリクエストを受け、近くの利用者に返します。',
        '最初のリクエストでは、エッジにはまだファイルがありません（**キャッシュミス**）。エッジは元のサーバー（{{origin:オリジン}}、ここでは S3）から取ってきて利用者に返し、同時に**エッジに保存（キャッシュ）**します。',
      ],
      changes: [
        { kind: 'add', text: 'CloudFront のディストリビューションを作成（オリジン：S3）' },
        { kind: 'mod', text: '画像の URL を d111.cloudfront.net に変更' },
      ],
      focus: ['user', 'edge', 's3'],
      flows: [
        { path: ['user', 'edge'], color: 'req', packet: pk(USER, CF, HTTPS, `${IMG} を要求`) },
        { path: ['edge', 's3'], color: 'out', delay: 0.3, packet: pk('エッジ（大阪）', 'S3（東京）', HTTPS, 'キャッシュミス → オリジンから取得') },
        { path: ['s3', 'edge', 'user'], color: 'res', delay: 0.65, packet: pk('エッジ（大阪）', USER, '応答', '返しながらエッジに保存') },
      ],
      callouts: [{ node: 'edge', text: 'キャッシュミス' }],
      chips: [WHO('オリジン（S3）'), CACHE('ミス → 保存'), S3D('—')],
      card: { title: '1回目のリクエスト', lines: ['1. エッジにない（ミス）', '2. オリジンから取ってくる', '3. 返しながらエッジに保存'], highlight: 1 },
    },
    {
      short: 'ヒット', tag: '基礎', title: '2回目からはエッジがすぐ返す',
      body: [
        '同じファイルへの2回目以降のリクエストは、エッジのキャッシュから**そのまま返します**（**キャッシュヒット**）。オリジンまで行かないので、利用者には**速く**届き、オリジンの**負荷も減ります**。',
        '画像・CSS・動画など、誰が見ても同じ内容のファイル（静的コンテンツ）ほど効果が大きくなります。',
      ],
      changes: [],
      focus: ['user', 'edge'],
      flows: [
        { path: ['user', 'edge'], color: 'req', packet: pk(USER, CF, HTTPS, `${IMG} を要求`) },
        { path: ['edge', 'user'], color: 'res', delay: 0.35, packet: pk('エッジ（大阪）', USER, '応答', 'キャッシュヒット → すぐ返す') },
      ],
      callouts: [{ node: 'edge', text: 'キャッシュヒット', tone: '#cfe8b8' }],
      chips: [WHO('エッジ（大阪）', 'good'), CACHE('ヒット', 'good'), S3D('—')],
      card: { title: '2回目のリクエスト', lines: ['エッジにある（ヒット）', 'オリジンには行かない', '速い・オリジンの負荷が減る'], highlight: 0 },
    },
    {
      short: 'TTL', tag: '基礎', title: 'TTL：どれだけの間キャッシュするか',
      body: [
        'エッジがファイルをキャッシュしておく時間を {{ttl:TTL}} といいます。オリジンが Cache-Control ヘッダーを返さない場合は、キャッシュポリシーの**デフォルトTTL（初期設定は 86,400秒＝24時間）**が使われます。',
        'TTL が切れると、次のリクエストでエッジはオリジンに**新しい版があるか確認**します。',
      ],
      note: 'TTL が切れる前にファイルを差し替えたいときは、CloudFront で**無効化（Invalidation）**を実行して、エッジのキャッシュを消します。ファイル名にバージョンを付ける（logo.v2.png）方法もよく使われます。',
      changes: [{ kind: 'mod', text: 'オリジンの画像に Cache-Control: max-age=604800（7日）を付ける' }],
      focus: ['user', 'edge', 's3'],
      flows: [
        { path: ['user', 'edge'], color: 'req', packet: pk(USER, CF, HTTPS, `${IMG} を要求（TTL 切れ）`) },
        { path: ['edge', 's3'], color: 'out', delay: 0.3, packet: pk('エッジ（大阪）', 'S3（東京）', '条件付き GET', '変わっていないか確認') },
        { path: ['s3', 'edge', 'user'], color: 'res', delay: 0.65, packet: pk('エッジ（大阪）', USER, '応答', '最新の版を返して、またキャッシュ') },
      ],
      callouts: [{ node: 'edge', text: 'TTL が切れたら確認' }],
      chips: [WHO('エッジ（確認後）'), CACHE('TTL 切れ → 確認'), S3D('—')],
      card: { title: 'キャッシュの時間', lines: ['Cache-Control なし → デフォルトTTL（24時間）', 'Cache-Control: max-age=604800 → 7日', '急いで消したい → 無効化（Invalidation）'], highlight: 0 },
    },
    {
      short: 'オリジン', tag: 'テクニック', title: 'パスごとにオリジンとキャッシュを変える',
      body: [
        '1つのディストリビューションに、**複数のオリジン**を登録できます。**キャッシュビヘイビア**でパスのパターンごとに、どのオリジンに送るかとキャッシュの設定を決めます。',
        {
          list: [
            '/images/* → S3（静的なので、長くキャッシュ）',
            '/api/* → ALB（動的なので、キャッシュしない）',
          ],
        },
        'キャッシュしない動的なリクエストでも、利用者の近くのエッジからAWSのネットワークを通ってオリジンに届くので、速くなることがあります。',
      ],
      changes: [
        { kind: 'add', text: 'オリジンに ALB を追加' },
        { kind: 'add', text: 'ビヘイビア：/api/* → ALB（キャッシュしない）' },
      ],
      focus: ['user', 'edge', 's3', 'alb'],
      flows: [
        { path: ['user', 'edge'], color: 'req', packet: pk(USER, CF, HTTPS, `${IMG} → キャッシュヒット`) },
        { path: ['user', 'edge', 'alb'], color: 'req', delay: 0.4, packet: pk(USER, CF, HTTPS, '/api/cart → ALB に転送（キャッシュしない）') },
        { path: ['alb', 'edge', 'user'], color: 'res', delay: 0.8, packet: pk('ALB（東京）', USER, '応答', 'カートの中身を返す') },
      ],
      callouts: [{ node: 'alb', text: '/api/* はこちら' }],
      chips: [WHO('パスで振り分け'), CACHE('画像だけキャッシュ', 'good'), S3D('—')],
      card: { title: 'キャッシュビヘイビア', lines: ['/images/*  → S3   （キャッシュ：長め）', '/api/*     → ALB  （キャッシュ：しない）', 'デフォルト → S3'], highlight: 1 },
    },
    {
      short: 'OAC', tag: '基礎', title: 'OAC：S3 は CloudFront からしか読めなくする',
      body: [
        'S3 の URL を直接知られると、CloudFront を通らずにファイルを取られてしまいます。署名付きURLや地域制限など、CloudFront に設定した守りも効きません。',
        '{{oac:OAC（オリジンアクセスコントロール）}}を設定し、**バケットポリシーで CloudFront からのアクセスだけを許可**すると、S3 は**CloudFront 経由でしか読めなく**なります。以前の OAI よりも、OAC の利用がすすめられています（SSE-KMS で暗号化したバケットにも対応）。',
      ],
      changes: [
        { kind: 'add', text: 'オリジン S3 に OAC を設定' },
        { kind: 'mod', text: 'バケットポリシー：CloudFront（このディストリビューション）からの GetObject だけ許可' },
      ],
      focus: ['user', 'edge', 's3'],
      flows: [
        { path: ['user', 'edge', 's3'], color: 'req', packet: pk(USER, CF, HTTPS, 'CloudFront 経由 → OAC の署名付きリクエストで取得') },
        { path: ['user', 's3'], color: 'atk', fail: true, delay: 0.5, packet: pk(USER, 'images-bucket.s3.amazonaws.com', HTTPS, '拒否（403：CloudFront 以外は許可していない）', false) },
      ],
      callouts: [{ node: 's3', text: 'CloudFront からだけ', tone: '#cfe8b8' }],
      chips: [WHO('エッジ'), CACHE('ヒット', 'good'), S3D('拒否', 'good')],
      card: { title: 'S3 のバケットポリシー（抜粋）', lines: ['"Principal": { "Service": "cloudfront.amazonaws.com" },', '"Action": "s3:GetObject",', '"Condition": このディストリビューションからだけ'], highlight: 0 },
    },
    {
      short: '署名付きURL', tag: 'テクニック', title: '有料コンテンツは署名付きURLで',
      body: [
        '会員だけが見られる動画など、**特定の人にだけ配りたい**ときは、{{signedurl:署名付きURL}}か署名付きCookieを使います。有効期限や、使えるIPアドレスを決めて発行し、署名が正しいリクエストだけをエッジが通します。',
        {
          list: [
            '**署名付きURL**：1つのファイルごとに発行する（例：ダウンロード1件）。',
            '**署名付きCookie**：複数のファイルをまとめて許可する（例：会員エリアの動画すべて）。',
          ],
        },
      ],
      changes: [{ kind: 'mod', text: 'ビヘイビア /videos/* で「署名付きURL・Cookie を必須」にする' }],
      focus: ['user', 'edge', 's3'],
      flows: [
        { path: ['user', 'edge', 's3'], color: 'req', packet: pk(USER, CF, HTTPS, '/videos/01.mp4?Expires=…&Signature=… → 許可') },
        { path: ['user', 'edge'], color: 'atk', fail: true, delay: 0.5, packet: pk(USER, CF, HTTPS, '/videos/01.mp4（署名なし）→ 拒否（403）', false) },
      ],
      callouts: [{ node: 'edge', text: '署名をチェック', tone: '#f6e2a4' }],
      chips: [WHO('エッジ'), CACHE('ヒット', 'good'), S3D('拒否', 'good')],
      card: { title: '署名付きURL と Cookie', lines: ['ファイル1つ → 署名付きURL', '複数のファイル → 署名付きCookie', 'どちらも有効期限を付けられる'] },
    },
    {
      short: 'GA との違い', tag: '試験対策', title: 'Global Accelerator との違い',
      body: [
        '{{globalaccel:Global Accelerator}}も、エッジから AWS のネットワークを通ってアプリに届けるサービスですが、**キャッシュはしません**。代わりに次の特徴があります。',
        {
          list: [
            '**固定の{{anycast:エニーキャスト}}IPアドレスが2つ**もらえ、世界中のエッジから同じIPで受ける。',
            '**TCP・UDP** をそのまま運べる（HTTP 以外のゲームや IoT にも）。',
            '複数のリージョンのエンドポイントをヘルスチェックし、異常なら**正常なリージョンへ切り替える**。',
          ],
        },
        '「HTTP のコンテンツをキャッシュして速く」なら CloudFront、「固定IP・UDP・リージョンの素早い切り替え」なら Global Accelerator です。',
      ],
      changes: [{ kind: 'add', text: 'Global Accelerator を作成（エンドポイント：東京の ALB）' }],
      focus: ['user', 'ga', 'alb'],
      flows: [
        { path: ['user', 'ga', 'alb'], color: 'req', packet: pk(USER, '75.2.x.x（固定のエニーキャストIP）', 'TCP 443', '近くのエッジから AWS のネットワーク経由で ALB へ') },
        { path: ['alb', 'ga', 'user'], color: 'res', delay: 0.5, packet: pk('ALB（東京）', USER, '応答', 'キャッシュはしない') },
      ],
      callouts: [{ node: 'ga', text: '固定IP・キャッシュなし' }],
      chips: [WHO('ALB（毎回オリジンへ）'), CACHE('しない'), S3D('—')],
      card: { title: 'CloudFront と Global Accelerator', lines: ['キャッシュ：する　　　／　しない', 'プロトコル：HTTP(S)　／　TCP・UDP', '入口　　　：ドメイン名／固定IP 2つ'] },
    },
    {
      short: 'まとめ', tag: '試験対策', title: 'CloudFront で押さえるポイント',
      body: [
        {
          list: [
            'CloudFront は**エッジでキャッシュ**して返す CDN。ヒットならオリジンに行かない。',
            '**TTL** の間はキャッシュを使う（Cache-Control がなければデフォルトTTL、初期設定24時間）。急ぐなら**無効化**。',
            '**キャッシュビヘイビア**でパスごとにオリジン（S3・ALB など）とキャッシュの設定を変える。',
            'S3 を CloudFront 経由でしか読めなくする → **OAC**＋バケットポリシー。',
            '特定の人にだけ配る → **署名付きURL**（1ファイル）／**署名付きCookie**（複数）。',
            '固定IP・UDP・リージョンの切り替え → **Global Accelerator**（キャッシュはしない）。',
          ],
        },
      ],
      changes: [],
      focus: ['user', 'edge', 's3', 'alb', 'ga'],
      flows: [
        { path: ['user', 'edge'], color: 'req', packet: pk(USER, CF, HTTPS, '画像 → キャッシュヒット') },
        { path: ['user', 'edge', 'alb'], color: 'req', delay: 0.35, packet: pk(USER, CF, HTTPS, 'API → ALB へ') },
        { path: ['user', 's3'], color: 'atk', fail: true, delay: 0.7, packet: pk(USER, 'S3 の URL', HTTPS, '直接は拒否（OAC）', false) },
      ],
      callouts: [{ node: 'edge', text: '近くで返す', tone: '#f6e2a4' }],
      chips: [WHO('エッジ'), CACHE('ヒット', 'good'), S3D('拒否', 'good')],
      card: { title: '要件 → 使うもの', lines: ['静的コンテンツを速く → CloudFront', 'S3 を直接読ませない → OAC', '会員だけに配る → 署名付きURL／Cookie', '固定IP・UDP → Global Accelerator'] },
      quiz: {
        question: '世界中のプレイヤーが UDP で接続するオンラインゲームのサーバーを、2つのリージョンで動かしている。プレイヤー側のファイアウォールで許可するため、接続先のIPアドレスを固定したい。また、片方のリージョンに障害が起きたら、すばやくもう一方に切り替えたい。最も適切なサービスは？',
        options: [
          'Amazon CloudFront',
          'AWS Global Accelerator',
          'Route 53 のレイテンシーベースルーティング',
          'S3 Transfer Acceleration',
        ],
        answer: 1,
        explanation: 'Global Accelerator は固定のエニーキャストIPアドレスを2つ提供し、TCP と UDP の両方に対応し、エンドポイントのヘルスチェックで正常なリージョンへ切り替えます。CloudFront は HTTP(S) のコンテンツ配信向けで、UDP は扱えません。Route 53 は DNS で答えを変えるだけなので、IPアドレスは固定されず、キャッシュが残る間は切り替わりません。',
      },
    },
  ],

  learn: [
    { text: 'エッジロケーションとキャッシュミス', atStep: 0 },
    { text: 'キャッシュヒットの効果', atStep: 1 },
    { text: 'TTL と無効化', atStep: 2 },
    { text: 'キャッシュビヘイビアと複数のオリジン', atStep: 3 },
    { text: 'OAC で S3 を守る', atStep: 4 },
    { text: '署名付きURL と署名付きCookie', atStep: 5 },
    { text: 'Global Accelerator との違い', atStep: 6 },
  ],
  prev: { title: 'EBS・EFS・FSx の使い分け', href: '/learn/ebs-efs-fsx' },
  next: { title: 'DynamoDB の基本', href: '/learn/dynamodb-basics' },
}
