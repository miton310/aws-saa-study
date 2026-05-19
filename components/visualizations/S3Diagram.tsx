'use client'

import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

export default function S3Diagram() {
  let timer = 0
  const W = 680
  const H = 360

  interface Packet { x: number; y: number; tx: number; ty: number; progress: number; color: [number,number,number]; label: string; active: boolean }
  let packets: Packet[] = []

  const BUCKET1 = { x: 200, y: 180, label: 'Standard', color: [16, 185, 129] as [number,number,number], size: 60 }
  const BUCKET2 = { x: 380, y: 180, label: 'Standard-IA', color: [245, 158, 11] as [number,number,number], size: 60 }
  const BUCKET3 = { x: 560, y: 180, label: 'Glacier', color: [99, 102, 241] as [number,number,number], size: 60 }
  const USER = { x: 60, y: 120 }
  const DEV = { x: 60, y: 240 }

  function spawnPacket(from: {x:number,y:number}, to: {x:number,y:number}, col: [number,number,number], lbl: string) {
    packets.push({ x: from.x, y: from.y, tx: to.x, ty: to.y, progress: 0, color: col, label: lbl, active: true })
  }

  const setup = (p5: any, ref: any) => {
    p5.createCanvas(W, H).parent(ref)
    p5.frameRate(40)
  }

  const draw = (p5: any) => {
    p5.background(248, 250, 252)
    timer++

    // Spawn upload/download animations
    if (timer % 80 === 0) spawnPacket(USER, BUCKET1, [16, 185, 129], 'PUT')
    if (timer % 80 === 20) spawnPacket(BUCKET1, USER, [59, 130, 246], 'GET')
    if (timer % 120 === 40) spawnPacket(DEV, BUCKET2, [245, 158, 11], 'PUT')
    if (timer % 160 === 60) spawnPacket(BUCKET2, BUCKET3, [99, 102, 241], 'ライフサイクル')

    // Title
    p5.noStroke()
    p5.fill(30, 30, 30)
    p5.textSize(12)
    p5.textAlign(p5.CENTER)
    p5.text('S3 ストレージクラスとライフサイクル管理', W / 2, 22)

    // Lifecycle arrow
    p5.stroke(180, 180, 200)
    p5.strokeWeight(1.5)
    p5.fill(240, 240, 255, 120)
    p5.rect(140, 90, 480, 30, 6)
    drawArrow(p5, 155, 105, 590, 105, [150, 150, 200])
    p5.noStroke()
    p5.fill(100, 100, 150)
    p5.textSize(9)
    p5.textAlign(p5.CENTER)
    p5.text('ライフサイクルポリシーによる自動移行（時間経過）', W / 2, 109)

    // Buckets
    drawBucket(p5, BUCKET1)
    drawBucket(p5, BUCKET2)
    drawBucket(p5, BUCKET3)

    // Users
    p5.noStroke()
    p5.fill(80, 80, 80)
    p5.textSize(11)
    p5.textAlign(p5.CENTER)
    p5.text('👤 ユーザー', USER.x, USER.y)
    p5.text('👨‍💻 開発者', DEV.x, DEV.y)

    // Storage cost labels
    const costs = [
      { x: BUCKET1.x, label: '💰💰💰\n高コスト', sub: '即座にアクセス可' },
      { x: BUCKET2.x, label: '💰💰\n中コスト', sub: '数ms〜数秒' },
      { x: BUCKET3.x, label: '💰\n低コスト', sub: '分〜時間' },
    ]
    costs.forEach(({ x, label, sub }) => {
      p5.noStroke()
      p5.fill(80, 80, 80)
      p5.textSize(9)
      p5.textAlign(p5.CENTER)
      label.split('\n').forEach((line, i) => p5.text(line, x, 260 + i * 12))
      p5.fill(120, 120, 120)
      p5.text(sub, x, 286)
    })

    // Packets
    packets = packets.filter((pk) => pk.active)
    for (const pk of packets) {
      pk.progress += 0.022
      if (pk.progress >= 1) { pk.active = false; continue }
      const px = p5.lerp(pk.x, pk.tx, pk.progress)
      const py = p5.lerp(pk.y, pk.ty, pk.progress)
      p5.noStroke()
      p5.fill(...pk.color)
      p5.circle(px, py, 10)
      p5.fill(255)
      p5.textSize(7)
      p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text(pk.label, px, py - 11)
    }
  }

  function drawBucket(p5: any, b: typeof BUCKET1) {
    // Bucket shape (cylinder-like)
    p5.strokeWeight(2)
    p5.stroke(...b.color)
    p5.fill(b.color[0], b.color[1], b.color[2], 30)
    p5.rect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size, 8)
    p5.fill(b.color[0], b.color[1], b.color[2], 60)
    p5.rect(b.x - b.size / 2, b.y - b.size / 2, b.size, 14, 4)
    p5.noStroke()
    p5.fill(...b.color)
    p5.textSize(9)
    p5.textAlign(p5.CENTER)
    p5.text('🪣 S3', b.x, b.y)
    p5.textSize(8)
    p5.text(b.label, b.x, b.y + 14)
  }

  function drawArrow(p5: any, x1: number, y1: number, x2: number, y2: number, col: [number,number,number]) {
    p5.stroke(...col)
    p5.strokeWeight(1.5)
    p5.line(x1, y1, x2 - 8, y2)
    p5.fill(...col)
    p5.noStroke()
    p5.triangle(x2, y2, x2 - 10, y2 - 4, x2 - 10, y2 + 4)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-50">
      <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-gray-600 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
        S3 ストレージクラス図（アニメーション）
      </div>
      <Sketch setup={setup} draw={draw} />
    </div>
  )
}
