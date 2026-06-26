import { appStore } from '../stores/store.js'
import { WORDS } from '../data/words.js'
import { GRAMMAR_CONCEPTS } from '../data/grammar.js'
import { PASSAGES } from '../data/passages.js'

let hlRange = null

export function renderConcept(root) {
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;min-height:100vh">
      <nav class="top-nav">
        <button class="btn-back" id="back">←</button>
        <span class="nav-title">개념 학습</span>
        <span style="font-size:12px;color:var(--text3);margin-left:auto">드래그 → 형광펜</span>
      </nav>
      <div style="display:flex;gap:0;border-bottom:1px solid var(--border);background:var(--surface2);overflow-x:auto;flex-shrink:0">
        <button class="tab-btn active" id="tab-w1" style="border-radius:0;border:none;border-right:1px solid var(--border);white-space:nowrap">📝 1과 단어</button>
        <button class="tab-btn" id="tab-w2" style="border-radius:0;border:none;border-right:1px solid var(--border);white-space:nowrap">📝 2과 단어</button>
        <button class="tab-btn" id="tab-p1" style="border-radius:0;border:none;border-right:1px solid var(--border);white-space:nowrap">📄 1과 본문</button>
        <button class="tab-btn" id="tab-p2" style="border-radius:0;border:none;border-right:1px solid var(--border);white-space:nowrap">📄 2과 본문</button>
        <button class="tab-btn" id="tab-g1" style="border-radius:0;border:none;border-right:1px solid var(--border);white-space:nowrap">✏️ 1과 문법</button>
        <button class="tab-btn" id="tab-g2" style="border-radius:0;border:none;white-space:nowrap">✏️ 2과 문법</button>
      </div>
      <div class="screen" id="concept-body" style="padding-top:1rem;overflow-y:auto"></div>
    </div>
    <div class="hl-toolbar" id="hl-toolbar">
      <button class="hl-btn" style="background:#FFD700" data-color="#FFD700"></button>
      <button class="hl-btn" style="background:#7BE0A8" data-color="#7BE0A8"></button>
      <button class="hl-btn" style="background:#7EB8FF" data-color="#7EB8FF"></button>
      <button class="hl-btn" style="background:#FF9999" data-color="#FF9999"></button>
      <button class="hl-btn" style="background:var(--surface2);border:1px solid var(--border2);color:var(--text3);width:auto;padding:0 6px;font-size:11px" id="hl-remove">지우기</button>
    </div>`

  root.querySelector('#back').addEventListener('click', () => appStore.set({ screen: 'main' }))

  const tabs = {
    'tab-w1': () => showWords(root, 1),
    'tab-w2': () => showWords(root, 2),
    'tab-p1': () => showPassage(root, 1),
    'tab-p2': () => showPassage(root, 2),
    'tab-g1': () => showGram(root, 1),
    'tab-g2': () => showGram(root, 2),
  }
  Object.entries(tabs).forEach(([id, fn]) => {
    root.querySelector('#' + id).addEventListener('click', () => {
      Object.keys(tabs).forEach(k => root.querySelector('#' + k).classList.remove('active'))
      root.querySelector('#' + id).classList.add('active')
      fn()
    })
  })

  showWords(root, 1)

  document.addEventListener('mouseup', onSelect)
  root.querySelector('#hl-toolbar').querySelectorAll('[data-color]').forEach(btn =>
    btn.addEventListener('click', () => applyHL(btn.dataset.color)))
  root.querySelector('#hl-remove').addEventListener('click', removeHL)
  document.addEventListener('click', e => {
    if (!e.target.closest('#hl-toolbar') && !e.target.closest('#concept-body'))
      root.querySelector('#hl-toolbar').style.display = 'none'
  })
}

function showWords(root, unit) {
  root.querySelector('#concept-body').innerHTML = `
    <div class="section-header">${unit}과 단어 (${WORDS[unit].length}개)</div>
    <table class="word-table">
      ${WORDS[unit].map(w => `<tr><td>${w.en}</td><td>${w.ko}</td></tr>`).join('')}
    </table>`
}

function showPassage(root, unit) {
  const p = PASSAGES[unit]
  // {단어}를 형광펜 강조 표시로 변환
  const html = p.text
    .replace(/\{([^}]+)\}/g, (_, word) =>
      `<mark style="background:#3a2a6a;color:#c4b5fd;border-radius:3px;padding:0 3px">${word}</mark>`)
    .replace(/\n\n/g, '</p><p style="margin-top:.9rem">')

  root.querySelector('#concept-body').innerHTML = `
    <div class="section-header">${p.title}</div>
    <div style="font-size:13px;color:var(--text3);margin-bottom:.8rem">
      💜 보라색 = 빈칸 문제에 나오는 단어
    </div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:1.2rem;line-height:2;font-size:14.5px">
      <p>${html}</p>
    </div>`
}

function showGram(root, unit) {
  const gd = GRAMMAR_CONCEPTS[unit]
  root.querySelector('#concept-body').innerHTML = `
    <div class="section-header">${gd.title}</div>
    ${gd.sections.map(sec => `
      <h3 style="font-size:.95rem;font-weight:700;margin:1.2rem 0 .5rem">${sec.title}</h3>
      <div class="grammar-block">
        <p>${sec.content}</p>
        <p class="grammar-pattern">패턴: ${sec.pattern}</p>
      </div>
      ${sec.examples.map(ex => `
        <div class="grammar-example">
          <div class="en">${ex.en}</div>
          <div class="ko">${ex.ko}</div>
        </div>`).join('')}
      ${sec.note ? `<div style="font-size:12px;color:var(--text3);background:var(--surface2);border-radius:6px;padding:.5rem .8rem;margin-top:.5rem">${sec.note}</div>` : ''}
    `).join('<hr class="divider">')}`
}

function onSelect() {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !sel.toString().trim()) {
    document.querySelector('#hl-toolbar').style.display = 'none'
    return
  }
  try {
    hlRange = sel.getRangeAt(0)
    const rect = hlRange.getBoundingClientRect(), toolbar = document.querySelector('#hl-toolbar')
    toolbar.style.display = 'flex'
    toolbar.style.left = Math.max(0, rect.left + rect.width / 2 - 80) + 'px'
    toolbar.style.top = (rect.top - 44 + window.scrollY) + 'px'
  } catch {}
}
function applyHL(color) {
  if (!hlRange) return
  const span = document.createElement('span')
  span.style.background = color; span.style.borderRadius = '3px'; span.style.color = '#111'
  try { hlRange.surroundContents(span) } catch {}
  document.querySelector('#hl-toolbar').style.display = 'none'
  window.getSelection().removeAllRanges(); hlRange = null
}
function removeHL() {
  if (!hlRange) return
  const el = hlRange.commonAncestorContainer.parentElement
  if (el?.style?.background) el.replaceWith(...el.childNodes)
  document.querySelector('#hl-toolbar').style.display = 'none'; hlRange = null
}
