import { appStore, rankStore } from '../stores/store.js'

export function renderMain(root) {
  const { playerName } = rankStore.get()
  root.innerHTML = `
    <div class="screen">
      <div class="main-header">
        <div class="main-title">📚 영어 시험 도우미</div>
        <div class="main-sub">Lesson 1 &amp; 2 · 내신 대비</div>
      </div>
      <div style="margin-bottom:1.2rem;display:flex;gap:8px;align-items:center">
        <input class="input" id="name-input" placeholder="이름 입력 (랭킹 등록용)" value="${playerName}" style="max-width:220px">
        <button class="btn btn-secondary" id="save-name">저장</button>
      </div>
      <div class="menu-grid">
        <div class="menu-card" data-id="word">
          <div class="icon">📝</div><div class="label">단어 맞추기</div><div class="desc">플래시카드 / 입력형</div>
        </div>
        <div class="menu-card" data-id="passage">
          <div class="icon">📄</div><div class="label">본문 빈칸</div><div class="desc">1단원 · 2단원</div>
        </div>
        <div class="menu-card" data-id="grammar">
          <div class="icon">✏️</div><div class="label">문법 문제</div><div class="desc">학습지 기반 랜덤</div>
        </div>
        <div class="menu-card" data-id="concept">
          <div class="icon">💡</div><div class="label">개념 학습</div><div class="desc">단어 · 본문 · 문법</div>
        </div>
      </div>

      <!-- 종합문제 + 랭킹보기 -->
      <div style="margin-top:.9rem;display:grid;grid-template-columns:1fr auto;gap:.9rem;align-items:stretch">
        <div class="menu-card" data-id="comprehensive" style="flex-direction:row;justify-content:flex-start;gap:14px;padding:1.1rem 1.2rem">
          <div class="icon" style="font-size:1.6rem">🎯</div>
          <div style="text-align:left">
            <div class="label">종합 문제 풀기</div>
            <div class="desc">단어 + 문법 랜덤 · 점수 랭킹 등록</div>
          </div>
        </div>
        <div class="menu-card" data-id="ranking" style="padding:.9rem 1rem;min-width:80px">
          <div class="icon" style="font-size:1.4rem">🏆</div>
          <div class="label" style="font-size:13px">랭킹 보기</div>
        </div>
      </div>
    </div>`

  root.querySelector('#save-name').addEventListener('click', () => {
    rankStore.set({ playerName: root.querySelector('#name-input').value.trim() })
    const btn = root.querySelector('#save-name')
    btn.textContent = '✓'; setTimeout(() => { btn.textContent = '저장' }, 1200)
  })
  root.querySelectorAll('.menu-card').forEach(c =>
    c.addEventListener('click', () => appStore.set({ screen: c.dataset.id })))
}
