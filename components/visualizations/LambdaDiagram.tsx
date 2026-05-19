'use client'

import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

export default function LambdaDiagram() {
  let timer = 0
  const W = 680
  const H = 360

  interface Packet { x: number; y: number; tx: number; ty: number; progress: number; color: [number,number,number]; label: string; active: boolean }
  let packets: Packet[] = []

  function spawnPacket(from: {x:number,y:number}, to: {x:number,y:number}, col: [number,number,number], lbl: string) {
    packets.push({ x: from.x, y: from.y, tx: to.x, ty: to.y, progress: 0, color: col, label: lbl, active: true })
  }

  const SOURCES = [
    { x: 80, y: 100, icon: '🌐', label: 'API Gateway' },
    { x: 80, y: 200, icon: '🪣', label: 'S3 Event' },
    { x: 80, y: 300, icon: '⏱️', label: 'EventBridge\n(Schedule)' },
  ]

  const LAMBDA = { x: 340, y: 200 }

  const TARGETS = [
    { x: 580, y: 100, icon: '🗄️', label: 'DynamoDB' },
    { x: 580, y: 200, icon: '📧', label: 'SES (Email)' },
    { x: 580, y: 300, icon: '📨', label: 'SQS' },
  ]

  let lambdaScale = 1
  let lambdaFlash = 0

  const setup = (p5: any, ref: any) => {
    p5.createCanvas(W, H).parent(ref)
    p5.frameRate(40)
  }

  const draw = (p5: any) => {
    p5.background(248, 250, 252)
    timer++

    if (timer % 60 === 0) {
      spawnPacket(SOURCES[0], LAMBDA, [59, 130, 246], 'HTTP')
      lambdaFlash = 8
    }
    if (timer % 60 === 15) spawnPacket(LAMBDA, TARGETS[0], [16, 185, 129], 'Write')
    if (timer % 80 === 20) {
      spawnPacket(SOURCES[1], LAMBDA, [245, 158, 11], 'Event')
      lambdaFlash = 8
    }
    if (timer % 80 === 35) spawnPacket(LAMBDA, TARGETS[1], [239, 68, 68], 'Email')
    if (timer % 120 === 60) {
      spawnPacket(SOURCES[2], LAMBDA, [99, 102, 241], 'Trigger')
      lambdaFlash = 8
    }
    if (timer % 120 === 75) spawnPacket(LAMBDA, TARGETS[2], [99, 102, 241], 'Enqueue')

    if (lambdaFlash > 0) lambdaFlash--

    // Title
    p5.noStroke()
    p5.fill(30, 30, 30)
    p5.textSize(12)
    p5.textAlign(p5.CENTER)
    p5.text('Lambda イベント駆動型アーキテクチャ', W / 2, 22)

    // Event sources
    SOURCES.forEach((src) => drawBox(p5, src.x, src.y, src.icon, src.label, [99, 102, 241], [238, 242, 255]))

    // Lambda center
    const lc = lambdaFlash > 0 ? [245, 158, 11] : [251, 191, 36]
    p5.strokeWeight(2.5)
    p5.stroke(245, 158, 11)
    p5.fill(...lc, lambdaFlash > 0 ? 220 : 180)
    p5.ellipse(LAMBDA.x, LAMBDA.y, 90, 80)
    p5.noStroke()
    p5.fill(120, 80, 0)
    p5.textSize(20)
    p5.textAlign(p5.CENTER, p5.CENTER)
    p5.text('⚡', LAMBDA.x, LAMBDA.y - 10)
    p5.textSize(10)
    p5.fill(80, 60, 0)
    p5.text('Lambda', LAMBDA.x, LAMBDA.y + 14)

    // Target services
    TARGETS.forEach((t) => drawBox(p5, t.x, t.y, t.icon, t.label, [16, 185, 129], [209, 250, 229]))

    // Connector lines
    SOURCES.forEach((src) => {
      p5.stroke(180, 180, 200)
      p5.strokeWeight(1)
      p5.line(src.x + 38, src.y, LAMBDA.x - 46, LAMBDA.y)
    })
    TARGETS.forEach((tgt) => {
      p5.stroke(180, 200, 180)
      p5.strokeWeight(1)
      p5.line(LAMBDA.x + 46, LAMBDA.y, tgt.x - 38, tgt.y)
    })

    // Packets
    packets = packets.filter((pk) => pk.active)
    for (const pk of packets) {
      pk.progress += 0.025
      if (pk.progress >= 1) { pk.active = false; continue }
      const bx = p5.lerp(pk.x, pk.tx, pk.progress)
      const by = p5.lerp(pk.y, pk.ty, pk.progress)
      p5.noStroke()
      p5.fill(...pk.color)
      p5.circle(bx, by, 10)
      p5.fill(255)
      p5.textSize(7)
      p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text(pk.label.slice(0, 4), bx, by - 12)
    }
  }

  function drawBox(p5: any, cx: number, cy: number, icon: string, label: string, stroke: [number,number,number], fill: [number,number,number]) {
    p5.strokeWeight(1.5)
    p5.stroke(...stroke)
    p5.fill(...fill)
    p5.rect(cx - 38, cy - 24, 76, 48, 8)
    p5.noStroke()
    p5.fill(...stroke)
    p5.textSize(16)
    p5.textAlign(p5.CENTER, p5.CENTER)
    p5.text(icon, cx, cy - 8)
    p5.textSize(8)
    label.split('\n').forEach((line, i) => p5.text(line, cx, cy + 8 + i * 11))
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-50">
      <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-gray-600 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
        Lambda イベント駆動アーキテクチャ（アニメーション）
      </div>
      <Sketch setup={setup} draw={draw} />
    </div>
  )
}
