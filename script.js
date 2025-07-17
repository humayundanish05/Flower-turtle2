const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
ctx.translate(centerX, centerY);

let isPaused = false;
let mode = "wave";
let angle = 0;
let pulse = 1;
let audioContext, audioSource, analyser, dataArray;

// Helper
function hsvToRgb(h, s, v) {
  let f = (n, k = (n + h * 6) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}

function draw() {
  if (!isPaused) {
    ctx.clearRect(-centerX, -centerY, canvas.width, canvas.height);

    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      let avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      pulse = 1 + avg / 128;
    }

    if (mode === "wave") drawWave();
    else if (mode === "circle") drawCircleWeb();
    else if (mode === "heartbeat") drawHeartbeat();
  }

  requestAnimationFrame(draw);
}

// ----- MODE FUNCTIONS -----

function drawWave() {
  ctx.beginPath();
  const length = canvas.width;
  const midY = 0;
  const sliceWidth = (canvas.width / dataArray.length) * 2;
  let x = -centerX;

  for (let i = 0; i < dataArray.length; i++) {
    let v = dataArray[i] / 128.0;
    let y = (v * 100 - 100) * pulse * 0.5;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);

    x += sliceWidth;
  }

  let [r, g, b] = hsvToRgb(angle % 1, 1, 1);
  ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  angle += 0.002;
}

function drawCircleWeb() {
  const layers = 5;
  const spokes = 5;
  const radiusStep = 50;

  // Draw concentric circles
  for (let i = 1; i <= layers; i++) {
    let radius = i * radiusStep;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    let [r, g, b] = hsvToRgb((angle + i * 0.1) % 1, 1, 1);
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.stroke();
  }

  // Draw straight lines
  for (let i = 0; i < spokes; i++) {
    let theta = (i / spokes) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(
      radiusStep * layers * Math.cos(theta),
      radiusStep * layers * Math.sin(theta)
    );
    let [r, g, b] = hsvToRgb((angle + i * 0.2) % 1, 1, 1);
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.stroke();
  }

  angle += 0.001;
}

function drawHeartbeat() {
  const baseY = 0;
  const width = 800;
  const xStep = 10;
  let x = -centerX;

  ctx.beginPath();
  ctx.moveTo(x, baseY);

  for (let i = 0; i < width; i += xStep) {
    let beat = dataArray ? dataArray[i % dataArray.length] / 255 : 0.1;
    let y = 0;
    if (i % 100 === 0) {
      y = -100 * beat * pulse; // Strong peak
    } else if (i % 80 === 0) {
      y = -50 * beat * pulse;
    }
    ctx.lineTo(x + i, y);
  }

  let [r, g, b] = hsvToRgb(angle % 1, 1, 1);
  ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  angle += 0.003;
}

// ----- UI Controls -----

document.getElementById("toggleBtn").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("toggleBtn").textContent = isPaused ? "Play" : "Pause";
});

document.getElementById("modeSelect").addEventListener("change", (e) => {
  mode = e.target.value;
});

document.getElementById("audioFile").addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
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

// ----- Start -----
ctx.lineWidth = 2;
draw();
