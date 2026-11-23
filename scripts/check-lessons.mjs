// 図解レッスンの表示チェック
//
// 使い方：
//   1. 別のターミナルで `npm run dev` を起動しておく
//   2. `npm run check:lessons`
//      （URLを変えるとき：BASE_URL=http://localhost:3001 npm run check:lessons）
//
// 初回だけ、ブラウザの取得が必要です：`npx playwright install chromium`
//
// トップページから /learn/ へのリンクを集め、各レッスンの全ステップを
// PC・小さめのPC・スマホの3サイズで開いて、次を確かめます。
//   - 吹き出しが図形・ほかの吹き出しに重なっていない／図の枠からはみ出していない
//   - ゾーン名（VPC・AZ・サブネット）が図形に隠れていない
//   - IPアドレスがほかの図形に重なっていない／はみ出していない
//   - PCでは、ステップ欄が画面内に収まっている
//   - ページでエラーが起きていない

import { chromium } from 'playwright'

const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const VIEWPORTS = [
  { name: 'PC 1440×900', width: 1440, height: 900 },
  { name: 'PC 1280×720', width: 1280, height: 720 },
  { name: 'スマホ 390×844', width: 390, height: 844, isMobile: true, hasTouch: true },
]

// ブラウザ内で実行する検査。問題の説明を配列で返す
function inspect() {
  const out = []
  const svg = document.querySelector('.lp-scene')
  if (!svg) return ['図（.lp-scene）が見つかりません']
  const vb = svg.viewBox.baseVal
  const box = (r) => ({ x0: r.x, y0: r.y, x1: r.x + r.width, y1: r.y + r.height })
  const hit = (a, b) => a.x0 < b.x1 - 1 && a.x1 > b.x0 + 1 && a.y0 < b.y1 - 1 && a.y1 > b.y0 + 1

  // 図形（影＝先頭の子要素を除く）
  const nodes = [...svg.querySelectorAll('[data-node]:not(.is-hidden)')].map((g) => {
    const parts = [...g.children].slice(1).map((c) => box(c.getBBox()))
    const b = parts.reduce((a, c) => ({ x0: Math.min(a.x0, c.x0), y0: Math.min(a.y0, c.y0), x1: Math.max(a.x1, c.x1), y1: Math.max(a.y1, c.y1) }))
    return { id: g.dataset.node, b }
  })

  // 吹き出し
  const pills = [...svg.querySelectorAll('.lp-pill')].map((g) => ({ text: g.textContent, b: box(g.getBBox()) }))
  pills.forEach((p, i) => {
    nodes.forEach((n) => hit(p.b, n.b) && out.push(`吹き出し「${p.text}」が図形 ${n.id} に重なっています`))
    pills.slice(i + 1).forEach((q) => hit(p.b, q.b) && out.push(`吹き出し「${p.text}」と「${q.text}」が重なっています`))
    if (p.b.x0 < vb.x || p.b.y0 < vb.y || p.b.x1 > vb.x + vb.width || p.b.y1 > vb.y + vb.height) {
      out.push(`吹き出し「${p.text}」が図の枠からはみ出しています`)
    }
  })

  // ゾーン名：1文字おきに、その位置の最前面が図形になっていないか
  svg.querySelectorAll('[data-zone-label]').forEach((t) => {
    const m = t.getScreenCTM()
    for (let i = 0; i < t.getNumberOfChars(); i += 2) {
      const p = t.getStartPositionOfChar(i)
      const q = new DOMPoint(p.x + 3, p.y - 4).matrixTransform(m)
      const el = document.elementFromPoint(q.x, q.y)
      if (el?.closest('[data-node]')) {
        out.push(`ゾーン名「${t.textContent}」が図形に隠れています`)
        break
      }
    }
  })

  // IPアドレス：ほかの図形に重なっていないか／図の枠からはみ出していないか
  svg.querySelectorAll('[data-ip-label]:not(.is-hidden)').forEach((t) => {
    const own = t.getAttribute('data-ip-label')
    const b = box(t.getBBox())
    if (b.x0 < vb.x || b.y0 < vb.y || b.x1 > vb.x + vb.width || b.y1 > vb.y + vb.height) {
      out.push(`IPアドレス「${t.textContent}」が図の枠からはみ出しています`)
    }
    const m = t.getScreenCTM()
    for (let i = 0; i < t.getNumberOfChars(); i += 2) {
      const p = t.getStartPositionOfChar(i)
      const q = new DOMPoint(p.x + 3, p.y - 4).matrixTransform(m)
      const other = document.elementsFromPoint(q.x, q.y).find((el) => {
        const g = el.closest('[data-node]')
        return g && !g.classList.contains('is-hidden') && g.getAttribute('data-node') !== own
      })
      if (other) {
        out.push(`IPアドレス「${t.textContent}」が図形 ${other.closest('[data-node]').getAttribute('data-node')} に重なっています`)
        break
      }
    }
  })

  // PC：ステップ欄と「次へ」が画面内にあるか
  if (window.innerWidth >= 900) {
    const st = document.querySelector('.lp-stepper')?.getBoundingClientRect()
    if (st && st.bottom > window.innerHeight + 1) out.push('ステップ欄が画面の下にはみ出しています')
    const nav = document.querySelector('.lp-nav')?.getBoundingClientRect()
    if (nav && nav.bottom > window.innerHeight + 1) out.push('「次へ」ボタンが画面の下にはみ出しています')
  }
  return out
}

async function lessonPaths(page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'load' })
  const hrefs = await page.$$eval('a[href^="/learn/"]', (as) => as.map((a) => a.getAttribute('href')))
  return [...new Set(hrefs)]
}

async function main() {
  const browser = await chromium.launch()
  let failed = 0
  try {
    const first = await browser.newPage()
    let paths
    try {
      paths = await lessonPaths(first)
    } catch {
      console.error(`✗ ${BASE_URL} を開けませんでした。\`npm run dev\` が起動しているか確認してください。`)
      process.exit(2)
    }
    await first.close()
    if (paths.length === 0) {
      console.error('✗ トップページに /learn/ へのリンクが見つかりませんでした。')
      process.exit(2)
    }

    for (const path of paths) {
      const issues = new Set()
      for (const vp of VIEWPORTS) {
        const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch })
        const page = await ctx.newPage()
        page.on('pageerror', (e) => issues.add(`[${vp.name}] ページのエラー：${e.message}`))
        await page.goto(`${BASE_URL}${path}`, { waitUntil: 'load' })
        await page.waitForSelector('.lp-scene')
        const steps = await page.locator('.lp-st').count()
        for (let i = 0; i < steps; i++) {
          await page.locator('.lp-st').nth(i).click()
          await page.evaluate(() => document.querySelector('.lp-scene')?.scrollIntoView({ block: 'center' }))
          await page.waitForTimeout(250)
          const label = await page.locator('.lp-st').nth(i).locator('span').textContent()
          for (const msg of await page.evaluate(inspect)) issues.add(`[${vp.name}] ステップ${i + 1}「${label ?? ''}」：${msg}`)
        }
        await ctx.close()
      }
      if (issues.size === 0) {
        console.log(`✓ ${path}`)
      } else {
        failed++
        console.log(`✗ ${path}（${issues.size}件）`)
        for (const msg of issues) console.log(`    - ${msg}`)
      }
    }
  } finally {
    await browser.close()
  }
  if (failed) {
    console.log(`\n${failed} 本のレッスンに問題があります。`)
    process.exit(1)
  }
  console.log('\nすべてのレッスンで問題は見つかりませんでした。')
}

main()
