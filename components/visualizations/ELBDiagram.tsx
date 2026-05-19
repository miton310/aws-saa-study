'use client'

import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

export default function ELBDiagram() {
  let timer = 0
  const W = 680
  const H = 360

  interface Packet { x: number; y: number; tx: number; ty: number; progress: number; color: [number,number,number]; label: string; active: boolean }
  let packets: Packet[] = []

  const ALB = { x: 220, y: 180 }
  const SERVERS = [
    { x: 450, y: 100, label: '/api\n(EC2 #1)' },
    { x: 450, y: 200, label: '/api\n(EC2 #2)' },
    { x: 450, y: 300, label: '/web\n(EC2 #3)' },
  ]
  const USER = { x: 60, y: 180 }
  let reqCount = [0, 0, 0]
  let nextServer = 0

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

    if (timer % 50 === 0) {
      spawnPacket(USER, ALB, [59, 130, 246], 'GET /api')
      const target = nextServer % 2 // round-robin between 0,1
      setTimeout(() => {
        spawnPacket(ALB, SERVERS[target], [16, 185, 129], `→ EC2#${target + 1}`)
        reqCount[target]++
        nextServer++
      }, 500)
    }
    if (timer % 70 === 30) {
      spawnPacket(USER, ALB, [245, 158, 11], 'GET /web')
      setTimeout(() => {
        spawnPacket(ALB, SERVERS[2], [245, 158, 11], '→ EC2#3')
        reqCount[2]++
      }, 500)
    }

    // Title
    p5.noStroke()
    p5.fill(30, 30, 30)
    p5.textSize(12)
    p5.textAlign(p5.CENTER)
    p5.text('ALB パスベースルーティング & ラウンドロビン', W / 2, 22)

    // ALB box
    p5.strokeWeight(2)
    p5.stroke(99, 102, 241)
    p5.fill(238, 242, 255)
    p5.rect(ALB.x - 44, ALB.y - 36, 88, 72, 10)
    p5.noStroke()
    p5.fill(99, 102, 241)
    p5.textSize(11)
    p5.textAlign(p5.CENTER)
    p5.text('⚖️ ALB', ALB.x, ALB.y - 16)
    p5.textSize(8)
    p5.fill(80, 80, 180)
    p5.text('Listener Rules:', ALB.x, ALB.y)
    p5.text('/api → API TG', ALB.x, ALB.y + 12)
    p5.text('/web → Web TG', ALB.x, ALB.y + 24)

    // Target group boundaries
    p5.strokeWeight(1)
    p5.stroke(59, 130, 246, 100)
    p5.fill(219, 234, 254, 60)
    p5.rect(350, 60, 240, 160, 8)
    p5.noStroke()
    p5.fill(59, 130, 246)
    p5.textSize(8)
    p5.textAlign(p5.CENTER)
    p5.text('API Target Group', 470, 76)

    p5.strokeWeight(1)
    p5.stroke(245, 158, 11, 100)
    p5.fill(254, 243, 199, 60)
    p5.rect(350, 250, 240, 80, 8)
    p5.noStroke()
    p5.fill(245, 158, 11)
    p5.textSize(8)
    p5.textAlign(p5.CENTER)
    p5.text('Web Target Group', 470, 266)

    // Servers
    SERVERS.forEach((srv, i) => {
      const healthy = reqCount[i] < 20
      const col: [number,number,number] = healthy ? [16, 185, 129] : [239, 68, 68]
      p5.strokeWeight(1.5)
      p5.stroke(...col)
      p5.fill(col[0], col[1], col[2], 40)
      p5.rect(srv.x - 38, srv.y - 28, 76, 56, 8)
      p5.noStroke()
      p5.fill(...col)
      p5.textSize(9)
      p5.textAlign(p5.CENTER)
      srv.label.split('\n').forEach((line, j) => p5.text(line, srv.x, srv.y - 10 + j * 14))
      // Request counter
      p5.fill(100, 100, 100)
      p5.textSize(8)
      p5.text(`${reqCount[i]} req`, srv.x, srv.y + 22)
    })

    // User
    p5.noStroke()
    p5.fill(80, 80, 80)
    p5.textSize(11)
    p5.textAlign(p5.CENTER)
    p5.text('🌍 ユーザー', USER.x, USER.y)

    // Connection lines
    p5.stroke(180, 180, 200)
    p5.strokeWeight(1)
    p5.line(USER.x + 16, USER.y, ALB.x - 44, ALB.y)
    SERVERS.forEach((srv) => p5.line(ALB.x + 44, ALB.y, srv.x - 38, srv.y))

    // Packets
    packets = packets.filter((pk) => pk.active)
    for (const pk of packets) {
      pk.progress += 0.03
      if (pk.progress >= 1) { pk.active = false; continue }
      const bx = p5.lerp(pk.x, pk.tx, pk.progress)
      const by = p5.lerp(pk.y, pk.ty, pk.progress)
      p5.noStroke()
      p5.fill(...pk.color)
      p5.circle(bx, by, 10)
    }

    // Legend
    p5.noStroke()
    p5.fill(59, 130, 246)
    p5.circle(14, H - 16, 8)
    p5.fill(80, 80, 80)
    p5.textSize(9)
    p5.textAlign(p5.LEFT)
    p5.text('/api リクエスト', 22, H - 12)
    p5.fill(245, 158, 11)
    p5.circle(130, H - 16, 8)
    p5.fill(80, 80, 80)
    p5.text('/web リクエスト', 138, H - 12)
    p5.fill(16, 185, 129)
    p5.circle(240, H - 16, 8)
    p5.fill(80, 80, 80)
    p5.text('転送完了', 248, H - 12)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-50">
      <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-gray-600 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
        ELB/ALB 負荷分散アニメーション
      </div>
      <Sketch setup={setup} draw={draw} />
    </div>
  )
}
