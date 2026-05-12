const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const LEVELS = [
  { cents: 1200, desc: "1 octave apart" },
  { cents:  200, desc: "2 semitones apart" },
  { cents:  100, desc: "1 semitone apart" },
  { cents:   50, desc: "½ semitone" },
  { cents:   25, desc: "25 cents" },
  { cents:   15, desc: "15 cents" },
  ...Array.from({length: 14}, (_, i) => ({ cents: 14 - i, desc: `${14 - i} cent${14 - i === 1 ? '' : 's'}` })),
];

let level = 0;
let freqA, freqB, higherIs;
let canAnswer = false;
let playedA = false, playedB = false;

function centsToRatio(c) { return Math.pow(2, c / 1200); }
function randomFreq() { return 261 + Math.random() * 262; }

function setupRound() {
  const base = randomFreq();
  higherIs = Math.random() < 0.5 ? 'A' : 'B';
  const diff = LEVELS[level].cents;
  freqA = higherIs === 'A' ? base * centsToRatio(diff) : base;
  freqB = higherIs === 'B' ? base * centsToRatio(diff) : base;

  canAnswer = false;
  playedA = false;
  playedB = false;

  document.getElementById('play-a').disabled = false;
  document.getElementById('play-b').disabled = false;
  document.getElementById('play-both-btn').disabled = false;
  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = '';
  document.getElementById('card-a').classList.remove('playing', 'answerable');
  document.getElementById('card-b').classList.remove('playing', 'answerable');
}

function scheduleTone(freq, startTime, dur) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'sine'; osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.35, startTime + 0.05);
  gain.gain.setValueAtTime(0.35, startTime + dur - 0.08);
  gain.gain.linearRampToValueAtTime(0, startTime + dur);
  osc.start(startTime); osc.stop(startTime + dur);
}

function playTone(freq, cardId, onDone) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const card = document.getElementById(cardId);
  card.classList.add('playing');
  const dur = 0.75;
  scheduleTone(freq, audioCtx.currentTime + 0.05, dur);
  setTimeout(() => {
    card.classList.remove('playing');
    if (onDone) onDone();
  }, (dur + 0.1) * 1000);
}

function checkCanAnswer() {
  if (playedA && playedB) {
    canAnswer = true;
    document.getElementById('card-a').classList.add('answerable');
    document.getElementById('card-b').classList.add('answerable');
  }
}

function answer(choice) {
  if (!canAnswer) return;
  canAnswer = false;
  document.getElementById('play-a').disabled = true;
  document.getElementById('play-b').disabled = true;
  document.getElementById('play-both-btn').disabled = true;
  document.getElementById('card-a').classList.remove('answerable');
  document.getElementById('card-b').classList.remove('answerable');

  const correct = choice === higherIs;
  const fb = document.getElementById('feedback');

  if (correct) {
    fb.textContent = 'Correct';
    fb.className = 'correct';
    if (level < LEVELS.length - 1) {
      level++;
      setTimeout(() => {
        document.getElementById('level-desc').textContent = LEVELS[level].desc;
        fb.textContent = LEVELS[level].desc;
        setupRound();
      }, 900);
      return;
    }
  } else {
    fb.textContent = `${higherIs} was higher`;
    fb.className = 'wrong';
  }

  setTimeout(() => setupRound(), 1100);
}

// Individual play buttons — play tone, then enable answering once both heard
document.getElementById('play-a').addEventListener('click', () => {
  const btn = document.getElementById('play-a');
  if (canAnswer) { answer('A'); return; }
  btn.disabled = true;
  playTone(freqA, 'card-a', () => {
    btn.disabled = false;
    playedA = true;
    checkCanAnswer();
  });
});

document.getElementById('play-b').addEventListener('click', () => {
  const btn = document.getElementById('play-b');
  if (canAnswer) { answer('B'); return; }
  btn.disabled = true;
  playTone(freqB, 'card-b', () => {
    btn.disabled = false;
    playedB = true;
    checkCanAnswer();
  });
});

// Play both sequentially
document.getElementById('play-both-btn').addEventListener('click', () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const bothBtn = document.getElementById('play-both-btn');
  const btnA = document.getElementById('play-a');
  const btnB = document.getElementById('play-b');
  bothBtn.disabled = true;
  btnA.disabled = true;
  btnB.disabled = true;

  const dur = 0.75, gap = 0.3;
  const t = audioCtx.currentTime + 0.05;

  document.getElementById('card-a').classList.add('playing');
  scheduleTone(freqA, t, dur);

  setTimeout(() => {
    document.getElementById('card-a').classList.remove('playing');
    document.getElementById('card-b').classList.add('playing');
  }, (dur + gap * 0.5) * 1000);

  scheduleTone(freqB, t + dur + gap, dur);

  setTimeout(() => {
    document.getElementById('card-b').classList.remove('playing');
    bothBtn.disabled = false;
    btnA.disabled = false;
    btnB.disabled = false;
    playedA = true; playedB = true;
    checkCanAnswer();
  }, (dur + gap + dur + 0.15) * 1000);
});

// Card clicks also answer (click anywhere on the card)
document.getElementById('card-a').addEventListener('click', (e) => {
  if (e.target.closest('#play-a')) return; // handled by button
  answer('A');
});
document.getElementById('card-b').addEventListener('click', (e) => {
  if (e.target.closest('#play-b')) return;
  answer('B');
});

document.getElementById('level-desc').textContent = LEVELS[level].desc;
setupRound();