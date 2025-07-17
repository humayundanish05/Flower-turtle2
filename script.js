const canvas = document.getElementById("turtleCanvas");
const ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
ctx.translate(centerX, centerY);

let h = 0;
let angle = 0;
let speed = 1;
let isPaused = false;
let audioContext, audioSource, analyser, dataArray;

function hsvToRgb(h, s, v) {
  let f = (n, k = (n + h * 6) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}

function drawFrame() {
  if (!isPaused) {
    if (analyser) {
      analyser.getByteFrequencyData(dataArray);
      let average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      speed = average / 50;
    }

    ctx.clearRect(-centerX, -centerY, canvas.width, canvas.height);

    for (let i = 0; i < 2; i++) {
      ctx.save();
      ctx.rotate(angle);
      for (let j = 0; j < 18; j++) {
        let radius = 150 - j * 6;
        let rgb = hsvToRgb(h, 1, 1);
        ctx.strokeStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI / 2);
        ctx.stroke();

        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI / 2);
        ctx.stroke();

        ctx.rotate(Math.PI);
        ctx.beginPath();
        ctx.arc(0, 0, 40, Math.PI / 6, 0);
        ctx.stroke();
      }
      ctx.restore();
    }

    angle += 0.005 * speed;
    h += 0.002 * speed;
    if (h > 1) h = 0;
  }

  requestAnimationFrame(drawFrame);
}

document.getElementById("toggleBtn").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("toggleBtn").textContent = isPaused ? "Play" : "Pause";
});

document.getElementById("speedSlider").addEventListener("input", (e) => {
  speed = parseFloat(e.target.value);
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

ctx.lineWidth = 1.2;
drawFrame();
