const canvas = document.getElementById("webCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let audioContext, analyser, source, dataArray, bufferLength, currentAudio;
let isPaused = false;
let mode = "wave";
let speed = 1;
let sigmaMode = false;

initGalaxyParticles();

const sigmaBtn = document.getElementById("sigmaBtn");

document.getElementById("toggleBtn").addEventListener("click", togglePlayPause);
document.getElementById("modeSelect").addEventListener("change", (e) => {
  mode = e.target.value;
  document.body.classList.remove("shake");
});
document.getElementById("speedSlider").addEventListener("input", (e) => {
  speed = parseFloat(e.target.value);
});
document.getElementById("playlist").addEventListener("change", (e) => {
  if (e.target.value) {
    loadAudio(e.target.value);
    setTimeout(() => {
      togglePlayPause();
    }, 500);
  }
});
document.getElementById("audioFile").addEventListener("change", (e) => {
  if (e.target.files[0]) {
    loadAudio(URL.createObjectURL(e.target.files[0]));
    setTimeout(() => {
      togglePlayPause();
    }, 500);
  }
});
sigmaBtn.addEventListener("click", () => {
  sigmaMode = !sigmaMode;
});

function togglePlayPause() {
  if (!currentAudio) {
    alert("⚠️ No audio loaded yet!");
    return;
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  isPaused = !isPaused;
  document.getElementById("toggleBtn").textContent = isPaused ? "Play" : "Pause";

  if (isPaused) {
    currentAudio.pause();
  } else {
    currentAudio.play().then(() => {
      console.log("Manual play successful");
    }).catch((err) => {
      alert("❌ Manual play failed: " + err.message);
    });
  }
}

function loadAudio(src) {
  alert("🎵 Audio loading started...");

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  currentAudio = new Audio(src);
  currentAudio.crossOrigin = "anonymous";

  if (!audioContext || audioContext.state === "closed") {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  source = audioContext.createMediaElementSource(currentAudio);
  analyser = audioContext.createAnalyser();
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  analyser.fftSize = 256;

  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  currentAudio.play().then(() => {
    alert("✅ Audio is playing!");
    animate();
  }).catch((err) => {
    alert("❌ Playback failed: " + err.message);
    console.error("Autoplay failed:", err);
  });
}

function animate() {
  requestAnimationFrame(animate);

  if (!analyser || isPaused) return;

  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;

  if (sigmaMode && avg > 100) {
    document.body.classList.add("shake");
    setTimeout(() => document.body.classList.remove("shake"), 80);
  }

  switch (mode) {
    case "wave":
      drawWave();
      break;
    case "circle":
      drawCircleWeb();
      break;
    case "heartbeat":
      drawHeartbeat(avg);
      break;
    case "galaxy":
      drawGalaxy(avg);
      break;
  }
}

function drawWave() {
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  for (let i = 0; i < bufferLength; i++) {
    const x = (i / bufferLength) * canvas.width;
    const y = canvas.height / 2 + (dataArray[i] - 128) * speed * 0.6;
    ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawCircleWeb() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = Math.min(canvas.width, canvas.height) / 3;

  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,255,255,${0.15 * i})`;
    ctx.stroke();
  }

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const x = centerX + maxRadius * Math.cos(angle);
    const y = centerY + maxRadius * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "rgba(0,255,255,0.3)";
    ctx.stroke();
  }
}

function drawHeartbeat(avg) {
  const centerY = canvas.height / 2;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const height = (dataArray[i] / 255) * 80;
    x += canvas.width / bufferLength;
    const y = i % 10 === 0 ? centerY - height * speed : centerY;
    ctx.lineTo(x, y);
  }

  ctx.strokeStyle = `hsl(${avg + 200}, 100%, 60%)`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

let galaxyParticles = [];
function initGalaxyParticles() {
  for (let i = 0; i < 100; i++) {
    galaxyParticles.push({
      angle: Math.random() * 2 * Math.PI,
      radius: Math.random() * 300,
      speed: Math.random() * 0.01,
      size: Math.random() * 2 + 1,
      hue: Math.random() * 360,
    });
  }
}

function drawGalaxy(avg) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  galaxyParticles.forEach((p) => {
    p.angle += p.speed * speed;
    const radius = p.radius + (avg * 0.3);
    const x = centerX + radius * Math.cos(p.angle);
    const y = centerY + radius * Math.sin(p.angle);

    ctx.beginPath();
    ctx.arc(x, y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${p.hue}, 100%, 70%)`;
    ctx.fill();
  });

  ctx.beginPath();
  ctx.arc(centerX, centerY, avg * 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = `hsl(${avg * 2}, 100%, 60%)`;
  ctx.lineWidth = 3;
  ctx.stroke();
      }

