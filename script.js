// --- Initialization ---
const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");
let audioCtx, analyser, sourceNode, audioBufferSource;
let dataArray, freqArray;
let audio = new Audio();
let sigmaActive = false;
let currentMode = "wave";
let pulseSpeed = 1;
let lastBeat = 0;
let stars = [];
let galaxyDust = [];
let nebulaPulse = 0;
let sigmaShake = 0;
let audioReady = false;

// Resize Canvas for Mobile/Desktop
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
  const bass = freqArray.slice(0, 30); // bass = low freq
  const avg = bass.reduce((a, b) => a + b, 0) / bass.length;

  const now = performance.now();
  if (avg > 180 && now - lastBeat > (200 / pulseSpeed)) {
    lastBeat = now;
    triggerBeat();
  }
}

// --- Beat Triggered Visual Effects ---
function triggerBeat() {
  nebulaPulse = 1;
  if (sigmaActive) {
    sigmaShake = 8;
  }
}

// --- Sigma Mode Animation ---
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

// --- Main Drawing Loop ---
function draw() {
  if (!audioReady) return;

  // Shake effect for Sigma Mode
  if (sigmaShake > 0) {
    const dx = (Math.random() - 0.5) * sigmaShake;
    const dy = (Math.random() - 0.5) * sigmaShake;
    ctx.setTransform(1, 0, 0, 1, dx, dy);
    sigmaShake *= 0.9;
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
  ctx.strokeStyle = "#00f6ff";
  ctx.beginPath();
  const sliceWidth = canvas.width / dataArray.length;

  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] / 128.0;
    const y = v * canvas.height / 2;
    const x = i * sliceWidth;

    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }

  ctx.stroke();
}

// --- Circle Mode ---
function drawCircle() {
  analyser.getByteFrequencyData(freqArray);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 80;
  ctx.save();
  ctx.translate(centerX, centerY);

  for (let i = 0; i < freqArray.length; i += 10) {
    const value = freqArray[i];
    const angle = (i / freqArray.length) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const length = value / 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x * length / 40, y * length / 40);
    ctx.strokeStyle = `hsl(${i + value}, 100%, 60%)`;
    ctx.stroke();
  }

  ctx.restore();
}

// --- Heartbeat Mode ---
function drawHeartbeat() {
  analyser.getByteTimeDomainData(dataArray);
  ctx.strokeStyle = "#00ff66";
  ctx.lineWidth = 2;
  ctx.beginPath();
  const mid = canvas.height / 2;
  const slice = canvas.width / dataArray.length;

  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] / 128.0;
    const y = mid + (v - 1) * 50;
    const x = i * slice;
    ctx.lineTo(x, y);
  }

  ctx.stroke();
}

// --- Galaxy Mode ---
function drawGalaxy() {
  // Background stars
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

  // Space dust
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
    ctx.fillStyle = `hsla(${i * 6}, 100%, 60%, 0.5)`;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Nebula Pulse
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

// Controls
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

document.getElementById("debugPlay").addEventListener("click", () => {
  if (audio && audio.paused) audio.play();
});

window.addEventListener("load", () => {
  const initialTrack = document.getElementById("playlist").value;
  if (initialTrack) setupAudio(initialTrack);
});
