'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

const STEPS = [
  {
    id: 1,
    title: 'プレイスメントグループ 比較',
    emoji: '🏗️',
    description: 'プレイスメントグループはEC2インスタンスの物理配置を制御します。3種類あり、ワークロードの特性に合わせて選択します。',
    keyPoints: [
      'クラスター：同一AZ内に密集配置、低レイテンシー・高帯域（HPC向け）',
      'スプレッド：異なるハードウェアに分散、高可用性（最大7インスタンス/AZ）',
      'パーティション：ラック単位で分離、分散システム（Hadoop/Kafka向け）',
    ],
    hint: '3種類の配置戦略の特徴と用途の違いを理解',
  },
  {
    id: 2,
    title: 'クラスタープレイスメントグループ',
    emoji: '⚡',
    description: '同一AZ内のインスタンスを物理的に近くに密集配置します。超低レイテンシーと高帯域幅を実現するため、HPCや機械学習に最適です。',
    keyPoints: [
      '同一AZ内に密集配置（複数AZにはまたがれない）',
      '10Gbps以上の帯域幅、マイクロ秒単位のレイテンシーを実現',
      'AZ障害が発生するとグループ全体が影響を受けるリスクがある',
      '機械学習トレーニング・HPC・ビッグデータ処理に最適',
    ],
    hint: '低レイテンシー・高帯域が最優先のワークロード向け',
  },
  {
    id: 3,
    title: 'スプレッドプレイスメントグループ',
    emoji: '🔀',
    description: 'インスタンスをそれぞれ異なる物理ハードウェア（ラック）に分散配置します。ハードウェア障害が1つのインスタンスにしか影響しない構成です。',
    keyPoints: [
      'インスタンスごとに異なる物理ラックに配置',
      '最大7インスタンス/AZという制限がある',
      'ハードウェア障害の影響を最小化できる（1台にしか影響しない）',
      'クリティカルなアプリの高可用性に最適',
    ],
    hint: '各インスタンスが必ず別々の物理ハードウェアに配置される',
  },
  {
    id: 4,
    title: 'パーティションプレイスメントグループ',
    emoji: '🗂️',
    description: 'インスタンスをパーティション（ラックのグループ）に分散配置します。パーティション間でハードウェアを共有しないため、障害の影響範囲を限定できます。',
    keyPoints: [
      'パーティションごとに異なる物理ラックを使用',
      '最大7パーティション/AZ（各パーティションに多数のインスタンス配置可）',
      'パーティション情報をアプリに渡してデータ複製を制御できる',
      'HDFS・HBase・Cassandra・Kafkaなどの分散システム向け',
    ],
    hint: 'スプレッドと異なり1パーティションに複数インスタンスを配置できる',
  },
  {
    id: 5,
    title: 'ハイバネーション',
    emoji: '😴',
    description: 'ハイバネーションはインスタンスのRAM状態をEBSに保存して停止します。再起動時はEBSからRAMを復元するため、通常のstopより大幅に高速起動できます。',
    keyPoints: [
      'RAM状態をEBSルートボリュームに保存（ルートEBSの暗号化が必須）',
      '起動時間が大幅に短縮（OSの再起動・アプリ初期化が不要）',
      'RAM容量は150GB以下が必要',
      'ハイバネーション状態は最大60日まで維持できる',
    ],
    hint: 'stop → RAM消去 vs hibernate → RAM状態をEBSに保存',
  },
  {
    id: 6,
    title: 'Dedicated Host / Dedicated Instance',
    emoji: '🏢',
    description: '物理サーバーを専有できる2つのオプションです。BYOLライセンスやコンプライアンス要件がある場合に使用します。',
    keyPoints: [
      'Dedicated Host：物理サーバーを丸ごと専有（BYOL・コンプライアンス対応）',
      'Dedicated Instance：専有ハードウェアで動作（同一アカウントの他インスタンスと共有の可能性あり）',
      'Dedicated Hostはインスタンスの配置・数を完全制御できる',
      'コスト：Dedicated Host > Dedicated Instance > 通常インスタンス',
    ],
    hint: 'BYOL（Bring Your Own License）が必要ならDedicated Host一択',
  },
  {
    id: 7,
    title: 'ENI（Elastic Network Interface）',
    emoji: '🔌',
    description: 'ENIは仮想ネットワークインターフェイスです。EC2に複数アタッチでき、異なるIP・SGを持てます。ENIを別インスタンスへ移動してフェイルオーバーを実現できます。',
    keyPoints: [
      '1つのEC2に複数のENIをアタッチ可能（eth0・eth1 …）',
      'プライマリIP・セカンダリIP・Elastic IPをENI単位で管理',
      'ENIを別インスタンスに移動して高速フェイルオーバーが可能',
      'セキュリティグループはENI単位で適用される',
    ],
    hint: 'ENIを移動するだけでネットワーク設定ごとフェイルオーバーできる',
  },
  {
    id: 8,
    title: 'まとめ：上級ポイント整理',
    emoji: '🎯',
    description: 'EC2上級の試験頻出ポイントをまとめます。プレイスメントグループの使い分け、ハイバネーションの条件、Dedicated HostとInstanceの違いが特に重要です。',
    keyPoints: [
      'クラスター = 低レイテンシー（HPC）、スプレッド = 最大7/AZ（HA）、パーティション = 分散システム',
      'ハイバネーション = RAM→EBS保存、150GB以下、暗号化必須、最大60日',
      'Dedicated Host = 物理サーバー専有・BYOL可、Dedicated Instance = 専有HWのみ',
      'ENI = 複数NIC・フェイルオーバー、SG単位で適用',
    ],
    hint: '各機能の制限値と使い分けを押さえれば試験で確実に得点できる',
  },
]

const TOTAL = STEPS.length
const W = 660
const H = 340

const ORANGE: [number,number,number] = [255, 153,  0]
const BLUE:   [number,number,number] = [ 35, 100,170]
const GREEN:  [number,number,number] = [122, 161, 22]
const PURPLE: [number,number,number] = [140,  79,255]
const GRAY:   [number,number,number] = [100, 116,139]
const DARK:   [number,number,number] = [ 50,  55, 65]
const RED:    [number,number,number] = [200,  55, 55]

export default function EC2AdvancedStepper() {
  const [step, setStep] = useState(1)
  const stepRef  = useRef(1)
  const timerRef = useRef(0)
  const imgEc2   = useRef<unknown>(null)

  useEffect(() => {
    stepRef.current  = step
    timerRef.current = 0
  }, [step])

  // ── Straight arrow (H or V only) ─────────────────────────────────
  function arrow(p5: any, x1: number, y1: number, x2: number, y2: number,
    col: [number,number,number], w = 1.5) {
    p5.stroke(...col); p5.strokeWeight(w)
    p5.line(x1, y1, x2, y2)
    const ang = Math.atan2(y2 - y1, x2 - x1)
    const ah = 8
    p5.noStroke(); p5.fill(...col)
    p5.push(); p5.translate(x2, y2); p5.rotate(ang)
    p5.triangle(0, 0, -ah, -ah*0.44, -ah, ah*0.44)
    p5.pop()
  }

  // ── Plain line (no arrowhead) ─────────────────────────────────────
  function line(p5: any, x1: number, y1: number, x2: number, y2: number,
    col: [number,number,number], w = 1.5) {
    p5.stroke(...col); p5.strokeWeight(w); p5.line(x1, y1, x2, y2)
  }

  // ── Clean server/EC2 box (minimal, no forced color background) ────
  function ec2Box(p5: any, x: number, y: number, bw: number, bh: number,
    label: string, borderCol: [number,number,number] = DARK) {
    p5.strokeWeight(1.5); p5.stroke(...borderCol)
    p5.fill(250, 251, 253)
    p5.rect(x, y, bw, bh, 3)
    // Server rack lines (subtle)
    p5.strokeWeight(1); p5.stroke(...borderCol, 90)
    const rh = 4, gap = 3, pad = 5
    for (let i = 0; i < 3; i++) {
      const ry = y + pad + i * (rh + gap)
      if (ry + rh > y + bh - 4) break
      p5.fill(...borderCol, 18); p5.rect(x + pad, ry, bw - pad*2, rh, 1)
    }
    if (label) {
      p5.noStroke(); p5.fill(...DARK)
      p5.textSize(12); p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text(label, x + bw/2, y + bh/2 + 6)
    }
  }

  // ── Labeled container box ─────────────────────────────────────────
  function container(p5: any, x: number, y: number, bw: number, bh: number,
    title: string, col: [number,number,number], fillAlpha = 18) {
    p5.strokeWeight(1.5); p5.stroke(...col)
    p5.fill(col[0], col[1], col[2], fillAlpha)
    p5.rect(x, y, bw, bh, 6)
    p5.noStroke(); p5.fill(...col)
    p5.textSize(12); p5.textAlign(p5.LEFT, p5.TOP)
    p5.text(title, x + 8, y + 7)
  }

  // ── Badge label ───────────────────────────────────────────────────
  function badge(p5: any, cx: number, cy: number, text: string,
    col: [number,number,number], bw = 0) {
    const tw = bw || (text.length * 7 + 16)
    p5.noStroke(); p5.fill(...col, 220)
    p5.rect(cx - tw/2, cy - 10, tw, 20, 4)
    p5.fill(255); p5.textSize(11); p5.textAlign(p5.CENTER, p5.CENTER)
    p5.text(text, cx, cy)
  }

  const setup = (p5: any, ref: any) => {
    p5.createCanvas(W, H).parent(ref)
    p5.frameRate(40)
    p5.loadImage('/icons/aws/ec2.svg', (img: unknown) => { imgEc2.current = img })
  }

  const draw = (p5: any) => {
    const s = stepRef.current
    timerRef.current++
    const t = timerRef.current
    p5.background(248, 250, 252)
    p5.textFont('sans-serif')

    // ── STEP 1: プレイスメントグループ 比較 ─────────────────────────
    if (s === 1) {
      const cards = [
        { title: 'クラスター',     col: ORANGE, hint: 'HPC / 機械学習', x: 14  },
        { title: 'スプレッド',     col: BLUE,   hint: '高可用性',       x: 234 },
        { title: 'パーティション', col: GREEN,  hint: '分散システム',   x: 454 },
      ]

      cards.forEach(c => {
        // Card border (no background)
        p5.strokeWeight(1.5); p5.stroke(...c.col)
        p5.fill(c.col[0], c.col[1], c.col[2], 10)
        p5.rect(c.x, 14, 196, 316, 8)

        // Title
        p5.noStroke(); p5.fill(...c.col)
        p5.textSize(14); p5.textAlign(p5.CENTER)
        p5.text(c.title, c.x + 98, 38)

        // Mini diagram
        const mx = c.x + 98  // card center x
        if (c.col === ORANGE) {
          // クラスター: 2×3 tight grid
          const cols3 = [mx - 54, mx, mx + 54]
          const rows2 = [95, 145]
          rows2.forEach(ry => {
            cols3.forEach(rx => {
              p5.strokeWeight(1.5); p5.stroke(...ORANGE)
              p5.fill(255, 242, 220)
              p5.rect(rx - 22, ry - 14, 44, 28, 3)
            })
            // H connections in row
            line(p5, cols3[0]+22, ry, cols3[1]-22, ry, ORANGE, 2)
            line(p5, cols3[1]+22, ry, cols3[2]-22, ry, ORANGE, 2)
          })
          // V connections in each col
          cols3.forEach(rx => line(p5, rx, rows2[0]+14, rx, rows2[1]-14, ORANGE, 2))
          p5.noStroke(); p5.fill(...ORANGE); p5.textSize(11); p5.textAlign(p5.CENTER)
          p5.text('同一AZ内に密集', mx, 185)
        } else if (c.col === BLUE) {
          // スプレッド: 4 separate racks
          const rxs = [mx - 60, mx - 20, mx + 20, mx + 60]
          rxs.forEach(rx => {
            // Rack column
            p5.strokeWeight(1); p5.stroke(...BLUE, 80)
            p5.fill(235, 240, 255)
            p5.rect(rx - 14, 72, 28, 115, 3)
            // EC2 box inside
            p5.strokeWeight(1.5); p5.stroke(...BLUE)
            p5.fill(250, 252, 255)
            p5.rect(rx - 11, 78, 22, 22, 2)
          })
          // H line connecting all (network)
          line(p5, rxs[0], 89, rxs[3], 89, BLUE, 1.5)
          p5.noStroke(); p5.fill(...BLUE); p5.textSize(11); p5.textAlign(p5.CENTER)
          p5.text('異なるハードウェアへ分散', mx, 205)
          p5.textSize(10.5); p5.fill(100, 100, 130)
          p5.text('最大7台/AZ', mx, 220)
        } else {
          // パーティション: 2 partitions × 3 EC2 each
          const parts = [mx - 46, mx + 10]
          const heights = [80, 115, 150]
          parts.forEach((px, pi) => {
            p5.strokeWeight(1); p5.stroke(...GREEN, 100)
            p5.fill(240, 250, 225)
            p5.rect(px - 4, 68, 46, 100, 4)
            p5.noStroke(); p5.fill(...GREEN); p5.textSize(10)
            p5.textAlign(p5.CENTER)
            p5.text('P' + (pi+1), px + 19, 80)
            heights.forEach(hy => {
              p5.strokeWeight(1.5); p5.stroke(...GREEN)
              p5.fill(248, 252, 240)
              p5.rect(px, hy, 38, 16, 2)
            })
          })
          p5.noStroke(); p5.fill(...GREEN); p5.textSize(11); p5.textAlign(p5.CENTER)
          p5.text('ラック単位で分離', mx, 190)
          p5.textSize(10.5); p5.fill(80, 110, 40)
          p5.text('最大7パーティション/AZ', mx, 205)
        }

        // Use-case badge
        badge(p5, c.x + 98, 240, c.hint, c.col, 110)

        // Key info
        const infos: [string, string, string][] = [
          ['低レイテンシー', '同一AZ必須', 'HPC向き'],
          ['高可用性', '最大7/AZ', '障害分離'],
          ['多数台', '7パーティション', 'Kafka/HDFS'],
        ]
        const cardInfos = infos[cards.indexOf(c)]
        cardInfos.forEach((txt, i) => {
          p5.noStroke(); p5.fill(70, 70, 80)
          p5.textSize(11); p5.textAlign(p5.CENTER)
          p5.text(txt, c.x + 98, 270 + i*18)
        })
      })
    }

    // ── STEP 2: クラスタープレイスメントグループ ─────────────────────
    else if (s === 2) {
      // AZ container
      container(p5, 16, 14, 490, 312, 'AZ-a（単一アベイラビリティゾーン）', BLUE, 10)

      // Cluster group inner box
      p5.strokeWeight(2); p5.stroke(...ORANGE)
      p5.fill(255, 248, 232, 50)
      p5.rect(34, 44, 454, 262, 6)
      p5.noStroke(); p5.fill(...ORANGE); p5.textSize(13); p5.textAlign(p5.LEFT)
      p5.text('クラスタープレイスメントグループ', 46, 62)

      // 6 EC2 boxes in 3×2 grid
      const cols = [100, 240, 380]
      const rows = [120, 240]
      rows.forEach((ry, ri) => {
        cols.forEach((cx, ci) => {
          ec2Box(p5, cx - 44, ry - 28, 88, 56, `EC2 #${ri*3+ci+1}`, ORANGE)
        })
        // Horizontal connections
        line(p5, cols[0]+44, ry, cols[1]-44, ry, ORANGE, 2.5)
        line(p5, cols[1]+44, ry, cols[2]-44, ry, ORANGE, 2.5)
      })
      // Vertical connections
      cols.forEach(cx => line(p5, cx, rows[0]+28, cx, rows[1]-28, ORANGE, 2.5))

      // Bandwidth annotation (H line at bottom of diagram)
      p5.stroke(...ORANGE, 180); p5.strokeWeight(1.5)
      p5.line(34, 290, 488, 290)
      // Left and right end ticks
      p5.line(34, 284, 34, 296); p5.line(488, 284, 488, 296)
      p5.noStroke(); p5.fill(...ORANGE); p5.textSize(12); p5.textAlign(p5.CENTER)
      p5.text('← 10Gbps+ 高帯域・マイクロ秒レイテンシー →', 261, 310)

      // Right info panel
      p5.strokeWeight(1); p5.stroke(...ORANGE, 60)
      p5.fill(255, 248, 232, 120)
      p5.rect(518, 14, 128, 312, 6)
      p5.noStroke(); p5.fill(...ORANGE); p5.textSize(13); p5.textAlign(p5.LEFT)
      p5.text('用途・特徴', 528, 36)

      const points = [
        ['✓', 'HPC'],
        ['✓', '機械学習'],
        ['✓', '低レイテンシー'],
        ['✓', '高帯域幅'],
        ['✓', '同一AZ必須'],
        ['✗', 'AZ障害で全滅'],
      ]
      points.forEach(([mark, txt], i) => {
        const col: [number,number,number] = mark === '✓' ? [16,130,60] : RED
        p5.fill(...col); p5.textSize(12); p5.textAlign(p5.LEFT)
        p5.text(mark + ' ' + txt, 528, 64 + i * 38)
      })
    }

    // ── STEP 3: スプレッドプレイスメントグループ ────────────────────
    else if (s === 3) {
      const racks = 5
      const rackW = 90, rackH = 220
      const startX = (W - (racks * rackW + (racks-1)*20)) / 2  // centered
      const rackY = 40

      for (let i = 0; i < racks; i++) {
        const rx = startX + i * (rackW + 20)

        // Physical rack (outer box, distinct look)
        p5.strokeWeight(1); p5.stroke(...GRAY)
        p5.fill(235, 237, 241)
        p5.rect(rx, rackY, rackW, rackH, 4)
        p5.noStroke(); p5.fill(...GRAY); p5.textSize(12); p5.textAlign(p5.CENTER)
        p5.text('Rack ' + (i+1), rx + rackW/2, rackY + 14)

        // EC2 instance inside rack
        ec2Box(p5, rx + 8, rackY + 22, rackW - 16, 56, 'EC2', BLUE)

        // 異なるハードウェア marker
        p5.noStroke(); p5.fill(...BLUE, 180)
        p5.textSize(10.5); p5.textAlign(p5.CENTER)
        p5.text('独立HW', rx + rackW/2, rackY + 104)
      }

      // Horizontal network backbone
      const netY = rackY + 45
      const leftX = startX + rackW/2, rightX = startX + (racks-1)*(rackW+20) + rackW/2
      line(p5, leftX, netY, rightX, netY, BLUE, 1.5)
      // Vertical taps from network to each rack
      for (let i = 0; i < racks; i++) {
        const rx = startX + i * (rackW + 20) + rackW/2
        line(p5, rx, rackY + 78, rx, netY, BLUE, 1)
      }

      // Note box at bottom
      p5.strokeWeight(1); p5.stroke(...BLUE, 80)
      p5.fill(235, 242, 255, 200)
      p5.rect(14, 274, 632, 56, 6)
      p5.noStroke()
      p5.fill(...BLUE); p5.textSize(13); p5.textAlign(p5.LEFT)
      p5.text('特徴：', 26, 296)
      p5.fill(50, 50, 60); p5.textSize(12)
      p5.text('各インスタンスが独立したハードウェアに配置  →  最大1台しか同時障害しない', 80, 296)
      p5.fill(...BLUE); p5.textSize(12)
      p5.text('制限：最大 7 インスタンス / AZ', 26, 318)
    }

    // ── STEP 4: パーティションプレイスメントグループ ─────────────────
    else if (s === 4) {
      const parts = 3
      const pW = 170, pH = 240, startX = (W - parts*pW - (parts-1)*24) / 2
      const pY = 30

      for (let pi = 0; pi < parts; pi++) {
        const px = startX + pi * (pW + 24)

        // Partition container
        p5.strokeWeight(2); p5.stroke(...GREEN)
        p5.fill(GREEN[0], GREEN[1], GREEN[2], 12)
        p5.rect(px, pY, pW, pH, 6)
        p5.noStroke(); p5.fill(...GREEN); p5.textSize(13); p5.textAlign(p5.CENTER)
        p5.text('Partition ' + (pi+1), px + pW/2, pY + 18)
        p5.fill(80, 110, 40); p5.textSize(11)
        p5.text('（独立ラック）', px + pW/2, pY + 33)

        // 3 EC2 boxes stacked
        for (let ei = 0; ei < 3; ei++) {
          ec2Box(p5, px + 16, pY + 48 + ei * 60, pW - 32, 44, 'EC2', GREEN)
        }

        // Partition label badge at bottom of partition
        badge(p5, px + pW/2, pY + pH - 14, 'Rack ' + String.fromCharCode(65+pi), GREEN, 70)
      }

      // Vertical separator lines between partitions (thick)
      for (let pi = 0; pi < parts-1; pi++) {
        const sepX = startX + (pi+1) * (pW + 24) - 12
        p5.stroke(200, 200, 200); p5.strokeWeight(2.5)
        p5.line(sepX, pY + 4, sepX, pY + pH - 4)
      }

      // Note at bottom
      p5.strokeWeight(1); p5.stroke(...GREEN, 80)
      p5.fill(240, 250, 225, 200)
      p5.rect(14, 280, 632, 50, 6)
      p5.noStroke(); p5.fill(...GREEN); p5.textSize(13); p5.textAlign(p5.LEFT)
      p5.text('用途：', 26, 300)
      p5.fill(50, 55, 50); p5.textSize(12)
      p5.text('HDFS・HBase・Cassandra・Kafka など分散システム', 80, 300)
      p5.fill(...GREEN); p5.textSize(12)
      p5.text('最大 7 パーティション / AZ', 26, 320)
    }

    // ── STEP 5: ハイバネーション ─────────────────────────────────────
    else if (s === 5) {
      // 4-state horizontal flow: Running → Hibernate → Stopped → Resumed
      const states = [
        { label: 'Running',       sub: 'RAM: 使用中',       note: 'OS・アプリ稼働',     col: [16,130,60]   as [number,number,number], y: 55  },
        { label: 'Hibernate',     sub: 'RAM → EBS へ保存',  note: '暗号化必須',          col: [200,140,0]   as [number,number,number], y: 55  },
        { label: 'Stopped',       sub: 'EBS: RAM保存済',    note: '最大60日',            col: BLUE,                                   y: 55  },
        { label: 'Resumed',       sub: 'EBS → RAM へ復元',  note: '高速起動 ✅',         col: [16,130,60]   as [number,number,number], y: 55  },
      ]
      const boxW = 130, boxH = 190
      const startX = (W - (states.length * boxW + (states.length-1)*22)) / 2

      states.forEach((st, i) => {
        const bx = startX + i * (boxW + 22)
        const by = st.y

        // State box (border only, light fill)
        p5.strokeWeight(2); p5.stroke(...st.col)
        p5.fill(st.col[0], st.col[1], st.col[2], 12)
        p5.rect(bx, by, boxW, boxH, 6)

        // Title
        p5.noStroke(); p5.fill(...st.col)
        p5.textSize(14); p5.textAlign(p5.CENTER)
        p5.text(st.label, bx + boxW/2, by + 26)

        // Separator line
        p5.stroke(...st.col, 80); p5.strokeWeight(1)
        p5.line(bx + 10, by + 36, bx + boxW - 10, by + 36)

        // RAM/EBS visual (simple box in middle)
        if (i === 0 || i === 3) {
          // Running/Resumed: show RAM active
          p5.noStroke(); p5.fill(...st.col, 30)
          p5.rect(bx + 16, by + 48, boxW - 32, 40, 4)
          p5.fill(...st.col); p5.textSize(12); p5.textAlign(p5.CENTER)
          p5.text('RAM', bx + boxW/2, by + 62)
          p5.fill(50, 50, 60); p5.textSize(11)
          p5.text('プロセス稼働中', bx + boxW/2, by + 80)
        } else if (i === 1) {
          // Hibernating: RAM → EBS (vertical arrow)
          p5.noStroke(); p5.fill(200, 180, 0, 25)
          p5.rect(bx + 16, by + 46, boxW - 32, 30, 4)
          p5.fill(200, 140, 0); p5.textSize(12); p5.textAlign(p5.CENTER)
          p5.text('RAM', bx + boxW/2, by + 66)
          arrow(p5, bx + boxW/2, by + 80, bx + boxW/2, by + 108, [200,140,0], 2)
          p5.noStroke(); p5.fill(200, 180, 0, 25)
          p5.rect(bx + 16, by + 110, boxW - 32, 30, 4)
          p5.fill(200, 140, 0); p5.textSize(12); p5.textAlign(p5.CENTER)
          p5.text('EBS', bx + boxW/2, by + 130)
        } else if (i === 2) {
          // Stopped: EBS has saved state
          p5.noStroke(); p5.fill(...BLUE, 25)
          p5.rect(bx + 16, by + 48, boxW - 32, 40, 4)
          p5.fill(...BLUE); p5.textSize(12); p5.textAlign(p5.CENTER)
          p5.text('EBS', bx + boxW/2, by + 62)
          p5.fill(50, 50, 60); p5.textSize(11)
          p5.text('RAM状態保存済', bx + boxW/2, by + 80)
        }

        // Sub-text & note
        p5.noStroke(); p5.fill(...st.col); p5.textSize(12); p5.textAlign(p5.CENTER)
        p5.text(st.sub, bx + boxW/2, by + 154)
        p5.fill(80, 80, 90); p5.textSize(11)
        p5.text(st.note, bx + boxW/2, by + 172)

        // Arrow to next state (horizontal)
        if (i < states.length - 1) {
          const ax = bx + boxW + 1, ay = by + boxH/2
          arrow(p5, ax, ay, ax + 20, ay, GRAY, 2)
        }
      })

      // Label below: compare with stop
      p5.noStroke(); p5.fill(80, 80, 90); p5.textSize(12); p5.textAlign(p5.CENTER)
      p5.text('通常の stop = RAM 消去・OS再起動が必要  |  hibernate = RAM保存・高速復元', W/2, H - 8)
    }

    // ── STEP 6: Dedicated Host / Dedicated Instance ──────────────────
    else if (s === 6) {
      // Left: Dedicated Host
      p5.strokeWeight(2); p5.stroke(...ORANGE)
      p5.fill(255, 248, 232, 80)
      p5.rect(14, 16, 292, 308, 8)
      p5.noStroke(); p5.fill(...ORANGE); p5.textSize(15); p5.textAlign(p5.CENTER)
      p5.text('Dedicated Host', 160, 40)

      p5.fill(60, 40, 10); p5.textSize(12); p5.textAlign(p5.CENTER)
      p5.text('物理サーバーを丸ごと専有', 160, 60)

      // Physical server drawing (left)
      p5.strokeWeight(1); p5.stroke(160, 130, 50)
      p5.fill(245, 235, 200)
      p5.rect(30, 72, 260, 160, 4)
      p5.noStroke(); p5.fill(120, 90, 30); p5.textSize(12); p5.textAlign(p5.CENTER)
      p5.text('物理サーバー（専有）', 160, 90)

      // 3 EC2 instances inside
      for (let i = 0; i < 3; i++) {
        ec2Box(p5, 42, 100 + i*54, 236, 42, 'EC2 Instance #' + (i+1), ORANGE)
      }

      // Key features
      const hostPts = ['✓ BYOL（BringYour Own License）', '✓ インスタンス配置を完全制御', '✓ ソケット・コア数の把握が可能', '✓ コスト：最も高い']
      hostPts.forEach((pt, i) => {
        const col: [number,number,number] = pt.startsWith('✓') ? [16,130,60] : RED
        p5.noStroke(); p5.fill(...col); p5.textSize(11.5); p5.textAlign(p5.LEFT)
        p5.text(pt, 26, 250 + i*18)
      })

      // VS
      p5.noStroke(); p5.fill(120, 120, 130); p5.textSize(16); p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text('VS', W/2, H/2)

      // Right: Dedicated Instance
      p5.strokeWeight(2); p5.stroke(...BLUE)
      p5.fill(232, 242, 255, 80)
      p5.rect(354, 16, 292, 308, 8)
      p5.noStroke(); p5.fill(...BLUE); p5.textSize(15); p5.textAlign(p5.CENTER)
      p5.text('Dedicated Instance', 500, 40)

      p5.fill(20, 50, 100); p5.textSize(12); p5.textAlign(p5.CENTER)
      p5.text('専有ハードウェアで動作', 500, 60)

      // Physical server (right)
      p5.strokeWeight(1); p5.stroke(50, 80, 150)
      p5.fill(215, 230, 255)
      p5.rect(370, 72, 260, 106, 4)
      p5.noStroke(); p5.fill(40, 70, 140); p5.textSize(12); p5.textAlign(p5.CENTER)
      p5.text('物理サーバー（専有HW）', 500, 90)
      ec2Box(p5, 382, 100, 236, 64, '自社 EC2 Instance', BLUE)

      const instPts = ['✓ 専有ハードウェアで動作', '△ 同一アカウントの他インスタンス', '   と共有の可能性あり', '✓ コスト：Host より安い']
      instPts.forEach((pt, i) => {
        const col: [number,number,number] = pt.startsWith('✓') ? [16,130,60] : pt.startsWith('△') ? [180,100,10] : [100,100,100]
        p5.noStroke(); p5.fill(...col); p5.textSize(11.5); p5.textAlign(p5.LEFT)
        p5.text(pt, 366, 200 + i*19)
      })
    }

    // ── STEP 7: ENI ──────────────────────────────────────────────────
    else if (s === 7) {
      // EC2 instance (left)
      p5.strokeWeight(2); p5.stroke(...DARK)
      p5.fill(248, 250, 252)
      p5.rect(16, 40, 160, 220, 6)
      p5.noStroke(); p5.fill(...DARK); p5.textSize(13); p5.textAlign(p5.CENTER)
      p5.text('EC2 Instance', 96, 62)
      // Server racks
      for (let i = 0; i < 4; i++) {
        p5.strokeWeight(1); p5.stroke(...DARK, 80)
        p5.fill(...DARK, 15); p5.rect(28, 72 + i*12, 136, 8, 2)
      }

      // ENI-1 (eth0) row
      p5.strokeWeight(1.5); p5.stroke(...BLUE)
      p5.fill(232, 242, 255)
      p5.rect(28, 122, 136, 36, 4)
      p5.noStroke(); p5.fill(...BLUE); p5.textSize(12); p5.textAlign(p5.CENTER)
      p5.text('eth0 / ENI-1 (Primary)', 96, 144)

      // ENI-2 (eth1) row
      p5.strokeWeight(1.5); p5.stroke(...PURPLE)
      p5.fill(245, 238, 255)
      p5.rect(28, 180, 136, 36, 4)
      p5.noStroke(); p5.fill(...PURPLE); p5.textSize(12); p5.textAlign(p5.CENTER)
      p5.text('eth1 / ENI-2 (Secondary)', 96, 202)

      // Horizontal arrows from ENIs to IP boxes
      arrow(p5, 164, 140, 204, 140, BLUE, 2)
      arrow(p5, 164, 198, 204, 198, PURPLE, 2)

      // IP attribute boxes
      p5.strokeWeight(1.5); p5.stroke(...BLUE)
      p5.fill(232, 242, 255)
      p5.rect(204, 108, 190, 60, 4)
      p5.noStroke(); p5.fill(...BLUE); p5.textSize(12); p5.textAlign(p5.LEFT)
      p5.text('Private IP: 10.0.1.10', 214, 128)
      p5.fill(35, 100, 170); p5.textSize(11.5)
      p5.text('Elastic IP: 54.12.34.56', 214, 148)
      p5.text('SG: web-sg', 214, 164)

      p5.strokeWeight(1.5); p5.stroke(...PURPLE)
      p5.fill(245, 238, 255)
      p5.rect(204, 170, 190, 60, 4)
      p5.noStroke(); p5.fill(...PURPLE); p5.textSize(12); p5.textAlign(p5.LEFT)
      p5.text('Private IP: 10.0.2.20', 214, 190)
      p5.fill(120, 70, 200); p5.textSize(11.5)
      p5.text('別サブネット対応可', 214, 208)
      p5.text('SG: db-sg', 214, 224)

      // Failover note box
      p5.strokeWeight(1); p5.stroke(...PURPLE, 80)
      p5.fill(248, 244, 255, 220)
      p5.rect(14, 278, 632, 52, 6)
      p5.noStroke(); p5.fill(...PURPLE); p5.textSize(13); p5.textAlign(p5.LEFT)
      p5.text('フェイルオーバー：', 26, 298)
      p5.fill(60, 40, 100); p5.textSize(12)
      p5.text('ENI-2 を障害 EC2 からデタッチ  →  待機 EC2 にアタッチ  →  IP・SG設定ごと移動', 168, 298)
      p5.fill(100, 70, 160); p5.textSize(12)
      p5.text('→  DNSの変更不要・数秒でフェイルオーバー完了', 26, 318)

      // Failover arrow (horizontal, in note area)
      arrow(p5, 143, 298, 160, 298, PURPLE, 1.5)

      // Standby EC2 (right)
      p5.strokeWeight(2); p5.stroke(160, 160, 170)
      p5.fill(245, 245, 248)
      p5.rect(426, 40, 160, 140, 6)
      p5.noStroke(); p5.fill(140, 140, 150); p5.textSize(13); p5.textAlign(p5.CENTER)
      p5.text('待機 EC2', 506, 62)
      for (let i = 0; i < 3; i++) {
        p5.strokeWeight(1); p5.stroke(160, 160, 170, 80)
        p5.fill(160, 160, 170, 15); p5.rect(438, 72 + i*12, 136, 8, 2)
      }
      p5.strokeWeight(1); p5.stroke(160, 160, 170)
      p5.fill(245, 245, 248)
      p5.rect(438, 122, 136, 36, 4)
      p5.noStroke(); p5.fill(150, 150, 160); p5.textSize(12); p5.textAlign(p5.CENTER)
      p5.text('eth0 / ENI-1', 506, 144)

      // Horizontal arrow: ENI-2 → Standby
      arrow(p5, 394, 198, 420, 198, PURPLE, 2)
      // Vertical then attach to standby (show as dotted)
      p5.stroke(...PURPLE, 120); p5.strokeWeight(1.5)
      for (let dx = 0; dx < 140; dx += 10) {
        if (dx + 8 <= 140) p5.line(420+dx, 198, 420+dx+7, 198)
      }
    }

    // ── STEP 8: まとめ ───────────────────────────────────────────────
    else if (s === 8) {
      // Table
      const cols_ = [120, 250, 420, 590]  // column x positions (right edge of each)
      const headers = ['機能', '用途・特性', '主な制限', '試験ポイント']
      const rows_ = [
        { name: 'クラスター PG',   use: 'HPC・機械学習',       limit: '同一AZ必須',        tip: '低レイテンシー最優先',  col: ORANGE },
        { name: 'スプレッド PG',   use: '高可用性・HA',         limit: '最大 7台/AZ',       tip: '障害は1台のみ影響',     col: BLUE },
        { name: 'パーティション PG',use: 'Kafka・HDFS・HBase', limit: '7パーティション/AZ', tip: 'P番号でレプリカ制御',   col: GREEN },
        { name: 'ハイバネーション', use: '高速起動',             limit: 'RAM≤150GB・60日',  tip: 'EBS暗号化必須',         col: PURPLE },
        { name: 'Dedicated Host',  use: 'BYOL・コンプライアンス', limit: 'コスト最高',      tip: 'ソケット/コア数把握可', col: ORANGE },
        { name: 'ENI',             use: 'フェイルオーバー',     limit: 'AZ内移動のみ',      tip: 'IP・SG ごと移動',       col: [100,116,139] as [number,number,number] },
      ]

      const colWidths = [cols_[0]-10, cols_[1]-cols_[0]-4, cols_[2]-cols_[1]-4, cols_[3]-cols_[2]-4]
      const colStarts = [10, cols_[0]+2, cols_[1]+2, cols_[2]+2]
      const rowH = 40, headerH = 28, startY = 12

      // Header row
      p5.strokeWeight(1); p5.stroke(180, 185, 200)
      p5.fill(60, 65, 80)
      p5.rect(10, startY, W - 20, headerH, 4)
      headers.forEach((h, ci) => {
        p5.noStroke(); p5.fill(255); p5.textSize(13); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text(h, colStarts[ci] + colWidths[ci]/2, startY + headerH/2)
      })

      // Data rows
      rows_.forEach((row, ri) => {
        const ry = startY + headerH + ri * rowH
        p5.strokeWeight(1); p5.stroke(200, 205, 215)
        p5.fill(ri % 2 === 0 ? 252 : 246, ri % 2 === 0 ? 252 : 248, ri % 2 === 0 ? 254 : 252)
        p5.rect(10, ry, W - 20, rowH, 0)

        // Column separators
        cols_.slice(0,3).forEach(cx => {
          p5.stroke(220, 222, 228); p5.strokeWeight(1)
          p5.line(cx, ry, cx, ry + rowH)
        })

        const vals = [row.name, row.use, row.limit, row.tip]
        vals.forEach((val, ci) => {
          const col: [number,number,number] = ci === 0 ? row.col : DARK
          p5.noStroke(); p5.fill(...col)
          p5.textSize(ci === 0 ? 12.5 : 12); p5.textAlign(p5.LEFT, p5.CENTER)
          p5.text(val, colStarts[ci] + 6, ry + rowH/2)
        })
      })

      // Bottom outer border
      p5.strokeWeight(1); p5.stroke(180, 185, 200); p5.noFill()
      p5.rect(10, startY, W - 20, headerH + rows_.length * rowH, 4)
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
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse inline-block" />
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
              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold">✓</span>
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
                i + 1 === step ? 'bg-red-500 scale-125' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setStep(s => Math.min(TOTAL, s + 1))}
          disabled={step === TOTAL}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >{step === TOTAL ? '完了！🎉' : '次へ →'}</button>
      </div>

      {step === TOTAL && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <p className="font-bold text-red-700 mb-1">EC2上級コンテンツ完了！</p>
          <p className="text-sm text-red-600">下の練習問題で理解度を確認しましょう。</p>
        </div>
      )}
    </div>
  )
}
