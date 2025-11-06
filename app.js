// ====== Config ======
const DATA_URL = 'cards.json'; // file con le carte
const RANDOMIZE_DIRECTION_EACH_DRAW = true; // A->B o B->A a caso
// ====================

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const el = {
  draw: $('#btn-draw'),
  reveal: $('#btn-reveal'),
  toReview: $('#btn-to-review'),
  reset: $('#btn-reset'),
  reviewMode: $('#btn-review-mode'),
  remaining: $('#count-remaining'),
  drawn: $('#count-drawn'),
  reviewCount: $('#count-review'),
  card: $('#card'),
  front: $('#card-front'),
  back: $('#card-back'),
  question: $('#card-question'),
  answer: $('#card-answer'),
  direction: $('#card-direction'),
  meta: $('#card-meta'),
};

let allCards = [];          // [{id, a, b, tags?}]
let deck = [];              // shuffled indexes (queue)
let drawnSet = new Set();   // ids estratti in questa sessione
let reviewPile = [];        // array di sessionCard (vedi sotto)
let inReviewMode = false;

let current = null; // sessionCard = { id, a, b, dir:'A2B'|'B2A', revealed:false }

async function loadCards() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Impossibile caricare cards.json');
  const data = await res.json();
  // Normalizza + assegna id
  allCards = data.map((c, i) => ({
    id: c.id ?? i,
    a: (c.author ?? c.a ?? '').trim(),
    b: (c.theory ?? c.b ?? '').trim(),
    hint: c.hint ?? '',
    tags: c.tags ?? []
  })).filter(c => c.a && c.b);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function resetSession() {
  drawnSet.clear();
  reviewPile = [];
  inReviewMode = false;
  el.reviewMode.textContent = 'Avvia Revisione';
  el.reviewMode.disabled = true;
  current = null;

  deck = allCards.map((_, i) => i);
  shuffle(deck);

  updateCounts();
  showMessage('Clicca “Estrai carta” per iniziare.');
  el.toReview.disabled = true;
  el.reveal.disabled = true;
}

function updateCounts() {
  const remaining = deck.length;
  const drawn = drawnSet.size;
  const review = reviewPile.length;
  el.remaining.textContent = `Rimaste: ${remaining}`;
  el.drawn.textContent = `Estratte: ${drawn}`;
  el.reviewCount.textContent = `Revisione: ${review}`;
  el.reviewMode.disabled = review === 0;
}

function showMessage(msg) {
  el.direction.textContent = '—';
  el.question.textContent = msg;
  el.meta.textContent = '';
  el.answer.textContent = '—';
  el.front.classList.remove('hidden');
  el.back.classList.add('hidden');
}

function pickDirection() {
  return RANDOMIZE_DIRECTION_EACH_DRAW
    ? (Math.random() < 0.5 ? 'A2B' : 'B2A')
    : 'A2B';
}

function drawNext() {
  // Se siamo in review mode, estrai dalla reviewPile
  if (inReviewMode) {
    if (reviewPile.length === 0) {
      showMessage('Revisione completata. Puoi tornare al mazzo principale o resettare.');
      return;
    }
    const idx = Math.floor(Math.random() * reviewPile.length);
    current = { ...reviewPile[idx] }; // copia
    renderCard(current);
    return;
  }

  if (deck.length === 0) {
    showMessage('Mazzo terminato! Avvia la Revisione o fai Reset per ricominciare.');
    return;
  }

  const i = deck.shift();
  const base = allCards[i];
  drawnSet.add(base.id);
  const dir = pickDirection();

  current = {
    id: base.id,
    a: base.a,
    b: base.b,
    hint: base.hint || '',
    tags: base.tags || [],
    dir,
    revealed: false
  };
  renderCard(current);
  updateCounts();
}

function renderCard(sessionCard) {
  const isA2B = sessionCard.dir === 'A2B';
  const prompt = isA2B ? sessionCard.a : sessionCard.b;
  const target = isA2B ? sessionCard.b : sessionCard.a;

  el.direction.textContent = isA2B ? 'A → B' : 'B → A';
  el.question.textContent = prompt;
  el.meta.textContent = sessionCard.hint || (sessionCard.tags?.length ? `Tag: ${sessionCard.tags.join(', ')}` : '');
  el.answer.textContent = target;

  el.front.classList.remove('hidden');
  el.back.classList.add('hidden');
  el.reveal.disabled = false;
  el.toReview.disabled = true;
  el.card.focus();
}

function reveal() {
  if (!current) return;
  el.front.classList.add('hidden');
  el.back.classList.remove('hidden');
  el.reveal.disabled = true;
  el.toReview.disabled = false;
}

function moveToReview() {
  if (!current) return;
  // se in review mode, non duplicare
  if (inReviewMode) {
    // togli l'elemento corrente dalla reviewPile (una volta “ripassato”, non rimane per sempre)
    const idx = reviewPile.findIndex(c => c.id === current.id && c.dir === current.dir);
    if (idx >= 0) reviewPile.splice(idx, 1);
    showMessage('Carta rimossa dalla Revisione. Estrai per continuare la revisione.');
    updateCounts();
    return;
  }
  // aggiungi alla review pile (non duplicare stesso id+dir nella revisione)
  const exists = reviewPile.some(c => c.id === current.id && c.dir === current.dir);
  if (!exists) reviewPile.push(current);
  showMessage('Carta aggiunta alla Revisione. Continua con “Estrai carta”.');
  updateCounts();
}

function toggleReviewMode() {
  inReviewMode = !inReviewMode;
  el.reviewMode.textContent = inReviewMode ? 'Esci da Revisione' : 'Avvia Revisione';
  if (inReviewMode && reviewPile.length === 0) {
    inReviewMode = false;
    el.reviewMode.textContent = 'Avvia Revisione';
    return;
  }
  showMessage(inReviewMode ? 'Sei in modalità Revisione. Premi “Estrai carta”.' : 'Sei tornato al mazzo principale.');
}

// Eventi UI
el.draw.addEventListener('click', drawNext);
el.reveal.addEventListener('click', reveal);
el.toReview.addEventListener('click', moveToReview);
el.reset.addEventListener('click', () => resetSession());
el.reviewMode.addEventListener('click', toggleReviewMode);

// Scorciatoie tastiera
document.addEventListener('keydown', (e) => {
  if (e.key === ' '){ e.preventDefault(); if (!el.reveal.disabled) reveal(); }
  if (e.key === 'n' || e.key === 'N'){ e.preventDefault(); drawNext(); }
  if (e.key === 'r' || e.key === 'R'){ e.preventDefault(); if (!el.toReview.disabled) moveToReview(); }
});

(async function init(){
  try{
    await loadCards();
    resetSession();
  }catch(err){
    showMessage('Errore nel caricamento delle carte. Controlla cards.json');
    console.error(err);
  }
})();
