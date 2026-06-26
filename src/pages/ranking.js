import { appStore, rankStore } from '../stores/store.js'

const TYPES = [
  { id: 'comprehensive', label: '🎯 종합' },
  { id: 'word',          label: '📝 단어' },
  { id: 'passage',       label: '📄 본문' },
  { id: 'grammar',       label: '✏️ 문법' },
]
let activeType = 'comprehensive'

export function renderRanking(root) {
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;min-height:100vh">
      <nav class="top-nav">
        <button class="btn-back" id="back">←</button>
        <span class="nav-title">🏆 랭킹</span>
      </nav>
      <div class="screen" style="padding-top:.8rem">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem" id="rank-tabs">
          ${TYPES.map(t => `<button class="tab-btn ${t.id === activeType ? 'active' : ''}" data-type="${t.id}">${t.label}</button>`).join('')}
        </div>
        <div class="card" id="rank-list-wrap"></div>
      </div>
    </div>`

  root.querySelector('#back').addEventListener('click', () => appStore.set({ screen: 'main' }))
  root.querySelectorAll('#rank-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeType = btn.dataset.type
      root.querySelectorAll('#rank-tabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn))
      renderList(root)
    })
  })
  renderList(root)
}

function renderList(root) {
  const { scores } = rankStore.get()
  const list = scores[activeType] || []
  const wrap = root.querySelector('#rank-list-wrap')

  if (!list.length) {
    wrap.innerHTML = `<div style="text-align:center;padding:2.5rem 1rem;color:var(--text3);font-size:14px">
      아직 기록이 없음 :(<br>
      ${activeType === 'comprehensive' ? '종합 문제 풀고 등록해봐!' : '문제 풀면 자동 등록됨!'}
    </div>`
    return
  }

  wrap.innerHTML = list.map((item, i) => {
    const style = i === 0 ? 'background:#FFD700;color:#000'
      : i === 1 ? 'background:#C0C0C0;color:#000'
      : i === 2 ? 'background:#CD7F32;color:#fff'
      : 'background:var(--surface);color:var(--text3);border:1px solid var(--border)'
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1
    return `<div class="rank-item">
      <div class="rank-num" style="${style}">${medal}</div>
      <div class="rank-name">${item.name}</div>
      <div class="rank-date">${item.date}</div>
      <div class="rank-score">${item.score}점</div>
    </div>`
  }).join('')
}
