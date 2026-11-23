// レッスンの「今のステップ」を、レッスン画面とサイドナビの間でやり取りする小さな仕組み
// （サイドナビはページの外側＝共通レイアウトにあるため、ブラウザのイベントで伝える）

const STEP_EVENT = 'lesson:step'
const GO_EVENT = 'lesson:go'

export type StepDetail = { slug: string; index: number }

/** レッスン画面 → サイドナビ：ステップが変わった */
export function announceStep(detail: StepDetail) {
  window.dispatchEvent(new CustomEvent<StepDetail>(STEP_EVENT, { detail }))
}

/** サイドナビ → レッスン画面：このステップへ移動して */
export function requestStep(detail: StepDetail) {
  window.dispatchEvent(new CustomEvent<StepDetail>(GO_EVENT, { detail }))
}

function listen(name: string, fn: (d: StepDetail) => void) {
  const h = (e: Event) => fn((e as CustomEvent<StepDetail>).detail)
  window.addEventListener(name, h)
  return () => window.removeEventListener(name, h)
}

export const onStep = (fn: (d: StepDetail) => void) => listen(STEP_EVENT, fn)
export const onStepRequest = (fn: (d: StepDetail) => void) => listen(GO_EVENT, fn)
