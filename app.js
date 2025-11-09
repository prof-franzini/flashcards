let cards = [];
let currentIndex = 0;
let reviewMode = false;
let filteredCards = [];
let currentDirection = "a2b";
let directionMode = "random"; // 🔹 "a2b" | "b2a" | "random"
let cardsReady = false;

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
  // 🔹 Selettore direzione
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

  // 🔹 Flip carta
  const cardEl = document.getElementById("card");
  let lastClickTime = 0;

  cardEl.addEventListener("click", () => {
    const now = Date.now();
    if (now - lastClickTime < 300) return;
    lastClickTime = now;

    const front = document.getElementById("card-front");
    const back = document.getElementById("card-back");

    if (front.classList.contains("hidden")) {
      nextCard();
    } else {
      front.classList.add("hidden");
      back.classList.remove("hidden");
    }
  });

  // 🔹 Shortcut tastiera
  document.body.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code === "ArrowRight") nextCard();
  });

  // 🔹 Revisione e reset
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
    const chk = () => cardsReady ? resolve() : setTimeout(chk, 50);
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

  // 🔹 Direzione in base alla modalità scelta
  if (directionMode === "random") {
    currentDirection = Math.random() < 0.5 ? "a2b" : "b2a";
  } else {
    currentDirection = directionMode;
  }

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