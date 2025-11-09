// Flashcards – Concorso Scuola (versione stabile definitiva: coppie A→B fisse, no random direction, no macroarea)

let cards = [];
let currentIndex = 0;
let filteredCards = [];
let showingAnswer = false;
let cardsReady = false;

// 🔹 Inizializzazione
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
  // Selezione area
  document.querySelectorAll(".area-btn, .btn-all").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (btn.classList.contains("disabled")) {
        alert("Area in costruzione");
        return;
      }
      if (!cardsReady) await waitForCards();
      const area = btn.dataset.area;
      startGame(area);
    });
  });

  // Click sulla carta
  const cardEl = document.getElementById("card");
  cardEl.addEventListener("click", () => {
    if (!showingAnswer) {
      // Mostra risposta
      document.getElementById("card-front").classList.add("hidden");
      document.getElementById("card-back").classList.remove("hidden");
      showingAnswer = true;
    } else {
      // Passa alla prossima carta
      nextCard();
    }
  });

  // Tasti scorciatoia
  document.body.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code === "ArrowRight") {
      if (!showingAnswer) {
        document.getElementById("card-front").classList.add("hidden");
        document.getElementById("card-back").classList.remove("hidden");
        showingAnswer = true;
      } else {
        nextCard();
      }
    }
  });

  // Pulsanti
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

  filteredCards = area === "tutte" ? [...cards] : cards.filter(c => c.area === area);
  shuffleArray(filteredCards);

  currentIndex = 0;
  showCard();
}

function showCard() {
  if (filteredCards.length === 0) return;

  const card = filteredCards[currentIndex];
  const frontEl = document.getElementById("card-question");
  const backEl = document.getElementById("card-answer");

  // Mostra sempre A → B
  frontEl.textContent = card.a;
  backEl.textContent = card.b;

  document.getElementById("count-remaining").textContent =
    "Rimaste: " + (filteredCards.length - currentIndex - 1);

  // Macroarea rimossa
  // document.getElementById("card-meta").textContent = "";

  // Mostra lato domanda
  document.getElementById("card-front").classList.remove("hidden");
  document.getElementById("card-back").classList.add("hidden");
  showingAnswer = false;
}

function nextCard() {
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
