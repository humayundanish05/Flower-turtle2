const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");

let isPaused = false;
let mode = "wave";
let pulse = 1;
let speed = 1;
let audioContext, audioSource, analyser, dataArray;
let heartbeatX = 0;
let waveform = [];

function hsvToRgb(h, s, v) {
  let f = (n, k = (n + h * 6) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}

function drawVisualizer() {
  if (!isPaused) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      let avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      pulse = 1 + avg / 128;
    }

    if (mode === "wave") {
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      for (let x = 0; x < canvas.width; x++) {
        let y = canvas.height / 2 + Math.sin(x * 0.05 + performance.now() / 100) * 50 * pulse;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#0ff";
      ctx.stroke();
    }

    else if (mode === "circle") {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const layers = 6;
      const spokes = 30;
      const maxRadius = 150 * pulse;

      for (let layer = 0; layer < layers; layer++) {
        ctx.beginPath();
        for (let i = 0; i <= spokes; i++) {
          let angle = (i / spokes) * 2 * Math.PI;
          let radius = ((layer + 1) / layers) * maxRadius;
          let x = centerX + radius * Math.cos(angle);
          let y = centerY + radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        let h = (layer / layers + performance.now() / 10000) % 1;
        let [r, g, b] = hsvToRgb(h, 1, 1);
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.stroke();
      }
    }

    else if (mode === "heartbeat") {
      const midY = canvas.height / 2;
      const step = 4;

      // Fake ECG-style pulse based on audio
      if (pulse > 1.1) {
        waveform.push(midY - 50);  // spike
        waveform.push(midY + 30);  // drop
        waveform.push(midY);       // return
      } else {
        waveform.push(midY + Math.random() * 2 - 1);  // flat + noise
      }

      if (waveform.length > canvas.width) {
        waveform.shift(); // scroll effect
      }

      ctx.beginPath();
      ctx.moveTo(0, waveform[0]);
      for (let i = 1; i < waveform.length; i++) {
        ctx.lineTo(i, waveform[i]);
      }
      ctx.strokeStyle = "#0f0";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  requestAnimationFrame(drawVisualizer);
}

// Controls
document.getElementById("toggleBtn").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("toggleBtn").textContent = isPaused ? "Play" : "Pause";
});

document.getElementById("speedSlider").addEventListener("input", e => {
  speed = parseFloat(e.target.value);
});

document.getElementById("modeSelect").addEventListener("change", e => {
  mode = e.target.value;
});

document.getElementById("audioFile").addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      if (!audioContext)
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
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

drawVisualizer();
