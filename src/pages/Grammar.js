import { appStore, saveScore } from '../stores/store.js'
import { GRAMMAR_QUESTIONS } from './grammer.js'

let unit = 1
let questions = []
let qIdx = 0
let correct = 0
let wrong = 0
let answered = false

export function renderGrammar(root) {
  unit = 1
  mount(root)
}

function mount(root) {
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;min-height:100vh">
      <nav class="top-nav">
        <button class="btn-back" id="back">←</button>
        <span class="nav-title">문법 문제</span>
      </nav>
      <div class="screen" style="padding-top:.8rem">
        <div style="display:flex;gap:6px;margin-bottom:.8rem">
          <button class="tab-btn" id="u1">1과</button>
          <button class="tab-btn" id="u2">2과</button>
        </div>
        <div id="gram-body"></div>
      </div>
    </div>`

  root.querySelector('#back').addEventListener('click', () => appStore.set({ screen: 'main' }))
  root.querySelector('#u1').addEventListener('click', () => { unit = 1; startQuiz(root) })
  root.querySelector('#u2').addEventListener('click', () => { unit = 2; startQuiz(root) })

  startQuiz(root)
}

function startQuiz(root) {
  questions = [...GRAMMAR_QUESTIONS[unit]]
  qIdx = 0
  correct = 0
  wrong = 0
  answered = false

  root.querySelector('#u1').classList.toggle('active', unit === 1)
  root.querySelector('#u2').classList.toggle('active', unit === 2)

  renderQ(root)
}

function renderQ(root) {
  if (qIdx >= questions.length) { renderResult(root); return }

  const q = questions[qIdx]
  const body = root.querySelector('#gram-body')
  answered = false

  let contentHTML = ''

  if (q.type === 'multiple-choice') {
    contentHTML = `
      <div class="card" style="margin-bottom:1rem">
        <div style="font-size:13px;color:var(--text2);white-space:pre-line;line-height:1.7">${q.instruction}</div>
      </div>
      <div class="mc-options" id="opts">
        ${q.options.map((o, i) => `
          <button class="mc-opt" data-idx="${i}">
            <span class="opt-num">${i + 1}.</span>${o}
          </button>`).join('')}
      </div>`
  } else {
    contentHTML = `
      <div class="card" style="margin-bottom:1rem">
        <div style="font-size:13px;color:var(--text3);margin-bottom:.7rem;white-space:pre-line">${q.instruction}</div>
        <div style="font-size:14.5px;line-height:1.8">${q.sentence}</div>
      </div>
      <input class="input" id="ans-input" placeholder="${q.type === 'error-correction' ? '틀린 부분 → 정답 쓰기' : '빈칸에 들어갈 말 쓰기'}...">
      <button class="btn btn-primary" id="check-btn" style="margin-top:.6rem">확인</button>`
  }

  body.innerHTML = `
    <div class="score-row">
      <div class="score-chip"><span class="c">${correct}</span>맞음</div>
      <div class="score-chip"><span class="w">${wrong}</span>틀림</div>
    </div>
    <div class="progress-text">${qIdx + 1} / ${questions.length}</div>
    ${contentHTML}
    <div id="fb"></div>
    <div style="text-align:right;margin-top:.8rem">
      <button class="btn btn-primary" id="next-q" style="display:none">다음 →</button>
    </div>`

  if (q.type === 'multiple-choice') {
    body.querySelectorAll('.mc-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return
        answered = true
        const ok = parseInt(btn.dataset.idx) === q.answer
        if (ok) correct++; else wrong++

        body.querySelectorAll('.mc-opt').forEach((b, i) => {
          b.disabled = true
          if (i === q.answer) b.classList.add('correct-opt')
          else if (b === btn && !ok) b.classList.add('wrong-opt')
        })

        showFeedback(body, ok, q)
        body.querySelector('#next-q').style.display = 'inline-flex'
      })
    })
  } else {
    const check = () => {
      if (answered) return
      answered = true
      const val = body.querySelector('#ans-input').value.trim().toLowerCase()
      const ans = q.answer.toLowerCase()
      const ok = val.length > 0 && (val === ans || ans.includes(val) || val.includes(ans))
      if (ok) correct++; else wrong++

      body.querySelector('#ans-input').disabled = true
      body.querySelector('#check-btn').disabled = true
      showFeedback(body, ok, q)
      body.querySelector('#next-q').style.display = 'inline-flex'
    }

    body.querySelector('#check-btn').addEventListener('click', check)
    body.querySelector('#ans-input').addEventListener('keydown', e => { if (e.key === 'Enter') check() })
  }

  body.querySelector('#next-q').addEventListener('click', () => { qIdx++; renderQ(root) })
}

function showFeedback(body, ok, q) {
  body.querySelector('#fb').innerHTML = `
    <div class="feedback ${ok ? 'correct' : 'wrong'}" style="margin-top:.8rem">
      ${ok ? '정답!' : `오답 — 정답: <b>${q.answer}</b>`}
      <div style="font-size:12px;margin-top:.4rem;font-weight:400">${q.explanation}</div>
    </div>`
}

function renderResult(root) {
  const score = Math.round((correct / questions.length) * 100)
  saveScore('grammar', score)
  root.querySelector('#gram-body').innerHTML = `
    <div class="result-screen">
      <div class="result-score">${score}</div>
      <div class="result-label">점 &nbsp;(${correct} / ${questions.length} 정답)</div>
      <button class="btn btn-primary" id="retry">다시 풀기</button>
    </div>`
  root.querySelector('#retry').addEventListener('click', () => startQuiz(root))
}
