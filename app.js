// Flashcards – Concorso Scuola (versione aggiornata con random e direzioni casuali)

let cards = [];
let currentIndex = 0;
let reviewMode = false;
let filteredCards = [];
let currentDirection = "a2b"; // direzione corrente (a→b o b→a)

// 🔹 Carica le carte dal file JSON
fetch("cards.json")
  .then(response => response.json())
  .then(data => {
    cards = data;
  });

// 🔹 Selezione area con nuovi pulsanti
document.querySelectorAll(".area-btn, .btn-all").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.classList.contains("disabled")) {
      alert("Area in costruzione");
      return;
    }
    const area = btn.dataset.area;
    startGame(area);
  });
});

function startGame(area) {
  const selectArea = document.getElementById("area-select");
  const gameArea = document.getElementById("game-area");
  selectArea.classList.add("hidden");
  gameArea.classList.remove("hidden");

  // Filtra e mescola casualmente
  if (area === "tutte") {
    filteredCards = [...cards];
  } else {
    filteredCards = cards.filter(c => c.area === area);
  }
  shuffleArray(filteredCards);

  currentIndex = 0;
  showCard();
}

// 🔹 Mostra la carta corrente
function showCard() {
  if (filteredCards.length === 0) return;

  const card = filteredCards[currentIndex];
  const frontEl = document.getElementById("card-question");
  const backEl = document.getElementById("card-answer");
  const metaEl = document.getElementById("card-meta");
  const directionEl = document.getElementById("card-direction");

  // Direzione casuale
  currentDirection = Math.random() < 0.5 ? "a2b" : "b2a";

  if (currentDirection === "a2b") {
    frontEl.textContent = card.a;
    backEl.textContent = card.b;
  } else {
    frontEl.textContent = card.b;
    backEl.textContent = card.a;
  }

  metaEl.textContent = card.area;
  directionEl.textContent = "—";
  document.getElementById("count-remaining").textContent =
    "Rimaste: " + (filteredCards.length - currentIndex - 1);

  // Assicura che la carta parta dal lato frontale
  document.getElementById("card-front").classList.remove("hidden");
  document.getElementById("card-back").classList.add("hidden");
}

// 🔹 Mescola un array (algoritmo Fisher–Yates)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// 🔹 Flip carta
const cardEl = document.getElementById("card");
cardEl.addEventListener("click", () => {
  document.getElementById("card-front").classList.toggle("hidden");
  document.getElementById("card-back").classList.toggle("hidden");
});

// 🔹 Avanza alla prossima carta
document.body.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowRight") {
    nextCard();
  }
});

cardEl.addEventListener("dblclick", nextCard);

function nextCard() {
  currentIndex++;
  if (currentIndex >= filteredCards.length) {
    currentIndex = 0;
    shuffleArray(filteredCards);
  }
  showCard();
}

// 🔹 Revisione e reset
document.getElementById("btn-toggle-review").addEventListener("click", () => {
  reviewMode = !reviewMode;
  document.getElementById("btn-toggle-review").textContent = reviewMode
    ? "Esci Revisione"
    : "Avvia Revisione";
});

document.getElementById("btn-reset").addEventListener("click", () => {
  currentIndex = 0;
  shuffleArray(filteredCards);
  showCard();
});

document.getElementById("btn-home").addEventListener("click", () => {
  document.getElementById("game-area").classList.add("hidden");
  document.getElementById("area-select").classList.remove("hidden");
});
