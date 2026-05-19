'use client'

import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

export default function EC2Diagram() {
  let timer = 0
  const W = 680
  const H = 380

  interface Instance {
    x: number
    y: number
    label: string
    cpu: number
    targetCpu: number
    active: boolean
    scale: number
  }

  let instances: Instance[] = []
  let scaling = false
  let scaleDir = 1

  const setup = (p5: any, ref: any) => {
    p5.createCanvas(W, H).parent(ref)
    p5.frameRate(40)
    instances = [
      { x: 160, y: 180, label: 'EC2 #1', cpu: 30, targetCpu: 30, active: true, scale: 1 },
      { x: 340, y: 180, label: 'EC2 #2', cpu: 30, targetCpu: 30, active: true, scale: 1 },
    ]
  }

  const draw = (p5: any) => {
    p5.background(248, 250, 252)
    timer++

    // Simulate load increase → auto scaling
    if (timer === 80) {
      instances.forEach((inst) => { inst.targetCpu = 85 })
    }
    if (timer === 140) {
      // Scale out: add instance
      scaling = true
      instances.push({ x: 520, y: 180, label: 'EC2 #3', cpu: 0, targetCpu: 40, active: true, scale: 0 })
      instances.forEach((inst, i) => { if (i < 2) inst.targetCpu = 40 })
    }
    if (timer === 260) {
      // Scale in: remove instance
      if (instances.length > 2) {
        const last = instances[instances.length - 1]
        last.targetCpu = 0
        last.scale = 0
        setTimeout(() => { instances = instances.slice(0, -1) }, 600)
      }
      instances.forEach((inst, i) => { if (i < 2) inst.targetCpu = 80 })
    }
    if (timer > 300) timer = 0

    // Animate CPU
    instances.forEach((inst) => {
      inst.cpu += (inst.targetCpu - inst.cpu) * 0.04
      if (inst.scale < 1) inst.scale = Math.min(1, inst.scale + 0.05)
    })

    // ELB
    const elbX = 100, elbY = 180
    p5.strokeWeight(2)
    p5.stroke(99, 102, 241)
    p5.fill(238, 242, 255)
    p5.rect(elbX - 38, elbY - 22, 76, 44, 8)
    p5.noStroke()
    p5.fill(99, 102, 241)
    p5.textSize(10)
    p5.textAlign(p5.CENTER, p5.CENTER)
    p5.text('⚖️ ALB', elbX, elbY - 5)
    p5.text('(ELB)', elbX, elbY + 7)

    // Draw connections from ELB to instances
    instances.forEach((inst) => {
      if (!inst.active) return
      p5.stroke(150, 180, 220)
      p5.strokeWeight(1)
      p5.line(elbX + 38, elbY, inst.x - 38, inst.y)
    })

    // Auto Scaling Group boundary
    p5.strokeWeight(1.5)
    p5.stroke(245, 158, 11)
    p5.fill(254, 252, 232, 80)
    p5.rect(130, 80, 500, 200, 12)
    p5.noStroke()
    p5.fill(245, 158, 11)
    p5.textSize(10)
    p5.textAlign(p5.LEFT)
    p5.text('Auto Scaling グループ  (min:2, max:4)', 140, 98)

    // EC2 instances
    instances.forEach((inst) => {
      if (!inst.active) return
      const alpha = inst.scale * 255

      p5.push()
      p5.translate(inst.x, inst.y)
      p5.scale(inst.scale)

      // Instance box
      p5.strokeWeight(2)
      p5.stroke(37, 99, 235, alpha)
      p5.fill(219, 234, 254, alpha)
      p5.rect(-36, -50, 72, 100, 8)

      p5.noStroke()
      p5.fill(37, 99, 235, alpha)
      p5.textSize(9)
      p5.textAlign(p5.CENTER)
      p5.text('💻', 0, -28)
      p5.text(inst.label, 0, -15)

      // CPU bar
      const barW = 52, barH = 10
      p5.fill(220, 230, 240, alpha)
      p5.rect(-barW / 2, 5, barW, barH, 3)
      const cpuColor = inst.cpu > 70 ? [239, 68, 68] : inst.cpu > 50 ? [245, 158, 11] : [16, 185, 129]
      p5.fill(...cpuColor, alpha)
      p5.rect(-barW / 2, 5, (inst.cpu / 100) * barW, barH, 3)
      p5.fill(50, 50, 50, alpha)
      p5.textSize(8)
      p5.text(`CPU: ${Math.round(inst.cpu)}%`, 0, 28)

      p5.pop()
    })

    // Internet user icon
    p5.noStroke()
    p5.fill(100, 116, 139)
    p5.textSize(11)
    p5.textAlign(p5.CENTER)
    p5.text('🌍 ユーザー', 40, 180)
    p5.stroke(150, 180, 220)
    p5.strokeWeight(1)
    p5.line(62, 180, elbX - 38, 180)

    // Status message
    let msg = ''
    if (timer > 70 && timer < 140) msg = '⚠️  CPU使用率が急上昇中...'
    else if (timer >= 140 && timer < 180) msg = '📈  Auto Scaling: スケールアウト実行中'
    else if (timer >= 180 && timer < 260) msg = '✅  新しいインスタンスが追加されました'
    else if (timer >= 260 && timer < 310) msg = '📉  負荷が下がり、スケールイン中...'
    if (msg) {
      p5.noStroke()
      p5.fill(30, 30, 30)
      p5.textSize(11)
      p5.textAlign(p5.CENTER)
      p5.text(msg, W / 2, H - 20)
    }

    // Legend
    p5.textSize(9)
    p5.textAlign(p5.LEFT)
    p5.fill(100, 116, 139)
    p5.text('CPUバー: 緑(<50%) / 黄(50-70%) / 赤(>70%)', 10, H - 8)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-50">
      <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-gray-600 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
        EC2 Auto Scalingアニメーション
      </div>
      <Sketch setup={setup} draw={draw} />
    </div>
  )
}
