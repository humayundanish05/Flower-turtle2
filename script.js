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

// Listen to mode changes
document.getElementById("modeSelect").addEventListener("change", (e) => {
  currentMode = e.target.value;
});

function hsvToRgb(h, s, v) {
  let f = (n, k = (n + h * 6) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}

function drawWebPulse() {
  if (!isPaused) {
    ctx.clearRect(-centerX, -centerY, canvas.width, canvas.height);

    const layers = 10;
    const spokes = 36;
    const maxRadius = 300;

    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      let average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      pulse = 1 + average / 128;
    }

    if (currentMode === "wave") {
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

      for (let i = 0; i < spokes; i++) {
        let theta = (i / spokes) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        let h = (i / spokes + angle) % 1;
        let [r, g, b] = hsvToRgb(h, 1, 1);
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.lineTo(maxRadius * pulse * Math.cos(theta), maxRadius * pulse * Math.sin(theta));
        ctx.stroke();
      }
    }

    else if (currentMode === "circle") {
      for (let i = 0; i < layers; i++) {
        let radius = (i + 1) * 20 * pulse;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        let h = (i / layers + angle) % 1;
        let [r, g, b] = hsvToRgb(h, 1, 1);
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.stroke();
      }
    }

    else if (currentMode === "flower") {
      for (let i = 0; i < spokes; i++) {
        let theta = (i / spokes) * 2 * Math.PI;
        ctx.beginPath();
        let petalLength = maxRadius * Math.abs(Math.sin(angle * 5)) * pulse;
        ctx.moveTo(0, 0);
        let [r, g, b] = hsvToRgb((i / spokes + angle) % 1, 1, 1);
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.lineTo(petalLength * Math.cos(theta), petalLength * Math.sin(theta));
        ctx.stroke();
      }
    }

    angle += 0.002;
  }

  requestAnimationFrame(drawWebPulse);
}

// Play/pause button
document.getElementById("toggleBtn").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("toggleBtn").textContent = isPaused ? "Play" : "Pause";
});

// Audio upload
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

ctx.lineWidth = 1;
drawWebPulse();
