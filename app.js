/* 
  RAMAN'S HYPE ANIME BIRTHDAY WEB CODE
  Features: 
  - Dynamic Countdown & Celebration State Management
  - Web Audio API synthesizer (no external audio files required for action sounds!)
  - Canvas speed lines rendering (action speed increases as you power up)
  - Interactive Power-Up meter, screen shake, and level-up system
  - Canvas confetti particle engine
*/

// --- USER CONFIGURABLE VALUES ---
const TARGET_MONTH = 6; // 0-indexed (July is index 6)
const TARGET_DAY = 11;  // July 11
const BIRTH_YEAR = 2001; // Used to calculate Raman's age. Leveling up will show (CurrentYear - BirthYear)

// Fallback music stream if local background_op.mp3 fails to load or is missing
const BACKUP_MUSIC_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3";

// --- STATE MANAGEMENT ---
let isMuted = true;
let isCharging = false;
let chargeProgress = 0; // 0 to 100
let animationFrameId = null;
let targetDate = null;
let currentYear = 2026;
let devOverrideMode = null; // 'countdown', 'celebration', or null
let lastChargeStartTime = 0;

// Audio context holder for Web Audio API synthesis
let audioCtx = null;
let chargeOsc = null;
let chargeGain = null;

// --- DOM ELEMENTS ---
const appWrapper = document.getElementById('appWrapper');
const speedLinesCanvas = document.getElementById('speedLinesCanvas');
const audioToggleBtn = document.getElementById('audioToggleBtn');
const audioHUD = document.getElementById('audioHUD');
const hudBatteryCharge = document.getElementById('hudBatteryCharge');
const bgMusic = document.getElementById('bgMusic');

// Countdown items
const countdownMode = document.getElementById('countdownMode');
const celebrationMode = document.getElementById('celebrationMode');
const daysVal = document.getElementById('daysVal');
const hoursVal = document.getElementById('hoursVal');
const minutesVal = document.getElementById('minutesVal');
const secondsVal = document.getElementById('secondsVal');
const powerMeterBar = document.getElementById('powerMeterBar');
const powerMeterPercent = document.getElementById('powerMeterPercent');

// Interactive Charging elements
const currentLevel = document.getElementById('currentLevel');
const chargeBtn = document.getElementById('chargeBtn');
const chargeAura = document.getElementById('chargeAura');

// Modal elements
const levelUpModal = document.getElementById('levelUpModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalFlash = document.getElementById('modalFlash');
const levelAgeText = document.getElementById('levelAgeText');

// Dev preview elements
const devToggleCountdown = document.getElementById('devToggleCountdown');
const devToggleCelebrate = document.getElementById('devToggleCelebrate');


// ================= AUDIO SYNTHESIZER ENGINE =================
// Synthesizes retro-arcade and sci-fi action sounds programmatically
function initAudioContext() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSoundSynth(type) {
  if (isMuted) return;
  initAudioContext();
  if (!audioCtx) return;

  // Make sure audio context is active (handled for browser security)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  if (type === 'whoosh') {
    // Synth whoosh sound
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.35);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } 
  
  else if (type === 'levelUp') {
    // Upward retro arpeggio + explosion chime
    const synthNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C, E, G arpeggio
    synthNotes.forEach((freq, index) => {
      const noteTime = now + (index * 0.08);
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gainNode.gain.setValueAtTime(0.2, noteTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.35);
    });

    // Sub-explosion boom
    setTimeout(() => {
      const oscBoom = audioCtx.createOscillator();
      const gainBoom = audioCtx.createGain();
      
      oscBoom.type = 'sine';
      oscBoom.frequency.setValueAtTime(120, audioCtx.currentTime);
      oscBoom.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.6);
      
      gainBoom.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gainBoom.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      
      oscBoom.connect(gainBoom);
      gainBoom.connect(audioCtx.destination);
      oscBoom.start();
      oscBoom.stop(audioCtx.currentTime + 0.6);
    }, 200);
  }
  
  else if (type === 'slurp') {
    // Programmatic noodle eating slurp sound: quick rising and falling chirps
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
    
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }
  
  else if (type === 'saiyanCharge') {
    // Massive charging power hum and electric crash!
    const synthNotes = [100, 150, 200, 300, 400];
    synthNotes.forEach((freq, index) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 3.5, now + 0.85);
      
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.85);
    });
    
    // Crackling sparks: rapid high frequency square chirps
    for (let i = 0; i < 6; i++) {
      const sparkTime = now + (i * 0.12);
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1500 + Math.random() * 1000, sparkTime);
      
      gainNode.gain.setValueAtTime(0.05, sparkTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, sparkTime + 0.08);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(sparkTime);
      osc.stop(sparkTime + 0.08);
    }
  }
}

// Starts the looping power hum while holding charge button
function startChargeHum() {
  if (isMuted) return;
  initAudioContext();
  if (!audioCtx) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;
  
  // Continuous charging oscillator
  chargeOsc = audioCtx.createOscillator();
  chargeGain = audioCtx.createGain();

  chargeOsc.type = 'sawtooth';
  chargeOsc.frequency.setValueAtTime(100, now); // starts low
  
  // High cut filter to make it sound warm/rumbling
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(300, now);

  chargeGain.gain.setValueAtTime(0.05, now);

  chargeOsc.connect(filter);
  filter.connect(chargeGain);
  chargeGain.connect(audioCtx.destination);

  chargeOsc.start(now);
}

// Dynamically adjusts pitch and volume of hum based on progress percent
function updateChargeHum(percent) {
  if (isMuted || !chargeOsc || !chargeGain || !audioCtx) return;
  const targetFreq = 100 + (percent * 4); // Pitches shift from 100Hz to 500Hz
  const targetVol = 0.05 + (percent * 0.002); // Hum gets louder
  
  chargeOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.05);
  chargeGain.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.05);
}

// Fades out hum
function stopChargeHum() {
  if (chargeOsc && chargeGain) {
    try {
      const now = audioCtx.currentTime;
      chargeGain.gain.setValueAtTime(chargeGain.gain.value, now);
      chargeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      chargeOsc.stop(now + 0.2);
    } catch(e) {}
    chargeOsc = null;
    chargeGain = null;
  }
}


// ================= BACKGROUND MUSIC CONTROLLER =================
function toggleMusic() {
  isMuted = !isMuted;
  
  if (isMuted) {
    bgMusic.pause();
    audioHUD.classList.add('muted');
    audioToggleBtn.textContent = "🔇";
  } else {
    // Attempt play
    initAudioContext();
    bgMusic.play()
      .then(() => {
        audioHUD.classList.remove('muted');
        audioToggleBtn.textContent = "🔊";
      })
      .catch((err) => {
        console.warn("Autoplay block detected, retrying with fallback or waiting for user interaction.", err);
        // Fallback music stream trigger
        fallbackMusicStream();
      });
  }
}

function fallbackMusicStream() {
  console.log("Activating royalty-free audio fallback...");
  bgMusic.src = BACKUP_MUSIC_URL;
  bgMusic.load();
  bgMusic.play()
    .then(() => {
      audioHUD.classList.remove('muted');
      audioToggleBtn.textContent = "🔊";
    })
    .catch(e => console.error("All music stream attempts blocked.", e));
}

// Gracefully handle file loading errors (e.g. if the user hasn't copied their background_op.mp3 file yet)
bgMusic.addEventListener('error', function() {
  console.warn("Local sound file not found or failed to load. Initiating stream fallback.");
  if (!isMuted) {
    fallbackMusicStream();
  }
});


// ================= DYNAMIC DATE & COUNTDOWN MODULE =================
// Configures target dates and calculates values
function setupTargetDates() {
  const now = new Date();
  currentYear = now.getFullYear();
  
  // Target birthday date setup
  targetDate = new Date(currentYear, TARGET_MONTH, TARGET_DAY, 0, 0, 0);
  
  // If birthday is in the past for this year, bump target date to next year
  if (now > targetDate && now.getDate() !== TARGET_DAY) {
    targetDate.setFullYear(currentYear + 1);
  }
  
  // Raman's Level is calculated based on current target year minus birth year
  const targetYear = targetDate.getFullYear();
  const calculatedAge = targetYear - BIRTH_YEAR;
  
  // Update level texts
  currentLevel.textContent = `LV. ${calculatedAge - 1}`;
  levelAgeText.textContent = `RAMAN LEVELED UP TO AGE ${calculatedAge}! (Still zero IQ)`;
}

function runDateCheck() {
  if (devOverrideMode !== null) {
    if (devOverrideMode === 'celebration') {
      showCelebrationMode();
    } else {
      showCountdownMode();
      updateCountdownTick();
    }
    return;
  }

  const now = new Date();
  
  // Exact check: is it July 11?
  const isBirthday = (now.getMonth() === TARGET_MONTH && now.getDate() === TARGET_DAY);
  const isAfterBirthday = (now > targetDate);

  if (isBirthday || isAfterBirthday) {
    showCelebrationMode();
  } else {
    showCountdownMode();
    updateCountdownTick();
  }
}

function updateCountdownTick() {
  const now = new Date();
  const difference = targetDate - now;
  
  if (difference <= 0) {
    showCelebrationMode();
    return;
  }
  
  // Break down parts
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);
  
  // Render
  daysVal.textContent = String(days).padStart(2, '0');
  hoursVal.textContent = String(hours).padStart(2, '0');
  minutesVal.textContent = String(minutes).padStart(2, '0');
  secondsVal.textContent = String(seconds).padStart(2, '0');
  
  // Progress HUD bar (assume 10 day countdown base for visual scaling)
  const totalDuration = 10 * 24 * 60 * 60 * 1000; // 10 days
  const timeElapsed = totalDuration - Math.min(difference, totalDuration);
  const pct = Math.round((timeElapsed / totalDuration) * 100);
  
  powerMeterBar.style.width = `${pct}%`;
  powerMeterPercent.textContent = `${pct}%`;
}

function showCelebrationMode() {
  countdownMode.style.display = 'none';
  celebrationMode.style.display = 'block';
}

function showCountdownMode() {
  celebrationMode.style.display = 'none';
  countdownMode.style.display = 'block';
}


// ================= ANIMATION CANVAS (SPEED LINES) =================
const ctx = speedLinesCanvas.getContext('2d');
let linesArray = [];

function resizeCanvas() {
  speedLinesCanvas.width = window.innerWidth;
  speedLinesCanvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Speed Line constructor
class SpeedLine {
  constructor() {
    this.reset();
  }
  
  reset() {
    const w = speedLinesCanvas.width;
    const h = speedLinesCanvas.height;
    const center = { x: w / 2, y: h / 2 };
    
    // Choose starting angle radiating from center
    this.angle = Math.random() * Math.PI * 2;
    
    // Generate radius range outside the center safe zone
    const minRadius = Math.min(w, h) * 0.15;
    const maxRadius = Math.max(w, h) * 0.8;
    this.startRadius = minRadius + Math.random() * (maxRadius - minRadius);
    this.length = 30 + Math.random() * 120;
    this.speed = 15 + Math.random() * 25;
    
    // Calculate points
    this.x1 = center.x + Math.cos(this.angle) * this.startRadius;
    this.y1 = center.y + Math.sin(this.angle) * this.startRadius;
    this.x2 = center.x + Math.cos(this.angle) * (this.startRadius + this.length);
    this.y2 = center.y + Math.sin(this.angle) * (this.startRadius + this.length);
    
    this.opacity = 0.2 + Math.random() * 0.6;
    this.width = 1 + Math.random() * 2.5;
  }
  
  update(chargeLevel) {
    const center = { x: speedLinesCanvas.width / 2, y: speedLinesCanvas.height / 2 };
    // Move lines outward
    this.startRadius += this.speed * (1 + chargeLevel * 2);
    
    // Recalculate
    this.x1 = center.x + Math.cos(this.angle) * this.startRadius;
    this.y1 = center.y + Math.sin(this.angle) * this.startRadius;
    this.x2 = center.x + Math.cos(this.angle) * (this.startRadius + this.length);
    this.y2 = center.y + Math.sin(this.angle) * (this.startRadius + this.length);
    
    // Reset if it goes off screen
    if (this.startRadius > Math.max(speedLinesCanvas.width, speedLinesCanvas.height)) {
      this.reset();
    }
  }
  
  draw() {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(0, 240, 255, ${this.opacity})`;
    ctx.lineWidth = this.width;
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();
  }
}

// Generate base speed lines list
function initSpeedLines() {
  linesArray = [];
  const linesCount = 80;
  for (let i = 0; i < linesCount; i++) {
    linesArray.push(new SpeedLine());
  }
}
initSpeedLines();

// Main draw cycle for background canvas
function drawSpeedLinesLoop() {
  ctx.clearRect(0, 0, speedLinesCanvas.width, speedLinesCanvas.height);
  
  // Only draw if we are charging/leveling
  if (chargeProgress > 0) {
    const normalizedCharge = chargeProgress / 100;
    
    // Scale count of drawn lines based on charge level
    const linesToDraw = Math.floor(linesArray.length * (0.3 + normalizedCharge * 0.7));
    
    for (let i = 0; i < linesToDraw; i++) {
      linesArray[i].update(normalizedCharge);
      linesArray[i].draw();
    }
  }
  
  requestAnimationFrame(drawSpeedLinesLoop);
}
drawSpeedLinesLoop();


// ================= INTERACTIVE CHARGING CORE =================
function handleChargeStart() {
  isCharging = true;
  lastChargeStartTime = Date.now();
  appWrapper.classList.add('shake-active');
  playSoundSynth('whoosh');
  startChargeHum();
  runChargeCycle();
}

function handleChargeEnd() {
  if (!isCharging) return;
  isCharging = false;
  appWrapper.classList.remove('shake-active');
  stopChargeHum();
  
  const clickDuration = Date.now() - lastChargeStartTime;
  if (clickDuration < 250) { // If it was a quick tap/click
    // Give a flat boost!
    chargeProgress = Math.min(100, chargeProgress + 8);
  }
  
  // Deplete meter if not fully completed
  if (chargeProgress < 100) {
    depleteMeter();
  }
}

function runChargeCycle() {
  if (!isCharging) return;
  
  chargeProgress = Math.min(100, chargeProgress + 0.6); // Charge speed multiplier
  
  // Sync styling variables
  const normVal = chargeProgress / 100;
  document.documentElement.style.setProperty('--charge-level', normVal);
  document.documentElement.style.setProperty('--shake-intensity', `${normVal * 6}px`);
  
  // Aura expansion scale
  chargeAura.style.transform = `translate(-50%, -50%) scale(${1 + normVal * 2.5})`;
  
  // Update sound Hum pitch
  updateChargeHum(chargeProgress);
  
  if (chargeProgress >= 100) {
    triggerLevelUp();
  } else {
    requestAnimationFrame(runChargeCycle);
  }
}

function depleteMeter() {
  if (isCharging) return;
  
  chargeProgress = Math.max(0, chargeProgress - 2);
  const normVal = chargeProgress / 100;
  document.documentElement.style.setProperty('--charge-level', normVal);
  document.documentElement.style.setProperty('--shake-intensity', `${normVal * 6}px`);
  chargeAura.style.transform = `translate(-50%, -50%) scale(${1 + normVal * 2.5})`;
  
  if (chargeProgress > 0) {
    requestAnimationFrame(depleteMeter);
  }
}

// Depletion backup handler (unused since click loop fixed)

// Trigger Level Up Event
function triggerLevelUp() {
  isCharging = false;
  appWrapper.classList.remove('shake-active');
  stopChargeHum();
  
  // Set levels to max styling
  document.documentElement.style.setProperty('--charge-level', '0');
  document.documentElement.style.setProperty('--shake-intensity', '0px');
  chargeAura.style.transform = `translate(-50%, -50%) scale(1)`;
  
  // Trigger chime SFX
  playSoundSynth('levelUp');
  
  // Show level up modal
  levelUpModal.classList.add('active');
  modalFlash.style.animation = 'flashAnimation 0.5s ease-out';
  
  // Launch custom confetti particles on the canvas!
  runConfettiExplosion();
  
  // Reset charge
  chargeProgress = 0;
}


// ================= LIGHTWEIGHT CANVAS CONFETTI ENGINE =================
let confettiActive = false;
let confettiParticles = [];

class ConfettiParticle {
  constructor(canvasWidth, canvasHeight) {
    this.w = canvasWidth;
    this.h = canvasHeight;
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;
    this.r = 6 + Math.random() * 8;
    this.d = 15 + Math.random() * 30; // density / weight
    
    // Angle projection
    this.angle = Math.random() * Math.PI * 2;
    this.velocity = 10 + Math.random() * 20;
    this.vx = Math.cos(this.angle) * this.velocity;
    this.vy = Math.sin(this.angle) * this.velocity - (5 + Math.random() * 10); // project upwards initially
    
    // Choose anime palette colors
    const colors = ['#00f0ff', '#ff6d00', '#ff0055', '#ffcc00', '#ffffff'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.opacity = 1;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = -5 + Math.random() * 10;
  }
  
  update() {
    // Apply gravity
    this.vy += 0.4;
    // Air resistance
    this.vx *= 0.98;
    
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    
    // Fade out as it drops down
    if (this.vy > 2) {
      this.opacity -= 0.015;
    }
  }
  
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = Math.max(0, this.opacity);
    
    // Draw small rectangle / streamer shape
    ctx.fillRect(-this.r / 2, -this.r / 2, this.r, this.r / 2);
    ctx.restore();
  }
}

function runConfettiExplosion() {
  confettiParticles = [];
  const particleCount = 150;
  for (let i = 0; i < particleCount; i++) {
    confettiParticles.push(new ConfettiParticle(speedLinesCanvas.width, speedLinesCanvas.height));
  }
  
  confettiActive = true;
  drawConfettiLoop();
}

function drawConfettiLoop() {
  if (!confettiActive) return;
  
  ctx.clearRect(0, 0, speedLinesCanvas.width, speedLinesCanvas.height);
  
  let particlesAlive = false;
  
  confettiParticles.forEach(p => {
    if (p.opacity > 0 && p.y < speedLinesCanvas.height) {
      p.update();
      p.draw();
      particlesAlive = true;
    }
  });
  
  if (particlesAlive) {
    requestAnimationFrame(drawConfettiLoop);
  } else {
    confettiActive = false;
    ctx.clearRect(0, 0, speedLinesCanvas.width, speedLinesCanvas.height);
  }
}


// ================= EVENT LISTENERS =================

// Audio systems
audioToggleBtn.addEventListener('click', toggleMusic);

// Charging button interactions (Mouse & Touch compatible)
chargeBtn.addEventListener('mousedown', handleChargeStart);
chargeBtn.addEventListener('mouseup', handleChargeEnd);
chargeBtn.addEventListener('mouseleave', handleChargeEnd);

chargeBtn.addEventListener('touchstart', (e) => {
  e.preventDefault(); // Prevents double triggers
  handleChargeStart();
});
chargeBtn.addEventListener('touchend', handleChargeEnd);
chargeBtn.addEventListener('touchcancel', handleChargeEnd);

// Dismiss modal
modalCloseBtn.addEventListener('click', () => {
  levelUpModal.classList.remove('active');
  playSoundSynth('whoosh');
});

// Development Switchers (URL override simulation)
devToggleCountdown.addEventListener('click', () => {
  playSoundSynth('whoosh');
  devOverrideMode = 'countdown';
  showCountdownMode();
  updateCountdownTick();
});

devToggleCelebrate.addEventListener('click', () => {
  playSoundSynth('whoosh');
  devOverrideMode = 'celebration';
  showCelebrationMode();
});


// --- NEW FUNCTIONS: SUPER SAIYAN, CLICK SPARKLES, RAMEN FEEDER ---
let isSaiyanMode = false;
let ramenCount = 0;

const ramenPhrases = [
  "Bhai aur laao! 🤤",
  "Ramen is life, saale! ❤️",
  "Paisa tera baap dega? 💸",
  "Carry karne ke baad bhook lagti hai! 🤡",
  "Budhapa me digestion slow ho jata hai! 👵",
  "Abe bas kar, pet phat jayega! 😵",
  "Naruto style speedrun! 🍥",
  "Chakra energy fully charged! ⚡",
  "Spicy level 100! 🌶️",
  "Bill bharna mat bhoolna! 💳"
];

// Click Sparkles Effect
function triggerClickSparkle(e) {
  // Prevent spawning inside interactive button elements to avoid overlay click issues
  if (e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('button')) return;
  
  const sparkle = document.createElement('span');
  sparkle.className = 'click-sparkle-fx';
  
  // Randomly select weeb emoji / action sparkle
  const characters = ['✨', '⭐', '💥', '⚡', '🍥', '🎮', '🔥'];
  sparkle.textContent = characters[Math.floor(Math.random() * characters.length)];
  
  sparkle.style.left = `${e.pageX}px`;
  sparkle.style.top = `${e.pageY}px`;
  
  document.body.appendChild(sparkle);
  
  setTimeout(() => {
    sparkle.remove();
  }, 600);
}

// Super Saiyan Mode Toggle
function toggleSuperSaiyan() {
  isSaiyanMode = !isSaiyanMode;
  
  const statClass = document.getElementById('statClass');
  const statHype = document.getElementById('statHype');
  const statRamen = document.getElementById('statRamen');
  const statLoyalty = document.getElementById('statLoyalty');
  const saiyanBadge = document.getElementById('saiyanBadge');
  
  if (isSaiyanMode) {
    document.body.classList.add('saiyan-mode');
    if (saiyanBadge) saiyanBadge.style.display = 'block';
    playSoundSynth('saiyanCharge');
    
    // Update stats
    if (statClass) statClass.textContent = "SUPER_SAIYAN_GOD 👑";
    if (statHype) statHype.textContent = "OVER 9000000!!! ⚡";
    if (statRamen) statRamen.textContent = "SSS GOD RANK (Free Eaters)";
    if (statLoyalty) statLoyalty.textContent = "9999% (Infinite high-five combo)";
    
    // Temporary flash on the avatar
    const charPortraitBox = document.getElementById('charPortraitBox');
    if (charPortraitBox) {
      charPortraitBox.style.transform = "scale(1.05)";
      setTimeout(() => {
        charPortraitBox.style.transform = "scale(1)";
      }, 150);
    }
  } else {
    document.body.classList.remove('saiyan-mode');
    if (saiyanBadge) saiyanBadge.style.display = 'none';
    playSoundSynth('whoosh');
    
    // Reset stats
    if (statClass) statClass.textContent = "PRO_NOOB / WEEB";
    if (statHype) statHype.textContent = "9999+ (IQ: 0.1)";
    if (statRamen) statRamen.textContent = "SSS RANK (Bills paid: 0)";
    if (statLoyalty) statLoyalty.textContent = "100/100 (Except during gaming)";
  }
}

// Feed Raman Ramen clicker
function feedRamen() {
  ramenCount++;
  const countVal = document.getElementById('ramenCountVal');
  const feedbackText = document.getElementById('ramenFeedbackText');
  
  if (countVal) countVal.textContent = ramenCount;
  playSoundSynth('slurp');
  
  // Select phrase based on quantity
  let phrase = "";
  if (ramenCount > 25) {
    phrase = "ERROR: Stomach capacity overflow! 🚨";
    if (feedbackText) feedbackText.style.color = "var(--magenta)";
  } else if (ramenCount > 15) {
    phrase = "Bhai bas kar! 🐷 (Raman is now sumo rank)";
    if (feedbackText) feedbackText.style.color = "var(--orange)";
  } else {
    phrase = ramenPhrases[(ramenCount - 1) % ramenPhrases.length];
    if (feedbackText) feedbackText.style.color = "var(--blue)";
  }
  
  if (feedbackText) feedbackText.textContent = phrase;
  
  // Spawn a floating ramen emoji at the portrait
  const portrait = document.getElementById('charPortraitBox');
  if (portrait) {
    const floatRamen = document.createElement('span');
    floatRamen.textContent = "🍜";
    floatRamen.style.position = "absolute";
    floatRamen.style.fontSize = "1.5rem";
    floatRamen.style.left = `${20 + Math.random() * 60}%`;
    floatRamen.style.top = `${60}%`;
    floatRamen.style.zIndex = "10";
    floatRamen.style.pointerEvents = "none";
    floatRamen.style.transition = "transform 0.8s ease, opacity 0.8s ease";
    
    portrait.appendChild(floatRamen);
    
    // Animate rising and fading
    setTimeout(() => {
      floatRamen.style.transform = "translateY(-80px) scale(1.5) rotate(15deg)";
      floatRamen.style.opacity = "0";
    }, 10);
    
    setTimeout(() => {
      floatRamen.remove();
    }, 800);
  }
}

// ================= INITIALIZATION =================
window.addEventListener('DOMContentLoaded', () => {
  setupTargetDates();
  runDateCheck();
  
  // Bind new features
  const portrait = document.getElementById('charPortraitBox');
  const feedBtn = document.getElementById('feedRamenBtn');
  
  if (portrait) portrait.addEventListener('click', toggleSuperSaiyan);
  if (feedBtn) feedBtn.addEventListener('click', feedRamen);
  window.addEventListener('click', triggerClickSparkle);
  
  // Set up running interval clock for the live timer
  setInterval(runDateCheck, 1000);
});
