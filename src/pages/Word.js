import { appStore, saveScore, shuffle } from '../stores/store.js'
import { WORDS } from '../data/words.js'

let unit = 1
let mode = 'flash'
let cards = []
let cardIdx = 0
let quizWords = []
let quizIdx = 0
let correct = 0
let wrong = 0
let answered = false

export function renderWord(root) {
  unit = 1
  mode = 'flash'
  mount(root)
}

function mount(root) {
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;min-height:100vh">
      <nav class="top-nav">
        <button class="btn-back" id="back">←</button>
        <span class="nav-title">단어 퀴즈</span>
      </nav>
      <div class="screen" style="padding-top:.8rem">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:.8rem">
          <button class="tab-btn" id="u1">1과</button>
          <button class="tab-btn" id="u2">2과</button>
          <div style="margin-left:auto;display:flex;gap:6px">
            <button class="tab-btn" id="m-flash">🃏 플래시카드</button>
            <button class="tab-btn" id="m-quiz">📝 퀴즈</button>
          </div>
        </div>
        <div id="word-body"></div>
      </div>
    </div>`

  root.querySelector('#back').addEventListener('click', () => appStore.set({ screen: 'main' }))
  root.querySelector('#u1').addEventListener('click', () => { unit = 1; switchMode(root) })
  root.querySelector('#u2').addEventListener('click', () => { unit = 2; switchMode(root) })
  root.querySelector('#m-flash').addEventListener('click', () => { mode = 'flash'; switchMode(root) })
  root.querySelector('#m-quiz').addEventListener('click', () => { mode = 'quiz'; switchMode(root) })

  switchMode(root)
}

function switchMode(root) {
  root.querySelector('#u1').classList.toggle('active', unit === 1)
  root.querySelector('#u2').classList.toggle('active', unit === 2)
  root.querySelector('#m-flash').classList.toggle('active', mode === 'flash')
  root.querySelector('#m-quiz').classList.toggle('active', mode === 'quiz')

  if (mode === 'flash') startFlash(root)
  else startQuiz(root)
}

function startFlash(root) {
  cards = shuffle([...WORDS[unit]])
  cardIdx = 0
  renderFlash(root)
}

function renderFlash(root) {
  const body = root.querySelector('#word-body')
  const w = cards[cardIdx]
  body.innerHTML = `
    <div class="progress-text">${cardIdx + 1} / ${cards.length}</div>
    <div class="flashcard-wrap" id="fc">
      <div class="flashcard-inner" id="fc-inner">
        <div class="flashcard-face front">
          <div>${w.en}</div>
          <div class="flashcard-hint">클릭해서 뜻 보기</div>
        </div>
        <div class="flashcard-face back">
          <div>${w.ko}</div>
          <div class="flashcard-hint">${w.en}</div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:1rem;justify-content:center">
      <button class="btn btn-secondary" id="prev" ${cardIdx === 0 ? 'disabled' : ''}>이전</button>
      <button class="btn btn-secondary" id="reshuffle">셔플</button>
      <button class="btn btn-primary" id="next" ${cardIdx === cards.length - 1 ? 'disabled' : ''}>다음</button>
    </div>`

  body.querySelector('#fc').addEventListener('click', () =>
    body.querySelector('#fc-inner').classList.toggle('flipped'))
  body.querySelector('#prev').addEventListener('click', () => { cardIdx--; renderFlash(root) })
  body.querySelector('#next').addEventListener('click', () => { cardIdx++; renderFlash(root) })
  body.querySelector('#reshuffle').addEventListener('click', () => startFlash(root))
}

function startQuiz(root) {
  quizWords = shuffle([...WORDS[unit]])
  quizIdx = 0
  correct = 0
  wrong = 0
  answered = false
  renderQuiz(root)
}

function renderQuiz(root) {
  if (quizIdx >= quizWords.length) { renderQuizResult(root); return }

  const body = root.querySelector('#word-body')
  const w = quizWords[quizIdx]
  const others = shuffle(WORDS[unit].filter(x => x.en !== w.en)).slice(0, 3)
  const options = shuffle([w, ...others])
  answered = false

  body.innerHTML = `
    <div class="score-row">
      <div class="score-chip"><span class="c">${correct}</span>맞음</div>
      <div class="score-chip"><span class="w">${wrong}</span>틀림</div>
    </div>
    <div class="progress-text">${quizIdx + 1} / ${quizWords.length}</div>
    <div class="card" style="margin-bottom:1rem;text-align:center">
      <div style="font-size:1.4rem;font-weight:700;padding:.5rem 0">${w.en}</div>
    </div>
    <div class="mc-options" id="opts">
      ${options.map((o, i) => `
        <button class="mc-opt" data-ko="${o.ko}">
          <span class="opt-num">${i + 1}.</span>${o.ko}
        </button>`).join('')}
    </div>
    <div id="fb"></div>
    <div style="text-align:right;margin-top:.8rem">
      <button class="btn btn-primary" id="next-q" style="display:none">다음 →</button>
    </div>`

  body.querySelectorAll('.mc-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return
      answered = true
      const ok = btn.dataset.ko === w.ko
      if (ok) correct++; else wrong++

      body.querySelectorAll('.mc-opt').forEach(b => {
        b.disabled = true
        if (b.dataset.ko === w.ko) b.classList.add('correct-opt')
        else if (b === btn && !ok) b.classList.add('wrong-opt')
      })

      body.querySelector('#fb').innerHTML =
        `<div class="feedback ${ok ? 'correct' : 'wrong'}">${ok ? '정답!' : `오답 — 정답: ${w.ko}`}</div>`
      body.querySelector('#next-q').style.display = 'inline-flex'
    })
  })

  body.querySelector('#next-q').addEventListener('click', () => { quizIdx++; renderQuiz(root) })
}

function renderQuizResult(root) {
  const score = Math.round((correct / quizWords.length) * 100)
  saveScore('word', score)
  root.querySelector('#word-body').innerHTML = `
    <div class="result-screen">
      <div class="result-score">${score}</div>
      <div class="result-label">점 &nbsp;(${correct} / ${quizWords.length} 정답)</div>
      <button class="btn btn-primary" id="retry">다시 풀기</button>
    </div>`
  root.querySelector('#retry').addEventListener('click', () => startQuiz(root))
}
