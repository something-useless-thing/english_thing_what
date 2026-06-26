import './style.css'
import { appStore } from './stores/store.js'
import { renderMain } from './pages/Main.js'
import { renderWord } from './pages/Word.js'
import { renderPassage } from './pages/Passage.js'
import { renderGrammar } from './pages/Grammar.js'
import { renderConcept } from './pages/Concept.js'
import { renderRanking } from './pages/Ranking.js'
import { renderComprehensive } from './pages/Comprehensive.js'

const app = document.getElementById('app')

const PAGES = {
  main: renderMain,
  word: renderWord,
  passage: renderPassage,
  grammar: renderGrammar,
  concept: renderConcept,
  ranking: renderRanking,
  comprehensive: renderComprehensive,
}

function render(state) {
  app.innerHTML = ''
  const fn = PAGES[state.screen] || renderMain
  fn(app)
}

appStore.subscribe(render)
render(appStore.get())
