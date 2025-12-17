const content = document.getElementById('content');
const timeDisplay = document.getElementById('time-display');
const retryButton = document.getElementById('retry');

let startTime;
let isGreen = false;

function startGame() {
    let randomTime = Math.random() * (10000 - 3000) + 3000;

    // listen for clicks immediately
    document.body.addEventListener('click', checkClick);

    setTimeout(turnGreen, randomTime);
}

function turnGreen() {
    document.body.style.backgroundColor = '#4CAF50';
    timeDisplay.textContent = '';
    startTime = Date.now();
    isGreen = true;
}

function checkClick() {
    if (!isGreen) {
        // clicked too early = lose
        timeDisplay.textContent = 'Too early!';
        retryButton.style.display = 'block';
        document.body.removeEventListener('click', checkClick);
        return;
    }

    const reactionTime = (Date.now() - startTime) / 1000;
    timeDisplay.textContent = reactionTime.toFixed(2);
    retryButton.style.display = 'block';

    document.body.removeEventListener('click', checkClick);
}

startGame();
