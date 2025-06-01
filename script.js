
// Настройки
const settings = {
    ruVoiceEnabled: true,
    speed: 1
};

// Элементы DOM
const elements = {
    title: document.getElementById('story-title'),
    source: document.getElementById('story-source'),
    container: document.getElementById('text-container'),
    ruVoiceCheckbox: document.getElementById('ruVoice'),
    playAllBtn: document.getElementById('playAllBtn'),
    pauseBtn: document.getElementById('pauseBtn')
};

// Инициализация SpeechSynthesis
const synth = window.speechSynthesis;
let voices = [];

// Загрузка данных
async function loadStory() {
    const response = await fetch('bear_and_bee.json');
    return await response.json();
}

// Отрисовка текста
function renderText(story) {
    elements.title.textContent = story.meta.title;
    elements.source.textContent = story.meta.source;
    
    story.content.forEach((item, index) => {
        const block = document.createElement('div');
        block.className = 'text-block';
        
        if (item.timestamp) {
            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            timestamp.textContent = item.timestamp;
            block.appendChild(timestamp);
        }
        
        if (item.en) {
            const enPhrase = document.createElement('div');
            enPhrase.className = 'english';
            
            const playBtn = document.createElement('button');
            playBtn.className = 'play-btn';
            playBtn.textContent = '▶';
            playBtn.onclick = () => speakPhrase(item.en, 'en-US', block);
            
            enPhrase.appendChild(playBtn);
            enPhrase.appendChild(document.createTextNode(item.en));
            block.appendChild(enPhrase);
        }
        
        if (item.ru) {
            const ruPhrase = document.createElement('div');
            ruPhrase.className = 'russian';
            ruPhrase.textContent = item.ru;
            block.appendChild(ruPhrase);
        }
        
        elements.container.appendChild(block);
    });
}

// Озвучивание фразы
function speakPhrase(text, lang, element = null) {
    if (synth.speaking) synth.cancel();
    
    if (element) {
        document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
        element.classList.add('active');
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = settings.speed;
    
    synth.speak(utterance);
}

// Инициализация
async function init() {
    const story = await loadStory();
    renderText(story);
    
    // Обработчики событий
    elements.ruVoiceCheckbox.addEventListener('change', (e) => {
        settings.ruVoiceEnabled = e.target.checked;
    });
    
    elements.playAllBtn.addEventListener('click', playAll);
    elements.pauseBtn.addEventListener('click', () => synth.cancel());
    
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            settings.speed = parseFloat(btn.dataset.speed);
        });
    });
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', init);
