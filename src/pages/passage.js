import { appStore, saveScore } from '../stores/store.js'
import { PASSAGES } from '../data/passages.js'

let blanks = {}
let activeId = null
let unit = 1

export function renderPassage(root) {
  unit = 1; mount(root)
}

function mount(root) {
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;min-height:100vh">
      <nav class="top-nav">
        <button class="btn-back" id="back">←</button>
        <span class="nav-title">본문 빈칸</span>
        <button class="btn btn-success" id="grade-btn" style="margin-left:auto;padding:6px 14px;font-size:13px">채점하기</button>
      </nav>

      <div class="screen" style="padding-top:.8rem;padding-bottom:5rem">
        <div style="display:flex;gap:6px;margin-bottom:.8rem">
          <button class="tab-btn ${unit===1?'active':''}" id="u1">1단원</button>
          <button class="tab-btn ${unit===2?'active':''}" id="u2">2단원</button>
        </div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:.6rem">🔵 파란 칸 클릭 → 답 입력</div>
        <div class="passage-box" id="passage-box"></div>
        <div id="passage-result" style="display:none;margin-top:1rem" class="card"></div>
      </div>

      <div class="blank-input-bar" id="blank-bar" style="display:none">
        <span style="font-size:13px;color:var(--text3);min-width:50px" id="blank-label">빈칸</span>
        <input class="input" id="blank-input" placeholder="답 입력..." style="flex:1">
        <button class="btn btn-primary btn-sm" id="blank-submit">입력</button>
        <button class="btn btn-secondary btn-sm" id="blank-close">✕</button>
      </div>
    </div>`

  root.querySelector('#back').addEventListener('click', () => appStore.set({ screen: 'main' }))
  root.querySelector('#u1').addEventListener('click', () => { unit = 1; buildPassage(root) })
  root.querySelector('#u2').addEventListener('click', () => { unit = 2; buildPassage(root) })
  root.querySelector('#grade-btn').addEventListener('click', () => gradePassage(root))
  root.querySelector('#blank-submit').addEventListener('click', () => submitBlank(root))
  root.querySelector('#blank-close').addEventListener('click', () => closeBar(root))
  root.querySelector('#blank-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitBlank(root)
  })

  buildPassage(root)
}

function buildPassage(root) {
  root.querySelector('#u1').classList.toggle('active', unit === 1)
  root.querySelector('#u2').classList.toggle('active', unit === 2)
  root.querySelector('#passage-result').style.display = 'none'
  blanks = {}
  activeId = null
  closeBar(root)

  const text = PASSAGES[unit].text
  let id = 0
  const html = text
    .replace(/\{([^}]+)\}/g, (_, word) => {
      const bid = `b${id++}`
      blanks[bid] = { answer: word, filled: '' }
      return `<span class="blank-slot" data-id="${bid}">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>`
    })
    .replace(/\n\n/g, '<br><br>')

  const box = root.querySelector('#passage-box')
  box.innerHTML = html
  box.querySelectorAll('.blank-slot').forEach(slot => {
    slot.addEventListener('click', () => openBar(root, slot.dataset.id))
  })
}

function openBar(root, id) {
  activeId = id
  const bar = root.querySelector('#blank-bar')
  bar.style.display = 'flex'
  const inp = root.querySelector('#blank-input')
  inp.value = blanks[id]?.filled || ''
  inp.focus()
}

function submitBlank(root) {
  if (!activeId) return
  const val = root.querySelector('#blank-input').value.trim()
  blanks[activeId].filled = val
  const slot = root.querySelector(`[data-id="${activeId}"]`)
  slot.textContent = val || '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0'
  slot.classList.toggle('filled', !!val)
  slot.classList.remove('correct', 'wrong')
  closeBar(root)
}

function closeBar(root) {
  root.querySelector('#blank-bar').style.display = 'none'
  activeId = null
}

function gradePassage(root) {
  let correct = 0
  const total = Object.keys(blanks).length
  Object.entries(blanks).forEach(([id, d]) => {
    const slot = root.querySelector(`[data-id="${id}"]`)
    const ans = d.answer.toLowerCase().trim()
    const fill = d.filled.toLowerCase().trim()
    const ok = fill && (fill === ans || ans.includes(fill) || fill.includes(ans))
    slot.classList.remove('filled')
    slot.classList.toggle('correct', ok)
    slot.classList.toggle('wrong', !ok)
    if (!d.filled) slot.textContent = d.answer
    if (ok) correct++
  })
  const score = Math.round((correct / total) * 100)
  const res = root.querySelector('#passage-result')
  res.style.display = 'block'
  res.innerHTML = `<b>채점 결과:</b> ${correct} / ${total} 정답 &nbsp;→&nbsp; <b style="color:var(--purple-light)">${score}점</b><br>
    <span style="font-size:12px;color:var(--text3)">🟢 초록 = 정답 &nbsp; 🔴 빨강 = 오답</span>`
  saveScore('passage', score)
}import { appStore, saveScore } from '../stores/store.js'
import { PASSAGES } from '../data/passages.js'

let blanks = {}
let activeId = null
let unit = 1

export function renderPassage(root) {
  unit = 1; mount(root)
}

function mount(root) {
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;min-height:100vh">
      <nav class="top-nav">
        <button class="btn-back" id="back">←</button>
        <span class="nav-title">본문 빈칸</span>
        <button class="btn btn-success" id="grade-btn" style="margin-left:auto;padding:6px 14px;font-size:13px">채점하기</button>
      </nav>

      <div class="screen" style="padding-top:.8rem;padding-bottom:5rem">
        <div style="display:flex;gap:6px;margin-bottom:.8rem">
          <button class="tab-btn ${unit===1?'active':''}" id="u1">1단원</button>
          <button class="tab-btn ${unit===2?'active':''}" id="u2">2단원</button>
        </div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:.6rem">🔵 파란 칸 클릭 → 답 입력</div>
        <div class="passage-box" id="passage-box"></div>
        <div id="passage-result" style="display:none;margin-top:1rem" class="card"></div>
      </div>

      <div class="blank-input-bar" id="blank-bar" style="display:none">
        <span style="font-size:13px;color:var(--text3);min-width:50px" id="blank-label">빈칸</span>
        <input class="input" id="blank-input" placeholder="답 입력..." style="flex:1">
        <button class="btn btn-primary btn-sm" id="blank-submit">입력</button>
        <button class="btn btn-secondary btn-sm" id="blank-close">✕</button>
      </div>
    </div>`

  root.querySelector('#back').addEventListener('click', () => appStore.set({ screen: 'main' }))
  root.querySelector('#u1').addEventListener('click', () => { unit = 1; buildPassage(root) })
  root.querySelector('#u2').addEventListener('click', () => { unit = 2; buildPassage(root) })
  root.querySelector('#grade-btn').addEventListener('click', () => gradePassage(root))
  root.querySelector('#blank-submit').addEventListener('click', () => submitBlank(root))
  root.querySelector('#blank-close').addEventListener('click', () => closeBar(root))
  root.querySelector('#blank-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitBlank(root)
  })

  buildPassage(root)
}

function buildPassage(root) {
  root.querySelector('#u1').classList.toggle('active', unit === 1)
  root.querySelector('#u2').classList.toggle('active', unit === 2)
  root.querySelector('#passage-result').style.display = 'none'
  blanks = {}
  activeId = null
  closeBar(root)

  const text = PASSAGES[unit].text
  let id = 0
  const html = text
    .replace(/\{([^}]+)\}/g, (_, word) => {
      const bid = `b${id++}`
      blanks[bid] = { answer: word, filled: '' }
      return `<span class="blank-slot" data-id="${bid}">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>`
    })
    .replace(/\n\n/g, '<br><br>')

  const box = root.querySelector('#passage-box')
  box.innerHTML = html
  box.querySelectorAll('.blank-slot').forEach(slot => {
    slot.addEventListener('click', () => openBar(root, slot.dataset.id))
  })
}

function openBar(root, id) {
  activeId = id
  const bar = root.querySelector('#blank-bar')
  bar.style.display = 'flex'
  const inp = root.querySelector('#blank-input')
  inp.value = blanks[id]?.filled || ''
  inp.focus()
}

function submitBlank(root) {
  if (!activeId) return
  const val = root.querySelector('#blank-input').value.trim()
  blanks[activeId].filled = val
  const slot = root.querySelector(`[data-id="${activeId}"]`)
  slot.textContent = val || '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0'
  slot.classList.toggle('filled', !!val)
  slot.classList.remove('correct', 'wrong')
  closeBar(root)
}

function closeBar(root) {
  root.querySelector('#blank-bar').style.display = 'none'
  activeId = null
}

function gradePassage(root) {
  let correct = 0
  const total = Object.keys(blanks).length
  Object.entries(blanks).forEach(([id, d]) => {
    const slot = root.querySelector(`[data-id="${id}"]`)
    const ans = d.answer.toLowerCase().trim()
    const fill = d.filled.toLowerCase().trim()
    const ok = fill && (fill === ans || ans.includes(fill) || fill.includes(ans))
    slot.classList.remove('filled')
    slot.classList.toggle('correct', ok)
    slot.classList.toggle('wrong', !ok)
    if (!d.filled) slot.textContent = d.answer
    if (ok) correct++
  })
  const score = Math.round((correct / total) * 100)
  const res = root.querySelector('#passage-result')
  res.style.display = 'block'
  res.innerHTML = `<b>채점 결과:</b> ${correct} / ${total} 정답 &nbsp;→&nbsp; <b style="color:var(--purple-light)">${score}점</b><br>
    <span style="font-size:12px;color:var(--text3)">🟢 초록 = 정답 &nbsp; 🔴 빨강 = 오답</span>`
  saveScore('passage', score)
}