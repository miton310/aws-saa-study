import type { Chip, Lesson, Packet } from './types'

const WHAT = (v: string): Chip => ({ label: 'ストレージ', value: v })
const SHARE = (v: string, tone?: Chip['tone']): Chip => ({ label: '複数のEC2で共有', value: v, tone })
const LIFE = (v: string, tone?: Chip['tone']): Chip => ({ label: 'EC2を止めたら', value: v, tone })

// パケットの流れ表に出す読み書き（送信元はEC2のIP、宛先はストレージ）
const pk = (src: string, dst: string, proto: string, result: string, ok = true): Packet => ({ src, dst, proto, result, ok })
const EA = '10.0.1.10'
const EC = '10.0.3.10'

export const ebsEfsFsxLesson: Lesson = {
  slug: 'ebs-efs-fsx',
  category: 's3',
  lessonLabel: 'レッスン 2',
  title: 'EBS・EFS・FSx の使い分け',
  lead: 'EC2のディスクはEBS、みんなで使う共有フォルダはEFS、Windowsや高速計算ならFSx。「何台から・どのAZから使うか」で選び分ける。',
  description:
    'Amazon EBS・インスタンスストア・Amazon EFS・Amazon FSx の違いを図解で学ぶ。EBSとAZの関係、スナップショット、Multi-Attach、インスタンスストアの消え方、EFSの共有、FSx for Windows File Server と FSx for Lustre までSAA頻出ポイントを解説。',
  minutes: 12,
  badge: '頻出',

  nodes: [
    { id: 'ec2a', x: 1.0, y: 0.6, s: 0.55, h: 38, fill: '#f6c191', label: 'EC2', term: 'ec2', sub: EA },
    { id: 'ebs', x: 3.4, y: 0.6, s: 0.55, h: 40, fill: '#bcd4f0', label: 'EBS', kind: 'cyl', term: 'ebs', sub: 'gp3 100GiB' },
    { id: 'istore', x: 1.2, y: -1.2, s: 0.45, h: 22, fill: '#e9e4da', label: '一時', fontSize: 11, term: 'instancestore', sub: '一時ディスク' },
    { id: 'ec2c', x: 1.0, y: 4.4, s: 0.55, h: 38, fill: '#f6c191', label: 'EC2', term: 'ec2', sub: EC },
    { id: 'ebs2', x: 3.4, y: 4.4, s: 0.55, h: 40, fill: '#bcd4f0', label: 'EBS', kind: 'cyl', term: 'ebs', sub: 'スナップショットから復元' },
    { id: 'snap', x: 6.4, y: 0.6, s: 0.55, h: 34, fill: '#cfe8b8', label: 'スナップ', fontSize: 10.5, kind: 'cyl', term: 'snapshot', sub: 'リージョンに保存' },
    { id: 'efs', x: 6.4, y: 3.6, s: 0.62, h: 40, fill: '#f6e2a4', label: 'EFS', term: 'efs', sub: '共有ファイル（NFS）' },
    { id: 'fsx', x: 6.4, y: 3.6, s: 0.62, h: 40, fill: '#d9cdf2', label: 'FSx', term: 'fsx', sub: 'Windows（SMB）' },
  ],
  zones: [
    { x0: -0.2, y0: -1.8, x1: 4.4, y1: 1.8, fill: 'rgba(188,212,240,.3)', label: 'AZ-a', labelAt: 'edge', term: 'az' },
    { x0: -0.2, y0: 3.2, x1: 4.4, y1: 5.6, fill: 'rgba(207,232,184,.3)', label: 'AZ-c', labelAt: 'edge', term: 'az' },
  ],

  steps: [
    {
      short: 'EBS', tag: '基礎', title: 'EBS：EC2に付ける「ネットワーク越しのディスク」',
      body: [
        '{{ebs:EBS}}は、EC2に付けて使うブロックストレージです。付けたあとは、普通のハードディスクと同じように使えます（OSを入れる起動ディスクもEBSです）。',
        'EC2本体とは別の場所にあるので、**EC2を停止してもデータは残ります**。容量や種類（gp3、io2 など）は、使いながら変更できます。',
      ],
      changes: [{ kind: 'add', text: 'EBS ボリューム（gp3 100GiB）を作成し、AZ-a の EC2 に付ける' }],
      focus: ['ec2a', 'ebs'], hide: ['fsx'],
      flows: [
        { path: ['ec2a', 'ebs'], color: 'req', packet: pk(EA, 'EBS（AZ-a）', 'ブロックの書き込み', 'ファイルを保存') },
        { path: ['ebs', 'ec2a'], color: 'res', delay: 0.4, packet: pk('EBS（AZ-a）', EA, 'ブロックの読み込み', 'ファイルを読む') },
      ],
      callouts: [{ node: 'ebs', text: '停止しても残る', tone: '#cfe8b8' }],
      chips: [WHAT('EBS'), SHARE('基本はできない'), LIFE('データは残る', 'good')],
      card: { title: 'EBS ボリューム', lines: ['種類：gp3（汎用SSD）', '付け先：AZ-a の EC2', 'EC2 を停止しても：データは残る'], highlight: 2 },
    },
    {
      short: '同じAZ', tag: '基礎', title: 'EBS は同じAZのEC2にしか付けられない',
      body: [
        'EBS ボリュームは**1つのAZの中に作られ**、付けられるのは**同じAZのEC2だけ**です。AZ-c の EC2 から、AZ-a の EBS を直接使うことはできません。',
        'また、基本は**1つのEBSを1台のEC2に**付けて使います。',
      ],
      note: '例外として、io1／io2 のボリュームは Multi-Attach を有効にすると、同じAZの Nitro ベースのインスタンス最大16台に同時に付けられます。ただし、同じAZの中だけです。',
      changes: [{ kind: 'mod', text: 'AZ-c の EC2 に、AZ-a の EBS を付けようとする' }],
      focus: ['ec2a', 'ebs', 'ec2c'], hide: ['fsx'],
      flows: [
        { path: ['ec2a', 'ebs'], color: 'req', packet: pk(EA, 'EBS（AZ-a）', 'ブロックの書き込み', '同じAZなので使える') },
        { path: ['ec2c', 'ebs'], color: 'atk', fail: true, delay: 0.45, packet: pk(EC, 'EBS（AZ-a）', 'アタッチ', '付けられない（AZが違う）', false) },
      ],
      callouts: [{ node: 'ec2c', text: '別のAZからは使えない', tone: '#f3b7b0' }],
      chips: [WHAT('EBS'), SHARE('できない（同じAZ・1台）', 'bad'), LIFE('データは残る', 'good')],
      card: { title: 'EBS のルール', lines: ['ボリュームとEC2は同じAZ', '基本は1台のEC2に1つ付ける', 'Multi-Attach（io1/io2）も同じAZだけ'], highlight: 0 },
    },
    {
      short: 'スナップショット', tag: '基礎', title: 'スナップショットで、別のAZや別のリージョンへ',
      body: [
        '別のAZでも同じデータを使いたいときは、EBS の{{snapshot:スナップショット}}を取ります。スナップショットはAZではなく**リージョン単位**で保存されるので、そこから**別のAZに新しいボリュームを復元**できます。',
        'スナップショットは**別のリージョンにコピー**することもでき、バックアップや災害対策に使います。2回目以降は、変わった部分だけが保存されます（増分）。',
      ],
      changes: [
        { kind: 'add', text: 'AZ-a の EBS のスナップショットを作成' },
        { kind: 'add', text: 'スナップショットから AZ-c に新しい EBS を復元し、AZ-c の EC2 に付ける' },
      ],
      focus: ['ebs', 'snap', 'ebs2', 'ec2c'], hide: ['fsx'],
      flows: [
        { path: ['ebs', 'snap'], color: 'out', packet: pk('EBS（AZ-a）', 'スナップショット', 'スナップショット作成', 'リージョンに保存') },
        { path: ['snap', 'ebs2'], color: 'out', delay: 0.4, packet: pk('スナップショット', 'EBS（AZ-c）', '復元', 'AZ-c に新しいボリューム') },
        { path: ['ec2c', 'ebs2'], color: 'req', delay: 0.75, packet: pk(EC, 'EBS（AZ-c）', 'ブロックの読み込み', '同じデータを使える') },
      ],
      callouts: [{ node: 'snap', text: 'AZをまたいで使える' }],
      chips: [WHAT('EBS ＋ スナップショット'), SHARE('コピーを作る', 'good'), LIFE('データは残る', 'good')],
      card: { title: 'スナップショットでできること', lines: ['別のAZにボリュームを復元', '別のリージョンにコピー', '2回目以降は増分だけ保存'], highlight: 0 },
    },
    {
      short: 'インスタンスストア', tag: 'テクニック', title: 'インスタンスストア：速いが、止めると消える',
      body: [
        '一部のインスタンスタイプには、EC2のホストに**物理的に付いたディスク**、{{instancestore:インスタンスストア}}があります。ネットワークを通らないので**とても速く**、料金はインスタンスの料金に含まれています。',
        'ただし、データが残るのは**再起動まで**です。EC2を**停止・休止・終了すると、データは消えます**。キャッシュや一時ファイルなど、消えても困らないデータに使います。',
      ],
      changes: [{ kind: 'mod', text: 'EC2 を停止する' }],
      focus: ['ec2a', 'istore', 'ebs'], hide: ['fsx'],
      flows: [
        { path: ['ec2a', 'istore'], color: 'req', packet: pk(EA, 'インスタンスストア', '書き込み', 'キャッシュを置く（とても速い）') },
        { path: ['ec2a', 'istore'], color: 'atk', fail: true, delay: 0.45, packet: pk(EA, 'インスタンスストア', '停止 → 起動', 'キャッシュは消えている', false) },
        { path: ['ec2a', 'ebs'], color: 'req', delay: 0.8, packet: pk(EA, 'EBS（AZ-a）', '停止 → 起動', 'EBS のデータは残っている') },
      ],
      callouts: [{ node: 'istore', text: '停止で消える', tone: '#f3b7b0' }],
      chips: [WHAT('インスタンスストア'), SHARE('できない', 'bad'), LIFE('データは消える', 'bad')],
      card: { title: 'インスタンスストアのデータ', lines: ['再起動：残る', '停止・休止・終了：消える', '向いている用途：キャッシュ・一時ファイル'], highlight: 1 },
    },
    {
      short: 'EFS', tag: '基礎', title: 'EFS：複数のEC2、複数のAZから同時に使う共有ファイル',
      body: [
        '複数のEC2で**同じファイルを読み書き**したいときは、{{efs:EFS}}を使います。EFS は NFS で使う共有ファイルシステムで、**同じリージョンの複数のAZ**の EC2 から同時にマウントできます（数千台まで）。',
        '容量は、ファイルを置くと**自動で増え**、消すと減ります。前もって容量を決める必要はありません。各AZにマウントターゲットを作り、EC2 は自分のAZのマウントターゲット経由でつなぎます。',
      ],
      note: 'EFS は NFS（Linux）向けです。Windows のサーバーから使う共有フォルダには、次のステップの FSx for Windows File Server を使います。',
      changes: [
        { kind: 'add', text: 'EFS ファイルシステムを作成（リージョナル）' },
        { kind: 'add', text: 'AZ-a と AZ-c にマウントターゲットを作成し、両方の EC2 からマウント' },
      ],
      focus: ['ec2a', 'ec2c', 'efs'], hide: ['fsx'],
      flows: [
        { path: ['ec2a', 'efs'], color: 'req', packet: pk(EA, 'EFS', 'NFS（TCP 2049）', 'uploads/photo.jpg を書き込む') },
        { path: ['ec2c', 'efs'], color: 'req', delay: 0.45, packet: pk(EC, 'EFS', 'NFS（TCP 2049）', '同じ photo.jpg を読める') },
      ],
      callouts: [{ node: 'efs', text: '複数AZから同時に', tone: '#cfe8b8' }],
      chips: [WHAT('EFS'), SHARE('できる（複数AZ）', 'good'), LIFE('データは残る', 'good')],
      card: { title: 'EFS の特徴', lines: ['プロトコル：NFS（Linux）', '複数AZの EC2 から同時に使える', '容量は自動で増減する'], highlight: 1 },
    },
    {
      short: 'FSx', tag: 'テクニック', title: 'FSx：Windows のファイルサーバーと、高速計算向け',
      body: [
        '{{fsx:FSx}}は、用途に合わせたファイルシステムを、AWSが管理してくれるサービスです。試験では次の2つがよく出ます。',
        {
          list: [
            '**FSx for Windows File Server**：Windows の共有フォルダ（**SMB**）。Active Directory と組み合わせて使える。Windows アプリのファイル共有をそのまま移すときに。',
            '**FSx for Lustre**：機械学習や **HPC（高性能計算）**など、速さが大事な処理向け。**S3 のバケットとつなぐ**と、S3 のオブジェクトをファイルとして扱える。',
          ],
        },
        'このほか、NetApp ONTAP や OpenZFS の機能を使える FSx もあります。',
      ],
      changes: [{ kind: 'add', text: 'FSx for Windows File Server を作成し、Windows の EC2 から \\\\fsx\\share をマウント' }],
      focus: ['ec2a', 'ec2c', 'fsx'], hide: ['efs'],
      flows: [
        { path: ['ec2a', 'fsx'], color: 'req', packet: pk(EA, 'FSx for Windows', 'SMB（TCP 445）', '\\\\fsx\\share に保存') },
        { path: ['ec2c', 'fsx'], color: 'req', delay: 0.45, packet: pk(EC, 'FSx for Windows', 'SMB（TCP 445）', '同じ共有フォルダを開く') },
      ],
      callouts: [{ node: 'fsx', text: 'Windows の共有フォルダ' }],
      chips: [WHAT('FSx for Windows'), SHARE('できる（SMB）', 'good'), LIFE('データは残る', 'good')],
      card: { title: 'FSx の選び方', lines: ['Windows の共有フォルダ（SMB）→ FSx for Windows', 'HPC・機械学習・S3 と連携 → FSx for Lustre'], highlight: 0 },
    },
    {
      short: 'まとめ', tag: '試験対策', title: 'ストレージの使い分けで押さえるポイント',
      body: [
        {
          list: [
            '**EBS**：1台のEC2のディスク。**同じAZ**でだけ使える。停止してもデータは残る。',
            '**スナップショット**：EBS をリージョンに保存。**別のAZに復元・別のリージョンにコピー**できる。',
            '**インスタンスストア**：とても速いが、**停止・終了で消える**。一時データ用。',
            '**EFS**：Linux（NFS）の共有ファイル。**複数AZ・多数のEC2から同時に**使え、容量は自動で増減。',
            '**FSx for Windows**：Windows の共有フォルダ（SMB）。**FSx for Lustre**：HPC・機械学習、S3 と連携。',
          ],
        },
      ],
      changes: [],
      focus: ['ec2a', 'ebs', 'ec2c', 'efs', 'snap', 'ebs2'], hide: ['fsx'],
      flows: [
        { path: ['ec2a', 'ebs'], color: 'req', packet: pk(EA, 'EBS（AZ-a）', 'ブロックの読み書き', '1台専用のディスク') },
        { path: ['ec2a', 'efs'], color: 'req', delay: 0.3, packet: pk(EA, 'EFS', 'NFS', '共有ファイル') },
        { path: ['ec2c', 'efs'], color: 'req', delay: 0.55, packet: pk(EC, 'EFS', 'NFS', '別のAZからも同じファイル') },
      ],
      callouts: [{ node: 'efs', text: 'みんなで使う', tone: '#f6e2a4' }],
      chips: [WHAT('要件で選ぶ'), SHARE('EFS・FSx'), LIFE('インスタンスストアだけ消える')],
      card: { title: '要件 → ストレージ', lines: ['1台のEC2のディスク → EBS', 'Linux で複数AZから共有 → EFS', 'Windows で共有（SMB）→ FSx for Windows', 'HPC・S3 と連携 → FSx for Lustre'] },
      quiz: {
        question: '複数のAZにまたがる Auto Scaling グループの Linux の EC2 で、ユーザーがアップロードした画像を、すべてのインスタンスから同じファイルとして読み書きしたい。最も適切なストレージは？',
        options: [
          'Multi-Attach を有効にした io2 の EBS ボリューム',
          'Amazon EFS',
          '各インスタンスのインスタンスストア',
          'Amazon FSx for Windows File Server',
        ],
        answer: 1,
        explanation: 'EFS は NFS の共有ファイルシステムで、同じリージョンの複数のAZの EC2 から同時に読み書きできます。EBS の Multi-Attach は同じAZのインスタンスにしか使えません。インスタンスストアはインスタンスごとに別々で、停止すると消えます。FSx for Windows File Server は Windows（SMB）向けです。',
      },
    },
  ],

  learn: [
    { text: 'EBS の特徴', atStep: 0 },
    { text: 'EBS と AZ の関係、Multi-Attach', atStep: 1 },
    { text: 'スナップショットで別のAZ・リージョンへ', atStep: 2 },
    { text: 'インスタンスストアの消え方', atStep: 3 },
    { text: 'EFS で複数AZから共有', atStep: 4 },
    { text: 'FSx for Windows と FSx for Lustre', atStep: 5 },
  ],
  prev: { title: 'EC2の購入オプションの選び方', href: '/learn/ec2-purchasing' },
  next: { title: 'CloudFront とキャッシュ' },
}
