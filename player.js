const joinCard = document.getElementById("joinCard");
const gameCard = document.getElementById("gameCard");
const joinForm = document.getElementById("joinForm");
const playerNameInput = document.getElementById("playerName");
const joinMessage = document.getElementById("joinMessage");

const questionCounter = document.getElementById("questionCounter");
const timerValue = document.getElementById("timerValue");
const myScore = document.getElementById("myScore");
const questionTitle = document.getElementById("questionTitle");
const questionText = document.getElementById("questionText");
const revealAnswer = document.getElementById("revealAnswer");
const answerForm = document.getElementById("answerForm");
const answerInput = document.getElementById("answerInput");
const submitBtn = document.getElementById("submitBtn");
const submitMessage = document.getElementById("submitMessage");
const leaderboardList = document.getElementById("leaderboardList");
const playerCount = document.getElementById("playerCount");

let latestState = null;
let playerId = "";
let pollHandle = null;

function setMessage(element, text, type) {
  element.textContent = text || "";
  element.classList.remove("ok", "error");
  if (type) element.classList.add(type);
}

function formatClock(seconds) {
  const safe = Math.max(0, seconds);
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function remainingSeconds() {
  if (!latestState || !latestState.questionStartedAt) return 5 * 60;
  const elapsed = Math.floor((Date.now() - latestState.questionStartedAt) / 1000);
  return Math.max(0, latestState.timerSeconds - elapsed);
}

async function getJSON(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" }
  });
  return response.json();
}

async function postJSON(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload)
  });
  return response.json();
}

function renderLeaderboard() {
  leaderboardList.innerHTML = "";
  if (!latestState || !latestState.leaderboard || latestState.leaderboard.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No scores yet.";
    leaderboardList.appendChild(li);
    return;
  }

  latestState.leaderboard.forEach((entry, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${entry.name} - ${entry.score} pts`;
    leaderboardList.appendChild(li);
  });
}

function render() {
  if (!latestState) return;

  playerCount.textContent = `Players online: ${latestState.playersOnline}`;
  questionCounter.textContent = `${latestState.questionNumber}/${latestState.totalQuestions}`;
  timerValue.textContent = formatClock(remainingSeconds());
  myScore.textContent = latestState.you ? String(latestState.you.score) : "0";

  if (!latestState.gameStarted && !latestState.gameFinished) {
    questionTitle.textContent = "Waiting for admin to start...";
    questionText.textContent = "Stay ready. The clue will appear as soon as admin starts.";
  } else if (latestState.gameFinished) {
    questionTitle.textContent = "Game Finished";
    questionText.textContent = "Thanks for playing. Wait for admin to restart.";
  } else {
    questionTitle.textContent = `Question ${latestState.questionNumber}`;
    questionText.textContent = latestState.questionText || "Waiting for clue...";
  }

  const canSubmit = Boolean(latestState.canSubmit);
  answerInput.disabled = !canSubmit;
  submitBtn.disabled = !canSubmit;

  if (latestState.submittedCurrent) {
    setMessage(submitMessage, `Submitted: "${latestState.yourCurrentAnswer}" (no resubmission)`, "ok");
  } else if (latestState.gameStarted) {
    setMessage(submitMessage, "Type your best guess and click submit.", "");
  } else {
    setMessage(submitMessage, "Answer box unlocks when admin starts the game.", "");
  }

  if (latestState.revealAnswer && latestState.revealedAnswer) {
    revealAnswer.classList.remove("hidden");
    revealAnswer.textContent = `Answer: ${latestState.revealedAnswer}`;
  } else {
    revealAnswer.classList.add("hidden");
    revealAnswer.textContent = "";
  }

  renderLeaderboard();
}

async function fetchPlayerState() {
  if (!playerId) return;
  try {
    const result = await getJSON(`/api/player/state?playerId=${encodeURIComponent(playerId)}`);
    if (!result.ok) {
      setMessage(submitMessage, result.error || "Session expired. Please rejoin.", "error");
      clearInterval(pollHandle);
      pollHandle = null;
      return;
    }
    latestState = result.state;
    render();
  } catch (_error) {
    setMessage(submitMessage, "Connection issue. Retrying...", "error");
  }
}

function startPolling() {
  if (pollHandle) return;
  pollHandle = setInterval(fetchPlayerState, 1000);
  fetchPlayerState();
}

joinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = playerNameInput.value.trim();
  if (!name) {
    setMessage(joinMessage, "Please enter your name.", "error");
    return;
  }

  try {
    const result = await postJSON("/api/player/join", { name });
    if (!result.ok) {
      setMessage(joinMessage, result.error || "Could not join.", "error");
      return;
    }
    playerId = result.playerId;
    joinCard.classList.add("hidden");
    gameCard.classList.remove("hidden");
    setMessage(joinMessage, "", "");
    startPolling();
  } catch (_error) {
    setMessage(joinMessage, "Could not connect to server.", "error");
  }
});

answerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!playerId || !latestState || !latestState.canSubmit) return;

  const answer = answerInput.value.trim();
  if (!answer) {
    setMessage(submitMessage, "Please type your answer first.", "error");
    return;
  }

  try {
    const result = await postJSON("/api/player/answer", { playerId, answer });
    if (!result.ok) {
      setMessage(submitMessage, result.error || "Submission failed.", "error");
      return;
    }
    answerInput.value = "";
    setMessage(submitMessage, "Answer submitted. No resubmission allowed.", "ok");
    fetchPlayerState();
  } catch (_error) {
    setMessage(submitMessage, "Could not submit answer.", "error");
  }
});

setInterval(() => {
  if (!latestState) return;
  timerValue.textContent = formatClock(remainingSeconds());
}, 1000);

