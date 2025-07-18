const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const toggleBtn = document.getElementById("toggleBtn");
const modeSelect = document.getElementById("modeSelect");
const speedSlider = document.getElementById("speedSlider");
const playlist = document.getElementById("playlist");
const audioFileInput = document.getElementById("audioFile");
const sigmaBtn = document.getElementById("sigmaBtn");

let audioCtx, analyser, sourceNode, currentAudio;
let dataArray, bufferLength;
let isPaused = false;
let mode = "wave";
let speed = parseFloat(speedSlider.value);
let sigmaActivated = false;

toggleBtn.addEventListener("click", () => {
  if (!currentAudio) return;
  isPaused = !isPaused;
  toggleBtn.textContent = isPaused ? "Play" : "Pause";
  isPaused ? currentAudio.pause() : currentAudio.play();
});

modeSelect.addEventListener("change", (e) => {
  mode = e.target.value;
  sigmaActivated = false;
  document.body.classList.remove("shake");
});

speedSlider.addEventListener("input", (e) => {
  speed = parseFloat(e.target.value);
});

playlist.addEventListener("change", (e) => {
  if (e.target.value) {
    loadAudio(e.target.value);
  }
});

audioFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    loadAudio(url);
  }
});

sigmaBtn.addEventListener("click", () => {
  mode = "sigma";
  sigmaActivated = true;
  modeSelect.value = ""; // Clear dropdown
});

function loadAudio(src) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  currentAudio = new Audio(src);
  currentAudio.crossOrigin = "anonymous";

  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (analyser) analyser.disconnect();

  sourceNode = audioCtx.createMediaElementSource(currentAudio);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  sourceNode.connect(analyser);
  analyser.connect(audioCtx.destination);

  currentAudio.play();
  isPaused = false;
  toggleBtn.textContent = "Pause";
}

function draw() {
  requestAnimationFrame(draw);
  if (!analyser || isPaused) return;

  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 150;
  const beat = dataArray.reduce((a, b) => a + b) / bufferLength;

  // ====== Modes =======
  switch (mode) {
    case "wave":
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0ff";
      for (let i = 0; i < bufferLength; i++) {
        const x = (i / bufferLength) * canvas.width;
        const y = centerY + Math.sin(i * 0.1 + performance.now() / 200) * dataArray[i] * 0.3;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      break;

    case "circle":
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + i * 0.1})`;
        ctx.lineWidth = 1 + i;
        ctx.arc(centerX, centerY, radius + i * 20 + beat * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        const angle = (i / 5) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * (radius + beat * 0.5);
        const y = centerY + Math.sin(angle) * (radius + beat * 0.5);
        ctx.lineTo(x, y);
        ctx.strokeStyle = "#0ff";
        ctx.stroke();
      }
      break;

    case "heartbeat":
      ctx.beginPath();
      ctx.strokeStyle = `hsl(${beat * 2}, 100%, 50%)`;
      ctx.lineWidth = 3;
      let prevX = 0;
      for (let x = 0; x < canvas.width; x += 5) {
        const y = centerY + Math.sin((x + performance.now() / 10) * 0.02) * (beat * 0.3);
        ctx.lineTo(x, y);
        prevX = x;
      }
      ctx.stroke();
      break;

    case "galaxy":
      ctx.fillStyle = `rgba(0,0,30,0.1)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 100; i++) {
        const angle = (i / 100) * Math.PI * 2 + performance.now() / 2000;
        const dist = radius + Math.sin(i + performance.now() / 500) * 50;
        const x = centerX + Math.cos(angle) * dist;
        const y = centerY + Math.sin(angle) * dist;

        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 2 + 1, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${i * 3}, 100%, 70%, 0.7)`;
        ctx.fill();
      }

      // Nebula pulse
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + beat * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${beat * 2}, 100%, 60%, 0.3)`;
      ctx.lineWidth = 8;
      ctx.stroke();
      break;

    case "sigma":
      // Sigma mode visuals
      ctx.fillStyle = `rgba(255, 0, 0, ${0.05 + Math.random() * 0.05})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + beat, 0, Math.PI * 2);
      ctx.strokeStyle = `hsl(${beat * 3}, 100%, 50%)`;
      ctx.lineWidth = 10;
      ctx.stroke();

      ctx.font = "bold 60px sans-serif";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText("SIGMA MODE", centerX, centerY);

      // Screen shake sync with beat
      if (beat > 150) {
        if (!document.body.classList.contains("shake")) {
          document.body.classList.add("shake");
        }
      } else {
        document.body.classList.remove("shake");
      }
      break;
  }
}

draw();
