const content = document.getElementById('content');
const timeDisplay = document.getElementById('time-display');
const retryButton = document.getElementById('retry');

let startTime;
let gameReady = false;
let timeoutId;

function startGame() {
    gameReady = false;
    document.body.style.backgroundColor = '#fff';
    timeDisplay.textContent = 'Wait for green...';
    retryButton.style.display = 'none';

    document.body.addEventListener('click', handleClick);

    const randomTime = Math.random() * (10000 - 3000) + 3000;
    timeoutId = setTimeout(turnGreen, randomTime);
}

function turnGreen() {
    gameReady = true;
    document.body.style.backgroundColor = '#4CAF50';
    timeDisplay.textContent = '';
    startTime = Date.now();
}

function handleClick() {
    if (!gameReady) {
        loseGame();
    } else {
        checkTime();
    }
}

function checkTime() {
    const reactionTime = (Date.now() - startTime) / 1000;
    timeDisplay.textContent = `Reaction time: ${reactionTime.toFixed(2)}s`;
    endGame();
}

function loseGame() {
    clearTimeout(timeoutId);
    timeDisplay.textContent = 'Too early! You lose 😬';
    document.body.style.backgroundColor = '#f44336';
    endGame();
}

function endGame() {
    document.body.removeEventListener('click', handleClick);
    retryButton.style.display = 'block';
}

startGame();
