
// ============================================
// MEMORYVERSE - MAIN GAME LOGIC
// ============================================


// 1. SELECT HTML ELEMENTS
// ============================================

const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");
const statsScreen = document.getElementById("statsScreen");
const settingsScreen = document.getElementById("settingsScreen");

const gameBoard = document.getElementById("gameBoard");

const timerDisplay = document.getElementById("timer");
const scoreDisplay = document.getElementById("score");
const movesDisplay = document.getElementById("moves");
const accuracyDisplay = document.getElementById("accuracy");
const bestScoreDisplay = document.getElementById("bestScore");

const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");

const comboText = document.getElementById("comboText");
const streakText = document.getElementById("streakText");
const gameMessage = document.getElementById("gameMessage");

const pauseOverlay = document.getElementById("pauseOverlay");
const resultOverlay = document.getElementById("resultOverlay");
const helpOverlay = document.getElementById("helpOverlay");

const confettiContainer = document.getElementById("confettiContainer");


// 2. GAME CONFIGURATION
// ============================================

const levels = {

    easy: {
        pairs: 6,
        time: 60
    },

    medium: {
        pairs: 8,
        time: 90
    },

    hard: {
        pairs: 12,
        time: 120
    }

};

const symbols = [
    "🍕", "🚀", "🎸", "🌈",
    "🐼", "🍉", "⚽", "🦋",
    "🎧", "🍩", "🌻", "🐬"
];

const soundFrequencies = {
    flip: 350,
    match: 650,
    wrong: 180,
    win: 850,
    hint: 500
};


// 3. GAME VARIABLES
// ============================================

let selectedLevel = localStorage.getItem("memoryLevel") || "easy";

if (!levels[selectedLevel]) {
    selectedLevel = "easy";
}

let cards = [];

let firstCard = null;
let secondCard = null;

let moves = 0;
let score = 0;
let matchedPairs = 0;

let timeLeft = 60;
let totalPairs = 6;

let streak = 0;
let hintsLeft = 3;

let gameActive = false;
let isPaused = false;
let lockBoard = false;
let isFinished = false;

let timerInterval = null;
let mismatchTimeout = null;
let hintTimeout = null;


// 4. LOAD SAVED DATA
// ============================================

function loadSavedData() {

    const defaultData = {
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
        bestScores: {
            easy: 0,
            medium: 0,
            hard: 0
        },
        achievements: []
    };

    try {

        const saved = JSON.parse(
            localStorage.getItem("memoryVerseData")
        );

        if (!saved) return defaultData;

        return {
            ...defaultData,
            ...saved,

            bestScores: {
                ...defaultData.bestScores,
                ...(saved.bestScores || {})
            },

            achievements: Array.isArray(saved.achievements)
                ? saved.achievements
                : []
        };

    } catch (error) {

        return defaultData;

    }

}

let playerData = loadSavedData();

function saveData() {

    localStorage.setItem(
        "memoryVerseData",
        JSON.stringify(playerData)
    );

}


// 5. SCREEN NAVIGATION
// ============================================

function showScreen(screen) {

    const allScreens = [
        homeScreen,
        gameScreen,
        statsScreen,
        settingsScreen
    ];

    allScreens.forEach(function (item) {
        item.classList.add("hidden");
    });

    screen.classList.remove("hidden");

    document.querySelectorAll(".nav-btn").forEach(function (button) {
        button.classList.remove("active");
    });

    if (screen === homeScreen) {
        document.getElementById("homeNav").classList.add("active");
    }

    if (screen === statsScreen) {
        document.getElementById("statsNav").classList.add("active");
    }

    if (screen === settingsScreen) {
        document.getElementById("settingsNav").classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// 6. NAVIGATION BUTTONS
// ============================================

document.getElementById("homeNav").addEventListener("click", function () {
    returnHome();
});

document.getElementById("brandHome").addEventListener("click", function (event) {
    event.preventDefault();
    returnHome();
});

document.getElementById("statsNav").addEventListener("click", function () {
    if (gameActive) return;
    updateStatistics();
    showScreen(statsScreen);
});

document.getElementById("settingsNav").addEventListener("click", function () {
    if (gameActive) return;
    showScreen(settingsScreen);
});

document.getElementById("statsHomeBtn").addEventListener("click", function () {
    showScreen(homeScreen);
});

document.getElementById("settingsHomeBtn").addEventListener("click", function () {
    showScreen(homeScreen);
});

document.getElementById("gameHomeBtn").addEventListener("click", function () {
    returnHome();
});

document.getElementById("pauseHomeBtn").addEventListener("click", function () {
    returnHome();
});

document.getElementById("resultHomeBtn").addEventListener("click", function () {
    resultOverlay.classList.add("hidden");
    showScreen(homeScreen);
    updateHomeStats();
});

function returnHome() {

    clearInterval(timerInterval);
    clearTimeout(mismatchTimeout);
    clearTimeout(hintTimeout);

    gameActive = false;
    isPaused = false;
    lockBoard = false;
    isFinished = true;

    pauseOverlay.classList.add("hidden");
    resultOverlay.classList.add("hidden");
    helpOverlay.classList.add("hidden");

    showScreen(homeScreen);

    updateHomeStats();

}


// 7. DIFFICULTY SELECTION
// ============================================

function updateDifficultySelection() {

    document.querySelectorAll(".difficulty-card").forEach(function (card) {

        card.classList.toggle(
            "selected",
            card.dataset.level === selectedLevel
        );

    });

}

document.querySelectorAll(".difficulty-card").forEach(function (card) {

    card.addEventListener("click", function () {

        selectedLevel = card.dataset.level;

        localStorage.setItem("memoryLevel", selectedLevel);

        updateDifficultySelection();

        playSound("flip");

    });

});


// 8. SHUFFLE CARDS
// ============================================

function shuffleArray(array) {

    for (let i = array.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] = [array[j], array[i]];

    }

    return array;

}


// 9. START GAME
// ============================================

function startGame() {

    clearInterval(timerInterval);
    clearTimeout(mismatchTimeout);
    clearTimeout(hintTimeout);

    pauseOverlay.classList.add("hidden");
    resultOverlay.classList.add("hidden");

    firstCard = null;
    secondCard = null;

    moves = 0;
    score = 0;
    matchedPairs = 0;

    streak = 0;
    hintsLeft = 3;

    lockBoard = false;
    isPaused = false;
    gameActive = true;
    isFinished = false;

    totalPairs = levels[selectedLevel].pairs;
    timeLeft = levels[selectedLevel].time;

    document.getElementById("pauseBtn").textContent = "⏸ Pause";

    showScreen(gameScreen);

    updateStats();
    updateTimer();
    updateProgress();
    updateHintCount();
    updateBestScore();

    comboText.textContent = "✨ Find your first match!";
    streakText.textContent = "COMBO ×0";

    gameMessage.textContent = "Focus, remember and match!";

    createCards();

    timerInterval = setInterval(function () {

        if (!gameActive || isPaused) return;

        timeLeft--;

        updateTimer();

        if (timeLeft <= 0) {
            endGame(false);
        }

    }, 1000);

}


// 10. CREATE CARDS
// ============================================

function createCards() {

    gameBoard.innerHTML = "";

    const chosenSymbols = symbols.slice(0, totalPairs);

    cards = shuffleArray([
        ...chosenSymbols,
        ...chosenSymbols
    ]);

    gameBoard.dataset.level = selectedLevel;

    cards.forEach(function (symbol, index) {

        const card = document.createElement("button");

        card.classList.add("memory-card");

        card.type = "button";
        card.dataset.symbol = symbol;

        card.setAttribute(
            "aria-label",
            "Hidden card " + (index + 1)
        );

        card.innerHTML = `
            <div class="card-inner">

                <div class="card-front">?</div>

                <div class="card-back">${symbol}</div>

            </div>
        `;

        card.addEventListener("click", function () {
            flipCard(card);
        });

        gameBoard.appendChild(card);

    });

}


// 11. FLIP CARD
// ============================================

function flipCard(card) {

    if (!gameActive) return;

    if (isPaused || lockBoard) return;

    if (card === firstCard) return;

    if (card.classList.contains("matched")) return;

    if (card.classList.contains("flipped")) return;

    card.classList.add("flipped");

    card.setAttribute(
        "aria-label",
        "Card " + card.dataset.symbol
    );

    playSound("flip");

    if (firstCard === null) {

        firstCard = card;

    } else {

        secondCard = card;

        moves++;

        updateStats();

        checkMatch();

    }

}


// 12. CHECK MATCH
// ============================================

function checkMatch() {

    const isMatch =
        firstCard.dataset.symbol === secondCard.dataset.symbol;

    if (isMatch) {

        firstCard.classList.add("matched");
        secondCard.classList.add("matched");

        firstCard.disabled = true;
        secondCard.disabled = true;

        matchedPairs++;

        streak++;

        // Base points

        let points = 100;

        // Combo bonus

        let bonus = streak >= 3 ? 50 : 0;

        score += points + bonus;

        playSound("match");

        if (streak >= 3) {

            comboText.textContent =
                "🔥 " + streak + " CONSECUTIVE MATCHES! +" + bonus + " BONUS";

        } else {

            comboText.textContent = "✨ Nice match! +" + points + " points";

        }

        streakText.textContent = "COMBO ×" + streak;

        gameMessage.textContent = "Excellent! Keep matching! 🎉";

        resetTurn();

        updateStats();
        updateProgress();

        if (matchedPairs === totalPairs) {

            endGame(true);

        }

    } else {

        lockBoard = true;

        streak = 0;

        streakText.textContent = "COMBO ×0";
        comboText.textContent = "💫 Your next match starts a new streak!";

        gameMessage.textContent = "Not a match! Try again.";

        playSound("wrong");

        mismatchTimeout = setTimeout(function () {

            firstCard.classList.remove("flipped");
            secondCard.classList.remove("flipped");

            firstCard.setAttribute("aria-label", "Hidden card");
            secondCard.setAttribute("aria-label", "Hidden card");

            resetTurn();

        }, 850);

    }

}


// 13. RESET TURN
// ============================================

function resetTurn() {

    firstCard = null;
    secondCard = null;

    lockBoard = false;

}


// 14. UPDATE STATS
// ============================================

function updateStats() {

    scoreDisplay.textContent = score;

    movesDisplay.textContent = moves;

    const accuracy = moves === 0
        ? 0
        : Math.round((matchedPairs / moves) * 100);

    accuracyDisplay.textContent = accuracy + "%";

}


// 15. UPDATE TIMER
// ============================================

function updateTimer() {

    const minutes = Math.floor(timeLeft / 60);

    const seconds = timeLeft % 60;

    timerDisplay.textContent =
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0");

    timerDisplay.classList.toggle(
        "danger",
        timeLeft <= 15
    );

}


// 16. UPDATE PROGRESS
// ============================================

function updateProgress() {

    progressText.textContent =
        matchedPairs + " / " + totalPairs + " pairs";

    const percentage =
        (matchedPairs / totalPairs) * 100;

    progressFill.style.width = percentage + "%";

}


// 17. BEST SCORE
// ============================================

function updateBestScore() {

    bestScoreDisplay.textContent =
        playerData.bestScores[selectedLevel];

}


// 18. HINT SYSTEM
// ============================================

function updateHintCount() {

    document.getElementById("hintCount").textContent =
        hintsLeft + " left";

    document.getElementById("hintBtn").disabled =
        hintsLeft <= 0;

}

document.getElementById("hintBtn").addEventListener("click", function () {

    if (!gameActive || isPaused || lockBoard) return;

    if (hintsLeft <= 0) return;

    const availableCards = Array.from(
        gameBoard.querySelectorAll(".memory-card")
    ).filter(function (card) {

        return !card.classList.contains("matched") &&
               !card.classList.contains("flipped");

    });

    if (availableCards.length < 2) return;

    const symbolsAvailable = {};

    availableCards.forEach(function (card) {

        const symbol = card.dataset.symbol;

        if (!symbolsAvailable[symbol]) {
            symbolsAvailable[symbol] = [];
        }

        symbolsAvailable[symbol].push(card);

    });

    const matchingGroup = Object.values(symbolsAvailable).find(
        function (group) {
            return group.length >= 2;
        }
    );

    if (!matchingGroup) return;

    hintsLeft--;

    updateHintCount();

    lockBoard = true;

    const hintCards = matchingGroup.slice(0, 2);

    hintCards.forEach(function (card) {
        card.classList.add("flipped");
    });

    playSound("hint");

    gameMessage.textContent =
        "💡 Hint used! Remember these two positions.";

    hintTimeout = setTimeout(function () {

        hintCards.forEach(function (card) {

            if (!card.classList.contains("matched")) {
                card.classList.remove("flipped");
            }

        });

        lockBoard = false;

        gameMessage.textContent = "Your turn! Find the matching pair.";

    }, 1200);

});


// 19. PAUSE AND RESUME
// ============================================

function pauseGame() {

    if (!gameActive || isPaused) return;

    isPaused = true;

    pauseOverlay.classList.remove("hidden");

    document.getElementById("pauseBtn").textContent = "▶ Resume";

}

function resumeGame() {

    if (!gameActive || !isPaused) return;

    isPaused = false;

    pauseOverlay.classList.add("hidden");

    document.getElementById("pauseBtn").textContent = "⏸ Pause";

}

document.getElementById("pauseBtn").addEventListener("click", function () {

    if (isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }

});

document.getElementById("resumeBtn").addEventListener("click", function () {

    resumeGame();

});


// 20. RESTART GAME
// ============================================

document.getElementById("restartBtn").addEventListener("click", function () {

    startGame();

});

document.getElementById("pauseRestartBtn").addEventListener("click", function () {

    startGame();

});

document.getElementById("playAgainBtn").addEventListener("click", function () {

    startGame();

});


// 21. SOUND EFFECTS
// ============================================

let soundEnabled =
    localStorage.getItem("memorySound") !== "false";

let audioContext = null;

function playSound(type) {

    if (!soundEnabled) return;

    try {

        const AudioContext =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) return;

        if (!audioContext) {
            audioContext = new AudioContext();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();

        const gain = audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.type = "sine";

        oscillator.frequency.value =
            soundFrequencies[type] || 400;

        gain.gain.setValueAtTime(
            0.12,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + 0.18
        );

        oscillator.start();

        oscillator.stop(audioContext.currentTime + 0.18);

    } catch (error) {

        console.log("Sound is unavailable.");

    }

}

function updateSoundButtons() {

    document.getElementById("soundBtn").textContent =
        soundEnabled ? "🔊 Sound On" : "🔇 Sound Off";

    document.getElementById("soundToggle").checked =
        soundEnabled;

}

function setSound(enabled) {

    soundEnabled = enabled;

    localStorage.setItem(
        "memorySound",
        String(soundEnabled)
    );

    updateSoundButtons();

}

document.getElementById("soundBtn").addEventListener("click", function () {

    setSound(!soundEnabled);

});

document.getElementById("soundToggle").addEventListener("change", function () {

    setSound(this.checked);

});


// 22. ACHIEVEMENTS
// ============================================

const achievementList = {

    firstWin: {
        name: "First Victory",
        icon: "🏆",
        description: "Win your first game."
    },

    speedster: {
        name: "Speedster",
        icon: "⚡",
        description: "Win with at least 20 seconds left."
    },

    comboKing: {
        name: "Combo King",
        icon: "🔥",
        description: "Reach a combo of 3 or more."
    },

    perfectMind: {
        name: "Perfect Mind",
        icon: "🧠",
        description: "Win without making a mistake."
    },

    explorer: {
        name: "Explorer",
        icon: "🎮",
        description: "Play 5 games."
    },

    hardWinner: {
        name: "Hard Mode Hero",
        icon: "👑",
        description: "Win a hard difficulty game."
    }

};

function unlockAchievement(id, newlyUnlocked) {

    if (playerData.achievements.includes(id)) return;

    playerData.achievements.push(id);

    newlyUnlocked.push(id);

    playSound("win");

}

function checkAchievements(won, newlyUnlocked) {

    if (won && playerData.gamesWon === 1) {
        unlockAchievement("firstWin", newlyUnlocked);
    }

    if (won && timeLeft >= 20) {
        unlockAchievement("speedster", newlyUnlocked);
    }

    if (won && streak >= 3) {
        unlockAchievement("comboKing", newlyUnlocked);
    }

    if (won && moves === totalPairs) {
        unlockAchievement("perfectMind", newlyUnlocked);
    }

    if (playerData.gamesPlayed >= 5) {
        unlockAchievement("explorer", newlyUnlocked);
    }

    if (won && selectedLevel === "hard") {
        unlockAchievement("hardWinner", newlyUnlocked);
    }

}

function showNewAchievements(list) {

    const container =
        document.getElementById("resultAchievements");

    container.innerHTML = "";

    list.forEach(function (id) {

        const badge = achievementList[id];

        if (!badge) return;

        const item = document.createElement("span");

        item.textContent = badge.icon + " " + badge.name;

        container.appendChild(item);

    });

    if (list.length === 0) {

        container.textContent =
            "Keep playing to unlock more achievements!";

    }

}


// 23. END GAME
// ============================================

function endGame(won) {

    if (isFinished) return;

    isFinished = true;
    gameActive = false;
    isPaused = false;
    lockBoard = true;

    clearInterval(timerInterval);
    clearTimeout(mismatchTimeout);
    clearTimeout(hintTimeout);

    let finalTime = timeLeft;

    // Add a time bonus for winning

    if (won) {
        score += timeLeft * 10;
    }

    // Update saved statistics

    playerData.gamesPlayed++;

    if (won) {
        playerData.gamesWon++;
    }

    playerData.totalScore += score;

    if (won && score > playerData.bestScores[selectedLevel]) {

        playerData.bestScores[selectedLevel] = score;

    }

    const newlyUnlocked = [];

    checkAchievements(won, newlyUnlocked);

    saveData();

    updateStats();
    updateBestScore();
    updateHomeStats();
    updateStatistics();

    // Display result

    document.getElementById("finalScore").textContent = score;

    const finalAccuracyValue = moves === 0
        ? 0
        : Math.round((matchedPairs / moves) * 100);

    document.getElementById("finalAccuracy").textContent =
        finalAccuracyValue + "%";

    document.getElementById("finalTime").textContent =
        formatTime(finalTime);

    document.getElementById("finalMoves").textContent = moves;

    if (won) {

        document.getElementById("resultEmoji").textContent = "🏆";

        document.getElementById("resultTitle").textContent =
            "You did it!";

        document.getElementById("resultMessage").textContent =
            "Fantastic memory! You matched every pair.";

        gameMessage.textContent = "Congratulations! You won!";

        playSound("win");

        launchConfetti();

    } else {

        document.getElementById("resultEmoji").textContent = "⏰";

        document.getElementById("resultTitle").textContent =
            "Time's up!";

        document.getElementById("resultMessage").textContent =
            "Great attempt. Come back and beat your record!";

        gameMessage.textContent = "Time is up. Try again!";

        playSound("wrong");

    }

    showNewAchievements(newlyUnlocked);

    pauseOverlay.classList.add("hidden");

    resultOverlay.classList.remove("hidden");

}


// 24. FORMAT TIME
// ============================================

function formatTime(seconds) {

    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );

}


// 25. CONFETTI ANIMATION
// ============================================

function launchConfetti() {

    confettiContainer.innerHTML = "";

    const colours = [
        "#ff75b5",
        "#9b7bff",
        "#35d9ed",
        "#ffd166",
        "#4ce0a1",
        "#ffffff"
    ];

    for (let i = 0; i < 100; i++) {

        const piece = document.createElement("div");

        piece.classList.add("confetti");

        piece.style.left = Math.random() * 100 + "%";

        piece.style.background =
            colours[Math.floor(Math.random() * colours.length)];

        piece.style.animationDelay =
            Math.random() * 1.5 + "s";

        piece.style.animationDuration =
            (2 + Math.random() * 2) + "s";

        confettiContainer.appendChild(piece);

    }

    setTimeout(function () {

        confettiContainer.innerHTML = "";

    }, 5000);

}


// 26. UPDATE HOME STATISTICS
// ============================================

function updateHomeStats() {

    document.getElementById("homeGames").textContent =
        playerData.gamesPlayed;

    document.getElementById("homeWins").textContent =
        playerData.gamesWon;

    const best = Math.max(
        ...Object.values(playerData.bestScores)
    );

    document.getElementById("homeBest").textContent = best;

}


// 27. STATISTICS PAGE
// ============================================

function updateStatistics() {

    const games = playerData.gamesPlayed;

    const wins = playerData.gamesWon;

    const winRate = games === 0
        ? 0
        : Math.round((wins / games) * 100);

    document.getElementById("statGames").textContent =
        games;

    document.getElementById("statWins").textContent =
        wins;

    document.getElementById("statWinRate").textContent =
        winRate + "%";

    document.getElementById("statTotalScore").textContent =
        playerData.totalScore;

    document.getElementById("easyBest").textContent =
        playerData.bestScores.easy;

    document.getElementById("mediumBest").textContent =
        playerData.bestScores.medium;

    document.getElementById("hardBest").textContent =
        playerData.bestScores.hard;

    const achievementContainer =
        document.getElementById("statsAchievements");

    achievementContainer.innerHTML = "";

    if (playerData.achievements.length === 0) {

        achievementContainer.textContent =
            "No achievements yet. Start playing!";

    } else {

        playerData.achievements.forEach(function (id) {

            const badge = achievementList[id];

            if (!badge) return;

            const item = document.createElement("div");

            item.classList.add("mini-badge");

            item.textContent = badge.icon + " " + badge.name;

            achievementContainer.appendChild(item);

        });

    }

}


// 28. THEME SYSTEM
// ============================================

function applyTheme(theme) {

    const validThemes = [
        "midnight",
        "ocean",
        "violet",
        "sunset",
        "emerald",
        "light"
    ];

    if (!validThemes.includes(theme)) {
        theme = "midnight";
    }

    document.body.dataset.theme = theme;

    localStorage.setItem("memoryTheme", theme);

    document.getElementById("themeSelect").value = theme;

}

const savedTheme =
    localStorage.getItem("memoryTheme") || "midnight";

applyTheme(savedTheme);

document.getElementById("themeSelect").addEventListener("change", function () {

    applyTheme(this.value);

});

document.querySelectorAll(".theme-choice").forEach(function (button) {

    button.addEventListener("click", function () {

        applyTheme(button.dataset.themeChoice);

    });

});


// 29. DEFAULT DIFFICULTY SETTING
// ============================================

document.getElementById("defaultDifficulty").value =
    selectedLevel;

document.getElementById("defaultDifficulty").addEventListener("change", function () {

    selectedLevel = this.value;

    localStorage.setItem("memoryLevel", selectedLevel);

    updateDifficultySelection();

});


// 30. HOME SCREEN BUTTONS
// ============================================

document.getElementById("playBtn").addEventListener("click", function () {

    startGame();

});

document.getElementById("howToBtn").addEventListener("click", function () {

    helpOverlay.classList.remove("hidden");

});

document.getElementById("closeHelpBtn").addEventListener("click", function () {

    helpOverlay.classList.add("hidden");

});

document.getElementById("helpPlayBtn").addEventListener("click", function () {

    helpOverlay.classList.add("hidden");

    startGame();

});


// 31. INITIAL PAGE SETUP
// ============================================

function initialiseGame() {

    updateDifficultySelection();

    updateSoundButtons();

    updateHomeStats();

    updateStatistics();

    updateBestScore();

    showScreen(homeScreen);

}

initialiseGame();
