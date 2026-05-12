(() => {
  const ALPHABET_TARGET = "abcdefghijklmnopqrstuvwxyz";
  const FOX_TARGET = "The quick brown fox jumps over the lazy dog";

  const app = document.getElementById("app");
  const statusEl = document.getElementById("status");
  const timerEl = document.getElementById("timer");
  const bestEl = document.getElementById("bestValue");
  const typedEl = document.getElementById("typed");
  const scoreEl = document.getElementById("score");
  const scoreHintEl = document.getElementById("scoreHint");

  const btnAlphabet = document.getElementById("btnAlphabet");
  const btnFox = document.getElementById("btnFox");

  let mode = "alphabet"; // "alphabet" | "fox"
  let phase = "idle";    // "idle" | "running" | "error" | "success"
  let typed = "";
  let startTs = null;
  let endElapsed = 0;
  let frozenElapsed = 0;

  let errorIndex = null;
  let errorChar = "";
  let lockUntil = 0;
  let resetting = false;

  const lockMs = 1200;
  const deleteWindowSec = 0.6;

  let caretOn = true;
  let caretTimer = null;

  let raf = null;
  const timeouts = [];

  function getTarget() {
    return mode === "alphabet" ? ALPHABET_TARGET : FOX_TARGET;
  }

  function getBestKey() {
    return `sprintTyping.bestMs.${mode}`;
  }

  function pad2(n) { return String(n).padStart(2, "0"); }

  function formatMs(ms) {
    const total = Math.max(0, Math.round(ms));
    const minutes = Math.floor(total / 60000);
    const seconds = Math.floor((total % 60000) / 1000);
    const millis = total % 1000;
    return `${pad2(minutes)}:${pad2(seconds)}.${String(millis).padStart(3, "0")}`;
  }

  function bestMs() {
    const raw = localStorage.getItem(getBestKey());
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function saveBestIfNeeded(ms) {
    if (!(ms > 0)) return;
    const b = bestMs();
    if (b != null && ms >= b) return;
    localStorage.setItem(getBestKey(), String(ms));
  }

  function isLocked() {
    return Date.now() < lockUntil || resetting;
  }

  function normalizedChar(key) {
    if (!key || key.length !== 1) return "";
    if (key === " ") return " ";
    const lower = key.toLowerCase();
    if (lower < "a" || lower > "z") return "";
    return lower;
  }

  function sameCharIgnoringCase(a, b) {
    if (a === b) return true;
    return a.toLowerCase() === b.toLowerCase();
  }

  function elapsedNow() {
    if (phase === "success") return endElapsed;
    if (phase === "error") return frozenElapsed;
    if (phase === "running" && startTs != null) return Date.now() - startTs;
    return 0;
  }

  function clearTimeouts() {
    while (timeouts.length) clearTimeout(timeouts.pop());
  }

  function renderTimer() {
    timerEl.textContent = formatMs(elapsedNow());
  }

  function startTimerRAF() {
    if (raf) return;
    const tick = () => {
      renderTimer();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function stopTimerRAF() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function startCaret() {
    if (caretTimer) return;
    caretTimer = setInterval(() => {
      caretOn = !caretOn;
      updateCaretOnly();
    }, 450);
  }

  function stopCaret() {
    if (caretTimer) clearInterval(caretTimer);
    caretTimer = null;
  }

  function hardReset() {
    clearTimeouts();
    typed = "";
    phase = "idle";
    startTs = null;
    endElapsed = 0;
    frozenElapsed = 0;
    errorIndex = null;
    errorChar = "";
    lockUntil = 0;
    resetting = false;
    stopTimerRAF();
    render();
  }

  function startRunIfNeeded(rawKey) {
    const target = getTarget();
    const firstExpected = target[0];
    const ok = firstExpected === " " ? rawKey === " " : sameCharIgnoringCase(rawKey, firstExpected);
    if (!ok) return false;

    typed = firstExpected;
    startTs = Date.now();
    endElapsed = 0;
    frozenElapsed = 0;
    errorIndex = null;
    errorChar = "";
    resetting = false;
    phase = "running";
    startTimerRAF();
    render();
    return true;
  }

  function handleSuccess(finalMs) {
    endElapsed = finalMs;
    phase = "success";
    saveBestIfNeeded(finalMs);
    stopTimerRAF();
    render();
  }

  function runDeleteAnimation() {
    const spans = typedEl.querySelectorAll(".char");
    const total = spans.length;
    if (!total) return;

    const step = (deleteWindowSec * 1000) / total;
    for (let i = total - 1; i >= 0; i--) {
      const delay = (total - 1 - i) * step;
      timeouts.push(setTimeout(() => spans[i].classList.add("del"), delay));
    }
  }

  function beginError(wrongRaw) {
    frozenElapsed = startTs != null ? Date.now() - startTs : elapsedNow();

    errorIndex = typed.length;
    errorChar = wrongRaw;
    phase = "error";

    lockUntil = Date.now() + lockMs;
    stopTimerRAF();

    resetting = false;
    clearTimeouts();

    const deleteMs = Math.round(deleteWindowSec * 1000);
    timeouts.push(setTimeout(() => {
      resetting = true;
      runDeleteAnimation();
      updateCaretOnly();
    }, Math.max(0, lockMs - deleteMs)));

    timeouts.push(setTimeout(() => {
      hardReset();
    }, lockMs));

    render();
  }

  function ensureCaretNode() {
    if (typedEl.querySelector(".caret")) return;
    const caret = document.createElement("span");
    caret.className = "caret";
    caret.textContent = "_";
    typedEl.appendChild(caret);
  }

  function updateCaretOnly() {
    const caret = typedEl.querySelector(".caret");
    if (!caret) return;

    caret.classList.toggle("dim", phase === "idle");
    caret.classList.toggle("off", !caretOn);

    caret.classList.toggle("deleting", resetting);

    if (phase === "success") caret.style.display = "none";
    else caret.style.display = "inline-block";
  }

  function render() {
    app.classList.toggle("error", phase === "error");
    
    const b = bestMs();
    bestEl.textContent = b != null ? formatMs(b) : "—";

    renderTimer();

    // letter spacing per mode
    typedEl.style.letterSpacing = mode === "alphabet" ? "0.08em" : "0.04em";

    if (phase === "success") {
      const bestStr = (bestMs() != null) ? formatMs(bestMs()) : "—";
      scoreEl.textContent = `TIME ${formatMs(endElapsed)}   •   BEST ${bestStr}`;
      scoreHintEl.textContent = `Type ${getTarget()[0]} to run again.`;
    } else {
      scoreEl.textContent = "";
      scoreHintEl.textContent = "";
    }

    const renderLetters = (phase === "error") ? (typed + errorChar) : typed;

    typedEl.innerHTML = "";
    for (let i = 0; i < renderLetters.length; i++) {
      const c = renderLetters[i];
      const span = document.createElement("span");
      span.className = "char";
      if (phase === "error" && errorIndex === i) span.classList.add("wrong");

      let out = c;
      if (c === " ") out = "·";
      else if (mode === "alphabet") out = c.toUpperCase();

      span.textContent = out;
      typedEl.appendChild(span);
    }

    ensureCaretNode();
    updateCaretOnly();

    btnAlphabet.classList.toggle("active", mode === "alphabet");
    btnFox.classList.toggle("active", mode === "fox");

    if (phase === "success") stopCaret();
    else startCaret();
  }

  // Focus helper
  app.addEventListener("pointerdown", () => app.focus());

  // Mode buttons
  [btnAlphabet, btnFox].forEach((btn) => btn.addEventListener("pointerdown", (e) => e.stopPropagation()));

  btnAlphabet.addEventListener("click", (e) => {
    e.stopPropagation();
    if (mode === "alphabet") return;
    mode = "alphabet";
    hardReset();
    render();
  });

  btnFox.addEventListener("click", (e) => {
    e.stopPropagation();
    if (mode === "fox") return;
    mode = "fox";
    hardReset();
    render();
  });

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    // Backspace: reset everything any time (timer -> 0, typed -> empty)
    if (e.key === "Backspace") {
      e.preventDefault();
      hardReset();
      return;
    }

    const raw = e.key;
    const norm = normalizedChar(raw);
    if (!norm && raw !== " ") return;

    e.preventDefault();

    if (isLocked()) return;

    if (phase === "idle" || phase === "success") {
      startRunIfNeeded(raw);
      return;
    }

    if (phase !== "running") return;

    const target = getTarget();
    const expected = target[typed.length] || "";
    if (!expected) return;

    const ok = expected === " " ? raw === " " : sameCharIgnoringCase(raw, expected);
    if (!ok) {
      beginError(raw);
      return;
    }

    typed += expected;
    render();

    if (typed.length === target.length) {
      const final = Date.now() - (startTs ?? Date.now());
      handleSuccess(final);
    }
  });

  // init
  render();
  app.focus();
})();