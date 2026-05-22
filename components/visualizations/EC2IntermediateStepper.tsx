'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

const STEPS = [
  {
    id: 1,
    title: 'Auto Scalingとは',
    emoji: '📈',
    description: 'EC2 Auto Scalingはトラフィックに応じてEC2インスタンス数を自動増減するサービスです。コスト効率と高可用性を同時に実現します。',
    keyPoints: [
      '最小・最大・希望（Desired）インスタンス数を設定',
      'スケールアウト：負荷増加時にインスタンスを追加',
      'スケールイン：負荷低下時にインスタンスを削除',
      'ELBと組み合わせてトラフィックを均等分散',
    ],
    hint: '単一インスタンス vs ELB + Auto Scaling の違いを理解',
  },
  {
    id: 2,
    title: 'ELB + ASGの構成',
    emoji: '⚖️',
    description: 'Elastic Load Balancer（ELB）とAuto Scaling Group（ASG）を組み合わせることで、トラフィック分散と自動スケーリングを実現します。',
    keyPoints: [
      'ALB（Application LB）：HTTP/HTTPS・パスルーティング対応',
      'ASGは複数AZにまたがってインスタンスを配置',
      'ELBのヘルスチェックで異常インスタンスを自動除外',
      '新しいインスタンスはELBに自動登録される',
    ],
    hint: 'インターネット → ALB → ASG（2AZ × 2EC2）の流れを確認',
  },
  {
    id: 3,
    title: 'スケールアウト',
    emoji: '🔺',
    description: '負荷が増加してCPU使用率などが閾値を超えると、ASGが自動でインスタンスを追加します。これをスケールアウトと呼びます。',
    keyPoints: [
      'ターゲット追跡スケーリング：CPU 70%等を目標値に設定（推奨）',
      'スケールアウト後はクールダウン期間（デフォルト300秒）が発生',
      'スケールアップ（インスタンスサイズ変更）とは異なる概念',
      '起動テンプレートに従って新インスタンスを起動',
    ],
    hint: 'CPU負荷上昇 → 新インスタンス追加の流れを確認',
  },
  {
    id: 4,
    title: 'スケールイン',
    emoji: '🔻',
    description: '負荷が低下してメトリクスが閾値を下回ると、ASGがインスタンス数を削減します。最小インスタンス数を下回ることはありません。',
    keyPoints: [
      'スケールインは最小インスタンス数を下回らない',
      'クールダウン後に評価してスケールイン実行',
      '削除対象はデフォルトで「最も古い起動設定のインスタンス」',
      'Scale-in protection でインスタンスを削除から保護できる',
    ],
    hint: 'CPU負荷低下 → インスタンス削除でコスト最適化',
  },
  {
    id: 5,
    title: '起動テンプレート',
    emoji: '📋',
    description: '起動テンプレートはASGが新インスタンスを起動する際の設定定義です。AMI・インスタンスタイプ・SGなどを事前に定義しておきます。',
    keyPoints: [
      'AMI・インスタンスタイプ・キーペア・SGをテンプレート化',
      'User Dataでインスタンス起動時の初期化スクリプトを設定',
      '起動設定（Launch Configuration）は旧来の方式（非推奨）',
      'バージョン管理が可能でロールバックも容易',
    ],
    hint: 'テンプレート1つでASGが何台でも同じ構成で起動',
  },
  {
    id: 6,
    title: 'EBSボリュームタイプ',
    emoji: '💾',
    description: 'EBSには用途に応じた4種類のボリュームタイプがあります。SAA試験ではgp3とio2の違い、st1とsc1の使い分けが頻出です。',
    keyPoints: [
      'gp3（汎用SSD）：デフォルト推奨、3000 IOPS、コスト効率◎',
      'io2（高性能SSD）：最大64000 IOPS、ミッションクリティカルDB向け',
      'st1（スループット最適化HDD）：大容量シーケンシャルアクセス向け',
      'sc1（コールドHDD）：最低コスト、低頻度アクセスデータ向け',
    ],
    hint: 'SSD（gp3/io2）vs HDD（st1/sc1）の特性と用途を比較',
  },
  {
    id: 7,
    title: 'マルチAZ高可用性設計',
    emoji: '🏗️',
    description: 'ASGを複数のAZに展開することで、AZ障害が発生しても自動的にトラフィックを正常なAZに切り替えられます。',
    keyPoints: [
      'ELBとASGを組み合わせてマルチAZ構成を実現',
      'AZ障害時、ELBはヘルスチェック失敗を検知してルーティング変更',
      'ASGは正常なAZにスケールアウトして容量を補填',
      '最低2AZ（推奨3AZ）への分散配置が基本設計',
    ],
    hint: 'AZ障害時でも無停止でサービス継続できる構成',
  },
  {
    id: 8,
    title: 'まとめ',
    emoji: '🎯',
    description: 'EC2中級の全体像をおさらいします。Auto Scaling・ELB・EBSボリュームタイプはSAA試験頻出のセットです。',
    keyPoints: [
      'ASG：Min/Max/Desired設定、ターゲット追跡スケーリング推奨',
      'ELB + ASG：マルチAZ分散で高可用性・自動スケール',
      '起動テンプレート：ASGの設定定義、User Data活用',
      'EBS：gp3（推奨）/ io2（高性能DB）/ st1・sc1（HDD）',
    ],
    hint: '各コンポーネントの役割と試験ポイントを整理しましょう',
  },
]

const TOTAL = STEPS.length
const W = 660
const H = 340

const AWS_ORANGE: [number, number, number] = [255, 153, 0]
const AWS_BLUE:   [number, number, number] = [35, 100, 170]
const AWS_GREEN:  [number, number, number] = [122, 161, 22]
const AWS_PURPLE: [number, number, number] = [140, 79, 255]
const AWS_GRAY:   [number, number, number] = [100, 116, 139]

export default function EC2IntermediateStepper() {
  const [step, setStep] = useState(1)
  const stepRef  = useRef(1)
  const timerRef = useRef(0)
  const phaseRef = useRef(0)
  const waitRef  = useRef(0)

  const imgEc2      = useRef<unknown>(null)
  const imgAlb      = useRef<unknown>(null)
  const imgAsg      = useRef<unknown>(null)
  const imgEbs      = useRef<unknown>(null)
  const imgSnapshot = useRef<unknown>(null)

  useEffect(() => {
    stepRef.current  = step
    timerRef.current = 0
    phaseRef.current = 0
    waitRef.current  = 0
  }, [step])

  // ── Arrow helper ─────────────────────────────────────────────────
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

  // ── AWS-style service icon ────────────────────────────────────────
  function awsIcon(p5: any, cx: number, cy: number, sz: number,
    bg: [number,number,number], type: string, label?: string) {
    const s = sz * 0.55
    const iconSize = sz * 0.82

    if (type === 'ec2') {
      if (imgEc2.current) {
        p5.image(imgEc2.current, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize)
      } else {
        p5.fill(255)
        const bh = s*0.18, gap = s*0.14, bw = s*0.82
        for (let i = 0; i < 3; i++) {
          const by = cy - s*0.25 + i*(bh + gap)
          p5.rect(cx - bw/2, by, bw, bh, 2)
          p5.fill(bg[0], bg[1], bg[2], 200)
          p5.circle(cx + bw/2 - 5, by + bh/2, 4)
          p5.fill(255)
        }
      }
    } else if (type === 'alb') {
      if (imgAlb.current) {
        p5.image(imgAlb.current, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize)
      } else {
        p5.fill(255)
        p5.rect(cx - s*0.38, cy - s*0.08, s*0.76, s*0.16, 3)
        for (let i = -1; i <= 1; i++) {
          p5.triangle(cx + i*s*0.25, cy + s*0.28, cx + i*s*0.25 - s*0.08, cy + s*0.1, cx + i*s*0.25 + s*0.08, cy + s*0.1)
        }
        p5.triangle(cx, cy - s*0.28, cx - s*0.08, cy - s*0.1, cx + s*0.08, cy - s*0.1)
      }
    } else if (type === 'asg') {
      if (imgAsg.current) {
        p5.image(imgAsg.current, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize)
      } else {
        p5.fill(255)
        p5.triangle(cx - s*0.1, cy - s*0.32, cx - s*0.32, cy - s*0.1, cx + s*0.12, cy - s*0.1)
        p5.triangle(cx + s*0.1, cy + s*0.32, cx + s*0.32, cy + s*0.1, cx - s*0.12, cy + s*0.1)
      }
    } else if (type === 'ebs') {
      if (imgEbs.current) {
        p5.image(imgEbs.current, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize)
      } else {
        p5.fill(255)
        const cw = s*0.72, ch = s*0.52, ew = cw, eh = ch*0.28
        p5.ellipse(cx, cy - ch*0.25, ew, eh)
        p5.rect(cx - cw/2, cy - ch*0.25, cw, ch*0.72)
        p5.ellipse(cx, cy + ch*0.48, ew, eh)
        p5.fill(bg[0], bg[1], bg[2], 120)
        p5.ellipse(cx, cy - ch*0.25, ew*0.6, eh*0.6)
      }
    } else if (type === 'snapshot') {
      if (imgSnapshot.current) {
        p5.image(imgSnapshot.current, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize)
      } else {
        p5.fill(255)
        p5.rect(cx - s*0.4, cy - s*0.3, s*0.8, s*0.6, 4)
        p5.fill(bg[0], bg[1], bg[2], 150)
        p5.ellipse(cx, cy + s*0.02, s*0.32, s*0.32)
        p5.fill(255)
        p5.ellipse(cx, cy + s*0.02, s*0.16, s*0.16)
      }
    } else if (type === 'template') {
      p5.fill(255)
      p5.rect(cx - s*0.3, cy - s*0.42, s*0.6, s*0.84, 3)
      p5.fill(bg[0], bg[1], bg[2], 200)
      p5.rect(cx - s*0.16, cy - s*0.52, s*0.32, s*0.18, 3)
      p5.fill(255)
      for (let i = 0; i < 3; i++) {
        p5.rect(cx - s*0.2, cy - s*0.2 + i*s*0.22, s*0.4, s*0.1, 2)
      }
    } else if (type === 'check') {
      p5.fill(255)
      p5.textSize(sz*0.46); p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text('✓', cx, cy + 2)
    }

    if (label) {
      p5.noStroke(); p5.fill(55, 55, 55)
      p5.textSize(10); p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text(label, cx, cy + sz/2 + 11)
    }
  }

  const setup = (p5: any, ref: any) => {
    p5.createCanvas(W, H).parent(ref)
    p5.frameRate(40)
    p5.loadImage('/icons/aws/ec2.svg',                     (img: unknown) => { imgEc2.current      = img })
    p5.loadImage('/icons/aws/Application-Load-Balancer.svg',(img: unknown) => { imgAlb.current      = img })
    p5.loadImage('/icons/aws/EC2-Auto-Scaling.svg',         (img: unknown) => { imgAsg.current      = img })
    p5.loadImage('/icons/aws/Elastic-Block-Store.svg',      (img: unknown) => { imgEbs.current      = img })
    p5.loadImage('/icons/aws/Snapshot.svg',                 (img: unknown) => { imgSnapshot.current = img })
  }

  const draw = (p5: any) => {
    const s = stepRef.current
    timerRef.current++
    const t = timerRef.current
    p5.background(248, 250, 252)

    // ── STEP 1: Auto Scalingとは ────────────────────────────────────
    if (s === 1) {
      // Left: single EC2 overwhelmed
      p5.strokeWeight(1.5); p5.stroke(200, 80, 80, 160)
      p5.fill(255, 242, 242, 200)
      p5.rect(18, 44, 272, 258, 0)
      p5.noStroke(); p5.fill(180, 50, 50)
      p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text('❌ 単一インスタンス構成', 154, 66)

      awsIcon(p5, 154, 178, 64, AWS_ORANGE, 'ec2', 'EC2')

      // CPU gauge
      const cpuW = 0.7 + 0.28 * Math.abs(Math.sin(t * 0.04))
      p5.noStroke(); p5.fill(220, 220, 230); p5.rect(72, 248, 164, 14, 6)
      p5.fill(210, 50, 50); p5.rect(72, 248, 164 * cpuW, 14, 6)
      p5.fill(80, 30, 30); p5.textSize(10); p5.textAlign(p5.CENTER)
      p5.text(`CPU: ${Math.round(cpuW * 100)}%  💥 過負荷`, 154, 278)
      p5.fill(160, 50, 50); p5.textSize(10); p5.textAlign(p5.CENTER)
      p5.text('単一障害点・スケール不可', 154, 294)

      // VS
      p5.fill(100, 100, 100); p5.textSize(20); p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text('VS', W/2, H/2)

      // Right: ELB + ASG
      p5.strokeWeight(1.5); p5.stroke(30, 160, 80, 160)
      p5.fill(238, 252, 243, 200)
      p5.rect(370, 44, 272, 258, 0)
      p5.noStroke(); p5.fill(16, 130, 60)
      p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text('✅ ELB + Auto Scaling', 506, 66)

      awsIcon(p5, 506, 108, 40, AWS_BLUE, 'alb')
      p5.noStroke(); p5.fill(35, 100, 170); p5.textSize(10); p5.textAlign(p5.CENTER)
      p5.text('ALB', 506, 132)

      const rightEc2 = [[430, 202], [506, 202], [582, 202]] as [number,number][]
      rightEc2.forEach(([ex, ey]) => {
        arrow(p5, 506, 138, ex, ey - 30, [35,100,170], 1.2)
        awsIcon(p5, ex, ey, 44, AWS_ORANGE, 'ec2')
      })
      p5.noStroke(); p5.fill(16, 130, 60); p5.textSize(10); p5.textAlign(p5.CENTER)
      p5.text('自動スケール・高可用性', 506, 270)
      p5.fill(60, 130, 80); p5.textSize(10)
      p5.text('CPU: ~30% × 3台', 506, 286)

      // Legend
      p5.fill(70, 70, 70); p5.textSize(10); p5.textAlign(p5.LEFT)
      p5.noStroke(); p5.fill(...AWS_ORANGE); p5.rect(10, H-20, 14, 10, 2)
      p5.fill(70, 70, 70); p5.text('Auto Scaling Group（ASG）', 28, H-12)
    }

    // ── STEP 2: ELB + ASGの構成 ─────────────────────────────────────
    else if (s === 2) {
      // Internet
      p5.noStroke(); p5.fill(...AWS_BLUE)
      p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text('🌐 インターネット', W/2, 18)
      arrow(p5, W/2, 24, W/2, 48, AWS_BLUE, 2)

      // ALB
      awsIcon(p5, W/2, 72, 44, AWS_BLUE, 'alb')
      p5.noStroke(); p5.fill(35, 100, 170); p5.textSize(10); p5.textAlign(p5.LEFT)
      p5.text('ALB（ヘルスチェック）', W/2 + 30, 72)

      arrow(p5, W/2, 96, W/2, 116, AWS_BLUE, 2)

      // ASG boundary
      p5.strokeWeight(1.5); p5.stroke(...AWS_ORANGE, 120)
      p5.fill(255, 248, 235, 100)
      p5.rect(28, 118, 604, 190, 0)
      p5.noStroke(); p5.fill(...AWS_ORANGE); p5.textSize(10); p5.textAlign(p5.LEFT)
      awsIcon(p5, 40, 130, 30, AWS_ORANGE, 'asg')
      p5.text('Auto Scaling Group', 60, 130)

      // AZ-A
      p5.strokeWeight(1); p5.stroke(100, 100, 200, 140)
      p5.fill(242, 242, 255, 130)
      p5.rect(46, 146, 260, 150, 0)
      p5.noStroke(); p5.fill(80, 80, 180); p5.textSize(10); p5.textAlign(p5.CENTER)
      p5.text('AZ-a', 176, 163)
      awsIcon(p5, 116, 240, 50, AWS_ORANGE, 'ec2', 'EC2')
      awsIcon(p5, 236, 240, 50, AWS_ORANGE, 'ec2', 'EC2')

      // AZ-B
      p5.strokeWeight(1); p5.stroke(100, 100, 200, 140)
      p5.fill(242, 242, 255, 130)
      p5.rect(354, 146, 260, 150, 0)
      p5.noStroke(); p5.fill(80, 80, 180); p5.textSize(10); p5.textAlign(p5.CENTER)
      p5.text('AZ-b', 484, 163)
      awsIcon(p5, 424, 240, 50, AWS_ORANGE, 'ec2', 'EC2')
      awsIcon(p5, 544, 240, 50, AWS_ORANGE, 'ec2', 'EC2')

      // Dashed lines ALB → EC2s
      const ec2Targets = [[116,214],[236,214],[424,214],[544,214]]
      ec2Targets.forEach(([ex, ey]) => {
        p5.stroke(...AWS_BLUE, 50); p5.strokeWeight(1)
        p5.line(W/2, 96, ex, ey)
      })

      // Animated packet
      const idx = Math.floor(t / 36) % 4
      const pr  = (t % 36) / 36
      const [tx, ty] = ec2Targets[idx]
      const px_ = p5.lerp(W/2, tx, pr), py_ = p5.lerp(96, ty, pr)
      p5.noStroke(); p5.fill(...AWS_BLUE, 220); p5.circle(px_, py_, 10)
      p5.fill(255); p5.circle(px_, py_, 4)
    }

    // ── STEP 3: スケールアウト ──────────────────────────────────────
    else if (s === 3) {
      // Header
      p5.noStroke(); p5.fill(180, 50, 50)
      p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text('CPU負荷上昇 → スケールアウト（インスタンス追加）', W/2, 18)

      // CPU gauge (rising to 85%)
      const cpuTarget = Math.min(0.86, t * 0.86 / 130)
      const gX = 28, gY = 34, gW = 286, gH = 26
      p5.strokeWeight(1); p5.stroke(200, 200, 210)
      p5.fill(230, 230, 240); p5.rect(gX, gY, gW, gH, 6)
      const gCol: [number,number,number] = cpuTarget > 0.7 ? [215, 55, 55] : [122, 161, 22]
      p5.noStroke(); p5.fill(...gCol); p5.rect(gX, gY, gW * cpuTarget, gH, 6)
      p5.fill(255); p5.textSize(11); p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text(`CPU: ${Math.round(cpuTarget * 100)}%`, gX + gW/2, gY + gH/2)

      // 70% threshold line
      p5.stroke(215, 55, 55); p5.strokeWeight(1.5)
      const thX = gX + gW * 0.7
      p5.line(thX, gY - 4, thX, gY + gH + 4)
      p5.noStroke(); p5.fill(215, 55, 55); p5.textSize(9.5); p5.textAlign(p5.CENTER)
      p5.text('閾値 70%', thX, gY - 8)

      // ASG box
      p5.strokeWeight(1.5); p5.stroke(...AWS_ORANGE, 120)
      p5.fill(255, 248, 235, 140)
      p5.rect(28, 76, 604, 220, 0)
      p5.noStroke(); p5.fill(...AWS_ORANGE); p5.textSize(10.5); p5.textAlign(p5.LEFT)
      p5.text('Auto Scaling Group', 42, 94)
      const instanceCount = t > 185 ? 3 : 2
      const dsLabel = `Min: 1  |  Desired: ${instanceCount}  |  Max: 5`
      p5.fill(100, 80, 30); p5.textSize(10); p5.textAlign(p5.RIGHT)
      p5.text(dsLabel, 622, 94)

      const positions: [number,number][] = [[164, 196], [330, 196], [496, 196]]
      const appearing = t > 185 && t < 250
      for (let i = 0; i < Math.max(instanceCount, appearing ? 3 : 2); i++) {
        const isNew = i === 2
        const alpha = isNew ? (appearing ? Math.min(255, (t-185)*4) : 255) : 255
        if (isNew && t <= 185) continue
        if (isNew) {
          p5.strokeWeight(2); p5.stroke(16, 130, 60, alpha)
          p5.fill(215, 252, 228, alpha * 0.35)
          p5.rect(positions[i][0]-38, positions[i][1]-52, 76, 96, 8)
        }
        const col: [number,number,number] = isNew ? [16,130,60] : AWS_ORANGE
        awsIcon(p5, positions[i][0], positions[i][1], 52, col, 'ec2')
        p5.noStroke(); p5.fill(isNew ? 16 : 70, isNew ? 130 : 70, isNew ? 60 : 70)
        p5.textSize(10); p5.textAlign(p5.CENTER)
        p5.text(isNew ? '新規追加 ✨' : `EC2 #${i+1}`, positions[i][0], positions[i][1] + 40)
      }

      if (t > 130) {
        p5.noStroke(); p5.fill(180, 50, 50); p5.textSize(11); p5.textAlign(p5.LEFT)
        p5.text('🔺 スケールアウト実行！ → クールダウン 300秒', 28, H - 12)
      }
    }

    // ── STEP 4: スケールイン ────────────────────────────────────────
    else if (s === 4) {
      // Header
      p5.noStroke(); p5.fill(35, 100, 170)
      p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text('CPU負荷低下 → スケールイン（インスタンス削除）', W/2, 18)

      // CPU gauge (falling to 20%)
      const cpuVal = Math.max(0.2, 0.8 - t * 0.005)
      const gX = 28, gY = 34, gW = 286, gH = 26
      p5.strokeWeight(1); p5.stroke(200, 200, 210)
      p5.fill(230, 230, 240); p5.rect(gX, gY, gW, gH, 6)
      const gCol: [number,number,number] = cpuVal < 0.3 ? [35, 100, 170] : [122, 161, 22]
      p5.noStroke(); p5.fill(...gCol); p5.rect(gX, gY, gW * cpuVal, gH, 6)
      p5.fill(255); p5.textSize(11); p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text(`CPU: ${Math.round(cpuVal * 100)}%`, gX + gW/2, gY + gH/2)

      // 30% threshold line
      p5.stroke(35, 100, 170); p5.strokeWeight(1.5)
      const thX = gX + gW * 0.3
      p5.line(thX, gY - 4, thX, gY + gH + 4)
      p5.noStroke(); p5.fill(35, 100, 170); p5.textSize(9.5); p5.textAlign(p5.CENTER)
      p5.text('閾値 30%', thX, gY - 8)

      // ASG box
      p5.strokeWeight(1.5); p5.stroke(...AWS_ORANGE, 120)
      p5.fill(255, 248, 235, 140)
      p5.rect(28, 76, 604, 220, 0)
      p5.noStroke(); p5.fill(...AWS_ORANGE); p5.textSize(10.5); p5.textAlign(p5.LEFT)
      p5.text('Auto Scaling Group', 42, 94)
      const instanceCount2 = t > 160 ? 2 : 3
      const removing = t > 160 && t < 225
      p5.fill(100, 80, 30); p5.textSize(10); p5.textAlign(p5.RIGHT)
      p5.text(`Min: 1  |  Desired: ${instanceCount2}  |  Max: 5`, 622, 94)

      const positions2: [number,number][] = [[164, 196], [330, 196], [496, 196]]
      for (let i = 0; i < 3; i++) {
        const isRemoving = i === 2 && removing
        const isGone = i === 2 && t >= 225
        if (isGone) continue
        const alpha = isRemoving ? Math.max(0, 255 - (t-160)*4) : 255
        if (isRemoving) {
          p5.strokeWeight(2); p5.stroke(215, 55, 55, alpha)
          p5.fill(255, 215, 215, alpha * 0.3)
          p5.rect(positions2[i][0]-38, positions2[i][1]-52, 76, 96, 8)
        }
        const col: [number,number,number] = isRemoving ? [215,55,55] : AWS_ORANGE
        awsIcon(p5, positions2[i][0], positions2[i][1], 52, col, 'ec2')
        p5.noStroke()
        p5.fill(isRemoving ? 180 : 70, isRemoving ? 40 : 70, isRemoving ? 40 : 70)
        p5.textSize(10); p5.textAlign(p5.CENTER)
        p5.text(isRemoving ? '削除中…' : `EC2 #${i+1}`, positions2[i][0], positions2[i][1] + 40)
      }

      if (t > 160) {
        p5.noStroke(); p5.fill(35, 100, 170); p5.textSize(11); p5.textAlign(p5.LEFT)
        p5.text('🔻 スケールイン実行 → コスト最適化', 28, H - 12)
      }
    }

    // ── STEP 5: 起動テンプレート ────────────────────────────────────
    else if (s === 5) {
      // Template box
      p5.strokeWeight(1.5); p5.stroke(...AWS_PURPLE, 160)
      p5.fill(248, 244, 255, 230)
      p5.rect(18, 36, 224, 260, 0)

      awsIcon(p5, 130, 80, 46, AWS_PURPLE, 'template')
      p5.noStroke(); p5.fill(...AWS_PURPLE); p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text('起動テンプレート', 130, 112)

      const templateItems = [
        { label: 'AMI',      val: 'Amazon Linux 2023' },
        { label: 'タイプ',   val: 't3.medium' },
        { label: 'SG',       val: 'web-sg' },
        { label: 'Key',      val: 'my-keypair' },
        { label: 'UserData', val: '#!/bin/bash ...' },
      ]
      templateItems.forEach((item, i) => {
        p5.noStroke(); p5.fill(...AWS_PURPLE, 25); p5.rect(30, 124 + i*36, 200, 28, 4)
        p5.fill(...AWS_PURPLE); p5.textSize(10); p5.textAlign(p5.LEFT)
        p5.text(item.label + ':', 40, 141 + i*36)
        p5.fill(55, 45, 75); p5.textSize(9.5)
        p5.text(item.val, 96, 141 + i*36)
      })

      // Arrow Template → ASG
      arrow(p5, 242, 166, 302, 166, AWS_PURPLE, 2)

      // ASG box
      p5.strokeWeight(1.5); p5.stroke(...AWS_ORANGE, 150)
      p5.fill(255, 248, 235, 210)
      p5.rect(302, 92, 188, 148, 0)
      awsIcon(p5, 396, 138, 46, AWS_ORANGE, 'asg')
      p5.noStroke(); p5.fill(...AWS_ORANGE); p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text('Auto Scaling Group', 396, 170)
      p5.fill(100, 70, 20); p5.textSize(10)
      p5.text('テンプレートを参照', 396, 186)
      p5.text('して起動', 396, 200)

      // Arrow ASG → EC2s
      const ec2Pts: [number,number][] = [[556, 110], [556, 196], [556, 282]]
      const branchX = 526
      ec2Pts.forEach(([ex, ey]) => {
        p5.stroke(...AWS_ORANGE); p5.strokeWeight(1.5)
        p5.line(490, 166, branchX, 166)
        p5.line(branchX, 166, branchX, ey)
        arrow(p5, branchX, ey, ex - 30, ey, AWS_ORANGE, 1.5)
        awsIcon(p5, ex, ey, 48, AWS_ORANGE, 'ec2', 'EC2')
      })

      // Note
      p5.noStroke(); p5.fill(80, 50, 160); p5.textSize(10.5); p5.textAlign(p5.LEFT)
      p5.text('💡 テンプレート1つで同一構成のインスタンスを何台でも起動できます', 18, H - 10)
    }

    // ── STEP 6: EBSボリュームタイプ ─────────────────────────────────
    else if (s === 6) {
      const volTypes = [
        { name: 'gp3',  desc: '汎用 SSD',         iops: '3,000',   cost: '$$',   use: 'デフォルト推奨\nWebサーバー',  col: AWS_ORANGE,                             recommended: true  },
        { name: 'io2',  desc: '高性能 SSD',        iops: '64,000',  cost: '$$$$', use: 'ミッションクリティカル\nRDS / Oracle', col: [215, 55, 55] as [number,number,number], recommended: false },
        { name: 'st1',  desc: 'スループット HDD',  iops: '500MB/s', cost: '$',    use: '大容量バッチ\nログ処理',      col: AWS_BLUE,                               recommended: false },
        { name: 'sc1',  desc: 'コールド HDD',      iops: '250MB/s', cost: '$',    use: '低頻度アクセス\nアーカイブ',  col: AWS_GRAY,                               recommended: false },
      ]

      volTypes.forEach((vt, i) => {
        const cx = 82 + i * 130
        p5.strokeWeight(1); p5.stroke(vt.col[0], vt.col[1], vt.col[2], 80)
        p5.fill(vt.col[0], vt.col[1], vt.col[2], 12)
        p5.rect(cx - 58, 12, 116, 272, 0)

        if (vt.recommended) {
          p5.noStroke(); p5.fill(...vt.col)
          p5.rect(cx - 36, 12, 72, 18, 4)
          p5.fill(255); p5.textSize(9.5); p5.textAlign(p5.CENTER, p5.CENTER)
          p5.text('推奨', cx, 21)
        }

        awsIcon(p5, cx, 72, 50, vt.col, 'ebs')

        p5.noStroke(); p5.fill(...vt.col)
        p5.textSize(14); p5.textAlign(p5.CENTER)
        p5.text(vt.name, cx, 108)
        p5.fill(70, 70, 70); p5.textSize(10.5)
        p5.text(vt.desc, cx, 123)

        // IOPS badge
        p5.fill(vt.col[0], vt.col[1], vt.col[2], 28)
        p5.rect(cx - 52, 130, 104, 36, 6)
        p5.fill(...vt.col); p5.textSize(10)
        p5.text('IOPS / Throughput', cx, 145)
        p5.fill(50, 50, 50); p5.textSize(10.5)
        p5.text(vt.iops, cx, 159)

        // Cost
        p5.fill(100, 80, 40); p5.textSize(13)
        p5.text(vt.cost, cx, 187)

        // Use case
        p5.fill(70, 70, 80); p5.textSize(10)
        vt.use.split('\n').forEach((ln, j) => p5.text(ln, cx, 210 + j*16))
      })

      // Note
      p5.strokeWeight(1); p5.stroke(200, 200, 210)
      p5.fill(255, 255, 255, 220)
      p5.rect(10, H - 40, 640, 30, 6)
      p5.noStroke(); p5.fill(50, 50, 150); p5.textSize(10.5); p5.textAlign(p5.LEFT)
      p5.text('SSD（gp3 / io2）: ブートボリューム可  |  HDD（st1 / sc1）: ブートボリューム不可', 20, H - 20)
    }

    // ── STEP 7: マルチAZ高可用性設計 ───────────────────────────────
    else if (s === 7) {
      // Internet
      p5.noStroke(); p5.fill(...AWS_BLUE)
      p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text('🌐 インターネット', W/2, 18)
      arrow(p5, W/2, 24, W/2, 46, AWS_BLUE, 2)

      // ALB
      awsIcon(p5, W/2, 70, 42, AWS_BLUE, 'alb')
      p5.noStroke(); p5.fill(35, 100, 170); p5.textSize(10); p5.textAlign(p5.LEFT)
      p5.text('ALB (ヘルスチェック)', W/2 + 28, 68)

      // AZ-A (always healthy)
      p5.strokeWeight(1.5); p5.stroke(100, 100, 200, 180)
      p5.fill(240, 240, 255, 150)
      p5.rect(28, 106, 266, 210, 0)
      p5.noStroke(); p5.fill(80, 80, 180); p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text('AZ-a ✅ 正常', 161, 126)
      awsIcon(p5, 108, 222, 52, AWS_ORANGE, 'ec2', 'EC2-1')
      awsIcon(p5, 214, 222, 52, AWS_ORANGE, 'ec2', 'EC2-2')

      // AZ-B (fails after t=200)
      const azFailed = t > 200
      const azBBorder: [number,number,number] = azFailed ? [200, 60, 60] : [100, 100, 200]
      p5.strokeWeight(1.5); p5.stroke(...azBBorder, 180)
      p5.fill(azFailed ? 255 : 240, azFailed ? 234 : 240, azFailed ? 234 : 255, 150)
      p5.rect(366, 106, 266, 210, 0)
      p5.noStroke(); p5.fill(...azBBorder); p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text(azFailed ? 'AZ-b ❌ 障害発生' : 'AZ-b ✅ 正常', 499, 126)

      const azBColor: [number,number,number] = azFailed ? [180, 180, 180] : AWS_ORANGE
      awsIcon(p5, 446, 222, 52, azBColor, 'ec2', azFailed ? '応答なし' : 'EC2-3')
      awsIcon(p5, 552, 222, 52, azBColor, 'ec2', azFailed ? '応答なし' : 'EC2-4')

      if (azFailed) {
        p5.stroke(200, 60, 60); p5.strokeWeight(2.5)
        p5.line(380, 140, 620, 300); p5.line(620, 140, 380, 300)
      }

      // ALB → AZ arrows
      const albACol: [number,number,number] = azFailed ? AWS_GREEN : AWS_BLUE
      const trunkX = W / 2
      const branchY = 92
      const azEntryY = 108
      const leftX = 161
      const rightX = 499
      p5.stroke(...albACol); p5.strokeWeight(2)
      p5.line(trunkX, 93, trunkX, branchY)
      p5.line(trunkX, branchY, leftX, branchY)
      arrow(p5, leftX, branchY, leftX, azEntryY, albACol, 2)
      if (!azFailed) {
        p5.stroke(...AWS_BLUE); p5.strokeWeight(2)
        p5.line(trunkX, branchY, rightX, branchY)
        arrow(p5, rightX, branchY, rightX, azEntryY, AWS_BLUE, 2)
      } else {
        p5.stroke(200, 60, 60, 100); p5.strokeWeight(1)
        p5.line(trunkX, branchY, rightX, branchY)
        p5.line(rightX, branchY, rightX, azEntryY)
      }

      // Status note
      if (azFailed) {
        p5.noStroke(); p5.fill(16, 130, 60); p5.textSize(10.5); p5.textAlign(p5.CENTER)
        p5.text('AZ-a のみにルーティング → サービス継続！', W/2, H - 12)
      } else {
        p5.noStroke(); p5.fill(35, 100, 170); p5.textSize(10.5); p5.textAlign(p5.CENTER)
        p5.text('両AZにトラフィック分散（しばらくするとAZ-b障害が発生します）', W/2, H - 12)
      }
    }

    // ── STEP 8: まとめ ──────────────────────────────────────────────
    else if (s === 8) {
      const items = [
        { icon: 'asg',      col: AWS_ORANGE,                              label: 'Auto Scaling',   desc: 'Min/Max/Desired\nターゲット追跡推奨',         x: 110, y: 90  },
        { icon: 'alb',      col: AWS_BLUE,                                label: 'ELB（ALB）',      desc: 'HTTP分散・ヘルスチェック\nマルチAZ対応',         x: 330, y: 90  },
        { icon: 'template', col: AWS_PURPLE,                              label: '起動テンプレート', desc: 'AMI/タイプ/SG定義\nUserData設定',               x: 550, y: 90  },
        { icon: 'ebs',      col: AWS_GREEN,                               label: 'EBS',             desc: 'gp3推奨 / io2高性能\nst1・sc1はHDD',            x: 220, y: 252 },
        { icon: 'ec2',      col: [16, 130, 60] as [number,number,number], label: 'マルチAZ設計',    desc: '2AZ以上に分散配置\nAZ障害時もサービス継続',      x: 440, y: 252 },
      ]
      const iconSz = 52
      const aC: [number,number,number] = [190, 190, 205]

      // Arrows
      arrow(p5, items[0].x + 30, items[0].y, items[1].x - 30, items[1].y, aC, 1.5)
      arrow(p5, items[1].x + 30, items[1].y, items[2].x - 30, items[2].y, aC, 1.5)
      arrow(p5, items[0].x + 18, items[0].y + 30, items[3].x - 18, items[3].y - 30, aC, 1.5)
      arrow(p5, items[2].x - 18, items[2].y + 30, items[4].x + 18, items[4].y - 30, aC, 1.5)

      items.forEach(it => {
        awsIcon(p5, it.x, it.y - 16, iconSz, it.col, it.icon)
        p5.noStroke(); p5.fill(...it.col)
        p5.textSize(11); p5.textAlign(p5.CENTER)
        p5.text(it.label, it.x, it.y + 24)
        p5.fill(70, 70, 70); p5.textSize(10)
        it.desc.split('\n').forEach((ln, j) => p5.text(ln, it.x, it.y + 40 + j*14))
      })
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
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse inline-block" />
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
          <p className="font-bold text-green-700 mb-1">EC2中級コンテンツ完了！</p>
          <p className="text-sm text-green-600">下の練習問題で理解度を確認しましょう。</p>
        </div>
      )}
    </div>
  )
}
