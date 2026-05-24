'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

const STEPS = [
  {
    id: 1,
    title: 'S3とは',
    description: 'S3（Simple Storage Service）はAWSのオブジェクトストレージです。ブラウザ・サーバー・モバイルなど様々なクライアントからファイルをアップロード・ダウンロードできます。',
    keyPoints: [
      '容量無制限のオブジェクトストレージ（1オブジェクト最大5TB）',
      '99.999999999%（11ナイン）の耐久性を提供',
      'URLでオブジェクトに直接アクセス可能',
      'リージョン固有だがバケット名はグローバルで一意',
    ],
    hint: 'ファイル置き場として最もシンプルなAWSストレージ',
  },
  {
    id: 2,
    title: 'バケットとオブジェクト',
    description: 'S3ではバケット（コンテナ）の中にオブジェクト（ファイル）を格納します。オブジェクトはキー（パス）で識別されます。',
    keyPoints: [
      'バケット名はグローバルで一意（全AWSユーザー間で重複不可）',
      'オブジェクトはキー（例：images/photo.jpg）で識別',
      'バケットはリージョン固有に作成される',
      'フォルダ概念は実際にはキーのプレフィックスで実現',
    ],
    hint: 'バケット=引き出し、オブジェクト=ファイル、キー=ファイルパス',
  },
  {
    id: 3,
    title: 'ストレージクラス（前半）',
    description: 'S3はデータのアクセス頻度に応じて複数のストレージクラスを提供します。Standard・Standard-IA・Intelligent-Tieringは高頻度から低頻度のアクセスに対応します。',
    keyPoints: [
      'Standard：高頻度アクセス、99.99%可用性、高コスト',
      'Standard-IA：低頻度アクセス、取得時に費用発生、最低30日保存',
      'Intelligent-Tiering：アクセスパターンを自動判定してコスト最適化',
      'One Zone-IA：単一AZ保存でさらにコスト削減（可用性低下）',
    ],
    hint: 'アクセス頻度が低いほどストレージコストは安くなるがトレードオフがある',
  },
  {
    id: 4,
    title: 'ストレージクラス（後半）',
    description: 'GlacierとGlacier Deep Archiveは長期アーカイブ向けの低コストストレージです。コストが安い分、取得に時間がかかります。',
    keyPoints: [
      'Glacier Instant Retrieval：ミリ秒で取得可能な低コストアーカイブ',
      'Glacier Flexible Retrieval：1分〜12時間で取得（コスト中程度）',
      'Glacier Deep Archive：最低コスト、取得に最大12時間',
      'コスト↓に比例して取得時間↑のトレードオフを理解する',
    ],
    hint: 'Glacierは「氷河」＝アクセス遅いが保存コストが非常に安い',
  },
  {
    id: 5,
    title: 'アクセス制御',
    description: 'S3のアクセス制御はIAMポリシーとバケットポリシーの2層で管理します。デフォルトは完全非公開です。',
    keyPoints: [
      'IAMポリシー：ユーザー/ロール単位のアクセス制御（IDベース）',
      'バケットポリシー：バケット単位のリソースベースポリシー',
      'パブリックアクセスブロック：アカウント/バケットレベルで一括制御',
      '両ポリシーの論理ANDで最終的なアクセス可否が決まる',
    ],
    hint: 'IAMポリシーとバケットポリシーの両方を通過して初めてアクセス可能',
  },
  {
    id: 6,
    title: '暗号化',
    description: 'S3はサーバーサイド暗号化（SSE）を3種類提供しています。誰がキーを管理するかがポイントです。',
    keyPoints: [
      'SSE-S3：AWSがキーを完全管理（デフォルト有効）、コスト追加なし',
      'SSE-KMS：AWS KMSでキー管理、監査ログ・権限制御が可能',
      'SSE-C：ユーザーが自分のキーを提供・管理（AWSはキーを保存しない）',
      'クライアントサイド暗号化：S3に送信前にクライアントで暗号化',
    ],
    hint: 'キー管理の責任範囲：SSE-S3はAWS、SSE-KMSは共同、SSE-Cはユーザー',
  },
  {
    id: 7,
    title: '静的Webサイトホスティング',
    description: 'S3バケットを使って静的HTMLサイトをホスティングできます。サーバーレスで低コストなWebサイト公開が可能です。',
    keyPoints: [
      'HTML・CSS・JavaScript・画像ファイルをホスティング可能',
      'バケットポリシーで全公開（GetObject許可）に設定が必要',
      'S3エンドポイントURL（bucket-name.s3-website-region.amazonaws.com）でアクセス',
      'CloudFrontと組み合わせてCDN配信・独自ドメイン・HTTPS対応が可能',
    ],
    hint: 'サーバー不要でHTMLをホスティング可能。動的処理はLambdaと組み合わせる',
  },
  {
    id: 8,
    title: 'まとめ',
    description: 'S3初級の重要ポイントを整理します。試験で頻出の概念を確認しましょう。',
    keyPoints: [
      'バケット名はグローバル一意、リージョンは選択可能',
      'ストレージクラスはアクセス頻度とコストのトレードオフで選択',
      'デフォルト非公開、IAM+バケットポリシーで細かく制御',
      '暗号化はSSE-S3（デフォルト）で自動有効、KMSで高度な制御',
    ],
    hint: '試験では「最低コスト」「高頻度アクセス」などの条件で適切なクラスを選ぶ問題が多い',
  },
]

const TOTAL = STEPS.length
const W = 660
const H = 340

const ORANGE: [number,number,number] = [255, 153,  0]
const BLUE:   [number,number,number] = [ 35, 100,170]
const GREEN:  [number,number,number] = [122, 161, 22]
const PURPLE: [number,number,number] = [140,  79,255]
const GRAY:   [number,number,number] = [100, 116,139]
const DARK:   [number,number,number] = [ 50,  55, 65]
const RED:    [number,number,number] = [200,  55, 55]
const TEAL:   [number,number,number] = [ 14, 165,140]

export default function S3BeginnerStepper() {
  const [step, setStep] = useState(1)
  const stepRef    = useRef(1)
  const timerRef   = useRef(0)
  const imgS3    = useRef<unknown>(null)
  const imgLambda = useRef<unknown>(null)
  const imgCf    = useRef<unknown>(null)
  const imgIam   = useRef<unknown>(null)

  useEffect(() => {
    stepRef.current  = step
    timerRef.current = 0
  }, [step])

  function arrow(p5: any, x1: number, y1: number, x2: number, y2: number,
    col: [number,number,number], w = 1.5) {
    p5.stroke(...col); p5.strokeWeight(w)
    p5.line(x1, y1, x2, y2)
    const ang = Math.atan2(y2 - y1, x2 - x1)
    const ah = 8
    p5.noStroke(); p5.fill(...col)
    p5.push(); p5.translate(x2, y2); p5.rotate(ang)
    p5.triangle(0, 0, -ah, -ah*0.44, -ah, ah*0.44)
    p5.pop()
  }

  function hline(p5: any, x1: number, y: number, x2: number,
    col: [number,number,number], w = 1.5) {
    p5.stroke(...col); p5.strokeWeight(w); p5.line(x1, y, x2, y)
  }

  function vline(p5: any, x: number, y1: number, y2: number,
    col: [number,number,number], w = 1.5) {
    p5.stroke(...col); p5.strokeWeight(w); p5.line(x, y1, x, y2)
  }

  function box(p5: any, x: number, y: number, bw: number, bh: number,
    col: [number,number,number], fillAlpha = 15, _radius = 0) {
    p5.strokeWeight(1.5); p5.stroke(...col)
    p5.fill(col[0], col[1], col[2], fillAlpha)
    p5.rect(x, y, bw, bh, 0)
  }

  function label(p5: any, text: string, x: number, y: number,
    col: [number,number,number], size = 12, align = 'center') {
    p5.noStroke(); p5.fill(...col)
    p5.textSize(size)
    if (align === 'center') p5.textAlign(p5.CENTER, p5.CENTER)
    else if (align === 'left') p5.textAlign(p5.LEFT, p5.CENTER)
    else p5.textAlign(p5.RIGHT, p5.CENTER)
    p5.text(text, x, y)
  }

  function badge(p5: any, cx: number, cy: number, text: string,
    col: [number,number,number], bw = 0) {
    const tw = bw || (text.length * 7 + 16)
    p5.noStroke(); p5.fill(...col, 220)
    p5.rect(cx - tw/2, cy - 10, tw, 20, 0)
    p5.fill(255); p5.textSize(11); p5.textAlign(p5.CENTER, p5.CENTER)
    p5.text(text, cx, cy)
  }

  function clientBox(p5: any, x: number, y: number, lbl: string, sub: string) {
    box(p5, x, y, 100, 56, BLUE, 15, 0)
    label(p5, lbl, x+50, y+20, BLUE, 13)
    label(p5, sub, x+50, y+40, GRAY, 11)
  }

  function s3Bucket(p5: any, x: number, y: number, bw: number, bh: number, title: string) {
    box(p5, x, y, bw, bh, GREEN, 18, 0)
    if (imgS3.current) {
      p5.image(imgS3.current as any, x+6, y+6, 24, 24)
    }
    label(p5, title, x + bw/2 + 10, y+18, GREEN, 13)
  }

  const setup = (p5: any, ref: any) => {
    p5.createCanvas(W, H).parent(ref)
    p5.frameRate(30)
    p5.loadImage('/icons/aws/s3.svg', (img: unknown) => { imgS3.current = img })
    p5.loadImage('/icons/aws/Lambda.svg', (img: unknown) => { imgLambda.current = img })
    p5.loadImage('/icons/aws/CloudFront.svg', (img: unknown) => { imgCf.current = img })
    p5.loadImage('/icons/aws/IAM-Role.svg', (img: unknown) => { imgIam.current = img })
  }

  const draw = (p5: any) => {
    const s = stepRef.current
    timerRef.current++
    p5.background(248, 250, 252)
    p5.textFont('sans-serif')

    // ── STEP 1: S3とは ────────────────────────────────────────────────
    if (s === 1) {
      // Clients on left
      const clients = [
        { lbl: 'ブラウザ', sub: 'Web', y: 30 },
        { lbl: 'サーバー', sub: 'EC2/Lambda', y: 120 },
        { lbl: 'モバイル', sub: 'iOS/Android', y: 210 },
      ]
      clients.forEach(c => {
        clientBox(p5, 14, c.y, c.lbl, c.sub)
      })

      // S3 bucket on right
      s3Bucket(p5, 430, 100, 200, 140, 'S3 バケット')
      // Objects inside bucket
      const objs = ['image.png', 'data.csv', 'backup.zip']
      objs.forEach((o, i) => {
        box(p5, 446, 130 + i*32, 168, 24, GREEN, 25, 0)
        label(p5, o, 530, 142 + i*32, DARK, 11)
      })

      // Guide lines (thin static)
      const arrowY = [58, 148, 238]
      const midX = 280
      arrowY.forEach(ay => hline(p5, 114, ay, midX, BLUE, 0.8))
      vline(p5, midX, 58, 238, BLUE, 0.8)
      hline(p5, midX, 148, 430, BLUE, 0.8)
      arrow(p5, 424, 148, 430, 148, BLUE, 2)

      // Labels on arrows
      badge(p5, 200, 42, 'アップロード', BLUE, 90)
      badge(p5, 200, 262, 'ダウンロード', BLUE, 90)

      // Right label
      p5.noStroke(); p5.fill(...GREEN); p5.textSize(11); p5.textAlign(p5.CENTER)
      p5.text('容量無制限・11ナイン耐久性', 530, 258)
    }

    // ── STEP 2: バケットとオブジェクト ────────────────────────────────
    else if (s === 2) {
      box(p5, 14, 20, 632, 290, GREEN, 12, 0)
      if (imgS3.current) p5.image(imgS3.current as any, 20, 24, 28, 28)
      label(p5, 'S3 バケット：my-app-bucket-2024', 350, 38, GREEN, 14)
      label(p5, '（グローバルで一意な名前が必要）', 350, 56, GRAY, 11)
      const objects = [
        { key: 'images/photo.jpg',    size: '2.4 MB', class: 'Standard',    col: ORANGE },
        { key: 'videos/intro.mp4',    size: '128 MB', class: 'Standard-IA', col: BLUE   },
        { key: 'backup/2024-01.zip',  size: '1.2 GB', class: 'Glacier',     col: TEAL   },
      ]
      objects.forEach((obj, i) => {
        const oy = 80 + i*72
        box(p5, 28, oy, 612, 58, BLUE, 15, 0)
        label(p5, 'key:', 44, oy+16, GRAY, 11, 'left')
        label(p5, obj.key, 84, oy+16, DARK, 12, 'left')
        label(p5, 'size:', 44, oy+38, GRAY, 11, 'left')
        label(p5, obj.size, 84, oy+38, DARK, 12, 'left')
        badge(p5, 560, oy+27, obj.class, obj.col, 80)
      })
      label(p5, 'バケット = コンテナ    オブジェクト = ファイル    キー = ファイルパス（フォルダ概念なし）', W/2, 316, GRAY, 11)
    }

    // ── STEP 3: ストレージクラス前半 ─────────────────────────────────
    else if (s === 3) {
      const cards = [
        { name: 'Standard',            sub: '高頻度アクセス', avail: '99.99%', az: '3以上', cost: '高', col: ORANGE as [number,number,number] },
        { name: 'Standard-IA',         sub: '低頻度アクセス', avail: '99.9%',  az: '3以上', cost: '中', col: BLUE   as [number,number,number] },
        { name: 'Intelligent-Tiering', sub: '自動最適化',     avail: '99.9%',  az: '3以上', cost: '中', col: GREEN  as [number,number,number] },
      ]

      cards.forEach((c, i) => {
        const cx = 14 + i * 216

        // Draw card (height 286; freq label sits below at y=310)
        box(p5, cx, 14, 206, 286, c.col, 12, 0)
        label(p5, c.name, cx + 103, 36, c.col, 13)
        hline(p5, cx + 10, 48, cx + 196, c.col, 1)
        label(p5, c.sub, cx + 103, 65, DARK, 12)

        // Metrics rows (可用性 / AZ数 / コスト)
        const metrics: [string, string][] = [['可用性', c.avail], ['AZ数', c.az], ['コスト', c.cost]]
        metrics.forEach(([k, v], mi) => {
          const my2 = 100 + mi * 52
          label(p5, k, cx + 103, my2, GRAY, 11)
          box(p5, cx + 20, my2 + 10, 166, 26, c.col, 20, 0)
          label(p5, v, cx + 103, my2 + 23, c.col, 13)
        })

        // Bottom band (y=266–294 inside card)
        p5.noStroke()
        p5.fill(c.col[0], c.col[1], c.col[2], 18)
        p5.rect(cx + 4, 266, 198, 28, 0)

        // IA: fee badge (always visible)
        if (i === 1) {
          badge(p5, cx + 103, 280, '取得料金 +', RED, 84)
        }
        // IT: tier badge (always visible)
        if (i === 2) {
          badge(p5, cx + 103, 280, '自動Tier切替', GREEN, 112)
        }

        // Freq label below card
        const freqLabels = ['高頻度アクセス向け', '低頻度（月数回以下）', '自動でTier切替え']
        label(p5, freqLabels[i], cx + 103, 310, c.col, 11)
      })

      label(p5, 'アクセス頻度が低い → ストレージコスト↓  ただし取得コスト↑（IA）', W / 2, 330, GRAY, 11)
    }

    // ── STEP 4: ストレージクラス後半（Glacier）────────────────────────
    else if (s === 4) {
      // LOOP=360: all 3 Glacier types receive GET simultaneously (T=0-20),
      // then retrieval progress bars fill at vastly different rates.
      // Phase constants (named, no magic numbers):
      const LOOP = 360
      const T = timerRef.current % LOOP
      const instantComplete = 30   // Instant Retrieval done (bars start at T=0)
      const flexComplete   = 200  // Flexible done
      const deepComplete   = 350  // Deep Archive done

      const glaciers: Array<{
        name: string; retrieve: string; cost: string;
        col: [number,number,number]; complete: number
      }> = [
        { name: 'Glacier\nInstant',       retrieve: 'ミリ秒',   cost: '低',  col: TEAL,   complete: instantComplete },
        { name: 'Glacier\nFlexible',      retrieve: '最大12h',  cost: '低',  col: BLUE,   complete: flexComplete   },
        { name: 'Glacier\nDeep Archive',  retrieve: '最大48h',  cost: '最低', col: PURPLE, complete: deepComplete   },
      ]

      // Layout: 3 equal columns, gap=30px
      // colX=[20,240,460], colW=190, colY=28, colH=270
      // Text width notes (textSize=14, J≈14px, A≈8.4px):
      //   'ミリ秒' = 3J×14 = 42px < boxW=140 ✓
      //   '最大12h' = 2J×14 + 3A×8.4 = 28+25.2 = 53.2 < 140 ✓
      //   '最大48h' = 2J×14 + 3A×8.4 = 53.2 < 140 ✓
      const colXArr = [20, 240, 460]
      const colW = 190, colY = 28, colH = 270
      const barY = colY + 198, barW = colW - 30, barH = 20

      label(p5, 'Glacier クラス — 取得速度とコストのトレードオフ', W / 2, 14, DARK, 13)

      glaciers.forEach((g, i) => {
        const cx = colXArr[i]

        // ── Compute bar progress & status
        let barRatio = 0
        let status = 'リクエスト待機中'
        let statusCol: [number,number,number] = GRAY
        const colFlash = T >= g.complete && T < g.complete + 20

        if (T < g.complete) {
          barRatio = T / g.complete
          status = '取得中... ' + Math.round(barRatio * 100) + '%'
          statusCol = g.col
        } else {
          barRatio = 1.0
          status = '完了！'
          statusCol = GREEN
        }

        // Column box
        box(p5, cx, colY, colW, colH, g.col, colFlash ? 50 : 12, 0)

        // Glacier name (2-line via \n)
        p5.noStroke(); p5.fill(g.col[0], g.col[1], g.col[2])
        p5.textSize(13); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text(g.name, cx + colW / 2, colY + 30)

        hline(p5, cx + 10, colY + 52, cx + colW - 10, g.col, 1)

        // Retrieval time
        label(p5, '取得時間', cx + colW / 2, colY + 68, GRAY, 11)
        box(p5, cx + 25, colY + 76, colW - 50, 30, g.col, 25, 0)
        label(p5, g.retrieve, cx + colW / 2, colY + 91, g.col, 14)

        // Storage cost
        label(p5, 'ストレージコスト', cx + colW / 2, colY + 120, GRAY, 11)
        box(p5, cx + 45, colY + 128, colW - 90, 28, g.col, 20, 0)
        label(p5, g.cost, cx + colW / 2, colY + 142, g.col, 14)

        // Retrieval progress bar
        const bx = cx + 15
        // Background
        p5.noStroke(); p5.fill(200, 205, 215)
        p5.rect(bx, barY, barW, barH, 0)
        // Fill
        p5.fill(g.col[0], g.col[1], g.col[2], 220)
        p5.rect(bx, barY, barW * barRatio, barH, 0)
        // Border
        p5.strokeWeight(1); p5.stroke(g.col[0], g.col[1], g.col[2]); p5.noFill()
        p5.rect(bx, barY, barW, barH, 0)

        // Status label
        label(p5, status, cx + colW / 2, colY + 232, statusCol, 12)
      })

      // Tradeoff summary (size=11, centered)
      // 'Instant < Flexible < Deep Archive の順にコスト↓・取得時間↑'
      // ≈ (7+1+8+1+12)A×6.6 + (13J×11) = 29×6.6+143 = 191.4+143 = ~335px < 660 ✓
      label(p5, 'Instant < Flexible < Deep Archive の順にコスト↓・取得時間↑', W / 2, 314, DARK, 12)
      label(p5, 'コスト優先: Deep Archive  /  即時取得が必要: Glacier Instant', W / 2, 332, GRAY, 11)
    }

    // ── STEP 5: アクセス制御 ──────────────────────────────────────────
    else if (s === 5) {
      // LOOP=240: request particle flows IAM User → IAM Policy → Bucket Policy → S3
      const LOOP = 240
      const T = timerRef.current % LOOP

      // Phase constants
      const seg0Start = 0,  seg0End = 50   // IAMユーザー → IAMポリシー
      const seg1Start = 60, seg1End = 120   // IAMポリシー → バケットポリシー
      const seg2Start = 130,seg2End = 190   // バケットポリシー → S3

      // Gate flash when particle arrives
      const iamGateFlash    = T >= seg0End && T < seg0End + 20
      const bucketGateFlash = T >= seg1End && T < seg1End + 20
      const s3Flash         = T >= seg2End && T < seg2End + 20

      // Status label
      let statusLabel = 'リクエスト待機中'
      let statusCol: [number,number,number] = GRAY
      if (T >= seg0Start && T < seg0End) { statusLabel = 'IAMポリシー確認中...'; statusCol = BLUE }
      else if (T >= seg0End && T < seg1Start) { statusLabel = 'IAMポリシー OK'; statusCol = GREEN }
      else if (T >= seg1Start && T < seg1End) { statusLabel = 'バケットポリシー確認中...'; statusCol = BLUE }
      else if (T >= seg1End && T < seg2Start) { statusLabel = 'バケットポリシー OK'; statusCol = GREEN }
      else if (T >= seg2Start && T < seg2End) { statusLabel = 'S3バケットへ転送中...'; statusCol = BLUE }
      else if (T >= seg2End) { statusLabel = 'アクセス許可'; statusCol = GREEN }

      // Title note box
      box(p5, 14, 14, 632, 96, DARK, 8, 0)
      label(p5, 'アクセス制御の仕組み', W/2, 32, DARK, 14)
      label(p5, 'IAMポリシー（ユーザー側）とバケットポリシー（リソース側）の両方を通過してはじめてアクセス許可', W/2, 54, DARK, 12)
      label(p5, 'どちらか一方でもDenyがあればアクセス拒否 ｜ デフォルトは全て非公開', W/2, 76, GRAY, 11)
      label(p5, statusLabel, W/2, 94, statusCol, 11)

      // IAM User (left)
      box(p5, 14, 120, 100, 100, BLUE, 15, 0)
      if (imgIam.current) p5.image(imgIam.current as any, 24, 128, 26, 26)
      label(p5, 'IAMユーザー', 64, 168, BLUE, 12)
      label(p5, '/ ロール', 64, 184, BLUE, 11)

      // Arrow 1: User → IAM Policy gate
      arrow(p5, 114, 170, 168, 170, DARK, 1.5)

      // IAM Policy gate — flashes when particle arrives
      box(p5, 168, 138, 110, 64, GREEN, iamGateFlash ? 60 : 18, 0)
      label(p5, 'IAMポリシー', 223, 162, GREEN, 12)
      label(p5, '（ID ベース）', 223, 178, GREEN, 11)

      // Arrow 2: IAM Policy → Bucket Policy gate
      arrow(p5, 278, 170, 342, 170, DARK, 1.5)
      label(p5, 'Allow?', 310, 162, GREEN, 11)

      // Bucket Policy gate — flashes when particle arrives
      box(p5, 342, 138, 120, 64, GREEN, bucketGateFlash ? 60 : 18, 0)
      label(p5, 'バケットポリシー', 402, 162, GREEN, 12)
      label(p5, '（リソースベース）', 402, 178, GREEN, 11)

      // Arrow 3: Bucket Policy → S3
      arrow(p5, 462, 170, 520, 170, DARK, 1.5)
      label(p5, 'Allow?', 490, 162, GREEN, 11)

      // S3 Bucket (right)
      const s3FillAlpha = s3Flash ? 60 : 18
      box(p5, 520, 130, 126, 80, GREEN, s3FillAlpha, 0)
      if (imgS3.current) p5.image(imgS3.current as any, 526, 134, 24, 24)
      label(p5, 'S3', 583, 158, GREEN, 14)
      label(p5, 'バケット', 583, 178, GREEN, 12)

      // Deny paths (downward arrows)
      arrow(p5, 223, 202, 223, 260, RED, 1.5)
      label(p5, 'Deny', 223, 274, RED, 11)
      label(p5, '拒否', 223, 290, RED, 11)

      arrow(p5, 402, 202, 402, 260, RED, 1.5)
      label(p5, 'Deny', 402, 274, RED, 11)
      label(p5, '拒否', 402, 290, RED, 11)

      // Note bottom
      box(p5, 14, 300, 632, 34, BLUE, 8, 0)
      label(p5, 'Public Access Block 設定でバケット全体・アカウント全体のパブリックアクセスを一括でブロック可能', W/2, 317, BLUE, 11)

      // Animated request particle
      // Segment 0: IAM User center → IAM Policy left edge
      if (T >= seg0Start && T < seg0End) {
        const progress = (T - seg0Start) / (seg0End - seg0Start)
        const px = p5.lerp(114, 168, progress)
        p5.noStroke()
        p5.fill(BLUE[0], BLUE[1], BLUE[2], 220)
        p5.circle(px, 170, 10)
      }
      // Segment 1: IAM Policy right → Bucket Policy left
      if (T >= seg1Start && T < seg1End) {
        const progress = (T - seg1Start) / (seg1End - seg1Start)
        const px = p5.lerp(278, 342, progress)
        p5.noStroke()
        p5.fill(BLUE[0], BLUE[1], BLUE[2], 220)
        p5.circle(px, 170, 10)
      }
      // Segment 2: Bucket Policy right → S3 left
      if (T >= seg2Start && T < seg2End) {
        const progress = (T - seg2Start) / (seg2End - seg2Start)
        const px = p5.lerp(462, 520, progress)
        p5.noStroke()
        p5.fill(BLUE[0], BLUE[1], BLUE[2], 220)
        p5.circle(px, 170, 10)
      }
    }

    // ── STEP 6: 暗号化 ────────────────────────────────────────────────
    else if (s === 6) {
      const keyBoxY = 118, keyBoxH = 36

      const cards = [
        { name: 'SSE-S3',  sub: 'AWS がキー管理',    keyMgr: 'AWS 自動管理', details: ['追加コストなし', 'デフォルトで有効', 'AES-256 暗号化'], col: GREEN  as [number,number,number] },
        { name: 'SSE-KMS', sub: 'KMS でキー管理',    keyMgr: 'AWS KMS',      details: ['監査ログ記録',  '細かい権限制御',  'CloudTrail 連携'], col: ORANGE as [number,number,number] },
        { name: 'SSE-C',   sub: 'ユーザーがキー管理', keyMgr: 'ユーザー提供', details: ['毎回キーを提供', 'HTTPS 必須',     'AWSはキー非保存'], col: PURPLE as [number,number,number] },
      ]

      cards.forEach((c, i) => {
        const cx = 14 + i * 216

        box(p5, cx, 14, 206, 298, c.col, 12, 0)
        label(p5, c.name, cx + 103, 36, c.col, 15)
        hline(p5, cx + 10, 50, cx + 196, c.col, 1)
        label(p5, c.sub, cx + 103, 68, DARK, 12)

        // KEY MANAGER box
        box(p5, cx + 16, keyBoxY - keyBoxH / 2, 174, keyBoxH, c.col, 25, 0)
        label(p5, 'キー管理: ' + c.keyMgr, cx + 103, keyBoxY, c.col, 12)

        // Detail rows
        c.details.forEach((d, di) => {
          box(p5, cx + 16, 148 + di * 48, 174, 36, DARK, 8, 0)
          label(p5, d, cx + 103, 166 + di * 48, DARK, 11)
        })
      })

      label(p5, 'キー管理の責任: AWS(SSE-S3)  →  共同(SSE-KMS)  →  ユーザー(SSE-C)', W / 2, 324, GRAY, 11)
    }

    // ── STEP 7: 静的Webサイトホスティング ────────────────────────────
    else if (s === 7) {
      // LOOP=200: browser→S3 (blue request), S3→browser (green response), S3→CloudFront (purple)
      const LOOP = 200
      const T = timerRef.current % LOOP

      // Phase constants
      const reqStart = 0,   reqEnd = 40    // browser → S3 request
      const respStart = 50, respEnd = 90   // S3 → browser response
      const cdnStart = 20,  cdnEnd = 60    // S3 → CloudFront CDN

      // ── タイトル（ボックスなし）
      label(p5, '静的 Web サイトホスティング', W/2, 18, DARK, 14)
      label(p5, 'S3バケットだけでHTML/CSS/JSを配信 | CloudFrontを追加してCDN・HTTPS対応', W/2, 38, GRAY, 11)

      // ── ブラウザ（左）  x=8, y=132, w=88, h=80
      box(p5, 8, 132, 88, 80, BLUE, 15, 0)
      label(p5, 'ブラウザ', 52, 162, BLUE, 13)
      label(p5, 'ユーザー', 52, 180, GRAY, 11)

      // ── 矢印1: ブラウザ → S3  (96→158, y=172)
      arrow(p5, 96, 172, 158, 172, DARK, 2)
      label(p5, 'HTTP GET', 127, 162, DARK, 11)

      // ── S3バケット  x=158, y=56, w=210, h=238
      // Flash when response goes out or request arrives
      const s3FlashAlpha = (T >= reqEnd && T < reqEnd + 20) ? 50 : 15
      box(p5, 158, 56, 210, 238, GREEN, s3FlashAlpha, 0)
      if (imgS3.current) p5.image(imgS3.current as any, 163, 60, 24, 24)
      label(p5, 'S3 バケット', 263, 78, GREEN, 13)
      label(p5, '（静的ホスティング）', 263, 96, GREEN, 11)
      hline(p5, 166, 108, 360, GREEN, 1)

      // ── ファイル行（4件 × 高さ38px、y=112から開始）
      const files7 = ['index.html', 'style.css', 'app.js', 'image.png']
      files7.forEach((f, i) => {
        const fy = 112 + i * 44
        box(p5, 168, fy, 192, 36, BLUE, 18, 0)
        label(p5, f, 264, fy + 18, DARK, 12)
      })

      // ── 矢印2: S3 → CloudFront  (368→420, y=172)
      arrow(p5, 368, 172, 420, 172, DARK, 1.5)
      label(p5, 'CDN', 394, 162, PURPLE, 11)

      // ── CloudFront  x=420, y=80, w=220, h=192
      box(p5, 420, 80, 220, 192, PURPLE, 15, 0)
      if (imgCf.current) p5.image(imgCf.current as any, 426, 84, 24, 24)
      label(p5, 'CloudFront', 530, 104, PURPLE, 13)
      label(p5, '（オプション）', 530, 120, PURPLE, 11)
      hline(p5, 428, 134, 632, PURPLE, 1)
      label(p5, 'CDN・HTTPS 対応',     530, 154, GRAY, 12)
      label(p5, '独自ドメイン設定可',  530, 174, GRAY, 11)
      label(p5, 'エッジでキャッシュ', 530, 192, GRAY, 11)
      label(p5, 'グローバル高速配信', 530, 210, GRAY, 11)
      label(p5, '※ CloudFrontなしでもS3単体でホスト可', 530, 252, GRAY, 10)

      // ── エンドポイントURL
      label(p5, 'S3エンドポイント: bucket.s3-website-region.amazonaws.com', W/2, 310, GREEN, 11)

      // Animated request: browser → S3 (blue)
      if (T >= reqStart && T < reqEnd) {
        const progress = (T - reqStart) / (reqEnd - reqStart)
        const px = p5.lerp(96, 158, progress)
        p5.noStroke()
        p5.fill(BLUE[0], BLUE[1], BLUE[2], 220)
        p5.circle(px, 172, 10)
      }

      // Animated response: S3 → browser (green)
      if (T >= respStart && T < respEnd) {
        const progress = (T - respStart) / (respEnd - respStart)
        const px = p5.lerp(158, 96, progress)
        p5.noStroke()
        p5.fill(GREEN[0], GREEN[1], GREEN[2], 220)
        p5.circle(px, 172, 10)
      }

      // CDN cache: S3 → CloudFront (purple)
      if (T >= cdnStart && T < cdnEnd) {
        const progress = (T - cdnStart) / (cdnEnd - cdnStart)
        const px = p5.lerp(368, 420, progress)
        p5.noStroke()
        p5.fill(PURPLE[0], PURPLE[1], PURPLE[2], 220)
        p5.circle(px, 172, 10)
      }
    }

    // ── STEP 8: まとめ ────────────────────────────────────────────────
    else if (s === 8) {
      const headers = ['項目', '説明', 'ポイント']
      const rows = [
        { name: 'バケット',         desc: 'グローバル一意なコンテナ',    point: 'リージョン固有・名前はGlobal',  col: GREEN  },
        { name: 'オブジェクト',     desc: 'キーで識別されるファイル',    point: '最大5TB、マルチパート必要',     col: BLUE   },
        { name: 'Standard',         desc: '高頻度アクセス向け',           point: '99.99%可用性・高コスト',        col: ORANGE },
        { name: 'Glacier',          desc: '長期アーカイブ',               point: 'コスト最低・取得時間大',        col: TEAL   },
        { name: 'バケットポリシー', desc: 'リソースベースアクセス制御',  point: 'IAMポリシーと併用',             col: GREEN  },
        { name: '暗号化(SSE)',       desc: 'サーバーサイド暗号化3種',     point: 'SSE-S3はデフォルト有効',        col: PURPLE },
      ]

      const colW = [160, 230, 240]
      const colX = [10, 170, 400]
      const rowH = 38, headerH = 28, startY = 12

      p5.strokeWeight(1); p5.stroke(180, 185, 200)
      p5.fill(60, 65, 80)
      p5.rect(10, startY, W - 20, headerH, 0)
      headers.forEach((h, ci) => {
        p5.noStroke(); p5.fill(255); p5.textSize(13); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text(h, colX[ci] + colW[ci]/2, startY + headerH/2)
      })

      rows.forEach((row, ri) => {
        const ry = startY + headerH + ri * rowH
        p5.strokeWeight(1); p5.stroke(200, 205, 215)
        p5.fill(ri % 2 === 0 ? 252 : 246, ri % 2 === 0 ? 252 : 248, ri % 2 === 0 ? 254 : 252)
        p5.rect(10, ry, W - 20, rowH, 0)

        // Left accent bar (always visible)
        {
          p5.noStroke()
          p5.fill(row.col[0], row.col[1], row.col[2], 200)
          p5.rect(10, ry, 4, rowH, 0)
        }

        // separators
        p5.stroke(220, 222, 228); p5.strokeWeight(1)
        p5.line(colX[1], ry, colX[1], ry + rowH)
        p5.line(colX[2], ry, colX[2], ry + rowH)

        const vals = [row.name, row.desc, row.point]
        vals.forEach((val, ci) => {
          const col: [number,number,number] = ci === 0 ? row.col : DARK
          p5.noStroke(); p5.fill(...col)
          p5.textSize(ci === 0 ? 12.5 : 12); p5.textAlign(p5.LEFT, p5.CENTER)
          p5.text(val, colX[ci] + 6, ry + rowH/2)
        })
      })

      p5.strokeWeight(1); p5.stroke(180, 185, 200); p5.noFill()
      p5.rect(10, startY, W - 20, headerH + rows.length * rowH, 0)
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
            S3 アーキテクチャ図（ステップ {step}/{TOTAL}）
          </span>
          <span className="text-gray-400 font-normal">{cur.hint}</span>
        </div>
        <Sketch setup={setup} draw={draw} />
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-3">
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
        >{step === TOTAL ? '完了！' : '次へ →'}</button>
      </div>

      {step === TOTAL && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 text-center">
          <p className="font-bold text-orange-700 mb-1">S3初級コンテンツ完了！</p>
          <p className="text-sm text-orange-600">下の練習問題で理解度を確認しましょう。</p>
        </div>
      )}
    </div>
  )
}
