const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

let isPaused = false;
let angle = 0;
let pulse = 0;
let speed = 1;
let currentMode = "wave";
let audioContext, audioSource, analyser, dataArray;

function hsvToRgb(h, s, v) {
  let f = (n, k = (n + h * 6) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}

// ---------- Drawing Modes ---------- //
function drawWave() {
  const layers = 10;
  const spokes = 36;
  const maxRadius = 300;

  for (let layer = 0; layer < layers; layer++) {
    let radius = (layer / layers) * maxRadius * pulse;
    ctx.beginPath();
    for (let i = 0; i <= spokes; i++) {
      let theta = (i / spokes) * 2 * Math.PI;
      let x = radius * Math.cos(theta);
      let y = radius * Math.sin(theta);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    let h = (layer / layers + angle) % 1;
    let [r, g, b] = hsvToRgb(h, 1, 1);
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.stroke();
  }
}

function drawCircle() {
  let radius = 150 * pulse;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = `hsl(${angle * 360}, 100%, 50%)`;
  ctx.stroke();
}

function drawHeartbeat() {
  const scrollWidth = 2;
  const height = canvas.height;

  const imageData = ctx.getImageData(scrollWidth, 0, canvas.width - scrollWidth, height);
  ctx.putImageData(imageData, 0, 0);
  ctx.clearRect(canvas.width - scrollWidth, 0, scrollWidth, height);

  let y = height / 2;
  if (analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    if (avg > 180) y -= 40;        // strong beat
    else if (avg > 100) y += 30;   // lower dip
  }

  ctx.fillStyle = "lime";
  ctx.shadowColor = "lime";
  ctx.shadowBlur = 10;
  ctx.fillRect(canvas.width - scrollWidth, y, scrollWidth, 2);
  ctx.shadowBlur = 0; // reset
}

function drawVisualizer() {
  if (!isPaused) {
    if (currentMode !== "heartbeat") {
      ctx.clearRect(-centerX, -centerY, canvas.width, canvas.height);
    }

    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      pulse = 1 + average / 128;
    }

    ctx.save();
    ctx.translate(centerX, centerY);

    switch (currentMode) {
      case "wave":
        drawWave();
        break;
      case "circle":
        drawCircle();
        break;
      case "heartbeat":
        drawHeartbeat();
        break;
    }

    ctx.restore();
    angle += 0.002 * speed;
  }

  requestAnimationFrame(drawVisualizer);
}

// ---------- Controls & Events ---------- //
document.getElementById("toggleBtn").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("toggleBtn").textContent = isPaused ? "Play" : "Pause";
});

document.getElementById("speedSlider").addEventListener("input", (e) => {
  speed = parseFloat(e.target.value);
});

document.getElementById("modeSelect").addEventListener("change", (e) => {
  currentMode = e.target.value;
  if (currentMode !== "heartbeat") {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear full
  }
});

document.getElementById("audioFile").addEventListener("change", function () {
  const file = this.files[0];
  if (file) loadAudio(file);
});

function loadAudio(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    if (!audioContext)
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContext.decodeAudioData(e.target.result, function (buffer) {
      if (audioSource) audioSource.stop();
      audioSource = audioContext.createBufferSource();
      analyser = audioContext.createAnalyser();
      audioSource.buffer = buffer;
      audioSource.connect(analyser);
      analyser.connect(audioContext.destination);
      analyser.fftSize = 256;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      audioSource.start();
    });
  };
  reader.readAsArrayBuffer(file);
}

// ---------- Drag & Drop Upload ---------- //
canvas.addEventListener("dragover", (e) => {
  e.preventDefault();
  canvas.style.border = "2px dashed #0ff";
});
canvas.addEventListener("dragleave", () => {
  canvas.style.border = "none";
});
canvas.addEventListener("drop", (e) => {
  e.preventDefault();
  canvas.style.border = "none";
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("audio")) {
    loadAudio(file);
  }
});

// ---------- Init ---------- //
ctx.lineWidth = 1;
drawVisualizer();
