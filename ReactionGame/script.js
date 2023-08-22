const content = document.getElementById('content');
const timeDisplay = document.getElementById('time-display');
const retryButton = document.getElementById('retry');

let startTime;

function startGame() {
    let randomTime = Math.random() * (10000 - 3000) + 3000;  
    setTimeout(turnGreen, randomTime);
}

function turnGreen() {
    document.body.style.backgroundColor = '#4CAF50';  
    timeDisplay.textContent = '';
    startTime = new Date().getTime();  
    document.body.addEventListener('click', checkTime);
}

function checkTime() {
    const endTime = new Date().getTime();
    const reactionTime = (endTime - startTime) / 1000;  

    timeDisplay.textContent = reactionTime.toFixed(2);
    retryButton.style.display = 'block';

    document.body.removeEventListener('click', checkTime);
}

startGame();