'use client'

import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

export default function IAMDiagram() {
  let timer = 0
  const W = 680
  const H = 360

  interface Beam { x: number; y: number; tx: number; ty: number; progress: number; allowed: boolean; active: boolean }
  let beams: Beam[] = []

  function spawnBeam(from: {x:number,y:number}, to: {x:number,y:number}, allowed: boolean) {
    beams.push({ x: from.x, y: from.y, tx: to.x, ty: to.y, progress: 0, allowed, active: true })
  }

  const USERS = [
    { x: 80, y: 120, label: 'Alice\n(Admin)' },
    { x: 80, y: 220, label: 'Bob\n(Developer)' },
    { x: 80, y: 310, label: 'Carol\n(Read-only)' },
  ]

  const RESOURCES = [
    { x: 560, y: 120, label: 'S3 Bucket', icon: '🪣' },
    { x: 560, y: 220, label: 'EC2', icon: '💻' },
    { x: 560, y: 310, label: 'RDS', icon: '🗄️' },
  ]

  const POLICY_BOX = { x: W / 2 - 60, y: 60, w: 120, h: 260 }

  const setup = (p5: any, ref: any) => {
    p5.createCanvas(W, H).parent(ref)
    p5.frameRate(40)
  }

  const draw = (p5: any) => {
    p5.background(248, 250, 252)
    timer++

    if (timer % 60 === 0) spawnBeam(USERS[0], RESOURCES[0], true)
    if (timer % 60 === 10) spawnBeam(USERS[0], RESOURCES[1], true)
    if (timer % 60 === 20) spawnBeam(USERS[0], RESOURCES[2], true)
    if (timer % 90 === 30) spawnBeam(USERS[1], RESOURCES[1], true)
    if (timer % 90 === 40) spawnBeam(USERS[1], RESOURCES[2], false) // Bob can't access RDS
    if (timer % 120 === 50) spawnBeam(USERS[2], RESOURCES[0], true) // Read S3 ok
    if (timer % 120 === 60) spawnBeam(USERS[2], RESOURCES[1], false) // Carol can't EC2

    // Title
    p5.noStroke()
    p5.fill(30, 30, 30)
    p5.textSize(12)
    p5.textAlign(p5.CENTER)
    p5.text('IAM ポリシーによるアクセス制御', W / 2, 22)

    // Policy center box
    p5.strokeWeight(1.5)
    p5.stroke(239, 68, 68)
    p5.fill(254, 242, 242)
    p5.rect(POLICY_BOX.x, POLICY_BOX.y, POLICY_BOX.w, POLICY_BOX.h, 10)
    p5.noStroke()
    p5.fill(239, 68, 68)
    p5.textSize(10)
    p5.textAlign(p5.CENTER)
    p5.text('🔐 IAMポリシー', W / 2, POLICY_BOX.y + 16)
    p5.textSize(8)
    p5.fill(150, 50, 50)
    const policies = ['Allow: S3:*', 'Allow: EC2:*', 'Allow: RDS:*', '↑ Admin', '', 'Allow: EC2:*', '↑ Developer', '', 'Allow: S3:Get*', '↑ ReadOnly']
    policies.forEach((line, i) => p5.text(line, W / 2, POLICY_BOX.y + 34 + i * 19))

    // Users
    USERS.forEach((u) => {
      p5.strokeWeight(1.5)
      p5.stroke(99, 102, 241)
      p5.fill(238, 242, 255)
      p5.rect(u.x - 36, u.y - 22, 72, 44, 8)
      p5.noStroke()
      p5.fill(99, 102, 241)
      p5.textSize(9)
      p5.textAlign(p5.CENTER)
      u.label.split('\n').forEach((line, i) => p5.text(line, u.x, u.y - 5 + i * 14))
    })

    // Resources
    RESOURCES.forEach((r) => {
      p5.strokeWeight(1.5)
      p5.stroke(16, 185, 129)
      p5.fill(209, 250, 229)
      p5.rect(r.x - 36, r.y - 22, 72, 44, 8)
      p5.noStroke()
      p5.fill(16, 185, 129)
      p5.textSize(9)
      p5.textAlign(p5.CENTER)
      p5.text(r.icon, r.x, r.y - 7)
      p5.text(r.label, r.x, r.y + 8)
    })

    // Beams
    beams = beams.filter((b) => b.active)
    for (const b of beams) {
      b.progress += 0.025
      if (b.progress >= 1) { b.active = false; continue }
      const bx = p5.lerp(b.x, b.tx, b.progress)
      const by = p5.lerp(b.y, b.ty, b.progress)
      if (b.allowed) {
        p5.noStroke()
        p5.fill(16, 185, 129)
        p5.circle(bx, by, 10)
        p5.fill(255)
        p5.textSize(7)
        p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('✓', bx, by)
      } else {
        p5.noStroke()
        p5.fill(239, 68, 68)
        p5.circle(bx, by, 10)
        p5.fill(255)
        p5.textSize(7)
        p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('✕', bx, by)
      }
    }

    // Legend
    p5.noStroke()
    p5.fill(16, 185, 129)
    p5.circle(20, H - 16, 9)
    p5.fill(80, 80, 80)
    p5.textSize(9)
    p5.textAlign(p5.LEFT)
    p5.text('許可(Allow)', 28, H - 12)
    p5.fill(239, 68, 68)
    p5.circle(110, H - 16, 9)
    p5.fill(80, 80, 80)
    p5.text('拒否(Deny)', 118, H - 12)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-50">
      <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-gray-600 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
        IAM アクセス制御アニメーション
      </div>
      <Sketch setup={setup} draw={draw} />
    </div>
  )
}
