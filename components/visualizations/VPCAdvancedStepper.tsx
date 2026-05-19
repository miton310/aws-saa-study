'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

const STEPS = [
  {
    id: 1,
    title: 'VPCピアリングの限界',
    emoji: '😵',
    description: 'VPCが増えるにつれ、ピアリングの数は爆発的に増加します。4つのVPCをフルメッシュで繋ぐには6本、10VPCなら45本の接続が必要です。管理が非常に複雑になります。',
    keyPoints: [
      'N個のVPCをフルメッシュ接続するには N×(N-1)÷2 本の接続が必要',
      'それぞれのVPCでルートテーブルの設定が必要',
      'トランジティブルーティング不可のため直接ピアリングが必要',
    ],
    hint: '4つのVPCのフルメッシュ接続 → 6本の線が必要',
  },
  {
    id: 2,
    title: 'Transit Gateway（TGW）登場',
    emoji: '🔀',
    description: 'Transit Gatewayはハブ＆スポーク型でVPCを接続するサービスです。N個のVPCでもTGWへの接続はN本だけで済みます。オンプレミスのVPN/Direct Connectも接続できます。',
    keyPoints: [
      'ハブ＆スポーク型：N本の接続でN個のVPC間通信が可能',
      'リージョン内のVPCを一元管理するネットワークハブ',
      'VPN、Direct Connectの接続先としても機能する',
    ],
    hint: '4つのVPCがTGW1つに接続するだけ → 4本で済む',
  },
  {
    id: 3,
    title: 'TGW経由の通信フロー',
    emoji: '🔁',
    description: 'VPC-AからVPC-Cへの通信は、TGWを経由してルーティングされます。直接ピアリングがなくてもTGWが中継します。これがトランジット（中継）ルーティングです。',
    keyPoints: [
      'VPC-A → TGW → VPC-C（直接ピアリングなしで通信可能）',
      'TGWのルートテーブルで通信制御・分離が可能',
      'リージョン間ピアリングで複数リージョンのVPCも接続可能',
    ],
    hint: 'パケットがTGWを中継してVPC間を移動します',
  },
  {
    id: 4,
    title: 'VPCエンドポイント（ゲートウェイ型）',
    emoji: '🎯',
    description: 'プライベートサブネットのEC2からS3やDynamoDBに、インターネットを経由せずアクセスできます。ゲートウェイ型エンドポイントは無料で使えます。',
    keyPoints: [
      '対象サービス：S3、DynamoDB（無料）',
      'ルートテーブルにエンドポイントへのルートを追加するだけ',
      'インターネットGW・NATゲートウェイ不要でAWSサービスにアクセス',
    ],
    hint: 'EC2 → VPCエンドポイント → S3（インターネット不使用）',
  },
  {
    id: 5,
    title: 'VPCエンドポイント（インターフェイス型）',
    emoji: '🔌',
    description: 'インターフェイス型（AWS PrivateLink）はサブネット内にENI（弾性ネットワークインターフェイス）を作成し、多くのAWSサービスにプライベート接続します。',
    keyPoints: [
      '対象：CloudWatch、SNS、SQS、EC2 APIなど多数のAWSサービス',
      'サブネット内にENIが作成され、プライベートIPでアクセス可能',
      'セキュリティグループで制御可能（ゲートウェイ型にはない機能）',
    ],
    hint: 'ENIがサブネット内に作成され、AWS サービスへ直結',
  },
  {
    id: 6,
    title: 'Site-to-Site VPN',
    emoji: '🔐',
    description: 'オンプレミスとAWS VPCをインターネット経由の暗号化トンネルで接続します。設定が簡単でコストも低いですが、インターネット帯域に依存するため品質が不安定です。',
    keyPoints: [
      'IPsec暗号化トンネルでインターネットを経由',
      '仮想プライベートゲートウェイ（VGW）をVPC側に設置',
      '設定は数時間で完了、コストが低い（Direct Connectより安価）',
    ],
    hint: '暗号化トンネル（点線）がオンプレミスとVPCを繋いでいます',
  },
  {
    id: 7,
    title: 'Direct Connect（DX）',
    emoji: '⚡',
    description: 'オンプレミスとAWSを専用の物理回線で接続します。帯域が安定しており低レイテンシーですが、開通に数週間かかり、コストも高めです。大容量・安定通信が必要な場合に選択します。',
    keyPoints: [
      '専用物理回線：安定した帯域・低レイテンシー',
      '開通まで数週間かかる（VPNは数時間）',
      'Direct Connect Gatewayで複数リージョンのVPCに接続可能',
    ],
    hint: '専用回線（実線）がオンプレミスとAWSを直結しています',
  },
  {
    id: 8,
    title: 'まとめ：上級VPCの全体像',
    emoji: '🎯',
    description: 'VPCの上級構成要素をおさらいします。Transit Gateway・VPCエンドポイント・VPN/DXはすべてSAA試験の頻出トピックです。それぞれの用途と違いをしっかり押さえましょう。',
    keyPoints: [
      'Transit GW：多数VPC接続のハブ、ピアリングのメッシュ問題を解消',
      'VPCエンドポイント：AWSサービスへのプライベート接続（GW型=無料/IF型=PrivateLink）',
      'VPN：手軽・安価だが帯域不安定。DX：安定・高帯域だが高コスト・開通遅い',
    ],
    hint: 'Transit GW・Endpoint・VPN・DXの違いを整理しましょう',
  },
]

const TOTAL = STEPS.length
const W = 660
const H = 340

// ── Steps 1-3: Transit Gateway layout ─────────────────────────────
const TGW   = { x: 330, y: 170 }
const VPCA  = { x: 90,  y: 80  }
const VPCB  = { x: 570, y: 80  }
const VPCC  = { x: 90,  y: 260 }
const VPCD  = { x: 570, y: 260 }

// ── Steps 4-5: VPC Endpoint layout ────────────────────────────────
const EP_VPC     = { x: 10,  y: 50,  w: 400, h: 280 }
const EP_PRIV    = { x: 40,  y: 108, w: 190, h: 190 }
const EP_EC2     = { x: 135, y: 215 }
const EP_GW      = { x: 310, y: 175 }   // gateway endpoint inside VPC
const EP_ENI     = { x: 285, y: 215 }   // interface endpoint ENI inside subnet
const EP_S3      = { x: 560, y: 145 }   // S3 service
const EP_SVC     = { x: 560, y: 215 }   // other AWS service

// ── Steps 6-7: Hybrid connectivity layout ─────────────────────────
const ONPREM     = { x: 30,  y: 105, w: 140, h: 130 }
const HY_VPC     = { x: 450, y: 70,  w: 200, h: 210 }
const HY_EC2     = { x: 545, y: 185 }
const VGW        = { x: 420, y: 170 }
const INET_CLOUD = { x: 248, y: 170 }   // internet midpoint for VPN

interface Packet {
  x: number; y: number; tx: number; ty: number
  progress: number; speed: number
  color: [number, number, number]
  active: boolean; blocked: boolean
}

type Seg = [{ x: number; y: number }, { x: number; y: number }, [number, number, number], boolean?]

function getSequence(s: number): Seg[] {
  // Step 3: VPC-A → TGW → VPC-C
  if (s === 3) return [
    [VPCA, TGW,  [59, 130, 246]],
    [TGW,  VPCC, [59, 130, 246]],
    [VPCC, TGW,  [16, 185, 129]],
    [TGW,  VPCA, [16, 185, 129]],
  ]
  // Step 4: EC2 → Gateway EP → S3
  if (s === 4) return [
    [EP_EC2, EP_GW, [59, 130, 246]],
    [EP_GW,  EP_S3, [59, 130, 246]],
    [EP_S3,  EP_GW, [16, 185, 129]],
    [EP_GW,  EP_EC2,[16, 185, 129]],
  ]
  // Step 5: EC2 → Interface ENI → AWS Service
  if (s === 5) return [
    [EP_EC2, EP_ENI, [139, 92, 246]],
    [EP_ENI, EP_SVC, [139, 92, 246]],
    [EP_SVC, EP_ENI, [16, 185, 129]],
    [EP_ENI, EP_EC2, [16, 185, 129]],
  ]
  // Step 6: VPN packets (on-prem ↔ VGW ↔ EC2)
  if (s === 6) return [
    [{ x: ONPREM.x + ONPREM.w, y: ONPREM.y + ONPREM.h / 2 }, VGW, [245, 158, 11]],
    [VGW, HY_EC2, [245, 158, 11]],
    [HY_EC2, VGW, [16, 185, 129]],
    [VGW, { x: ONPREM.x + ONPREM.w, y: ONPREM.y + ONPREM.h / 2 }, [16, 185, 129]],
  ]
  // Step 7: DX packets (same path, different visual meaning)
  if (s === 7) return [
    [{ x: ONPREM.x + ONPREM.w, y: ONPREM.y + ONPREM.h / 2 }, VGW, [59, 130, 246]],
    [VGW, HY_EC2, [59, 130, 246]],
    [HY_EC2, VGW, [16, 185, 129]],
    [VGW, { x: ONPREM.x + ONPREM.w, y: ONPREM.y + ONPREM.h / 2 }, [16, 185, 129]],
  ]
  return []
}

export default function VPCAdvancedStepper() {
  const [step, setStep] = useState(1)
  const stepRef  = useRef(1)
  const timerRef = useRef(0)
  const pkts     = useRef<Packet[]>([])
  const phaseRef = useRef(0)
  const waitRef  = useRef(0)

  useEffect(() => {
    stepRef.current  = step
    pkts.current     = []
    timerRef.current = 0
    phaseRef.current = 0
    waitRef.current  = 0
  }, [step])

  function spawn(from: { x: number; y: number }, to: { x: number; y: number }, col: [number, number, number], blocked = false) {
    pkts.current.push({ x: from.x, y: from.y, tx: to.x, ty: to.y, progress: 0, speed: 0.022 + Math.random() * 0.006, color: col, active: true, blocked })
  }

  function vpcBox(p5: any, cx: number, cy: number, label: string, col: [number, number, number], w = 90, h = 46) {
    p5.strokeWeight(2); p5.stroke(...col)
    p5.fill(col[0], col[1], col[2], 40)
    p5.rect(cx - w / 2, cy - h / 2, w, h, 8)
    p5.noStroke(); p5.fill(...col)
    p5.textSize(9); p5.textAlign(p5.CENTER, p5.CENTER)
    p5.text(label, cx, cy)
  }

  function ec2Box(p5: any, cx: number, cy: number, label: string, col: [number, number, number]) {
    p5.strokeWeight(1.5); p5.stroke(...col)
    p5.fill(col[0], col[1], col[2], 35)
    p5.rect(cx - 38, cy - 26, 76, 52, 8)
    p5.noStroke(); p5.fill(...col)
    p5.textSize(13); p5.textAlign(p5.CENTER, p5.CENTER)
    p5.text('💻', cx, cy - 9)
    p5.textSize(8)
    label.split('\n').forEach((ln: string, i: number) => p5.text(ln, cx, cy + 8 + i * 12))
  }

  const setup = (p5: any, ref: any) => {
    p5.createCanvas(W, H).parent(ref)
    p5.frameRate(40)
  }

  const draw = (p5: any) => {
    const s = stepRef.current
    timerRef.current++
    const t = timerRef.current
    p5.background(248, 250, 252)

    // ── Steps 1-3: Transit Gateway ──────────────────────────────────
    if (s <= 3) {
      const vpcColor: [number, number, number] = [99, 102, 241]
      const positions = [VPCA, VPCB, VPCC, VPCD]
      const labels    = ['VPC-A', 'VPC-B', 'VPC-C', 'VPC-D']

      if (s === 1) {
        // Mesh peering: draw all 6 connection lines
        const pairs = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]]
        p5.stroke(200, 150, 150, 160); p5.strokeWeight(1.5)
        pairs.forEach(([a, b]) => {
          p5.line(positions[a].x, positions[a].y, positions[b].x, positions[b].y)
        })
        // "複雑！" label in center
        p5.noStroke(); p5.fill(239, 68, 68, 200)
        p5.textSize(13); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('😵 6本の接続が必要！', W / 2, H / 2)
        p5.textSize(9); p5.fill(150, 60, 60)
        p5.text('（VPCが増えるほど爆発的に増加）', W / 2, H / 2 + 20)
      }

      if (s >= 2) {
        // TGW hub & spoke: draw 4 lines from VPCs to TGW
        const tgwGlow = s === 2 ? 0.5 + Math.sin(t * 0.08) * 0.5 : 0.8
        p5.stroke(245, 158, 11, 160); p5.strokeWeight(1.5)
        positions.forEach(pos => p5.line(pos.x, pos.y, TGW.x, TGW.y))

        // TGW box
        p5.strokeWeight(2.5); p5.stroke(245, 158, 11, 200 * tgwGlow)
        p5.fill(254, 243, 199, 80 + tgwGlow * 100)
        p5.rect(TGW.x - 52, TGW.y - 20, 104, 40, 10)
        p5.noStroke(); p5.fill(160, 100, 0)
        p5.textSize(9.5); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('🔀 Transit Gateway', TGW.x, TGW.y)

        if (s === 2) {
          p5.noStroke(); p5.fill(16, 130, 60, 200)
          p5.textSize(12); p5.textAlign(p5.CENTER)
          p5.text('✅ 4本だけで全VPC間通信が可能！', W / 2, H - 24)
        }
      }

      // Draw VPC boxes (always)
      positions.forEach((pos, i) => vpcBox(p5, pos.x, pos.y, labels[i], vpcColor))
    }

    // ── Steps 4-5: VPC Endpoint ─────────────────────────────────────
    else if (s === 4 || s === 5) {
      // VPC box
      p5.strokeWeight(2.5); p5.stroke(99, 102, 241)
      p5.fill(238, 242, 255, 180)
      p5.rect(EP_VPC.x, EP_VPC.y, EP_VPC.w, EP_VPC.h, 12)
      p5.noStroke(); p5.fill(99, 102, 241)
      p5.textSize(9); p5.textAlign(p5.LEFT)
      p5.text('VPC  10.0.0.0/16', EP_VPC.x + 10, EP_VPC.y + 16)

      // Private subnet
      p5.strokeWeight(1.5); p5.stroke(16, 185, 129)
      p5.fill(209, 250, 229, 160)
      p5.rect(EP_PRIV.x, EP_PRIV.y, EP_PRIV.w, EP_PRIV.h, 8)
      p5.noStroke(); p5.fill(5, 150, 105)
      p5.textSize(8); p5.textAlign(p5.CENTER)
      p5.text('プライベートサブネット', EP_PRIV.x + EP_PRIV.w / 2, EP_PRIV.y + 13)

      // EC2
      ec2Box(p5, EP_EC2.x, EP_EC2.y, 'EC2', [37, 99, 235])

      if (s === 4) {
        // Gateway endpoint box
        p5.strokeWeight(2); p5.stroke(59, 130, 246)
        p5.fill(219, 234, 254, 200)
        p5.rect(EP_GW.x - 52, EP_GW.y - 20, 104, 40, 8)
        p5.noStroke(); p5.fill(37, 99, 235)
        p5.textSize(8.5); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('🎯 Gateway EP', EP_GW.x, EP_GW.y - 5)
        p5.textSize(7.5); p5.fill(100, 100, 200)
        p5.text('（S3 / DynamoDB）', EP_GW.x, EP_GW.y + 9)

        // Line EC2 → GW EP
        p5.stroke(180, 200, 220); p5.strokeWeight(1)
        p5.line(EP_EC2.x + 38, EP_EC2.y, EP_GW.x - 52, EP_GW.y)

        // S3 box (outside VPC)
        p5.strokeWeight(2); p5.stroke(16, 185, 129)
        p5.fill(209, 250, 229, 200)
        p5.rect(EP_S3.x - 50, EP_S3.y - 20, 100, 40, 8)
        p5.noStroke(); p5.fill(5, 150, 105)
        p5.textSize(9); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('🗄 Amazon S3', EP_S3.x, EP_S3.y)

        // Line GW EP → S3
        p5.stroke(180, 200, 220); p5.strokeWeight(1)
        p5.line(EP_GW.x + 52, EP_GW.y, EP_S3.x - 50, EP_S3.y)

        // "Internet不要" label
        p5.noStroke(); p5.fill(239, 68, 68, 160)
        p5.textSize(8); p5.textAlign(p5.CENTER)
        p5.text('🚫 インターネット不使用', EP_S3.x, EP_S3.y + 35)

        // Legend
        p5.fill(59, 130, 246); p5.circle(14, H - 20, 8)
        p5.fill(70, 70, 70); p5.textSize(8.5); p5.textAlign(p5.LEFT)
        p5.text('リクエスト', 22, H - 16)
        p5.fill(16, 185, 129); p5.circle(100, H - 20, 8)
        p5.text('レスポンス', 108, H - 16)
      }

      if (s === 5) {
        // Interface endpoint ENI inside subnet
        p5.strokeWeight(2); p5.stroke(139, 92, 246)
        p5.fill(237, 233, 254, 200)
        p5.rect(EP_ENI.x - 38, EP_ENI.y - 18, 76, 36, 8)
        p5.noStroke(); p5.fill(109, 40, 217)
        p5.textSize(8); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('🔌 ENI', EP_ENI.x, EP_ENI.y - 5)
        p5.textSize(7); p5.fill(130, 60, 200)
        p5.text('(PrivateLink)', EP_ENI.x, EP_ENI.y + 8)

        // Line EC2 → ENI
        p5.stroke(180, 180, 220); p5.strokeWeight(1)
        p5.line(EP_EC2.x + 38, EP_EC2.y, EP_ENI.x - 38, EP_ENI.y)

        // AWS Service box (outside VPC)
        p5.strokeWeight(2); p5.stroke(139, 92, 246)
        p5.fill(237, 233, 254, 200)
        p5.rect(EP_SVC.x - 55, EP_SVC.y - 25, 110, 50, 8)
        p5.noStroke(); p5.fill(109, 40, 217)
        p5.textSize(9); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('☁️ AWS Service', EP_SVC.x, EP_SVC.y - 8)
        p5.textSize(7.5); p5.fill(130, 60, 200)
        p5.text('(CloudWatch, SNS…)', EP_SVC.x, EP_SVC.y + 8)

        // Line ENI → Service
        p5.stroke(200, 180, 230); p5.strokeWeight(1)
        p5.line(EP_VPC.x + EP_VPC.w, EP_ENI.y, EP_SVC.x - 55, EP_SVC.y)

        // Note
        p5.noStroke(); p5.fill(100, 50, 180, 170)
        p5.textSize(7.5); p5.textAlign(p5.CENTER)
        p5.text('SGで制御可能', EP_ENI.x, EP_ENI.y + 28)

        // Legend
        p5.fill(139, 92, 246); p5.circle(14, H - 20, 8)
        p5.fill(70, 70, 70); p5.textSize(8.5); p5.textAlign(p5.LEFT)
        p5.text('PrivateLinkリクエスト', 22, H - 16)
        p5.fill(16, 185, 129); p5.circle(168, H - 20, 8)
        p5.text('レスポンス', 176, H - 16)
      }
    }

    // ── Steps 6-7: Hybrid connectivity ──────────────────────────────
    else if (s === 6 || s === 7) {
      // On-premises box
      p5.strokeWeight(2); p5.stroke(100, 100, 100)
      p5.fill(240, 240, 240, 200)
      p5.rect(ONPREM.x, ONPREM.y, ONPREM.w, ONPREM.h, 10)
      p5.noStroke(); p5.fill(60, 60, 60)
      p5.textSize(9); p5.textAlign(p5.CENTER)
      p5.text('🏢 オンプレミス', ONPREM.x + ONPREM.w / 2, ONPREM.y + 20)
      p5.textSize(8); p5.fill(100, 100, 100)
      p5.text('データセンター', ONPREM.x + ONPREM.w / 2, ONPREM.y + 34)
      // Router icon
      p5.fill(80, 80, 80)
      p5.textSize(20); p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text('🖥', ONPREM.x + ONPREM.w / 2, ONPREM.y + ONPREM.h / 2 + 15)

      // AWS VPC box
      p5.strokeWeight(2.5); p5.stroke(99, 102, 241)
      p5.fill(238, 242, 255, 180)
      p5.rect(HY_VPC.x, HY_VPC.y, HY_VPC.w, HY_VPC.h, 12)
      p5.noStroke(); p5.fill(99, 102, 241)
      p5.textSize(9); p5.textAlign(p5.CENTER)
      p5.text('AWS VPC', HY_VPC.x + HY_VPC.w / 2, HY_VPC.y + 16)
      ec2Box(p5, HY_EC2.x, HY_EC2.y, 'EC2', [37, 99, 235])

      // VGW box
      p5.strokeWeight(2); p5.stroke(59, 130, 246)
      p5.fill(219, 234, 254, 200)
      p5.rect(VGW.x - 38, VGW.y - 18, 76, 36, 8)
      p5.noStroke(); p5.fill(37, 99, 235)
      p5.textSize(8.5); p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text('VGW', VGW.x, VGW.y - 4)
      p5.textSize(7); p5.fill(100, 120, 200)
      p5.text('(仮想PGW)', VGW.x, VGW.y + 9)

      // Line VGW → EC2
      p5.stroke(180, 200, 220); p5.strokeWeight(1)
      p5.line(VGW.x + 38, VGW.y, HY_EC2.x - 38, HY_EC2.y)

      if (s === 6) {
        // VPN: dashed line through internet cloud
        p5.drawingContext.setLineDash([6, 5])
        p5.stroke(245, 158, 11, 200); p5.strokeWeight(2)
        p5.line(ONPREM.x + ONPREM.w, ONPREM.y + ONPREM.h / 2, VGW.x - 38, VGW.y)
        p5.drawingContext.setLineDash([])

        // Internet cloud label
        p5.noStroke(); p5.fill(245, 158, 11, 180)
        p5.textSize(9); p5.textAlign(p5.CENTER)
        p5.text('🌍 インターネット経由', INET_CLOUD.x, INET_CLOUD.y - 12)
        p5.textSize(8); p5.fill(180, 120, 0)
        p5.text('IPsec 暗号化トンネル', INET_CLOUD.x, INET_CLOUD.y + 4)

        // Props
        const nx = 30, ny = H - 80, nw = 600, nh = 66
        p5.strokeWeight(1); p5.stroke(220, 200, 150)
        p5.fill(255, 253, 230, 220)
        p5.rect(nx, ny, nw, nh, 8)
        p5.noStroke(); p5.textAlign(p5.LEFT); p5.textSize(8.5)
        p5.fill(130, 90, 0)
        p5.text('📋 Site-to-Site VPN', nx + 10, ny + 16)
        p5.fill(80, 80, 80)
        p5.text('✅ 設定：数時間で完了　✅ コスト：低い　⚠️ 帯域：インターネットに依存（不安定）', nx + 10, ny + 34)
        p5.text('⚠️ レイテンシー：インターネット経由のため不安定', nx + 10, ny + 52)

        // Legend
        p5.noStroke(); p5.textSize(8.5); p5.textAlign(p5.LEFT)
        p5.fill(245, 158, 11); p5.circle(14, H - 86, 8)
        p5.fill(70, 70, 70); p5.text('VPN（暗号化）', 22, H - 82)
      }

      if (s === 7) {
        // Direct Connect: solid dedicated line
        p5.stroke(59, 130, 246, 220); p5.strokeWeight(3)
        p5.line(ONPREM.x + ONPREM.w, ONPREM.y + ONPREM.h / 2, VGW.x - 38, VGW.y)

        // DX label
        p5.noStroke(); p5.fill(37, 99, 235, 200)
        p5.textSize(9); p5.textAlign(p5.CENTER)
        p5.text('⚡ 専用回線（Direct Connect）', INET_CLOUD.x, INET_CLOUD.y - 12)
        p5.textSize(8); p5.fill(30, 60, 160)
        p5.text('低レイテンシー・安定帯域', INET_CLOUD.x, INET_CLOUD.y + 4)

        // Props
        const nx = 30, ny = H - 80, nw = 600, nh = 66
        p5.strokeWeight(1); p5.stroke(180, 200, 240)
        p5.fill(235, 243, 255, 220)
        p5.rect(nx, ny, nw, nh, 8)
        p5.noStroke(); p5.textAlign(p5.LEFT); p5.textSize(8.5)
        p5.fill(30, 60, 150)
        p5.text('📋 Direct Connect (DX)', nx + 10, ny + 16)
        p5.fill(80, 80, 80)
        p5.text('✅ 帯域：安定・高スループット　✅ レイテンシー：低い　⚠️ 開通：数週間かかる', nx + 10, ny + 34)
        p5.text('⚠️ コスト：高い（VPNより）　→ 大容量・ミッションクリティカルな用途に最適', nx + 10, ny + 52)

        // Legend
        p5.noStroke(); p5.textSize(8.5); p5.textAlign(p5.LEFT)
        p5.fill(59, 130, 246); p5.circle(14, H - 86, 8)
        p5.fill(70, 70, 70); p5.text('Direct Connect（専用線）', 22, H - 82)
      }
    }

    // ── Step 8: Summary ─────────────────────────────────────────────
    else if (s === 8) {
      const rows = [
        ['サービス', '用途', '特徴'],
        ['Transit GW', '多数VPC接続', 'ハブ&スポーク、N本で済む'],
        ['GW型EP', 'S3/DynamoDB', '無料、ルートテーブル設定'],
        ['IF型EP', 'AWS各種サービス', 'ENI、SG制御可、有料'],
        ['VPN', 'オンプレ接続', '手軽・安価、帯域不安定'],
        ['DX', 'オンプレ接続', '安定・低遅延、高コスト'],
      ]
      const rx = 20, ry = 20, rw = 620, rh = 305
      p5.strokeWeight(1); p5.stroke(200, 200, 220)
      p5.fill(255, 255, 255, 230)
      p5.rect(rx, ry, rw, rh, 10)
      p5.noStroke(); p5.textAlign(p5.LEFT)
      rows.forEach((row, i) => {
        const y = ry + 30 + i * 48
        const colX = [rx + 12, rx + 150, rx + 310]
        if (i === 0) {
          p5.textSize(10.5); p5.fill(50, 50, 150)
          row.forEach((cell, j) => p5.text(cell, colX[j], y))
          p5.stroke(200, 200, 220); p5.strokeWeight(1)
          p5.line(rx + 4, y + 8, rx + rw - 4, y + 8)
        } else {
          const colors: [number,number,number][] = [
            [245, 158, 11], [59, 130, 246], [139, 92, 246], [245, 158, 11], [37, 99, 235]
          ]
          const [r, g, b] = colors[i - 1]
          p5.textSize(10.5); p5.fill(r, g, b)
          p5.text(row[0], colX[0], y)
          p5.fill(60, 60, 60)
          p5.text(row[1], colX[1], y)
          p5.text(row[2], colX[2], y)
          if (i < rows.length - 1) {
            p5.stroke(230, 230, 240); p5.strokeWeight(0.5)
            p5.line(rx + 4, y + 10, rx + rw - 4, y + 10)
          }
        }
      })
    }

    // ── Single-packet phase spawning ────────────────────────────────
    const seq = getSequence(s)
    if (seq.length > 0 && !pkts.current.some(p => p.active)) {
      if (waitRef.current > 0) {
        waitRef.current--
      } else if (phaseRef.current >= seq.length) {
        phaseRef.current = 0
        waitRef.current  = 50
      } else {
        const [from, to, col, blocked] = seq[phaseRef.current]
        spawn(from, to, col, blocked ?? false)
        phaseRef.current++
      }
    }

    // ── Draw packets ────────────────────────────────────────────────
    pkts.current = pkts.current.filter(pk => pk.active)
    for (const pk of pkts.current) {
      pk.progress += pk.speed
      if (pk.blocked && pk.progress >= 0.75) { pk.active = false; continue }
      if (!pk.blocked && pk.progress >= 1)   { pk.active = false; continue }

      const px = p5.lerp(pk.x, pk.tx, pk.progress)
      const py = p5.lerp(pk.y, pk.ty, pk.progress)
      p5.noStroke()
      p5.fill(...pk.color)
      p5.circle(px, py, 11)
      p5.fill(255); p5.circle(px, py, 4)
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
          <p className="font-bold text-green-700 mb-1">VPC上級コンテンツ完了！</p>
          <p className="text-sm text-green-600">下の練習問題で理解度を確認しましょう。</p>
        </div>
      )}
    </div>
  )
}
