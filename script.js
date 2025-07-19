// --- Initialization ---
const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");
let audioCtx, analyser, sourceNode;
let dataArray, freqArray;
let audio = new Audio();
let sigmaActive = false;
let currentMode = "wave";
let pulseSpeed = 1;
let lastBeat = 0;
let stars = [];
let galaxyDust = [];
let nebulaPulse = 0;
let audioReady = false;
let beatCooldown = 0;
let beatThreshold = 180;
let shakeFrame = 0;
let shakeIntensity = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = 400;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// --- Audio Setup ---
async function setupAudio(src) {
  if (audioCtx) audioCtx.close();
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  dataArray = new Uint8Array(analyser.fftSize);
  freqArray = new Uint8Array(analyser.frequencyBinCount);

  audio = new Audio();
  audio.src = src;
  audio.crossOrigin = "anonymous";
  await audio.play();

  sourceNode = audioCtx.createMediaElementSource(audio);
  sourceNode.connect(analyser);
  analyser.connect(audioCtx.destination);

  audioReady = true;
  requestAnimationFrame(draw);
}

// --- Beat Detection ---
function detectBeat() {
  analyser.getByteFrequencyData(freqArray);
  const bass = freqArray.slice(0, 30);
  const avg = bass.reduce((a, b) => a + b, 0) / bass.length;
  if (avg > beatThreshold && beatCooldown <= 0) {
    triggerBeat(avg);
    beatCooldown = 15;
  }
  beatCooldown--;
  beatThreshold = Math.max(170, avg * 0.9);
}

// --- Beat Effects ---
function triggerBeat(strength = 1) {
  nebulaPulse = 1;
  if (sigmaActive) {
    shakeFrame = Math.min(8, Math.floor(strength / 18));
    shakeIntensity = Math.min(25, strength / 4);
  }
}

// --- Main Drawing Loop ---
function draw() {
  if (!audioReady) return;
  if (sigmaActive && shakeFrame > 0) {
    const dx = (Math.random() - 0.5) * shakeIntensity;
    const dy = (Math.random() - 0.5) * shakeIntensity;
    ctx.setTransform(1, 0, 0, 1, dx, dy);
    shakeFrame--;
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  detectBeat();

  switch (currentMode) {
    case "wave": drawWave(); break;
    case "circle": drawCircle(); break;
    case "heartbeat": drawHeartbeat(); break;
    case "galaxy": drawGalaxy(); break;
  }

  if (sigmaActive) drawSigmaRing();
  requestAnimationFrame(draw);
}

// --- Wave Mode ---
function drawWave() {
  analyser.getByteTimeDomainData(dataArray);
  ctx.lineWidth = 2;
  ctx.strokeStyle = `hsl(${Date.now() % 360}, 100%, 60%)`;
  ctx.beginPath();
  const sliceWidth = canvas.width / dataArray.length;
  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] / 128.0;
    const y = canvas.height / 2 + (v - 1) * 40;
    const x = i * sliceWidth;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// --- Circle Mode (Spider Web) ---
function drawCircle() {
  analyser.getByteFrequencyData(freqArray);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  ctx.save();
  ctx.translate(centerX, centerY);
  const rings = 5;
  for (let r = 1; r <= rings; r++) {
    ctx.beginPath();
    for (let i = 0; i <= 360; i += 5) {
      const angle = i * Math.PI / 180;
      const freqIndex = Math.floor((i / 360) * freqArray.length);
      const offset = freqArray[freqIndex] * 0.3;
      const radius = r * 20 + offset;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `hsl(${r * 60 + Date.now() % 360}, 100%, 60%)`;
    ctx.stroke();
  }
  ctx.restore();
}

// --- Heartbeat Mode ---
function drawHeartbeat() {
  analyser.getByteTimeDomainData(dataArray);
  ctx.strokeStyle = `hsl(${Date.now() % 360}, 100%, 60%)`;
  ctx.lineWidth = 2;
  const mid = canvas.height / 2;
  const slice = canvas.width / dataArray.length;
  const scrollSpeed = 2;

  ctx.beginPath();
  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] / 128.0;
    const y = mid + (v - 1) * 60;
    const x = canvas.width - i * scrollSpeed;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// --- Galaxy Mode ---
function drawGalaxy() {
  if (stars.length < 100) {
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5,
        speed: Math.random() * 0.5 + 0.2
      });
    }
  }

  ctx.fillStyle = "rgba(5,5,20,0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let star of stars) {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffffaa";
    ctx.fill();
    star.y += star.speed;
    if (star.y > canvas.height) star.y = 0;
  }

  if (galaxyDust.length < 60) {
    for (let i = 0; i < 60; i++) {
      galaxyDust.push({
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * 150 + 100,
        speed: Math.random() * 0.01 + 0.001
      });
    }
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  galaxyDust.forEach((p, i) => {
    p.angle += p.speed;
    const x = Math.cos(p.angle) * p.distance;
    const y = Math.sin(p.angle) * p.distance;
    ctx.fillStyle = `hsla(${i * 6 + Date.now() % 360}, 100%, 50%, 0.5)`;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  if (nebulaPulse > 0.01) {
    ctx.beginPath();
    ctx.arc(0, 0, 80 + 50 * nebulaPulse, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 0, 255, ${nebulaPulse})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    nebulaPulse *= 0.85;
  }

  ctx.restore();
}

// --- Sigma Ring ---
function drawSigmaRing() {
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 100, 0, 0.7)";
  ctx.lineWidth = 4;
  const radius = 120 + Math.sin(Date.now() / 100) * 10;
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// --- Controls ---
document.getElementById("toggleBtn").addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    audioCtx.resume();
    document.getElementById("toggleBtn").innerText = "Pause";
  } else {
    audio.pause();
    document.getElementById("toggleBtn").innerText = "Play";
  }
});

document.getElementById("speedSlider").addEventListener("input", (e) => {
  pulseSpeed = parseFloat(e.target.value);
});

document.getElementById("modeSelect").addEventListener("change", (e) => {
  currentMode = e.target.value;
});

document.getElementById("sigmaBtn").addEventListener("click", () => {
  sigmaActive = !sigmaActive;
  document.getElementById("sigmaBtn").classList.toggle("active", sigmaActive);
});

document.getElementById("playlist").addEventListener("change", (e) => {
  const file = e.target.value;
  if (file) setupAudio(file);
});

document.getElementById("audioFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    setupAudio(url);
  }
});

window.addEventListener("load", () => {
  const initialTrack = document.getElementById("playlist").value;
  if (initialTrack) setupAudio(initialTrack);
});
