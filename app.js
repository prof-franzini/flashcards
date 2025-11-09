// Flashcards – versione semplificata e corretta (coppie A→B coerenti, nessuna confusione)

let cards = [];
let filteredCards = [];
let currentIndex = 0;
let showingAnswer = false;
let cardsReady = false;

// 🔹 Inizializza quando la pagina è pronta
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
  } catch (err) {
    console.error("Errore nel caricamento delle carte:", err);
    alert("Impossibile caricare le carte.");
  }
}

function wireUI() {
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

  const cardEl = document.getElementById("card");
  cardEl.addEventListener("click", handleCardClick);

  document.body.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code === "ArrowRight") handleCardClick();
  });

  document.getElementById("btn-reset").addEventListener("click", () => {
    startGame("tutte");
  });

  document.getElementById("btn-home").addEventListener("click", () => {
    document.getElementById("game-area").classList.add("hidden");
    document.getElementById("area-select").classList.remove("hidden");
  });
}

function waitForCards() {
  return new Promise(resolve => {
    const check = () => {
      if (cardsReady) resolve();
      else setTimeout(check, 50);
    };
    check();
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
  showingAnswer = false;
  showCard();
}

function handleCardClick() {
  if (!filteredCards.length) return;

  if (!showingAnswer) {
    // Mostra risposta della stessa carta
    document.getElementById("card-front").classList.add("hidden");
    document.getElementById("card-back").classList.remove("hidden");
    showingAnswer = true;
  } else {
    // Passa alla carta successiva
    nextCard();
  }
}

function showCard() {
  const card = filteredCards[currentIndex];
  const front = document.getElementById("card-question");
  const back = document.getElementById("card-answer");

  // Mostra sempre a → b (coerente)
  front.textContent = card.a;
  back.textContent = card.b;

  document.getElementById("count-remaining").textContent =
    "Rimaste: " + (filteredCards.length - currentIndex - 1);

  // Nascondi macroarea
  // document.getElementById("card-meta").textContent = "";

  // Lato domanda
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

// 🔹 Fisher–Yates shuffle (mescola tutto ma mantiene le coppie integre)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
