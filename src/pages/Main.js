import { appStore, rankStore } from '../stores/store.js'

export function renderMain(root) {
  const { playerName } = rankStore.get()

  root.innerHTML = `
    <div style="display:flex;flex-direction:column;min-height:100vh">
      <div class="screen" style="padding-top:0">
        <div class="main-header">
          <div class="main-title">영어 학습</div>
          <div class="main-sub">단원별 학습과 문제 풀이</div>
        </div>

        <div style="margin-bottom:1.2rem">
          <div style="font-size:12px;color:var(--text3);margin-bottom:.4rem">이름 (랭킹 등록용)</div>
          <div style="display:flex;gap:8px">
            <input class="input" id="name-input" placeholder="이름 입력..." value="${playerName}" style="flex:1">
            <button class="btn btn-secondary" id="name-save">저장</button>
          </div>
        </div>

        <div class="menu-grid">
          <button class="menu-card" data-screen="concept">
            <div class="icon">📖</div>
            <div class="label">개념 학습</div>
            <div class="desc">단어 · 문법 정리</div>
          </button>
          <button class="menu-card" data-screen="word">
            <div class="icon">🃏</div>
            <div class="label">단어 퀴즈</div>
            <div class="desc">플래시카드 · 객관식</div>
          </button>
          <button class="menu-card" data-screen="passage">
            <div class="icon">📝</div>
            <div class="label">본문 빈칸</div>
            <div class="desc">본문 빈칸 채우기</div>
          </button>
          <button class="menu-card" data-screen="grammar">
            <div class="icon">✏️</div>
            <div class="label">문법 문제</div>
            <div class="desc">어법 · 빈칸 · 객관식</div>
          </button>
          <button class="menu-card" data-screen="ranking" style="grid-column:span 2">
            <div class="icon">🏆</div>
            <div class="label">랭킹</div>
            <div class="desc">점수 기록 보기</div>
          </button>
        </div>
      </div>
    </div>`

  root.querySelector('#name-save').addEventListener('click', () => {
    rankStore.set({ playerName: root.querySelector('#name-input').value.trim() })
  })

  root.querySelectorAll('.menu-card[data-screen]').forEach(card => {
    card.addEventListener('click', () => appStore.set({ screen: card.dataset.screen }))
  })
}
