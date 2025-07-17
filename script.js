const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
ctx.translate(centerX, centerY);

let isPaused = false;
let angle = 0;
let pulse = 0;
let audioContext, audioSource, analyser, dataArray;

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

    angle += 0.001;
  }

  requestAnimationFrame(drawWebPulse);
}

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

ctx.lineWidth = 1;
drawWebPulse();
