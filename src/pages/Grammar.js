import { appStore, saveScore, shuffle } from '../stores/store.js'
import { GRAMMAR_QUESTIONS } from '../data/grammar.js'

let st={}
function init(){st={unit:1,list:[],idx:0,correct:0,wrong:0,selectedWord:null}}

export function renderGrammar(root){init();mount(root)}

function mount(root){
  root.innerHTML=`
    <div style="display:flex;flex-direction:column;min-height:100vh">
      <nav class="top-nav">
        <button class="btn-back" id="back">←</button>
        <span class="nav-title">문법 문제</span>
      </nav>
      <div class="screen" style="padding-top:.8rem"><div id="gram-content"></div></div>
    </div>`
  root.querySelector('#back').addEventListener('click',()=>appStore.set({screen:'main'}))
  renderSetup(root)
}

function renderSetup(root){
  const t1=(GRAMMAR_QUESTIONS[1]||[]).length, t2=(GRAMMAR_QUESTIONS[2]||[]).length
  const el=root.querySelector('#gram-content')
  el.innerHTML=`
    <div style="margin-bottom:1.2rem">
      <div style="display:flex;gap:6px;margin-bottom:1rem">
        <button class="tab-btn ${st.unit===1?'active':''}" data-u="1">1과 (${t1}문제)</button>
        <button class="tab-btn ${st.unit===2?'active':''}" data-u="2">2과 (${t2}문제)</button>
        <button class="tab-btn ${st.unit===0?'active':''}" data-u="0">전체 (${t1+t2}문제)</button>
      </div>
      <button class="btn btn-primary" id="start-btn">▶ 문제 시작</button>
    </div>`
  el.querySelectorAll('[data-u]').forEach(btn=>btn.addEventListener('click',()=>{
    st.unit=Number(btn.dataset.u)
    el.querySelectorAll('[data-u]').forEach(b=>b.classList.toggle('active',b===btn))
  }))
  el.querySelector('#start-btn').addEventListener('click',()=>startQuiz(root))
}

function startQuiz(root){
  const pool=st.unit===0
    ?[...(GRAMMAR_QUESTIONS[1]||[]),...(GRAMMAR_QUESTIONS[2]||[])]
    :[...(GRAMMAR_QUESTIONS[st.unit]||[])]
  st.list=shuffle(pool); st.idx=0; st.correct=0; st.wrong=0; st.selectedWord=null
  renderQ(root)
}

function renderQ(root){
  const el=root.querySelector('#gram-content')
  st.selectedWord=null

  if(st.idx>=st.list.length){
    const score=Math.round((st.correct/st.list.length)*100)
    saveScore('grammar',score)
    el.innerHTML=`<div class="result-screen">
      <div class="result-score">${score}점</div>
      <div class="result-label">${st.correct}개 정답 / ${st.list.length}개</div>
      <div style="display:flex;gap:8px;justify-content:center">
        <button class="btn btn-primary" id="retry">다시 풀기</button>
        <button class="btn btn-secondary" id="back-setup">단원 선택</button>
      </div></div>`
    el.querySelector('#retry').addEventListener('click',()=>startQuiz(root))
    el.querySelector('#back-setup').addEventListener('click',()=>{init();mount(root)})
    return
  }

  const q=st.list[st.idx]
  const typeLabel={'multiple-choice':'객관식','error-correction':'오류 수정','fill-blank':'빈칸','sentence-construction':'영작'}[q.type]||'문제'

  let body=''

  if(q.type==='error-correction'){
    // 문장을 토큰(단어/구두점) 단위로 쪼개서 클릭 가능하게
    body=`
      <div style="font-size:13px;color:var(--purple-l);margin-bottom:.6rem;font-weight:600">
        ① 어색한 부분을 클릭하세요 &nbsp;→&nbsp; ② 고친 말을 입력하세요
      </div>
      <div id="ec-sentence" style="background:var(--surface2);padding:.8rem 1rem;border-radius:8px;font-size:15px;line-height:2;margin-bottom:.8rem;user-select:none">
        ${tokenize(q.sentence)}
      </div>
      <div id="ec-input-area" style="display:none">
        <div style="font-size:13px;color:var(--text3);margin-bottom:.4rem">선택된 부분: <b id="ec-selected-label" style="color:var(--red)"></b></div>
        <div style="display:flex;gap:8px">
          <input class="input" id="gram-input" placeholder="고친 말 입력..." autocomplete="off" style="flex:1">
          <button class="btn btn-primary" id="gram-check">확인</button>
        </div>
      </div>
      <button class="btn btn-secondary" id="gram-skip" style="margin-top:.8rem">건너뛰기</button>`
  } else if(q.type==='multiple-choice'){
    if(q.sentence) body+=`<div style="background:var(--surface2);padding:.7rem 1rem;border-radius:8px;font-size:14px;margin-bottom:.8rem;color:var(--text);line-height:1.8">${q.sentence}</div>`
    body+=`<div class="mc-options">${q.options.map((opt,i)=>`<button class="mc-opt" data-i="${i}"><span class="opt-num">${i+1}</span>${opt}</button>`).join('')}</div>`
  } else {
    // fill-blank, sentence-construction
    if(q.sentence) body+=`<div style="background:var(--surface2);padding:.7rem 1rem;border-radius:8px;font-size:14px;margin-bottom:.8rem;color:var(--text);line-height:1.8">${q.sentence}</div>`
    body+=`<input class="input" id="gram-input" placeholder="정답 입력..." autocomplete="off">
      <div style="display:flex;gap:8px;margin-top:.8rem">
        <button class="btn btn-primary" id="gram-check">확인</button>
        <button class="btn btn-secondary" id="gram-skip">건너뛰기</button>
      </div>`
  }

  el.innerHTML=`
    <div class="progress-text">${st.idx+1}/${st.list.length} &nbsp;|&nbsp; ✓${st.correct} ✗${st.wrong}</div>
    <div class="card">
      <div style="font-size:11px;color:var(--purple-l);font-weight:700;margin-bottom:.4rem;letter-spacing:.5px">${typeLabel}</div>
      <div style="font-size:14px;white-space:pre-line;margin-bottom:.9rem;color:var(--text2);line-height:1.7">${q.instruction}</div>
      ${body}
      <div class="feedback" id="gram-feedback" style="display:none"></div>
    </div>`

  bindQ(root, q)
}

// 문장을 단어 토큰으로 분리해서 span으로 감싸기
function tokenize(sentence){
  // 띄어쓰기 기준으로 쪼개되, 구두점은 붙여서 처리
  return sentence.split(' ').map((word,i)=>{
    const clean=word.replace(/[.,!?;:'"()]/g,'').toLowerCase()
    return `<span class="ec-token" data-word="${word}" data-clean="${clean}" style="
      display:inline-block;padding:2px 5px;margin:1px 2px;border-radius:5px;
      cursor:pointer;transition:background .12s;border:1px solid transparent
    " onmouseover="this.style.background='var(--border)'" onmouseout="if(!this.classList.contains('ec-selected'))this.style.background=''">${word}</span>`
  }).join(' ')
}

function bindQ(root, q){
  const el=root.querySelector('#gram-content')

  const showFb=(ok)=>{
    if(ok)st.correct++;else st.wrong++
    const fb=el.querySelector('#gram-feedback')
    const ans=typeof q.answer==='number'?q.options[q.answer]:q.answer
    fb.style.display='block'; fb.className=`feedback ${ok?'correct':'wrong'}`
    fb.innerHTML=`${ok?'✓ 정답!':'✗ 오답.'}<br>
      <span style="font-size:13px">어색한 부분: <b style="color:var(--red)">${q.wrongPart||ans}</b> &nbsp;→&nbsp; <b style="color:var(--green)">${ans}</b></span><br>
      <span style="font-size:12px;opacity:.85">${q.explanation||''}</span><br>
      <span style="font-size:12px;color:var(--text3)">${q.translation||''}</span>`
    setTimeout(()=>{st.idx++;renderQ(root)},2500)
  }

  // ── 오류 수정: 토큰 클릭 ──
  if(q.type==='error-correction'){
    el.querySelectorAll('.ec-token').forEach(token=>{
      token.addEventListener('click',()=>{
        // 기존 선택 해제
        el.querySelectorAll('.ec-token').forEach(t=>{
          t.classList.remove('ec-selected')
          t.style.background=''
          t.style.borderColor='transparent'
        })
        // 새로 선택
        token.classList.add('ec-selected')
        token.style.background='#3a1a1a'
        token.style.borderColor='var(--red)'
        st.selectedWord=token.dataset.word

        // 입력칸 보이기
        const inputArea=el.querySelector('#ec-input-area')
        inputArea.style.display='block'
        el.querySelector('#ec-selected-label').textContent=`"${token.dataset.word}"`
        const inp=el.querySelector('#gram-input')
        inp.value=''; inp.focus()
      })
    })

    const check=()=>{
      if(!st.selectedWord){ alert('어색한 부분을 먼저 클릭하세요!'); return }
      const userSelected=st.selectedWord.toLowerCase().replace(/[.,!?;:'"()]/g,'')
      const wrongPart=(q.wrongPart||'').toLowerCase().replace(/[.,!?;:'"()]/g,'')
      const correction=(q.answer||'').toLowerCase()
      const userInput=(el.querySelector('#gram-input')?.value||'').trim().toLowerCase()

      // 올바른 단어 선택 + 올바른 수정
      const selectedOk = userSelected===wrongPart || wrongPart.includes(userSelected) || userSelected.includes(wrongPart)
      const correctionOk = userInput===correction || correction.includes(userInput) || userInput.includes(correction)
      const ok = selectedOk && correctionOk

      el.querySelector('#gram-input').disabled=true
      el.querySelector('#gram-check').disabled=true
      showFb(ok)
    }

    el.querySelector('#gram-input')?.addEventListener('keydown',e=>{if(e.key==='Enter')check()})
    el.querySelector('#gram-check')?.addEventListener('click',check)
    el.querySelector('#gram-skip')?.addEventListener('click',()=>{st.wrong++;st.idx++;renderQ(root)})

  } else if(q.type==='multiple-choice'){
    el.querySelectorAll('.mc-opt').forEach(btn=>btn.addEventListener('click',()=>{
      const i=Number(btn.dataset.i)
      el.querySelectorAll('.mc-opt').forEach(b=>{
        b.disabled=true
        if(Number(b.dataset.i)===q.answer)b.classList.add('correct-opt')
        else if(b===btn&&i!==q.answer)b.classList.add('wrong-opt')
      })
      showFb(i===q.answer)
    }))
  } else {
    const input=el.querySelector('#gram-input')
    const check=()=>{
      const val=(input?.value||'').trim().toLowerCase()
      if(!val)return
      const ans=(typeof q.answer==='string'?q.answer:'').toLowerCase()
      input.disabled=true
      el.querySelector('#gram-check').disabled=true
      el.querySelector('#gram-skip').disabled=true
      showFb(val===ans||ans.includes(val)||val.includes(ans))
    }
    input?.addEventListener('keydown',e=>{if(e.key==='Enter')check()})
    el.querySelector('#gram-check')?.addEventListener('click',check)
    el.querySelector('#gram-skip')?.addEventListener('click',()=>{st.wrong++;st.idx++;renderQ(root)})
    setTimeout(()=>input?.focus(),50)
  }
}
