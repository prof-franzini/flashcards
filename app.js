let cards = [];
let currentIndex = 0;
let filteredCards = [];
let cardsReady = false;

// Direzione
let directionMode = "random"; // "a2b" | "b2a" | "random"
let currentDirection = "a2b";

// Revisione: usa le carte già passate
let reviewMode = false;
let seenCards = []; // ordine di visione durante la sessione corrente (oggetti carta, senza duplicati)

// Per tornare dallo stato di revisione al mazzo originale
let backupState = null; // { filtered, index }

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
  // Selettore direzione
  document.querySelectorAll(".dir-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".dir-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      directionMode = btn.dataset.dir;
    });
  });

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

  // Click su carta (tap mobile friendly)
  const cardEl = document.getElementById("card");
  let lastClickTime = 0;

  cardEl.addEventListener("click", () => {
    const now = Date.now();
    if (now - lastClickTime < 300) return; // anti doppio tap
    lastClickTime = now;

    const front = document.getElementById("card-front");
    const back = document.getElementById("card-back");

    if (front.classList.contains("hidden")) {
      // ero sulla risposta → considero la carta "vista" e passo alla prossima
      markCurrentAsSeen();
      nextCard();
    } else {
      // mostra la risposta
      front.classList.add("hidden");
      back.classList.remove("hidden");
    }
  });

  // Scorciatoie tastiera
  document.body.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code === "ArrowRight") {
      // se sto vedendo la risposta, contala come vista
      const front = document.getElementById("card-front");
      if (front.classList.contains("hidden")) markCurrentAsSeen();
      nextCard();
    }
  });

  // Revisione
  const btnReview = document.getElementById("btn-toggle-review");
  btnReview.addEventListener("click", () => {
    if (!reviewMode) {
      // Entrata in revisione: usa solo le carte già passate
      if (seenCards.length === 0) {
        alert("Non hai ancora visto nessuna carta da rivedere.");
        return;
      }
      // salva stato
      backupState = {
        filtered: filteredCards.slice(),
        index: currentIndex
      };
      filteredCards = seenCards.slice(); // ordine di visione, nessuno shuffle
      currentIndex = 0;
      reviewMode = true;
      btnReview.textContent = "Esci Revisione";
      showCard();
    } else {
      // Uscita dalla revisione: ripristina stato
      if (backupState) {
        filteredCards = backupState.filtered;
        currentIndex = backupState.index;
      }
      reviewMode = false;
      btnReview.textContent = "Avvia Revisione";
      showCard();
    }
  });

  // Reset
  document.getElementById("btn-reset").addEventListener("click", () => {
    currentIndex = 0;
    seenCards = [];
    shuffleArray(filteredCards);
    showCard();
  });

  // Home
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

  // reset stato sessione
  shuffleArray(filteredCards);
  currentIndex = 0;
  seenCards = [];
  reviewMode = false;
  const btnReview = document.getElementById("btn-toggle-review");
  if (btnReview) btnReview.textContent = "Avvia Revisione";

  showCard();
}

function showCard() {
  if (filteredCards.length === 0) return;

  const card = filteredCards[currentIndex];
  const frontEl = document.getElementById("card-question");
  const backEl = document.getElementById("card-answer");

  // Direzione per questa carta
  currentDirection = (directionMode === "random")
    ? (Math.random() < 0.5 ? "a2b" : "b2a")
    : directionMode;

  if (currentDirection === "a2b") {
    frontEl.textContent = card.a;
    backEl.textContent = card.b;
  } else {
    frontEl.textContent = card.b;
    backEl.textContent = card.a;
  }

  // UI
  document.getElementById("card-direction").textContent =
    currentDirection === "a2b" ? "Domanda → Risposta" : "Risposta → Domanda";

  document.getElementById("count-remaining").textContent =
    `Carta ${currentIndex + 1} / ${filteredCards.length}`;

  // riparti sempre dal fronte
  document.getElementById("card-front").classList.remove("hidden");
  document.getElementById("card-back").classList.add("hidden");
}

function nextCard() {
  if (filteredCards.length === 0) return;

  currentIndex++;
  if (currentIndex >= filteredCards.length) {
    currentIndex = 0;
    // In revisione NON mescoliamo; in modalità normale sì
    if (!reviewMode) shuffleArray(filteredCards);
  }
  showCard();
}

// Segna l'attuale carta come "già passata" (una sola volta)
function markCurrentAsSeen() {
  const card = filteredCards[currentIndex];
  if (!card) return;

  // Evita duplicati: usa il riferimento all'oggetto o una chiave (a+b+area)
  const keyOf = c => `${c.a}|||${c.b}|||${c.area ?? ""}`;
  const hasAlready = seenCards.some(c => keyOf(c) === keyOf(card));
  if (!hasAlready) {
    seenCards.push(card);
  }
}

// Fisher–Yates
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}