let targetDate = null;
let isRunning = false;
let intervalId = null;
let isDarkMode = true; // Default dark mode
let isSoundEnabled = true;

const elements = {
    dateInput: document.getElementById('date-input'),
    timeInput: document.getElementById('time-input'),
    setTimerBtn: document.getElementById('set-timer'),
    startPauseBtn: document.getElementById('start-pause'),
    resetBtn: document.getElementById('reset'),
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    progressCircles: document.querySelectorAll('.progress')
};

// Initialize from localStorage
const savedTime = localStorage.getItem('countdownTarget');
if(savedTime) targetDate = new Date(JSON.parse(savedTime));

// Event Listeners
elements.setTimerBtn.addEventListener('click', setNewTime);
elements.startPauseBtn.addEventListener('click', toggleTimer);
elements.resetBtn.addEventListener('click', resetTimer);
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
document.getElementById('sound-toggle').addEventListener('click', toggleSound);

function setNewTime() {
    const date = elements.dateInput.value;
    const time = elements.timeInput.value;
    
    if(!date || !time) {
        showModal('Error', 'Please select both date and time');
        return;
    }
    
    targetDate = new Date(`${date}T${time}`);
    if(targetDate < new Date()) {
        showModal('Invalid Time', 'Please select a future date and time');
        return;
    }
    
    localStorage.setItem('countdownTarget', JSON.stringify(targetDate));
    updateDisplay();
    playSound('set');
    if(!isRunning) toggleTimer();
}

function toggleTimer() {
    isRunning = !isRunning;
    elements.startPauseBtn.textContent = isRunning ? '⏸ Pause' : '▶ Start';
    
    if(isRunning) {
        intervalId = setInterval(updateDisplay, 1000);
        playSound('start');
    } else {
        clearInterval(intervalId);
        playSound('pause');
    }
}

function updateDisplay() {
    if(!targetDate) return;
    
    const now = new Date();
    const diff = targetDate - now;
    
    if(diff <= 0) {
        handleComplete();
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    elements.days.textContent = days.toString().padStart(2, '0');
    elements.hours.textContent = hours.toString().padStart(2, '0');
    elements.minutes.textContent = minutes.toString().padStart(2, '0');
    elements.seconds.textContent = seconds.toString().padStart(2, '0');
    
    updateProgress(days, hours, minutes, seconds);
    
    // Progressive sound effect
    if(diff < 60000 && isSoundEnabled) {
        playSound('tick', 1 - (diff / 60000));
    }
}

function updateProgress(d, h, m, s) {
    const maxValues = [365, 24, 60, 60];
    const currentValues = [d, h, m, s];
    
    elements.progressCircles.forEach((circle, index) => {
        const circumference = 2 * Math.PI * 54;
        const progress = 1 - (currentValues[index] / maxValues[index]);
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = circumference * progress;
    });
}

function handleComplete() {
    clearInterval(intervalId);
    isRunning = false;
    elements.startPauseBtn.textContent = '▶ Start';
    localStorage.removeItem('countdownTarget');
    showModal('Time\'s Up!', 'The countdown has finished! 🎉');
    playSound('complete');
    
    if(Notification.permission === 'granted') {
        new Notification('Countdown Complete', {
            body: 'Your timer has finished!',
            icon: 'icon.png'
        });
    }
}

function resetTimer() {
    clearInterval(intervalId);
    isRunning = false;
    targetDate = null;
    localStorage.removeItem('countdownTarget');
    elements.startPauseBtn.textContent = '▶ Start';
    ['days', 'hours', 'minutes', 'seconds'].forEach(id => {
        elements[id].textContent = '00';
    });
    elements.progressCircles.forEach(circle => {
        circle.style.strokeDashoffset = 0;
    });
    playSound('reset');
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    document.getElementById('theme-toggle').textContent = isDarkMode ? '☀️' : '🌙';
    playSound('toggle');
}

function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    document.getElementById('sound-toggle').textContent = isSoundEnabled ? '🔊' : '🔇';
}

function playSound(type, volume = 0.1) {
    if(!isSoundEnabled) return;
    
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    let frequency = 440;
    switch(type) {
        case 'set': frequency = 523.25; break;
        case 'start': frequency = 659.25; break;
        case 'pause': frequency = 392; break;
        case 'reset': frequency = 349.23; break;
        case 'complete': frequency = 784; break;
        case 'toggle': frequency = 587.33; break;
        case 'tick': frequency = 880; break;
    }
    
    osc.type = type === 'tick' ? 'square' : 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
}

function showModal(title, text) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-text').textContent = text;
    document.querySelector('.modal').style.display = 'flex';
    setTimeout(() => {
        document.querySelector('.modal').style.display = 'none';
    }, 3000);
}

// Initial setup
if(targetDate) updateDisplay();
Notification.requestPermission();