// Flashcards – Concorso Scuola (logica aggiornata per nuove aree)
let cards = [];
let currentIndex = 0;
let reviewMode = false;
let filteredCards = [];

// 🔹 Carica le carte dal file JSON
fetch('cards.json')
  .then(response => response.json())
  .then(data => {
    cards = data;
  });

// 🔹 Selezione area con nuovi pulsanti
document.querySelectorAll('.area-btn, .btn-all').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('disabled')) {
      alert('Area in costruzione');
      return;
    }
    const area = btn.dataset.area;
    startGame(area);
  });
});

function startGame(area) {
  const selectArea = document.getElementById('area-select');
  const gameArea = document.getElementById('game-area');
  selectArea.classList.add('hidden');
  gameArea.classList.remove('hidden');

  if (area === 'tutte') {
    filteredCards = [...cards];
  } else {
    filteredCards = cards.filter(c => c.area === area);
  }
  currentIndex = 0;
  showCard();
}

// 🔹 Mostra la carta corrente
function showCard() {
  if (filteredCards.length === 0) return;
  const card = filteredCards[currentIndex];
  document.getElementById('card-question').textContent = card.a;
  document.getElementById('card-answer').textContent = card.b;
  document.getElementById('card-meta').textContent = card.area;
  document.getElementById('count-remaining').textContent = 'Rimaste: ' + (filteredCards.length - currentIndex - 1);
}

// 🔹 Gestione flip carta
const cardEl = document.getElementById('card');
cardEl.addEventListener('click', () => {
  document.getElementById('card-front').classList.toggle('hidden');
  document.getElementById('card-back').classList.toggle('hidden');
});

// 🔹 Revisione e reset
document.getElementById('btn-toggle-review').addEventListener('click', () => {
  reviewMode = !reviewMode;
  document.getElementById('btn-toggle-review').textContent = reviewMode ? 'Esci Revisione' : 'Avvia Revisione';
});

document.getElementById('btn-reset').addEventListener('click', () => {
  currentIndex = 0;
  showCard();
});

document.getElementById('btn-home').addEventListener('click', () => {
  document.getElementById('game-area').classList.add('hidden');
  document.getElementById('area-select').classList.remove('hidden');
});