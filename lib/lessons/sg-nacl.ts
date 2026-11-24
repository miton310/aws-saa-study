import type { Chip, Lesson, Packet } from './types'

// パケットの流れ表に出す通信（宛先は VPC 内で評価されるときのプライベートIP）
const USER_IP = '198.51.100.7:52344'
const ATK_IP = '203.0.113.9:40112'
const WEB_IP = '10.0.1.10'
const REQ = (result: string): Packet => ({ src: USER_IP, dst: `${WEB_IP}:443`, proto: 'TCP 443（HTTPS）', result, ok: true })
const RES = (result: string, ok: boolean): Packet => ({ src: `${WEB_IP}:443`, dst: USER_IP, proto: 'TCP 応答', result, ok })
const ATK443 = (result: string, ok: boolean): Packet => ({ src: ATK_IP, dst: `${WEB_IP}:443`, proto: 'TCP 443（HTTPS）', result, ok })

const SG = (v: string, tone?: Chip['tone']): Chip => ({ label: 'SG（インスタンス単位）', value: v, tone })
const NACL = (v: string, tone?: Chip['tone']): Chip => ({ label: 'NACL（サブネット単位）', value: v, tone })
const ATK = (v: string, tone?: Chip['tone']): Chip => ({ label: '攻撃者 203.0.113.9', value: v, tone })

export const sgNaclLesson: Lesson = {
  slug: 'sg-nacl',
  category: 'vpc',
  lessonLabel: 'レッスン 2 / 4',
  title: 'セキュリティグループとネットワークACL',
  lead: '似ているようで、守る場所もルールの書き方も違う。2つのファイアウォールの使い分けを、通信を流して確かめる。',
  description:
    'セキュリティグループ（SG）とネットワークACL（NACL）の違いを、パケットが流れるアニメーション図解で学ぶ。ステートフルとステートレス、ルール番号の評価順、エフェメラルポートまでSAA頻出ポイントを解説。',
  minutes: 12,
  badge: '頻出',

  nodes: [
    { id: 'user', x: -2.6, y: 1.4, s: 0.5, h: 22, fill: '#f4efe6', label: 'ユーザー', kind: 'person', sub: '198.51.100.7' },
    { id: 'attacker', x: -2.6, y: 4.2, s: 0.5, h: 22, fill: '#f3b7b0', label: '攻撃者', kind: 'person', sub: '203.0.113.9' },
    { id: 'igw', x: 0, y: 2.8, s: 0.42, h: 28, fill: '#cfe8b8', label: 'IGW', term: 'igw' },
    { id: 'nacl', x: 1.8, y: 2.8, s: 0.16, sy: 1.2, h: 36, fill: '#f6e2a4', label: 'NACL', term: 'nacl' },
    { id: 'ec2', x: 5, y: 2.8, s: 0.62, h: 42, fill: '#f6c191', label: 'EC2', kind: 'server', term: 'ec2', sub: '10.0.1.10' },
  ],
  zones: [
    { x0: 0, y0: 0, x1: 7, y1: 5.6, fill: 'rgba(255,255,255,.35)', dash: '8 6', label: 'VPC 10.0.0.0/16', labelAt: 'top', term: 'vpc' },
    { x0: 1.8, y0: 0.6, x1: 6.6, y1: 5.0, fill: 'rgba(207,232,184,.45)', label: 'パブリックサブネット 10.0.1.0/24', labelAt: 'edge', term: 'public' },
    { x0: 3.9, y0: 1.7, x1: 6.1, y1: 3.9, fill: 'rgba(246,193,145,.22)', dash: '5 4', label: 'SG：sg-web', labelAt: 'edge', term: 'sg' },
  ],

  steps: [
    {
      short: '全体像', tag: '概要', title: '2つのファイアウォール',
      body: [
        'VPCの通信を守るファイアウォールは2種類あります。サブネットの出入口で検問する{{nacl:ネットワークACL（NACL）}}と、EC2などに直接付ける{{sg:セキュリティグループ（SG）}}です。',
        '外から来た通信は、まずNACL、次にSGを通ります。2つは似ていますが、**ルールの書き方**と**戻りの通信の扱い**がまったく違います。',
      ],
      changes: [{ kind: 'add', text: 'Webサーバー（{{ec2:EC2}}）をパブリックサブネットに配置' }],
      focus: 'all', flows: [], callouts: [],
      chips: [SG('未設定'), NACL('デフォルト（全許可）'), ATK('—')],
      card: { title: '守る場所', lines: ['NACL：サブネットの出入口', 'SG  ：インスタンス（ENI）ごと'] },
    },
    {
      short: 'SG許可', tag: '基礎', title: 'SGは「許可」だけを書く',
      body: [
        'SGのルールは**許可だけ**です。書かれていない通信はすべて拒否されます。作ったばかりのSGにはインバウンドのルールがなく、外からは何も入れません。',
        'Webサーバーとして公開するため、HTTPS（443）を 0.0.0.0/0 から許可します。SSH（22）は許可していないので、届きません。',
      ],
      note: '新しく作ったSGは、アウトバウンドが最初からすべて許可されています。空の状態から始まるのはインバウンドだけです。',
      changes: [{ kind: 'add', text: 'sg-web：443 を 0.0.0.0/0 から許可' }],
      focus: ['user', 'attacker', 'igw', 'nacl', 'ec2'],
      flows: [
        { path: ['user', 'igw', 'nacl', 'ec2'], color: 'req', packet: REQ('許可（sg-web の 443）') },
        { path: ['attacker', 'igw', 'nacl', 'ec2'], color: 'atk', fail: true, delay: 0.4, packet: { src: ATK_IP, dst: `${WEB_IP}:22`, proto: 'TCP 22（SSH）', result: '拒否（SG に 22 の許可がない）', ok: false } },
      ],
      callouts: [{ node: 'ec2', text: 'SSH :22 は拒否', tone: '#f3b7b0' }],
      chips: [SG('443のみ許可'), NACL('デフォルト（全許可）'), ATK('22番は遮断', 'good')],
      card: { title: 'sg-web（インバウンド）', lines: ['443/tcp ← 0.0.0.0/0  許可', '（それ以外はすべて拒否）'], highlight: 0 },
    },
    {
      short: 'ステートフル', tag: '基礎', title: 'SGはステートフル',
      body: [
        'SGは{{stateful:ステートフル}}です。許可したリクエストへの戻り（レスポンス）は、アウトバウンドのルールに関係なく自動で通ります。',
        'たとえアウトバウンドのルールを全部消しても、Webページの返事はユーザーに届きます。',
      ],
      changes: [{ kind: 'mod', text: 'アウトバウンドを空にしても応答は返る' }],
      focus: ['user', 'igw', 'nacl', 'ec2'],
      flows: [
        { path: ['user', 'igw', 'nacl', 'ec2'], color: 'req', packet: REQ('許可（sg-web の 443）') },
        { path: ['ec2', 'nacl', 'igw', 'user'], color: 'res', delay: 0.45, packet: RES('許可（SG はステートフル）', true) },
      ],
      callouts: [{ node: 'ec2', text: '戻りは自動で許可' }],
      chips: [SG('443のみ許可'), NACL('デフォルト（全許可）'), ATK('—')],
      card: { title: 'sg-web（アウトバウンド）', lines: ['（ルールなし）', '→ それでもレスポンスは届く'], highlight: 1 },
    },
    {
      short: '拒否不可', tag: '落とし穴', title: 'SGでは特定のIPを拒否できない',
      body: [
        '特定のIPアドレス（203.0.113.9）から攻撃が来ているとします。SGでこのIPだけを止めたくても、SGには**拒否ルールを書けません**。',
        '443を 0.0.0.0/0 に許可している以上、攻撃者のリクエストもEC2まで届いてしまいます。',
      ],
      note: '許可ルールが複数あるとき、SGはすべてのルールを見て、どれか1つでも当てはまれば許可します。ルールの順番という考え方はありません。',
      changes: [{ kind: 'mod', text: '攻撃者の443への通信も通ってしまう' }],
      focus: ['user', 'attacker', 'igw', 'nacl', 'ec2'],
      flows: [
        { path: ['user', 'igw', 'nacl', 'ec2'], color: 'req', packet: REQ('許可（sg-web の 443）') },
        { path: ['attacker', 'igw', 'nacl', 'ec2'], color: 'atk', delay: 0.4, packet: ATK443('許可（0.0.0.0/0 に一致してしまう）', true) },
      ],
      callouts: [{ node: 'ec2', text: '攻撃も届く', tone: '#f3b7b0' }],
      chips: [SG('443のみ許可'), NACL('デフォルト（全許可）'), ATK('到達してしまう', 'bad')],
      card: { title: 'sg-web（インバウンド）', lines: ['443/tcp ← 0.0.0.0/0  許可', '203.0.113.9 を拒否 → 書けない'], highlight: 1 },
    },
    {
      short: 'NACL拒否', tag: 'テクニック', title: 'NACLなら拒否できる',
      body: [
        '{{nacl:NACL}}なら許可と拒否の両方を書けます。ルールには番号があり、**小さい番号から順に評価して、最初に当てはまったルールで決まります**。',
        '攻撃者のIPを拒否するルールを、443の許可より小さい番号（90）で追加します。',
      ],
      note: 'VPCに最初からあるデフォルトNACLは全許可です。一方、新しく作ったカスタムNACLは、ルールを追加するまで全拒否です。',
      changes: [{ kind: 'add', text: 'NACL ルール90：203.0.113.9/32 を拒否' }],
      focus: ['user', 'attacker', 'igw', 'nacl', 'ec2'],
      flows: [
        { path: ['user', 'igw', 'nacl', 'ec2'], color: 'req', packet: REQ('許可（NACL 100 → SG 443）') },
        { path: ['attacker', 'igw', 'nacl'], color: 'atk', fail: true, delay: 0.4, packet: ATK443('拒否（NACL ルール 90）', false) },
      ],
      callouts: [{ node: 'nacl', text: '90番で拒否' }],
      chips: [SG('443のみ許可'), NACL('90：攻撃者を拒否', 'good'), ATK('遮断', 'good')],
      card: { title: 'NACL（インバウンド）', lines: ['90   203.0.113.9/32  拒否', '100  443  0.0.0.0/0  許可', '*    すべて          拒否'], highlight: 0 },
    },
    {
      short: '番号順', tag: '落とし穴', title: 'ルール番号を間違えると効かない',
      body: [
        'もし拒否ルールを110番にすると、どうなるでしょう。攻撃者のリクエストは先に100番（443を全許可）に当てはまり、そこで許可が決まってしまいます。',
        '110番の拒否は評価されません。**拒否ルールは許可ルールより小さい番号に置く**のが鉄則です。',
      ],
      changes: [{ kind: 'mod', text: '拒否を110番に移すと効かない' }],
      focus: ['user', 'attacker', 'igw', 'nacl', 'ec2'],
      flows: [
        { path: ['user', 'igw', 'nacl', 'ec2'], color: 'req', packet: REQ('許可（NACL 100 → SG 443）') },
        { path: ['attacker', 'igw', 'nacl', 'ec2'], color: 'atk', delay: 0.4, packet: ATK443('許可（先に NACL 100 に一致）', true) },
      ],
      callouts: [{ node: 'nacl', text: '100番で許可が確定', tone: '#f3b7b0' }],
      chips: [SG('443のみ許可'), NACL('110に拒否（無効）', 'bad'), ATK('到達してしまう', 'bad')],
      card: { title: 'NACL（インバウンド）※悪い例', lines: ['100  443  0.0.0.0/0  許可', '110  203.0.113.9/32  拒否', '*    すべて          拒否'], highlight: 0 },
    },
    {
      short: 'ステートレス', tag: 'テクニック', title: 'NACLはステートレス',
      body: [
        'NACLは{{stateful:ステートレス}}です。行きを許可しても、戻りは自動では通りません。アウトバウンド側にも、戻りの通信を許可するルールが必要です。',
        'レスポンスの宛先は、ユーザー側の{{ephemeral:エフェメラルポート}}（1024〜65535）です。アウトバウンドを443だけにしていると、**レスポンスがNACLで止まります**。',
      ],
      note: 'エフェメラルポートの範囲はクライアントのOSによって異なるため、試験では 1024〜65535 を許可するのが定番の答えです。',
      changes: [{ kind: 'add', text: 'NACL アウトバウンド：1024-65535 の許可が必要' }],
      focus: ['user', 'igw', 'nacl', 'ec2'],
      flows: [
        { path: ['user', 'igw', 'nacl', 'ec2'], color: 'req', packet: REQ('許可（NACL 100 → SG 443）') },
        { path: ['ec2', 'nacl'], color: 'res', fail: true, delay: 0.45, packet: RES('拒否（NACL アウトバウンドに 52344 の許可がない）', false) },
      ],
      callouts: [{ node: 'nacl', text: '戻りがブロック', tone: '#f3b7b0' }],
      chips: [SG('443のみ許可'), NACL('アウトバウンド不足', 'bad'), ATK('遮断', 'good')],
      card: { title: 'NACL（アウトバウンド）', lines: ['100  443  0.0.0.0/0  許可', '*    すべて          拒否', '→ 1024-65535 の許可が必要'], highlight: 2 },
    },
    {
      short: 'まとめ', tag: '試験対策', title: 'SGとNACLの使い分け',
      body: [
        {
          list: [
            '**SG**：インスタンス（ENI）単位。許可のみ。{{stateful:ステートフル}}。すべてのルールを評価する。',
            '**NACL**：サブネット単位。許可と拒否。{{stateful:ステートレス}}。番号の小さい順に評価し、最初に一致したルールで決まる。',
            '特定のIPを止めたい → NACLの拒否ルール。NACLを使うなら、戻りの{{ephemeral:エフェメラルポート}}の許可を忘れない。',
          ],
        },
      ],
      changes: [],
      focus: 'all',
      flows: [
        { path: ['user', 'igw', 'nacl', 'ec2'], color: 'req', packet: REQ('許可（NACL 100 → SG 443）') },
        { path: ['ec2', 'nacl', 'igw', 'user'], color: 'res', delay: 0.45, packet: RES('許可（NACL アウトバウンド 1024-65535）', true) },
        { path: ['attacker', 'igw', 'nacl'], color: 'atk', fail: true, delay: 0.2, packet: ATK443('拒否（NACL ルール 90）', false) },
      ],
      callouts: [{ node: 'nacl', text: '拒否はここで', tone: '#f6e2a4' }],
      chips: [SG('443のみ許可', 'good'), NACL('拒否＋戻りを許可', 'good'), ATK('遮断', 'good')],
      card: { title: '完成形', lines: ['NACL in ：90 拒否 / 100 443許可', 'NACL out：100 1024-65535許可', 'SG in   ：443 ← 0.0.0.0/0'] },
      quiz: {
        question: 'Webサーバーへの通信のうち、特定のIPアドレスからのアクセスだけを遮断したい。最も適切な方法は？',
        options: [
          'セキュリティグループに、そのIPを拒否するルールを追加する',
          'ネットワークACLに、そのIPを拒否するルールを、許可ルールより小さい番号で追加する',
          'ネットワークACLに、そのIPを拒否するルールを、許可ルールより大きい番号で追加する',
          'セキュリティグループのアウトバウンドルールをすべて削除する',
        ],
        answer: 1,
        explanation: 'SGには拒否ルールを書けないため、Aは不可能です。NACLは番号の小さい順に評価されるので、拒否は許可より小さい番号に置く必要があります（Cでは先に許可が決まります）。Dはステートフルなので効果がありません。',
      },
    },
  ],

  learn: [
    { text: 'SGは許可のみ・ステートフル', atStep: 2 },
    { text: 'SGで特定のIPを拒否できない理由', atStep: 3 },
    { text: 'NACLのルール番号と評価順', atStep: 5 },
    { text: 'NACLのステートレスとエフェメラルポート', atStep: 6 },
    { text: '試験での使い分けの判断', atStep: 7 },
  ],
  prev: { title: 'VPCとNATゲートウェイ', href: '/learn/vpc-nat' },
  next: { title: 'ピアリングとTransit Gateway', href: '/learn/peering-tgw' },
}
