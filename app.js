const DATA_URL = 'cards.json';
const RANDOM_DIRECTION = true;

const el = {
  areaSelect: document.getElementById('area-select'),
  areaDropdown: document.getElementById('area-dropdown'),
  btnStart: document.getElementById('btn-start'),
  gameArea: document.getElementById('game-area'),
  question: document.getElementById('card-question'),
  answer: document.getElementById('card-answer'),
  direction: document.getElementById('card-direction'),
  meta: document.getElementById('card-meta'),
  front: document.getElementById('card-front'),
  back: document.getElementById('card-back'),
  card: document.getElementById('card'),
  countRemaining: document.getElementById('count-remaining'),
  countReview: document.getElementById('count-review'),
  btnReview: document.getElementById('btn-toggle-review'),
  btnReset: document.getElementById('btn-reset')
};

let allCards = [];
let cards = [];
let deck = [];
let review = [];
let current = null;
let inReview = false;
let state = 'idle';
let selectedArea = 'tutte';

// -----------------------------
// Caricamento carte
// -----------------------------
async function loadCards() {
  const res = await fetch(DATA_URL);
  const data = await res.json();
  allCards = data.map((c, i) => ({
    id: i,
    a: c.a,
    b: c.b,
    area: c.area || 'Generale',
    tags: c.tags || []
  })).filter(c => c.a && c.b);
  console.log("Carte caricate:", allCards.length);
}

// -----------------------------
// Gestione area scelta
// -----------------------------
el.btnStart.addEventListener('click', () => {
  selectedArea = el.areaDropdown.value;
  startArea(selectedArea);
});

function startArea(area) {
  cards = area === 'tutte'
  ? [...allCards]
  : allCards.filter(c =>
      c.area.trim().toLowerCase().replace(/['’]/g, "'") ===
      area.trim().toLowerCase().replace(/['’]/g, "'")
    );

  if (cards.length === 0) {
    alert(`Nessuna carta trovata per l'area: ${area}`);
    return;
  }

  el.areaSelect.classList.add('hidden');
  el.gameArea.classList.remove('hidden');
  reset();
}

// -----------------------------
// Funzioni di gioco
// -----------------------------
function reset() {
  deck = [...cards];
  shuffle(deck);
  review = [];
  current = null;
  inReview = false;
  state = 'idle';
  el.btnReview.textContent = 'Avvia Revisione';
  updateCounts();
  showMessage('Tocca o premi spazio per iniziare');
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function updateCounts() {
  el.countRemaining.textContent = `Rimaste: ${inReview ? review.length : deck.length}`;
  el.countReview.textContent = `Revisione: ${review.length}`;
}

function showMessage(msg) {
  el.front.classList.remove('hidden');
  el.back.classList.add('hidden');
  el.direction.textContent = '—';
  el.question.textContent = msg;
  el.meta.textContent = '';
  el.answer.textContent = '—';
}

function drawCard() {
  const pile = inReview ? review : deck;
  if (pile.length === 0) {
    showMessage(inReview ? 'Revisione completata!' : 'Mazzo terminato!');
    return;
  }
  const card = pile.pop();
  current = card;
  const dir = RANDOM_DIRECTION && Math.random() > 0.5 ? 'A2B' : 'B2A';
  card.dir = dir;
  const q = dir === 'A2B' ? card.a : card.b;
  const a = dir === 'A2B' ? card.b : card.a;

  el.direction.textContent = dir === 'A2B' ? 'A → B' : 'B → A';
  el.question.textContent = q;
  el.answer.textContent = a;
  el.front.classList.remove('hidden');
  el.back.classList.add('hidden');
  el.card.animate([{ transform: 'scale(0.8)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 250, easing: 'ease-out' });
  state = 'shown';
  updateCounts();
}

function flipCard() {
  el.front.classList.toggle('hidden');
  el.back.classList.toggle('hidden');
  state = state === 'shown' ? 'revealed' : 'shown';
}

function markReview() {
  if (current && !inReview) review.push(current);
  current = null;
  state = 'idle';
  updateCounts();
}

function handleAction() {
  if (state === 'idle') drawCard();
  else if (state === 'shown') flipCard();
  else if (state === 'revealed') {
    markReview();
    drawCard();
  }
}

// -----------------------------
// Eventi
// -----------------------------
el.card.addEventListener('click', handleAction);
document.body.addEventListener('keydown', e => {
  if (e.key === ' ') {
    e.preventDefault();
    handleAction();
  }
});

el.btnReview.addEventListener('click', () => {
  inReview = !inReview;
  el.btnReview.textContent = inReview ? 'Esci Revisione' : 'Avvia Revisione';
  current = null;
  state = 'idle';
  showMessage(inReview ? 'Modalità Revisione' : 'Modalità Normale');
  updateCounts();
});

el.btnReset.addEventListener('click', reset);

// -----------------------------
// Avvio
// -----------------------------
loadCards();