const notes = ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'];
const grid = document.querySelector("#grid");
const synth = new Tone.Synth().toDestination();
const bpmInput = document.querySelector("#bpm");
const playButton = document.querySelector("#play");
const stopButton = document.querySelector("#stop");

let sequence = new Array(16).fill('C5');

sequence.forEach((note, index) => {
    const noteCell = document.createElement("div");
    noteCell.classList.add("note-cell", note);
    noteCell.dataset.note = note;

    noteCell.addEventListener('mousewheel', function(event) {
        const noteIndex = (notes.indexOf(this.dataset.note) + (event.deltaY > 0 ? 1 : -1) + notes.length) % notes.length;
        this.dataset.note = notes[noteIndex];
        this.className = '';
        this.classList.add('note-cell', this.dataset.note);
    });

    noteCell.addEventListener("click", function() {
        this.classList.toggle("active");
    });

    grid.appendChild(noteCell);
});

let seq = null;

playButton.addEventListener("click", async () => {
    await Tone.start();  // Added line
    Tone.Transport.bpm.value = bpmInput.value;
    seq = new Tone.Sequence((time, col) => {
        if (grid.children[col].classList.contains('active')) {
            synth.triggerAttackRelease(grid.children[col].dataset.note, "8n", time);
        }
    }, [...Array(16).keys()], "16n").start(0);

    Tone.Transport.start();
});

stopButton.addEventListener("click", () => {
    Tone.Transport.stop();
    if (seq) {
        seq.dispose();
        seq = null;
    }
});
