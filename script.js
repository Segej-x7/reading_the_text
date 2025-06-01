
// Состояние приложения
const appState = {
  currentText: {},
  enSpeed: 1,
  ruSpeed: 1,
  isPlaying: false,
  currentIndex: 0,
  speechSynthesis: window.speechSynthesis,
  voices: [],
  voiceLoaded: false
};

// DOM элементы
const elements = {
  titleEl: document.getElementById('story-title'),
  sourceEl: document.getElementById('story-source'),
  contentEl: document.getElementById('content-display'),
  enSpeedInput: document.getElementById('en-speed'),
  ruSpeedInput: document.getElementById('ru-speed'),
  enSpeedValue: document.getElementById('en-speed-value'),
  ruSpeedValue: document.getElementById('ru-speed-value'),
  playBtn: document.getElementById('play-btn'),
  pauseBtn: document.getElementById('pause-btn')
};

// Инициализация голосов
function initVoices() {
  return new Promise((resolve) => {
    // Для Chrome и Edge
    if (appState.speechSynthesis.onvoiceschanged !== undefined) {
      appState.speechSynthesis.onvoiceschanged = () => {
        appState.voices = appState.speechSynthesis.getVoices();
        appState.voiceLoaded = true;
        resolve();
      };
    } 
    // Для Safari и Firefox
    else {
      const checkVoices = setInterval(() => {
        appState.voices = appState.speechSynthesis.getVoices();
        if (appState.voices.length > 0) {
          clearInterval(checkVoices);
          appState.voiceLoaded = true;
          resolve();
        }
      }, 100);
    }
    
    // На всякий случай сразу проверим
    appState.voices = appState.speechSynthesis.getVoices();
    if (appState.voices.length > 0) {
      appState.voiceLoaded = true;
      resolve();
    }
  });
}

// Загрузка текста
async function loadText() {
  try {
    const response = await fetch('bear_and_bee.json');
    appState.currentText = await response.json();
    elements.titleEl.textContent = appState.currentText.meta.title;
    elements.sourceEl.textContent = appState.currentText.meta.source;
    renderText();
    
    // Инициализируем голоса после загрузки текста
    await initVoices();
    console.log('Voices loaded:', appState.voices);
  } catch (error) {
    console.error('Error loading text:', error);
  }
}

// Отрисовка текста
function renderText() {
  elements.contentEl.innerHTML = '';
  appState.currentText.content.forEach((item, index) => {
    if (item.timestamp) {
      const timestampEl = document.createElement('div');
      timestampEl.className = 'timestamp';
      timestampEl.textContent = item.timestamp;
      elements.contentEl.appendChild(timestampEl);
    }
    
    if (item.en) {
      const enEl = document.createElement('div');
      enEl.className = 'english';
      enEl.textContent = item.en;
      elements.contentEl.appendChild(enEl);
    }
    
    if (item.ru) {
      const ruEl = document.createElement('div');
      ruEl.className = 'russian';
      ruEl.textContent = item.ru;
      elements.contentEl.appendChild(ruEl);
    }
    
    if (index < appState.currentText.content.length - 1) {
      const divider = document.createElement('div');
      divider.className = 'divider';
      elements.contentEl.appendChild(divider);
    }
  });
}

// Воспроизведение текста
function playText() {
  if (appState.isPlaying) return;
  
  // Проверка поддержки API
  if (!appState.speechSynthesis) {
    alert('Ваш браузер не поддерживает синтез речи. Попробуйте Chrome, Edge или Safari.');
    return;
  }
  
  // Проверка загрузки голосов
  if (!appState.voiceLoaded) {
    alert('Голоса еще загружаются. Пожалуйста, подождите...');
    return;
  }
  
  appState.isPlaying = true;
  appState.currentIndex = 0;
  
  speakNext();
}

function speakNext() {
  if (!appState.isPlaying || appState.currentIndex >= appState.currentText.content.length) {
    appState.isPlaying = false;
    return;
  }
  
  const currentItem = appState.currentText.content[appState.currentIndex];
  
  // Создаем очередь для произношения
  const utterances = [];
  
  if (currentItem.en) {
    const utteranceEn = new SpeechSynthesisUtterance(currentItem.en);
    utteranceEn.lang = 'en-US';
    utteranceEn.rate = appState.enSpeed;
    utteranceEn.voice = findVoice('en-US');
    utterances.push(utteranceEn);
  }
  
  if (currentItem.ru) {
    const utteranceRu = new SpeechSynthesisUtterance(currentItem.ru);
    utteranceRu.lang = 'ru-RU';
    utteranceRu.rate = appState.ruSpeed;
    utteranceRu.voice = findVoice('ru-RU');
    utterances.push(utteranceRu);
  }
  
  // Произносим все utterance для текущего элемента
  let lastUtterance = null;
  utterances.forEach((utterance, i) => {
    if (i === utterances.length - 1) {
      lastUtterance = utterance;
      utterance.onend = () => {
        appState.currentIndex++;
        speakNext();
      };
    }
    appState.speechSynthesis.speak(utterance);
  });
  
  // Если не было utterance (например, только timestamp)
  if (utterances.length === 0) {
    appState.currentIndex++;
    setTimeout(speakNext, 500); // Небольшая пауза
  }
}

// Поиск подходящего голоса
function findVoice(lang) {
  const preferredVoices = appState.voices.filter(v => v.lang === lang);
  if (preferredVoices.length > 0) return preferredVoices[0];
  
  // Попробуем найти похожий голос
  const similarVoices = appState.voices.filter(v => v.lang.startsWith(lang.substring(0, 2)));
  if (similarVoices.length > 0) return similarVoices[0];
  
  // Вернем первый доступный голос
  return appState.voices[0];
}

function pauseText() {
  appState.isPlaying = false;
  appState.speechSynthesis.cancel();
}

// Обработчики событий
elements.enSpeedInput.addEventListener('input', () => {
  appState.enSpeed = parseFloat(elements.enSpeedInput.value);
  elements.enSpeedValue.textContent = `${appState.enSpeed}x`;
});

elements.ruSpeedInput.addEventListener('input', () => {
  appState.ruSpeed = parseFloat(elements.ruSpeedInput.value);
  elements.ruSpeedValue.textContent = `${appState.ruSpeed}x`;
});

elements.playBtn.addEventListener('click', playText);
elements.pauseBtn.addEventListener('click', pauseText);

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  loadText();
  
  // Для Safari нужно инициализировать голоса при взаимодействии с пользователем
  document.body.addEventListener('click', () => {
    if (!appState.voiceLoaded) {
      initVoices();
    }
  }, { once: true });
});
