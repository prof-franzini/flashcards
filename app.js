// ====== Config ======
const DATA_URL = 'cards.json'; // file con le carte
const RANDOMIZE_DIRECTION_EACH_DRAW = true; // A->B o B->A a caso
const MAX_VISIBLE_IN_PILE = 10;
// ====================

const $ = s => document.querySelector(s);

const el = {
  draw: $('#btn-draw'),
  reveal: $('#btn-reveal'),
  toReview: $('#btn-to-review'),
  reset: $('#btn-reset'),
  reviewMode: $('#btn-review-mode'),
  remaining: $('#count-remaining'),
  drawn: $('#count-drawn'),
  reviewCount: $('#count-review'),
  cardArea: $('#card-area'),
  card: $('#card'),
  front: $('#card-front'),
  back: $('#card-back'),
  question: $('#card-question'),
  answer: $('#card-answer'),
  direction: $('#card-direction'),
  meta: $('#card-meta'),
  deckPile: $('#deck-pile'),
  reviewPile: $('#review-pile'),
};

let allCards = [];          // [{id, a, b, tags?}]
let deck = [];              // shuffled indexes (queue)
let drawnSet = new Set();   // ids estratti in questa sessione
let reviewPile = [];        // array di sessionCard
let inReviewMode = false;

let current = null; // sessionCard = { id, a, b, dir:'A2B'|'B2A', revealed:false }

/* ---------- Data ---------- */
async function loadCards() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Impossibile caricare cards.json');
  const data = await res.json();
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

/* ---------- Sessione ---------- */
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
  renderPiles();
  showMessage('Clicca “Estrai carta” per iniziare.');
  el.toReview.disabled = true;
  el.reveal.disabled = true;
}

function updateCounts() {
  el.remaining.textContent = `Rimaste: ${deck.length}`;
  el.drawn.textContent = `Estratte: ${drawnSet.size}`;
  el.reviewCount.textContent = `Revisione: ${reviewPile.length}`;
  el.reviewMode.disabled = reviewPile.length === 0;
}

function showMessage(msg) {
  el.direction.textContent = '—';
  el.question.textContent = msg;
  el.meta.textContent = '';
  el.answer.textContent = '—';
  el.front.classList.remove('hidden');
  el.back.classList.add('hidden');
}

/* ---------- Pile visive ---------- */
function renderPiles() {
  renderPile(el.deckPile, Math.max(deck.length, 0), 'deck');
  renderPile(el.reviewPile, Math.max(reviewPile.length, 0), 'review');
}

function renderPile(container, count, kind) {
  container.innerHTML = '';
  // Mostra fino a MAX_VISIBLE_IN_PILE carte “fantasma”
  const visible = Math.min(count, MAX_VISIBLE_IN_PILE);
  for (let i = 0; i < visible; i++) {
    const idxFromBottom = i; // 0 = in basso
    const card = document.createElement('div');
    card.className = 'pile-card';
    const y = (visible - 1 - idxFromBottom) * (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--pile-spread')) || 10);
    const rot = (visible - 1 - idxFromBottom) % 2 === 0 ? 1 : -1; // leggero alternato
    card.style.top = `${10 + y}px`;
    card.style.opacity = `${0.4 + (idxFromBottom / (visible * 1.6))}`;
    card.style.transform = `translateX(-50%) rotate(${rot}deg)`;
    container.appendChild(card);
  }
}

/* ---------- Animazioni fisiche ---------- */
function getRect(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width/2, cy: r.top + r.height/2 };
}

function toCenterRect() {
  const r = getRect(el.cardArea);
  // Target: dimensioni della card centrale
  const targetW = Math.min(780, r.w * 0.96);
  const targetH = Math.max(240, Math.min(340, r.h * 0.7));
  const x = r.cx - targetW/2;
  const y = r.cy - targetH/2;
  return { x, y, w: targetW, h: targetH };
}

function createFloatingCard(fromRect, contentText = '') {
  const f = document.createElement('div');
  f.className = 'card-float';
  f.style.left = `${fromRect.x}px`;
  f.style.top = `${fromRect.y}px`;
  f.style.width = `${fromRect.w}px`;
  f.style.height = `${fromRect.h}px`;
  f.style.transform = `rotate(0deg)`;
  f.title = contentText;
  document.body.appendChild(f);
  return f;
}

function animate(fromEl, toRect, opts = {}) {
  const fromRect = getRect(fromEl);
  const f = createFloatingCard(fromRect, opts.title || '');
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      f.style.transition = `transform 320ms cubic-bezier(.2,.8,.2,1), left 320ms cubic-bezier(.2,.8,.2,1), top 320ms cubic-bezier(.2,.8,.2,1), width 320ms, height 320ms, opacity 320ms`;
      f.style.left = `${toRect.x}px`;
      f.style.top = `${toRect.y}px`;
      f.style.width = `${toRect.w}px`;
      f.style.height = `${toRect.h}px`;
      f.style.transform = `rotate(${opts.rotate || 0}deg)`;
      if (opts.fadeOut) f.style.opacity = '0.6';
      setTimeout(() => {
        f.remove();
        resolve();
      }, 340);
    });
  });
}

/* ---------- Logica carte ---------- */
function pickDirection() {
  return RANDOMIZE_DIRECTION_EACH_DRAW
    ? (Math.random() < 0.5 ? 'A2B' : 'B2A')
    : 'A2B';
}

async function drawNext() {
  if (inReviewMode) {
    if (reviewPile.length === 0) {
      showMessage('Revisione completata. Torna al mazzo o fai Reset.');
      return;
    }
    // animazione: prendi “top” della pila revisione
    const fromEl = el.reviewPile.lastElementChild || el.reviewPile;
    await animate(fromEl, toCenterRect(), { rotate: 0 });
    const idx = Math.floor(Math.random() * reviewPile.length);
    current = { ...reviewPile[idx] }; // copia
    renderCard(current);
    return;
  }

  if (deck.length === 0) {
    showMessage('Mazzo terminato! Avvia la Revisione o fai Reset per ricominciare.');
    return;
  }

  // Animazione: dalla pila mazzo → centro
  const fromEl = el.deckPile.lastElementChild || el.deckPile;
  await animate(fromEl, toCenterRect(), { rotate: 0 });

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
  renderPiles();
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

async function moveToReview() {
  if (!current) return;

  // Animazione: centro → pila Revisione
  await animate(el.card, getTopSlotRect(el.reviewPile), { rotate: 0 });

  if (inReviewMode) {
    // in revisione, l'azione “Metti in Revisione” equivale a rimuovere la carta da revisione
    const idx = reviewPile.findIndex(c => c.id === current.id && c.dir === current.dir);
    if (idx >= 0) reviewPile.splice(idx, 1);
    showMessage('Carta rimossa dalla Revisione. Estrai per continuare.');
  } else {
    const exists = reviewPile.some(c => c.id === current.id && c.dir === current.dir);
    if (!exists) reviewPile.push(current);
    showMessage('Carta aggiunta alla Revisione. Continua con “Estrai carta”.');
  }
  updateCounts();
  renderPiles();
  el.toReview.disabled = true;
}

/* Calcola il “top slot” della pila (posizione dove cade la carta) */
function getTopSlotRect(pileEl) {
  const pileRect = pileEl.getBoundingClientRect();
  const visible = Math.min((pileEl.children?.length || 0) + 1, MAX_VISIBLE_IN_PILE);
  const topOffset = 10 + (visible - 1) * (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--pile-spread')) || 10);
  const x = pileRect.left + (pileRect.width/2) - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--pile-card-w')) || 140)/2;
  const y = pileRect.top + topOffset;
  const w = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--pile-card-w')) || 140;
  const h = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--pile-card-h')) || 88;
  return { x, y, w, h };
}

function toggleReviewMode() {
  inReviewMode = !inReviewMode;
  el.reviewMode.textContent = inReviewMode ? 'Esci da Revisione' : 'Avvia Revisione';
  if (inReviewMode && reviewPile.length === 0) {
    inReviewMode = false;
    el.reviewMode.textContent = 'Avvia Revisione';
    return;
  }
  showMessage(inReviewMode ? 'Modalità Revisione. Premi “Estrai carta”.' : 'Sei tornato al mazzo principale.');
}

/* ---------- Eventi UI ---------- */
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

/* ---------- Init ---------- */
(async function init(){
  try{
    await loadCards();
    resetSession();
  }catch(err){
    showMessage('Errore nel caricamento delle carte. Controlla cards.json');
    console.error(err);
  }
})();
