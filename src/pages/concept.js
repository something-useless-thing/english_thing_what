import { appStore } from '../stores/store.js'
import { WORDS } from '../data/words.js'
import { GRAMMAR_CONCEPTS } from '../data/grammar.js'

let hlRange = null

export function renderConcept(root) {
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;min-height:100vh">
      <nav class="top-nav">
        <button class="btn-back" id="back">←</button>
        <span class="nav-title">개념 학습</span>
        <span style="font-size:12px;color:var(--text3);margin-left:auto">드래그 → 형광펜</span>
      </nav>

      <div style="display:flex;gap:0;border-bottom:1px solid var(--border);background:var(--surface2)">
        <button class="tab-btn" id="tab-w1" style="border-radius:0;border:none;border-right:1px solid var(--border)">📝 1과 단어</button>
        <button class="tab-btn" id="tab-w2" style="border-radius:0;border:none;border-right:1px solid var(--border)">📝 2과 단어</button>
        <button class="tab-btn" id="tab-g1" style="border-radius:0;border:none;border-right:1px solid var(--border)">✏️ 1과 문법</button>
        <button class="tab-btn" id="tab-g2" style="border-radius:0;border:none">✏️ 2과 문법</button>
      </div>

      <div class="screen" id="concept-body" style="padding-top:1rem"></div>
    </div>

    <div class="hl-toolbar" id="hl-toolbar">
      <button class="hl-btn" style="background:#FFD700" data-color="#FFD700" title="노랑"></button>
      <button class="hl-btn" style="background:#7BE0A8" data-color="#7BE0A8" title="초록"></button>
      <button class="hl-btn" style="background:#7EB8FF" data-color="#7EB8FF" title="파랑"></button>
      <button class="hl-btn" style="background:#FF9999" data-color="#FF9999" title="빨강"></button>
      <button class="hl-btn" style="background:var(--surface2);border:1px solid var(--border2);color:var(--text3);font-size:11px;width:auto;padding:0 6px" id="hl-remove">지우기</button>
    </div>`

  root.querySelector('#back').addEventListener('click', () => appStore.set({ screen: 'main' }))

  const tabs = {
    'tab-w1': () => renderWords(root, 1),
    'tab-w2': () => renderWords(root, 2),
    'tab-g1': () => renderGrammar(root, 1),
    'tab-g2': () => renderGrammar(root, 2),
  }
  Object.entries(tabs).forEach(([id, fn]) => {
    root.querySelector('#' + id).addEventListener('click', () => {
      Object.keys(tabs).forEach(k => root.querySelector('#' + k).classList.remove('active'))
      root.querySelector('#' + id).classList.add('active')
      fn()
    })
  })

  // 기본: 1과 단어
  root.querySelector('#tab-w1').classList.add('active')
  renderWords(root, 1)

  // 형광펜
  document.addEventListener('mouseup', onSelect)
  root.querySelector('#hl-toolbar').querySelectorAll('[data-color]').forEach(btn => {
    btn.addEventListener('click', () => applyHL(btn.dataset.color))
  })
  root.querySelector('#hl-remove').addEventListener('click', removeHL)
  document.addEventListener('click', e => {
    if (!e.target.closest('#hl-toolbar') && !e.target.closest('#concept-body')) {
      root.querySelector('#hl-toolbar').style.display = 'none'
    }
  })
}

function renderWords(root, unit) {
  const body = root.querySelector('#concept-body')
  body.innerHTML = `
    <div class="section-header">${unit}과 단어 (${WORDS[unit].length}개)</div>
    <table class="word-table">
      ${WORDS[unit].map(w => `<tr><td>${w.en}</td><td>${w.ko}</td></tr>`).join('')}
    </table>`
}

function renderGrammar(root, unit) {
  const gd = GRAMMAR_CONCEPTS[unit]
  const body = root.querySelector('#concept-body')
  body.innerHTML = `
    <div class="section-header">${gd.title}</div>
    ${gd.sections.map(sec => `
      <h3 style="font-size:.95rem;font-weight:700;color:var(--text);margin:1.2rem 0 .5rem">${sec.title}</h3>
      <div class="grammar-block">
        <p>${sec.content}</p>
        <p class="grammar-pattern">패턴: ${sec.pattern}</p>
      </div>
      ${sec.examples.map(ex => `
        <div class="grammar-example">
          <div class="en">${ex.en}</div>
          <div class="ko">${ex.ko}</div>
        </div>`).join('')}
      ${sec.note ? `<div class="grammar-note">${sec.note}</div>` : ''}
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
    const rect = hlRange.getBoundingClientRect()
    const toolbar = document.querySelector('#hl-toolbar')
    toolbar.style.display = 'flex'
    toolbar.style.left = Math.max(0, rect.left + rect.width / 2 - 80) + 'px'
    toolbar.style.top = (rect.top - 44 + window.scrollY) + 'px'
  } catch {}
}

function applyHL(color) {
  if (!hlRange) return
  const span = document.createElement('span')
  span.style.background = color
  span.style.borderRadius = '3px'
  span.style.color = '#111'
  try { hlRange.surroundContents(span) } catch {}
  document.querySelector('#hl-toolbar').style.display = 'none'
  window.getSelection().removeAllRanges()
  hlRange = null
}

function removeHL() {
  if (!hlRange) return
  const el = hlRange.commonAncestorContainer.parentElement
  if (el?.style?.background) el.replaceWith(...el.childNodes)
  document.querySelector('#hl-toolbar').style.display = 'none'
  hlRange = null
}