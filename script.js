// Ensure canvas is set up
const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
ctx.translate(centerX, centerY);

// Base variables
let isPaused = false;
let angle = 0;
let pulse = 1;
let speed = 1;
let mode = "wave";
let audioContext, analyser, dataArray, audioSource = null, currentAudio = null;
let heartbeatData = [], stars = [], dust = [], nebula = [];

// Init Galaxy BG
function initGalaxy() {
  stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width - centerX,
    y: Math.random() * canvas.height - centerY,
    r: Math.random() * 1.5 + 0.5,
    brightness: Math.random()
  }));
  dust = Array.from({ length: 50 }, () => ({
    x: Math.random() * canvas.width - centerX,
    y: Math.random() * canvas.height - centerY,
    r: Math.random() * 2 + 1,
    angle: Math.random() * Math.PI * 2,
    speed: 0.001 + Math.random() * 0.003
  }));
  nebula = Array.from({ length: 3 }, () => ({
    radius: 100 + Math.random() * 100,
    angleOffset: Math.random() * Math.PI * 2,
    color: `hsla(${Math.random() * 360}, 100%, 60%, 0.3)`
  }));
}
initGalaxy();

// Controls
document.getElementById("modeSelect").addEventListener("change", e => mode = e.target.value);
document.getElementById("speedSlider").addEventListener("input", e => speed = parseFloat(e.target.value));
document.getElementById("toggleBtn").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("toggleBtn").textContent = isPaused ? "Play" : "Pause";
  if (currentAudio) isPaused ? currentAudio.pause() : currentAudio.play();
});

// Audio setup
document.getElementById("playlist").addEventListener("change", function () {
  const file = this.value;
  if (!file) return;
  if (currentAudio) currentAudio.remove();
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audio = new Audio(file);
  audio.crossOrigin = "anonymous";
  audio.loop = true;
  document.body.appendChild(audio);
  const source = audioContext.createMediaElementSource(audio);
  analyser = audioContext.createAnalyser();
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  audio.play();
  currentAudio = audio;
});

document.getElementById("audioFile").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;
  if (currentAudio) currentAudio.remove();
  const reader = new FileReader();
  reader.onload = e => {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContext.decodeAudioData(e.target.result, buffer => {
      if (audioSource) audioSource.stop();
      audioSource = audioContext.createBufferSource();
      analyser = audioContext.createAnalyser();
      audioSource.buffer = buffer;
      audioSource.connect(analyser);
      analyser.connect(audioContext.destination);
      analyser.fftSize = 256;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      audioSource.start(0);
    });
  };
  reader.readAsArrayBuffer(file);
});

function hsvToRgb(h, s, v) {
  let f = (n, k = (n + h * 6) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}

function getAudioPulse() {
  if (analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);
    return 1 + (dataArray.reduce((a, b) => a + b, 0) / dataArray.length) / 128;
  }
  return 1;
}

// Visualizers
function drawWave() {
  ctx.beginPath();
  ctx.moveTo(-centerX, 0);
  if (analyser && dataArray) {
    analyser.getByteTimeDomainData(dataArray);
    for (let i = 0; i < dataArray.length; i++) {
      const x = (i / dataArray.length) * canvas.width - centerX;
      const y = ((dataArray[i] - 128) / 128) * (pulse * 30);
      ctx.lineTo(x, y);
    }
  }
  const [r, g, b] = hsvToRgb((angle * 10) % 1, 1, 1);
  ctx.strokeStyle = `rgb(${r},${g},${b})`;
  ctx.stroke();
}

function drawCircleWeb() {
  const rings = 6, lines = 5, maxRadius = 200;
  for (let i = 1; i <= rings; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, (i / rings) * maxRadius * pulse, 0, Math.PI * 2);
    const [r, g, b] = hsvToRgb((angle + i / rings) % 1, 1, 1);
    ctx.strokeStyle = `rgb(${r},${g},${b})`;
    ctx.stroke();
  }
  for (let i = 0; i < lines; i++) {
    const theta = (i / lines) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(theta) * maxRadius * pulse, Math.sin(theta) * maxRadius * pulse);
    const [r, g, b] = hsvToRgb((angle + i / lines) % 1, 1, 1);
    ctx.strokeStyle = `rgb(${r},${g},${b})`;
    ctx.stroke();
  }
}

function drawHeartbeat() {
  if (analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const beatValue = (avg - 100) * 2.5;
    heartbeatData.push(beatValue);
  } else {
    heartbeatData.push(Math.sin(angle * 5) * 50);
  }

  const spacing = 2.5;
  const maxPoints = canvas.width / spacing;
  if (heartbeatData.length > maxPoints) heartbeatData.shift();

  ctx.save();
  ctx.translate(-centerX, 0);
  ctx.lineWidth = 2.8;

  for (let i = 0; i < heartbeatData.length - 1; i++) {
    const y1 = -heartbeatData[i], y2 = -heartbeatData[i + 1];
    const intensity = Math.abs(y2);
    let color = intensity > 70 ? "red" : intensity > 40 ? "yellow" : "lime";
    const x1 = i * spacing, x2 = (i + 1) * spacing;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawGalaxyBackground() {
  for (let s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.brightness})`;
    ctx.fill();
  }
  for (let d of dust) {
    d.angle += d.speed;
    const dx = Math.cos(d.angle) * d.r * 10;
    const dy = Math.sin(d.angle) * d.r * 10;
    ctx.beginPath();
    ctx.arc(d.x + dx, d.y + dy, 1, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(200,200,255,0.2)";
    ctx.fill();
  }
  for (let n of nebula) {
    ctx.beginPath();
    let radius = n.radius * pulse * 0.5;
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = n.color;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
}

// 🔥 SIGMA MODE 🔥
function drawSigma() {
  drawGalaxyBackground();
  drawWave();
  // Add future fire/spark effects here
}

// Keyboard Shortcuts
document.addEventListener("keydown", (e) => {
  switch (e.code) {
    case "Space":
      e.preventDefault();
      isPaused = !isPaused;
      document.getElementById("toggleBtn").textContent = isPaused ? "Play" : "Pause";
      if (currentAudio) isPaused ? currentAudio.pause() : currentAudio.play();
      break;
    case "Digit1": mode = "wave"; break;
    case "Digit2": mode = "circle"; break;
    case "Digit3": mode = "heartbeat"; break;
    case "Digit4": mode = "galaxy"; break;
    case "KeyX": mode = "sigma"; break; // Secret Sigma mode
    case "ArrowUp": speed = Math.min(speed + 0.1, 5); break;
    case "ArrowDown": speed = Math.max(speed - 0.1, 0.5); break;
  }
  document.getElementById("modeSelect").value = mode;
  document.getElementById("speedSlider").value = speed;
});

// Render loop
function drawVisualizer() {
  if (!isPaused) {
    ctx.clearRect(-centerX, -centerY, canvas.width, canvas.height);
    pulse = getAudioPulse();

    switch (mode) {
      case "wave": drawWave(); break;
      case "circle": drawCircleWeb(); break;
      case "heartbeat": drawHeartbeat(); break;
      case "galaxy": drawGalaxyBackground(); break;
      case "sigma": drawSigma(); break;
    }

    angle += 0.002 * speed;
  }
  requestAnimationFrame(drawVisualizer);
}

ctx.lineWidth = 1;
drawVisualizer();
