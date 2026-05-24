'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

const STEPS = [
  {
    id: 1,
    title: 'バージョニング',
    description: 'バージョニングを有効にすると、同一キーのオブジェクトが更新されるたびに新しいバージョンが追加されます。最新のv3から最古のv1まで全バージョンが保持されます。',
    keyPoints: [
      '一度有効にすると無効化（Disabled）には戻せない（一時停止は可能）',
      '各バージョンはユニークなVersion IDで識別される',
      '全バージョン分のストレージコストが発生する',
      'MFA削除を有効にするとさらに強固な保護が可能',
    ],
    hint: 'バージョニングは「有効化したら無効化できない」が試験頻出',
  },
  {
    id: 2,
    title: '削除マーカー',
    description: 'バージョニングが有効な状態でオブジェクトを削除すると、実データは消えず「削除マーカー」が最新バージョンとして追加されます。これが論理削除です。',
    keyPoints: [
      '通常の削除 → 削除マーカーを追加（実データは残る）',
      '削除マーカーを削除すると元のオブジェクトが復元される',
      '完全削除 = バージョンIDを指定して削除',
      'MFA削除でバージョン完全削除に追加認証が必要',
    ],
    hint: '削除マーカーは「実際には消えていない」論理削除',
  },
  {
    id: 3,
    title: 'ライフサイクルポリシー',
    description: 'ライフサイクルポリシーを設定すると、時間の経過に応じてストレージクラスを自動移行したり、オブジェクトを自動削除したりできます。',
    keyPoints: [
      'Standard → Standard-IA（30日以上）→ Glacier → Deep Archive の順に移行',
      '現行バージョンと非現行バージョンに別々のルールを設定できる',
      '不完全なマルチパートアップロードの自動クリーンアップも可能',
      'プレフィックスやタグでルールの適用対象を絞り込める',
    ],
    hint: '「30日後にIA、90日後にGlacier」のような時間軸での自動管理',
  },
  {
    id: 4,
    title: 'CRR（クロスリージョンレプリケーション）',
    description: 'CRRは異なるリージョン間でS3オブジェクトを自動的にレプリケーションします。DR対策や低レイテンシーアクセスに活用されます。',
    keyPoints: [
      '送信元・送信先の両方でバージョニングを有効にする必要がある',
      'レプリケーション設定前の既存オブジェクトはコピーされない',
      '異なるAWSアカウント間のレプリケーションも可能',
      '削除マーカーはデフォルトではレプリケートされない',
    ],
    hint: 'CRR = Cross Region Replication、災害対策・グローバル展開向け',
  },
  {
    id: 5,
    title: 'SRR（同一リージョンレプリケーション）',
    description: 'SRRは同一リージョン内の別バケットにオブジェクトをレプリケーションします。ログ集約や環境分離に活用されます。',
    keyPoints: [
      '同一リージョン内で別バケットへ自動コピー',
      'ログ集約（複数バケットのログを1か所に集める）に最適',
      'テスト環境と本番環境のデータ同期にも使用可能',
      'バージョニングが両バケットで必要（CRRと同様）',
    ],
    hint: 'SRR = Same Region Replication、ログ集約・環境分離向け',
  },
  {
    id: 6,
    title: 'イベント通知',
    description: 'S3バケットへのオブジェクト操作（作成・削除など）をトリガーとして、Lambda・SQS・SNSに通知を送信できます。',
    keyPoints: [
      'トリガーイベント：ObjectCreated / ObjectRemoved / ObjectRestore など',
      'Lambda：サーバーレスで即時処理（画像リサイズ、データ変換など）',
      'SQS：メッセージキューに積んで非同期処理',
      'SNS：複数宛先へのファンアウト通知',
    ],
    hint: '画像アップロード時に自動でサムネイル生成はS3→Lambdaの典型例',
  },
  {
    id: 7,
    title: 'マルチパートアップロード',
    description: '大きなファイルを複数のパーツに分割して並列アップロードし、S3側で最終的に結合します。信頼性と速度が向上します。',
    keyPoints: [
      '100MBを超えるファイルには推奨、5GBを超えるファイルには必須',
      '最大10,000パーツ（各パーツ5MB〜5GB）に分割可能',
      '途中で失敗した場合は失敗したパーツのみ再送できる',
      '不完全なマルチパートアップロードはライフサイクルポリシーで自動削除推奨',
    ],
    hint: '5GBを超えるファイルは必ずマルチパートアップロードが必要',
  },
  {
    id: 8,
    title: 'まとめ',
    description: 'S3中級の重要ポイントを整理します。試験で頻出の概念を確認しましょう。',
    keyPoints: [
      'バージョニング：有効化後は無効化不可、削除マーカーで論理削除',
      'ライフサイクル：時間軸でストレージクラスを自動移行',
      'CRR：異リージョン、SRR：同一リージョン、両方バージョニング必須',
      'イベント通知：Lambda/SQS/SNSと連携してサーバーレス処理',
    ],
    hint: 'CRRとSRRの違い（リージョン）とユースケース（DR vs ログ集約）を整理',
  },
]

const TOTAL = STEPS.length
const W = 660
const H = 340

const ORANGE: [number,number,number] = [255, 153,  0]
const BLUE:   [number,number,number] = [ 35, 100,170]
const GREEN:  [number,number,number] = [122, 161, 22]
const PURPLE: [number,number,number] = [140,  79,255]
const PINK:   [number,number,number] = [255,  79,139]  // SQS / SNS brand color
const GRAY:   [number,number,number] = [100, 116,139]
const DARK:   [number,number,number] = [ 50,  55, 65]
const RED:    [number,number,number] = [200,  55, 55]
const TEAL:   [number,number,number] = [ 14, 165,140]

export default function S3IntermediateStepper() {
  const [step, setStep] = useState(1)
  const stepRef  = useRef(1)
  const timerRef = useRef(0)
  const imgS3     = useRef<unknown>(null)
  const imgLambda = useRef<unknown>(null)
  const imgSQS    = useRef<unknown>(null)
  const imgSNS    = useRef<unknown>(null)

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

  const setup = (p5: any, ref: any) => {
    p5.createCanvas(W, H).parent(ref)
    p5.frameRate(30)
    p5.loadImage('/icons/aws/s3.svg', (img: unknown) => { imgS3.current = img })
    p5.loadImage('/icons/aws/Lambda.svg', (img: unknown) => { imgLambda.current = img })
    p5.loadImage('/icons/aws/Simple Queue Service.svg', (img: unknown) => { imgSQS.current = img })
    p5.loadImage('/icons/aws/Simple Notification Service.svg', (img: unknown) => { imgSNS.current = img })
  }

  const draw = (p5: any) => {
    const s = stepRef.current
    timerRef.current++
    p5.background(248, 250, 252)
    p5.textFont('sans-serif')

    // ── STEP 1: バージョニング ────────────────────────────────────────
    if (s === 1) {
      // Center key label
      label(p5, 'オブジェクトキー: documents/report.pdf', W/2, 22, DARK, 13)

      // 3 versions stacked (v3 top = newest, v1 bottom = oldest)
      const versions = [
        { ver: 'v3 (最新)', vid: 'v-abc123', date: '2024-03-15', col: GREEN, y: 40 },
        { ver: 'v2',        vid: 'v-def456', date: '2024-02-01', col: BLUE,  y: 130 },
        { ver: 'v1 (最古)', vid: 'v-ghi789', date: '2024-01-10', col: GRAY,  y: 220 },
      ]
      versions.forEach((v, i) => {
        box(p5, 60, v.y, 340, 74, v.col, 18, 3)
        label(p5, v.ver, 230, v.y + 20, v.col, 14)
        label(p5, 'Version ID: ' + v.vid, 230, v.y + 40, DARK, 12)
        label(p5, v.date, 230, v.y + 57, GRAY, 11)
        // Version number on left
        box(p5, 60, v.y, 48, 74, v.col, 30, 3)
        label(p5, 'V' + (3-i), 84, v.y+37, v.col, 15)
      })

      // Arrows showing time flow (downward)
      arrow(p5, 230, 114, 230, 128, DARK, 1.5)
      arrow(p5, 230, 204, 230, 218, DARK, 1.5)

      // Right panel: info
      box(p5, 430, 14, 220, 312, BLUE, 10, 4)
      label(p5, 'バージョニングの仕組み', 540, 36, BLUE, 13)
      hline(p5, 440, 50, 640, BLUE, 1)

      const notes = [
        ['GET', '→ 最新バージョン(v3)返却'],
        ['DELETE', '→ 削除マーカー追加'],
        ['PUT', '→ 新バージョン追加'],
        ['バージョンID', '指定で特定版を取得'],
      ]
      notes.forEach(([k, v], i) => {
        label(p5, k + ':', 448, 75 + i*50, BLUE, 12, 'left')
        label(p5, v, 448, 93 + i*50, DARK, 11, 'left')
      })

      badge(p5, 540, 288, '有効化後は無効化不可', RED, 140)
    }

    // ── STEP 2: 削除マーカー ──────────────────────────────────────────
    else if (s === 2) {
      // Flow: Object -> Delete -> DeleteMarker -> Restore
      const steps_ = [
        { lbl: 'オブジェクト\n（実データ）', col: BLUE,   x: 20  },
        { lbl: '通常の\nDELETE操作',        col: RED,    x: 190 },
        { lbl: '削除マーカー\n（論理削除）', col: ORANGE, x: 360 },
        { lbl: '実データ\n（保持中）',       col: GREEN,  x: 530 },
      ]

      steps_.forEach((st, i) => {
        box(p5, st.x, 100, 140, 80, st.col, 18, 3)
        p5.noStroke(); p5.fill(...st.col); p5.textSize(13); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text(st.lbl, st.x+70, 140)

        if (i < steps_.length - 1) {
          const nextX = steps_[i+1].x
          arrow(p5, st.x + 140, 140, nextX, 140, DARK, 2)
        }
      })

      // Step labels above boxes
      const stepLabels = ['Before', 'Action', 'After (最新版)', 'S3内部状態']
      steps_.forEach((st, i) => {
        label(p5, stepLabels[i], st.x + 70, 86, GRAY, 11)
      })

      // Explanation below
      box(p5, 14, 212, 632, 112, DARK, 8, 4)
      label(p5, '削除マーカーのフロー', W/2, 232, DARK, 14)
      hline(p5, 24, 246, 636, DARK, 1)

      const explains = [
        '通常の DELETE → 最新バージョンとして「削除マーカー」が追加される',
        '実データは消えていない（全バージョンがS3に残存）',
        '削除マーカー自体を削除 → 元のオブジェクトが「復元」される',
        '完全削除 = バージョンIDを明示して DELETE → そのバージョンのみ削除',
      ]
      explains.forEach((e, i) => {
        label(p5, e, 26, 264 + i*18, DARK, 11, 'left')
      })
    }

    // ── STEP 3: ライフサイクルポリシー ───────────────────────────────
    else if (s === 3) {
      // Time axis (horizontal)
      const axisY = 260
      const axisX1 = 30, axisX2 = 626
      hline(p5, axisX1, axisY, axisX2, DARK, 1.5)
      arrow(p5, axisX2-2, axisY, axisX2+10, axisY, DARK, 1.5)
      label(p5, '時間経過', axisX2-30, axisY+18, DARK, 12)

      // Time markers
      const ticks = [
        { x: 90,  day: 'Day 0' },
        { x: 220, day: '30日後' },
        { x: 370, day: '90日後' },
        { x: 510, day: '180日後' },
      ]
      ticks.forEach(t => {
        vline(p5, t.x, axisY-6, axisY+6, DARK, 1.5)
        label(p5, t.day, t.x, axisY+22, GRAY, 11)
      })

      // Storage class boxes above axis
      const classes = [
        { name: 'Standard',       col: ORANGE, x: 30,  w: 158 },
        { name: 'Standard-IA',    col: BLUE,   x: 190, w: 148 },
        { name: 'Glacier',        col: TEAL,   x: 340, w: 136 },
        { name: 'Deep Archive',   col: PURPLE, x: 478, w: 148 },
      ]
      classes.forEach(c => {
        box(p5, c.x, 80, c.w, 120, c.col, 18, 3)
        label(p5, c.name, c.x + c.w/2, 108, c.col, 13)

        // Cost indicator
        const costLabels = ['高コスト', '中コスト', '低コスト', '最低コスト']
        label(p5, costLabels[classes.indexOf(c)], c.x + c.w/2, 132, DARK, 11)

        // Retrieval time
        const retLabels = ['即座', '即座（+料金）', '分〜時間', '最大12時間']
        label(p5, '取得: ' + retLabels[classes.indexOf(c)], c.x + c.w/2, 152, GRAY, 11)

        // Connect to axis
        vline(p5, c.x + c.w/2, 200, axisY-2, c.col, 1.5)
      })

      // Transition arrows (on axis)
      arrow(p5, 190, axisY, 220, axisY, ORANGE, 2.5)
      arrow(p5, 340, axisY, 370, axisY, BLUE, 2.5)
      arrow(p5, 478, axisY, 510, axisY, TEAL, 2.5)

      // Policy note
      box(p5, 14, 14, 632, 56, GREEN, 10, 3)
      label(p5, 'ライフサイクルポリシー', W/2, 30, GREEN, 13)
      label(p5, '時間経過に応じてストレージクラスを自動移行 → コストを最適化', W/2, 52, DARK, 12)
    }

    // ── STEP 4: CRR ───────────────────────────────────────────────────
    else if (s === 4) {
      const LOOP = 280
      const T = timerRef.current % LOOP
      const travelDur = 55
      const objs = ['photo-001.jpg', 'report.pdf', 'data.csv']
      // Each object departs in sequence
      const flights = [
        { start: 10,  idx: 0 },
        { start: 100, idx: 1 },
        { start: 190, idx: 2 },
      ]
      const arrived = new Set(flights.filter(f => T >= f.start + travelDur).map(f => f.idx))

      // Left region (source)
      box(p5, 14, 14, 290, 312, ORANGE, 10)
      label(p5, 'ap-northeast-1（東京）', 159, 34, ORANGE, 13)

      // Source bucket
      box(p5, 30, 56, 258, 200, GREEN, 0)
      if (imgS3.current) p5.image(imgS3.current as any, 30, 56, 24, 24)
      label(p5, 'ソースバケット', 159, 92, GREEN, 13)
      label(p5, 'バージョニング: 有効', 159, 108, DARK, 11)
      objs.forEach((o, i) => {
        box(p5, 44, 118 + i*40, 230, 30, GREEN, 15)
        label(p5, o, 159, 133 + i*40, DARK, 12)
      })

      // Center arrow
      const midY = 170
      arrow(p5, 304, midY, 354, midY, GREEN, 3)
      label(p5, 'CRR', 329, midY - 18, GREEN, 12)
      label(p5, '（自動）', 329, midY + 18, GREEN, 11)

      // Right region (destination)
      box(p5, 356, 14, 290, 312, BLUE, 10)
      label(p5, 'us-east-1（バージニア）', 501, 34, BLUE, 13)

      // Dest bucket
      box(p5, 372, 56, 258, 200, GREEN, 0)
      if (imgS3.current) p5.image(imgS3.current as any, 372, 56, 24, 24)
      label(p5, '送信先バケット', 501, 92, GREEN, 13)
      label(p5, 'バージョニング: 有効', 501, 108, DARK, 11)

      // Dest objects: placeholder until each object arrives
      objs.forEach((o, i) => {
        if (arrived.has(i)) {
          const justArrived = T >= flights[i].start + travelDur && T < flights[i].start + travelDur + 20
          box(p5, 386, 118 + i*40, 230, 30, GREEN, justArrived ? 60 : 15)
          label(p5, o, 501, 133 + i*40, DARK, 12)
        } else {
          box(p5, 386, 118 + i*40, 230, 30, GRAY, 5)
          label(p5, '---', 501, 133 + i*40, GRAY, 11)
        }
      })

      // Animated packets flying from source to destination
      flights.forEach(f => {
        if (T >= f.start && T < f.start + travelDur) {
          const progress = (T - f.start) / travelDur
          const cy = 133 + f.idx * 40
          const px = p5.lerp(288, 372, progress)
          p5.noStroke()
          p5.fill(GREEN[0], GREEN[1], GREEN[2], 210)
          p5.rect(px - 48, cy - 11, 96, 22, 0)
          p5.fill(255); p5.textSize(10); p5.textAlign(p5.CENTER, p5.CENTER)
          p5.text(objs[f.idx], px, cy)
        }
      })

      // Notes
      box(p5, 14, 280, 632, 54, DARK, 8)
      label(p5, '用途: 災害対策(DR)・規制対応・グローバル低レイテンシー', W/2, 298, DARK, 12)
      label(p5, '注意: 設定前の既存オブジェクトは対象外・削除マーカーはデフォルト非レプリケート', W/2, 318, GRAY, 11)
    }

    // ── STEP 5: SRR ───────────────────────────────────────────────────
    else if (s === 5) {
      const LOOP = 280
      const T = timerRef.current % LOOP
      const travelDur = 55
      const appNames = ['app-a-logs', 'app-b-logs', 'app-c-logs']
      const logItems = ['app-a/2024-03.log', 'app-b/2024-03.log', 'app-c/2024-03.log']
      const flights = [
        { start: 10,  idx: 0 },
        { start: 100, idx: 1 },
        { start: 190, idx: 2 },
      ]
      const arrived = new Set(flights.filter(f => T >= f.start + travelDur).map(f => f.idx))

      // Region header
      box(p5, 14, 14, 632, 50, BLUE, 8)
      label(p5, 'ap-northeast-1（東京） - 同一リージョン内', W/2, 39, BLUE, 13)

      // Left bucket (source)
      box(p5, 14, 80, 260, 220, GREEN, 0)
      if (imgS3.current) p5.image(imgS3.current as any, 14, 80, 24, 24)
      label(p5, 'ソースバケット', 144, 114, GREEN, 13)
      label(p5, '（各アプリ）', 144, 130, GREEN, 11)
      appNames.forEach((a, i) => {
        box(p5, 26, 146 + i*44, 236, 32, GREEN, 15)
        label(p5, a, 144, 162 + i*44, DARK, 12)
      })

      // Arrow
      arrow(p5, 274, 190, 384, 190, GREEN, 3)
      label(p5, 'SRR', 329, 174, GREEN, 13)
      label(p5, '（自動）', 329, 208, GREEN, 11)

      // Right bucket (destination)
      box(p5, 384, 80, 262, 220, GREEN, 0)
      if (imgS3.current) p5.image(imgS3.current as any, 384, 80, 24, 24)
      label(p5, 'ログ集約バケット', 515, 114, GREEN, 13)
      label(p5, '（集約先）', 515, 130, GREEN, 11)

      // Dest log items: placeholder until each one arrives
      logItems.forEach((l, i) => {
        if (arrived.has(i)) {
          const justArrived = T >= flights[i].start + travelDur && T < flights[i].start + travelDur + 20
          box(p5, 398, 146 + i*44, 234, 32, GREEN, justArrived ? 60 : 15)
          label(p5, l, 515, 162 + i*44, DARK, 11)
        } else {
          box(p5, 398, 146 + i*44, 234, 32, GRAY, 5)
          label(p5, '---', 515, 162 + i*44, GRAY, 11)
        }
      })

      // Animated packets flying from source to destination
      flights.forEach(f => {
        if (T >= f.start && T < f.start + travelDur) {
          const progress = (T - f.start) / travelDur
          const cy = 162 + f.idx * 44
          const px = p5.lerp(274, 384, progress)
          p5.noStroke()
          p5.fill(GREEN[0], GREEN[1], GREEN[2], 210)
          p5.rect(px - 48, cy - 11, 96, 22, 0)
          p5.fill(255); p5.textSize(10); p5.textAlign(p5.CENTER, p5.CENTER)
          p5.text(logItems[f.idx], px, cy)
        }
      })

      // Use case badges
      badge(p5, 144, 320, 'ログ集約', ORANGE, 70)
      badge(p5, 515, 320, '環境分離', BLUE, 70)
    }

    // ── STEP 6: イベント通知 ──────────────────────────────────────────
    else if (s === 6) {
      const LOOP = 210
      const T = timerRef.current % LOOP
      const uploadDur = 40
      const flashEnd = 65
      const notifyStarts = [65, 88, 111]
      const notifyDur = 38

      const targets = [
        { name: 'Lambda', sub: 'サーバーレス処理', col: ORANGE, y: 52,  img: imgLambda },
        { name: 'SQS',    sub: '非同期キュー処理', col: PINK,   y: 152, img: imgSQS    },
        { name: 'SNS',    sub: 'ファンアウト通知', col: PINK,   y: 252, img: imgSNS    },
      ]
      // 各行の最大幅 = pw(138) - 左余白(10) - 右余白(8) = 120px
      // textSize(10): 日本語1字≒10px、ASCII1字≒6px、"• "≒12px
      // → 日本語は最大10字以内、ASCII混在は要計算
      const tooltips = [
        ['画像の自動リサイズ',    // 9J → 90+12=102px ✓
         'データ変換処理',        // 7J → 70+12= 82px ✓
         '即時実行・低コスト'],   // 9J → 90+12=102px ✓
        ['処理のバッファリング',  // 10J → 100+12=112px ✓
         '失敗パーツの再試行',    // 9J →  90+12=102px ✓
         '速度調整が容易'],       // 7J →  70+12= 82px ✓
        ['複数先へ同時配信',      // 8J →  80+12= 92px ✓
         'Email/SMS通知',         // 9A×6+2J×10=74+12= 86px ✓
         'EventBridge連携'],      // 11A×6+2J×10=86+12= 98px ✓
      ]

      // Hover detection (p5.mouseX/Y are canvas-relative)
      const mx = p5.mouseX, my = p5.mouseY
      let hoveredIdx = -1
      targets.forEach((t, i) => {
        if (mx >= 310 && mx <= 510 && my >= t.y && my <= t.y + 58) hoveredIdx = i
      })
      p5.cursor(hoveredIdx >= 0 ? 'pointer' : 'default')

      // Title
      label(p5, 'S3 イベント通知', W/2, 20, DARK, 14)
      label(p5, 'オブジェクト操作をトリガーに Lambda/SQS/SNS へ自動通知', W/2, 40, DARK, 11)

      // S3 bucket — flashes green when upload arrives
      const flashProg = T >= uploadDur && T < flashEnd
        ? (T - uploadDur) / (flashEnd - uploadDur) : 0
      box(p5, 14, 52, 160, 250, GREEN, Math.sin(flashProg * Math.PI) * 50)
      if (imgS3.current) p5.image(imgS3.current as any, 14, 52, 26, 26)
      label(p5, 'S3 バケット', 94, 86, GREEN, 13)
      hline(p5, 22, 100, 166, GREEN, 1)
      const events = ['ObjectCreated', 'ObjectRemoved', 'ObjectRestore']
      events.forEach((e, i) => {
        label(p5, e, 94, 118 + i*22, DARK, 11)
      })

      // Targets — highlight fill on hover
      targets.forEach((t, i) => {
        const cy = t.y + 29
        arrow(p5, 174, cy, 310, cy, t.col, 2)
        box(p5, 310, t.y, 200, 58, t.col, i === hoveredIdx ? 35 : 0)
        if (t.img && t.img.current) p5.image(t.img.current as any, 310, t.y, 24, 24)
        label(p5, t.name, 420, t.y + 22, t.col, 14)
        label(p5, t.sub, 420, t.y + 42, DARK, 11)
      })

      // Upload ball entering S3 from left
      if (T < uploadDur) {
        const progress = T / uploadDur
        const px = p5.lerp(-12, 94, progress)
        p5.noStroke()
        p5.fill(GRAY[0], GRAY[1], GRAY[2], 200)
        p5.ellipse(px, 170, 22, 22)
        p5.fill(255); p5.textSize(9); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('PUT', px, 170)
      }

      // Notification packets fanning out
      targets.forEach((t, i) => {
        const ns = notifyStarts[i]
        if (T >= ns && T < ns + notifyDur) {
          const progress = (T - ns) / notifyDur
          const cy = t.y + 29
          const px = p5.lerp(174, 310, progress)
          p5.noStroke()
          p5.fill(t.col[0], t.col[1], t.col[2], 220)
          p5.rect(px - 28, cy - 10, 56, 20, 0)
          p5.fill(255); p5.textSize(10); p5.textAlign(p5.CENTER, p5.CENTER)
          p5.text('通知', px, cy)
        }
      })

      // Right detail panel — fixed position, never overlaps other elements
      // x=514: targets右端(510)から4px gap / pw=138: 514+138=652 (canvas660内)
      const px = 514, py = 52, pw = 138, ph = 250
      if (hoveredIdx >= 0) {
        const t = targets[hoveredIdx]
        // Panel background
        p5.noStroke()
        p5.fill(25, 30, 40, 225)
        p5.rect(px, py, pw, ph, 0)
        // Color accent bar on left edge
        p5.fill(t.col[0], t.col[1], t.col[2])
        p5.rect(px, py, 3, ph, 0)
        // Service name
        p5.fill(t.col[0], t.col[1], t.col[2])
        p5.textSize(13); p5.textAlign(p5.LEFT, p5.CENTER)
        p5.text(t.name, px + 10, py + 20)
        // Divider
        p5.stroke(t.col[0], t.col[1], t.col[2], 80)
        p5.strokeWeight(1)
        p5.line(px + 8, py + 34, px + pw - 8, py + 34)
        // Section label
        p5.noStroke()
        p5.fill(150, 160, 175)
        p5.textSize(10); p5.textAlign(p5.LEFT, p5.CENTER)
        p5.text('ユースケース例', px + 10, py + 48)
        // Bullet items
        p5.fill(205, 215, 228)
        tooltips[hoveredIdx].forEach((line, i) => {
          p5.text('• ' + line, px + 10, py + 66 + i * 22)
        })
      } else {
        // Hint panel when nothing is hovered
        p5.noStroke()
        p5.fill(80, 90, 105, 60)
        p5.rect(px, py, pw, ph, 0)
        p5.fill(130, 140, 158)
        p5.textSize(11); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('サービスに\nホバーで\n詳細表示', px + pw / 2, py + ph / 2)
      }
    }

    // ── STEP 7: マルチパートアップロード ─────────────────────────────
    else if (s === 7) {
      const LOOP = 250
      const T = timerRef.current % LOOP
      const flyStart = 15, flyDur = 60, flyEnd = 75
      // T=75-105: failure state (Part 2 NG, Parts 1&3 OK)
      const retryStart = 105, retryDur = 50, retryEnd = 155
      // T=155-190: S3 combine flash
      const combineEnd = 190

      // Large file
      box(p5, 14, 80, 130, 180, PURPLE, 18)
      label(p5, '大容量ファイル', 79, 110, PURPLE, 12)
      label(p5, '（例: 10GB）', 79, 130, DARK, 11)
      hline(p5, 22, 148, 136, PURPLE, 1)
      label(p5, '100MB推奨', 79, 170, GRAY, 11)
      label(p5, '5GB超は必須', 79, 190, RED, 11)

      // Comb split
      hline(p5, 144, 170, 175, DARK, 1.5)
      label(p5, '分割', 158, 160, DARK, 11)
      vline(p5, 175, 92, 272, DARK, 1.5)

      const chunks = [
        { lbl: 'Part 1', sub: '(0-3.3GB)',   y: 60  },
        { lbl: 'Part 2', sub: '(3.3-6.6GB)', y: 150 },
        { lbl: 'Part 3', sub: '(6.6-10GB)',  y: 240 },
      ]

      // Chunk boxes + comb arrows + parallel guide arrows
      chunks.forEach((c, i) => {
        arrow(p5, 175, c.y + 32, 186, c.y + 32, DARK, 1.5)
        box(p5, 186, c.y, 130, 64, BLUE, 18)
        label(p5, c.lbl, 251, c.y + 24, BLUE, 13)
        label(p5, c.sub, 251, c.y + 44, DARK, 11)
        arrow(p5, 316, c.y + 32, 434, c.y + 32, BLUE, 1.5)
      })

      // Status label
      if (T < flyEnd) {
        label(p5, T >= flyStart ? '並列アップロード中...' : '並列アップロード', 375, 42, BLUE, 11)
      } else if (T < retryStart) {
        label(p5, 'Part 2 送信失敗 — 失敗パーツのみ再送', 375, 42, RED, 11)
      } else if (T < retryEnd) {
        label(p5, 'Part 2 のみ再送中...', 375, 42, ORANGE, 11)
      } else {
        label(p5, '全パーツ受信完了 — 結合中', 375, 42, GREEN, 11)
      }

      // S3 destination — flashes when all chunks received
      const s3FlashProg = T >= retryEnd && T < combineEnd
        ? (T - retryEnd) / (combineEnd - retryEnd) : 0
      box(p5, 434, 80, 130, 180, GREEN, Math.sin(s3FlashProg * Math.PI) * 40)
      if (imgS3.current) p5.image(imgS3.current as any, 434, 80, 26, 26)
      label(p5, 'S3', 499, 116, GREEN, 14)
      label(p5, 'バケット', 499, 132, GREEN, 13)
      hline(p5, 442, 148, 556, GREEN, 1)
      label(p5, '各パーツを結合', 499, 172, DARK, 11)
      label(p5, '1オブジェクトに', 499, 190, DARK, 11)

      // Complete
      if (T >= combineEnd) {
        arrow(p5, 564, 170, 608, 170, GREEN, 2)
        box(p5, 608, 140, 44, 60, GREEN, 18)
        label(p5, '完成', 630, 170, GREEN, 13)
      }

      // OK/NG indicators at S3 left edge (shown after first flight)
      if (T >= flyEnd) {
        chunks.forEach((c, i) => {
          const cy = c.y + 32
          const isNG = i === 1 && T < retryEnd  // Part 2 NG until retry completes
          const col = isNG ? RED : GREEN
          p5.noStroke(); p5.fill(col[0], col[1], col[2], 200)
          p5.rect(436, cy - 9, 20, 18, 0)
          p5.fill(255); p5.textSize(9); p5.textAlign(p5.CENTER, p5.CENTER)
          p5.text(isNG ? 'NG' : 'OK', 446, cy)
        })
      }

      // Phase 1: all 3 fly in parallel
      if (T >= flyStart && T < flyEnd) {
        const progress = (T - flyStart) / flyDur
        chunks.forEach(c => {
          const cy = c.y + 32
          const px = p5.lerp(316, 434, progress)
          p5.noStroke()
          p5.fill(BLUE[0], BLUE[1], BLUE[2], 210)
          p5.rect(px - 30, cy - 11, 60, 22, 0)
          p5.fill(255); p5.textSize(10); p5.textAlign(p5.CENTER, p5.CENTER)
          p5.text(c.lbl, px, cy)
        })
      }

      // Phase 2: only Part 2 re-flies (orange = retry)
      if (T >= retryStart && T < retryEnd) {
        const progress = (T - retryStart) / retryDur
        const cy = chunks[1].y + 32  // 182
        const px = p5.lerp(316, 434, progress)
        p5.noStroke()
        p5.fill(ORANGE[0], ORANGE[1], ORANGE[2], 220)
        p5.rect(px - 34, cy - 12, 68, 24, 0)
        p5.fill(255); p5.textSize(10); p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('Part 2 (再送)', px, cy)
      }

      // Bottom note
      box(p5, 14, 294, 632, 38, DARK, 8)
      label(p5, '失敗したパーツのみ再送可 ｜ 不完全なアップロードはライフサイクルポリシーで自動削除推奨', W/2, 313, DARK, 11)
    }

    // ── STEP 8: まとめ ────────────────────────────────────────────────
    else if (s === 8) {
      const headers = ['機能', '説明', '注意ポイント']
      const rows = [
        { name: 'バージョニング',     desc: '複数バージョン保持',           note: '有効化後は無効化不可',          col: BLUE   },
        { name: '削除マーカー',       desc: '論理削除・実データ保持',       note: 'バージョンID指定で完全削除',     col: ORANGE },
        { name: 'ライフサイクル',     desc: 'ストレージクラス自動移行',      note: '30日以上でIA移行可能',          col: TEAL   },
        { name: 'CRR',               desc: '異リージョンレプリカ',          note: '両バケットでバージョニング必須', col: GREEN  },
        { name: 'SRR',               desc: '同一リージョンレプリカ',        note: 'ログ集約・環境分離に使用',       col: BLUE   },
        { name: 'イベント通知',       desc: 'Lambda/SQS/SNS連携',           note: 'EventBridgeでより柔軟に',       col: PURPLE },
      ]

      const colW = [140, 230, 258]
      const colX = [10, 150, 380]
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
        p5.stroke(220, 222, 228); p5.strokeWeight(1)
        p5.line(colX[1], ry, colX[1], ry + rowH)
        p5.line(colX[2], ry, colX[2], ry + rowH)
        const vals = [row.name, row.desc, row.note]
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
                i + 1 === step ? 'bg-blue-500' : i + 1 < step ? 'bg-blue-300' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-50">
        <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-gray-600 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
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
              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">✓</span>
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
                i + 1 === step ? 'bg-blue-500 scale-125' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setStep(s => Math.min(TOTAL, s + 1))}
          disabled={step === TOTAL}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >{step === TOTAL ? '完了！' : '次へ →'}</button>
      </div>

      {step === TOTAL && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 text-center">
          <p className="font-bold text-blue-700 mb-1">S3中級コンテンツ完了！</p>
          <p className="text-sm text-blue-600">下の練習問題で理解度を確認しましょう。</p>
        </div>
      )}
    </div>
  )
}
