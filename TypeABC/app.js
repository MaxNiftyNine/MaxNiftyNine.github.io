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

  /** state */
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

  // timing
  const lockMs = 1200;
  const deleteWindowSec = 0.6;

  // caret flash
  let caretOn = true;
  let caretTimer = null;

  // raf for timer
  let raf = null;

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
    // allow letters and space
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

  function setPhase(next) {
    phase = next;
    render();
  }

  function resetAll() {
    typed = "";
    startTs = null;
    endElapsed = 0;
    frozenElapsed = 0;
    errorIndex = null;
    errorChar = "";
    lockUntil = 0;
    resetting = false;
    setPhase("idle");
    stopTimerRAF();
    render();
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
    setPhase("running");
    startTimerRAF();
    render();
    return true;
  }

  function handleSuccess(finalMs) {
    endElapsed = finalMs;
    setPhase("success");
    saveBestIfNeeded(finalMs);
    stopTimerRAF();
    render();
  }

  function beginError(wrongRaw) {
    // freeze time
    frozenElapsed = startTs != null ? Date.now() - startTs : elapsedNow();

    errorIndex = typed.length;
    errorChar = wrongRaw;
    setPhase("error");

    lockUntil = Date.now() + lockMs;

    // schedule delete animation near end
    resetting = false;
    const deleteMs = Math.round(deleteWindowSec * 1000);

    setTimeout(() => {
      resetting = true;
      runDeleteAnimation();
      updateCaretOnly();
    }, Math.max(0, lockMs - deleteMs));

    setTimeout(() => {
      resetAll();
    }, lockMs);

    stopTimerRAF(); // timer stays frozen on fail
    render();
  }

  function runDeleteAnimation() {
    // Add .del one by one from end -> start across deleteWindowSec
    const spans = typedEl.querySelectorAll(".char");
    const total = spans.length;
    if (!total) return;

    const step = (deleteWindowSec * 1000) / total;

    for (let i = total - 1; i >= 0; i--) {
      const delay = (total - 1 - i) * step;
      setTimeout(() => {
        spans[i].classList.add("del");
      }, delay);
    }
  }

  function renderTimer() {
    timerEl.textContent = formatMs(elapsedNow());
  }

  function render() {
    // background
    app.classList.toggle("error", phase === "error");
    
    // best
    const b = bestMs();
    bestEl.textContent = b != null ? formatMs(b) : "—";

    // timer always visible
    renderTimer();

    // typed display letter spacing per mode
    typedEl.style.letterSpacing = mode === "alphabet" ? "0.08em" : "0.04em";

    // score
    if (phase === "success") {
      const bestStr = (bestMs() != null) ? formatMs(bestMs()) : "—";
      scoreEl.textContent = `TIME ${formatMs(endElapsed)}   •   BEST ${bestStr}`;
      scoreHintEl.textContent = `Type ${getTarget()[0]} to run again.`;
    } else {
      scoreEl.textContent = "";
      scoreHintEl.textContent = " ";
    }

    // render characters (for error, append wrong char)
    const renderLetters = (phase === "error") ? (typed + errorChar) : typed;

    typedEl.innerHTML = "";

    for (let i = 0; i < renderLetters.length; i++) {
      const c = renderLetters[i];
      const span = document.createElement("span");
      span.className = "char";
      const isWrong = phase === "error" && errorIndex === i;
      if (isWrong) span.classList.add("wrong");

      // display char:
      // - alphabet mode: uppercase
      // - spaces: show ·
      let out = c;
      if (c === " ") out = "·";
      else if (mode === "alphabet") out = c.toUpperCase();

      span.textContent = out;
      typedEl.appendChild(span);
    }

    // caret (single caret node)
    ensureCaretNode();
    updateCaretOnly();

    // mode buttons
    btnAlphabet.classList.toggle("active", mode === "alphabet");
    btnFox.classList.toggle("active", mode === "fox");

    // caret timer
    if (phase === "success") {
      stopCaret();
    } else {
      startCaret();
    }
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

    const deleting = resetting;
    caret.classList.toggle("deleting", deleting);

    if (phase === "success") {
      caret.style.display = "none";
    } else {
      caret.style.display = "inline-block";
    }
  }

  // Events
  app.addEventListener("pointerdown", () => {
    app.focus();
  });

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

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

    // append expected char (preserve target casing/spaces)
    typed += expected;
    render();

    if (typed.length === target.length) {
      const final = Date.now() - (startTs ?? Date.now());
      handleSuccess(final);
    }
  });

  // Mode buttons (stop propagation so app pointerdown doesn't interfere)
  btnAlphabet.addEventListener("pointerdown", (e) => e.stopPropagation());
  btnFox.addEventListener("pointerdown", (e) => e.stopPropagation());

  btnAlphabet.addEventListener("click", (e) => {
    e.stopPropagation();
    if (mode === "alphabet") return;
    mode = "alphabet";
    resetAll();
    render();
  });

  btnFox.addEventListener("click", (e) => {
    e.stopPropagation();
    if (mode === "fox") return;
    mode = "fox";
    resetAll();
    render();
  });

  // init
  render();
  app.focus();
})();
