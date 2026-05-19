'use client'

import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

export default function RDSDiagram() {
  let timer = 0
  const W = 680
  const H = 360

  interface Packet { x: number; y: number; tx: number; ty: number; progress: number; color: [number,number,number]; label: string; active: boolean }
  let packets: Packet[] = []
  let failover = false
  let failoverTimer = 0

  function spawnPacket(from: {x:number,y:number}, to: {x:number,y:number}, col: [number,number,number], lbl: string) {
    packets.push({ x: from.x, y: from.y, tx: to.x, ty: to.y, progress: 0, color: col, label: lbl, active: true })
  }

  const PRIMARY = { x: 200, y: 170 }
  const STANDBY = { x: 200, y: 290 }
  const READ1 = { x: 450, y: 130 }
  const READ2 = { x: 450, y: 230 }
  const APP = { x: 60, y: 200 }

  const setup = (p5: any, ref: any) => {
    p5.createCanvas(W, H).parent(ref)
    p5.frameRate(40)
  }

  const draw = (p5: any) => {
    p5.background(248, 250, 252)
    timer++

    if (!failover) {
      if (timer % 60 === 0) spawnPacket(APP, PRIMARY, [37, 99, 235], 'Write')
      if (timer % 50 === 0) spawnPacket(PRIMARY, STANDBY, [99, 102, 241], 'Sync')
      if (timer % 45 === 10) spawnPacket(PRIMARY, READ1, [16, 185, 129], 'Replicate')
      if (timer % 45 === 25) spawnPacket(PRIMARY, READ2, [16, 185, 129], 'Replicate')
    }

    // Trigger failover
    if (timer === 180) failover = true
    if (failover) {
      failoverTimer++
      if (failoverTimer > 60) { failover = false; failoverTimer = 0; timer = 0 }
    }

    // Title
    p5.noStroke()
    p5.fill(30, 30, 30)
    p5.textSize(12)
    p5.textAlign(p5.CENTER)
    p5.text('RDS Multi-AZ とリードレプリカ', W / 2, 22)

    // AZ boxes
    p5.strokeWeight(1)
    p5.stroke(200, 200, 220)
    p5.fill(245, 247, 255, 120)
    p5.rect(140, 55, 130, 170, 8)
    p5.noStroke()
    p5.fill(120, 120, 180)
    p5.textSize(9)
    p5.textAlign(p5.CENTER)
    p5.text('AZ-a', 205, 70)

    p5.strokeWeight(1)
    p5.stroke(200, 200, 220)
    p5.fill(245, 247, 255, 120)
    p5.rect(140, 250, 130, 80, 8)
    p5.noStroke()
    p5.fill(120, 120, 180)
    p5.textSize(9)
    p5.textAlign(p5.CENTER)
    p5.text('AZ-b', 205, 265)

    p5.strokeWeight(1)
    p5.stroke(200, 220, 200)
    p5.fill(240, 255, 240, 120)
    p5.rect(380, 60, 200, 240, 8)
    p5.noStroke()
    p5.fill(80, 150, 80)
    p5.textSize(9)
    p5.textAlign(p5.CENTER)
    p5.text('リードレプリカ (AZ-c)', 480, 76)

    // Primary DB
    const primaryColor: [number,number,number] = failover ? [239, 68, 68] : [37, 99, 235]
    drawDB(p5, PRIMARY.x, PRIMARY.y, failover ? '❌ Primary\n(障害)' : '✅ Primary\n(Read/Write)', primaryColor)

    // Standby DB
    const standbyColor: [number,number,number] = failover ? [245, 158, 11] : [99, 102, 241]
    drawDB(p5, STANDBY.x, STANDBY.y, failover ? '⚡ Standby\n(昇格中)' : '💤 Standby\n(Multi-AZ)', standbyColor)

    // Read replicas
    drawDB(p5, READ1.x, READ1.y, '📖 Read\nReplica 1', [16, 185, 129])
    drawDB(p5, READ2.x, READ2.y, '📖 Read\nReplica 2', [16, 185, 129])

    // App
    p5.strokeWeight(1.5)
    p5.stroke(80, 80, 80)
    p5.fill(240, 240, 240)
    p5.rect(APP.x - 30, APP.y - 22, 60, 44, 6)
    p5.noStroke()
    p5.fill(60, 60, 60)
    p5.textSize(9)
    p5.textAlign(p5.CENTER)
    p5.text('💻 App', APP.x, APP.y - 5)
    p5.text('Server', APP.x, APP.y + 8)

    // Lines
    p5.stroke(200, 200, 220)
    p5.strokeWeight(1)
    p5.line(PRIMARY.x, PRIMARY.y + 22, STANDBY.x, STANDBY.y - 22)
    p5.line(PRIMARY.x + 36, PRIMARY.y, READ1.x - 36, READ1.y)
    p5.line(PRIMARY.x + 36, PRIMARY.y, READ2.x - 36, READ2.y)

    // Failover arrow
    if (failover) {
      p5.stroke(245, 158, 11)
      p5.strokeWeight(2)
      drawArrow(p5, APP.x + 30, APP.y, STANDBY.x - 36, STANDBY.y)
    } else {
      p5.stroke(37, 99, 235)
      p5.strokeWeight(1.5)
      p5.line(APP.x + 30, APP.y, PRIMARY.x - 36, PRIMARY.y)
    }

    // Packets
    packets = packets.filter((pk) => pk.active)
    for (const pk of packets) {
      pk.progress += 0.028
      if (pk.progress >= 1) { pk.active = false; continue }
      const bx = p5.lerp(pk.x, pk.tx, pk.progress)
      const by = p5.lerp(pk.y, pk.ty, pk.progress)
      p5.noStroke()
      p5.fill(...pk.color)
      p5.circle(bx, by, 9)
    }

    // Status
    let msg = ''
    if (failover && failoverTimer < 30) msg = '⚠️  プライマリDB障害発生 → 自動フェイルオーバー中...'
    else if (failover) msg = '✅  スタンバイDBがプライマリに昇格。DNSが自動切り替え完了'
    if (msg) {
      p5.noStroke()
      p5.fill(30, 30, 30)
      p5.textSize(11)
      p5.textAlign(p5.CENTER)
      p5.text(msg, W / 2, H - 15)
    }

    // Sync label
    if (!failover) {
      p5.noStroke()
      p5.fill(99, 102, 241)
      p5.textSize(8)
      p5.textAlign(p5.CENTER)
      p5.text('同期レプリケーション', PRIMARY.x + 60, 235)
      p5.fill(16, 185, 129)
      p5.text('非同期レプリケーション', 340, 160)
    }
  }

  function drawDB(p5: any, cx: number, cy: number, label: string, col: [number,number,number]) {
    p5.strokeWeight(2)
    p5.stroke(...col)
    p5.fill(col[0], col[1], col[2], 40)
    p5.ellipse(cx, cy - 14, 68, 18)
    p5.noStroke()
    p5.fill(col[0], col[1], col[2], 40)
    p5.rect(cx - 34, cy - 14, 68, 28)
    p5.strokeWeight(2)
    p5.stroke(...col)
    p5.noFill()
    p5.ellipse(cx, cy + 14, 68, 18)
    p5.line(cx - 34, cy - 14, cx - 34, cy + 14)
    p5.line(cx + 34, cy - 14, cx + 34, cy + 14)
    p5.noStroke()
    p5.fill(...col)
    p5.textSize(8)
    p5.textAlign(p5.CENTER)
    label.split('\n').forEach((line, i) => p5.text(line, cx, cy - 5 + i * 12))
  }

  function drawArrow(p5: any, x1: number, y1: number, x2: number, y2: number) {
    p5.line(x1, y1, x2 + 6, y2)
    p5.fill(245, 158, 11)
    p5.noStroke()
    p5.triangle(x2, y2, x2 + 10, y2 - 4, x2 + 10, y2 + 4)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-50">
      <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-gray-600 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
        RDS Multi-AZ フェイルオーバーアニメーション
      </div>
      <Sketch setup={setup} draw={draw} />
    </div>
  )
}
