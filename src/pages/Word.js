import { appStore, saveScore, shuffle } from '../stores/store.js'
import { WORDS } from '../data/words.js'

let st = {}
function init() { st = { unit:1, mode:'flash', list:[], idx:0, flipped:false, correct:0, wrong:0 } }
function getList(u) { return shuffle(u===0?[...WORDS[1],...WORDS[2]]:[...WORDS[u]]) }

export function renderWord(root) { init(); st.list=getList(1); mount(root) }

function mount(root) {
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;min-height:100vh">
      <nav class="top-nav">
        <button class="btn-back" id="back">←</button>
        <span class="nav-title">단어 맞추기</span>
      </nav>
      <div class="screen" style="padding-top:.8rem">
        <div style="display:flex;gap:6px;margin-bottom:.7rem" id="unit-tabs">
          <button class="tab-btn active" data-unit="1">1과</button>
          <button class="tab-btn" data-unit="2">2과</button>
          <button class="tab-btn" data-unit="0">전체</button>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:1.2rem;flex-wrap:wrap" id="mode-tabs">
          <button class="tab-btn active" data-mode="flash">🃏 플래시카드</button>
          <button class="tab-btn" data-mode="quiz-ko">🇰🇷→🇺🇸 한→영</button>
          <button class="tab-btn" data-mode="quiz-en">🇺🇸→🇰🇷 영→한</button>
        </div>
        <div id="word-content"></div>
      </div>
    </div>`

  root.querySelector('#back').addEventListener('click', ()=>appStore.set({screen:'main'}))
  root.querySelectorAll('#unit-tabs .tab-btn').forEach(btn=>btn.addEventListener('click',()=>{
    st.unit=Number(btn.dataset.unit); st.list=getList(st.unit); st.idx=0; st.flipped=false; st.correct=0; st.wrong=0
    root.querySelectorAll('#unit-tabs .tab-btn').forEach(b=>b.classList.toggle('active',b===btn))
    renderContent(root)
  }))
  root.querySelectorAll('#mode-tabs .tab-btn').forEach(btn=>btn.addEventListener('click',()=>{
    st.mode=btn.dataset.mode; st.idx=0; st.flipped=false; st.correct=0; st.wrong=0; st.list=getList(st.unit)
    root.querySelectorAll('#mode-tabs .tab-btn').forEach(b=>b.classList.toggle('active',b===btn))
    renderContent(root)
  }))
  renderContent(root)
}

function renderContent(root) {
  const el = root.querySelector('#word-content')
  el.innerHTML = st.mode==='flash' ? flashHTML() : quizHTML()
  bindContent(root)
}

function flashHTML() {
  const w = st.list[st.idx]
  return `
    <div class="progress-text">${st.idx+1} / ${st.list.length}</div>
    <div class="flashcard-wrap" id="fc-wrap">
      <div class="flashcard-inner ${st.flipped?'flipped':''}" id="fc-inner">
        <div class="flashcard-face front">${w.en}<div class="fc-hint">클릭해서 뒤집기</div></div>
        <div class="flashcard-face back">${w.ko}</div>
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:1.2rem">
      <button class="btn btn-secondary" id="fc-prev">← 이전</button>
      <button class="btn btn-secondary" id="fc-shuffle">🔀 섞기</button>
      <button class="btn btn-primary" id="fc-next">다음 →</button>
    </div>`
}

function quizHTML() {
  if(st.idx >= st.list.length) {
    const score = Math.round((st.correct/st.list.length)*100)
    saveScore('word', score)
    return `<div class="result-screen"><div class="result-score">${score}점</div><div class="result-label">${st.correct}개 정답 / ${st.list.length}개</div><button class="btn btn-primary" id="retry">다시 풀기</button></div>`
  }
  const w=st.list[st.idx], isKo=st.mode==='quiz-ko'
  return `
    <div class="score-row">
      <div class="score-chip"><span class="c">${st.correct}</span>정답</div>
      <div class="score-chip"><span class="w">${st.wrong}</span>오답</div>
      <div class="score-chip"><span class="r">${st.list.length-st.idx}</span>남음</div>
    </div>
    <div class="card">
      <div class="progress-text">${st.idx+1} / ${st.list.length}</div>
      <div style="font-size:1.3rem;font-weight:700;text-align:center;min-height:52px;margin-bottom:1rem;display:flex;align-items:center;justify-content:center">${isKo?w.ko:w.en}</div>
      <input class="input" id="quiz-input" placeholder="${isKo?'영어로 입력...':'한국어로 입력...'}" autocomplete="off">
      <div style="display:flex;gap:8px;margin-top:.8rem">
        <button class="btn btn-primary" id="quiz-check">확인</button>
        <button class="btn btn-secondary" id="quiz-skip">건너뛰기</button>
      </div>
      <div class="feedback" id="quiz-feedback" style="display:none"></div>
    </div>`
}

function isCorrectAnswer(val, answer) {
  const v = val.toLowerCase().trim()
  // 정답이 여러 개(쉼표 구분)면 하나라도 정확히 일치하면 정답
  const answers = answer.toLowerCase().split(',').map(s => s.trim())
  return answers.some(a => v === a)
}

function bindContent(root) {
  const el = root.querySelector('#word-content')

  el.querySelector('#fc-wrap')?.addEventListener('click',()=>{
    st.flipped=!st.flipped; el.querySelector('#fc-inner')?.classList.toggle('flipped',st.flipped)
  })
  el.querySelector('#fc-prev')?.addEventListener('click',()=>{
    st.idx=(st.idx-1+st.list.length)%st.list.length; st.flipped=false; renderContent(root)
  })
  el.querySelector('#fc-next')?.addEventListener('click',()=>{
    st.idx=(st.idx+1)%st.list.length; st.flipped=false; renderContent(root)
  })
  el.querySelector('#fc-shuffle')?.addEventListener('click',()=>{
    st.list=shuffle(st.list); st.idx=0; st.flipped=false; renderContent(root)
  })
  el.querySelector('#retry')?.addEventListener('click',()=>{
    st.correct=0; st.wrong=0; st.idx=0; st.list=getList(st.unit); renderContent(root)
  })

  const input = el.querySelector('#quiz-input')
  const check = () => {
    if(!input) return
    const val = input.value.trim()
    if(!val) return
    const w = st.list[st.idx]
    const answer = st.mode==='quiz-ko' ? w.en : w.ko
    const ok = isCorrectAnswer(val, answer)
    if(ok) st.correct++; else st.wrong++

    const fb = el.querySelector('#quiz-feedback')
    fb.style.display = 'block'
    fb.className = `feedback ${ok?'correct':'wrong'}`
    fb.textContent = ok
      ? `✓ 정답! ${answer}`
      : `✗ 오답. 정답: ${answer}`

    el.querySelector('#quiz-check').disabled = true
    el.querySelector('#quiz-skip').disabled = true
    input.disabled = true
    setTimeout(()=>{ st.idx++; renderContent(root) }, 1300)
  }
  input?.addEventListener('keydown', e=>{ if(e.key==='Enter') check() })
  el.querySelector('#quiz-check')?.addEventListener('click', check)
  el.querySelector('#quiz-skip')?.addEventListener('click',()=>{
    st.wrong++; st.idx++; renderContent(root)
  })
  setTimeout(()=>input?.focus(), 50)
}
