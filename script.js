const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");

let audioContext, analyser, source, dataArray, bufferLength;
let currentAudio = null;
let isPaused = false;
let mode = "wave";
let speed = 1;
let sigmaActive = false;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Handle resizing
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Load Audio
function loadAudio(file) {
  if (currentAudio) {
    currentAudio.pause();
  }

  currentAudio = new Audio();
  currentAudio.src = URL.createObjectURL(file);
  currentAudio.crossOrigin = "anonymous";
  currentAudio.load();
  currentAudio.play();

  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  source = audioContext.createMediaElementSource(currentAudio);
  analyser = audioContext.createAnalyser();
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  analyser.fftSize = 256;

  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
}

// Draw Visuals
function draw() {
  requestAnimationFrame(draw);

  if (!analyser || isPaused) return;

  analyser.getByteFrequencyData(dataArray);
  const beatStrength = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

  // Apply Sigma Shake if active
  if (sigmaActive && beatStrength > 100) {
    document.body.classList.add("shake");
  } else {
    document.body.classList.remove("shake");
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  switch (mode) {
    case "wave":
      drawWave();
      break;
    case "circle":
      drawCircle();
      break;
    case "heartbeat":
      drawHeartbeat();
      break;
    case "galaxy":
      drawGalaxy();
      break;
  }
}

// --- MODE DRAWINGS ---

function drawWave() {
  ctx.beginPath();
  const sliceWidth = canvas.width / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const y = (dataArray[i] / 255) * canvas.height;
    ctx.lineTo(x, y);
    x += sliceWidth;
  }

  ctx.strokeStyle = "#0ff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawCircle() {
  const radius = Math.min(canvas.width, canvas.height) / 4;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  ctx.strokeStyle = "#ff0";
  ctx.lineWidth = 2;

  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + i * 20, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * radius * 1.5, centerY + Math.sin(angle) * radius * 1.5);
    ctx.stroke();
  }
}

function drawHeartbeat() {
  const midY = canvas.height / 2;
  const sliceWidth = canvas.width / bufferLength;

  ctx.beginPath();
  ctx.moveTo(0, midY);

  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const y = midY - (dataArray[i] / 255) * canvas.height * 0.4;
    ctx.lineTo(x, y);
    x += sliceWidth;
  }

  ctx.strokeStyle = "lime";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawGalaxy() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  for (let i = 0; i < 150; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * (canvas.width / 2);
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const alpha = Math.random();

    ctx.fillStyle = `rgba(${100 + Math.random() * 155}, ${100 + Math.random() * 155}, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const maxRadius = (dataArray[0] / 255) * canvas.width * 0.3 + 100;

  ctx.beginPath();
  ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 100, 255, 0.5)";
  ctx.lineWidth = 5;
  ctx.stroke();
}

// --- EVENT LISTENERS ---

document.getElementById("audioFile").addEventListener("change", (e) => {
  if (e.target.files[0]) {
    loadAudio(e.target.files[0]);
  }
});

document.getElementById("playlist").addEventListener("change", (e) => {
  const track = e.target.value;
  if (track) {
    loadAudio({ name: track, ...new File([], track) });
    currentAudio.src = track;
    currentAudio.play();
  }
});

document.getElementById("toggleBtn").addEventListener("click", () => {
  if (currentAudio) {
    isPaused = !isPaused;
    document.getElementById("toggleBtn").textContent = isPaused ? "Play" : "Pause";
    isPaused ? currentAudio.pause() : currentAudio.play();
  }
});

document.getElementById("modeSelect").addEventListener("change", (e) => {
  mode = e.target.value;
});

document.getElementById("speedSlider").addEventListener("input", (e) => {
  speed = parseFloat(e.target.value);
});

document.getElementById("sigmaBtn").addEventListener("click", () => {
  sigmaActive = true; // Not toggle, just ON forever
});

draw(); // Start animation loop
