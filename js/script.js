/**
 * Uber Bag Designer - Main Application Script
 */

let currentLanguage = 'en';
let bagImage = null;
let canvas, ctx;
let placedStickers = [];
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let selectedSticker = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('Initializing Uber Bag Designer...');
    
    // Инициализация канваса с правильными размерами
    const canvas = document.getElementById('bagCanvas');
    if (canvas) {
        canvas.width = 430;  // Ширина сумки
        canvas.height = 480; // Высота сумки
    }
    
    // Добавление стилей для анимации наклеек
    addAnimationStyles();
    
    console.log('App initialized successfully');
}

function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .sticker-item {
            opacity: 0;
            transform: scale(0.8);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// Функции выбора языка и переходов
function selectLanguage(lang) {
    currentLanguage = lang;
    updateTexts();
    
    const languageScreen = document.getElementById('languageScreen');
    const designerScreen = document.getElementById('designerScreen');
    
    languageScreen.classList.add('slide-out');
    
    setTimeout(() => {
        languageScreen.classList.remove('active', 'slide-out');
        designerScreen.classList.add('active', 'slide-in');
        initializeDesigner();
    }, 600);
}

function updateTexts() {
    const texts = translations[currentLanguage];
    
    // Обновление всех текстовых элементов
    const elements = [
        'title', 'backText', 'stickersTitle', 'saveText', 
        'successTitle', 'instructionText', 'downloadText', 
        'closeText', 'loadingBag', 'controlTitle', 
        'rotateLabel', 'deleteText', 'deselectText'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element && texts[id]) {
            element.textContent = texts[id];
        }
    });
}

function goBack() {
    const languageScreen = document.getElementById('languageScreen');
    const designerScreen = document.getElementById('designerScreen');
    
    designerScreen.classList.add('slide-out');
    designerScreen.classList.remove('slide-in');
    
    setTimeout(() => {
        designerScreen.classList.remove('active', 'slide-out');
        languageScreen.classList.add('active');
        
        // Сброс состояния
        placedStickers = [];
        selectedSticker = null;
        hideControlPanel();
        
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, 600);
}

// Инициализация дизайнера
function initializeDesigner() {
    canvas = document.getElementById('bagCanvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    setupCanvasEvents();
    setupControls();
    loadBagImage();
    loadStickers();
}

// Настройка контролов
function setupControls() {
    const rotateSlider = document.getElementById('rotateSlider');
    const rotateValue = document.getElementById('rotateValue');
    
    rotateSlider.addEventListener('input', function() {
        if (selectedSticker) {
            selectedSticker.rotation = parseFloat(this.value);
            rotateValue.textContent = this.value + '°';
            redrawCanvas();
        }
    });
}

// Панель управления
function showControlPanel() {
    const controlPanel = document.getElementById('controlPanel');
    controlPanel.style.display = 'block';
    controlPanel.style.animation = 'slideInFromRight 0.3s ease forwards';
    updateControls();
}

function hideControlPanel() {
    const controlPanel = document.getElementById('controlPanel');
    if (controlPanel) {
        controlPanel.style.animation = 'slideOutToLeft 0.3s ease forwards';
        setTimeout(() => {
            controlPanel.style.display = 'none';
        }, 300);
    }
}

function updateControls() {
    if (selectedSticker) {
        const rotateSlider = document.getElementById('rotateSlider');
        const rotateValue = document.getElementById('rotateValue');
        
        if (rotateSlider && rotateValue) {
            rotateSlider.value = selectedSticker.rotation || 0;
            rotateValue.textContent = (selectedSticker.rotation || 0) + '°';
        }
        
        // Показать информацию о размере наклейки
        updateStickerInfo();
    }
}

function updateStickerInfo() {
    if (!selectedSticker) return;
    
    const config = getStickerConfig(selectedSticker.stickerId);
    if (!config) return;
    
    // Добавить или обновить информацию о размере
    let infoElement = document.getElementById('stickerSizeInfo');
    if (!infoElement) {
        infoElement = document.createElement('div');
        infoElement.id = 'stickerSizeInfo';
        infoElement.style.cssText = `
            margin-top: 10px;
            padding: 8px;
            background: linear-gradient(135deg, #46a2e0, #2e7cb8);
            border-radius: 8px;
            color: white;
            font-size: 0.85rem;
            text-align: center;
            border: 1px solid #6bb3e8;
        `;
        const controlPanel = document.getElementById('controlPanel');
        if (controlPanel) {
            controlPanel.appendChild(infoElement);
        }
    }
    
    const sizeText = translations[currentLanguage].stickerInfo || 'Size:';
    infoElement.innerHTML = `
        <strong>${config.name}</strong><br>
        ${sizeText} ${config.width/10}×${config.height/10} см
    `;
}

// Загрузка изображений из репозитория
function loadBagImage() {
    const img = new Image();
    
    img.onload = function() {
        bagImage = img;
        const loadingElement = document.getElementById('loadingBag');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        redrawCanvas();
        console.log('Bag image loaded successfully');
    };
    
    img.onerror = function() {
        console.error('Failed to load bag image');
        const loadingElement = document.getElementById('loadingBag');
        if (loadingElement) {
            loadingElement.textContent = 'Failed to load bag image';
        }
    };
    
    img.src = getBagImagePath();
}

function loadStickers() {
    const stickersList = document.getElementById('stickersList');
    if (stickersList) {
        stickersList.innerHTML = '<div class="loading">Loading stickers...</div>';
    }
    
    const loadedStickers = [];
    let loadedCount = 0;
    let errorCount = 0;
    const totalStickers = APP_CONFIG.MAX_STICKERS;
    
    // Загрузка всех наклеек
    for (let i = 1; i <= totalStickers; i++) {
        const img = new Image();
        
        img.onload = function() {
            loadedStickers.push({
                id: i,
                src: getStickerImagePath(i),
                image: img,
                config: getStickerConfig(i)
            });
            
            loadedCount++;
            checkLoadComplete();
        };
        
        img.onerror = function() {
            errorCount++;
            console.warn(`Sticker ${i} not found`);
            checkLoadComplete();
        };
        
        function checkLoadComplete() {
            if (loadedCount + errorCount >= totalStickers) {
                displayStickers(loadedStickers.sort((a, b) => a.id - b.id));
            }
        }
        
        img.src = getStickerImagePath(i);
    }
}

function displayStickers(stickers) {
    const stickersList = document.getElementById('stickersList');
    if (!stickersList) return;
    
    stickersList.innerHTML = '';
    
    if (stickers.length === 0) {
        stickersList.innerHTML = '<div class="no-stickers">No stickers found</div>';
        return;
    }
    
    stickers.forEach((sticker, index) => {
        const stickerDiv = document.createElement('div');
        stickerDiv.className = 'sticker-item';
        stickerDiv.onclick = () => addStickerToBag(sticker);
        
        // Тултип с информацией о размере
        const config = sticker.config;
        stickerDiv.title = `${config.name}\nРазмер: ${config.width/10}×${config.height/10} см`;
        
        const img = document.createElement('img');
        img.src = sticker.src;
        img.alt = config.name;
        
        stickerDiv.appendChild(img);
        stickersList.appendChild(stickerDiv);
        
        // Анимация появления
        setTimeout(() => {
            stickerDiv.style.opacity = '1';
            stickerDiv.style.transform = 'scale(1)';
        }, index * 100);
    });
    
    console.log(`Loaded ${stickers.length} stickers`);
}

// Функция для добавления наклейки на сумку
function addStickerToBag(sticker) {
    const config = sticker.config;
    const canvasSize = calculateCanvasSize(config.width, config.height);
    
    const placedSticker = {
        image: sticker.image,
        x: canvas.width / 2 - canvasSize.width / 2,
        y: canvas.height / 2 - canvasSize.height / 2,
        width: canvasSize.width,
        height: canvasSize.height,
        rotation: 0,
        id: Date.now(),
        stickerId: sticker.id,
        realWidth: config.width,
        realHeight: config.height,
        type: config.type,
        name: config.name
    };
    
    placedStickers.push(placedSticker);
    selectedSticker = placedSticker;
    showControlPanel();
    redrawCanvas();
    
    if (APP_CONFIG.DEBUG) {
        console.log(`Added sticker: ${config.name}, Real: ${config.width/10}×${config.height/10}cm`);
    }
}

// Функции расчета размеров и масштабирования
function calculateCanvasSize(realWidthMM, realHeightMM) {
    const scaleX = canvas.width / REAL_BAG_SIZE.width;
    const scaleY = canvas.height / REAL_BAG_SIZE.height;
    const scale = Math.min(scaleX, scaleY);
    
    return {
        width: realWidthMM * scale,
        height: realHeightMM * scale
    };
}

function resizeCanvas() {
    if (!canvas) return;
    
    const container = canvas.parentElement;
    const maxWidth = Math.min(container.clientWidth - 60, 500);
    const maxHeight = Math.min(window.innerHeight * 0.6, 500);
    
    const bagAspectRatio = REAL_BAG_SIZE.width / REAL_BAG_SIZE.height;
    
    let canvasWidth, canvasHeight;
    
    if (maxWidth / maxHeight > bagAspectRatio) {
        canvasHeight = maxHeight;
        canvasWidth = canvasHeight * bagAspectRatio;
    } else {
        canvasWidth = maxWidth;
        canvasHeight = canvasWidth / bagAspectRatio;
    }
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    
    redrawCanvas();
}

// Настройка событий канваса
function setupCanvasEvents() {
    // События мыши
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    
    // События касания
    canvas.addEventListener('touchstart', handleStart);
    canvas.addEventListener('touchmove', handleMove);
    canvas.addEventListener('touchend', handleEnd);
    
    // Предотвращение стандартного поведения касаний
    canvas.addEventListener('touchstart', e => e.preventDefault());
    canvas.addEventListener('touchmove', e => e.preventDefault());
}

function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function handleStart(e) {
    e.preventDefault();
    const pos = getEventPos(e);
    
    // Проверяем клик по размещенным наклейкам
    for (let i = placedStickers.length - 1; i >= 0; i--) {
        const sticker = placedStickers[i];
        
        if (isPointInSticker(pos, sticker)) {
            isDragging = true;
            selectedSticker = sticker;
            showControlPanel();
            dragOffset = {
                x: pos.x - sticker.x,
                y: pos.y - sticker.y
            };
            redrawCanvas();
            return;
        }
    }
    
    // Если не кликнули по наклейке, убираем выделение
    if (selectedSticker) {
        deselectSticker();
    }
}

function isPointInSticker(point, sticker) {
    return point.x >= sticker.x && 
           point.x <= sticker.x + sticker.width &&
           point.y >= sticker.y && 
           point.y <= sticker.y + sticker.height;
}

function handleMove(e) {
    e.preventDefault();
    if (isDragging && selectedSticker) {
        const pos = getEventPos(e);
        selectedSticker.x = pos.x - dragOffset.x;
        selectedSticker.y = pos.y - dragOffset.y;
        
        // Удерживаем наклейку в границах канваса
        selectedSticker.x = Math.max(0, Math.min(canvas.width - selectedSticker.width, selectedSticker.x));
        selectedSticker.y = Math.max(0, Math.min(canvas.height - selectedSticker.height, selectedSticker.y));
        
        redrawCanvas();
    }
}

function handleEnd(e) {
    e.preventDefault();
    isDragging = false;
}

// Отрисовка канваса
function redrawCanvas() {
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем изображение сумки
    if (bagImage) {
        ctx.drawImage(bagImage, 0, 0, canvas.width, canvas.height);
    }
    
    // Рисуем размещенные наклейки
    placedStickers.forEach(sticker => {
        ctx.save();
        
        // Перемещаемся в центр наклейки для поворота
        ctx.translate(sticker.x + sticker.width / 2, sticker.y + sticker.height / 2);
        
        // Поворачиваем если нужно
        if (sticker.rotation) {
            ctx.rotate(sticker.rotation * Math.PI / 180);
        }
        
        // Рисуем наклейку от центра
        ctx.drawImage(sticker.image, -sticker.width / 2, -sticker.height / 2, sticker.width, sticker.height);
        
        ctx.restore();
        
        // Подсвечиваем выбранную наклейку
        if (sticker === selectedSticker) {
            ctx.strokeStyle = '#46a2e0';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 4]);
            ctx.strokeRect(sticker.x - 2, sticker.y - 2, sticker.width + 4, sticker.height + 4);
            ctx.setLineDash([]);
            
            // Добавляем угловые маркеры
            const cornerSize = 8;
            ctx.fillStyle = '#46a2e0';
            ctx.fillRect(sticker.x - cornerSize/2, sticker.y - cornerSize/2, cornerSize, cornerSize);
            ctx.fillRect(sticker.x + sticker.width - cornerSize/2, sticker.y - cornerSize/2, cornerSize, cornerSize);
            ctx.fillRect(sticker.x - cornerSize/2, sticker.y + sticker.height - cornerSize/2, cornerSize, cornerSize);
            ctx.fillRect(sticker.x + sticker.width - cornerSize/2, sticker.y + sticker.height - cornerSize/2, cornerSize, cornerSize);
        }
    });
}

// Функции управления наклейками
function deleteSelectedSticker() {
    if (selectedSticker) {
        const index = placedStickers.indexOf(selectedSticker);
        if (index > -1) {
            placedStickers.splice(index, 1);
            selectedSticker = null;
            hideControlPanel();
            redrawCanvas();
        }
    }
}

function deselectSticker() {
    selectedSticker = null;
    hideControlPanel();
    redrawCanvas();
}

// Сохранение дизайна
function saveBag(event) {
    // Предотвращаем стандартное поведение кнопки
    if (event) {
        event.preventDefault();
    }
    
    const saveBtn = document.getElementById('saveBtn');
    const saveText = document.getElementById('saveText');
    
    if (saveBtn) saveBtn.disabled = true;
    if (saveText) saveText.textContent = 'Saving...';
    
    // Создаем финальное изображение в высоком разрешении
    const finalCanvas = document.createElement('canvas');
    const pixelsPerMM = APP_CONFIG.CANVAS_QUALITY || 2;
    finalCanvas.width = REAL_BAG_SIZE.width * pixelsPerMM;
    finalCanvas.height = REAL_BAG_SIZE.height * pixelsPerMM;
    const finalCtx = finalCanvas.getContext('2d');
    
    // Рисуем сумку в высоком разрешении
    if (bagImage) {
        finalCtx.drawImage(bagImage, 0, 0, finalCanvas.width, finalCanvas.height);
    }
    
    // Масштабируем и рисуем наклейки в финальном разрешении
    placedStickers.forEach(sticker => {
        finalCtx.save();
        
        // Рассчитываем финальную позицию и размер
        const finalX = (sticker.x / canvas.width) * finalCanvas.width;
        const finalY = (sticker.y / canvas.height) * finalCanvas.height;
        const finalWidth = sticker.realWidth * pixelsPerMM;
        const finalHeight = sticker.realHeight * pixelsPerMM;
        
        finalCtx.translate(finalX + finalWidth / 2, finalY + finalHeight / 2);
        
        if (sticker.rotation) {
            finalCtx.rotate(sticker.rotation * Math.PI / 180);
        }
        
        finalCtx.drawImage(sticker.image, -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight);
        
        finalCtx.restore();
    });
    
    // Конвертируем в blob для скачивания
    finalCanvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        window.designImageUrl = url;
        
        if (saveBtn) saveBtn.disabled = false;
        if (saveText && translations[currentLanguage]) {
            saveText.textContent = translations[currentLanguage].saveText;
        }
        
        showResultModal();
    }, 'image/png');
    
    return false;
}

function downloadImage() {
    if (window.designImageUrl) {
        const link = document.createElement('a');
        link.download = 'uber-bag-design.png';
        link.href = window.designImageUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Модальные окна
function showResultModal() {
    const modal = document.getElementById('resultModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal() {
    const modal = document.getElementById('resultModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Добавить в showResultModal()
function showResultModal() {
    const modal = document.getElementById('resultModal');
    if (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    }
}

// Добавить в closeModal()
function closeModal() {
    const modal = document.getElementById('resultModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}
