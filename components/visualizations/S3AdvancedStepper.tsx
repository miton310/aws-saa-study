'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

const Sketch = dynamic(() => import('react-p5'), { ssr: false })

const STEPS = [
  {
    id: 1,
    title: 'S3 Transfer Acceleration',
    description: 'S3 Transfer AccelerationはCloudFrontのエッジロケーションを経由して、グローバルからのS3アップロードを大幅に高速化します。',
    keyPoints: [
      'エッジロケーション → AWSバックボーンネットワーク経由でS3に転送',
      '遠距離（海外 → 東京）で最大300%の速度改善',
      '速度が改善しない場合は追加料金なし（コスト安心）',
      'バケット単位で有効化。専用エンドポイントURLを使用',
    ],
    hint: 'エッジ → バックボーン経由で長距離転送を高速化',
  },
  {
    id: 2,
    title: 'マルチパートアップロード（詳細）',
    description: '5GBを超えるファイルのアップロードにはマルチパートアップロードが必須です。ファイルをチャンクに分割して並列アップロードし、S3側で結合します。',
    keyPoints: [
      '100MBを超えるファイルには推奨、5GBを超えるファイルには必須',
      '最大10,000パーツ（各パーツ5MB以上5GB以下）に分割',
      '並列アップロードでネットワーク帯域を最大限活用',
      '途中失敗時は失敗パーツのみ再送 → 転送コスト削減',
    ],
    hint: '5GBを超えるファイルはマルチパートアップロード必須',
  },
  {
    id: 3,
    title: 'Presigned URL',
    description: 'Presigned URLを使うと、一時的なアクセス権限を持つURLを生成してクライアントがS3へ直接アクセスできます。アプリサーバーを経由しないため効率的です。',
    keyPoints: [
      'アプリサーバーがAWS SDKでPresigned URLを生成（有効期限付き）',
      'クライアントはURLを使ってS3に直接アップロード/ダウンロード',
      'アプリサーバーを経由しないためスループット向上・コスト削減',
      'デフォルト有効期限は1時間（最大7日間）',
    ],
    hint: 'Presigned URL = 一時的なS3アクセス権をURLに埋め込む',
  },
  {
    id: 4,
    title: 'S3 Object Lock - ガバナンスモード',
    description: 'ガバナンスモードはオブジェクトを保護しますが、特定の権限（s3:BypassGovernanceRetention）を持つ特権ユーザーのみが保持設定を変更・削除できます。',
    keyPoints: [
      'WORM（Write Once Read Many）でオブジェクトを不変化',
      '特権ユーザーはバイパス権限があれば保持期間を変更できる',
      'バージョニングの有効化が前提条件',
      '規制上必要だが例外を許容できる場合に使用',
    ],
    hint: 'ガバナンスモード = 特権ユーザーなら変更可（柔軟性あり）',
  },
  {
    id: 5,
    title: 'S3 Object Lock - コンプライアンスモード',
    description: 'コンプライアンスモードは保持期間中、ルートユーザーを含む誰もオブジェクトを変更・削除できません。最も厳格なデータ保護を提供します。',
    keyPoints: [
      'ルートユーザーを含む誰も保持期間中はデータを変更・削除不可',
      '保持期間の短縮も不可（延長のみ可能）',
      '金融・医療などの法規制対応（SEC Rule 17a-4など）に使用',
      'リーガルホールド：保持期間なしの無期限ロック',
    ],
    hint: 'コンプライアンスモード = 誰も変更できない（最強保護）',
  },
  {
    id: 6,
    title: 'S3 Select',
    description: 'S3 Selectを使うと、オブジェクト全体をダウンロードせずに、SQL式でフィルタリングした必要なデータだけをS3側で抽出できます。',
    keyPoints: [
      'CSV・JSON・Parquetファイルに対してSQLクエリを実行可能',
      '最大400%の速度改善、80%のコスト削減を実現',
      'S3側でフィルタリングするため転送データ量が大幅削減',
      'Glacier Selectで圧縮アーカイブファイルへも適用可能',
    ],
    hint: 'S3 Select = S3が代わりにクエリ実行して必要な行だけ返す',
  },
  {
    id: 7,
    title: 'S3 Access Points',
    description: 'S3 Access Pointsを使うと、1つのバケットに対して用途ごとに複数のアクセスポイントを作成し、きめ細かなアクセス制御を実現できます。',
    keyPoints: [
      '1バケットに複数のアクセスポイントを作成可能',
      '各アクセスポイントに独立したIAMポリシーを設定',
      'VPCアクセスポイントでVPC内専用アクセスも可能',
      '大規模な権限管理をシンプルに整理できる',
    ],
    hint: 'アクセスポイント = バケットポリシーを分割して管理しやすく',
  },
  {
    id: 8,
    title: 'まとめ',
    description: 'S3上級の重要ポイントを整理します。試験で頻出の上級機能を確認しましょう。',
    keyPoints: [
      'Transfer Acceleration：エッジ経由でグローバル高速転送、速度改善なし=課金なし',
      'Presigned URL：有効期限付きの一時アクセスURL、デフォルト1時間',
      'Object Lock：ガバナンス（特権ユーザー変更可）vs コンプライアンス（誰も変更不可）',
      'S3 Select：SQLフィルタリングでデータ転送量削減、最大80%コスト削減',
    ],
    hint: 'Object LockのガバナンスとコンプライアンスモードのDifを確実に押さえる',
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

export default function S3AdvancedStepper() {
  const [step, setStep] = useState(1)
  const stepRef  = useRef(1)
  const timerRef = useRef(0)
  const imgS3  = useRef<unknown>(null)
  const imgCf  = useRef<unknown>(null)

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
    col: [number,number,number], fillAlpha = 15, radius = 3) {
    p5.strokeWeight(1.5); p5.stroke(...col)
    p5.fill(col[0], col[1], col[2], fillAlpha)
    p5.rect(x, y, bw, bh, radius)
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
    p5.rect(cx - tw/2, cy - 10, tw, 20, 4)
    p5.fill(255); p5.textSize(11); p5.textAlign(p5.CENTER, p5.CENTER)
    p5.text(text, cx, cy)
  }

  const setup = (p5: any, ref: any) => {
    p5.createCanvas(W, H).parent(ref)
    p5.frameRate(30)
    p5.loadImage('/icons/aws/s3.svg', (img: unknown) => { imgS3.current = img })
    p5.loadImage('/icons/aws/CloudFront.svg', (img: unknown) => { imgCf.current = img })
  }

  const draw = (p5: any) => {
    const s = stepRef.current
    timerRef.current++
    p5.background(248, 250, 252)
    p5.textFont('sans-serif')

    // ── STEP 1: Transfer Acceleration ─────────────────────────────────
    if (s === 1) {
      // User (left, overseas)
      box(p5, 14, 110, 120, 120, BLUE, 15, 3)
      label(p5, 'ユーザー', 74, 138, BLUE, 13)
      label(p5, '（海外）', 74, 158, DARK, 11)
      label(p5, '欧州/米国', 74, 178, GRAY, 11)
      label(p5, '等', 74, 196, GRAY, 11)

      // Arrow1: User -> Edge
      arrow(p5, 134, 170, 196, 170, BLUE, 2)
      label(p5, 'HTTP PUT', 165, 160, BLUE, 10)

      // CloudFront Edge
      box(p5, 196, 90, 140, 160, TEAL, 18, 3)
      if (imgCf.current) p5.image(imgCf.current as any, 202, 96, 26, 26)
      label(p5, 'CloudFront', 266, 120, TEAL, 12)
      label(p5, 'エッジロケーション', 266, 140, TEAL, 11)
      label(p5, '（最寄り）', 266, 158, GRAY, 11)
      hline(p5, 206, 174, 326, TEAL, 1)
      label(p5, 'SSL終端', 266, 194, DARK, 11)
      label(p5, 'TCP最適化', 266, 212, DARK, 11)

      // Arrow2: Edge -> backbone -> S3 (horizontal segments)
      arrow(p5, 336, 170, 394, 170, GREEN, 2.5)
      label(p5, 'AWSバック', 365, 157, GREEN, 10)
      label(p5, 'ボーン', 365, 170, GREEN, 10)

      // S3 bucket (right)
      box(p5, 394, 110, 140, 120, ORANGE, 18, 3)
      if (imgS3.current) p5.image(imgS3.current as any, 400, 116, 26, 26)
      label(p5, 'S3 バケット', 464, 140, ORANGE, 13)
      label(p5, '（東京）', 464, 160, ORANGE, 11)
      label(p5, 'ap-northeast-1', 464, 178, GRAY, 10)
      label(p5, 'TA有効', 464, 198, GREEN, 11)

      // Comparison
      box(p5, 544, 40, 110, 260, DARK, 8, 3)
      label(p5, '速度比較', 599, 60, DARK, 13)
      hline(p5, 554, 74, 644, DARK, 1)
      label(p5, '通常', 599, 94, RED, 12)
      box(p5, 554, 100, 90, 26, RED, 20, 2)
      label(p5, '〜〜〜', 599, 113, RED, 12)
      label(p5, '（遅い）', 599, 134, RED, 11)
      label(p5, 'TA有効', 599, 164, GREEN, 12)
      box(p5, 554, 170, 90, 26, GREEN, 20, 2)
      label(p5, '———————', 599, 183, GREEN, 12)
      label(p5, '最大+300%', 599, 208, GREEN, 11)
      badge(p5, 599, 270, '速度改善なし=課金なし', TEAL, 104)

      // Path note
      box(p5, 14, 268, 520, 66, DARK, 8, 3)
      label(p5, '通常: ユーザー → 公共インターネット → S3（長距離・不安定）', 267, 288, DARK, 11)
      label(p5, 'TA:  ユーザー → エッジ（最寄り）→ AWSバックボーン → S3（高速・安定）', 267, 310, GREEN, 11)
    }

    // ── STEP 2: マルチパートアップロード詳細 ──────────────────────────
    else if (s === 2) {
      // Note at top
      box(p5, 14, 14, 632, 46, PURPLE, 10, 3)
      label(p5, '5GBを超えるファイルはマルチパートアップロードが必須', W/2, 30, PURPLE, 13)
      label(p5, '（100MBを超えるファイルは推奨）', W/2, 46, DARK, 11)

      // Original file
      box(p5, 14, 80, 120, 180, PURPLE, 18, 3)
      label(p5, '元ファイル', 74, 108, PURPLE, 12)
      label(p5, '10 GB', 74, 132, PURPLE, 15)
      hline(p5, 22, 148, 126, PURPLE, 1)
      label(p5, 'video.mp4', 74, 168, DARK, 11)
      label(p5, '5GB超 → 必須', 74, 190, RED, 11)

      // Split arrow
      arrow(p5, 134, 170, 174, 170, DARK, 1.5)

      // 3 chunks (initiateMultipartUpload → uploadPart)
      const parts = [
        { lbl: 'Part 1', range: '0 〜 3.3GB',  partNum: 'PartNumber=1' },
        { lbl: 'Part 2', range: '3.3 〜 6.6GB', partNum: 'PartNumber=2' },
        { lbl: 'Part 3', range: '6.6 〜 10GB',  partNum: 'PartNumber=3' },
      ]
      parts.forEach((p_, i) => {
        const py = 76 + i*88
        box(p5, 174, py, 150, 68, BLUE, 18, 3)
        label(p5, p_.lbl, 249, py + 22, BLUE, 13)
        label(p5, p_.range, 249, py + 42, DARK, 11)
        label(p5, p_.partNum, 249, py + 58, GRAY, 10)
      })

      // Parallel upload arrows
      parts.forEach((_, i) => {
        const py = 76 + i*88 + 34
        arrow(p5, 324, py, 406, py, BLUE, 2)
      })
      label(p5, '並列', 365, 150, BLUE, 11)
      label(p5, 'アップロード', 365, 166, BLUE, 11)

      // S3 (receiving)
      box(p5, 406, 80, 130, 180, ORANGE, 18, 3)
      if (imgS3.current) p5.image(imgS3.current as any, 414, 86, 26, 26)
      label(p5, 'S3', 471, 116, ORANGE, 14)
      hline(p5, 414, 132, 528, ORANGE, 1)
      label(p5, 'パーツ受信中', 471, 152, DARK, 11)
      label(p5, 'ETag で管理', 471, 172, DARK, 11)

      // CompleteMultipartUpload
      arrow(p5, 536, 170, 588, 170, GREEN, 2)
      box(p5, 548, 140, 96, 60, GREEN, 18, 3)
      label(p5, '結合', 596, 162, GREEN, 13)
      label(p5, '完成', 596, 182, GREEN, 13)

      // Labels
      label(p5, '1. InitiateMultipartUpload', 14, 286, GRAY, 10, 'left')
      label(p5, '2. UploadPart（並列）', 14, 302, GRAY, 10, 'left')
      label(p5, '3. CompleteMultipartUpload', 14, 318, GRAY, 10, 'left')
      label(p5, '失敗時: AbortMultipartUploadで不完全パーツを削除推奨', 360, 302, RED, 10, 'left')
    }

    // ── STEP 3: Presigned URL ─────────────────────────────────────────
    else if (s === 3) {
      // 3-step flow
      const steps_ = [
        { num: '1', desc: 'URL生成リクエスト',    actor: 'クライアント → サーバー' },
        { num: '2', desc: 'Presigned URL発行',     actor: 'サーバー → クライアント' },
        { num: '3', desc: 'S3に直接アクセス',      actor: 'クライアント → S3' },
      ]

      // App server (center-top)
      box(p5, 240, 14, 180, 80, GREEN, 18, 3)
      label(p5, 'アプリサーバー', 330, 38, GREEN, 13)
      label(p5, '（AWS SDK で URL生成）', 330, 58, GREEN, 11)
      label(p5, '有効期限: デフォルト1h', 330, 76, GRAY, 10)

      // Client (bottom-left)
      box(p5, 14, 200, 140, 100, BLUE, 15, 3)
      label(p5, 'クライアント', 84, 234, BLUE, 13)
      label(p5, 'ブラウザ/アプリ', 84, 254, DARK, 11)
      label(p5, 'Presigned URL', 84, 272, ORANGE, 11)
      label(p5, 'を保持', 84, 290, ORANGE, 11)

      // S3 (bottom-right)
      box(p5, 508, 200, 140, 100, ORANGE, 18, 3)
      if (imgS3.current) p5.image(imgS3.current as any, 516, 206, 26, 26)
      label(p5, 'S3 バケット', 578, 234, ORANGE, 13)
      label(p5, '直接アクセス', 578, 254, ORANGE, 11)
      label(p5, 'サーバー経由不要', 578, 272, DARK, 11)

      // Arrows
      // 1. Client -> Server
      vline(p5, 84, 200, 94, BLUE, 1.5)
      hline(p5, 84, 94, 240, BLUE, 1.5)
      arrow(p5, 238, 94, 240, 54, BLUE, 1.5)
      badge(p5, 162, 80, '① URL生成リクエスト', BLUE, 130)

      // 2. Server -> Client (Presigned URL)
      arrow(p5, 240, 74, 200, 74, GREEN, 1.5)
      hline(p5, 84, 74, 200, GREEN, 1.5)
      arrow(p5, 84, 74, 84, 198, GREEN, 1.5)
      badge(p5, 162, 116, '② Presigned URL 返却', GREEN, 140)

      // 3. Client -> S3 directly
      hline(p5, 154, 250, 506, ORANGE, 2)
      arrow(p5, 504, 250, 506, 250, ORANGE, 2)
      badge(p5, 330, 238, '③ 直接 S3 アクセス（PUT/GET）', ORANGE, 176)

      // Benefits
      box(p5, 14, 14, 200, 170, TEAL, 8, 3)
      label(p5, 'メリット', 114, 32, TEAL, 13)
      hline(p5, 22, 44, 206, TEAL, 1)
      const benefits = ['サーバー負荷軽減', 'コスト削減', '高スループット', '認証情報不要', 'URL期限で安全']
      benefits.forEach((b, i) => {
        label(p5, b, 26, 64 + i*22, DARK, 11, 'left')
      })
    }

    // ── STEP 4: Object Lock - ガバナンスモード ────────────────────────
    else if (s === 4) {
      box(p5, 14, 14, 632, 46, ORANGE, 10, 3)
      label(p5, 'S3 Object Lock - ガバナンスモード', W/2, 30, ORANGE, 14)
      label(p5, '特定権限を持つ特権ユーザーのみ保持設定を変更できる', W/2, 46, DARK, 11)

      // Protected object
      box(p5, 14, 72, 260, 200, ORANGE, 18, 3)
      if (imgS3.current) p5.image(imgS3.current as any, 22, 78, 26, 26)
      label(p5, 'S3 オブジェクト', 144, 100, ORANGE, 13)
      label(p5, '（保護中）', 144, 118, ORANGE, 11)
      hline(p5, 22, 132, 266, ORANGE, 1)
      label(p5, 'Retention Mode: GOVERNANCE', 144, 152, DARK, 11)
      label(p5, 'Retain Until: 2025-12-31', 144, 172, DARK, 11)
      badge(p5, 144, 240, 'WORM 保護中', ORANGE, 90)

      // Two user types
      // Normal user (right-top)
      box(p5, 310, 72, 200, 100, RED, 15, 3)
      label(p5, '一般ユーザー', 410, 100, RED, 13)
      label(p5, '（権限なし）', 410, 120, RED, 11)
      label(p5, 's3:BypassGovernanceRetention', 410, 140, GRAY, 10)
      label(p5, 'の権限なし', 410, 158, RED, 11)

      // Arrows (denied)
      arrow(p5, 310, 122, 280, 170, RED, 1.5)
      badge(p5, 290, 154, '変更不可', RED, 70)

      // Privileged user (right-bottom)
      box(p5, 310, 202, 200, 100, GREEN, 15, 3)
      label(p5, '特権ユーザー', 410, 230, GREEN, 13)
      label(p5, '（バイパス権限あり）', 410, 250, GREEN, 11)
      label(p5, 's3:BypassGovernanceRetention', 410, 270, GRAY, 10)
      label(p5, 'の権限あり', 410, 288, GREEN, 11)

      // Arrow (allowed)
      arrow(p5, 310, 252, 280, 200, GREEN, 1.5)
      badge(p5, 290, 236, '変更可', GREEN, 60)

      // Use case
      box(p5, 530, 72, 116, 230, DARK, 8, 3)
      label(p5, '用途', 588, 92, DARK, 13)
      hline(p5, 540, 106, 636, DARK, 1)
      const uses = ['法的保管', '監査対応', '例外処理', 'テスト環境', 'ほどほどの', '規制対応']
      uses.forEach((u, i) => {
        label(p5, u, 588, 124 + i*26, DARK, 11)
      })
    }

    // ── STEP 5: Object Lock - コンプライアンスモード ──────────────────
    else if (s === 5) {
      box(p5, 14, 14, 632, 46, PURPLE, 10, 3)
      label(p5, 'S3 Object Lock - コンプライアンスモード', W/2, 30, PURPLE, 14)
      label(p5, 'ルートユーザー含む誰も保持期間中はデータを変更・削除不可', W/2, 46, DARK, 11)

      // Timeline
      const tlY = 210
      hline(p5, 50, tlY, 600, DARK, 1.5)
      label(p5, '時間軸', 580, tlY+18, DARK, 11)

      // Start point
      vline(p5, 80, tlY-6, tlY+6, PURPLE, 2)
      label(p5, '保持開始', 80, tlY+22, PURPLE, 11)
      label(p5, '2024-01-01', 80, tlY+38, GRAY, 10)

      // End point
      vline(p5, 500, tlY-6, tlY+6, PURPLE, 2)
      label(p5, '保持期間終了', 500, tlY+22, PURPLE, 11)
      label(p5, '2034-01-01', 500, tlY+38, GRAY, 10)

      // Protected region bar
      p5.noStroke(); p5.fill(...PURPLE, 30)
      p5.rect(80, tlY-40, 420, 34, 3)
      p5.noStroke(); p5.fill(...PURPLE)
      p5.textSize(12); p5.textAlign(p5.CENTER, p5.CENTER)
      p5.text('保持期間（10年）= 変更・削除 完全禁止', 290, tlY-23)

      // Who cannot change
      const users = [
        { name: '一般ユーザー',   col: RED   },
        { name: '管理者',         col: RED   },
        { name: 'AWSサポート',    col: RED   },
        { name: 'ルートユーザー', col: RED   },
      ]
      users.forEach((u, i) => {
        const ux = 30 + i*158
        box(p5, ux, 76, 140, 68, u.col, 15, 3)
        label(p5, u.name, ux+70, 102, u.col, 12)
        badge(p5, ux+70, 130, '変更・削除不可', RED, 92)
      })

      // Lock icon representation
      box(p5, 246, 158, 168, 44, RED, 8, 3)
      label(p5, '誰も変更できない（絶対）', 330, 180, RED, 12)

      // Use case
      box(p5, 14, 270, 632, 62, PURPLE, 8, 3)
      label(p5, '用途：金融規制（SEC Rule 17a-4）・医療記録・法的証拠保全など厳格なコンプライアンス要件', W/2, 292, PURPLE, 11)
      label(p5, 'リーガルホールド：保持期間なし（訴訟中など無期限保護）→ s3:PutObjectLegalHold 権限が必要', W/2, 314, DARK, 11)
    }

    // ── STEP 6: S3 Select ─────────────────────────────────────────────
    else if (s === 6) {
      label(p5, 'S3 Select：フィルタリングしたデータのみ取得', W/2, 22, DARK, 14)

      // Before (left)
      box(p5, 14, 40, 290, 280, RED, 10, 3)
      label(p5, '従来の方法', 159, 62, RED, 13)
      hline(p5, 22, 76, 296, RED, 1)

      // S3 object
      box(p5, 24, 90, 270, 120, ORANGE, 18, 3)
      if (imgS3.current) p5.image(imgS3.current as any, 30, 96, 22, 22)
      label(p5, 'S3 オブジェクト (CSV 1GB)', 159, 110, ORANGE, 11)
      const rows1 = ['id,name,sales', '1,Tokyo,500', '2,Osaka,300', '3,Nagoya,200', '... (全データ)']
      rows1.forEach((r, i) => {
        label(p5, r, 159, 130 + i*16, DARK, 10)
      })

      arrow(p5, 159, 210, 159, 244, RED, 2)

      box(p5, 24, 244, 270, 44, RED, 18, 2)
      label(p5, '全データ（1GB）をダウンロード', 159, 260, RED, 11)
      label(p5, '→ アプリ側でフィルタリング', 159, 278, DARK, 11)

      // After (right)
      box(p5, 360, 40, 290, 280, GREEN, 10, 3)
      label(p5, 'S3 Select を使用', 505, 62, GREEN, 13)
      hline(p5, 368, 76, 642, GREEN, 1)

      box(p5, 370, 90, 270, 80, ORANGE, 18, 3)
      if (imgS3.current) p5.image(imgS3.current as any, 376, 96, 22, 22)
      label(p5, 'S3 オブジェクト (CSV 1GB)', 505, 110, ORANGE, 11)
      label(p5, 'S3側でSQL実行', 505, 136, TEAL, 11)
      label(p5, 'SELECT * WHERE sales > 400', 505, 154, TEAL, 10)

      arrow(p5, 505, 170, 505, 204, GREEN, 2)

      box(p5, 370, 204, 270, 44, GREEN, 18, 2)
      label(p5, '必要データのみ返却（例: 50KB）', 505, 220, GREEN, 11)
      label(p5, '→ 転送量削減・コスト80%減', 505, 238, GREEN, 11)

      box(p5, 370, 258, 270, 56, GREEN, 25, 2)
      label(p5, '対応形式: CSV / JSON / Parquet', 505, 276, TEAL, 11)
      label(p5, 'Glacier Select も利用可能', 505, 296, DARK, 11)
    }

    // ── STEP 7: S3 Access Points ──────────────────────────────────────
    else if (s === 7) {
      // Central S3 bucket
      box(p5, 276, 120, 120, 100, ORANGE, 18, 3)
      if (imgS3.current) p5.image(imgS3.current as any, 284, 126, 26, 26)
      label(p5, 'S3 バケット', 336, 152, ORANGE, 13)
      label(p5, '（1つ）', 336, 172, ORANGE, 11)
      label(p5, 'バケットポリシー', 336, 200, GRAY, 10)

      // 3 access points (left, bottom, right of bucket)
      const aps = [
        { name: 'dev-ap',       sub: '開発チーム',   perm: 'read/write',  col: BLUE,   x: 60,  y: 120 },
        { name: 'prod-ap',      sub: '本番チーム',   perm: 'read only',   col: GREEN,  x: 60,  y: 240 },
        { name: 'analytics-ap', sub: '分析チーム',   perm: 'read only',   col: PURPLE, x: 490, y: 180 },
      ]

      aps.forEach((ap) => {
        box(p5, ap.x, ap.y, 160, 80, ap.col, 18, 3)
        label(p5, ap.name, ap.x+80, ap.y+24, ap.col, 13)
        label(p5, ap.sub, ap.x+80, ap.y+44, DARK, 11)
        badge(p5, ap.x+80, ap.y+66, ap.perm, ap.col, 80)

        // Arrow to bucket
        const bx = 276, by = 170  // bucket center
        const apCx = ap.x + 160, apCy = ap.y + 40
        hline(p5, apCx, apCy, bx, ap.col, 1.5)
        vline(p5, bx, apCy, by, ap.col, 1.5)
      })

      // Users/apps connecting to each AP (left of APs)
      const apUsers = [
        { x: 14, y: 148, col: BLUE,   lbl: '開発者' },
        { x: 14, y: 268, col: GREEN,  lbl: '運用者' },
        { x: 546, y: 208, col: PURPLE, lbl: 'データSci' },
      ]
      apUsers.forEach((u, i) => {
        box(p5, u.x, u.y, 44, 32, u.col, 15, 2)
        label(p5, u.lbl, u.x+22, u.y+16, u.col, 10)
        if (i < 2) {
          arrow(p5, u.x + 44, u.y+16, 60, u.y+16, u.col, 1.5)
        } else {
          arrow(p5, 544, u.y+16, u.x, u.y+16, u.col, 1.5)
        }
      })

      // Header
      box(p5, 14, 14, 632, 96, DARK, 8, 3)
      label(p5, 'S3 Access Points', W/2, 32, DARK, 14)
      label(p5, '1つのバケットに複数のアクセスポイントを作成し、用途ごとに独立したIAMポリシーを設定', W/2, 54, DARK, 12)
      label(p5, 'VPCアクセスポイント：VPC内専用のプライベートアクセスも設定可能', W/2, 76, GRAY, 11)
    }

    // ── STEP 8: まとめ ────────────────────────────────────────────────
    else if (s === 8) {
      const headers = ['機能', '説明', '試験ポイント']
      const rows = [
        { name: 'Transfer Accel.',   desc: 'エッジ→バックボーン高速化',    tip: '速度改善なし=課金なし',         col: TEAL   },
        { name: 'Presigned URL',     desc: '一時アクセスURL生成',           tip: 'デフォルト1h・最大7日',        col: GREEN  },
        { name: 'ガバナンスモード',  desc: '特権ユーザーのみ変更可',       tip: 's3:BypassGovernanceRetention', col: ORANGE },
        { name: 'コンプライアンス',  desc: '誰も変更・削除不可',           tip: 'ルートもNG・期間短縮不可',      col: RED    },
        { name: 'S3 Select',         desc: 'SQL絞り込みで転送量削減',      tip: 'CSV/JSON/Parquet対応',         col: BLUE   },
        { name: 'Access Points',     desc: '用途別アクセスポイント',        tip: '1バケット複数AP・VPC対応',     col: PURPLE },
      ]

      const colW = [158, 218, 252]
      const colX = [10, 168, 386]
      const rowH = 38, headerH = 28, startY = 12

      p5.strokeWeight(1); p5.stroke(180, 185, 200)
      p5.fill(60, 65, 80)
      p5.rect(10, startY, W - 20, headerH, 4)
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
        const vals = [row.name, row.desc, row.tip]
        vals.forEach((val, ci) => {
          const col: [number,number,number] = ci === 0 ? row.col : DARK
          p5.noStroke(); p5.fill(...col)
          p5.textSize(ci === 0 ? 12.5 : 12); p5.textAlign(p5.LEFT, p5.CENTER)
          p5.text(val, colX[ci] + 6, ry + rowH/2)
        })
      })

      p5.strokeWeight(1); p5.stroke(180, 185, 200); p5.noFill()
      p5.rect(10, startY, W - 20, headerH + rows.length * rowH, 4)
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
                i + 1 === step ? 'bg-purple-500' : i + 1 < step ? 'bg-purple-300' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-50">
        <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-gray-600 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse inline-block" />
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
              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold">✓</span>
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
                i + 1 === step ? 'bg-purple-500 scale-125' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setStep(s => Math.min(TOTAL, s + 1))}
          disabled={step === TOTAL}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-500 hover:bg-purple-600 text-white font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >{step === TOTAL ? '完了！' : '次へ →'}</button>
      </div>

      {step === TOTAL && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-5 text-center">
          <p className="font-bold text-purple-700 mb-1">S3上級コンテンツ完了！</p>
          <p className="text-sm text-purple-600">下の練習問題で理解度を確認しましょう。</p>
        </div>
      )}
    </div>
  )
}
