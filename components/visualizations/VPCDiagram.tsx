'use client'

import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

interface Packet {
  x: number
  y: number
  tx: number
  ty: number
  color: [number, number, number]
  progress: number
  speed: number
  active: boolean
}

export default function VPCDiagram() {
  let packets: Packet[] = []
  let timer = 0

  const W = 680
  const H = 420

  const VPC = { x: 20, y: 30, w: W - 40, h: H - 40 }
  const PUB = { x: 60, y: 80, w: 240, h: 280 }
  const PRI = { x: 380, y: 80, w: 240, h: 280 }

  // IGW (top center)
  const IGW = { x: W / 2, y: 18 }
  // NAT (between subnets)
  const NAT = { x: 320, y: 220 }
  // EC2 in public
  const EC2_PUB = { x: 150, y: 200 }
  // EC2 in private
  const EC2_PRI = { x: 490, y: 200 }
  // Internet user
  const INET = { x: W / 2, y: H - 15 }

  function spawnPacket(p5: any, from: {x:number,y:number}, to: {x:number,y:number}, col: [number,number,number]) {
    packets.push({ x: from.x, y: from.y, tx: to.x, ty: to.y, color: col, progress: 0, speed: 0.018 + Math.random() * 0.01, active: true })
  }

  const setup = (p5: any, ref: any) => {
    p5.createCanvas(W, H).parent(ref)
    p5.frameRate(40)
  }

  const draw = (p5: any) => {
    p5.background(248, 250, 252)
    timer++

    // Spawn packets periodically
    if (timer % 70 === 0) {
      // Internet → IGW → EC2 pub
      spawnPacket(p5, INET, IGW, [59, 130, 246])
      setTimeout(() => spawnPacket(p5, IGW, EC2_PUB, [59, 130, 246]), 800)
    }
    if (timer % 90 === 20) {
      // EC2 priv → NAT → IGW → Internet
      spawnPacket(p5, EC2_PRI, NAT, [16, 185, 129])
      setTimeout(() => spawnPacket(p5, NAT, IGW, [16, 185, 129]), 900)
      setTimeout(() => spawnPacket(p5, IGW, INET, [16, 185, 129]), 1800)
    }
    if (timer % 110 === 40) {
      // EC2 pub → EC2 priv (internal)
      spawnPacket(p5, EC2_PUB, EC2_PRI, [245, 158, 11])
    }

    // VPC background
    p5.strokeWeight(2)
    p5.stroke(99, 102, 241)
    p5.fill(238, 242, 255)
    p5.rect(VPC.x, VPC.y, VPC.w, VPC.h, 12)

    // VPC label
    p5.noStroke()
    p5.fill(99, 102, 241)
    p5.textSize(11)
    p5.textAlign(p5.LEFT)
    p5.text('VPC  10.0.0.0/16', VPC.x + 10, VPC.y + 18)

    // Public subnet
    p5.strokeWeight(1.5)
    p5.stroke(59, 130, 246)
    p5.fill(219, 234, 254)
    p5.rect(PUB.x, PUB.y, PUB.w, PUB.h, 8)

    p5.noStroke()
    p5.fill(59, 130, 246)
    p5.textSize(10)
    p5.textAlign(p5.CENTER)
    p5.text('パブリックサブネット 10.0.1.0/24', PUB.x + PUB.w / 2, PUB.y + 16)

    // Private subnet
    p5.strokeWeight(1.5)
    p5.stroke(16, 185, 129)
    p5.fill(209, 250, 229)
    p5.rect(PRI.x, PRI.y, PRI.w, PRI.h, 8)

    p5.noStroke()
    p5.fill(16, 185, 129)
    p5.textSize(10)
    p5.textAlign(p5.CENTER)
    p5.text('プライベートサブネット 10.0.2.0/24', PRI.x + PRI.w / 2, PRI.y + 16)

    // IGW
    drawBox(p5, IGW.x, IGW.y, '🌐 IGW', [239, 246, 255], [59, 130, 246])

    // NAT GW
    drawBox(p5, NAT.x, NAT.y, '⚡ NAT GW', [254, 252, 232], [245, 158, 11])

    // EC2 instances
    drawBox(p5, EC2_PUB.x, EC2_PUB.y, '💻 EC2\n(Public)', [219, 234, 254], [37, 99, 235])
    drawBox(p5, EC2_PRI.x, EC2_PRI.y, '💻 EC2\n(Private)', [209, 250, 229], [5, 150, 105])

    // Internet
    p5.noStroke()
    p5.fill(100, 116, 139)
    p5.textAlign(p5.CENTER)
    p5.textSize(11)
    p5.text('🌍 インターネット', INET.x, INET.y)

    // Draw route lines
    p5.stroke(200, 210, 220)
    p5.strokeWeight(1)
    // IGW - Internet
    p5.line(IGW.x, IGW.y + 14, INET.x, INET.y - 8)
    // IGW - EC2 pub
    p5.line(IGW.x, IGW.y + 14, EC2_PUB.x, EC2_PUB.y - 14)
    // NAT - EC2 priv
    p5.line(NAT.x, NAT.y, EC2_PRI.x, EC2_PRI.y)
    // NAT - IGW
    p5.line(NAT.x, NAT.y - 14, IGW.x, IGW.y + 14)
    // EC2 pub - NAT
    p5.line(EC2_PUB.x + 30, EC2_PUB.y, NAT.x - 20, NAT.y)

    // Draw packets
    packets = packets.filter((pk) => pk.active)
    for (const pk of packets) {
      pk.progress += pk.speed
      if (pk.progress >= 1) { pk.active = false; continue }
      const px = p5.lerp(pk.x, pk.tx, pk.progress)
      const py = p5.lerp(pk.y, pk.ty, pk.progress)
      p5.noStroke()
      p5.fill(...pk.color)
      p5.circle(px, py, 9)
      p5.fill(255)
      p5.circle(px, py, 4)
    }

    // Legend
    p5.textSize(9)
    p5.textAlign(p5.LEFT)
    const legends = [
      { col: [59, 130, 246] as [number,number,number], label: '外部→EC2(パブリック)' },
      { col: [16, 185, 129] as [number,number,number], label: 'EC2(プライベート)→外部(NAT経由)' },
      { col: [245, 158, 11] as [number,number,number], label: '内部通信' },
    ]
    legends.forEach((lg, i) => {
      p5.fill(...lg.col)
      p5.circle(VPC.x + 14, H - 28 + i * 12, 7)
      p5.fill(80, 80, 80)
      p5.text(lg.label, VPC.x + 22, H - 25 + i * 12)
    })
  }

  function drawBox(p5: any, cx: number, cy: number, label: string, bg: number[], border: number[]) {
    const bw = 68, bh = 28
    p5.strokeWeight(1.5)
    p5.stroke(...border)
    p5.fill(...bg)
    p5.rect(cx - bw / 2, cy - bh / 2, bw, bh, 6)
    p5.noStroke()
    p5.fill(...border)
    p5.textSize(9)
    p5.textAlign(p5.CENTER, p5.CENTER)
    const lines = label.split('\n')
    if (lines.length === 1) {
      p5.text(label, cx, cy)
    } else {
      p5.text(lines[0], cx, cy - 5)
      p5.text(lines[1], cx, cy + 6)
    }
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-50">
      <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-gray-600 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
        VPCアーキテクチャ図（アニメーション）
      </div>
      <Sketch setup={setup} draw={draw} />
    </div>
  )
}
