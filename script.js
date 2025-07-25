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


let heartbeatData = new Array(500).fill(canvas.height / 2); // ECG trail buffer

// --- Helper Functions ---
function getAverageVolume(array) {
  let sum = 0;
  for (let i = 0; i < array.length; i++) {
    sum += array[i];
  }
  return sum / array.length;
}

function getBeatStrength() {
  analyser.getByteFrequencyData(freqArray);
  return getAverageVolume(freqArray);
}

// --- 1. Wave Mode ---
function drawWave() {
  analyser.getByteTimeDomainData(dataArray);
  const beat = getBeatStrength();
  const hue = (beat * 4 + Date.now() / 50) % 360;

  ctx.lineWidth = 2;
  ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;

  ctx.beginPath();
  const sliceWidth = canvas.width / dataArray.length;
  let x = 0;

  for (let i = 0; i < dataArray.length; i += 2) {
    const v = dataArray[i] / 128.0;
    const y = canvas.height / 2 + (v - 1) * 40 * (beat / 50);
    ctx.lineTo(x, y);
    x += sliceWidth * 2;
  }

  ctx.stroke();
}

// --- 2. Circle Mode (Spider Web) ---
function drawCircle() {
  analyser.getByteFrequencyData(freqArray);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = Math.min(centerX, centerY) - 20;

  const rings = 6;      // Number of circular layers
  const spokes = 12;    // Number of radial lines
  const beat = getBeatStrength();
  const hue = (beat * 3 + Date.now() / 40) % 360;

  ctx.save();
  ctx.translate(centerX, centerY);

  // Draw curly spiderweb rings
  for (let r = 1; r <= rings; r++) {
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.1) {
      const pulse = Math.sin(a * 6 + Date.now() / 300) * (2 + beat / 30);
      const radius = (r / rings) * maxRadius + pulse;
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `hsl(${hue + r * 30}, 100%, 60%)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Draw radial lines (spokes)
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * Math.PI * 2;
    const x = Math.cos(angle) * maxRadius;
    const y = Math.sin(angle) * maxRadius;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x, y);
    ctx.strokeStyle = `hsl(${hue + i * 20}, 100%, 50%)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}
    
    
// --- 3. Heartbeat Mode (Always centered, scrolls left) ---
function drawHeartbeat() {
  analyser.getByteFrequencyData(freqArray);
  const beat = getBeatStrength();
  const midY = canvas.height / 2;
  const centerX = canvas.width / 2;
  const hue = (beat * 5 + Date.now() / 50) % 360;

  let newY = midY;

  if (beat > 120) {
    newY = midY - (Math.random() * 30 + 20); // spike
  } else if (beat > 90) {
    newY = midY - (Math.random() * 8 + 4);   // flutter
  } else {
    newY = midY + Math.sin(Date.now() / 100) * 2; // idle baseline
  }

  // Push new point at the END (latest)
  heartbeatData.push(newY);
  if (heartbeatData.length > canvas.width) {
    heartbeatData.shift();
  }

  // Clear screen
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw waveform so that the latest beat is at center of screen
  ctx.beginPath();
  for (let i = 0; i < heartbeatData.length; i++) {
    const y = heartbeatData[i];
    const x = centerX - (heartbeatData.length - 1 - i);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
  ctx.lineWidth = 2;
  ctx.stroke();
}


// --- 4. Galaxy Mode (Realistic, Beat Synced) ---
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

  ctx.fillStyle = "rgba(5,5,20,0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let star of stars) {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffffcc";
    ctx.fill();
    star.y += star.speed;
    if (star.y > canvas.height) star.y = 0;
  }

  const beat = getBeatStrength();
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const hue = (beat * 2 + Date.now() / 50) % 360;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(Date.now() / 5000);

  for (let i = 0; i < 200; i++) {
    const angle = i * 0.1;
    const radius = i * 0.5 + Math.sin(beat / 10) * 10;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
    ctx.fillStyle = `hsl(${hue + i}, 100%, 70%)`;
    ctx.fill();
  }

  ctx.restore();
               }


// --- Sigma Ring ---
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

// --- Master Draw Function ---
function draw() {
  if (!audioReady) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  detectBeat();

  // Apply Sigma screen shake (always save context if sigma is active)
  if (sigmaActive) {
    if (shakeFrame > 0) {
      const dx = Math.random() * shakeIntensity - shakeIntensity / 2;
      const dy = Math.random() * shakeIntensity - shakeIntensity / 2;
      ctx.save();
      ctx.translate(dx, dy);
      shakeFrame--;
    } else {
      ctx.save(); // No shake offset, just prepare to restore later
    }
  }

  // Draw mode visuals
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
    case "galaxy":
      drawGalaxy();
      break;
  }

  // Draw Sigma ring after base visuals
  if (sigmaActive) {
    drawSigmaRing();
    ctx.restore(); // Restore after all Sigma visuals are drawn
  }

  requestAnimationFrame(draw);
}
