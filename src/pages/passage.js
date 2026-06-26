import { appStore, saveScore } from '../stores/store.js'
import { PASSAGES } from '../data/passages.js'

let blanks={}, activeId=null, unit=1, blankCount=8

export function renderPassage(root) { unit=1; blankCount=8; mount(root) }

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
          <span style="font-size:13px;color:var(--text3);white-space:nowrap">빈칸 개수</span>
          <input type="range" id="count-slider" min="1" max="20" value="${blankCount}" style="flex:1;accent-color:var(--purple);cursor:pointer">
          <span id="count-label" style="font-size:15px;font-weight:700;color:var(--purple-l);min-width:28px;text-align:right">${blankCount}개</span>
        </div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:.6rem">🔵 파란 칸 클릭 → 답 입력 &nbsp;|&nbsp; 🔀 단어 다시 뽑기</div>
        <div class="passage-box" id="passage-box"></div>
        <div id="passage-result" style="display:none;margin-top:1rem" class="card"></div>
      </div>
      <div class="blank-input-bar" id="blank-bar" style="display:none">
        <span style="font-size:12px;color:var(--text3);min-width:40px">빈칸</span>
        <input class="input" id="blank-input" placeholder="답 입력..." style="flex:1">
        <button class="btn btn-primary" id="blank-submit">입력</button>
        <button class="btn btn-secondary" id="blank-close">✕</button>
      </div>
    </div>`

  root.querySelector('#back').addEventListener('click', ()=>appStore.set({screen:'main'}))
  root.querySelector('#u1').addEventListener('click', ()=>{unit=1;buildPassage(root)})
  root.querySelector('#u2').addEventListener('click', ()=>{unit=2;buildPassage(root)})
  root.querySelector('#grade-btn').addEventListener('click', ()=>gradePassage(root))
  root.querySelector('#reshuffle-btn').addEventListener('click', ()=>buildPassage(root))
  root.querySelector('#blank-submit').addEventListener('click', ()=>submitBlank(root))
  root.querySelector('#blank-close').addEventListener('click', ()=>closeBar(root))
  root.querySelector('#blank-input').addEventListener('keydown', e=>{if(e.key==='Enter')submitBlank(root)})

  const slider=root.querySelector('#count-slider')
  const label=root.querySelector('#count-label')
  slider.addEventListener('input', ()=>{ blankCount=Number(slider.value); label.textContent=blankCount+'개' })
  slider.addEventListener('change', ()=>buildPassage(root))

  buildPassage(root)
}

function buildPassage(root) {
  root.querySelector('#u1').classList.toggle('active',unit===1)
  root.querySelector('#u2').classList.toggle('active',unit===2)
  root.querySelector('#passage-result').style.display='none'
  blanks={}; activeId=null; closeBar(root)

  const text = PASSAGES[unit].text

  // {단어}가 있는 위치(인덱스)를 전부 수집
  // 같은 단어가 여러 번 나와도 각각 별개로 취급
  const candidates = []
  const re = /\{([^}]+)\}/g
  let m, idx = 0
  while((m = re.exec(text)) !== null) {
    candidates.push({ word: m[1], matchIndex: m.index, id: idx++ })
  }

  // 슬라이더 최대값 조정
  const slider = root.querySelector('#count-slider')
  if(slider){
    slider.max = candidates.length
    if(blankCount > candidates.length){
      blankCount = candidates.length
      slider.value = blankCount
      root.querySelector('#count-label').textContent = blankCount + '개'
    }
  }

  // candidates를 섞어서 앞에서 blankCount개만 빈칸으로 선택
  // → 매번 다른 단어들이 뚫림
  const shuffled = [...candidates].sort(() => Math.random() - .5)
  const pickedIds = new Set(shuffled.slice(0, blankCount).map(c => c.id))

  // 본문 렌더링: 선택된 id만 빈칸, 나머지는 그냥 텍스트
  let slotIdx = 0
  let occurrenceIdx = 0
  const html = text
    .replace(/\{([^}]+)\}/g, (_, word) => {
      const curId = occurrenceIdx++
      if(pickedIds.has(curId)){
        const bid = `b${slotIdx++}`
        blanks[bid] = { answer: word, filled: '' }
        return `<span class="blank-slot" data-id="${bid}">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>`
      }
      return word
    })
    .replace(/\n\n/g, '<br><br>')

  const box = root.querySelector('#passage-box')
  box.innerHTML = html
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
function closeBar(root){ root.querySelector('#blank-bar').style.display='none'; activeId=null }

function gradePassage(root){
  let correct=0, total=Object.keys(blanks).length
  Object.entries(blanks).forEach(([id,d])=>{
    const slot = root.querySelector(`[data-id="${id}"]`)
    const ans = d.answer.toLowerCase().trim()
    const fill = d.filled.toLowerCase().trim()
    const ok = fill && (fill===ans || ans.includes(fill) || fill.includes(ans))
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
