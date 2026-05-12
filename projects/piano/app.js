// ── Key definitions (semitone from C) ──────────────────────
  const KEYS = [
    { key: 'a',  st: 0,  type: 'white' },
    { key: 'w',  st: 1,  type: 'black' },
    { key: 's',  st: 2,  type: 'white' },
    { key: 'e',  st: 3,  type: 'black' },
    { key: 'd',  st: 4,  type: 'white' },
    { key: 'f',  st: 5,  type: 'white' },
    { key: 't',  st: 6,  type: 'black' },
    { key: 'g',  st: 7,  type: 'white' },
    { key: 'y',  st: 8,  type: 'black' },
    { key: 'h',  st: 9,  type: 'white' },
    { key: 'u',  st: 10, type: 'black' },
    { key: 'j',  st: 11, type: 'white' },
    { key: 'k',  st: 12, type: 'white' },
    { key: 'o',  st: 13, type: 'black' },
    { key: 'l',  st: 14, type: 'white' },
    { key: 'p',  st: 15, type: 'black' },
    { key: ';',  st: 16, type: 'white' },
    { key: "'",  st: 17, type: 'white' },
    { key: ']',  st: 18, type: 'black' },
  ];

  const SCALES = {
    major:      [0,2,4,5,7,9,11],
    minor:      [0,2,3,5,7,8,10],
    harmonic:   [0,2,3,5,7,8,11],
    pent_maj:   [0,2,4,7,9],
    pent_min:   [0,3,5,7,10],
    blues:      [0,3,5,6,7,10],
    dorian:     [0,2,3,5,7,9,10],
    phrygian:   [0,1,3,5,7,8,10],
    lydian:     [0,2,4,6,7,9,11],
    mixolydian: [0,2,4,5,7,9,10],
    chromatic:  [0,1,2,3,4,5,6,7,8,9,10,11],
  };

  // ── Build DOM ──────────────────────────────────────────────
  const piano   = document.getElementById('piano');
  const elems   = {};
  const WHITE_W = 58, PAD = 12;

  let wi = 0;
  KEYS.forEach(k => {
    if (k.type !== 'white') return;
    const el = document.createElement('div');
    el.className = 'white';
    el.innerHTML = `<span class="key-lbl">${k.key}</span>`;
    piano.appendChild(el);
    elems[k.key] = el;
    k._wi = wi++;
  });

  let lastWI = -1;
  KEYS.forEach(k => {
    if (k.type === 'white') { lastWI = k._wi; return; }
    const el = document.createElement('div');
    el.className = 'black';
    el.innerHTML = `<span class="key-lbl">${k.key}</span>`;
    el.style.left = (PAD + (lastWI + 1) * WHITE_W - 18) + 'px';
    piano.appendChild(el);
    elems[k.key] = el;
  });

  // ── Audio ──────────────────────────────────────────────────
  let ctx, compressor;
  const active = {};
  let octaveOffset = 0;

  function initAudio() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 10;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.2;
    compressor.connect(ctx.destination);
  }

  const C4_HZ = 261.63;
  function freq(st) {
    return C4_HZ * Math.pow(2, (st + octaveOffset * 12) / 12);
  }

  function playNote(key) {
    const k = KEYS.find(x => x.key === key);
    if (!k || active[key]) return;
    initAudio();

    const wave = document.getElementById('waveform').value;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = wave;
    osc.frequency.value = freq(k.st);

    // Piano-like: brighter attack, then roll off
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.008);
    if (wave === 'triangle') {
      // Gentle decay for piano feel
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.3);
    }

    osc.connect(gain);
    gain.connect(compressor);
    osc.start();

    active[key] = { osc, gain };
    elems[key].classList.add('active');
  }

  function stopNote(key) {
    if (!active[key]) return;
    const { osc, gain } = active[key];
    const rel = 0.18;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + rel);
    osc.stop(ctx.currentTime + rel + 0.01);
    delete active[key];
    elems[key].classList.remove('active');
  }

  // ── Octave ─────────────────────────────────────────────────
  function changeOctave(delta) {
    Object.keys(active).forEach(stopNote);
    octaveOffset = Math.max(-3, Math.min(3, octaveOffset + delta));
    document.getElementById('octaveVal').textContent = 4 + octaveOffset;
  }

  document.getElementById('octDown').addEventListener('click', () => changeOctave(-1));
  document.getElementById('octUp').addEventListener('click',   () => changeOctave(1));

  // ── Scale highlight ────────────────────────────────────────
  function updateScale() {
    const root      = parseInt(document.getElementById('scaleRoot').value);
    const scaleType = document.getElementById('scaleType').value;

    KEYS.forEach(k => {
      const el = elems[k.key];
      // Remove dots and classes
      el.querySelectorAll('.key-dot').forEach(d => d.remove());
      el.classList.remove('in-scale', 'root-key');
      if (root === -1) return;

      const pc  = ((k.st % 12) + 12) % 12;
      const rel = ((pc - root) % 12 + 12) % 12;
      const inScale = SCALES[scaleType].includes(rel);

      if (inScale || rel === 0) {
        const dot = document.createElement('div');
        dot.className = 'key-dot';
        el.insertBefore(dot, el.firstChild);
        el.classList.add(rel === 0 ? 'root-key' : 'in-scale');
      }
    });
  }

  document.getElementById('scaleRoot').addEventListener('change', updateScale);
  document.getElementById('scaleType').addEventListener('change', updateScale);

  // ── Keyboard ───────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === 'z') { e.preventDefault(); changeOctave(-1); return; }
    if (k === 'x') { e.preventDefault(); changeOctave(1);  return; }
    // Handle special chars: ; ] '
    const raw = e.key;
    const resolved = elems[raw] ? raw : elems[k] ? k : null;
    if (resolved) { e.preventDefault(); playNote(resolved); }
  });

  document.addEventListener('keyup', e => {
    const raw = e.key;
    const k   = e.key.toLowerCase();
    const resolved = elems[raw] ? raw : elems[k] ? k : null;
    if (resolved) stopNote(resolved);
  });

  // ── Mouse ──────────────────────────────────────────────────
  Object.keys(elems).forEach(key => {
    const el = elems[key];
    el.addEventListener('mousedown', e => { e.preventDefault(); playNote(key); });
    el.addEventListener('mouseup',   () => stopNote(key));
    el.addEventListener('mouseleave',() => stopNote(key));
  });