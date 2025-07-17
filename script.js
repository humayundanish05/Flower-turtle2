const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

ctx.translate(centerX, centerY);

let isPaused = false;
let angle = 0;
let pulse = 1;
let audioContext, audioSource, analyser, dataArray;
let currentMode = "wave";

let heartbeatX = 0;
let heartbeatCanvas = document.createElement("canvas");
heartbeatCanvas.width = canvas.width;
heartbeatCanvas.height = canvas.height;
let heartbeatCtx = heartbeatCanvas.getContext("2d");

function hsvToRgb(h, s, v) {
  let f = (n, k = (n + h * 6) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}

function drawWaveform() {
  ctx.clearRect(-centerX, -centerY, canvas.width, canvas.height);
  if (analyser && dataArray) {
    analyser.getByteTimeDomainData(dataArray);
    ctx.beginPath();
    for (let i = 0; i < dataArray.length; i++) {
      let x = (i / dataArray.length) * canvas.width - centerX;
      let y = (dataArray[i] - 128) * 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#0ff";
    ctx.stroke();
  } else {
    // Default idle animation
    ctx.beginPath();
    for (let x = -centerX; x < centerX; x++) {
      let y = Math.sin(x * 0.01 + angle * 10) * 30;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#0ff";
    ctx.stroke();
  }
}

function drawCircle() {
  ctx.clearRect(-centerX, -centerY, canvas.width, canvas.height);
  let radius = 100 + pulse * 50;
  let [r, g, b] = hsvToRgb(angle % 1, 1, 1);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawFlower() {
  ctx.clearRect(-centerX, -centerY, canvas.width, canvas.height);
  let petals = 16;
  let radius = 150;
  for (let i = 0; i < petals; i++) {
    let theta = (i / petals) * 2 * Math.PI;
    ctx.save();
    ctx.rotate(theta);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(radius, radius * pulse, radius, -radius * pulse, 0, 0);
    let [r, g, b] = hsvToRgb((angle + i / petals) % 1, 1, 1);
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.stroke();
    ctx.restore();
  }
}

function drawHeartbeat() {
  // Shift old content left
  let imageData = heartbeatCtx.getImageData(1, 0, canvas.width - 1, canvas.height);
  heartbeatCtx.clearRect(0, 0, canvas.width, canvas.height);
  heartbeatCtx.putImageData(imageData, 0, 0);

  // Draw new beat line at right edge
  let height = canvas.height;
  let midY = height / 2;
  let value = 0;

  if (analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);
    let avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    value = avg;
  } else {
    value = 128 + 127 * Math.sin(angle * 20);
  }

  let beatY = midY - ((value - 128) * 1.5);
  heartbeatCtx.beginPath();
  heartbeatCtx.moveTo(canvas.width - 2, midY);
  heartbeatCtx.lineTo(canvas.width - 1, beatY);
  heartbeatCtx.strokeStyle = "#0f0";
  heartbeatCtx.lineWidth = 2;
  heartbeatCtx.stroke();

  // Copy heartbeat canvas to visible canvas
  ctx.clearRect(-centerX, -centerY, canvas.width, canvas.height);
  ctx.drawImage(heartbeatCanvas, -centerX, -centerY);
}

function draw() {
  if (!isPaused) {
    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      let avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      pulse = 1 + avg / 128;
    }

    if (currentMode === "wave") drawWaveform();
    else if (currentMode === "circle") drawCircle();
    else if (currentMode === "flower") drawFlower();
    else if (currentMode === "heartbeat") drawHeartbeat();

    angle += 0.002;
  }

  requestAnimationFrame(draw);
}

document.getElementById("toggleBtn").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("toggleBtn").textContent = isPaused ? "Play" : "Pause";
});

document.getElementById("modeSelect").addEventListener("change", (e) => {
  currentMode = e.target.value;
  ctx.clearRect(-centerX, -centerY, canvas.width, canvas.height);
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

// Optional: Drag and Drop
canvas.addEventListener('dragover', (e) => {
  e.preventDefault();
  canvas.style.border = "2px dashed #0ff";
});
canvas.addEventListener('dragleave', () => {
  canvas.style.border = "none";
});
canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  canvas.style.border = "none";
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("audio")) {
    document.getElementById("audioFile").files = e.dataTransfer.files;
    document.getElementById("audioFile").dispatchEvent(new Event("change"));
  }
});

ctx.lineWidth = 1;
draw();
