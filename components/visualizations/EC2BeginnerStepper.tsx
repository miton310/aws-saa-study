'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

const STEPS = [
  {
    id: 1,
    title: 'EC2とは',
    emoji: '🖥️',
    description: 'EC2（Elastic Compute Cloud）はAWSが提供する仮想サーバーサービスです。物理サーバーをクラウド上に仮想化し、数分以内に起動・停止できます。使った分だけ課金されます。',
    keyPoints: [
      '仮想サーバーをオンデマンドで起動・停止できる',
      '数分以内にサーバーが利用可能（物理サーバーは数週間かかる）',
      '秒単位・分単位での従量課金（オンデマンド）',
      'CPU・メモリ・ストレージを必要に応じて変更できる',
    ],
    hint: 'オンプレミス vs EC2 — クラウドの仮想サーバーを図で理解',
  },
  {
    id: 2,
    title: 'インスタンスタイプ',
    emoji: '📊',
    description: 'インスタンスタイプはCPU・メモリ・ネットワーク性能の組み合わせです。ワークロードの特性に合わせて最適なファミリーを選択します。',
    keyPoints: [
      '汎用（t3/m5）：Webサーバー・開発環境など幅広い用途',
      'コンピューティング最適化（c5/c6g）：バッチ・動画エンコード',
      'メモリ最適化（r5/x1e）：大規模DB・インメモリキャッシュ',
      'ストレージ最適化（i3/d3）：高I/O・NoSQLデータベース',
    ],
    hint: 'タイプ名の読み方：m5.xlarge = ファミリー(m) 世代(5) サイズ(xlarge)',
  },
  {
    id: 3,
    title: 'AMI（Amazon Machine Image）',
    emoji: '💾',
    description: 'AMIはEC2インスタンスを起動するためのテンプレートです。OS・ミドルウェア・アプリケーションの設定が含まれます。1つのAMIから同じ構成のインスタンスを何台でも複製できます。',
    keyPoints: [
      'OS（Amazon Linux 2023・Ubuntu・Windows等）が含まれる',
      'カスタムAMIを作成して自社構成を再利用可能',
      'AMIはリージョン固有（他リージョンへコピー可）',
      'AWS Marketplaceで商用ソフト入りAMIを購入可能',
    ],
    hint: '1つのAMIから複数のインスタンスをクローンできます',
  },
  {
    id: 4,
    title: 'インスタンスの起動フロー',
    emoji: '🚀',
    description: 'EC2インスタンスを起動するには、AMI・インスタンスタイプ・ネットワーク・セキュリティグループ・キーペアを設定します。この5ステップを理解することが基本です。',
    keyPoints: [
      '① AMI選択：OSと初期設定を選ぶ',
      '② インスタンスタイプ選択：CPU・メモリのスペックを選ぶ',
      '③ ネットワーク設定：VPC・サブネット・パブリックIPを選ぶ',
      '④ セキュリティグループ：ポート・IP制限を設定する',
      '⑤ キーペア：SSHログイン用の公開鍵を設定する',
    ],
    hint: '5つの設定を順にたどると EC2 が起動します',
  },
  {
    id: 5,
    title: 'EBSボリューム',
    emoji: '🗂️',
    description: 'EBS（Elastic Block Store）はEC2に接続するブロックストレージです。インスタンスを停止してもデータは保持されます（永続性）。EC2とは独立して存在します。',
    keyPoints: [
      'EC2と同一AZ内でのみアタッチ可能',
      'インスタンス停止後もデータを保持（永続ストレージ）',
      'gp3（汎用SSD）が標準推奨：コスト効率が良い',
      'スナップショットでバックアップ → S3に保存',
    ],
    hint: 'EBSはEC2専用の「外付けSSD」。停止してもデータは消えない',
  },
  {
    id: 6,
    title: 'インスタンスのライフサイクル',
    emoji: '🔄',
    description: 'EC2インスタンスには4つの主要な状態があります。各状態と課金の関係を理解することはコスト管理の基本です。',
    keyPoints: [
      'pending（起動中）→ running（稼働）→ stopping → stopped（停止）',
      '課金はrunning（稼働中）のみ（停止中はストレージのみ課金）',
      'terminate（終了）するとインスタンスとルートEBSは削除される',
      'reboot（再起動）はrunning状態のまま（データは保持）',
    ],
    hint: '停止(stop)と終了(terminate)の違いを押さえる',
  },
  {
    id: 7,
    title: '購入オプション',
    emoji: '💰',
    description: 'EC2には4つの購入オプションがあります。ワークロードの特性に合わせて選択することで、最大90%のコスト削減が可能です。',
    keyPoints: [
      'オンデマンド：従量課金、最も高いが制約なし',
      'リザーブドインスタンス：1〜3年契約で最大72%割引',
      'スポットインスタンス：最大90%割引・中断あり（バッチ処理向け）',
      'Savings Plans：柔軟なコミットメント（EC2・Lambda・Fargateに適用）',
    ],
    hint: '中断許容=スポット、長期安定=リザーブド、柔軟割引=Savings Plans',
  },
  {
    id: 8,
    title: 'まとめ',
    emoji: '🎯',
    description: 'EC2初級の全体像をおさらいします。AMI・インスタンスタイプ・EBS・ライフサイクル・購入オプションはSAA試験の頻出事項です。',
    keyPoints: [
      'AMI：起動テンプレート（OS+設定）→ 複数インスタンスをクローン可',
      'タイプ：汎用(t/m)・CPU(c)・メモリ(r)・ストレージ(i)で選ぶ',
      'EBS：永続ブロックストレージ、停止後もデータ保持',
      'ライフサイクル：running中のみ課金、stopとterminateを区別',
      '購入：オンデマンド→リザーブド→Savings Plans→スポットの順に安い',
    ],
    hint: '各コンポーネントの役割と試験ポイントを整理しましょう',
  },
]

const TOTAL = STEPS.length
const W = 660
const H = 340

// AWS brand colors
const AWS_ORANGE: [number, number, number] = [255, 153, 0]
const AWS_BLUE:   [number, number, number] = [35, 100, 170]
const AWS_GREEN:  [number, number, number] = [122, 161, 22]
const AWS_PURPLE: [number, number, number] = [140, 79, 255]
const AWS_GRAY:   [number, number, number] = [100, 116, 139]

interface Packet {
  x: number; y: number; tx: number; ty: number
  progress: number; speed: number
  color: [number, number, number]
  active: boolean; blocked: boolean
}

export default function EC2BeginnerStepper() {
  const [step, setStep] = useState(1)
  const stepRef  = useRef(1)
  const timerRef = useRef(0)
  const pkts     = useRef<Packet[]>([])
  const phaseRef = useRef(0)
  const waitRef  = useRef(0)
  const imgAmi = useRef<unknown>(null)
  const imgEbs = useRef<unknown>(null)

  useEffect(() => {
    stepRef.current  = step
    pkts.current     = []
    timerRef.current = 0
    phaseRef.current = 0
    waitRef.current  = 0
  }, [step])

  function spawn(from: {x:number;y:number}, to: {x:number;y:number}, col: [number,number,number]) {
    pkts.current.push({ x: from.x, y: from.y, tx: to.x, ty: to.y, progress: 0,
      speed: 0.018 + Math.random() * 0.006, color: col, active: true, blocked: false })
  }

  // ── AWS-style service icon ─────────────────────────────────────────
  function awsIcon(p5: any, cx: number, cy: number, sz: number,
    bg: [number,number,number], type: string, label?: string) {
    const r = sz * 0.18
    const withBg = type !== 'ami'
    p5.noStroke()
    if (withBg) {
      // Shadow
      p5.fill(0, 0, 0, 18)
      p5.rect(cx - sz/2 + 2, cy - sz/2 + 3, sz, sz, r + 2)
      // Background
      p5.fill(...bg)
      p5.rect(cx - sz/2, cy - sz/2, sz, sz, r)
    }
    // White icon inside
    p5.fill(255)
    const s = sz * 0.55
    if (type === 'ec2') {
      const bh = s * 0.18, gap = s * 0.14, bw = s * 0.82
      for (let i = 0; i < 3; i++) {
        const by = cy - s*0.25 + i*(bh + gap)
        p5.rect(cx - bw/2, by, bw, bh, 2)
        p5.fill(bg[0], bg[1], bg[2], 200)
        p5.circle(cx + bw/2 - 5, by + bh/2, 4)
        p5.fill(255)
      }
    } else if (type === 'ebs') {
      if (imgEbs.current) {
        p5.image(imgEbs.current, cx - s * 0.46, cy - s * 0.46, s * 0.92, s * 0.92)
      } else {
        const cw = s * 0.72, ch = s * 0.52, ew = cw, eh = ch * 0.28
        p5.ellipse(cx, cy - ch*0.25, ew, eh)
        p5.rect(cx - cw/2, cy - ch*0.25, cw, ch * 0.72)
        p5.ellipse(cx, cy + ch*0.48, ew, eh)
        p5.fill(bg[0], bg[1], bg[2], 120)
        p5.ellipse(cx, cy - ch*0.25, ew * 0.6, eh * 0.6)
      }
    } else if (type === 'ami') {
      if (imgAmi.current) {
        p5.image(imgAmi.current, cx - s * 0.46, cy - s * 0.46, s * 0.92, s * 0.92)
      } else {
        const dw = s * 0.55, dh = s * 0.38
        p5.rect(cx - s*0.36, cy - dh*0.5 - 4, dw, dh, 3)
        p5.fill(255, 255, 255, 200)
        p5.textSize(sz * 0.32); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('->', cx + s*0.12, cy + s*0.05)
        p5.fill(255)
        p5.rect(cx + s*0.05, cy - s*0.08, dw*0.75, dh*0.75, 2)
      }
    } else if (type === 'sg') {
      p5.beginShape()
      p5.vertex(cx, cy - s*0.42)
      p5.vertex(cx + s*0.38, cy - s*0.18)
      p5.vertex(cx + s*0.38, cy + s*0.12)
      p5.vertex(cx, cy + s*0.42)
      p5.vertex(cx - s*0.38, cy + s*0.12)
      p5.vertex(cx - s*0.38, cy - s*0.18)
      p5.endShape(p5.CLOSE)
    } else if (type === 'vpc') {
      const hw = s*0.38
      p5.strokeWeight(2); p5.stroke(255); p5.noFill()
      p5.rect(cx - hw, cy - hw*0.7, hw*2, hw*1.4, 3)
      p5.noStroke(); p5.fill(255)
      ;[[cx-hw,cy-hw*0.7],[cx+hw,cy-hw*0.7],[cx-hw,cy+hw*0.7],[cx+hw,cy+hw*0.7]].forEach(([px,py]) => p5.circle(px,py,5))
    } else if (type === 'key') {
      p5.circle(cx - s*0.12, cy - s*0.05, s*0.42)
      p5.fill(bg[0], bg[1], bg[2], 180)
      p5.circle(cx - s*0.12, cy - s*0.05, s*0.22)
      p5.fill(255)
      p5.rect(cx + s*0.04, cy - s*0.08, s*0.42, s*0.14, 2)
      p5.rect(cx + s*0.28, cy - s*0.08, s*0.1, s*0.24, 2)
      p5.rect(cx + s*0.36, cy - s*0.08, s*0.1, s*0.18, 2)
    } else if (type === 'pricing') {
      p5.textSize(sz * 0.5); p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text('$', cx, cy + 2)
    } else if (type === 'check') {
      p5.textSize(sz * 0.46); p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text('✓', cx, cy + 2)
    }
    // Label below icon
    if (label) {
      p5.noStroke(); p5.fill(55, 55, 55)
      p5.textSize(10); p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text(label, cx, cy + sz/2 + 11)
    }
  }

  // ── Arrow helper ───────────────────────────────────────────────────
  function arrow(p5: any, x1: number, y1: number, x2: number, y2: number,
    col: [number,number,number], w = 1.5) {
    p5.stroke(...col); p5.strokeWeight(w)
    p5.line(x1, y1, x2, y2)
    const ang = Math.atan2(y2-y1, x2-x1)
    const ah = 9
    p5.noStroke(); p5.fill(...col)
    p5.push(); p5.translate(x2, y2); p5.rotate(ang)
    p5.triangle(0, 0, -ah, -ah*0.45, -ah, ah*0.45)
    p5.pop()
  }

  const setup = (p5: any, ref: any) => {
    p5.createCanvas(W, H).parent(ref)
    p5.frameRate(40)
    p5.loadImage('/icons/aws/ami.svg', (img: unknown) => { imgAmi.current = img })
    p5.loadImage('/icons/aws/Elastic-Block-Store.svg', (img: unknown) => { imgEbs.current = img })
  }

  const draw = (p5: any) => {
    const s = stepRef.current
    timerRef.current++
    const t = timerRef.current
    p5.background(248, 250, 252)

    // ── Step 1: EC2 vs オンプレ ──────────────────────────────────────
    if (s === 1) {
      // Left: on-premises
      p5.strokeWeight(1.5); p5.stroke(160, 160, 160)
      p5.fill(230, 230, 230)
      p5.rect(55, 55, 210, 230, 8)
      p5.noStroke(); p5.fill(100, 100, 100)
      p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text('🏢 オンプレミス', 160, 76)
      for (let i = 0; i < 4; i++) {
        const sy = 94 + i * 42
        p5.fill(55, 55, 55); p5.rect(76, sy, 168, 28, 4)
        p5.fill(50, 210, 50); p5.circle(232, sy + 9, 5)
        p5.fill(200, 200, 200); p5.textSize(10); p5.textAlign(p5.LEFT)
        p5.text('Server ' + (i + 1), 86, sy + 18)
      }
      p5.noStroke(); p5.fill(180, 50, 50); p5.textSize(10.5); p5.textAlign(p5.CENTER)
      p5.text('数週間・高コスト', 160, 264)
      p5.text('増設に時間がかかる', 160, 278)

      // Right: AWS EC2
      p5.strokeWeight(1.5); p5.stroke(59, 130, 246)
      p5.fill(232, 244, 255)
      p5.rect(390, 55, 220, 230, 8)
      p5.noStroke(); p5.fill(37, 99, 235)
      p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text('☁️  AWS クラウド', 500, 76)
      const positions = [[444, 168], [500, 135], [556, 168]]
      positions.forEach(([ix, iy]) => awsIcon(p5, ix, iy, 54, AWS_ORANGE, 'ec2', 'EC2'))
      p5.noStroke(); p5.fill(16, 130, 60); p5.textSize(10.5); p5.textAlign(p5.CENTER)
      p5.text('数分・使った分だけ課金', 500, 264)
      p5.text('即時スケールアップ可', 500, 278)

      // VS
      p5.fill(100, 100, 100); p5.textSize(20); p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text('VS', W/2, H/2)

      // Legend
      p5.noStroke(); p5.fill(...AWS_ORANGE); p5.rect(10, H-22, 16, 12, 3)
      p5.fill(70, 70, 70); p5.textSize(10); p5.textAlign(p5.LEFT)
      p5.text('EC2（Elastic Compute Cloud）', 32, H-12)
    }

    // ── Step 2: インスタンスタイプ ──────────────────────────────────
    else if (s === 2) {
      // 4 family cards — centered evenly, height 175 to avoid overlap with anatomy panel
      const families = [
        { name: '汎用',        types: 't3, m5, m6g', use: 'Web サーバー\n開発環境',  col: AWS_ORANGE },
        { name: 'CPU 最適化',  types: 'c5, c6g',     use: 'バッチ処理\n動画変換',   col: AWS_BLUE },
        { name: 'メモリ最適化',types: 'r5, x1e',     use: '大規模 DB\nインメモリ',  col: AWS_PURPLE },
        { name: 'ストレージ',  types: 'i3, d3',      use: 'NoSQL DB\n高 I/O 処理', col: AWS_GREEN },
      ]
      // Cards: y=18 to y=195 (height 177)
      families.forEach((f, i) => {
        const cx = 82 + i * 131   // centers: 82, 213, 344, 475
        p5.strokeWeight(1); p5.stroke(f.col[0], f.col[1], f.col[2], 80)
        p5.fill(f.col[0], f.col[1], f.col[2], 14)
        p5.rect(cx - 60, 18, 120, 177, 10)   // ← bottom at y=195

        awsIcon(p5, cx, 70, 52, f.col, 'ec2')   // icon center y=70

        p5.noStroke(); p5.fill(...f.col)
        p5.textSize(12); p5.textAlign(p5.CENTER)
        p5.text(f.name, cx, 113)              // name

        p5.fill(f.col[0], f.col[1], f.col[2], 35)
        p5.rect(cx - 48, 120, 96, 22, 5)
        p5.fill(...f.col); p5.textSize(10.5)
        p5.text(f.types, cx, 135)             // types badge

        p5.fill(70, 70, 70); p5.textSize(10.5)
        f.use.split('\n').forEach((ln, j) => p5.text(ln, cx, 154 + j * 16))  // use cases
      })

      // Anatomy panel: y=208 to y=330
      p5.strokeWeight(1); p5.stroke(200, 200, 210)
      p5.fill(255, 255, 255, 220)
      p5.rect(10, 208, 640, 118, 8)

      p5.noStroke(); p5.fill(50, 50, 150)
      p5.textSize(11); p5.textAlign(p5.LEFT)
      p5.text('タイプ名の読み方：', 22, 228)

      // m5.xlarge breakdown with larger text
      const parts = [
        { text: 'm',       label: 'ファミリー',  sub: '（汎用）',         col: AWS_ORANGE },
        { text: '5',       label: '世代',        sub: '（数字が大きいほど高性能）', col: AWS_BLUE },
        { text: '.xlarge', label: 'サイズ',      sub: '（nano < micro < small < ... < xlarge）', col: AWS_PURPLE },
      ]
      let bx = 22
      parts.forEach(p_ => {
        const bw = p_.text.length * 14 + 20
        p5.fill(p_.col[0], p_.col[1], p_.col[2], 35)
        p5.rect(bx, 238, bw, 32, 6)
        p5.fill(...p_.col); p5.textSize(14); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text(p_.text, bx + bw/2, 254)
        p5.fill(60, 60, 60); p5.textSize(10.5); p5.textAlign(p5.LEFT)
        p5.text(p_.label, bx, 290)
        p5.textSize(9.5); p5.fill(120, 120, 140)
        p5.text(p_.sub, bx, 305)
        bx += bw + 12
      })
    }

    // ── Step 3: AMI ──────────────────────────────────────────────────
    else if (s === 3) {
      const amiX = 130, amiY = 145
      p5.strokeWeight(1); p5.stroke(...AWS_ORANGE)
      p5.fill(255, 240, 220, 200)
      p5.rect(amiX - 74, amiY - 68, 148, 136, 10)
      p5.noStroke(); p5.fill(...AWS_ORANGE)
      p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text('AMI（テンプレート）', amiX, amiY - 52)
      awsIcon(p5, amiX, amiY - 8, 58, AWS_ORANGE, 'ami')
      p5.fill(80, 80, 80); p5.textSize(10)
      p5.text('Amazon Linux 2023', amiX, amiY + 46)
      p5.text('+ Nginx + Node.js', amiX, amiY + 60)

      // Arrows to instances
      const targets = [[385, 75], [385, 165], [385, 255]]
      targets.forEach(([tx, ty]) => {
        arrow(p5, amiX + 74, amiY, tx - 32, ty, AWS_ORANGE, 1.5)
      })

      // ×N label
      p5.noStroke(); p5.fill(...AWS_ORANGE)
      p5.textSize(16); p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text('×N', 265, amiY)
      p5.fill(80, 80, 80); p5.textSize(10); p5.textAlign(p5.CENTER)
      p5.text('同一構成を何台でも', 265, amiY + 18)

      // Target instances
      targets.forEach(([tx, ty], i) => {
        awsIcon(p5, tx, ty, 52, AWS_ORANGE, 'ec2', `EC2 #${i+1}`)
      })

      // Note panel right side
      p5.strokeWeight(1); p5.stroke(200, 200, 210)
      p5.fill(255, 255, 255, 210)
      p5.rect(460, 48, 190, 240, 8)
      p5.noStroke(); p5.fill(50, 50, 150)
      p5.textSize(11); p5.textAlign(p5.LEFT)
      p5.text('📋 AMI の特徴', 472, 70)
      const notes = ['• AWS 公式 AMI', '• カスタム AMI 作成可', '• リージョン固有', '  他リージョンへ', '  コピー可', '• Marketplace AMI', '  （商用ソフト付き）']
      p5.fill(70, 70, 70); p5.textSize(10.5)
      notes.forEach((n, i) => p5.text(n, 472, 94 + i * 24))

      // Packet animation
      const seq: [{x:number;y:number},{x:number;y:number}][] = targets.map(([tx, ty]) => (
        [{ x: amiX + 74, y: amiY }, { x: tx - 32, y: ty }]
      ))
      if (!pkts.current.some(p => p.active)) {
        if (waitRef.current > 0) { waitRef.current-- }
        else if (phaseRef.current >= seq.length) { phaseRef.current = 0; waitRef.current = 40 }
        else { const seg = seq[phaseRef.current]; spawn(seg[0], seg[1], AWS_ORANGE); phaseRef.current++ }
      }
    }

    // ── Step 4: 起動フロー ───────────────────────────────────────────
    else if (s === 4) {
      const flowSteps = [
        { label: '① AMI',    sub: 'OS を選ぶ',      col: AWS_ORANGE,                              icon: 'ami', x: 55,  y: 130 },
        { label: '② タイプ', sub: 'CPU/Mem',         col: AWS_BLUE,                                icon: 'ec2', x: 178, y: 130 },
        { label: '③ NW',     sub: 'VPC/Subnet',      col: AWS_PURPLE,                              icon: 'vpc', x: 301, y: 130 },
        { label: '④ SG',     sub: 'ポート設定',       col: [220,80,80] as [number,number,number],  icon: 'sg',  x: 424, y: 130 },
        { label: '⑤ Key',    sub: 'SSH 鍵',           col: AWS_GRAY,                                icon: 'key', x: 547, y: 130 },
      ]

      // Background connector
      p5.stroke(220, 220, 220); p5.strokeWeight(2)
      p5.line(flowSteps[0].x, flowSteps[0].y, flowSteps[4].x, flowSteps[0].y)

      flowSteps.forEach((fs, i) => {
        awsIcon(p5, fs.x, fs.y, 60, fs.col, fs.icon)
        p5.noStroke()
        p5.fill(...fs.col); p5.textSize(11); p5.textAlign(p5.CENTER)
        p5.text(fs.label, fs.x, fs.y + 44)
        p5.fill(80, 80, 80); p5.textSize(10)
        p5.text(fs.sub, fs.x, fs.y + 57)
        if (i < flowSteps.length - 1)
          arrow(p5, fs.x + 38, fs.y, flowSteps[i+1].x - 38, flowSteps[i+1].y, [170,170,170], 1.5)
      })

      // Launch button
      p5.noStroke()
      p5.fill(255, 153, 0)
      p5.rect(236, 210, 186, 34, 8)
      p5.fill(255); p5.textSize(12); p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text('🚀  インスタンスを起動', 329, 227)

      arrow(p5, 329, 244, 329, 272, AWS_ORANGE, 2)

      awsIcon(p5, 329, 305, 52, AWS_ORANGE, 'ec2')
      p5.noStroke(); p5.fill(16, 130, 60); p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text('EC2 running ✅', 329, 330)

      // Highlight cycle
      const hi = Math.floor(t / 60) % 5
      const hfs = flowSteps[hi]
      p5.noFill(); p5.stroke(hfs.col[0], hfs.col[1], hfs.col[2], 180); p5.strokeWeight(3)
      p5.rect(hfs.x - 38, hfs.y - 38, 76, 76, 14)
    }

    // ── Step 5: EBS ──────────────────────────────────────────────────
    else if (s === 5) {
      // AZ border (ends at x=478, y=278)
      const AZ_X = 22, AZ_Y = 38, AZ_W = 456, AZ_H = 240
      p5.strokeWeight(1.5); p5.stroke(99, 102, 241, 100)
      p5.fill(238, 242, 255, 60)
      p5.rect(AZ_X, AZ_Y, AZ_W, AZ_H, 10)
      p5.noStroke(); p5.fill(99, 102, 241, 180)
      p5.textSize(10.5); p5.textAlign(p5.LEFT)
      p5.text('アベイラビリティゾーン（AZ）', AZ_X + 12, AZ_Y + 17)

      const ec2X = 130, ec2Y = 158, ec2Sz = 66
      const ebs1X = 340, ebs1Y = 110, ebsSz = 56
      const ebs2X = 340, ebs2Y = 220

      // EC2
      awsIcon(p5, ec2X, ec2Y, ec2Sz, AWS_ORANGE, 'ec2', 'EC2 インスタンス')

      // Arrows: EC2 → EBS (with arrowheads)
      arrow(p5, ec2X + 41, ec2Y - 14, ebs1X - 34, ebs1Y + 4, [100,150,200], 2)
      arrow(p5, ec2X + 41, ec2Y + 14, ebs2X - 34, ebs2Y - 4, [100,150,200], 2)

      // EBS 1
      awsIcon(p5, ebs1X, ebs1Y, ebsSz, AWS_GREEN, 'ebs', 'EBS')
      p5.noStroke(); p5.fill(40, 90, 40); p5.textSize(10.5); p5.textAlign(p5.LEFT)
      p5.text('gp3 ルートボリューム', ebs1X + 36, ebs1Y - 7)
      p5.fill(100, 130, 80); p5.textSize(10)
      p5.text('OS・アプリ', ebs1X + 36, ebs1Y + 9)

      // EBS 2
      awsIcon(p5, ebs2X, ebs2Y, ebsSz, AWS_GREEN, 'ebs', 'EBS')
      p5.noStroke(); p5.fill(40, 90, 40); p5.textSize(10.5); p5.textAlign(p5.LEFT)
      p5.text('gp3 データボリューム', ebs2X + 36, ebs2Y - 7)
      p5.fill(100, 130, 80); p5.textSize(10)
      p5.text('DB・ファイル', ebs2X + 36, ebs2Y + 9)

      // S3 Snapshot box (outside AZ, to the right)
      const s3X = 565, s3Y = 162
      p5.strokeWeight(1.5); p5.stroke(AWS_GREEN[0], AWS_GREEN[1], AWS_GREEN[2], 180)
      p5.fill(240, 252, 220, 230)
      p5.rect(s3X - 52, s3Y - 45, 104, 90, 8)
      p5.noStroke(); p5.fill(60, 100, 20)
      p5.textSize(11.5); p5.textAlign(p5.CENTER)
      p5.text('📸 Snapshot', s3X, s3Y - 24)
      p5.fill(40, 80, 20); p5.textSize(10.5)
      p5.text('→ S3 に保存', s3X, s3Y - 4)
      p5.fill(100, 130, 60); p5.textSize(10)
      p5.text('バックアップ', s3X, s3Y + 14)
      p5.fill(130, 150, 90); p5.textSize(9.5)
      p5.text('（別AZ・別リージョン）', s3X, s3Y + 30)

      // Snapshot arrows: EBS → S3
      arrow(p5, ebs1X + 33, ebs1Y - 4, s3X - 52, s3Y - 22, AWS_GREEN, 1.5)
      arrow(p5, ebs2X + 33, ebs2Y + 4, s3X - 52, s3Y + 18, AWS_GREEN, 1.5)

      // Note panel below AZ
      const ny = AZ_Y + AZ_H + 8   // y=286
      p5.strokeWeight(1); p5.stroke(180, 200, 240)
      p5.fill(235, 243, 255, 220)
      p5.rect(22, ny, 616, 46, 8)
      p5.noStroke(); p5.textAlign(p5.LEFT)
      p5.fill(30, 60, 150); p5.textSize(11)
      p5.text('💡 永続性のポイント', 34, ny + 16)
      p5.fill(70, 70, 70); p5.textSize(10)
      p5.text('EC2 を stop → EBS データは保持    |    EC2 を terminate → ルート EBS は削除（デフォルト）', 34, ny + 34)
    }

    // ── Step 6: ライフサイクル ───────────────────────────────────────
    else if (s === 6) {
      // State positions
      const states = [
        { label: 'pending',    sub: '起動中',        col: [180,140,0]   as [number,number,number], bg: [255,245,190] as [number,number,number], x: 85,  y: 160 },
        { label: 'running',    sub: '稼働中 💰',     col: [16,130,60]   as [number,number,number], bg: [210,250,230] as [number,number,number], x: 250, y: 100 },
        { label: 'stopping',   sub: '停止処理中…',  col: [100,100,100] as [number,number,number], bg: [230,230,230] as [number,number,number], x: 420, y: 100 },
        { label: 'stopped',    sub: '停止済み',      col: [60,80,200]   as [number,number,number], bg: [220,225,255] as [number,number,number], x: 565, y: 160 },
        { label: 'terminated', sub: '終了（削除）',  col: [200,50,50]   as [number,number,number], bg: [255,218,218] as [number,number,number], x: 330, y: 258 },
      ]

      // ── draw transitions (lines first, boxes on top)
      const transitions = [
        { from: 0, to: 1, label: 'start' },
        { from: 1, to: 2, label: 'stop' },
        { from: 2, to: 3, label: '' },
        { from: 3, to: 1, label: 'start' },
        { from: 1, to: 4, label: 'terminate' },
        { from: 3, to: 4, label: 'terminate' },
      ]
      const lineCol: [number,number,number] = [150, 150, 180]
      const termCol: [number,number,number] = [200, 50, 50]
      const startCol: [number,number,number] = [16, 130, 60]

      transitions.forEach(tr => {
        const from = states[tr.from], to_ = states[tr.to]
        const dx = to_.x - from.x, dy = to_.y - from.y
        const len = Math.sqrt(dx*dx + dy*dy)
        const nx_ = dx/len, ny_ = dy/len
        const pad = 50
        const col = tr.label === 'terminate' ? termCol : tr.label === 'start' ? startCol : lineCol
        arrow(p5, from.x + nx_*pad, from.y + ny_*pad, to_.x - nx_*pad, to_.y - ny_*pad, col, 1.5)
        if (tr.label) {
          p5.noStroke(); p5.fill(...col); p5.textSize(10); p5.textAlign(p5.CENTER)
          p5.text(tr.label, (from.x+to_.x)/2 + ny_*14, (from.y+to_.y)/2 - nx_*14)
        }
      })

      // Reboot: bezier curve self-loop above "running"
      const rx = states[1].x, ry = states[1].y
      const loopTop = ry - 58
      const rebootCol: [number,number,number] = [80, 80, 210]
      p5.noFill(); p5.stroke(...rebootCol); p5.strokeWeight(2)
      p5.beginShape()
      p5.vertex(rx - 14, ry - 22)
      p5.bezierVertex(rx - 14, loopTop, rx + 14, loopTop, rx + 14, ry - 22)
      p5.endShape()
      // Arrowhead pointing downward at end of curve
      p5.noStroke(); p5.fill(...rebootCol)
      p5.triangle(rx + 14, ry - 22, rx + 7, ry - 34, rx + 21, ry - 34)
      p5.textSize(10.5); p5.textAlign(p5.CENTER); p5.fill(...rebootCol)
      p5.text('reboot', rx, loopTop - 10)

      // State boxes
      states.forEach(st => {
        const bw = 96, bh = 40
        p5.strokeWeight(1.5); p5.stroke(...st.col)
        p5.fill(...st.bg)
        p5.rect(st.x - bw/2, st.y - bh/2, bw, bh, 8)
        p5.noStroke()
        p5.fill(...st.col); p5.textSize(11); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text(st.label, st.x, st.y - 6)
        p5.fill(80, 80, 80); p5.textSize(10)
        p5.text(st.sub, st.x, st.y + 10)
      })

      // Note
      p5.noStroke(); p5.fill(16, 130, 60); p5.textSize(10); p5.textAlign(p5.LEFT)
      p5.text('💰 課金：running 中のみ（stopped 中は EBS 費用のみ）', 14, H - 12)
    }

    // ── Step 7: 購入オプション ───────────────────────────────────────
    else if (s === 7) {
      const opts = [
        { label: 'オンデマンド',   price: '基準価格\n(100%)',   col: [100,100,200] as [number,number,number], icon: 'ec2',     note: '制約なし\n即時利用可', x: 75 },
        { label: 'リザーブド',     price: '最大 72%\n割引',     col: AWS_BLUE,                               icon: 'check',   note: '1〜3年\nコミット',   x: 218 },
        { label: 'Savings Plans', price: '最大 72%\n割引',     col: AWS_GREEN,                              icon: 'check',   note: '柔軟な\nコミット',   x: 361 },
        { label: 'スポット',       price: '最大 90%\n割引',     col: [200,80,80] as [number,number,number],  icon: 'pricing', note: '中断あり\nバッチ向け', x: 504 },
      ]

      opts.forEach(o => {
        p5.strokeWeight(1); p5.stroke(o.col[0], o.col[1], o.col[2], 80)
        p5.fill(o.col[0], o.col[1], o.col[2], 12)
        p5.rect(o.x - 60, 22, 120, 265, 10)
        awsIcon(p5, o.x, 88, 58, o.col, o.icon)
        p5.noStroke(); p5.fill(...o.col); p5.textSize(11); p5.textAlign(p5.CENTER)
        p5.text(o.label, o.x, 133)
        p5.fill(o.col[0], o.col[1], o.col[2], 185)
        p5.rect(o.x - 46, 142, 92, 38, 6)
        p5.fill(255); p5.textSize(11)
        o.price.split('\n').forEach((ln, j) => p5.text(ln, o.x, 156 + j * 16))
        p5.fill(80, 80, 80); p5.textSize(10.5)
        o.note.split('\n').forEach((ln, j) => p5.text(ln, o.x, 202 + j * 16))
      })

      // Use-case guide
      p5.strokeWeight(1); p5.stroke(200, 200, 210)
      p5.fill(255, 255, 255, 220)
      p5.rect(10, H - 52, 640, 42, 8)
      p5.noStroke(); p5.textAlign(p5.LEFT)
      p5.fill(50, 50, 150); p5.textSize(11)
      p5.text('💡 使い分け', 20, H - 35)
      p5.fill(70, 70, 70); p5.textSize(10.5)
      p5.text('短期/突発 → オンデマンド  |  長期安定 → リザーブド or Savings Plans  |  中断OK → スポット', 20, H - 16)
    }

    // ── Step 8: まとめ ───────────────────────────────────────────────
    else if (s === 8) {
      // 5 items: top row 3, bottom row 2
      const items = [
        { icon: 'ami',     col: AWS_ORANGE,                             label: 'AMI',          desc: 'OS+設定のテンプレート\n→ 複数インスタンスをクローン', x: 110, y: 90 },
        { icon: 'ec2',     col: AWS_ORANGE,                             label: 'インスタンスタイプ', desc: '汎用(t/m) / CPU(c)\nMem(r) / Storage(i)', x: 330, y: 90 },
        { icon: 'ebs',     col: AWS_GREEN,                              label: 'EBS',          desc: '永続ブロックストレージ\n→ 停止後もデータ保持',   x: 550, y: 90 },
        { icon: 'check',   col: [16,130,60] as [number,number,number],  label: 'ライフサイクル', desc: 'running 中のみ課金\nstop ≠ terminate',        x: 220, y: 252 },
        { icon: 'pricing', col: [100,100,200] as [number,number,number],label: '購入オプション', desc: 'オンデマンド / リザーブド\nSavings Plans / スポット', x: 440, y: 252 },
      ]
      const iconSz = 52

      // ── Draw arrows FIRST (so icons appear on top)
      const pulse = 0.5 + Math.sin(t * 0.06) * 0.5
      const aC: [number,number,number] = [190, 190, 205]
      // Top row horizontal
      arrow(p5, items[0].x + 30, items[0].y, items[1].x - 30, items[1].y, aC, 1.5)
      arrow(p5, items[1].x + 30, items[1].y, items[2].x - 30, items[2].y, aC, 1.5)
      // Diagonal: AMI → ライフサイクル (down-right)
      arrow(p5, items[0].x + 18, items[0].y + 30, items[3].x - 18, items[3].y - 30, aC, 1.5)
      // Diagonal: EBS → 購入オプション (down-left)
      arrow(p5, items[2].x - 18, items[2].y + 30, items[4].x + 18, items[4].y - 30, aC, 1.5)

      // ── Draw items
      items.forEach(it => {
        awsIcon(p5, it.x, it.y - 16, iconSz, it.col, it.icon)
        p5.noStroke(); p5.fill(...it.col)
        p5.textSize(11); p5.textAlign(p5.CENTER)
        p5.text(it.label, it.x, it.y + 24)
        p5.fill(70, 70, 70); p5.textSize(10)
        it.desc.split('\n').forEach((ln, j) => p5.text(ln, it.x, it.y + 40 + j * 14))
      })
    }

    // ── Draw packets ─────────────────────────────────────────────────
    pkts.current = pkts.current.filter(pk => pk.active)
    for (const pk of pkts.current) {
      pk.progress += pk.speed
      if (pk.progress >= 1) { pk.active = false; continue }
      const px = p5.lerp(pk.x, pk.tx, pk.progress)
      const py = p5.lerp(pk.y, pk.ty, pk.progress)
      p5.noStroke(); p5.fill(...pk.color, 200); p5.circle(px, py, 11)
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
            EC2 アーキテクチャ図（ステップ {step}/{TOTAL}）
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
              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold">✓</span>
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
          <p className="font-bold text-green-700 mb-1">EC2初級コンテンツ完了！</p>
          <p className="text-sm text-green-600">下の練習問題で理解度を確認しましょう。</p>
        </div>
      )}
    </div>
  )
}
