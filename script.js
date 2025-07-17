const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 800;
ctx.translate(canvas.width / 2, canvas.height / 2);

let mode = "wave";
let isPaused = false;
let angle = 0;
let pulse = 1;
let audioContext, audioSource, analyser, dataArray;

const speedSlider = document.getElementById("speedSlider");

function hsvToRgb(h, s, v) {
  let f = (n, k = (n + h * 6) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}

function drawWave() {
  ctx.beginPath();
  ctx.moveTo(-canvas.width / 2, 0);
  for (let x = -canvas.width / 2; x < canvas.width / 2; x += 4) {
    let index = Math.floor((x + canvas.width / 2) / canvas.width * dataArray.length);
    let y = (dataArray[index] - 128) * 0.7;
    ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "#0ff";
  ctx.stroke();
}

function drawCircle() {
  const rings = 6;
  const spokes = 5;
  const maxRadius = 300;

  for (let r = 1; r <= rings; r++) {
    ctx.beginPath();
    ctx.arc(0, 0, (r / rings) * maxRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = `hsl(${r * 50 + angle * 500}, 100%, 50%)`;
    ctx.stroke();
  }

  for (let s = 0; s < spokes; s++) {
    let theta = (s / spokes) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(maxRadius * Math.cos(theta), maxRadius * Math.sin(theta));
    ctx.stroke();
  }
}

function drawHeartbeat() {
  ctx.beginPath();
  ctx.moveTo(-canvas.width / 2, 0);
  let beatLength = canvas.width / dataArray.length;
  for (let i = 0; i < dataArray.length; i++) {
    let x = i * beatLength - canvas.width / 2;
    let y = (dataArray[i] - 128) * 1.2;
    ctx.lineTo(x, y);
  }
  let color = `hsl(${angle * 360}, 100%, 50%)`;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function draw() {
  if (!isPaused) {
    ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      let avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      pulse = 1 + avg / 128;
    }

    ctx.save();
    ctx.lineWidth = 2;

    if (mode === "wave") drawWave();
    else if (mode === "circle") drawCircle();
    else if (mode === "heartbeat") drawHeartbeat();

    ctx.restore();
    angle += 0.001 * speedSlider.value;
  }
  requestAnimationFrame(draw);
}

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

draw();
