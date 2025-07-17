const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
ctx.translate(centerX, centerY);

let isPaused = false;
let angle = 0;
let pulse = 1;
let speed = 1;
let audioContext, audioSource, analyser, dataArray;
let mode = "wave";
let heartbeatOffset = 0;
let heartbeatData = [];

const colorBase = { h: 0, s: 1, v: 1 };

document.getElementById("modeSelect").addEventListener("change", (e) => {
  mode = e.target.value;
});

document.getElementById("speedSlider").addEventListener("input", (e) => {
  speed = parseFloat(e.target.value);
});

document.getElementById("toggleBtn").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("toggleBtn").textContent = isPaused ? "Play" : "Pause";
});

document.getElementById("audioFile").addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
});

function hsvToRgb(h, s, v) {
  let f = (n, k = (n + h * 6) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}

const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
ctx.translate(centerX, centerY);

let isPaused = false;
let angle = 0;
let pulse = 1;
let speed = 1;
let mode = "wave";
let heartbeatData = [];
let audioContext, audioSource, analyser, dataArray;

// UI Event Listeners
document.getElementById("modeSelect").addEventListener("change", e => {
  mode = e.target.value;
});

document.getElementById("speedSlider").addEventListener("input", e => {
  speed = parseFloat(e.target.value);
});

document.getElementById("toggleBtn").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("toggleBtn").textContent = isPaused ? "Play" : "Pause";
});

document.getElementById("audioFile").addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      loadAudioBuffer(e.target.result);
    };
    reader.readAsArrayBuffer(file);
  }
});

document.getElementById("playlist").addEventListener("change", function () {
  const selected = this.value;
  if (selected) {
    fetch(selected)
      .then(res => res.arrayBuffer())
      .then(loadAudioBuffer);
  }
});

function loadAudioBuffer(arrayBuffer) {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  audioContext.decodeAudioData(arrayBuffer, buffer => {
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
}

// Color Utility
function hsvToRgb(h, s, v) {
  let f = (n, k = (n + h * 6) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}

function getAudioPulse() {
  if (analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    return 1 + avg / 128;
  }
  return 1;
}

// --- Visual Modes ---
function drawWave() {
  ctx.beginPath();
  ctx.moveTo(-centerX, 0);

  if (analyser && dataArray) {
    analyser.getByteTimeDomainData(dataArray);
    for (let i = 0; i < dataArray.length; i++) {
      const x = (i / dataArray.length) * canvas.width - centerX;
      const y = ((dataArray[i] - 128) / 128) * 50 * pulse;
      ctx.lineTo(x, y);
    }
  } else {
    for (let x = -centerX; x < centerX; x++) {
      ctx.lineTo(x, Math.sin((x + angle * 100) / 50) * 20);
    }
  }

  const [r, g, b] = hsvToRgb((angle * 10) % 1, 1, 1);
  ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawCircleWeb() {
  const rings = 6;
  const lines = 5;
  const maxRadius = 200;

  for (let i = 1; i <= rings; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, (i / rings) * maxRadius * pulse, 0, Math.PI * 2);
    const [r, g, b] = hsvToRgb((angle + i / rings) % 1, 1, 1);
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.stroke();
  }

  for (let i = 0; i < lines; i++) {
    const theta = (i / lines) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(
      Math.cos(theta) * maxRadius * pulse,
      Math.sin(theta) * maxRadius * pulse
    );
    const [r, g, b] = hsvToRgb((angle + i / lines) % 1, 1, 1);
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.stroke();
  }
}

function drawHeartbeat() {
  if (analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const value = (avg - 100) * 1.8;
    heartbeatData.push(value);
  } else {
    heartbeatData.push(Math.sin(angle * 4) * 30);
  }

  if (heartbeatData.length > canvas.width) heartbeatData.shift();

  ctx.save();
  ctx.translate(-centerX, 0);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let i = 0; i < heartbeatData.length; i++) {
    ctx.lineTo(i, -heartbeatData[i]);
  }
  const [r, g, b] = hsvToRgb((angle * 2) % 1, 1, 1);
  ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// Main Loop
function drawVisualizer() {
  if (!isPaused) {
    ctx.clearRect(-centerX, -centerY, canvas.width, canvas.height);
    pulse = getAudioPulse();

    switch (mode) {
      case "wave":
        drawWave();
        break;
      case "circle":
        drawCircleWeb();
        break;
      case "heartbeat":
        drawHeartbeat();
        break;
    }

    angle += 0.002 * speed;
  }
  requestAnimationFrame(drawVisualizer);
}

drawVisualizer();
