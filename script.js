const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
ctx.translate(centerX, centerY);

let isPaused = false;
let angle = 0;
let pulse = 1;
let speed = 1;
let audioContext, analyser, dataArray;
let audioSource = null;
let currentAudio = null;
let mode = "wave";
let heartbeatData = [];

// Galaxy mode variables
let stars = [], dust = [], nebula = [];

function initGalaxy() {
  stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width - centerX,
    y: Math.random() * canvas.height - centerY,
    r: Math.random() * 1.5 + 0.5,
    brightness: Math.random(),
  }));

  dust = Array.from({ length: 50 }, () => ({
    x: Math.random() * canvas.width - centerX,
    y: Math.random() * canvas.height - centerY,
    r: Math.random() * 2 + 1,
    angle: Math.random() * Math.PI * 2,
    speed: 0.001 + Math.random() * 0.003,
  }));

  nebula = Array.from({ length: 3 }, () => ({
    radius: 100 + Math.random() * 100,
    angleOffset: Math.random() * Math.PI * 2,
    color: `hsla(${Math.random() * 360}, 100%, 60%, 0.3)`
  }));
}

initGalaxy();

document.getElementById("modeSelect").addEventListener("change", (e) => {
  mode = e.target.value;
});

document.getElementById("speedSlider").addEventListener("input", (e) => {
  speed = parseFloat(e.target.value);
});

document.getElementById("toggleBtn").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("toggleBtn").textContent = isPaused ? "Play" : "Pause";
  if (currentAudio) {
    isPaused ? currentAudio.pause() : currentAudio.play();
  }
});

document.getElementById("playlist").addEventListener("change", function () {
  const file = this.value;
  if (!file) return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.remove();
    currentAudio = null;
  }

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

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.remove();
    currentAudio = null;
  }

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
      audioSource.start(0);
    });
  };
  reader.readAsArrayBuffer(file);
});

function hsvToRgb(h, s, v) {
  let f = (n, k = (n + h * 6) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}

function getAudioPulse() {
  if (analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);
    let avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    return 1 + avg / 128;
  }
  return 1;
}

function drawWave() {
  ctx.beginPath();
  ctx.moveTo(-centerX, 0);
  if (analyser && dataArray) {
    analyser.getByteTimeDomainData(dataArray);
    for (let i = 0; i < dataArray.length; i++) {
      let x = (i / dataArray.length) * canvas.width - centerX;
      let y = ((dataArray[i] - 128) / 128) * (pulse * 30);
      ctx.lineTo(x, y);
    }
  }
  const [r, g, b] = hsvToRgb((angle * 10) % 1, 1, 1);
  ctx.strokeStyle = `rgb(${r},${g},${b})`;
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

function drawGalaxyBackground() {
  for (let s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${s.brightness})`;
    ctx.fill();
  }

  for (let d of dust) {
    d.angle += d.speed;
    let dx = Math.cos(d.angle) * d.r * 10;
    let dy = Math.sin(d.angle) * d.r * 10;
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

function drawHeartbeat() {
  if (analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const beatValue = (avg - 100) * 2.5;
    heartbeatData.push(beatValue);
  } else {
    heartbeatData.push(Math.sin(angle * 5) * 50);
  }

  const spacing = 3;
  const maxPoints = canvas.width / spacing;
  if (heartbeatData.length > maxPoints) heartbeatData.shift();

  ctx.save();
  ctx.translate(-centerX, 0);

  for (let i = 0; i < heartbeatData.length - 1; i++) {
    const y1 = -heartbeatData[i];
    const y2 = -heartbeatData[i + 1];
    const intensity = Math.abs(y2);
    let color, glow, thickness;

    if (intensity > 75) {
      color = "#ff3300";
      glow = "#ff9900";
      thickness = 6;
    } else if (intensity > 50) {
      color = "#ffff00";
      glow = "#ffaa00";
      thickness = 4;
    } else {
      color = "#00ff00";
      glow = "#00ff88";
      thickness = 2;
    }

    const x1 = i * spacing;
    const x2 = (i + 1) * spacing;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 20;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    if (intensity > 80 && i % 5 === 0) {
      ctx.beginPath();
      ctx.arc(x2, y2, 3 + Math.random() * 2, 0, 2 * Math.PI);
      ctx.fillStyle = glow;
      ctx.shadowBlur = 30;
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawVisualizer() {
  if (!isPaused) {
    ctx.clearRect(-centerX, -centerY, canvas.width, canvas.height);
    pulse = getAudioPulse();

    if (mode === "galaxy") drawGalaxyBackground();

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

ctx.lineWidth = 1;
drawVisualizer();
