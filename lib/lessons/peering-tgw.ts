import type { Chip, Lesson } from './types'

const HOW = (v: string): Chip => ({ label: '接続方式', value: v })
const AC = (v: string, tone?: Chip['tone']): Chip => ({ label: 'A → C の通信', value: v, tone })
const NUM = (v: string, tone?: Chip['tone']): Chip => ({ label: '接続の本数', value: v, tone })

const PCX = ['pcxab', 'pcxbc', 'pcxac']

export const peeringTgwLesson: Lesson = {
  slug: 'peering-tgw',
  category: 'vpc',
  chapter: '01. VPC・ネットワーク',
  lessonLabel: 'レッスン 3 / 4',
  title: 'ピアリングとTransit Gateway',
  lead: '2つならピアリング、たくさんならTransit Gateway。VPC同士をつなぐ2つの方法と、その限界を通信を流して確かめる。',
  description:
    'VPCピアリングとTransit Gatewayの違いを、パケットが流れるアニメーション図解で学ぶ。非推移的ルーティングの落とし穴、フルメッシュの本数、オンプレミス接続の集約までSAA頻出ポイントを解説。',
  minutes: 11,
  badge: '頻出',

  nodes: [
    { id: 'a', x: 1.3, y: 1.3, s: 0.5, h: 34, fill: '#f6c191', label: 'EC2 (A)', fontSize: 12, term: 'ec2' },
    { id: 'b', x: 5.7, y: 1.3, s: 0.5, h: 34, fill: '#f6c191', label: 'EC2 (B)', fontSize: 12, term: 'ec2' },
    { id: 'c', x: 10.1, y: 1.3, s: 0.5, h: 34, fill: '#f6c191', label: 'EC2 (C)', fontSize: 12, term: 'ec2' },
    { id: 'pcxab', x: 3.5, y: 1.3, s: 0.36, h: 20, fill: '#d9cdf2', label: 'pcx', fontSize: 11, term: 'peering' },
    { id: 'pcxbc', x: 7.9, y: 1.3, s: 0.36, h: 20, fill: '#d9cdf2', label: 'pcx', fontSize: 11, term: 'peering' },
    // pcx-ac と TGW は同じ位置。同時には表示しない（各ステップの hide で出し分け）
    { id: 'pcxac', x: 5.7, y: 4.4, s: 0.36, h: 20, fill: '#d9cdf2', label: 'pcx', fontSize: 11, term: 'peering' },
    { id: 'tgw', x: 5.7, y: 4.4, s: 0.62, h: 32, fill: '#f6e2a4', label: 'TGW', term: 'tgw' },
    { id: 'onprem', x: 1.0, y: 6.6, s: 0.55, h: 26, fill: '#e9e4da', label: 'オンプレミス', fontSize: 10.5, term: 'onprem' },
  ],
  zones: [
    { x0: 0, y0: 0, x1: 2.6, y1: 2.6, fill: 'rgba(207,232,184,.45)', dash: '8 6', label: 'VPC A 10.0.0.0/16', labelAt: 'top', term: 'vpc' },
    { x0: 4.4, y0: 0, x1: 7, y1: 2.6, fill: 'rgba(188,212,240,.45)', dash: '8 6', label: 'VPC B 10.1.0.0/16', labelAt: 'top', term: 'vpc' },
    { x0: 8.8, y0: 0, x1: 11.4, y1: 2.6, fill: 'rgba(217,205,242,.5)', dash: '8 6', label: 'VPC C 10.2.0.0/16', labelAt: 'top', term: 'vpc' },
  ],

  steps: [
    {
      short: '全体像', tag: '概要', title: 'VPC同士は、そのままでは話せない',
      body: [
        '{{vpc:VPC}}はそれぞれ独立したネットワークです。同じアカウントの中にあっても、何もしなければVPC同士は通信できません。',
        'このレッスンでは、3つのVPC（A・B・C）をつなぐ2つの方法、**{{peering:VPCピアリング}}**と**{{tgw:Transit Gateway}}**を比べます。',
      ],
      changes: [{ kind: 'add', text: 'CIDRが重ならない3つのVPCを用意' }],
      focus: 'all', hide: [...PCX, 'tgw', 'onprem'],
      flows: [], callouts: [],
      chips: [HOW('なし'), AC('不可', 'bad'), NUM('0')],
      card: { title: 'VPCのCIDR', lines: ['VPC A  10.0.0.0/16', 'VPC B  10.1.0.0/16', 'VPC C  10.2.0.0/16'] },
    },
    {
      short: 'ピアリング', tag: '基礎', title: 'VPCピアリングで1対1につなぐ',
      body: [
        '{{peering:VPCピアリング}}は、2つのVPCを1対1でつなぐ接続です。通信はAWSのネットワーク内で完結し、インターネットを経由しません。',
        'ただし、接続を作っただけでは通りません。**両方のVPCの{{rt:ルートテーブル}}**に「相手のCIDR → ピアリング接続（pcx）」を追加して、初めて通信できます。',
      ],
      note: 'CIDRが重なっているVPC同士は、ピアリングを作成できません。試験の引っかけとして頻出です。',
      changes: [
        { kind: 'add', text: 'A–B間にピアリング接続（pcx）を作成' },
        { kind: 'add', text: 'A・B両方のルートテーブルに相手のCIDRを追加' },
      ],
      focus: ['a', 'b', 'pcxab'], hide: ['pcxbc', 'pcxac', 'tgw', 'onprem'],
      flows: [
        { path: ['a', 'pcxab', 'b'], color: 'req' },
        { path: ['b', 'pcxab', 'a'], color: 'res', delay: 0.45 },
      ],
      callouts: [{ node: 'pcxab', text: '1対1の接続' }],
      chips: [HOW('ピアリング'), AC('不可', 'bad'), NUM('1')],
      card: { title: 'VPC A のルートテーブル', lines: ['10.0.0.0/16 → local', '10.1.0.0/16 → pcx-ab'], highlight: 1 },
    },
    {
      short: '非推移的', tag: '落とし穴', title: 'Bを経由してCには行けない',
      body: [
        'さらにBとCもピアリングでつなぎました。A–B、B–Cがつながっているので、AからBを経由してCに届きそうに見えます。',
        'しかし、**ピアリングは非推移的**です。BはほかのVPC宛ての通信を中継しないので、AからCへは届きません。',
      ],
      changes: [{ kind: 'add', text: 'B–C間にもピアリング接続を作成' }],
      focus: ['a', 'b', 'c', 'pcxab', 'pcxbc'], hide: ['pcxac', 'tgw', 'onprem'],
      flows: [
        { path: ['a', 'pcxab', 'b'], color: 'atk', fail: true },
        { path: ['b', 'pcxbc', 'c'], color: 'req', delay: 0.5 },
      ],
      callouts: [{ node: 'b', text: 'Bは中継しない', tone: '#f3b7b0' }],
      chips: [HOW('ピアリング'), AC('不可', 'bad'), NUM('2')],
      card: { title: '接続の状態', lines: ['A–B：ピアリング済み', 'B–C：ピアリング済み', 'A–C：つながっていない'], highlight: 2 },
    },
    {
      short: '直接接続', tag: 'テクニック', title: 'AとCも直接つなぐ',
      body: [
        '解決策の1つは、AとCの間にも直接ピアリングを作ることです。通信したいペアごとに、接続とルートが必要になります。',
        'VPCが3つなら3本で済みます。しかし全部を相互につなぐ（フルメッシュ）と、VPCがn個のとき **n(n−1)/2 本**必要です。10個なら45本になり、管理しきれません。',
      ],
      changes: [{ kind: 'add', text: 'A–C間に直接ピアリング接続を作成' }],
      focus: ['a', 'b', 'c', ...PCX], hide: ['tgw', 'onprem'],
      flows: [
        { path: ['a', 'pcxac', 'c'], color: 'req' },
        { path: ['c', 'pcxac', 'a'], color: 'res', delay: 0.45 },
      ],
      callouts: [{ node: 'pcxac', text: 'ペアごとに1本' }],
      chips: [HOW('ピアリング'), AC('可', 'good'), NUM('3')],
      card: { title: 'フルメッシュに必要な本数', lines: ['VPC 3個 →  3本', 'VPC 5個 → 10本', 'VPC 10個 → 45本'], highlight: 2 },
    },
    {
      short: 'TGW', tag: 'テクニック', title: 'Transit Gatewayでハブにまとめる',
      body: [
        '{{tgw:Transit Gateway（TGW）}}は、たくさんのVPCをつなぐハブです。各VPCはTGWに1本ずつ{{attach:アタッチ}}するだけで、TGWを経由して互いに通信できます。',
        'ピアリングと違い、**TGWは通信を中継します**。VPCが増えても、接続はVPCの数だけで済みます。',
      ],
      note: 'TGWを使う場合も、各VPCのルートテーブルに「相手のCIDR → TGW」のルートが必要です。さらにTGW側のルートテーブルで、どのVPC同士を通すかを制御できます。',
      changes: [
        { kind: 'add', text: 'TGWを作成し、3つのVPCをアタッチ' },
        { kind: 'mod', text: 'ピアリング接続は不要になる' },
      ],
      focus: ['a', 'b', 'c', 'tgw'], hide: [...PCX, 'onprem'],
      flows: [
        { path: ['a', 'tgw', 'c'], color: 'req' },
        { path: ['c', 'tgw', 'a'], color: 'res', delay: 0.45 },
        { path: ['b', 'tgw'], color: 'req', delay: 0.2 },
      ],
      callouts: [{ node: 'tgw', text: 'ハブで中継' }],
      chips: [HOW('Transit Gateway'), AC('可', 'good'), NUM('3（VPCの数）', 'good')],
      card: { title: 'VPC A のルートテーブル', lines: ['10.1.0.0/16 → tgw-0123', '10.2.0.0/16 → tgw-0123'], highlight: 1 },
    },
    {
      short: 'オンプレ', tag: 'テクニック', title: 'オンプレミスもTGWに集める',
      body: [
        'TGWには、VPCだけでなく{{vpn:Site-to-Site VPN}}や{{dx:Direct Connect}}（Direct Connectゲートウェイ経由）もつなげられます。',
        'オンプレミスのデータセンターから、**1か所の接続で**すべてのVPCに届くようになります。VPCごとにVPNを張る必要はありません。',
      ],
      changes: [{ kind: 'add', text: 'Site-to-Site VPNをTGWにアタッチ' }],
      focus: ['onprem', 'tgw', 'b', 'a', 'c'], hide: [...PCX],
      flows: [
        { path: ['onprem', 'tgw', 'b'], color: 'req' },
        { path: ['b', 'tgw', 'onprem'], color: 'res', delay: 0.45 },
      ],
      callouts: [{ node: 'onprem', text: 'VPN 1本で全VPCへ' }],
      chips: [HOW('Transit Gateway'), AC('可', 'good'), NUM('4（VPC＋VPN）', 'good')],
      card: { title: 'TGWのアタッチメント', lines: ['VPC A / VPC B / VPC C', 'Site-to-Site VPN（オンプレミス）'], highlight: 1 },
    },
    {
      short: 'まとめ', tag: '試験対策', title: 'ピアリングとTGWの使い分け',
      body: [
        {
          list: [
            '**ピアリング**：1対1。非推移的。CIDRが重なると作れない。接続そのものに時間料金がかからず、少数のVPCなら手軽。',
            '**Transit Gateway**：ハブ&スポーク。通信を中継する。VPN・Direct Connectも1か所に集約できる。アタッチメントごとの時間料金とデータ処理料金がかかる。',
            '「A–B、B–Cがピアリング済み。AからCへ通信できるか？」→ **できない**。答えは、直接ピアリングの追加かTGW。',
          ],
        },
      ],
      changes: [],
      focus: 'all', hide: [...PCX],
      flows: [
        { path: ['a', 'tgw', 'c'], color: 'req' },
        { path: ['onprem', 'tgw', 'b'], color: 'req', delay: 0.5 },
      ],
      callouts: [{ node: 'tgw', text: '数が多ければTGW', tone: '#f6e2a4' }],
      chips: [HOW('Transit Gateway'), AC('可', 'good'), NUM('VPCの数＋VPN', 'good')],
      card: { title: '選び方', lines: ['VPCが少ない・1対1 → ピアリング', 'VPCが多い・オンプレも → TGW'] },
      quiz: {
        question: '50個のVPCと、オンプレミスのデータセンターを相互に接続したい。運用の手間が最も少ない方法は？',
        options: [
          'すべてのVPC間にVPCピアリングを作成し、各VPCからオンプレミスへVPN接続を作る',
          'Transit Gatewayを作成し、各VPCとSite-to-Site VPNをアタッチする',
          '1つのVPCをハブにして、ほかのVPCとピアリングで接続する',
          '各VPCにインターネットゲートウェイを付け、インターネット経由で通信する',
        ],
        answer: 1,
        explanation: 'ピアリングで全VPCを相互につなぐと1,225本必要になり、管理できません（A）。ピアリングは非推移的なので、ハブ役のVPCを経由した通信はできません（C）。Dはプライベートな接続になりません。',
      },
    },
  ],

  learn: [
    { text: 'ピアリングとルートテーブルの設定', atStep: 1 },
    { text: '非推移的という落とし穴', atStep: 2 },
    { text: 'フルメッシュの本数と限界', atStep: 3 },
    { text: 'TGWによるハブ&スポーク', atStep: 4 },
    { text: 'オンプレミス接続の集約', atStep: 5 },
  ],
  prev: { title: 'SGとNACL', href: '/learn/sg-nacl' },
  next: { title: 'VPCエンドポイント' },
}
