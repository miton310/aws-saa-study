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
    title: 'まとめ：VPCの基本構成',
    emoji: '🎯',
    description:
      'これがAWSの最も基本的なVPCアーキテクチャです。パブリックサブネット（Webサーバー）とプライベートサブネット（DBサーバー）の2層構造が試験の頻出パターンです。ルートテーブルの設定もチェックしてください。',
    keyPoints: [
      'Webサーバー → パブリックサブネット（IGW経由で外部公開）',
      'DBサーバー → プライベートサブネット（外部から完全隔離）',
      '高可用性のためには複数のAZに同じ構成を作成する（Multi-AZ）',
    ],
    hint: 'ルートテーブルでトラフィックの経路を制御します',
  },
]

const TOTAL = STEPS.length

// ── Canvas layout constants ────────────────────────────────────────────────

const W = 660
const H = 340

const INET = { x: 330, y: 12 }
const IGW  = { x: 330, y: 40 }
const VPC  = { x: 10,  y: 62, w: 640, h: 268 }
const PUB  = { x: 48,  y: 110, w: 238, h: 186 }
const PRI  = { x: 374, y: 110, w: 238, h: 186 }
const NAT  = { x: 300, y: 236 }
const EC2_PUB = { x: 148, y: 216 }
const EC2_PRI = { x: 478, y: 216 }

interface Packet {
  x: number; y: number; tx: number; ty: number
  progress: number; speed: number
  color: [number, number, number]
  active: boolean; blocked: boolean
}

type Seg = [{ x: number; y: number }, { x: number; y: number }, [number, number, number], boolean?]

function getSequence(s: number): Seg[] {
  if (s === 5) return [
    [INET, IGW,     [59, 130, 246]],
    [IGW,  EC2_PUB, [59, 130, 246]],
  ]
  if (s === 6) return [
    [INET,    IGW,     [59, 130, 246]],
    [IGW,     EC2_PUB, [59, 130, 246]],
    [EC2_PUB, EC2_PRI, [139, 92, 246]],
    [EC2_PRI, EC2_PUB, [139, 92, 246]],
    [EC2_PUB, IGW,     [16, 185, 129]],
    [IGW,     INET,    [16, 185, 129]],
  ]
  if (s >= 7) return [
    [EC2_PRI, NAT,  [16, 185, 129]],
    [NAT,     IGW,  [16, 185, 129]],
    [IGW,     INET, [16, 185, 129]],
    [INET,    IGW,  [239, 68, 68], true],
    [IGW,     { x: (IGW.x + EC2_PRI.x) / 2, y: (IGW.y + EC2_PRI.y) / 2 }, [239, 68, 68], true],
  ]
  return []
}

// ── Component ─────────────────────────────────────────────────────────────

export default function VPCBeginnerStepper() {
  const [step, setStep] = useState(1)
  const stepRef = useRef(1)
  const timerRef = useRef(0)
  const pkts = useRef<Packet[]>([])
  const phaseRef = useRef(0)
  const waitRef = useRef(0)

  useEffect(() => {
    stepRef.current = step
    pkts.current = []
    timerRef.current = 0
    phaseRef.current = 0
    waitRef.current = 0
  }, [step])

  // ── p5 helpers ────────────────────────────────────────────────────────

  function spawn(from: { x: number; y: number }, to: { x: number; y: number }, col: [number, number, number], blocked = false) {
    pkts.current.push({ x: from.x, y: from.y, tx: to.x, ty: to.y, progress: 0, speed: 0.018 + Math.random() * 0.007, color: col, active: true, blocked })
  }

  function ec2Box(p5: any, cx: number, cy: number, label: string, col: [number, number, number]) {
    p5.strokeWeight(1.5)
    p5.stroke(...col)
    p5.fill(col[0], col[1], col[2], 35)
    p5.rect(cx - 38, cy - 26, 76, 52, 8)
    p5.noStroke()
    p5.fill(...col)
    p5.textSize(14)
    p5.textAlign(p5.CENTER, p5.CENTER)
    p5.text('💻', cx, cy - 9)
    p5.textSize(8)
    label.split('\n').forEach((ln: string, i: number) => p5.text(ln, cx, cy + 8 + i * 12))
  }

  // ── p5 setup / draw ───────────────────────────────────────────────────

  const setup = (p5: any, ref: any) => {
    p5.createCanvas(W, H).parent(ref)
    p5.frameRate(40)
  }

  const draw = (p5: any) => {
    const s = stepRef.current
    timerRef.current++
    const t = timerRef.current
    p5.background(248, 250, 252)

    // ─── Step 1+: VPC box ─────────────────────────────────────────────
    const vpcPulse = s === 1 ? 0.65 + Math.sin(t * 0.07) * 0.35 : 1
    p5.strokeWeight(2.5)
    p5.stroke(99, 102, 241, 255 * vpcPulse)
    p5.fill(238, 242, 255, s === 1 ? 140 * vpcPulse : 180)
    p5.rect(VPC.x, VPC.y, VPC.w, VPC.h, 12)
    p5.noStroke()
    p5.fill(99, 102, 241)
    p5.textSize(10)
    p5.textAlign(p5.LEFT)
    p5.text('VPC  10.0.0.0/16', VPC.x + 10, VPC.y + 16)
    if (s === 1) {
      // Label center
      p5.textSize(13)
      p5.textAlign(p5.CENTER)
      p5.fill(99, 102, 241, 180 * vpcPulse)
      p5.text('Virtual Private Cloud', W / 2, VPC.y + VPC.h / 2)
    }

    // ─── Step 2+: Subnets ────────────────────────────────────────────
    if (s >= 2) {
      const alpha = s === 2 ? Math.min(255, t * 5) : 255

      p5.strokeWeight(1.5)
      p5.stroke(59, 130, 246, alpha)
      p5.fill(219, 234, 254, alpha * 0.75)
      p5.rect(PUB.x, PUB.y, PUB.w, PUB.h, 8)
      p5.noStroke()
      p5.fill(59, 130, 246, alpha)
      p5.textSize(9); p5.textAlign(p5.CENTER)
      p5.text('パブリックサブネット', PUB.x + PUB.w / 2, PUB.y + 14)
      p5.textSize(8)
      p5.text('10.0.1.0/24', PUB.x + PUB.w / 2, PUB.y + 26)

      p5.strokeWeight(1.5)
      p5.stroke(16, 185, 129, alpha)
      p5.fill(209, 250, 229, alpha * 0.75)
      p5.rect(PRI.x, PRI.y, PRI.w, PRI.h, 8)
      p5.noStroke()
      p5.fill(16, 185, 129, alpha)
      p5.textSize(9); p5.textAlign(p5.CENTER)
      p5.text('プライベートサブネット', PRI.x + PRI.w / 2, PRI.y + 14)
      p5.textSize(8)
      p5.text('10.0.2.0/24', PRI.x + PRI.w / 2, PRI.y + 26)
    }

    // ─── Step 3+: IGW ────────────────────────────────────────────────
    if (s >= 3) {
      const glow = s === 3 ? 0.6 + Math.sin(t * 0.1) * 0.4 : 1
      const igwCol: [number, number, number] = [59, 130, 246]

      // Connector line IGW → VPC top
      p5.stroke(...igwCol, 160)
      p5.strokeWeight(1.5)
      p5.line(IGW.x, IGW.y + 13, IGW.x, VPC.y)

      // IGW box
      p5.strokeWeight(2)
      p5.stroke(...igwCol)
      p5.fill(igwCol[0], igwCol[1], igwCol[2], 50 + glow * 80)
      p5.rect(IGW.x - 44, IGW.y - 13, 88, 26, 7)
      p5.noStroke()
      p5.fill(...igwCol)
      p5.textSize(9); p5.textAlign(p5.CENTER)
      p5.text('🌐 インターネットGW (IGW)', IGW.x, IGW.y + 4)
    }

    // ─── Step 4+: Internet + Public EC2 (no packets yet) ────────────
    if (s >= 4) {
      // Internet label
      p5.noStroke()
      p5.fill(80, 80, 80)
      p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text('🌍 インターネット', INET.x, INET.y)

      // Lines
      p5.stroke(180, 200, 220); p5.strokeWeight(1)
      p5.line(INET.x, INET.y + 6, IGW.x, IGW.y - 13)
      p5.line(IGW.x, IGW.y + 13, EC2_PUB.x, EC2_PUB.y - 26)

      // Public EC2 box
      ec2Box(p5, EC2_PUB.x, EC2_PUB.y, 'EC2\n(Webサーバー)', [37, 99, 235])
    }

    // ─── Step 6+: Private EC2 + internal connection line ─────────────
    if (s >= 6) {
      p5.stroke(180, 180, 220); p5.strokeWeight(1)
      p5.line(EC2_PUB.x + 38, EC2_PUB.y, EC2_PRI.x - 38, EC2_PRI.y)
      ec2Box(p5, EC2_PRI.x, EC2_PRI.y, 'EC2\n(DBサーバー)', [5, 150, 105])
    }

    // ─── Step 7+: NAT GW ─────────────────────────────────────────────
    if (s >= 7) {
      const glow = s === 7 ? 0.6 + Math.sin(t * 0.1) * 0.4 : 1

      // Lines to NAT
      p5.stroke(200, 200, 200); p5.strokeWeight(1)
      p5.line(NAT.x, NAT.y - 14, IGW.x, IGW.y + 13)
      p5.line(EC2_PRI.x, EC2_PRI.y - 26, NAT.x + 44, NAT.y)

      // NAT box
      p5.strokeWeight(2)
      p5.stroke(245, 158, 11)
      p5.fill(254, 243, 199, 60 + glow * 80)
      p5.rect(NAT.x - 44, NAT.y - 14, 88, 28, 7)
      p5.noStroke()
      p5.fill(160, 100, 0)
      p5.textSize(9); p5.textAlign(p5.CENTER)
      p5.text('⚡ NAT Gateway', NAT.x, NAT.y + 4)
    }


    // ─── Step 8: Route table overlay ─────────────────────────────────
    if (s >= 8) {
      const rx = 400, ry = 100, rw = 220, rh = 80
      p5.strokeWeight(1); p5.stroke(160, 160, 200)
      p5.fill(255, 255, 255, 230)
      p5.rect(rx, ry, rw, rh, 8)
      p5.noStroke()
      p5.textAlign(p5.LEFT); p5.textSize(8.5)
      p5.fill(50, 50, 160)
      p5.text('📋 パブリック用 ルートテーブル', rx + 8, ry + 14)
      p5.fill(100, 100, 100)
      p5.text('送信先              ターゲット', rx + 8, ry + 28)
      p5.fill(60, 60, 60)
      p5.text('10.0.0.0/16      local', rx + 8, ry + 42)
      p5.fill(37, 99, 235)
      p5.text('0.0.0.0/0          IGW', rx + 8, ry + 56)
      p5.fill(100, 100, 100)
      p5.text('← これがインターネット接続の設定', rx + 8, ry + 70)
    }

    // ─── Single-packet phase spawning ────────────────────────────────
    const seq = getSequence(s)
    if (seq.length > 0 && !pkts.current.some(p => p.active)) {
      if (waitRef.current > 0) {
        waitRef.current--
      } else if (phaseRef.current >= seq.length) {
        phaseRef.current = 0
        waitRef.current = 50
      } else {
        const [from, to, col, blocked] = seq[phaseRef.current]
        spawn(from, to, col, blocked ?? false)
        phaseRef.current++
      }
    }

    // ─── Draw packets ─────────────────────────────────────────────────
    pkts.current = pkts.current.filter((pk) => pk.active)
    for (const pk of pkts.current) {
      pk.progress += pk.speed
      if (pk.blocked && pk.progress >= 0.75) { pk.active = false; continue }
      if (!pk.blocked && pk.progress >= 1)   { pk.active = false; continue }

      const px = p5.lerp(pk.x, pk.tx, pk.progress)
      const py = p5.lerp(pk.y, pk.ty, pk.progress)

      p5.noStroke()
      p5.fill(...pk.color)
      p5.circle(px, py, 11)
      if (!pk.blocked) {
        p5.fill(255); p5.circle(px, py, 4)
      } else {
        // Fading X
        const alpha = Math.max(0, (0.75 - pk.progress) * 4 * 255)
        p5.fill(239, 68, 68, alpha)
        p5.circle(px, py, 14)
        p5.fill(255, 255, 255, alpha)
        p5.textSize(9); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('✕', px, py)
      }
    }

    // ─── Packet legend (steps 5+) ────────────────────────────────────
    if (s >= 5) {
      p5.noStroke(); p5.textSize(8.5); p5.textAlign(p5.LEFT)
      p5.fill(59, 130, 246); p5.circle(14, H - 20, 8)
      p5.fill(70, 70, 70); p5.text('インバウンド', 22, H - 16)
      p5.fill(16, 185, 129); p5.circle(110, H - 20, 8)
      p5.fill(70, 70, 70); p5.text('アウトバウンド', 118, H - 16)
      if (s === 6) {
        p5.fill(139, 92, 246); p5.circle(220, H - 20, 8)
        p5.fill(70, 70, 70); p5.text('内部通信(Web↔DB)', 228, H - 16)
      }
      if (s >= 7) {
        p5.fill(239, 68, 68); p5.circle(220, H - 20, 8)
        p5.fill(70, 70, 70); p5.text('ブロック', 228, H - 16)
      }
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  const cur = STEPS[step - 1]

  return (
    <div className="space-y-5 mb-10">

      {/* Progress bar */}
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
