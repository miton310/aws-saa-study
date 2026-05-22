'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

// ── Step data ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    title: 'VPCとは何か',
    emoji: '☁️',
    description:
      'VPC（Virtual Private Cloud）は、AWSクラウド内に作る「あなた専用の仮想ネットワーク空間」です。物理的なデータセンターをクラウド上に持つイメージで、インターネットから論理的に隔離されています。',
    keyPoints: [
      'リージョン（例：東京）内に作成する仮想ネットワーク',
      'CIDRブロックでIPアドレス範囲を定義（例：10.0.0.0/16 = 約65,000個のIP）',
      '1アカウントにつき各リージョンに最大5つまで作成可能（上限緩和申請あり）',
    ],
    hint: 'VPCの大きな枠がネットワーク全体を表しています',
  },
  {
    id: 2,
    title: 'サブネットで区画を分ける',
    emoji: '🗂️',
    description:
      'VPC内をさらに小さなネットワーク区画（サブネット）に分割します。用途によってパブリックとプライベートに分けるのが基本パターンです。サブネットは必ず1つのAZ（アベイラビリティゾーン）に紐づきます。',
    keyPoints: [
      'パブリックサブネット（青）：インターネットと通信できる公開区画',
      'プライベートサブネット（緑）：インターネットから隔離された安全な区画',
      'サブネットは単一のAZにのみ配置できる（複数AZに作るのがベストプラクティス）',
    ],
    hint: '青がパブリック、緑がプライベートサブネットです',
  },
  {
    id: 3,
    title: 'インターネットゲートウェイ（IGW）',
    emoji: '🌐',
    description:
      'インターネットゲートウェイ（IGW）はVPCとインターネットを繋ぐ「玄関口」です。VPCにアタッチするだけで利用でき、冗長性・可用性はAWSが管理します。これがないとどこからもアクセスできません。',
    keyPoints: [
      'VPCにIGWをアタッチするだけで使用可能（1VPCに1つ）',
      'パブリックIPまたはElastic IPを持つリソースのみ通信可能',
      'ルートテーブルに「0.0.0.0/0 → IGW」の設定も必要',
    ],
    hint: 'IGWが点灯してVPCとインターネットが繋がっています',
  },
  {
    id: 4,
    title: 'EC2をパブリックサブネットに配置',
    emoji: '💻',
    description:
      'パブリックサブネットにEC2インスタンス（Webサーバー）を配置します。まだ通信は発生していません。EC2にはパブリックIPが割り当てられ、IGWとの接続経路が用意されています。',
    keyPoints: [
      'パブリックサブネットはIGWへのルートを持つサブネット',
      'EC2にパブリックIPまたはElastic IPを割り当てることでインターネット通信が可能になる',
      'セキュリティグループで許可するポート（80/443等）を制限する',
    ],
    hint: 'EC2がパブリックサブネットに配置されました（通信はまだ）',
  },
  {
    id: 5,
    title: 'インバウンド通信（外→中）',
    emoji: '📥',
    description:
      'インターネットからEC2へのアクセス（インバウンド）を見てみましょう。青いパケットが Internet → IGW → EC2 の経路を流れていきます。これがWebサイトへのリクエストのイメージです。',
    keyPoints: [
      'インターネット → IGW → EC2（インバウンド通信）',
      'IGWはパケットをルーティングし、EC2のプライベートIPに変換（NAT）する',
      'セキュリティグループの「インバウンドルール」でポート80/443等を許可する',
    ],
    hint: '青パケット：Internet → IGW → EC2',
  },
  {
    id: 6,
    title: 'フル通信フロー（Web → DB 連携）',
    emoji: '🔄',
    description:
      'Webサーバーがリクエストを受け取り、プライベートサブネットのDBサーバーに問い合わせ、結果をインターネットに返す完全なフローです。これが実際のWebアプリケーションの動き方です。',
    keyPoints: [
      '青：インターネット → IGW → Webサーバー（インバウンド）',
      '紫：WebサーバーがDBサーバーに内部問い合わせ → 応答（VPC内通信）',
      '緑：Webサーバー → IGW → インターネット（レスポンス返却）',
    ],
    hint: '青→紫→緑の順に1リクエストの旅を追ってみましょう',
  },
  {
    id: 7,
    title: 'プライベートEC2の通信フロー',
    emoji: '🔐',
    description:
      'プライベートEC2（DBサーバー等）はNAT GW → IGW経由でインターネットへのアウトバウンドが可能です。しかし、インターネットから直接アクセスすることは一切できません。これがプライベートサブネットの安全性の要です。',
    keyPoints: [
      '緑パケット：EC2(プライベート) → NAT GW → IGW → インターネット ✓',
      '赤パケット：インターネット → IGW → ✕（プライベートEC2へは届かない）',
      'RDS・バックエンドサーバーなど外部に公開不要なサービスをここに置く',
    ],
    hint: '緑＝許可（外向き）、赤＝ブロック（内向きは届かない）',
  },
  {
    id: 8,
    title: 'Multi-AZで高可用性を高める',
    emoji: '🏗️',
    description:
      'VPCはリージョン単位のネットワークで、複数のAZをまたいで利用できます。高可用性のためには、単一AZに依存せず、同じ構成を複数のAZに展開します。片方のAZに障害が出ても、もう片方でサービス継続しやすくなります。',
    keyPoints: [
      'AZ-a / AZ-c は同じVPC内に作成される（VPC配下の別AZサブネット）',
      'サブネットはAZをまたげないため、AZごとにPublic/Privateサブネットを作成する',
      'Web層・DB層を複数AZへ分散し、障害時の影響範囲を限定する',
      'シングルAZ構成は学習用・検証用、本番はMulti-AZが基本',
    ],
    hint: 'AZ-a / AZ-c に同じ構成を複製して高可用性を確保',
  },
  {
    id: 9,
    title: 'まとめ：VPCの基本構成',
    emoji: '🎯',
    description:
      'これがAWSの最も基本的なVPCアーキテクチャです。パブリックサブネット（Webサーバー）とプライベートサブネット（DBサーバー）の2層構造が試験の頻出パターンです。ルートテーブルの設定もチェックしてください。',
    keyPoints: [
      'Webサーバー → パブリックサブネット（IGW経由で外部公開）',
      'DBサーバー → プライベートサブネット（外部から完全隔離）',
      'パブリックサブネットのルート: 0.0.0.0/0 → IGW を設定',
      'プライベートサブネットはNAT GW経由でアウトバウンド通信を行う',
    ],
    hint: 'ルートテーブルでトラフィックの経路を制御します',
  },
]

const TOTAL = STEPS.length

// ── キャンバスのレイアウト定数 ────────────────────────────────────────────
// p5.js が描画するキャンバスのサイズ（ピクセル）
const W = 660  // キャンバス幅
const H = 340  // キャンバス高さ

// 各ノードの「中心座標」。描画時はここを基準にボックスやラベルを配置する。
// y が小さいほど上（インターネット側）、大きいほど下（VPC内部側）
const INET    = { x: 330, y: 12  }  // 「インターネット」ラベルの位置
const IGW     = { x: 330, y: 40  }  // インターネットゲートウェイ（IGW）の中心
const VPC     = { x: 10,  y: 62, w: 640, h: 268 }  // VPC 外枠の左上座標・幅・高さ
const PUB     = { x: 48,  y: 110, w: 238, h: 186 } // パブリックサブネット
const PRI     = { x: 374, y: 110, w: 238, h: 186 } // プライベートサブネット
const NAT     = { x: 300, y: 236 }  // NAT ゲートウェイの中心（VPC 内、サブネット境界付近）
const EC2_PUB = { x: 148, y: 216 }  // パブリック EC2（Webサーバー）の中心
const EC2_PRI = { x: 478, y: 216 }  // プライベート EC2（DBサーバー）の中心

// パケットアニメーション 1 個分のデータ型
// progress が 0→1 に増えるにつれて (x,y)→(tx,ty) を直線移動する
interface Packet {
  x: number          // 現在の描画 X 座標（lerp で計算）
  y: number          // 現在の描画 Y 座標
  tx: number         // 目標 X 座標
  ty: number         // 目標 Y 座標
  progress: number   // 移動進捗 0.0〜1.0
  speed: number      // 1フレームあたりの進捗増加量（ランダムにぶれる）
  color: [number, number, number]  // RGB 描画色
  active: boolean    // false になったフレームで配列から除去される
  blocked: boolean   // true = ブロックパケット（途中で消滅し赤×を表示する）
}

// パケット経路の 1 セグメント: [出発ノード, 到着ノード, 色, ブロック?]
type Seg = [{ x: number; y: number }, { x: number; y: number }, [number, number, number], boolean?]

// ステップ番号に応じてパケットが通る経路（セグメント列）を返す
// 経路は 1 セグメントずつ順番に再生され、全部終わると最初に戻る（ループ）
function getSequence(s: number): Seg[] {
  if (s === 5) return [
    // インターネット → IGW → パブリック EC2（インバウンド/青）
    [INET, IGW,     [59, 130, 246]],
    [IGW,  EC2_PUB, [59, 130, 246]],
  ]
  if (s === 6) return [
    // ① インバウンド（青）: Internet → IGW → Web EC2
    [INET,    IGW,     [59, 130, 246]],
    [IGW,     EC2_PUB, [59, 130, 246]],
    // ② 内部問い合わせ（紫）: Web ↔ DB
    [EC2_PUB, EC2_PRI, [139, 92, 246]],
    [EC2_PRI, EC2_PUB, [139, 92, 246]],
    // ③ アウトバウンド（緑）: Web EC2 → IGW → Internet
    [EC2_PUB, IGW,     [16, 185, 129]],
    [IGW,     INET,    [16, 185, 129]],
  ]
  if (s === 7) return [
    // ① アウトバウンド（緑）: プライベート EC2 → NAT → IGW → Internet
    [EC2_PRI, NAT,  [16, 185, 129]],
    [NAT,     IGW,  [16, 185, 129]],
    [IGW,     INET, [16, 185, 129]],
    // ② ブロック（赤）: Internet → IGW → （プライベート EC2 には届かない）
    [INET,    IGW,  [239, 68, 68], true],
    // IGW とプライベート EC2 の中間点で消滅させる（blocked=true のため途中で止まる）
    [IGW,     { x: (IGW.x + EC2_PRI.x) / 2, y: (IGW.y + EC2_PRI.y) / 2 }, [239, 68, 68], true],
  ]
  return []  // ステップ 1〜4 はパケットアニメーションなし
}

// ── コンポーネント ─────────────────────────────────────────────────────────

export default function VPCBeginnerStepper() {
  // 現在表示中のステップ番号（1〜8）。UI のボタン操作で更新される
  const [step, setStep] = useState(1)

  // p5 の draw() はクロージャなので useState の最新値を参照できない。
  // useRef に同期コピーを持つことで draw() 内から常に最新ステップを読める
  const stepRef = useRef(1)

  // draw() が呼ばれた累計フレーム数。sin() に渡してグロー・フェードアニメに使う
  const timerRef = useRef(0)

  // 現在アクティブなパケット一覧。Ref なので更新しても再レンダリングは起きない
  const pkts = useRef<Packet[]>([])

  // getSequence() で返ったセグメント列のうち「次に流す番号」
  const phaseRef = useRef(0)

  // 全セグメント完了後、次のループ開始まで待つフレーム数のカウントダウン
  const waitRef = useRef(0)

  // p5.loadImage() でロードした AWS SVG アイコン画像を保持する Ref
  // （p5.Image 型の定義が react-p5 に存在しないため any を使用）
  const imgEc2 = useRef<any>(null)  // EC2 アイコン
  const imgIgw = useRef<any>(null)  // インターネットゲートウェイ アイコン
  const imgNat = useRef<any>(null)  // NAT ゲートウェイ アイコン
  const imgVpc = useRef<any>(null)  // VPC アイコン
  const imgPublicSubnet = useRef<any>(null)  // パブリックサブネット アイコン
  const imgPrivateSubnet = useRef<any>(null)  // プライベートサブネット アイコン

  // step が変わるたびにアニメーション状態をリセットする
  useEffect(() => {
    stepRef.current = step  // draw() から参照できる Ref にも即時反映
    pkts.current = []       // 飛んでいたパケットをすべて消去
    timerRef.current = 0    // タイマーをゼロに戻す
    phaseRef.current = 0    // パケット経路を最初のセグメントに戻す
    waitRef.current = 0     // 待機カウンタをリセット
  }, [step])

  // ── p5 ヘルパー関数 ────────────────────────────────────────────────────

  // パケットを 1 個生成して pkts に追加する
  // from/to: 出発・到着ノードの座標オブジェクト
  // col:     RGB 3 要素の色配列
  // blocked: true にするとパケットが途中（progress=0.75）で消滅し赤×を表示
  function spawn(from: { x: number; y: number }, to: { x: number; y: number }, col: [number, number, number], blocked = false) {
    pkts.current.push({
      x: from.x, y: from.y,
      tx: to.x,  ty: to.y,
      progress: 0,
      speed: 0.018 + Math.random() * 0.007,  // 速度にランダムなばらつきを付けて自然に見せる
      color: col,
      active: true,
      blocked,
    })
  }

  // EC2 インスタンスを表すボックスを描画するヘルパー
  // cx/cy: ボックス中心座標
  // label: ボックス下部に表示するテキスト（'\n' で改行可）
  // col:   枠・テキストの RGB 色
  function ec2Box(p5: any, cx: number, cy: number, label: string, col: [number, number, number]) {
    // 外枠（角丸矩形）
    p5.strokeWeight(1.5)
    p5.stroke(...col)
    p5.fill(col[0], col[1], col[2], 35)  // 半透明の塗り（アルファ 35）
    p5.rect(cx - 38, cy - 26, 76, 52, 0) // 角丸なし
    // EC2 SVG アイコン（ロード完了後に描画）
    if (imgEc2.current) {
      p5.image(imgEc2.current, cx - 13, cy - 23, 26, 26)  // 上部中央に 26×26 で配置
    }
    // ラベルテキスト（アイコン下）
    p5.noStroke()
    p5.fill(...col)
    p5.textSize(8)
    p5.textAlign(p5.CENTER, p5.CENTER)
    // '\n' で分割して 1 行ずつ、12px 間隔で描画する
    label.split('\n').forEach((ln: string, i: number) => p5.text(ln, cx, cy + 10 + i * 12))
  }

  // ── p5 セットアップ / 描画 ──────────────────────────────────────────────

  // p5 の setup() コールバック — キャンバス初期化時に 1 回だけ呼ばれる
  // ref: キャンバスを挿入する DOM 要素（react-p5 が渡してくる）
  const setup = (p5: any, ref: any) => {
    p5.createCanvas(W, H).parent(ref)  // 指定サイズのキャンバスを ref の中に作成
    p5.frameRate(40)                    // 1 秒あたりのフレーム数を 40 に制限（省電力）

    // AWS 公式 SVG アイコンを非同期ロード。ロード完了後に Ref へ保存する。
    // public/icons/aws/ 以下のファイルは scripts/extract-aws-icons.cjs で生成する
    p5.loadImage('/icons/aws/ec2.svg', (img: any) => { imgEc2.current = img })
    p5.loadImage('/icons/aws/igw.svg', (img: any) => { imgIgw.current = img })
    p5.loadImage('/icons/aws/nat.svg', (img: any) => { imgNat.current = img })
    p5.loadImage('/icons/aws/aws-vpc.svg', (img: any) => { imgVpc.current = img })
    p5.loadImage('/icons/aws/publicSubnet.svg', (img: any) => { imgPublicSubnet.current = img })
    p5.loadImage('/icons/aws/privateSubnet.svg', (img: any) => { imgPrivateSubnet.current = img })
  }

  // draw() 内のパケット座標計算部分を差し替え
  function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  const draw = (p5: any) => {
    const s = stepRef.current
    timerRef.current++
    const t = timerRef.current
    p5.background(248, 250, 252) // 薄いグレーの背景

    // ─── ステップ 1〜: VPC 外枠 ────────────────────────────────────────
    // ステップ 1 のときだけ枠をゆっくり点滅させて「これが VPC です」と強調する
    // vpcPulse: 0.3〜1.0 の間を sin でゆっくり往復する係数
    const vpcPulse = s === 1 ? 0.65 + Math.sin(t * 0.07) * 0.35 : 1
    p5.strokeWeight(2.5)
    p5.stroke(140, 80, 255, 255 * vpcPulse)           // インディゴ系の枠線
    p5.fill(238, 242, 255, s === 1 ? 140 * vpcPulse : 180)  // 薄紫の塗り
    p5.rect(VPC.x, VPC.y, VPC.w, VPC.h, 0)           // 角丸なし
    // 左上に CIDR ラベルを描く
    p5.noStroke()
    p5.fill(99, 102, 241)
    p5.textSize(10)
    p5.textAlign(p5.LEFT)
    // VPC アイコン（左上、CIDRラベルの左隣）
    if (imgVpc.current) {
      p5.image(imgVpc.current, VPC.x, VPC.y, 24, 24)  // 上部中央に 24×24 で配置
    }
    p5.noStroke()
    p5.fill(99, 102, 241)
    p5.textSize(10)
    p5.textAlign(p5.LEFT)
    p5.text('VPC  10.0.0.0/16', VPC.x + 36, VPC.y + 16)
    if (s === 1) {
      // ステップ 1 限定: VPC の中央に大きく名前を表示する
      p5.textSize(13)
      p5.textAlign(p5.CENTER)
      p5.fill(99, 102, 241, 180 * vpcPulse)
      p5.text('Virtual Private Cloud', W / 2, VPC.y + VPC.h / 2)
    }

    // ─── ステップ 2〜: サブネット ─────────────────────────────────────
    if (s >= 2 && s !== 8) {
      // ステップ 2 の初回だけ t*5 でフェードイン。以降は常に alpha=255
      const alpha = s === 2 ? Math.min(255, t * 5) : 255

      // ── パブリックサブネット（アイコン色 #7aa116）
      p5.strokeWeight(1.5)
      p5.stroke(122, 161, 22, alpha)
      p5.fill(255, 255, 255, alpha)
      p5.rect(PUB.x, PUB.y, PUB.w, PUB.h, 0)
      if (imgPublicSubnet.current) {
        p5.image(imgPublicSubnet.current, PUB.x + 0, PUB.y + 0, 24, 24)
      }
      p5.noStroke()
      p5.fill(122, 160, 22, alpha) 
      p5.textSize(9); p5.textAlign(p5.LEFT, p5.CENTER)
      p5.text('パブリックサブネット', PUB.x + 30, PUB.y + 14)
      p5.textSize(8)
      p5.text('10.0.1.0/24', PUB.x + 30, PUB.y + 26)  // CIDR 表記

      // ── プライベートサブネット（緑）
      p5.strokeWeight(1.5)
      p5.stroke(16, 185, 129, alpha)
      p5.fill(255, 255, 255, alpha)
      p5.rect(PRI.x, PRI.y, PRI.w, PRI.h, 0)
      if (imgPrivateSubnet.current) {
        p5.image(imgPrivateSubnet.current, PRI.x + 0, PRI.y + 0, 24, 24)
      }
      p5.noStroke()
      p5.fill(16, 185, 129, alpha)
      p5.textSize(9); p5.textAlign(p5.LEFT, p5.CENTER)
      p5.text('プライベートサブネット', PRI.x + 30, PRI.y + 14)
      p5.textSize(8)
      p5.text('10.0.2.0/24', PRI.x + 30, PRI.y + 26)  // CIDR 表記
    }

    // ─── ステップ 3〜: インターネットゲートウェイ（IGW）────────────────
    if (s >= 3 && s !== 8) {
      // ステップ 3 のときだけ枠を点灯させて IGW の存在を強調する
      // glow: 0.2〜1.0 を sin で往復（ステップ 3 以外は常に 1 = 最大輝度）
      const glow = s === 3 ? 0.6 + Math.sin(t * 0.1) * 0.4 : 1
      // IGW アイコンの公式カラー (#8c4fff = RGB 140, 79, 255)
      const igwCol: [number, number, number] = [140, 79, 255]

      // IGW ボックス下辺（IGW.y + 14）から VPC 上辺（VPC.y = 62）への縦線
      p5.stroke(...igwCol, 160)
      p5.strokeWeight(1.5)
      p5.line(IGW.x, IGW.y + 14, IGW.x, VPC.y)

      // IGW ボックス本体: 幅 120 × 高さ 28px（アイコン左 + テキスト右の横並び）
      // ボックスの縦中心は IGW.y なので、上辺 = IGW.y - 14、下辺 = IGW.y + 14
      // → INET ラベル（y=12）や VPC 上辺（y=62）と被らない高さに収まる
      p5.strokeWeight(s === 3 ? 2.5 : 2)
      p5.stroke(igwCol[0], igwCol[1], igwCol[2], 255 * glow)  // ★alphaに glow を適用
      p5.noFill()  // 塗りなし（背景を透かす）
      p5.rect(IGW.x - 60, IGW.y - 14, 120, 28, 0)  // 角丸なし
      // SVG アイコン（22×22px、ボックス左端から配置）
      if (imgIgw.current) {
        p5.image(imgIgw.current, IGW.x - 58, IGW.y - 12, 22, 22)
      }
      // アイコン右側にテキストを左揃えで描画
      p5.noStroke()
      p5.fill(...igwCol)
      p5.textSize(10); p5.textAlign(p5.LEFT, p5.CENTER)
      p5.text('インターネットGW', IGW.x - 30, IGW.y + 1)
    }

    // ─── ステップ 4〜: インターネット + パブリック EC2（パケットなし）──
    if (s >= 4 && s !== 8) {
      // キャンバス最上部に「インターネット」ラベルを表示
      p5.noStroke()
      p5.fill(80, 80, 80)
      p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text('🌍 インターネット', INET.x, INET.y)

      // インターネット → IGW → EC2 の接続経路を薄い灰色の線で表示
      p5.stroke(180, 200, 220); p5.strokeWeight(1)
      p5.line(INET.x, INET.y + 6, IGW.x, IGW.y - 13)        // Internet → IGW 上辺
      p5.line(IGW.x, IGW.y + 13, EC2_PUB.x, EC2_PUB.y - 26) // IGW 下辺 → EC2 上辺

      // パブリックサブネット内の EC2 ボックスを描画（ヘルパー関数を使用）
      ec2Box(p5, EC2_PUB.x, EC2_PUB.y, 'EC2\n(Webサーバー)', [37, 99, 235])
    }

    // ─── ステップ 6〜: プライベート EC2 ＋ 内部接続ライン ────────────
    if (s >= 6 && s !== 8) {
      // パブリック EC2 とプライベート EC2 の間の内部通信経路（薄紫の線）
      p5.stroke(180, 180, 220); p5.strokeWeight(1)
      p5.line(EC2_PUB.x + 38, EC2_PUB.y, EC2_PRI.x - 38, EC2_PRI.y)
      // プライベートサブネット内の EC2（DBサーバー）を描画
      ec2Box(p5, EC2_PRI.x, EC2_PRI.y, 'EC2\n(DBサーバー)', [5, 150, 105])
    }

    // ─── ステップ 7〜: NAT ゲートウェイ ──────────────────────────────
    if (s >= 7 && s !== 8) {
      // ステップ 7 のみグロー点灯で NAT GW の存在を強調
      const glow = s === 7 ? 0.6 + Math.sin(t * 0.1) * 0.4 : 1

      // NAT GW への接続経路（薄灰色の線）
      p5.stroke(200, 200, 200); p5.strokeWeight(1)
      p5.line(NAT.x, NAT.y - 14, IGW.x, IGW.y + 13)          // NAT 上辺 → IGW 下辺
      p5.line(EC2_PRI.x, EC2_PRI.y - 26, NAT.x + 44, NAT.y)  // プライベート EC2 → NAT 右端

      // NAT ゲートウェイ ボックス（NAT アイコン色 #8c4fff）
      const natCol: [number, number, number] = [140, 79, 255]
      p5.strokeWeight(s === 7 ? 2.5 : 2)
      p5.stroke(natCol[0], natCol[1], natCol[2], 255 * glow)  // ★alphaに glow を適用
      p5.noFill()
      p5.rect(NAT.x - 44, NAT.y - 14, 88, 28, 0)
      if (imgNat.current) {
        p5.image(imgNat.current, NAT.x - 42, NAT.y - 12, 24, 24)
      }
      p5.noStroke()
      p5.fill(...natCol)
      p5.textSize(9); p5.textAlign(p5.CENTER)
      p5.text('NAT Gateway', NAT.x + 12, NAT.y + 1)
    }


    // ─── ステップ 8: Multi-AZ 専用レイアウト ────────────────────────
    if (s === 8) {
      // STEP8は重なり回避のため、専用図のみ表示する
      p5.strokeWeight(1.6)
      p5.stroke(120, 135, 190)
      p5.fill(250, 252, 255)
      p5.rect(22, 74, 616, 248, 0)

      p5.noStroke(); p5.textAlign(p5.LEFT)
      p5.fill(55, 75, 145); p5.textSize(12)
      p5.text('同一VPC（10.0.0.0/16）内で Multi-AZ 構成を作る', 34, 94)

      const azY = 110
      const azW = 284
      const azH = 160
      const azAX = 34
      const azCX = 342

      // AZ-a パネル
      p5.strokeWeight(1.4); p5.stroke(140, 170, 150)
      p5.fill(245, 252, 248)
      p5.rect(azAX, azY, azW, azH, 0)
      p5.noStroke(); p5.fill(65, 95, 80); p5.textSize(10.5)
      p5.text('AZ-a', azAX + 10, azY + 16)

      // AZ-c パネル
      p5.strokeWeight(1.4); p5.stroke(140, 170, 150)
      p5.fill(245, 252, 248)
      p5.rect(azCX, azY, azW, azH, 0)
      p5.noStroke(); p5.fill(65, 95, 80); p5.textSize(10.5)
      p5.text('AZ-c', azCX + 10, azY + 16)

      // 各AZ内の Public / Private サブネット
      const subnetW = 126
      const subnetH = 122
      const subnetY = azY + 26

      // AZ-a
      p5.strokeWeight(1.2); p5.stroke(59, 130, 246); p5.fill(240, 247, 255)
      p5.rect(azAX + 10, subnetY, subnetW, subnetH, 0)
      p5.noStroke(); p5.fill(37, 99, 235); p5.textSize(9.5)
      p5.text('Public Subnet', azAX + 16, subnetY + 14)

      p5.strokeWeight(1.2); p5.stroke(16, 185, 129); p5.fill(240, 255, 248)
      p5.rect(azAX + 146, subnetY, subnetW, subnetH, 0)
      p5.noStroke(); p5.fill(5, 150, 105); p5.textSize(9.5)
      p5.text('Private Subnet', azAX + 152, subnetY + 14)

      // AZ-c
      p5.strokeWeight(1.2); p5.stroke(59, 130, 246); p5.fill(240, 247, 255)
      p5.rect(azCX + 10, subnetY, subnetW, subnetH, 0)
      p5.noStroke(); p5.fill(37, 99, 235); p5.textSize(9.5)
      p5.text('Public Subnet', azCX + 16, subnetY + 14)

      p5.strokeWeight(1.2); p5.stroke(16, 185, 129); p5.fill(240, 255, 248)
      p5.rect(azCX + 146, subnetY, subnetW, subnetH, 0)
      p5.noStroke(); p5.fill(5, 150, 105); p5.textSize(9.5)
      p5.text('Private Subnet', azCX + 152, subnetY + 14)

      // 各AZに同じ役割のEC2を配置
      ec2Box(p5, azAX + 72,  subnetY + 70, 'EC2\nWeb', [37, 99, 235])
      ec2Box(p5, azAX + 208, subnetY + 70, 'EC2\nDB',  [5, 150, 105])
      ec2Box(p5, azCX + 72,  subnetY + 70, 'EC2\nWeb', [37, 99, 235])
      ec2Box(p5, azCX + 208, subnetY + 70, 'EC2\nDB',  [5, 150, 105])

      // 同じ構成を示す横線（直交）
      p5.stroke(22, 163, 74); p5.strokeWeight(1.4)
      p5.line(azAX + azW, azY + 58, azCX, azY + 58)
      p5.line(azAX + azW, azY + 132, azCX, azY + 132)

      p5.noStroke(); p5.fill(70, 80, 90); p5.textSize(14)
      p5.text('同一VPCの中で、AZごとに同じ構成を複製して高可用性を確保', 310, 292)
    }

    // ─── ステップ 9: ルートテーブル オーバーレイ ──────────────────────
    if (s >= 9) {
      // カードの座標とサイズ
      const rx = 500, ry = 100, rw = 150, rh = 80
      p5.strokeWeight(1); p5.stroke(160, 160, 200)
      p5.fill(255, 255, 255, 230)  // 半透明の白（下の図が透ける）
      p5.rect(rx, ry, rw, rh, 0)   // 角丸なし
      p5.noStroke()
      p5.textAlign(p5.LEFT); p5.textSize(8.5)
      // タイトル行
      p5.fill(50, 50, 160)
      p5.text('📋 パブリック用 ルートテーブル', rx + 8, ry + 14)
      // ヘッダー行
      p5.fill(100, 100, 100)
      p5.text('送信先              ターゲット', rx + 8, ry + 28)
      // ルート 1: VPC 内部は「local」へ
      p5.fill(60, 60, 60)
      p5.text('10.0.0.0/16      local', rx + 8, ry + 42)
      // ルート 2: それ以外（0.0.0.0/0）はすべて IGW へ → インターネット接続のカギ
      p5.fill(37, 99, 235)
      p5.text('0.0.0.0/0          IGW', rx + 8, ry + 56)
      // 補足コメント
      p5.fill(100, 100, 100)
      p5.text('← これがインターネット接続の設定', rx + 8, ry + 70)
    }

    // ─── パケット発生ロジック ────────────────────────────────────────
    // 「前のパケットが消えたら次を出す」というシーケンシャル方式
    const seq = getSequence(s)  // 今のステップの経路リスト（空 = アニメなし）
    if (seq.length > 0 && !pkts.current.some(p => p.active)) {
      if (waitRef.current > 0) {
        // ループ待機中: カウントダウンして次のループ開始を待つ
        waitRef.current--
      } else if (phaseRef.current >= seq.length) {
        // 全セグメント完了 → 最初に戻してウェイトを設定（約 1.25 秒 = 50f ÷ 40fps）
        phaseRef.current = 0
        waitRef.current = 50
      } else {
        // 次のセグメントのパケットを spawn する
        const [from, to, col, blocked] = seq[phaseRef.current]
        spawn(from, to, col, blocked ?? false)
        phaseRef.current++  // 次回は 1 つ後のセグメントへ進む
      }
    }

    // ─── パケットの移動と描画 ────────────────────────────────────────
    // 非アクティブになったパケットを除去してからループする
    pkts.current = pkts.current.filter((pk) => pk.active)
    for (const pk of pkts.current) {
      pk.progress += pk.speed  // progress を進める（0→1 で経路を完走）

      // ブロックパケットは progress=0.75（75%地点）で消滅させる
      if (pk.blocked && pk.progress >= 0.75) { pk.active = false; continue }
      // 通常パケットは progress=1（到着）で消滅
      if (!pk.blocked && pk.progress >= 1)   { pk.active = false; continue }

      // lerp で現在の座標を線形補間（出発点と到着点の間を progress 割合で進む）
      const ep = easeInOutCubic(Math.min(pk.progress, 1))  // ★イージング適用
      const px = p5.lerp(pk.x, pk.tx, ep)
      const py = p5.lerp(pk.y, pk.ty, ep)

      // ★矢印を先頭に描画
      const angle = Math.atan2(pk.ty - pk.y, pk.tx - pk.x)
      p5.push()
      p5.translate(
        px + Math.cos(angle) * 9,
        py + Math.sin(angle) * 9
      )
      p5.rotate(angle)
      p5.fill(...pk.color)
      p5.noStroke()
      p5.triangle(0, -3, 0, 3, 8, 0)
      p5.pop()

      // パケット本体（変更なし）
      p5.noStroke()
      p5.fill(...pk.color)
      p5.circle(px, py, 11)

      if (!pk.blocked) {
        // 通常パケット: 中央に白い小円を重ねてドーナツ状に見せる
        p5.fill(255); p5.circle(px, py, 4)
      } else {
        // ブロックパケット: 残り距離に応じてフェードアウトしながら赤×を表示
        // progress が 0.75 に近づくほど alpha が 0 に近づく
        const alpha = Math.max(0, (0.75 - pk.progress) * 4 * 255)
        p5.fill(239, 68, 68, alpha)      // 赤い円
        p5.circle(px, py, 14)
        p5.fill(255, 255, 255, alpha)    // 白い「✕」テキスト
        p5.textSize(9); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('✕', px, py)
      }
    }

    // ─── パケット凡例（ステップ 5〜）────────────────────────────────
    // キャンバス左下に色と意味の対応を表示する
    if (s >= 5 && s !== 8) {
      p5.noStroke(); p5.textSize(14); p5.textAlign(p5.LEFT)
      // 青 = インバウンド（外→内）
      p5.fill(59, 130, 246); p5.circle(20, H - 20, 8)
      p5.fill(70, 70, 70); p5.text('インバウンド', 28, H - 20)
      // 緑 = アウトバウンド（内→外）
      p5.fill(16, 185, 129); p5.circle(126, H - 20, 8)
      p5.fill(70, 70, 70); p5.text('アウトバウンド', 134, H - 20)
      if (s === 6) {
        // ステップ 6 のみ: 紫 = VPC 内部通信（Web ↔ DB）
        p5.fill(139, 92, 246); p5.circle(240, H - 20, 8)
        p5.fill(70, 70, 70); p5.text('内部通信(Web↔DB)', 248, H - 20)
      }
      if (s >= 7) {
        // ステップ 7〜: 赤 = ブロック（プライベート EC2 への外部アクセス不可）
        p5.fill(239, 68, 68); p5.circle(240, H - 20, 8)
        p5.fill(70, 70, 70); p5.text('ブロック', 248, H - 20)
      }
    }
    // ─── ホバーツールチップ ────────────────────────────────────────────
    const tooltips = [
      {
        node: EC2_PUB,
        show: s >= 4 && s !== 8,
        label: 'パブリックEC2\nパブリックIPを持つ\nSG: Port80/443を許可',
      },
      {
        node: EC2_PRI,
        show: s >= 6 && s !== 8,
        label: 'プライベートEC2\n外部から直接到達不可\nRDS/DBサーバー等を配置',
      },
      {
        node: IGW,
        show: s >= 3 && s !== 8,
        label: 'インターネットGW (IGW)\n1VPCにつき1つ\nルートテーブルへの設定も必要',
      },
      {
        node: NAT,
        show: s >= 7 && s !== 8,
        label: 'NAT Gateway\n外向き通信のみ許可\n料金: $0.045/h + データ転送料',
      },
    ]

    for (const tip of tooltips) {
      if (!tip.show) continue
      const d = Math.hypot(p5.mouseX - tip.node.x, p5.mouseY - tip.node.y)
      if (d < 40) {
        const lines = tip.label.split('\n')
        const tw = 170, th = 14 * lines.length + 10
        // 背景カード
        p5.fill(30, 30, 30, 215)
        p5.noStroke()
        const tipX = p5.mouseX + tw + 12 > W ? p5.mouseX - tw - 12 : p5.mouseX + 12
        p5.rect(tipX, p5.mouseY - 10, tw, th, 6)
        // テキスト
        p5.fill(255)
        p5.textSize(9)
        p5.textAlign(p5.LEFT, p5.TOP)
        lines.forEach((ln: string, i: number) =>
          p5.text(ln, p5.mouseX + 18, p5.mouseY - 4 + i * 14)
        )
      }
    }
  }

  // ── UI（JSX） ────────────────────────────────────────────────────────────
  // step は 1 始まりなので、配列インデックスは step - 1
  const cur = STEPS[step - 1]

  return (
    <div className="space-y-5 mb-10">

      {/* ステップ進捗バー: クリックで任意ステップへジャンプできる */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-500 shrink-0">
          STEP {step} / {TOTAL}
        </span>
        <div className="flex gap-1.5 flex-1">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i + 1)}
              title={STEPS[i].title}
              className={`h-2.5 rounded-full transition-all duration-300 flex-1 ${
                i + 1 === step
                  ? 'bg-orange-500'
                  : i + 1 < step
                  ? 'bg-orange-300'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-50">
        <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-gray-600 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            VPC アーキテクチャ図（ステップ {step}/{TOTAL}）
          </span>
          <span className="text-gray-400 font-normal">💡 {cur.hint}</span>
        </div>
        <Sketch setup={setup} draw={draw} />
      </div>

      {/* Step description */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{cur.emoji}</span>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
              ステップ {step}
            </p>
            <h3 className="text-xl font-bold text-gray-800">{cur.title}</h3>
          </div>
        </div>

        <p className="text-gray-700 text-sm leading-relaxed mb-5">{cur.description}</p>

        <ul className="space-y-2.5">
          {cur.keyPoints.map((kp, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                ✓
              </span>
              {kp}
            </li>
          ))}
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ← 前へ
        </button>

        {/* Step dots */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i + 1)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i + 1 === step ? 'bg-orange-500 scale-125' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setStep((s) => Math.min(TOTAL, s + 1))}
          disabled={step === TOTAL}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {step === TOTAL ? '完了！🎉' : '次へ →'}
        </button>
      </div>

      {/* Completion message */}
      {step === TOTAL && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <p className="font-bold text-green-700 mb-1">VPC初級コンテンツ完了！</p>
          <p className="text-sm text-green-600">下の練習問題で理解度を確認しましょう。</p>
        </div>
      )}
    </div>
  )
}
