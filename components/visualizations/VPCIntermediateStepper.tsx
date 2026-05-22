'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

const STEPS = [
  {
    id: 1,
    title: 'セキュリティグループ（SG）とは',
    emoji: '🛡️',
    description: 'セキュリティグループはEC2インスタンスに直接適用される仮想ファイアウォールです。インバウンド（受信）とアウトバウンド（送信）のルールを個別に設定します。',
    keyPoints: [
      'EC2インスタンスレベルで動作するファイアウォール',
      '許可ルールのみ設定可能（拒否ルールは書けない）',
      '1つのEC2に複数のSGを適用できる',
    ],
    hint: 'EC2を囲む盾がセキュリティグループを表しています',
  },
  {
    id: 2,
    title: 'インバウンドルール - 許可',
    emoji: '✅',
    description: 'HTTP(80番ポート)を許可するルールがある場合、インターネットからのリクエストはEC2まで届きます。許可されたトラフィックはSGの盾を通過できます。',
    keyPoints: [
      'ポート80(HTTP)、443(HTTPS)などを明示的に許可する',
      'ソースIPやCIDRで接続元を制限できる',
      'デフォルトは全インバウンド拒否',
    ],
    hint: '青パケット：ポート80許可 → EC2まで届く',
  },
  {
    id: 3,
    title: 'インバウンドルール - ブロック',
    emoji: '🚫',
    description: 'ルールに存在しないポート（SSH:22など）への通信はSGで自動的に拒否されます。パケットはEC2の手前で弾かれます。',
    keyPoints: [
      'ルールに一致しないトラフィックは暗黙的に拒否',
      'SSH(22)は必要な場合のみ特定IPから許可する',
      'セキュリティグループは「許可」ベースで動作する',
    ],
    hint: '赤パケット：ルールなし → 盾の手前でブロック',
  },
  {
    id: 4,
    title: 'SGはステートフル',
    emoji: '🔄',
    description: 'セキュリティグループはステートフルです。インバウンドで許可したトラフィックの返り（レスポンス）は、アウトバウンドルールがなくても自動的に通過できます。',
    keyPoints: [
      'ステートフル：通信状態を追跡し、返りトラフィックを自動許可',
      'アウトバウンドルールを設定しなくても応答は通る',
      'ネットワークACL（ステートレス）との最大の違い',
    ],
    hint: '青（リクエスト）→ 緑（レスポンス：アウトバウンドルール不要で自動許可）',
  },
  {
    id: 5,
    title: 'ネットワークACL（NACL）とは',
    emoji: '🔒',
    description: 'ネットワークACLはサブネットレベルのファイアウォールです。トラフィックはNACL → SGの2段階でチェックされます。NACLはサブネット内の全インスタンスに適用されます。',
    keyPoints: [
      'サブネット全体に適用されるファイアウォール（EC2一台ではなくサブネット単位）',
      'ルール番号の小さい順に評価（最初に一致したルールが適用）',
      'デフォルトNACLは全許可、カスタムNACLは全拒否から始まる',
    ],
    hint: '橙色の点線がNACL（サブネット境界のフィルタ）を表しています',
  },
  {
    id: 6,
    title: 'NACLはステートレス',
    emoji: '⚖️',
    description: 'NACLはステートレスです。インバウンドを許可しても、アウトバウンドのルールを別途設定しないと、返りのトラフィックがNACLでブロックされます。',
    keyPoints: [
      'ステートレス：インバウンドとアウトバウンドを独立して評価',
      'エフェメラルポート（1024-65535）のアウトバウンド許可が必要',
      'SGとNACLを組み合わせることで多層防御を実現',
    ],
    hint: '戻りパケットがNACLのアウトバウンドルールでブロックされています',
  },
  {
    id: 7,
    title: 'VPCピアリング',
    emoji: '🤝',
    description: '異なるVPC同士をプライベートに接続する機能です。インターネットを経由せず、AWSバックボーンネットワーク上でVPC間通信が可能になります。',
    keyPoints: [
      'CIDRブロックが重複している場合は接続不可',
      'トランジティブルーティング不可（A-B-C接続でA-C通信は不可）',
      '双方のVPCでルートテーブルの設定が必要',
    ],
    hint: '2つのVPCがピアリングでプライベート接続されています',
  },
  {
    id: 8,
    title: 'まとめ：SG vs NACL',
    emoji: '🎯',
    description: 'SG（ステートフル・インスタンスレベル）とNACL（ステートレス・サブネットレベル）の違いは試験最頻出です。二層防御の考え方も押さえましょう。',
    keyPoints: [
      'SG：ステートフル、許可のみ、インスタンスレベル、戻り自動許可',
      'NACL：ステートレス、許可・拒否両方、サブネットレベル、戻りも要設定',
      'VPCピアリング：非推移的、CIDR重複不可、両側のルートテーブル設定必要',
    ],
    hint: 'SGはインスタンス盾、NACLはサブネット点線で覚える',
  },
]

const TOTAL = STEPS.length

const W = 660
const H = 340

// Steps 1-6 layout (SG/NACL)
const INET     = { x: 165, y: 12 }
const IGW      = { x: 165, y: 42 }
const VPC_B    = { x: 10,  y: 64, w: 460, h: 266 }
const PUB      = { x: 46,  y: 112, w: 390, h: 190 }
const EC2      = { x: 290, y: 215 }
const SG_R     = 52
const SG_BLOCK = { x: EC2.x - SG_R - 2, y: EC2.y }
// NACL blocked return: target calculated so blocked (at 75%) stops at subnet top edge
// Subnet top y=112, on EC2(290,215)→IGW(165,42) line: x≈217 at y=112
// TARGET = EC2 + (NACL_EXIT - EC2) / 0.75
const NACL_BLOCK_TARGET = { x: 193, y: 78 }

// Step 7-8 layout (VPC Peering)
const VPC1  = { x: 10,  y: 45, w: 270, h: 185 }
const VPC2  = { x: 380, y: 45, w: 270, h: 185 }
const EC2_A = { x: 140, y: 155 }
const EC2_B = { x: 510, y: 155 }
const PEER  = { x: 330, y: 135 }

interface Packet {
  x: number; y: number; tx: number; ty: number
  progress: number; speed: number
  color: [number, number, number]
  active: boolean; blocked: boolean
}

type Seg = [{ x: number; y: number }, { x: number; y: number }, [number, number, number], boolean?]

function getSequence(s: number): Seg[] {
  if (s === 2) return [
    [INET, IGW, [59, 130, 246]],
    [IGW,  EC2, [59, 130, 246]],
  ]
  if (s === 3) return [
    [INET,     IGW,      [239, 68, 68]],
    [IGW,      SG_BLOCK, [239, 68, 68], true],
  ]
  if (s === 4) return [
    [INET, IGW,  [59, 130, 246]],
    [IGW,  EC2,  [59, 130, 246]],
    [EC2,  IGW,  [16, 185, 129]],
    [IGW,  INET, [16, 185, 129]],
  ]
  if (s === 5) return [
    [INET, IGW, [59, 130, 246]],
    [IGW,  EC2, [59, 130, 246]],
  ]
  if (s === 6) return [
    [INET, IGW,               [59, 130, 246]],
    [IGW,  EC2,               [59, 130, 246]],
    [EC2,  NACL_BLOCK_TARGET, [239, 68, 68], true],
  ]
  if (s === 7) return [
    [EC2_A, PEER,  [139, 92, 246]],
    [PEER,  EC2_B, [139, 92, 246]],
    [EC2_B, PEER,  [16, 185, 129]],
    [PEER,  EC2_A, [16, 185, 129]],
  ]
  return []
}

export default function VPCIntermediateStepper() {
  const [step, setStep] = useState(1)
  const stepRef = useRef(1)
  const timerRef = useRef(0)
  const pkts = useRef<Packet[]>([])
  const phaseRef = useRef(0)
  const waitRef = useRef(0)
  const imgInternet = useRef<unknown>(null)
  const imgEc2 = useRef<unknown>(null)
  const imgIgw = useRef<unknown>(null)
  const imgVpc = useRef<unknown>(null)
  const imgPublicSubnet = useRef<unknown>(null)

  useEffect(() => {
    stepRef.current = step
    pkts.current = []
    timerRef.current = 0
    phaseRef.current = 0
    waitRef.current = 0
  }, [step])

  function spawn(from: { x: number; y: number }, to: { x: number; y: number }, col: [number, number, number], blocked = false) {
    pkts.current.push({ x: from.x, y: from.y, tx: to.x, ty: to.y, progress: 0, speed: 0.022 + Math.random() * 0.006, color: col, active: true, blocked })
  }

  function ec2Box(p5: any, cx: number, cy: number, label: string, col: [number, number, number]) {
    p5.strokeWeight(1.5); p5.stroke(...col)
    p5.fill(col[0], col[1], col[2], 35)
    p5.rect(cx - 38, cy - 26, 76, 52, 0)
    if (imgEc2.current) {
      p5.image(imgEc2.current, cx - 13, cy - 23, 26, 26)
    }
    p5.noStroke(); p5.fill(...col)
    p5.textSize(8)
    label.split('\n').forEach((ln: string, i: number) => p5.text(ln, cx, cy + 8 + i * 12))
  }

  const setup = (p5: any, ref: any) => {
    p5.createCanvas(W, H).parent(ref)
    p5.frameRate(40)
    p5.loadImage('/icons/aws/internet.svg', (img: unknown) => { imgInternet.current = img })
    p5.loadImage('/icons/aws/ec2.svg', (img: unknown) => { imgEc2.current = img })
    p5.loadImage('/icons/aws/igw.svg', (img: unknown) => { imgIgw.current = img })
    p5.loadImage('/icons/aws/aws-vpc.svg', (img: unknown) => { imgVpc.current = img })
    p5.loadImage('/icons/aws/publicSubnet.svg', (img: unknown) => { imgPublicSubnet.current = img })
  }

  function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  const draw = (p5: any) => {
    const s = stepRef.current
    timerRef.current++
    const t = timerRef.current
    p5.background(248, 250, 252)

    if (s <= 6 || s === 8) {
      // ─── Steps 1-6, 8: SG/NACL layout ──────────────────────────────

      // VPC box
      p5.strokeWeight(2.5); p5.stroke(140, 80, 255)
      p5.fill(238, 242, 255, 180)
      p5.rect(VPC_B.x, VPC_B.y, VPC_B.w, VPC_B.h, 0)
      if (imgVpc.current) {
        p5.image(imgVpc.current, VPC_B.x, VPC_B.y, 24, 24)
      }
      p5.noStroke(); p5.fill(140, 80, 255)
      p5.textSize(10); p5.textAlign(p5.LEFT)
      p5.text('VPC  10.0.0.0/16', VPC_B.x + 34, VPC_B.y + 16)

      // NACL dashed border (steps 5-6, 8)
      if (s >= 5) {
        const naclGlow = (s === 5 || s === 8) ? 0.5 + Math.sin(t * 0.1) * 0.5 : 0.8
        p5.drawingContext.setLineDash([6, 4])
        p5.strokeWeight(s === 8 ? 2.5 : 2)
        p5.stroke(245, 158, 11, 255 * naclGlow)  // ★glowを適用
        p5.noFill()
        p5.rect(PUB.x - 4, PUB.y - 4, PUB.w + 8, PUB.h + 8, 10)
        p5.drawingContext.setLineDash([])
        p5.noStroke(); p5.fill(245, 158, 11)
        p5.textSize(14); p5.textAlign(p5.LEFT)
        p5.text('NACL', PUB.x - 4, PUB.y - 10)
      }

      // Public subnet (icon color #7aa116)
      p5.strokeWeight(1.5); p5.stroke(122, 161, 22)
      p5.fill(255, 255, 255, 100)
      p5.rect(PUB.x, PUB.y, PUB.w, PUB.h, 0)
      if (imgPublicSubnet.current) {
        p5.image(imgPublicSubnet.current, PUB.x + 0, PUB.y + 0, 24, 24)
      }
      p5.noStroke(); p5.fill(122, 161, 22)
      p5.textSize(9); p5.textAlign(p5.LEFT, p5.CENTER)
      p5.text('パブリックサブネット', PUB.x + 30, PUB.y + 10)

      // IGW
      const igwCol: [number, number, number] = [140, 79, 255]
      p5.stroke(...igwCol, 160); p5.strokeWeight(1.5)
      p5.line(IGW.x, IGW.y + 14, IGW.x, VPC_B.y)
      p5.strokeWeight(2); p5.stroke(...igwCol)
      p5.noFill()
      p5.rect(IGW.x - 60, IGW.y - 14, 120, 28, 0)
      if (imgIgw.current) {
        p5.image(imgIgw.current, IGW.x - 58, IGW.y - 12, 22, 22)
      }
      p5.noStroke(); p5.fill(...igwCol)
      p5.textSize(10); p5.textAlign(p5.LEFT, p5.CENTER)
      p5.text('インターネットGW', IGW.x - 30, IGW.y + 1)

      // Internet label/icon
      if (imgInternet.current) {
        p5.image(imgInternet.current, INET.x - 18, INET.y - 10, 34, 20)
      } else {
        p5.noStroke(); p5.fill(80, 80, 80)
        p5.textSize(11); p5.textAlign(p5.CENTER)
        p5.text('インターネット', INET.x, INET.y)
      }

      // Connection lines
      p5.stroke(180, 200, 220); p5.strokeWeight(1)
      p5.line(INET.x, INET.y + 6, IGW.x, IGW.y - 13)
      p5.line(IGW.x, IGW.y + 13, EC2.x, EC2.y - 26)

      // SG shield (glow circle around EC2)
      const sgGlow = (s === 1 || s === 8) ? 0.5 + Math.sin(t * 0.08) * 0.5 : 0.7
      p5.noStroke()
      p5.fill(99, 102, 241, 30 + sgGlow * 40)
      p5.circle(EC2.x, EC2.y, SG_R * 2 + 8)
      p5.strokeWeight(s === 1 ? 2.5 : 1.5)
      p5.stroke(99, 102, 241, 180 + sgGlow * 75)
      p5.noFill()
      p5.circle(EC2.x, EC2.y, SG_R * 2)
      p5.noStroke(); p5.fill(99, 102, 241, 180 * sgGlow)
      p5.textSize(14); p5.textAlign(p5.CENTER)
      p5.text('SG', EC2.x, EC2.y - SG_R - 8)

      // EC2 box
      ec2Box(p5, EC2.x, EC2.y, 'EC2\n(Webサーバー)', [37, 99, 235])

      // Step-specific labels
      if (s === 2) {
        p5.noStroke(); p5.fill(59, 130, 246, 210)
        p5.textSize(8); p5.textAlign(p5.LEFT)
        p5.text('HTTP:80 → 許可 ✅', EC2.x + 58, EC2.y - 10)
      }
      if (s === 3) {
        p5.noStroke(); p5.fill(239, 68, 68, 210)
        p5.textSize(8); p5.textAlign(p5.LEFT)
        p5.text('SSH:22 → ルールなし 🚫', EC2.x + 58, EC2.y - 10)
      }
      if (s === 4) {
        p5.noStroke(); p5.fill(16, 185, 129, 210)
        p5.textSize(8); p5.textAlign(p5.LEFT)
        p5.text('レスポンス: 自動許可 ↩️', EC2.x + 58, EC2.y + 10)
      }
      if (s === 6) {
        p5.noStroke(); p5.fill(239, 68, 68, 210)
        p5.textSize(8); p5.textAlign(p5.LEFT)
        p5.text('NACL アウトバウンドルールなし 🚫', EC2.x + 58, EC2.y - 10)
      }

      // ─── Right info panel (steps 1-6) ───────────────────────────
      if (s >= 1 && s <= 6) {
        const ipx = 478, ipy = 64, ipw = 172, iph = 266
        p5.strokeWeight(1); p5.stroke(200, 200, 210)
        p5.fill(255, 255, 255, 220)
        p5.rect(ipx, ipy, ipw, iph, 8)
        p5.noStroke(); p5.textAlign(p5.LEFT)

        let infoTitle = ''
        let infoRows: Array<{k: string; v: string; vc?: [number,number,number]}> = []

        if (s === 1) {
          infoTitle = '🛡️ SG の特徴'
          infoRows = [
            { k: '適用単位', v: 'インスタンス' },
            { k: 'ステート', v: 'フル' },
            { k: 'ルール種別', v: '許可のみ' },
            { k: '戻り通信', v: '自動許可', vc: [16, 185, 129] },
            { k: 'デフォルト', v: '全受信を拒否' },
          ]
        } else if (s === 2) {
          infoTitle = '✅ ルール評価'
          infoRows = [
            { k: 'ポート', v: 'HTTP :80' },
            { k: 'SGルール', v: '許可あり ✅', vc: [16, 185, 129] },
            { k: '判定', v: '通過', vc: [16, 185, 129] },
            { k: '到達先', v: 'EC2インスタンス' },
          ]
        } else if (s === 3) {
          infoTitle = '🚫 ルール評価'
          infoRows = [
            { k: 'ポート', v: 'SSH :22' },
            { k: 'SGルール', v: 'なし → 暗黙拒否', vc: [239, 68, 68] },
            { k: '判定', v: 'ブロック 🚫', vc: [239, 68, 68] },
            { k: '停止位置', v: 'SGシールド手前' },
          ]
        } else if (s === 4) {
          infoTitle = '🔄 ステートフル'
          infoRows = [
            { k: 'リクエスト', v: '許可 ✅', vc: [59, 130, 246] },
            { k: 'レスポンス', v: '自動許可 ✅', vc: [16, 185, 129] },
            { k: 'OUTルール', v: '設定不要', vc: [16, 185, 129] },
            { k: '仕組み', v: '通信状態を追跡' },
          ]
        } else if (s === 5) {
          infoTitle = '🔒 NACL の特徴'
          infoRows = [
            { k: '適用単位', v: 'サブネット全体' },
            { k: 'ステート', v: 'レス（追跡なし）' },
            { k: 'ルール種別', v: '許可 + 拒否' },
            { k: '評価順', v: '番号の小さい順' },
            { k: '戻り通信', v: '別途設定が必要', vc: [245, 158, 11] },
          ]
        } else if (s === 6) {
          infoTitle = '⚖️ ステートレス'
          infoRows = [
            { k: 'インバウンド', v: '許可 ✅', vc: [16, 185, 129] },
            { k: 'アウトバウンド', v: 'ルールなし', vc: [239, 68, 68] },
            { k: '戻りパケット', v: 'NACLでブロック 🚫', vc: [239, 68, 68] },
            { k: '要設定', v: 'エフェメラルポート' },
          ]
        }

        p5.textSize(18); p5.fill(50, 50, 150)  // Title
        p5.text(infoTitle, ipx + 8, ipy + 16)
        p5.stroke(220, 220, 235); p5.strokeWeight(0.5)
        p5.line(ipx + 4, ipy + 22, ipx + ipw - 4, ipy + 22)

        infoRows.forEach((row, i) => {
          const ry2 = ipy + 36 + i * 42
          p5.noStroke(); p5.textSize(11); p5.fill(130, 130, 150)
          p5.text(row.k, ipx + 8, ry2)
          p5.textSize(16) // 文字色：デフォルトは濃い灰色、または強調表示用に指定された文字色
          const [vr, vg, vb] = row.vc ?? ([50, 50, 80] as [number, number, number])
          p5.fill(vr, vg, vb)
          p5.text(row.v, ipx + 8, ry2 + 13)
          if (i < infoRows.length - 1) {
            p5.stroke(235, 235, 245); p5.strokeWeight(0.5)
            p5.line(ipx + 4, ry2 + 24, ipx + ipw - 4, ry2 + 24)
          }
        })
      }

      // Step 8: comparison panel on the right
      if (s === 8) {
        const rx = 478, ry = 64, rw = 172, rh = 266
        p5.strokeWeight(1); p5.stroke(200, 200, 210)
        p5.fill(255, 255, 255, 230)
        p5.rect(rx, ry, rw, rh, 8)
        p5.noStroke(); p5.textAlign(p5.LEFT); p5.textSize(8.5)
        p5.fill(50, 50, 150)
        p5.text('SG vs NACL', rx + 8, ry + 16)
        const rows = [
          ['', 'SG', 'NACL'],
          ['適用単位', 'インスタンス', 'サブネット'],
          ['ステート', 'フル', 'レス'],
          ['ルール', '許可のみ', '許可/拒否'],
          ['戻り', '自動許可', '要設定'],
          ['評価順', 'なし', '番号順'],
        ]
        rows.forEach(([label, sg, nacl], i) => {
          const ry2 = ry + 32 + i * 34
          if (i === 0) {
            p5.fill(99, 102, 241); p5.text(sg, rx + 60, ry2)
            p5.fill(245, 158, 11); p5.text(nacl, rx + 115, ry2)
          } else {
            p5.fill(100, 100, 100); p5.text(label, rx + 8, ry2)
            p5.fill(60, 60, 60); p5.text(sg, rx + 60, ry2)
            p5.text(nacl, rx + 115, ry2)
            p5.stroke(230, 230, 240); p5.strokeWeight(0.5)
            p5.line(rx + 4, ry2 + 6, rx + rw - 4, ry2 + 6)
          }
        })
      }

      // Legend
      if (s >= 2 && s <= 6) {
        p5.noStroke(); p5.textSize(10); p5.textAlign(p5.LEFT)
        p5.fill(59, 130, 246); p5.circle(14, H - 20, 8)
        p5.fill(70, 70, 70); p5.text('許可（インバウンド）', 22, H - 20)
        if (s === 4) {
          p5.fill(16, 185, 129); p5.circle(164, H - 20, 8)
          p5.fill(70, 70, 70); p5.text('レスポンス（自動）', 172, H - 20)
        }
        if (s === 3 || s === 6) {
          p5.fill(239, 68, 68); p5.circle(164, H - 20, 8)
          p5.fill(70, 70, 70); p5.text(s === 3 ? 'ブロック（SG）' : 'ブロック（NACL）', 172, H - 20)
        }
        if (s === 6) {
          p5.fill(16, 185, 129); p5.circle(296, H - 20, 8)
          p5.fill(70, 70, 70); p5.text('通過', 304, H - 20)
        }
      }

    } else if (s === 7) {
      // ─── Step 7: VPC Peering layout ─────────────────────────────────

      // VPC-A
      p5.strokeWeight(2.5); p5.stroke(99, 102, 241)
      p5.fill(238, 242, 255, 200)
      p5.rect(VPC1.x, VPC1.y, VPC1.w, VPC1.h, 0)
      if (imgVpc.current) {
        p5.image(imgVpc.current, VPC1.x, VPC1.y, 24, 24)
      }
      p5.noStroke(); p5.fill(99, 102, 241)
      p5.textSize(9); p5.textAlign(p5.CENTER)
      p5.text('VPC-A  10.0.0.0/16', VPC1.x + VPC1.w / 2, VPC1.y + 16)
      ec2Box(p5, EC2_A.x, EC2_A.y, 'EC2-A', [37, 99, 235])

      // VPC-B
      p5.strokeWeight(2.5); p5.stroke(16, 185, 129)
      p5.fill(209, 250, 229, 200)
      p5.rect(VPC2.x, VPC2.y, VPC2.w, VPC2.h, 0)
      if (imgVpc.current) {
        p5.image(imgVpc.current, VPC2.x, VPC2.y, 24, 24)
      }
      p5.noStroke(); p5.fill(16, 185, 129)
      p5.textSize(9); p5.textAlign(p5.CENTER)
      p5.text('VPC-B  10.1.0.0/16', VPC2.x + VPC2.w / 2, VPC2.y + 16)
      ec2Box(p5, EC2_B.x, EC2_B.y, 'EC2-B', [5, 150, 105])

      // Peering connection
      const peerGlow = 0.6 + Math.sin(t * 0.08) * 0.4
      p5.stroke(139, 92, 246, 160); p5.strokeWeight(1.5)
      p5.line(EC2_A.x + 38, EC2_A.y, PEER.x - 44, PEER.y)
      p5.line(PEER.x + 44, PEER.y, EC2_B.x - 38, EC2_B.y)
      p5.strokeWeight(2); p5.stroke(139, 92, 246, 200 * peerGlow)
      p5.fill(237, 233, 254, 100 + peerGlow * 80)
      p5.rect(PEER.x - 44, PEER.y - 18, 88, 36, 8)
      p5.noStroke(); p5.fill(109, 40, 217)
      p5.textSize(9); p5.textAlign(p5.CENTER)
      p5.text('🤝 VPC Peering', PEER.x, PEER.y + 4)

      // Notes
      const nx = 10, ny = 245, nw = 640, nh = 86
      p5.strokeWeight(1); p5.stroke(200, 200, 220)
      p5.fill(255, 255, 255, 220)
      p5.rect(nx, ny, nw, nh, 8)
      p5.noStroke(); p5.textAlign(p5.LEFT); p5.textSize(12)
      p5.fill(50, 50, 150); p5.text('📋 VPCピアリングの注意点', nx + 10, ny + 16)
      p5.fill(80, 80, 80)
      p5.text('• CIDRが重複している場合は接続不可（VPC-A: 10.0.0.0/16, VPC-B: 10.1.0.0/16 ✅）', nx + 10, ny + 34)
      p5.text('• トランジティブルーティング不可：A-B, B-C が繋がっていても A-C の通信は不可', nx + 10, ny + 52)
      p5.text('• 双方のVPCでルートテーブルの設定が必要', nx + 10, ny + 70)

      // Legend (above notes box: ny=245)
      p5.noStroke(); p5.textSize(12); p5.textAlign(p5.LEFT)
      p5.fill(139, 92, 246); p5.circle(14, 238, 8)
      p5.fill(70, 70, 70); p5.text('VPC-A → VPC-B', 22, 242)
      p5.fill(16, 185, 129); p5.circle(140, 238, 8)
      p5.fill(70, 70, 70); p5.text('VPC-B → VPC-A', 148, 242)
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
    pkts.current = pkts.current.filter(pk => pk.active)
    for (const pk of pkts.current) {
      pk.progress += pk.speed
      if (pk.blocked && pk.progress >= 0.75) { pk.active = false; continue }
      if (!pk.blocked && pk.progress >= 1)   { pk.active = false; continue }

      const ep = easeInOutCubic(Math.min(pk.progress, 1))
      const px = p5.lerp(pk.x, pk.tx, ep)
      const py = p5.lerp(pk.y, pk.ty, ep)

      const angle = Math.atan2(pk.ty - pk.y, pk.tx - pk.x)
      p5.noStroke()
      p5.push()
      p5.translate(px + Math.cos(angle) * 9, py + Math.sin(angle) * 9)
      p5.rotate(angle)
      p5.fill(...pk.color)
      p5.noStroke()
      p5.triangle(0, -3, 0, 3, 8, 0)
      p5.pop()
      p5.fill(...pk.color)
      p5.circle(px, py, 11)
      if (!pk.blocked) {
        p5.fill(255); p5.circle(px, py, 4)
      } else {
        const alpha = Math.max(0, (0.75 - pk.progress) * 4 * 255)
        p5.fill(239, 68, 68, alpha); p5.circle(px, py, 14)
        p5.fill(255, 255, 255, alpha)
        p5.textSize(9); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('✕', px, py)
      }
    }
  }

  const cur = STEPS[step - 1]

  return (
    <div className="space-y-5 mb-10">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-500 shrink-0">STEP {step} / {TOTAL}</span>
        <div className="flex gap-1.5 flex-1">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i + 1)}
              title={STEPS[i].title}
              className={`h-2.5 rounded-full transition-all duration-300 flex-1 ${
                i + 1 === step ? 'bg-orange-500' : i + 1 < step ? 'bg-orange-300' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

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

      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{cur.emoji}</span>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">ステップ {step}</p>
            <h3 className="text-xl font-bold text-gray-800">{cur.title}</h3>
          </div>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed mb-5">{cur.description}</p>
        <ul className="space-y-2.5">
          {cur.keyPoints.map((kp, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">✓</span>
              {kp}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >← 前へ</button>

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
          onClick={() => setStep(s => Math.min(TOTAL, s + 1))}
          disabled={step === TOTAL}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >{step === TOTAL ? '完了！🎉' : '次へ →'}</button>
      </div>

      {step === TOTAL && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <p className="font-bold text-green-700 mb-1">VPC中級コンテンツ完了！</p>
          <p className="text-sm text-green-600">下の練習問題で理解度を確認しましょう。</p>
        </div>
      )}
    </div>
  )
}
