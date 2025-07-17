const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");
let centerX = canvas.width / 2;
let centerY = canvas.height / 2;

let isPaused = false;
let angle = 0;
let pulse = 1;
let speed = 1;
let audioContext, audioSource, analyser, dataArray;
let currentMode = "wave";

function hsvToRgb(h, s, v) {
  let f = (n, k = (n + h * 6) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}

document.getElementById("modeSelect").addEventListener("change", (e) => {
  currentMode = e.target.value;
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

function drawWebPulse() {
  if (!isPaused) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      let average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      pulse = 1 + average / 128;
    }

    if (currentMode === "wave") {
      ctx.beginPath();
      for (let i = 0; i < dataArray.length; i++) {
        let x = (i / dataArray.length) * canvas.width;
        let y = canvas.height / 2 + (dataArray[i] - 128) * 0.8;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#0ff";
      ctx.stroke();
    }

    else if (currentMode === "circle") {
      const radius = 150 * pulse;
      const segments = 60;
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(theta);
        const y = centerY + radius * Math.sin(theta);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#ff0";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    else if (currentMode === "flower") {
      const petals = 12;
      const radius = 120 * pulse;
      for (let i = 0; i < petals; i++) {
        let theta = (i / petals) * 2 * Math.PI + angle;
        let x = centerX + radius * Math.cos(theta);
        let y = centerY + radius * Math.sin(theta);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = `hsl(${i * 30}, 100%, 50%)`;
        ctx.stroke();
      }
    }

    else if (currentMode === "heartbeat") {
      analyser.getByteTimeDomainData(dataArray);

      // Scroll canvas like ECG monitor
      const scrollSpeed = 2 * speed;
      const imageData = ctx.getImageData(scrollSpeed, 0, canvas.width - scrollSpeed, canvas.height);
      ctx.putImageData(imageData, 0, 0);

      // Clear right side
      ctx.fillStyle = "black";
      ctx.fillRect(canvas.width - scrollSpeed, 0, scrollSpeed, canvas.height);

      // Draw beat line
      ctx.beginPath();
      ctx.moveTo(canvas.width - scrollSpeed, centerY);
      for (let i = 0; i < dataArray.length; i++) {
        const y = (dataArray[i] / 255.0) * 100;
        ctx.lineTo(canvas.width - dataArray.length + i, y + centerY - 50);
      }
      ctx.strokeStyle = "#0f0";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    angle += 0.01 * speed;
  }

  requestAnimationFrame(drawWebPulse);
}

drawWebPulse();
