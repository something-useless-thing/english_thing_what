export function createStore(initial) {
  let state = { ...initial }
  const listeners = new Set()
  return {
    get: () => state,
    set(partial) {
      state = { ...state, ...(typeof partial === 'function' ? partial(state) : partial) }
      listeners.forEach(fn => fn(state))
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
  }
}

export const appStore = createStore({ screen: 'main' })

const defaultScores = '{"word":[],"passage":[],"grammar":[],"comprehensive":[]}'

export const rankStore = createStore({
  scores: JSON.parse(localStorage.getItem('eng_scores') || defaultScores),
  playerName: localStorage.getItem('eng_name') || '',
})

rankStore.subscribe(({ scores, playerName }) => {
  localStorage.setItem('eng_scores', JSON.stringify(scores))
  localStorage.setItem('eng_name', playerName)
})

export function saveScore(type, score) {
  const { scores, playerName } = rankStore.get()
  const name = playerName || '익명'
  const list = [...(scores[type] || []), { name, score, date: new Date().toLocaleDateString('ko-KR') }]
    .sort((a, b) => b.score - a.score).slice(0, 20)
  rankStore.set({ scores: { ...scores, [type]: list } })
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
