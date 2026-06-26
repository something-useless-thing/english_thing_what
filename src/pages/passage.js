import { appStore, saveScore } from '../stores/store.js'
import { PASSAGES } from '../data/passages.js'

let blanks={}, activeId=null, unit=1, blankPct=5

export function renderPassage(root) { unit=1; blankPct=5; mount(root) }

// 본문에서 {단어} 제거하고 순수 텍스트만 추출
function getRawText(text) {
  return text.replace(/\{([^}]+)\}/g, '$1')
}

// 본문 전체 단어를 토큰 배열로 분리 (공백/줄바꿈 기준)
// 각 토큰: { word, isPunct, id }
function tokenizeAll(rawText) {
  const tokens = []
  // 단어와 구두점/공백 분리
  const parts = rawText.split(/(\s+)/)
  let id = 0
  for(const part of parts) {
    if(!part) continue
    if(/^\s+$/.test(part)) {
      tokens.push({ word: part, isSpace: true, id: id++ })
    } else {
      // 단어 자체만 빈칸 후보 (알파벳/한글 포함된 것만)
      const isWord = /[a-zA-Z가-힣]/.test(part)
      tokens.push({ word: part, isWord, isSpace: false, id: id++ })
    }
  }
  return tokens
}

function calcCount(totalWordCount) {
  return Math.max(1, Math.round(totalWordCount * blankPct / 100))
}

function updateLabel(root) {
  const rawText = getRawText(PASSAGES[unit].text)
  const allWordTokens = tokenizeAll(rawText).filter(t => t.isWord)
  const count = calcCount(allWordTokens.length)
  const label = root.querySelector('#pct-label')
  if(label) label.textContent = `${blankPct}% (${count}개)`
}

function mount(root) {
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;min-height:100vh">
      <nav class="top-nav">
        <button class="btn-back" id="back">←</button>
        <span class="nav-title">본문 빈칸</span>
        <div style="margin-left:auto;display:flex;gap:6px;align-items:center">
          <button class="btn btn-secondary" id="reshuffle-btn" style="padding:6px 12px;font-size:12px">🔀 다시</button>
          <button class="btn btn-success" id="grade-btn" style="padding:6px 14px;font-size:13px">채점</button>
        </div>
      </nav>
      <div class="screen" style="padding-top:.8rem;padding-bottom:5rem">
        <div style="display:flex;gap:6px;margin-bottom:.8rem">
          <button class="tab-btn active" id="u1">1단원</button>
          <button class="tab-btn" id="u2">2단원</button>
        </div>

        <div style="display:flex;align-items:center;gap:10px;margin-bottom:.9rem;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:.6rem 1rem">
          <span style="font-size:13px;color:var(--text3);white-space:nowrap">빈칸 비율</span>
          <input type="range" id="pct-slider" min="1" max="100" step="1" value="${blankPct}"
            style="flex:1;accent-color:var(--purple);cursor:pointer">
          <span id="pct-label" style="font-size:14px;font-weight:700;color:var(--purple-l);min-width:80px;text-align:right">${blankPct}% (?개)</span>
        </div>

        <div style="font-size:12px;color:var(--text3);margin-bottom:.6rem">
          🔵 파란 칸 클릭 → 답 입력 &nbsp;|&nbsp; 🔀 누르면 단어 다시 뽑기
        </div>
        <div class="passage-box" id="passage-box"></div>
        <div id="passage-result" style="display:none;margin-top:1rem" class="card"></div>
      </div>

      <div class="blank-input-bar" id="blank-bar" style="display:none">
        <span style="font-size:12px;color:var(--text3);min-width:40px">빈칸</span>
        <input class="input" id="blank-input" placeholder="답 입력..." style="flex:1" autocomplete="off">
        <button class="btn btn-primary" id="blank-submit">입력</button>
        <button class="btn btn-secondary" id="blank-close">✕</button>
      </div>
    </div>`

  root.querySelector('#back').addEventListener('click', ()=>appStore.set({screen:'main'}))
  root.querySelector('#u1').addEventListener('click', ()=>{ unit=1; buildPassage(root) })
  root.querySelector('#u2').addEventListener('click', ()=>{ unit=2; buildPassage(root) })
  root.querySelector('#grade-btn').addEventListener('click', ()=>gradePassage(root))
  root.querySelector('#reshuffle-btn').addEventListener('click', ()=>buildPassage(root))
  root.querySelector('#blank-submit').addEventListener('click', ()=>submitBlank(root))
  root.querySelector('#blank-close').addEventListener('click', ()=>closeBar(root))
  root.querySelector('#blank-input').addEventListener('keydown', e=>{ if(e.key==='Enter') submitBlank(root) })

  const slider = root.querySelector('#pct-slider')
  slider.addEventListener('input', ()=>{
    blankPct = Number(slider.value)
    updateLabel(root)  // 숫자만 업데이트
  })
  slider.addEventListener('change', ()=>{
    blankPct = Number(slider.value)
    buildPassage(root)  // 손 놓으면 재생성 + 새로 섞기
  })

  buildPassage(root)
}

function buildPassage(root) {
  root.querySelector('#u1').classList.toggle('active', unit===1)
  root.querySelector('#u2').classList.toggle('active', unit===2)
  root.querySelector('#passage-result').style.display = 'none'
  blanks = {}; activeId = null; closeBar(root)

  const rawText = getRawText(PASSAGES[unit].text)
  const tokens = tokenizeAll(rawText)
  const wordTokens = tokens.filter(t => t.isWord)
  const count = calcCount(wordTokens.length)

  // 라벨 업데이트
  const label = root.querySelector('#pct-label')
  if(label) label.textContent = `${blankPct}% (${count}개)`

  // 전체 단어 토큰 중 랜덤으로 count개 선택 → 매번 다른 단어가 뚫림
  const shuffled = [...wordTokens].sort(() => Math.random() - .5)
  const pickedIds = new Set(shuffled.slice(0, count).map(t => t.id))

  // 본문 렌더링
  let slotIdx = 0
  const parts = tokens.map(t => {
    if(t.isSpace) return t.word.replace(/\n/g, '<br>')
    if(t.isWord && pickedIds.has(t.id)) {
      const bid = `b${slotIdx++}`
      // 구두점이 단어에 붙어있을 경우 분리 (예: "gain." → word=gain, punct=.)
      const match = t.word.match(/^([a-zA-Z가-힣\-']+)([^a-zA-Z가-힣\-']*)$/)
      const wordPart = match ? match[1] : t.word
      const punctPart = match ? match[2] : ''
      blanks[bid] = { answer: wordPart.toLowerCase(), filled: '' }
      return `<span class="blank-slot" data-id="${bid}">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>${punctPart}`
    }
    return `<span>${t.word}</span>`
  })

  const box = root.querySelector('#passage-box')
  box.innerHTML = parts.join('')
  box.querySelectorAll('.blank-slot').forEach(s =>
    s.addEventListener('click', ()=>openBar(root, s.dataset.id)))
}

function openBar(root, id){
  activeId = id
  root.querySelector('#blank-bar').style.display = 'flex'
  const inp = root.querySelector('#blank-input')
  inp.value = blanks[id]?.filled || ''; inp.focus()
}
function submitBlank(root){
  if(!activeId) return
  const val = root.querySelector('#blank-input').value.trim()
  blanks[activeId].filled = val
  const slot = root.querySelector(`[data-id="${activeId}"]`)
  slot.textContent = val || '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0'
  slot.classList.toggle('filled', !!val); slot.classList.remove('correct','wrong')
  closeBar(root)
}
function closeBar(root){ root.querySelector('#blank-bar').style.display = 'none'; activeId = null }

function gradePassage(root){
  let correct=0, total=Object.keys(blanks).length
  if(total===0) return
  Object.entries(blanks).forEach(([id,d])=>{
    const slot = root.querySelector(`[data-id="${id}"]`)
    const ans = d.answer.toLowerCase().trim()
    const fill = d.filled.toLowerCase().trim()
    // ✅ 정확히 일치할 때만 정답 (includes 제거)
    const ok = fill !== '' && fill === ans
    slot.classList.remove('filled'); slot.classList.toggle('correct',ok); slot.classList.toggle('wrong',!ok)
    if(!d.filled) slot.textContent = d.answer
    if(ok) correct++
  })
  const score = Math.round((correct/total)*100)
  const res = root.querySelector('#passage-result')
  res.style.display = 'block'
  res.innerHTML = `
    <b>채점 결과:</b> ${correct} / ${total} &nbsp;→&nbsp; <b style="color:var(--purple-l)">${score}점</b><br>
    <span style="font-size:12px;color:var(--text3)">🟢 초록=정답 &nbsp; 🔴 빨강=오답</span><br>
    <button class="btn btn-secondary" id="retry-btn" style="margin-top:.8rem;font-size:13px">🔀 다른 단어로 다시 풀기</button>`
  res.querySelector('#retry-btn').addEventListener('click', ()=>buildPassage(root))
  saveScore('passage', score)
}
