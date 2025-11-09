let cards = [];
let currentIndex = 0;
let filteredCards = [];
let cardsReady = false;
let directionMode = "random"; // "a2b" | "b2a" | "random"
let currentDirection = "a2b";

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
  // 🔹 Selettore direzione (nuovo)
  document.querySelectorAll(".dir-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".dir-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      directionMode = btn.dataset.dir;
    });
  });

  // 🔹 Selezione area
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

  // 🔹 Click su carta (mostra risposta o passa alla prossima)
  const cardEl = document.getElementById("card");
  let lastClickTime = 0;

  cardEl.addEventListener("click", () => {
    const now = Date.now();
    if (now - lastClickTime < 300) return; // evita doppio tap veloce
    lastClickTime = now;

    const front = document.getElementById("card-front");
    const back = document.getElementById("card-back");

    if (front.classList.contains("hidden")) {
      // se sto vedendo la risposta → vai alla prossima carta
      nextCard();
    } else {
      // mostra la risposta
      front.classList.add("hidden");
      back.classList.remove("hidden");
    }
  });

  // 🔹 Tasto spazio o freccia destra = prossima carta
  document.body.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code === "ArrowRight") nextCard();
  });

  // 🔹 Pulsante Reset
  document.getElementById("btn-reset").addEventListener("click", () => {
    currentIndex = 0;
    shuffleArray(filteredCards);
    showCard();
  });

  // 🔹 Pulsante Home
  document.getElementById("btn-home").addEventListener("click", () => {
    document.getElementById("game-area").classList.add("hidden");
    document.getElementById("area-select").classList.remove("hidden");
  });
}

function waitForCards() {
  return new Promise(resolve => {
    const chk = () => (cardsReady ? resolve() : setTimeout(chk, 50));
    chk();
  });
}

function startGame(area) {
  document.getElementById("area-select").classList.add("hidden");
  document.getElementById("game-area").classList.remove("hidden");

  filteredCards = area === "tutte"
    ? [...cards]
    : cards.filter(c => c.area === area);

  if (filteredCards.length === 0) {
    alert("Nessuna carta disponibile per quest'area.");
    return;
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

  // 🔹 Scegli direzione per questa carta
  if (directionMode === "random") {
    currentDirection = Math.random() < 0.5 ? "a2b" : "b2a";
  } else {
    currentDirection = directionMode;
  }

  // 🔹 Mostra i lati coerenti
  if (currentDirection === "a2b") {
    frontEl.textContent = card.a;
    backEl.textContent = card.b;
  } else {
    frontEl.textContent = card.b;
    backEl.textContent = card.a;
  }

  document.getElementById("card-direction").textContent =
    currentDirection === "a2b" ? "Domanda → Risposta" : "Risposta → Domanda";

  document.getElementById("count-remaining").textContent =
    `Carta ${currentIndex + 1} / ${filteredCards.length}`;

  // sempre riparti dal lato domanda
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