/**
 * Uber Bag Designer - Enhanced Version with Direct Canvas Rotation
 */

let currentLanguage = 'en';
let bagImage = null;
let canvas, ctx;
let placedStickers = [];
let isDragging = false;
let isRotating = false;
let dragOffset = { x: 0, y: 0 };
let rotationStartAngle = 0;
let selectedSticker = null;
let lastTouchTime = 0;
let touchStartDistance = 0;
let previewCanvas = null;
let previewCtx = null;

// Enhanced canvas settings for better quality
const CANVAS_SETTINGS = {
    pixelRatio: window.devicePixelRatio || 1,
    quality: 2, // Higher quality multiplier
    smoothing: true
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('Initializing Enhanced Uber Bag Designer...');
    
    // Инициализация канваса с улучшенным качеством
    const canvas = document.getElementById('bagCanvas');
    if (canvas) {
        setupHighQualityCanvas(canvas);
    }
    
    // Создание превью канваса
    createPreviewCanvas();
    
    // Добавление стилей для анимации наклеек
    addAnimationStyles();
    
    console.log('Enhanced app initialized successfully');
}

function setupHighQualityCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = CANVAS_SETTINGS.pixelRatio * CANVAS_SETTINGS.quality;
    
    // Устанавливаем размеры с учетом pixelRatio
    canvas.width = 430 * pixelRatio;
    canvas.height = 480 * pixelRatio;
    
    // Масштабируем стили для корректного отображения
    canvas.style.width = '430px';
    canvas.style.height = '480px';
    
    const ctx = canvas.getContext('2d');
    ctx.scale(pixelRatio, pixelRatio);
    
    // Улучшаем качество отрисовки
    ctx.imageSmoothingEnabled = CANVAS_SETTINGS.smoothing;
    ctx.imageSmoothingQuality = 'high';
    ctx.textRenderingOptimization = 'optimizeQuality';
}

function createPreviewCanvas() {
    previewCanvas = document.createElement('canvas');
    previewCtx = previewCanvas.getContext('2d');
    
    // Высокое разрешение для превью
    const pixelsPerMM = 4;
    previewCanvas.width = REAL_BAG_SIZE.width * pixelsPerMM;
    previewCanvas.height = REAL_BAG_SIZE.height * pixelsPerMM;
    
    previewCtx.imageSmoothingEnabled = true;
    previewCtx.imageSmoothingQuality = 'high';
}

function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .sticker-item {
            opacity: 0;
            transform: scale(0.8);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .preview-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1001;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .preview-modal.active {
            display: flex;
            opacity: 1;
        }
        
        .preview-content {
            max-width: 90%;
            max-height: 90%;
            position: relative;
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        
        .preview-image {
            max-width: 100%;
            max-height: 70vh;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .preview-controls {
            margin-top: 15px;
            text-align: center;
        }
        
        .preview-btn {
            background: #46a2e0;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 25px;
            margin: 0 10px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        .preview-btn:hover {
            background: #357ABD;
            transform: translateY(-2px);
        }
        
        .rotation-indicator {
            position: absolute;
            width: 40px;
            height: 40px;
            border: 3px solid #46a2e0;
            border-radius: 50%;
            border-top-color: transparent;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .rotation-indicator.active {
            opacity: 1;
        }
        
        .touch-hint {
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(70, 162, 224, 0.9);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }
        
        .touch-hint.show {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
}

// Функции выбора языка и переходов (без изменений)
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
        
        placedStickers = [];
        selectedSticker = null;
        hideControlPanel();
        
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality, 
                         canvas.height / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality);
        }
    }, 600);
}

function initializeDesigner() {
    canvas = document.getElementById('bagCanvas');
    ctx = canvas.getContext('2d');
    
    setupHighQualityCanvas(canvas);
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    setupEnhancedCanvasEvents();
    setupControls();
    loadBagImage();
    loadStickers();
    
    // Добавляем UI элементы для улучшенного взаимодействия
    addCanvasUIElements();
}

function addCanvasUIElements() {
    const bagContainer = document.querySelector('.bag-container');
    
    // Индикатор вращения
    const rotationIndicator = document.createElement('div');
    rotationIndicator.className = 'rotation-indicator';
    rotationIndicator.id = 'rotationIndicator';
    bagContainer.appendChild(rotationIndicator);
    
    // Подсказка для сенсорного управления
    const touchHint = document.createElement('div');
    touchHint.className = 'touch-hint';
    touchHint.id = 'touchHint';
    touchHint.textContent = 'Tap to select, drag to move, two fingers to rotate';
    bagContainer.appendChild(touchHint);
    
    // Кнопка превью
    const previewBtn = document.createElement('button');
    previewBtn.className = 'preview-btn';
    previewBtn.innerHTML = '🔍 Preview';
    previewBtn.onclick = showPreview;
    previewBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(70, 162, 224, 0.9);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 12px;
        z-index: 100;
    `;
    bagContainer.appendChild(previewBtn);
}

// Улучшенные события канваса с поддержкой вращения
function setupEnhancedCanvasEvents() {
    // События мыши
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('wheel', handleWheel);
    
    // События касания
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Предотвращение стандартного поведения
    canvas.addEventListener('touchstart', e => e.preventDefault());
    canvas.addEventListener('touchmove', e => e.preventDefault());
    canvas.addEventListener('contextmenu', e => e.preventDefault());
}

function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = (canvas.width / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality) / rect.width;
    const scaleY = (canvas.height / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality) / rect.height;
    
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

function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function getTouchAngle(touches, centerX, centerY) {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const midX = (touch1.clientX + touch2.clientX) / 2;
    const midY = (touch1.clientY + touch2.clientY) / 2;
    
    return Math.atan2(midY - centerY, midX - centerX);
}

function handleTouchStart(e) {
    e.preventDefault();
    const currentTime = Date.now();

    if (e.touches.length === 1) {
        const pos = getEventPos(e);
        handleSingleTouchStart(pos, currentTime);
    } else if (e.touches.length === 2 && selectedSticker) {
        // Проверяем, что касание в области значка поворота
        const pos = getEventPos(e);
        const stickerCenterX = selectedSticker.x + selectedSticker.width / 2;
        const stickerCenterY = selectedSticker.y + selectedSticker.height / 2;
        const rotationZoneX = stickerCenterX + selectedSticker.width / 2 + 10;
        const rotationZoneY = stickerCenterY + selectedSticker.height / 2 + 10;
        
        const distance = Math.sqrt(
            Math.pow(pos.x - rotationZoneX, 2) + 
            Math.pow(pos.y - rotationZoneY, 2)
        );

        if (distance <= 20) {  // Радиус зоны касания
            handleRotationStart(e.touches);
        }
    }
}

function handleSingleTouchStart(pos, currentTime) {
    // Проверка на двойное касание
    if (currentTime - lastTouchTime < 300 && selectedSticker) {
        // Двойное касание - показать превью
        showStickerPreview();
        return;
    }
    
    lastTouchTime = currentTime;
    
    // Поиск наклейки под касанием
    for (let i = placedStickers.length - 1; i >= 0; i--) {
        const sticker = placedStickers[i];
        
        if (isPointInSticker(pos, sticker)) {
            isDragging = true;
            selectedSticker = sticker;
            showControlPanel();
            showTouchHint();
            
            dragOffset = {
                x: pos.x - sticker.x,
                y: pos.y - sticker.y
            };
            redrawCanvas();
            return;
        }
    }
    
    // Если не попали по наклейке
    if (selectedSticker) {
        deselectSticker();
    }
}

function handleRotationStart(touches) {
    isRotating = true;
    isDragging = false;
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + selectedSticker.x + selectedSticker.width / 2;
    const centerY = rect.top + selectedSticker.y + selectedSticker.height / 2;
    
    rotationStartAngle = getTouchAngle(touches, centerX, centerY) - (selectedSticker.rotation * Math.PI / 180);
    
    showRotationIndicator();
}

function handleTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging && selectedSticker) {
        // Перетаскивание
        const pos = getEventPos(e);
        selectedSticker.x = pos.x - dragOffset.x;
        selectedSticker.y = pos.y - dragOffset.y;
        
        // Ограничиваем перемещение границами канваса
        const canvasWidth = canvas.width / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality;
        const canvasHeight = canvas.height / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality;
        
        selectedSticker.x = Math.max(0, Math.min(canvasWidth - selectedSticker.width, selectedSticker.x));
        selectedSticker.y = Math.max(0, Math.min(canvasHeight - selectedSticker.height, selectedSticker.y));
        
        redrawCanvas();
    } else if (e.touches.length === 2 && isRotating && selectedSticker) {
        // Вращение
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.left + selectedSticker.x + selectedSticker.width / 2;
        const centerY = rect.top + selectedSticker.y + selectedSticker.height / 2;
        
        const currentAngle = getTouchAngle(e.touches, centerX, centerY);
        selectedSticker.rotation = ((currentAngle - rotationStartAngle) * 180 / Math.PI) % 360;
        
        if (selectedSticker.rotation < 0) {
            selectedSticker.rotation += 360;
        }
        
        updateRotationIndicator();
        updateControls();
        redrawCanvas();
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    
    if (e.touches.length === 0) {
        isDragging = false;
        isRotating = false;
        hideRotationIndicator();
        hideTouchHint();
    } else if (e.touches.length === 1 && isRotating) {
        // Переход от вращения к перетаскиванию
        isRotating = false;
        hideRotationIndicator();
        
        if (selectedSticker) {
            const pos = getEventPos(e);
            isDragging = true;
            dragOffset = {
                x: pos.x - selectedSticker.x,
                y: pos.y - selectedSticker.y
            };
        }
    }
}

// Обработка колесика мыши для вращения
function handleWheel(e) {
    if (selectedSticker && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        
        const rotationSpeed = 2;
        selectedSticker.rotation += e.deltaY > 0 ? rotationSpeed : -rotationSpeed;
        selectedSticker.rotation = selectedSticker.rotation % 360;
        
        if (selectedSticker.rotation < 0) {
            selectedSticker.rotation += 360;
        }
        
        updateControls();
        redrawCanvas();
    }
}

// Обработчики для мыши (упрощенные)
function handleStart(e) {
    const pos = getEventPos(e);
    handleSingleTouchStart(pos, Date.now());
}

function handleMove(e) {
    if (isDragging && selectedSticker) {
        const pos = getEventPos(e);
        selectedSticker.x = pos.x - dragOffset.x;
        selectedSticker.y = pos.y - dragOffset.y;
        
        const canvasWidth = canvas.width / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality;
        const canvasHeight = canvas.height / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality;
        
        selectedSticker.x = Math.max(0, Math.min(canvasWidth - selectedSticker.width, selectedSticker.x));
        selectedSticker.y = Math.max(0, Math.min(canvasHeight - selectedSticker.height, selectedSticker.y));
        
        redrawCanvas();
    }
}

function handleEnd(e) {
    isDragging = false;
    isRotating = false;
    hideRotationIndicator();
}

// UI Helper functions
function showTouchHint() {
    const hint = document.getElementById('touchHint');
    if (hint) {
        hint.classList.add('show');
        setTimeout(() => {
            hint.classList.remove('show');
        }, 2000);
    }
}

function hideTouchHint() {
    const hint = document.getElementById('touchHint');
    if (hint) {
        hint.classList.remove('show');
    }
}

function showRotationIndicator() {
    const indicator = document.getElementById('rotationIndicator');
    if (indicator && selectedSticker) {
        const rect = canvas.getBoundingClientRect();
        const centerX = selectedSticker.x + selectedSticker.width / 2;
        const centerY = selectedSticker.y + selectedSticker.height / 2;
        
        indicator.style.left = (rect.left + centerX - 20) + 'px';
        indicator.style.top = (rect.top + centerY - 20) + 'px';
        indicator.classList.add('active');
    }
}

function updateRotationIndicator() {
    const indicator = document.getElementById('rotationIndicator');
    if (indicator && selectedSticker) {
        indicator.style.transform = `rotate(${selectedSticker.rotation}deg)`;
    }
}

function hideRotationIndicator() {
    const indicator = document.getElementById('rotationIndicator');
    if (indicator) {
        indicator.classList.remove('active');
    }
}

// Функция превью в высоком качестве
function showPreview() {
    if (placedStickers.length === 0) {
        alert('Add some stickers first!');
        return;
    }
    
    // Создаем модальное окно превью
    let previewModal = document.getElementById('previewModal');
    if (!previewModal) {
        previewModal = document.createElement('div');
        previewModal.id = 'previewModal';
        previewModal.className = 'preview-modal';
        previewModal.innerHTML = `
            <div class="preview-content">
                <h3>High Quality Preview</h3>
                <img id="previewImage" class="preview-image" />
                <div class="preview-controls">
                    <button class="preview-btn" onclick="downloadPreview()">Download HD</button>
                    <button class="preview-btn" onclick="closePreview()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(previewModal);
    }
    
    // Генерируем превью в высоком качестве
    generateHighQualityPreview().then(imageUrl => {
        const previewImage = document.getElementById('previewImage');
        previewImage.src = imageUrl;
        previewModal.classList.add('active');
        window.currentPreviewUrl = imageUrl;
    });
}

function generateHighQualityPreview() {
    return new Promise((resolve) => {
        // Очищаем превью канвас
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        
        // Рисуем сумку в высоком разрешении
        if (bagImage) {
            previewCtx.drawImage(bagImage, 0, 0, previewCanvas.width, previewCanvas.height);
        }
        
        // Рисуем наклейки в высоком качестве
        const pixelsPerMM = 4;
        const canvasWidth = canvas.width / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality;
        const canvasHeight = canvas.height / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality;
        
        placedStickers.forEach(sticker => {
            previewCtx.save();
            
            // Масштабируем позицию и размер для превью
            const previewX = (sticker.x / canvasWidth) * previewCanvas.width;
            const previewY = (sticker.y / canvasHeight) * previewCanvas.height;
            const previewWidth = sticker.realWidth * pixelsPerMM;
            const previewHeight = sticker.realHeight * pixelsPerMM;
            
            previewCtx.translate(previewX + previewWidth / 2, previewY + previewHeight / 2);
            
            if (sticker.rotation) {
                previewCtx.rotate(sticker.rotation * Math.PI / 180);
            }
            
            previewCtx.drawImage(sticker.image, -previewWidth / 2, -previewHeight / 2, previewWidth, previewHeight);
            previewCtx.restore();
        });
        
        previewCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            resolve(url);
        }, 'image/png');
    });
}

function downloadPreview() {
    if (window.currentPreviewUrl) {
        const link = document.createElement('a');
        link.download = 'uber-bag-hd-preview.png';
        link.href = window.currentPreviewUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function closePreview() {
    const previewModal = document.getElementById('previewModal');
    if (previewModal) {
        previewModal.classList.remove('active');
    }
    
    // Очищаем URL для освобождения памяти
    if (window.currentPreviewUrl) {
        URL.revokeObjectURL(window.currentPreviewUrl);
        window.currentPreviewUrl = null;
    }
}

// Остальные функции остаются без изменений, но с улучшенной отрисовкой
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
            rotateValue.textContent = Math.round(selectedSticker.rotation || 0) + '°';
        }
        
        updateStickerInfo();
    }
}

function updateStickerInfo() {
    if (!selectedSticker) return;
    
    const config = getStickerConfig(selectedSticker.stickerId);
    if (!config) return;
    
    let infoElement = document.getElementById('stickerSizeInfo');
    if (!infoElement) {
        infoElement = document.createElement('div');
        infoElement.id = 'stickerSizeInfo';
        infoElement.style.cssText = `
            display: block;
            margin-top: 10px;
            padding: 8px;
            background: #f0f0f0;
            border-radius: 5px;
            font-size: 12px;
        `;
        const controlPanel = document.getElementById('controlPanel');
        if (controlPanel) {
            controlPanel.appendChild(infoElement);
        }
    }
    
    const sizeText = translations[currentLanguage].stickerInfo || 'Size:';
    infoElement.innerHTML = `
        <strong>${config.name}</strong><br>
        ${sizeText} ${config.width/10}×${config.height/10} см<br>
        Rotation: ${Math.round(selectedSticker.rotation || 0)}°
    `;
}

// Загрузка изображений
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
        
        const config = sticker.config;
        stickerDiv.title = `${config.name}\nSize: ${config.width/10}×${config.height/10} cm`;
        
        const img = document.createElement('img');
        img.src = sticker.src;
        img.alt = config.name;
        
        stickerDiv.appendChild(img);
        stickersList.appendChild(stickerDiv);
        
        setTimeout(() => {
            stickerDiv.style.opacity = '1';
            stickerDiv.style.transform = 'scale(1)';
        }, index * 100);
    });
    
    console.log(`Loaded ${stickers.length} stickers`);
}

function addStickerToBag(sticker) {
    const config = sticker.config;
    const canvasSize = calculateCanvasSize(config.width, config.height);
    
    const canvasWidth = canvas.width / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality;
    const canvasHeight = canvas.height / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality;
    
    const placedSticker = {
        image: sticker.image,
        x: canvasWidth / 2 - canvasSize.width / 2,
        y: canvasHeight / 2 - canvasSize.height / 2,
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

function calculateCanvasSize(realWidthMM, realHeightMM) {
    const canvasWidth = canvas.width / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality;
    const canvasHeight = canvas.height / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality;
    
    const scaleX = canvasWidth / REAL_BAG_SIZE.width;
    const scaleY = canvasHeight / REAL_BAG_SIZE.height;
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
    
    // Обновляем размеры с учетом качества
    const pixelRatio = CANVAS_SETTINGS.pixelRatio * CANVAS_SETTINGS.quality;
    
    canvas.width = canvasWidth * pixelRatio;
    canvas.height = canvasHeight * pixelRatio;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    
    // Обновляем контекст
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingEnabled = CANVAS_SETTINGS.smoothing;
    ctx.imageSmoothingQuality = 'high';
    
    redrawCanvas();
}

function isPointInSticker(point, sticker) {
    if (sticker.rotation === 0) {
        return point.x >= sticker.x && 
               point.x <= sticker.x + sticker.width &&
               point.y >= sticker.y && 
               point.y <= sticker.y + sticker.height;
    }
    
    // Для повернутых наклеек нужна более сложная проверка
    const centerX = sticker.x + sticker.width / 2;
    const centerY = sticker.y + sticker.height / 2;
    
    // Поворачиваем точку в обратную сторону
    const cos = Math.cos(-sticker.rotation * Math.PI / 180);
    const sin = Math.sin(-sticker.rotation * Math.PI / 180);
    
    const translatedX = point.x - centerX;
    const translatedY = point.y - centerY;
    
    const rotatedX = translatedX * cos - translatedY * sin;
    const rotatedY = translatedX * sin + translatedY * cos;
    
    const rectX = rotatedX + centerX - sticker.width / 2;
    const rectY = rotatedY + centerY - sticker.height / 2;
    
    return rectX >= sticker.x && 
           rectX <= sticker.x + sticker.width &&
           rectY >= sticker.y && 
           rectY <= sticker.y + sticker.height;
}

function redrawCanvas() {
    if (!canvas || !ctx) return;
    const canvasWidth = canvas.width / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality;
    const canvasHeight = canvas.height / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (bagImage) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bagImage, 0, 0, canvasWidth, canvasHeight);
    }

    placedStickers.forEach(sticker => {
        ctx.save();
        ctx.translate(sticker.x + sticker.width / 2, sticker.y + sticker.height / 2);
        
        if (sticker.rotation) {
            ctx.rotate(sticker.rotation * Math.PI / 180);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(sticker.image, -sticker.width / 2, -sticker.height / 2, sticker.width, sticker.height);
        ctx.restore();

        if (sticker === selectedSticker) {
            ctx.save();
            ctx.translate(sticker.x + sticker.width / 2, sticker.y + sticker.height / 2);
            
            if (sticker.rotation) {
                ctx.rotate(sticker.rotation * Math.PI / 180);
            }

            ctx.strokeStyle = '#46a2e0';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);
            ctx.strokeRect(-sticker.width / 2 - 3, -sticker.height / 2 - 3,
                          sticker.width + 6, sticker.height + 6);
            ctx.setLineDash([]);

            // Добавляем значок поворота в правый нижний угол
            ctx.beginPath();
            ctx.fillStyle = '#46a2e0';
            ctx.arc(sticker.width / 2 + 10, sticker.height / 2 + 10, 8, 0, 2 * Math.PI);
            ctx.fill();

            // Рисуем два пальца для индикации поворота
            ctx.beginPath();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.moveTo(sticker.width / 2 + 6, sticker.height / 2 + 14);
            ctx.lineTo(sticker.width / 2 + 14, sticker.height / 2 + 6);
            ctx.stroke();

            ctx.restore();
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
    hideRotationIndicator();
    redrawCanvas();
}

// Улучшенное сохранение дизайна
function saveBag(event) {
    if (event) {
        event.preventDefault();
    }
    
    const saveBtn = document.getElementById('saveBtn');
    const saveText = document.getElementById('saveText');
    
    if (saveBtn) saveBtn.disabled = true;
    if (saveText) saveText.textContent = 'Saving...';
    
    // Создаем финальное изображение в сверхвысоком разрешении
    const finalCanvas = document.createElement('canvas');
    const pixelsPerMM = APP_CONFIG.CANVAS_QUALITY || 3;
    finalCanvas.width = REAL_BAG_SIZE.width * pixelsPerMM;
    finalCanvas.height = REAL_BAG_SIZE.height * pixelsPerMM;
    const finalCtx = finalCanvas.getContext('2d');
    
    // Настройки высокого качества для финального рендера
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    
    // Рисуем сумку в высоком разрешении
    if (bagImage) {
        finalCtx.drawImage(bagImage, 0, 0, finalCanvas.width, finalCanvas.height);
    }
    
    // Масштабируем и рисуем наклейки в финальном разрешении
    const canvasWidth = canvas.width / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality;
    const canvasHeight = canvas.height / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality;
    
    placedStickers.forEach(sticker => {
        finalCtx.save();
        
        // Рассчитываем финальную позицию и размер
        const finalX = (sticker.x / canvasWidth) * finalCanvas.width;
        const finalY = (sticker.y / canvasHeight) * finalCanvas.height;
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
    }, 'image/png', 0.95);
    
    return false;
}

function downloadImage() {
    if (window.designImageUrl) {
        const link = document.createElement('a');
        link.download = 'uber-bag-design-hd.png';
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
        document.body.classList.add('modal-open');
    }
}

function closeModal() {
    const modal = document.getElementById('resultModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

// Дополнительная функция для показа превью отдельной наклейки
function showStickerPreview() {
    if (!selectedSticker) return;
    
    const previewSize = 200;
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = previewSize;
    previewCanvas.height = previewSize;
    const previewCtx = previewCanvas.getContext('2d');
    
    previewCtx.imageSmoothingEnabled = true;
    previewCtx.imageSmoothingQuality = 'high';
    previewCtx.fillStyle = '#f0f0f0';
    previewCtx.fillRect(0, 0, previewSize, previewSize);
    
    // Центрируем и масштабируем наклейку
    const scale = Math.min(previewSize / selectedSticker.width, previewSize / selectedSticker.height) * 0.8;
    const x = previewSize / 2;
    const y = previewSize / 2;
    
    previewCtx.save();
    previewCtx.translate(x, y);
    previewCtx.rotate(selectedSticker.rotation * Math.PI / 180);
    previewCtx.drawImage(
        selectedSticker.image, 
        -selectedSticker.width * scale / 2, 
        -selectedSticker.height * scale / 2,
        selectedSticker.width * scale,
        selectedSticker.height * scale
    );
    previewCtx.restore();
    
    // Показываем превью во всплывающем окне
    previewCanvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const popup = window.open('', '_blank', 'width=250,height=300');
        popup.document.write(`
            <html>
                <head><title>Sticker Preview</title></head>
                <body style="margin:0; padding:20px; text-align:center; font-family:Arial;">
                    <h3>${selectedSticker.name}</h3>
                    <img src="${url}" style="border:1px solid #ccc; border-radius:8px;">
                    <p>Size: ${selectedSticker.realWidth/10}×${selectedSticker.realHeight/10} cm</p>
                    <p>Rotation: ${Math.round(selectedSticker.rotation)}°</p>
                </body>
            </html>
        `);
        
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    });
}

// Обработка ошибок и отладка
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
    
    if (APP_CONFIG.DEBUG) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #ff4444;
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
            font-size: 12px;
        `;
        errorDiv.textContent = `Error: ${e.error.message}`;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 5000);
    }
});

// Автосохранение состояния (опционально)
function saveState() {
    if (typeof(Storage) !== "undefined") {
        const state = {
            placedStickers: placedStickers.map(sticker => ({
                ...sticker,
                image: null // Не сохраняем image object
            })),
            selectedStickerId: selectedSticker ? selectedSticker.id : null,
            language: currentLanguage
        };
        
        try {
            localStorage.setItem('uberBagDesignerState', JSON.stringify(state));
        } catch(e) {
            console.warn('Could not save state to localStorage:', e);
        }
    }
}

function loadState() {
    if (typeof(Storage) !== "undefined") {
        try {
            const savedState = localStorage.getItem('uberBagDesignerState');
            if (savedState) {
                const state = JSON.parse(savedState);
                // Можно реализовать восстановление состояния при необходимости
                console.log('Found saved state:', state);
            }
        } catch(e) {
            console.warn('Could not load state from localStorage:', e);
        }
    }
}

// Периодическое автосохранение (каждые 30 секунд)
setInterval(() => {
    if (placedStickers.length > 0) {
        saveState();
    }
}, 30000);
