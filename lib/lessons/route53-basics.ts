import type { Chip, Lesson, Packet } from './types'

const ANS = (v: string, tone?: Chip['tone']): Chip => ({ label: 'www.example.com の答え', value: v, tone })
const WHO = (v: string, tone?: Chip['tone']): Chip => ({ label: '答えたところ', value: v, tone })
const POL = (v: string, tone?: Chip['tone']): Chip => ({ label: 'ルーティングポリシー', value: v, tone })

// パケットの流れ表に出す通信（DNS は UDP 53 番）
const pk = (src: string, dst: string, proto: string, result: string, ok = true): Packet => ({ src, dst, proto, result, ok })
const USER = '198.51.100.7'
const RESOLVER = 'リゾルバー'
const R53 = 'Route 53'
const TOKYO = '203.0.113.10'
const OSAKA = '203.0.113.20'

const QUERY = { path: ['client', 'resolver', 'r53'], color: 'req' as const }
const ANSWER = { path: ['r53', 'resolver', 'client'], color: 'res' as const, delay: 0.35 }

export const route53BasicsLesson: Lesson = {
  slug: 'route53-basics',
  category: 'route53',
  lessonLabel: 'レッスン 1',
  title: 'DNSの仕組みとRoute 53',
  lead: 'ドメイン名からIPアドレスを引く流れを追いかけながら、ホストゾーン・レコード・TTL・ルーティングポリシーまでを1本で押さえる。',
  description:
    'DNSの名前解決の流れと Amazon Route 53 を、パケットが流れるアニメーション図解で学ぶ。ホストゾーンとNSレコード、A・CNAME・Aliasレコード、TTL、フェイルオーバーなどのルーティングポリシー、プライベートホストゾーンまでSAA頻出ポイントを解説。',
  minutes: 14,
  badge: '頻出',

  nodes: [
    { id: 'client', x: -3.2, y: 2.6, s: 0.5, h: 24, fill: '#f4efe6', label: 'ユーザー', kind: 'person', sub: USER },
    { id: 'resolver', x: -0.8, y: 4.8, s: 0.5, h: 30, fill: '#e9e4da', label: 'リゾルバー', fontSize: 11, term: 'resolver', sub: '名前解決の代行・キャッシュ' },
    { id: 'r53', x: 0.6, y: 0.2, s: 0.62, h: 40, fill: '#a8dcc5', label: 'Route 53', fontSize: 12, term: 'route53', sub: 'ホストゾーン example.com' },
    { id: 'albtk', x: 5.8, y: 1.2, s: 0.55, h: 34, fill: '#bcd4f0', label: 'ALB（東京）', fontSize: 10.5, kind: 'lb', term: 'alb', sub: TOKYO },
    { id: 'albos', x: 5.8, y: 4.4, s: 0.55, h: 34, fill: '#bcd4f0', label: 'ALB（大阪）', fontSize: 10.5, kind: 'lb', term: 'alb', sub: OSAKA },
    { id: 'app', x: 5.0, y: 0.9, s: 0.5, h: 34, fill: '#f6c191', label: 'EC2', kind: 'server', term: 'ec2', sub: '10.0.2.10' },
    { id: 'db', x: 7.4, y: 1.4, s: 0.55, h: 40, fill: '#d9cdf2', label: 'RDS', kind: 'cyl', term: 'rds', sub: 'db.corp.internal' },
  ],
  zones: [
    { x0: 4.2, y0: -0.2, x1: 8.2, y1: 2.6, fill: 'rgba(188,212,240,.35)', dash: '6 5', label: '東京リージョン', labelAt: 'top', term: 'region' },
    { x0: 4.2, y0: 3.4, x1: 8.2, y1: 5.8, fill: 'rgba(217,205,242,.35)', dash: '6 5', label: '大阪リージョン', labelAt: 'top', term: 'region' },
  ],

  steps: [
    {
      short: '全体像', tag: '概要', title: '名前からIPアドレスを引く流れ',
      body: [
        'ブラウザで www.example.com を開くと、まず{{resolver:リゾルバー}}（プロバイダや社内のDNSサーバー）に「このIPアドレスは？」と問い合わせます。リゾルバーは、そのドメインの答えを持っている**{{authoritative:権威DNSサーバー}}**まで聞きに行きます。',
        '**{{route53:Route 53}}**は、この権威DNSサーバーの役割をするAWSのサービスです。答えのIPアドレスが分かって初めて、ブラウザはそのサーバー（ここではALB）に接続します。',
      ],
      changes: [{ kind: 'add', text: 'Route 53 で example.com を管理' }],
      focus: ['client', 'resolver', 'r53', 'albtk'], hide: ['albos', 'app', 'db'],
      flows: [
        { ...QUERY, packet: pk(USER, RESOLVER, 'DNS（UDP 53）', 'www.example.com の A レコードは？') },
        { ...ANSWER, packet: pk(R53, USER, 'DNS 応答', `${TOKYO} を返す`) },
        { path: ['client', 'albtk'], color: 'out', delay: 0.7, packet: pk(USER, `${TOKYO}:443`, 'TCP 443（HTTPS）', '答えのIPに接続') },
      ],
      callouts: [{ node: 'r53', text: '答えを持っている' }],
      chips: [ANS(TOKYO), WHO('Route 53'), POL('シンプル')],
      card: { title: '名前解決の順番', lines: ['1. ユーザー → リゾルバーに質問', '2. リゾルバー → Route 53 に質問', '3. 答えのIPに接続'], highlight: 1 },
    },
    {
      short: 'ホストゾーン', tag: '基礎', title: 'ホストゾーンとNSレコード',
      body: [
        'Route 53 では、ドメインごとに{{hostedzone:ホストゾーン}}を作り、その中にレコードを登録します。作成すると、**NSレコード（4つのネームサーバー）**とSOAレコードが自動で入ります。',
        'ドメインをお名前.comなど他社で取得している場合は、**そのレジストラ側でネームサーバーをRoute 53のNS 4つに変更**します。これで、世界中のリゾルバーが example.com について Route 53 に聞きに来るようになります。',
      ],
      note: 'NSの変更が世界中に行き渡るまでには時間がかかります（変更前のNSレコードのTTL次第で、最大で2日程度）。ドメインの移行は余裕をもって行います。',
      changes: [
        { kind: 'add', text: 'ホストゾーン example.com を作成（NS・SOAが自動で入る）' },
        { kind: 'mod', text: 'レジストラのネームサーバーを Route 53 の4つに変更' },
      ],
      focus: ['resolver', 'r53'], hide: ['albos', 'app', 'db'],
      flows: [
        { path: ['resolver', 'r53'], color: 'req', packet: pk(RESOLVER, R53, 'DNS（UDP 53）', 'example.com の NS レコードは？') },
        { path: ['r53', 'resolver'], color: 'res', delay: 0.4, packet: pk(R53, RESOLVER, 'DNS 応答', 'ns-xxx.awsdns-xx.com など4つ') },
      ],
      callouts: [{ node: 'r53', text: 'NS 4つ＋SOA' }],
      chips: [ANS('—'), WHO('Route 53'), POL('—')],
      card: { title: 'ホストゾーン example.com', lines: ['example.com  NS   ns-123.awsdns-15.com ほか3つ', 'example.com  SOA  ns-123.awsdns-15.com …'], highlight: 0 },
    },
    {
      short: 'レコード', tag: '基礎', title: 'A・CNAME・Alias レコード',
      body: [
        '代表的なレコードは次のとおりです。',
        {
          list: [
            '**A**：名前 → IPv4アドレス（AAAA は IPv6）。',
            '**CNAME**：名前 → 別の名前。ただし、ドメインの最上位（example.com そのもの＝{{zoneapex:Zone Apex}}）には作れない。',
            '**{{alias:Alias}}**：Route 53 独自のレコード。ALB・CloudFront・S3 などのAWSリソースを指せて、**Zone Apex にも作れる**。AWSリソースへのAliasの問い合わせは**無料**。',
          ],
        },
        'example.com と www.example.com の両方をALBに向けるなら、どちらも Alias（Aレコード）にするのが定番です。',
      ],
      changes: [
        { kind: 'add', text: 'example.com を Alias（A）→ ALB に' },
        { kind: 'add', text: 'www.example.com も Alias（A）→ ALB に' },
      ],
      focus: ['client', 'resolver', 'r53', 'albtk'], hide: ['albos', 'app', 'db'],
      flows: [
        { ...QUERY, packet: pk(USER, RESOLVER, 'DNS（UDP 53）', 'example.com の A レコードは？') },
        { ...ANSWER, packet: pk(R53, USER, 'DNS 応答', `Alias → ALB の IP（${TOKYO}）を返す`) },
        { path: ['client', 'albtk'], color: 'out', delay: 0.7, packet: pk(USER, `${TOKYO}:443`, 'TCP 443（HTTPS）', '接続') },
      ],
      callouts: [{ node: 'albtk', text: 'Alias で直接指す' }],
      chips: [ANS(TOKYO), WHO('Route 53'), POL('シンプル')],
      card: { title: 'ホストゾーン example.com', lines: ['example.com      A      Alias → ALB', 'www.example.com  A      Alias → ALB', 'blog.example.com CNAME  example.hatenablog.com'], highlight: 0 },
    },
    {
      short: 'TTL', tag: 'テクニック', title: 'TTL とキャッシュ',
      body: [
        'リゾルバーは、受け取った答えを{{ttl:TTL}}（秒）の間だけキャッシュします。その間は Route 53 に聞きに行かず、**キャッシュから答えます**。',
        'つまり、レコードを書き換えても、**TTLが切れるまでは古い答えが返る**ことがあります。サーバーの切り替え前には、あらかじめTTLを短くしておくのが実務の定石です。',
      ],
      note: 'Alias レコードには自分でTTLを設定できず、指している先（ALBなど）のTTLが使われます。',
      changes: [{ kind: 'mod', text: '切り替えの前日に TTL を 300 → 60 秒に短縮' }],
      focus: ['client', 'resolver'], hide: ['albos', 'app', 'db'],
      flows: [
        { path: ['client', 'resolver'], color: 'req', packet: pk(USER, RESOLVER, 'DNS（UDP 53）', 'www.example.com の A レコードは？') },
        { path: ['resolver', 'client'], color: 'res', delay: 0.4, packet: pk(RESOLVER, USER, 'DNS 応答', `キャッシュから ${TOKYO}（TTL の残り 240 秒）`) },
      ],
      callouts: [{ node: 'resolver', text: 'TTLの間は覚えておく' }],
      chips: [ANS(TOKYO), WHO('リゾルバーのキャッシュ'), POL('シンプル')],
      card: { title: 'TTL の目安', lines: ['TTL 300 → 5分間はキャッシュが使われる', '切り替え前に TTL を 60 秒へ', '切り替え後、落ち着いたら戻す'], highlight: 1 },
    },
    {
      short: 'フェイルオーバー', tag: 'テクニック', title: 'フェイルオーバールーティングで大阪へ切り替える',
      body: [
        '{{failover:フェイルオーバールーティング}}では、プライマリ（東京）とセカンダリ（大阪）の2つのレコードを作り、プライマリに**{{healthcheck:ヘルスチェック}}**を付けます。',
        '東京が正常なあいだは東京のIPを、ヘルスチェックが失敗すると**大阪のIPを答えます**。DNSの答えを変えるだけで、利用者の接続先が切り替わります。',
      ],
      note: '切り替わるのは「新しく名前解決したとき」です。リゾルバーにキャッシュが残っている間は古い答えが使われるので、フェイルオーバーを使うレコードは TTL を短めにします。',
      changes: [
        { kind: 'add', text: 'プライマリ（東京）にヘルスチェックを設定' },
        { kind: 'add', text: 'セカンダリ（大阪）のレコードを追加' },
      ],
      focus: ['client', 'resolver', 'r53', 'albtk', 'albos'], hide: ['app', 'db'],
      flows: [
        { path: ['r53', 'albtk'], color: 'atk', fail: true, packet: pk(R53, `${TOKYO}:443/health`, 'ヘルスチェック', '失敗（東京で障害）', false) },
        { ...ANSWER, delay: 0.3, packet: pk(R53, USER, 'DNS 応答', `セカンダリの ${OSAKA} を返す`) },
        { path: ['client', 'albos'], color: 'out', delay: 0.65, packet: pk(USER, `${OSAKA}:443`, 'TCP 443（HTTPS）', '大阪に接続') },
      ],
      callouts: [{ node: 'albtk', text: 'ヘルスチェック失敗', tone: '#f3b7b0' }],
      chips: [ANS(OSAKA, 'good'), WHO('Route 53'), POL('フェイルオーバー')],
      card: { title: 'フェイルオーバーのレコード', lines: ['www  A  プライマリ   → 東京 ALB（ヘルスチェック）', 'www  A  セカンダリ   → 大阪 ALB'], highlight: 1 },
    },
    {
      short: 'ポリシー', tag: '試験対策', title: 'ルーティングポリシーの使い分け',
      body: [
        'Route 53 のルーティングポリシーは8種類あります。試験では「要件からどれを選ぶか」がよく問われます。',
        {
          list: [
            '**シンプル**：1つの答え（複数IPを登録しても、正常かどうかに関係なく全部返す）。',
            '**加重**：割合で振り分ける（例：新バージョンに10%だけ流す）。',
            '**レイテンシー**：利用者から遅延が最も小さいリージョンへ。',
            '**フェイルオーバー**：正常時はプライマリ、障害時はセカンダリ。',
            '**位置情報**：利用者の国・大陸で答えを変える（配信地域の制限にも）。',
            '**地理的近接性**：リソースまでの距離で振り分け、バイアスで範囲を調整。',
            '**IPベース**：利用者の送信元IPアドレスの範囲で答えを変える。',
            '**複数値回答**：正常なレコードを最大8つ返す（ヘルスチェック付き）。',
          ],
        },
      ],
      changes: [{ kind: 'mod', text: '例：加重ルーティングで新環境（大阪）に 10% だけ流す' }],
      focus: ['client', 'resolver', 'r53', 'albtk', 'albos'], hide: ['app', 'db'],
      flows: [
        { path: ['client', 'albtk'], color: 'out', packet: pk(USER, `${TOKYO}:443`, 'TCP 443（HTTPS）', '加重 90 → 東京') },
        { path: ['client', 'albos'], color: 'out', delay: 0.5, packet: pk(USER, `${OSAKA}:443`, 'TCP 443（HTTPS）', '加重 10 → 大阪（新環境）') },
      ],
      callouts: [{ node: 'albos', text: '10%だけ試す' }],
      chips: [ANS('90% 東京 / 10% 大阪'), WHO('Route 53'), POL('加重')],
      card: { title: '加重ルーティングのレコード', lines: ['www  A  重み 90 → 東京 ALB', 'www  A  重み 10 → 大阪 ALB'], highlight: 1 },
    },
    {
      short: 'プライベート', tag: 'テクニック', title: 'プライベートホストゾーンで社内向けの名前',
      body: [
        '{{privatezone:プライベートホストゾーン}}は、**関連付けたVPCの中だけ**で使える名前を作る仕組みです。たとえば db.corp.internal を RDS のプライベートIPに向けると、EC2 はIPアドレスではなく名前でDBにつなげます。',
        'インターネットからはこの名前を引けないので、社内システムの構成を外に見せずに済みます。',
      ],
      note: 'プライベートホストゾーンを使うには、VPCの「DNS解決」と「DNSホスト名」の設定を両方とも有効にしておく必要があります。',
      changes: [
        { kind: 'add', text: 'プライベートホストゾーン corp.internal を作成し、VPCに関連付け' },
        { kind: 'add', text: 'db.corp.internal → RDS のプライベートIP' },
      ],
      focus: ['app', 'r53', 'db'], hide: ['albtk', 'albos'],
      flows: [
        { path: ['app', 'r53'], color: 'req', packet: pk('10.0.2.10', 'VPC の DNS（Route 53）', 'DNS（UDP 53）', 'db.corp.internal の A レコードは？') },
        { path: ['r53', 'app'], color: 'res', delay: 0.35, packet: pk('Route 53', '10.0.2.10', 'DNS 応答', '10.0.3.10 を返す（VPC内だけ）') },
        { path: ['app', 'db'], color: 'out', delay: 0.7, packet: pk('10.0.2.10', '10.0.3.10:3306', 'TCP 3306（MySQL）', '名前でDBに接続') },
      ],
      callouts: [{ node: 'db', text: 'VPC内だけ' }],
      chips: [ANS('—'), WHO('Route 53（プライベート）'), POL('シンプル')],
      card: { title: 'プライベートホストゾーン corp.internal', lines: ['db.corp.internal  A  10.0.3.10', '関連付けたVPC：本番VPC'], highlight: 0 },
    },
    {
      short: 'まとめ', tag: '試験対策', title: 'Route 53 で押さえるポイント',
      body: [
        {
          list: [
            'Route 53 は**権威DNSサーバー**。ドメインごとに**ホストゾーン**を作り、レジストラのNSをRoute 53に向ける。',
            '**Zone Apex（example.com）には CNAME を作れない** → AWSリソースなら Alias。Aliasの問い合わせは無料。',
            '**TTL** の間はキャッシュが使われる。切り替え前にTTLを短くする。',
            '「障害時だけ切り替え」→ フェイルオーバー、「割合で」→ 加重、「速いリージョンへ」→ レイテンシー、「国ごとに」→ 位置情報、「正常なものだけ複数」→ 複数値回答。',
            'VPC内だけの名前 → プライベートホストゾーン。',
          ],
        },
      ],
      changes: [],
      focus: ['client', 'resolver', 'r53', 'albtk', 'albos'], hide: ['app', 'db'],
      flows: [
        { ...QUERY, packet: pk(USER, RESOLVER, 'DNS（UDP 53）', 'www.example.com の A レコードは？') },
        { ...ANSWER, packet: pk(R53, USER, 'DNS 応答', `${TOKYO} を返す（東京が正常）`) },
        { path: ['client', 'albtk'], color: 'out', delay: 0.7, packet: pk(USER, `${TOKYO}:443`, 'TCP 443（HTTPS）', '接続') },
      ],
      callouts: [{ node: 'r53', text: '答えを変えて振り分け', tone: '#f6e2a4' }],
      chips: [ANS(TOKYO), WHO('Route 53'), POL('要件で選ぶ')],
      card: { title: '要件 → ポリシー', lines: ['障害時だけ切り替え → フェイルオーバー', '割合で振り分け → 加重', '速いリージョンへ → レイテンシー', '国ごとに出し分け → 位置情報'] },
      quiz: {
        question: '東京リージョンのALBで運用しているサイトを、東京に障害が起きたときだけ大阪リージョンの待機環境に切り替えたい。Route 53 で最も適切な設定は？',
        options: [
          '加重ルーティングで、東京と大阪に 50% ずつ振り分ける',
          'フェイルオーバールーティングで東京をプライマリにし、ヘルスチェックを設定する',
          'レイテンシーベースルーティングで、東京と大阪のレコードを作る',
          'シンプルルーティングで、1つのレコードに東京と大阪の両方のIPを登録する',
        ],
        answer: 1,
        explanation: 'フェイルオーバールーティングは、プライマリのヘルスチェックが失敗したときだけセカンダリを答えます。加重とレイテンシーは平常時から大阪にも振り分けてしまいます。シンプルルーティングは、正常かどうかに関係なく登録したIPをすべて返すため、障害が起きた東京のIPも返ってしまいます。',
      },
    },
  ],

  learn: [
    { text: '名前解決の流れと権威DNS', atStep: 0 },
    { text: 'ホストゾーンとNSレコード', atStep: 1 },
    { text: 'A・CNAME・Alias と Zone Apex', atStep: 2 },
    { text: 'TTL とキャッシュ', atStep: 3 },
    { text: 'ルーティングポリシーの使い分け', atStep: 5 },
    { text: 'プライベートホストゾーン', atStep: 6 },
  ],
  prev: { title: 'VPCエンドポイント', href: '/learn/vpc-endpoint' },
  next: { title: 'ELBとAuto Scaling', href: '/learn/elb-asg' },
}
