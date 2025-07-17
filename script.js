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

// 🌈 HSV to RGB
function hsvToRgb(h, s, v) {
  let f = (n, k = (n + h * 6) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}

// 🎵 Audio load
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

// 🎛 Controls
document.getElementById("toggleBtn").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("toggleBtn").textContent = isPaused ? "Play" : "Pause";
});

document.getElementById("speedSlider").addEventListener("input", (e) => {
  speed = parseFloat(e.target.value);
});

document.getElementById("modeSelect").addEventListener("change", (e) => {
  currentMode = e.target.value;
  ctx.clearRect(0, 0, canvas.width, canvas.height); // clear for mode switch
});

// 🎨 Drawing loop
function drawVisualizer() {
  if (!isPaused) {
    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      let average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      pulse = 1 + average / 128;
    }

    if (currentMode === "wave") {
      drawWaveform();
    } else if (currentMode === "circle") {
      drawCircle();
    } else if (currentMode === "flower") {
      drawFlower();
    } else if (currentMode === "heartbeat") {
      drawHeartbeat();
    }

    angle += 0.001 * speed;
  }

  requestAnimationFrame(drawVisualizer);
}

// 📈 Waveform Mode
function drawWaveform() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#0ff";

  for (let i = 0; i < dataArray.length; i++) {
    let x = (i / dataArray.length) * canvas.width;
    let y = canvas.height / 2 + (dataArray[i] - 128) * 1;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.stroke();
}

// 🌀 Circle Mode
function drawCircle() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(centerX, centerY);

  const layers = 10;
  const spokes = 36;
  const maxRadius = 200;

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

  ctx.restore();
}

// 🌸 Flower Mode
function drawFlower() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(centerX, centerY);

  ctx.lineWidth = 1.5;
  const petals = 36;
  const radius = 180;

  for (let i = 0; i < petals; i++) {
    let theta = (i / petals) * 2 * Math.PI;
    let x = radius * Math.cos(theta) * Math.sin(angle * 3 + i);
    let y = radius * Math.sin(theta) * Math.sin(angle * 3 + i);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    let h = (i / petals + angle) % 1;
    let [r, g, b] = hsvToRgb(h, 1, 1);
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.lineTo(x * pulse, y * pulse);
    ctx.stroke();
  }

  ctx.restore();
}

// 🫀 Heartbeat Mode (Hospital ECG-style)
let beatY = canvas.height / 2;
function drawHeartbeat() {
  const scrollSpeed = 2;

  // Scroll canvas left
  const imgData = ctx.getImageData(scrollSpeed, 0, canvas.width - scrollSpeed, canvas.height);
  ctx.putImageData(imgData, 0, 0);
  ctx.clearRect(canvas.width - scrollSpeed, 0, scrollSpeed, canvas.height);

  // Calculate beat intensity
  let level = 0;
  if (analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);
    let avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    level = avg / 255;
  }

  // Determine spike
  const midY = canvas.height / 2;
  if (level > 0.4) beatY = midY - 60;
  else if (level > 0.3) beatY = midY + 30;
  else beatY = midY;

  // Draw line
  ctx.beginPath();
  ctx.moveTo(canvas.width - scrollSpeed * 2, beatY);
  ctx.lineTo(canvas.width, beatY);
  ctx.strokeStyle = "lime";
  ctx.lineWidth = 2;
  ctx.shadowBlur = 10;
  ctx.shadowColor = "lime";
  ctx.stroke();
  ctx.shadowBlur = 0;
}

drawVisualizer();
