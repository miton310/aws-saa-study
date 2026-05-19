'use client'

import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

export default function CloudFrontDiagram() {
  let timer = 0
  const W = 680
  const H = 360

  interface Packet { x: number; y: number; tx: number; ty: number; progress: number; color: [number,number,number]; label: string; active: boolean; returnPk?: boolean }
  let packets: Packet[] = []

  const ORIGIN = { x: 580, y: 180 }
  const EDGES = [
    { x: 280, y: 90, label: 'エッジ\n東京', cached: true },
    { x: 280, y: 180, label: 'エッジ\nシンガポール', cached: false },
    { x: 280, y: 270, label: 'エッジ\nロンドン', cached: true },
  ]
  const USERS = [
    { x: 60, y: 90, label: '👤 東京ユーザー' },
    { x: 60, y: 180, label: '👤 シンガポールユーザー' },
    { x: 60, y: 270, label: '👤 ロンドンユーザー' },
  ]

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

    // Cache hit: user → edge (fast, green)
    if (timer % 80 === 0) {
      spawnPacket(USERS[0], EDGES[0], [59, 130, 246], 'Request')
      setTimeout(() => spawnPacket(EDGES[0], USERS[0], [16, 185, 129], 'Cache HIT!'), 700)
    }
    // Cache miss: user → edge → origin (slow, orange)
    if (timer % 100 === 30) {
      spawnPacket(USERS[1], EDGES[1], [59, 130, 246], 'Request')
      setTimeout(() => spawnPacket(EDGES[1], ORIGIN, [245, 158, 11], 'Cache MISS'), 700)
      setTimeout(() => {
        spawnPacket(ORIGIN, EDGES[1], [239, 68, 68], 'Response')
        EDGES[1].cached = true
      }, 1400)
      setTimeout(() => spawnPacket(EDGES[1], USERS[1], [16, 185, 129], 'Cached!'), 2100)
    }
    // Cache hit again: user → edge
    if (timer % 80 === 50) {
      spawnPacket(USERS[2], EDGES[2], [59, 130, 246], 'Request')
      setTimeout(() => spawnPacket(EDGES[2], USERS[2], [16, 185, 129], 'Cache HIT!'), 700)
    }

    // Title
    p5.noStroke()
    p5.fill(30, 30, 30)
    p5.textSize(12)
    p5.textAlign(p5.CENTER)
    p5.text('CloudFront CDN キャッシュ動作', W / 2, 22)

    // Origin
    p5.strokeWeight(2)
    p5.stroke(99, 102, 241)
    p5.fill(238, 242, 255)
    p5.rect(ORIGIN.x - 44, ORIGIN.y - 36, 88, 72, 10)
    p5.noStroke()
    p5.fill(99, 102, 241)
    p5.textSize(10)
    p5.textAlign(p5.CENTER)
    p5.text('🪣 S3 Origin', ORIGIN.x, ORIGIN.y - 12)
    p5.textSize(8)
    p5.fill(80, 80, 180)
    p5.text('(オリジンサーバー)', ORIGIN.x, ORIGIN.y + 4)
    p5.text('東京リージョン', ORIGIN.x, ORIGIN.y + 16)

    // Edge locations
    EDGES.forEach((edge) => {
      const col: [number,number,number] = edge.cached ? [16, 185, 129] : [245, 158, 11]
      p5.strokeWeight(1.5)
      p5.stroke(...col)
      p5.fill(col[0], col[1], col[2], 40)
      p5.rect(edge.x - 38, edge.y - 28, 76, 56, 8)
      p5.noStroke()
      p5.fill(...col)
      p5.textSize(8)
      p5.textAlign(p5.CENTER)
      edge.label.split('\n').forEach((line, i) => p5.text(line, edge.x, edge.y - 10 + i * 14))
      p5.textSize(7)
      p5.text(edge.cached ? '✅ キャッシュあり' : '❌ キャッシュなし', edge.x, edge.y + 22)

      // Line to origin
      p5.stroke(200, 200, 220)
      p5.strokeWeight(1)
      p5.line(edge.x + 38, edge.y, ORIGIN.x - 44, ORIGIN.y)
    })

    // Users
    USERS.forEach((user, i) => {
      p5.noStroke()
      p5.fill(80, 80, 80)
      p5.textSize(9)
      p5.textAlign(p5.CENTER)
      p5.text(user.label, user.x, user.y)

      // Line to edge
      p5.stroke(180, 180, 200)
      p5.strokeWeight(1)
      p5.line(user.x + 16, user.y, EDGES[i].x - 38, EDGES[i].y)
    })

    // Packets
    packets = packets.filter((pk) => pk.active)
    for (const pk of packets) {
      pk.progress += 0.028
      if (pk.progress >= 1) { pk.active = false; continue }
      const bx = p5.lerp(pk.x, pk.tx, pk.progress)
      const by = p5.lerp(pk.y, pk.ty, pk.progress)
      p5.noStroke()
      p5.fill(...pk.color)
      p5.circle(bx, by, 10)
      p5.fill(255)
      p5.textSize(7)
      p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text(pk.label.slice(0, 5), bx, by - 12)
    }

    // Legend
    p5.noStroke()
    p5.fill(16, 185, 129)
    p5.circle(14, H - 24, 8)
    p5.fill(80, 80, 80)
    p5.textSize(9)
    p5.textAlign(p5.LEFT)
    p5.text('キャッシュHIT (高速)', 22, H - 20)

    p5.fill(245, 158, 11)
    p5.circle(14, H - 10, 8)
    p5.fill(80, 80, 80)
    p5.text('キャッシュMISS (オリジンへ)', 22, H - 6)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-50">
      <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-gray-600 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
        CloudFront CDNキャッシュアニメーション
      </div>
      <Sketch setup={setup} draw={draw} />
    </div>
  )
}
