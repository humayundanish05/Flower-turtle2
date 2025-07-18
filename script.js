const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let audioContext, analyser, source, dataArray, bufferLength, currentAudio;
let isPaused = false;
let mode = "wave";
let speed = 1;
let sigmaMode = false;

const sigmaBtn = document.getElementById("sigmaBtn");

document.getElementById("toggleBtn").addEventListener("click", togglePlayPause);
document.getElementById("modeSelect").addEventListener("change", (e) => {
  mode = e.target.value;
  sigmaMode = false;
  document.body.classList.remove("shake");
});
document.getElementById("speedSlider").addEventListener("input", (e) => {
  speed = parseFloat(e.target.value);
});
document.getElementById("playlist").addEventListener("change", (e) => {
  if (e.target.value) loadAudio(e.target.value);
});
document.getElementById("audioFile").addEventListener("change", (e) => {
  if (e.target.files[0]) loadAudio(URL.createObjectURL(e.target.files[0]));
});
sigmaBtn.addEventListener("click", () => {
  mode = "sigma";
  sigmaMode = true;
});

function togglePlayPause() {
  if (!currentAudio) return;
  isPaused = !isPaused;
  document.getElementById("toggleBtn").textContent = isPaused ? "Play" : "Pause";
  isPaused ? currentAudio.pause() : currentAudio.play();
}

function loadAudio(src) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  currentAudio = new Audio(src);
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  source = audioContext.createMediaElementSource(currentAudio);
  analyser = audioContext.createAnalyser();
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  analyser.fftSize = 256;

  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  currentAudio.play();
  animate();
}

function animate() {
  requestAnimationFrame(animate);

  if (!analyser || isPaused) return;

  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const avg =
    dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;

  if (sigmaMode && avg > 100) {
    document.body.classList.add("shake");
    setTimeout(() => document.body.classList.remove("shake"), 80);
  }

  switch (mode) {
    case "wave":
      drawWave();
      break;
    case "circle":
      drawCircleWeb();
      break;
    case "heartbeat":
      drawHeartbeat(avg);
      break;
    case "galaxy":
      drawGalaxy(avg);
      break;
    case "sigma":
      drawSigma(avg);
      break;
  }
}

// ======== MODES ==========

function drawWave() {
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  for (let i = 0; i < bufferLength; i++) {
    const x = (i / bufferLength) * canvas.width;
    const y = canvas.height / 2 + (dataArray[i] - 128) * speed * 0.6;
    ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawCircleWeb() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = Math.min(canvas.width, canvas.height) / 3;

  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,255,255,${0.15 * i})`;
    ctx.stroke();
  }

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const x = centerX + maxRadius * Math.cos(angle);
    const y = centerY + maxRadius * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "rgba(0,255,255,0.3)";
    ctx.stroke();
  }
}

function drawHeartbeat(avg) {
  const centerY = canvas.height / 2;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const height = (dataArray[i] / 255) * 80;
    x += canvas.width / bufferLength;
    const y = i % 10 === 0 ? centerY - height * speed : centerY;
    ctx.lineTo(x, y);
  }

  ctx.strokeStyle = `hsl(${avg + 200}, 100%, 60%)`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawGalaxy(avg) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * (avg * 2);
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 3 + 1, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${(i * 10 + avg) % 360}, 100%, 70%)`;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(centerX, centerY, avg * 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = `hsl(${avg * 2}, 100%, 60%)`;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawSigma(avg) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  for (let i = 0; i < 100; i++) {
    const angle = (i / 100) * Math.PI * 2;
    const radius = avg + Math.sin(angle * 6 + performance.now() / 100) * 20;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${(avg * 3 + i * 4) % 360}, 100%, 60%)`;
    ctx.fill();
  }

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(performance.now() / 500);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    ctx.lineTo(Math.cos(i) * (avg * 1.5), Math.sin(i) * (avg * 1.5));
  }
  ctx.closePath();
  ctx.strokeStyle = `hsl(${avg * 5}, 100%, 70%)`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}
