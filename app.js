// Flashcards – Concorso Scuola (fix: random picking + random direction, robust loading)

let cards = [];
let currentIndex = 0;
let reviewMode = false;
let filteredCards = [];
let currentDirection = "a2b"; // a→b or b→a
let cardsReady = false;

// 🔹 Init after DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  loadCards();
  wireUI();
});

async function loadCards() {
  try {
    const res = await fetch("cards.json");
    const data = await res.json();
    cards = data;
    cardsReady = true;
  } catch (e) {
    console.error("Errore nel caricamento delle carte:", e);
    alert("Impossibile caricare le carte.");
  }
}

function wireUI() {
  // Selezione area con nuovi pulsanti
  document.querySelectorAll(".area-btn, .btn-all").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (btn.classList.contains("disabled")) {
        alert("Area in costruzione");
        return;
      }
      // Attendi che le carte siano pronte
      if (!cardsReady) {
        await waitForCards();
      }
      const area = btn.dataset.area;
      startGame(area);
    });
  });

  // Flip carta (prima tocco: mostra risposta; secondo tocco: passa alla prossima)
const cardEl = document.getElementById("card");
let lastClickTime = 0; // 🧩 anti-doppio-click

cardEl.addEventListener("click", () => {
  const now = Date.now();
  if (now - lastClickTime < 300) return; // ignora doppio click veloce
  lastClickTime = now;

  const front = document.getElementById("card-front");
  const back = document.getElementById("card-back");
  const frontHidden = front.classList.contains("hidden");

  if (frontHidden) {
    // se stavo vedendo la risposta, vai alla prossima carta
    nextCard();
  } else {
    // altrimenti mostra la risposta
    front.classList.add("hidden");
    back.classList.remove("hidden");
  }
});


  // Shortcut tastiera
  document.body.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code === "ArrowRight") {
      nextCard();
    }
  });

  // Revisione e reset
  document.getElementById("btn-toggle-review").addEventListener("click", () => {
    reviewMode = !reviewMode;
    document.getElementById("btn-toggle-review").textContent = reviewMode ? "Esci Revisione" : "Avvia Revisione";
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
}

function waitForCards() {
  return new Promise(resolve => {
    const chk = () => {
      if (cardsReady) resolve(); else setTimeout(chk, 50);
    };
    chk();
  });
}

function startGame(area) {
  const selectArea = document.getElementById("area-select");
  const gameArea = document.getElementById("game-area");
  selectArea.classList.add("hidden");
  gameArea.classList.remove("hidden");

  // Filtra e mescola casualmente (Fisher–Yates)
  if (area === "tutte") {
    filteredCards = [...cards];
  } else {
    filteredCards = cards.filter(c => c.area === area);
  }
  shuffleArray(filteredCards);

  currentIndex = 0;
  showCard();
}

function showCard() {
  if (filteredCards.length === 0) return;

  const card = filteredCards[currentIndex];
  const frontEl = document.getElementById("card-question");
  const backEl = document.getElementById("card-answer");
  const metaEl = document.getElementById("card-meta");

  // Direzione casuale ad ogni carta
  currentDirection = Math.random() < 0.5 ? "a2b" : "b2a";
  if (currentDirection === "a2b") {
    frontEl.textContent = card.a;
    backEl.textContent = card.b;
  } else {
    frontEl.textContent = card.b;
    backEl.textContent = card.a;
  }

  // metaEl.textContent = card.area;
  document.getElementById("count-remaining").textContent = "Rimaste: " + (filteredCards.length - currentIndex - 1);

  // riparti sempre dal lato domanda
  document.getElementById("card-front").classList.remove("hidden");
  document.getElementById("card-back").classList.add("hidden");
}

function nextCard() {
  if (filteredCards.length === 0) return;
  currentIndex++;
  if (currentIndex >= filteredCards.length) {
    currentIndex = 0;
    shuffleArray(filteredCards);
  }
  showCard();
}

// 🔹 Fisher–Yates shuffle
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
