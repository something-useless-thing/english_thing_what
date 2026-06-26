import { appStore, saveScore, shuffle, rankStore } from '../stores/store.js'
import { WORDS } from '../data/words.js'
import { GRAMMAR_QUESTIONS } from '../data/grammar.js'

let st = {}

function init() {
  st = { list: [], idx: 0, correct: 0, wrong: 0, selectedWord: null }
}

// 단어 문제를 퀴즈 형식으로 변환 (한→영 or 영→한 랜덤)
function buildWordQuestions() {
  const all = shuffle([...WORDS[1], ...WORDS[2]])
  return all.slice(0, 20).map(w => {
    const isKo = Math.random() > 0.5
    return {
      type: 'fill-blank',
      _isWord: true,
      instruction: isKo ? `다음 한국어에 해당하는 영어 단어를 쓰시오.` : `다음 영어 단어의 뜻을 쓰시오.`,
      sentence: isKo ? w.ko : w.en,
      answer: isKo ? w.en : w.ko,
      explanation: `${w.en} = ${w.ko}`,
      translation: '',
    }
  })
}

export function renderComprehensive(root) {
  init()
  mount(root)
}

function mount(root) {
  const { playerName } = rankStore.get()
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;min-height:100vh">
      <nav class="top-nav">
        <button class="btn-back" id="back">←</button>
        <span class="nav-title">🎯 종합 문제</span>
      </nav>
      <div class="screen" style="padding-top:1rem">
        <div class="card" style="margin-bottom:1.2rem;display:flex;flex-direction:column;gap:.8rem">
          <div style="font-size:14px;color:var(--text2);line-height:1.7">
            단어 20문제 + 문법 전체를 랜덤으로 섞어서 출제함.<br>
            점수가 랭킹에 등록돼!
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:13px;color:var(--text3)">이름</span>
            <input class="input" id="name-inp" value="${playerName}" placeholder="이름 입력..." style="flex:1;max-width:180px">
          </div>
          <button class="btn btn-primary" id="start-btn" style="align-self:flex-start">▶ 시작하기</button>
        </div>
        <div id="comp-content"></div>
      </div>
    </div>`

  root.querySelector('#back').addEventListener('click', () => appStore.set({ screen: 'main' }))
  root.querySelector('#name-inp').addEventListener('input', e => {
    rankStore.set({ playerName: e.target.value.trim() })
  })
  root.querySelector('#start-btn').addEventListener('click', () => startQuiz(root))
}

function startQuiz(root) {
  const wordQs = buildWordQuestions()
  const gramQs = shuffle([
    ...(GRAMMAR_QUESTIONS[1] || []),
    ...(GRAMMAR_QUESTIONS[2] || []),
  ])
  st.list = shuffle([...wordQs, ...gramQs])
  st.idx = 0; st.correct = 0; st.wrong = 0; st.selectedWord = null

  // 시작 버튼 영역 숨기기
  root.querySelector('.card').style.display = 'none'
  renderQ(root)
}

function renderQ(root) {
  const el = root.querySelector('#comp-content')
  st.selectedWord = null

  if (st.idx >= st.list.length) {
    const total = st.list.length
    const score = Math.round((st.correct / total) * 100)
    saveScore('comprehensive', score)
    el.innerHTML = `
      <div class="result-screen">
        <div class="result-score">${score}점</div>
        <div class="result-label">${st.correct}개 정답 / ${total}개 &nbsp;|&nbsp; 랭킹 등록 완료!</div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" id="retry">다시 풀기</button>
          <button class="btn btn-secondary" id="see-rank">🏆 랭킹 보기</button>
          <button class="btn btn-secondary" id="go-main">홈으로</button>
        </div>
      </div>`
    el.querySelector('#retry').addEventListener('click', () => { init(); startQuiz(root) })
    el.querySelector('#see-rank').addEventListener('click', () => appStore.set({ screen: 'ranking' }))
    el.querySelector('#go-main').addEventListener('click', () => appStore.set({ screen: 'main' }))
    return
  }

  const q = st.list[st.idx]
  const isWord = !!q._isWord
  const typeLabel = isWord ? '단어' : { 'multiple-choice': '객관식', 'error-correction': '오류 수정', 'fill-blank': '빈칸' }[q.type] || '문제'
  const tagColor = isWord ? '#2fbe7e' : '#7c6af7'

  let body = ''

  if (q.type === 'error-correction') {
    body = `
      <div style="font-size:12px;color:var(--purple-l);margin-bottom:.5rem;font-weight:600">① 어색한 부분 클릭 → ② 고친 말 입력</div>
      <div id="ec-sentence" style="background:var(--surface2);padding:.8rem 1rem;border-radius:8px;font-size:15px;line-height:2;margin-bottom:.8rem;user-select:none">
        ${tokenize(q.sentence)}
      </div>
      <div id="ec-input-area" style="display:none">
        <div style="font-size:12px;color:var(--text3);margin-bottom:.4rem">선택: <b id="ec-label" style="color:var(--red)"></b></div>
        <div style="display:flex;gap:8px">
          <input class="input" id="gram-input" placeholder="고친 말 입력..." autocomplete="off" style="flex:1">
          <button class="btn btn-primary" id="q-check">확인</button>
        </div>
      </div>
      <button class="btn btn-secondary" id="q-skip" style="margin-top:.7rem">건너뛰기</button>`
  } else if (q.type === 'multiple-choice') {
    if (q.sentence) body += `<div style="background:var(--surface2);padding:.7rem 1rem;border-radius:8px;font-size:14px;margin-bottom:.8rem;line-height:1.8">${q.sentence}</div>`
    body += `<div class="mc-options">${q.options.map((opt, i) =>
      `<button class="mc-opt" data-i="${i}"><span class="opt-num">${i + 1}</span>${opt}</button>`
    ).join('')}</div>`
  } else {
    // fill-blank (단어 포함)
    if (q.sentence) body += `<div style="background:var(--surface2);padding:.7rem 1rem;border-radius:8px;font-size:${isWord ? '1.2rem' : '14px'};font-weight:${isWord ? '700' : '400'};margin-bottom:.8rem;line-height:1.8;text-align:${isWord ? 'center' : 'left'}">${q.sentence}</div>`
    body += `<input class="input" id="gram-input" placeholder="정답 입력..." autocomplete="off">
      <div style="display:flex;gap:8px;margin-top:.8rem">
        <button class="btn btn-primary" id="q-check">확인</button>
        <button class="btn btn-secondary" id="q-skip">건너뛰기</button>
      </div>`
  }

  el.innerHTML = `
    <div class="progress-text">${st.idx + 1} / ${st.list.length} &nbsp;|&nbsp; ✓${st.correct} ✗${st.wrong}</div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:.5rem">
        <span style="background:${tagColor};color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px">${typeLabel}</span>
      </div>
      <div style="font-size:14px;white-space:pre-line;margin-bottom:.9rem;color:var(--text2);line-height:1.7">${q.instruction}</div>
      ${body}
      <div class="feedback" id="q-feedback" style="display:none"></div>
    </div>`

  bindQ(root, q)
}

function tokenize(sentence) {
  return sentence.split(' ').map(word =>
    `<span class="ec-token" data-word="${word}" style="display:inline-block;padding:2px 5px;margin:1px 2px;border-radius:5px;cursor:pointer;transition:background .12s;border:1px solid transparent"
      onmouseover="this.style.background='var(--border)'" onmouseout="if(!this.classList.contains('ec-selected'))this.style.background=''">${word}</span>`
  ).join(' ')
}

function bindQ(root, q) {
  const el = root.querySelector('#comp-content')

  const showFb = (ok) => {
    if (ok) st.correct++; else st.wrong++
    const fb = el.querySelector('#q-feedback')
    const ans = typeof q.answer === 'number' ? q.options[q.answer] : q.answer
    fb.style.display = 'block'
    fb.className = `feedback ${ok ? 'correct' : 'wrong'}`
    if (q.type === 'error-correction') {
      fb.innerHTML = `${ok ? '✓ 정답!' : '✗ 오답.'}<br>
        <span style="font-size:13px">어색한 부분: <b style="color:var(--red)">${q.wrongPart || ans}</b> → <b style="color:var(--green)">${ans}</b></span><br>
        <span style="font-size:12px;opacity:.85">${q.explanation || ''}</span>`
    } else {
      fb.innerHTML = `${ok ? '✓ 정답!' : `✗ 오답. 정답: <b>${ans}</b>`}<br>
        <span style="font-size:12px;opacity:.85">${q.explanation || ''}</span>`
    }
    setTimeout(() => { st.idx++; renderQ(root) }, 1800)
  }

  if (q.type === 'error-correction') {
    el.querySelectorAll('.ec-token').forEach(token => {
      token.addEventListener('click', () => {
        el.querySelectorAll('.ec-token').forEach(t => { t.classList.remove('ec-selected'); t.style.background = ''; t.style.borderColor = 'transparent' })
        token.classList.add('ec-selected'); token.style.background = '#3a1a1a'; token.style.borderColor = 'var(--red)'
        st.selectedWord = token.dataset.word
        const area = el.querySelector('#ec-input-area')
        area.style.display = 'block'
        el.querySelector('#ec-label').textContent = `"${token.dataset.word}"`
        const inp = el.querySelector('#gram-input'); inp.value = ''; inp.focus()
      })
    })
    const check = () => {
      if (!st.selectedWord) return
      const sel = st.selectedWord.toLowerCase().replace(/[.,!?;:'"()]/g, '')
      const wrong = (q.wrongPart || '').toLowerCase().replace(/[.,!?;:'"()]/g, '')
      const corr = (q.answer || '').toLowerCase()
      const inp = (el.querySelector('#gram-input')?.value || '').trim().toLowerCase()
      const ok = (sel === wrong || wrong.includes(sel) || sel.includes(wrong)) && (inp === corr || corr.includes(inp) || inp.includes(corr))
      el.querySelector('#gram-input').disabled = true; el.querySelector('#q-check').disabled = true
      showFb(ok)
    }
    el.querySelector('#gram-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') check() })
    el.querySelector('#q-check')?.addEventListener('click', check)
    el.querySelector('#q-skip')?.addEventListener('click', () => { st.wrong++; st.idx++; renderQ(root) })
  } else if (q.type === 'multiple-choice') {
    el.querySelectorAll('.mc-opt').forEach(btn => btn.addEventListener('click', () => {
      const i = Number(btn.dataset.i)
      el.querySelectorAll('.mc-opt').forEach(b => {
        b.disabled = true
        if (Number(b.dataset.i) === q.answer) b.classList.add('correct-opt')
        else if (b === btn && i !== q.answer) b.classList.add('wrong-opt')
      })
      showFb(i === q.answer)
    }))
  } else {
    const input = el.querySelector('#gram-input')
    const check = () => {
      const val = (input?.value || '').trim().toLowerCase()
      if (!val) return
      const ans = (typeof q.answer === 'string' ? q.answer : '').toLowerCase()
      const alts = ans.split(',').map(s => s.trim())
      const ok = alts.some(a => val === a || a.includes(val) || val.includes(a))
      input.disabled = true; el.querySelector('#q-check').disabled = true; el.querySelector('#q-skip').disabled = true
      showFb(ok)
    }
    input?.addEventListener('keydown', e => { if (e.key === 'Enter') check() })
    el.querySelector('#q-check')?.addEventListener('click', check)
    el.querySelector('#q-skip')?.addEventListener('click', () => { st.wrong++; st.idx++; renderQ(root) })
    setTimeout(() => input?.focus(), 50)
  }
}
