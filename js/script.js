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
document.addEventListener('DOMContentLoaded', function () {
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

// Загрузка изображений из репозитория
function loadBagImage() {
  const img = new Image();

  img.onload = function () {
    bagImage = img;
    document.getElementById('loadingBag').style.display = 'none';
    redrawCanvas();
    console.log('Bag image loaded successfully');
  };

  img.onerror = function () {
    console.error('Failed to load bag image');
    document.getElementById('loadingBag').textContent = 'Failed to load bag image';
  };

  img.src = getBagImagePath();
}

function loadStickers() {
  const stickersList = document.getElementById('stickersList');
  stickersList.innerHTML = '<div class="loading">Loading stickers...</div>';

  const loadedStickers = [];
  let loadedCount = 0;
  const totalStickers = APP_CONFIG.MAX_STICKERS;

  // Загрузка всех наклеек
  for (let i = 1; i <= totalStickers; i++) {
    const img = new Image();

    img.onload = function () {
      loadedStickers.push({
        id: i,
        src: getStickerImagePath(i),
        image: img,
        config: getStickerConfig(i)
      });

      loadedCount++;

      // Когда все наклейки загружены, отображаем их
      if (loadedCount === getAvailableStickersCount()) {
        displayStickers(loadedStickers.sort((a, b) => a.id - b.id));
      }
    };

    img.onerror = function () {
      loadedCount++;
      console.warn(`Sticker ${i} not found`);

      if (loadedCount === getAvailableStickersCount()) {
        displayStickers(loadedStickers.sort((a, b) => a.id - b.id));
      }
    };

    img.src = getStickerImagePath(i);
  }
}

function getAvailableStickersCount() {
  // В реальности можно проверить, какие файлы существуют
  // Для простоты возвращаем максимальное количество
  return APP_CONFIG.MAX_STICKERS;
}

function displayStickers(stickers) {
  const stickersList = document.getElementById('stickersList');
  stickersList.innerHTML = '';

  stickers.forEach((sticker, index) => {
    const stickerDiv = document.createElement('div');
    stickerDiv.className = 'sticker-item';
    stickerDiv.onclick = () => addStickerToBag(sticker);

    // Тултип с информацией о размере
    const config = sticker.config;
    stickerDiv.title = `${config.name}\nРазмер: ${config.width / 10}×${config.height / 10} см`;

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
    console.log(`Added sticker: ${config.name}, Real: ${config.width / 10}×${config.height / 10}cm`);
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

function setupCanvasEvents() {
  canvas.addEventListener('mousedown', handleStart);
  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('mouseup', handleEnd);

  canvas.addEventListener('touchstart', handleStart);
  canvas.addEventListener('touchmove', handleMove);
  canvas.addEventListener('touchend', handleEnd);

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

    selectedSticker.x = Math.max(0, Math.min(canvas.width - selectedSticker.width, selectedSticker.x));
    selectedSticker.y = Math.max(0, Math.min(canvas.height - selectedSticker.height, selectedSticker.y));

    redrawCanvas();
  }
}

function handleEnd(e) {
  e.preventDefault();
  isDragging = false;
}

function loadBagImage() {
  google.script.run
    .withSuccessHandler(function (imageData) {
      if (imageData) {
        bagImage = new Image();
        bagImage.onload = function () {
          document.getElementById('loadingBag').style.display = 'none';
          redrawCanvas();
        };
        bagImage.src = imageData;
      }
    })
    .withFailureHandler(function (error) {
      console.error('Error loading bag image:', error);
      document.getElementById('loadingBag').textContent = 'Failed to load bag image';
    })
    .getBagImage();
}

function loadStickers() {
  google.script.run
    .withSuccessHandler(function (stickerData) {
      stickers = stickerData;
      displayStickers();
    })
    .withFailureHandler(function (error) {
      console.error('Error loading stickers:', error);
    })
    .getStickers();
}

function displayStickers() {
  const stickersList = document.getElementById('stickersList');
  stickersList.innerHTML = '';

  stickers.forEach((sticker, index) => {
    const stickerDiv = document.createElement('div');
    stickerDiv.className = 'sticker-item';
    stickerDiv.style.animationDelay = (index * 0.1) + 's';
    stickerDiv.onclick = () => addStickerToBag(sticker);

    // Добавляем тултип с размером
    const config = STICKER_CONFIGS[sticker.id];
    if (config) {
      stickerDiv.title = `${config.name}\nРазмер: ${config.width / 10}×${config.height / 10} см`;
    }

    const img = document.createElement('img');
    img.src = sticker.data;
    img.alt = `Sticker ${sticker.id}`;

    stickerDiv.appendChild(img);
    stickersList.appendChild(stickerDiv);

    setTimeout(() => {
      stickerDiv.style.opacity = '1';
      stickerDiv.style.transform = 'scale(1)';
    }, index * 100);
  });
}

function addStickerToBag(sticker) {
  const stickerImage = new Image();
  stickerImage.onload = function () {
    // Получаем конфигурацию размера для этой наклейки
    const config = STICKER_CONFIGS[sticker.id];

    if (!config) {
      console.warn(`No size config found for sticker ${sticker.id}, using default`);
      // Используем размер по умолчанию 10x10 см
      config = { width: 100, height: 100, type: 'default', name: `Наклейка ${sticker.id}` };
    }

    // Рассчитываем размер на канвасе исходя из реальных размеров
    const canvasSize = calculateCanvasSize(config.width, config.height);

    const placedSticker = {
      image: stickerImage,
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

    console.log(`Added sticker: ${config.name}, Real: ${config.width / 10}×${config.height / 10}cm, Canvas: ${Math.round(canvasSize.width)}×${Math.round(canvasSize.height)}px`);
  };
  stickerImage.src = sticker.data;
}

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (bagImage) {
    ctx.drawImage(bagImage, 0, 0, canvas.width, canvas.height);
  }

  placedStickers.forEach(sticker => {
    ctx.save();

    ctx.translate(sticker.x + sticker.width / 2, sticker.y + sticker.height / 2);

    if (sticker.rotation) {
      ctx.rotate(sticker.rotation * Math.PI / 180);
    }

    ctx.drawImage(sticker.image, -sticker.width / 2, -sticker.height / 2, sticker.width, sticker.height);

    ctx.restore();

    if (sticker === selectedSticker) {
      ctx.strokeStyle = '#46a2e0';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(sticker.x - 2, sticker.y - 2, sticker.width + 4, sticker.height + 4);
      ctx.setLineDash([]);

      const cornerSize = 8;
      ctx.fillStyle = '#46a2e0';
      ctx.fillRect(sticker.x - cornerSize / 2, sticker.y - cornerSize / 2, cornerSize, cornerSize);
      ctx.fillRect(sticker.x + sticker.width - cornerSize / 2, sticker.y - cornerSize / 2, cornerSize, cornerSize);
      ctx.fillRect(sticker.x - cornerSize / 2, sticker.y + sticker.height - cornerSize / 2, cornerSize, cornerSize);
      ctx.fillRect(sticker.x + sticker.width - cornerSize / 2, sticker.y + sticker.height - cornerSize / 2, cornerSize, cornerSize);
    }
  });
}

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

function saveBag() {
  document.getElementById('saveBtn').disabled = true;
  document.getElementById('saveText').textContent = 'Saving...';

  // Создаем финальное изображение в высоком разрешении
  // Соотношение: 1 мм = 2 пикселя (итого 860x960 пикселей для сумки 43x48 см)
  const finalCanvas = document.createElement('canvas');
  const pixelsPerMM = 2;
  finalCanvas.width = REAL_BAG_SIZE.width * pixelsPerMM;  // 860px
  finalCanvas.height = REAL_BAG_SIZE.height * pixelsPerMM; // 960px
  const finalCtx = finalCanvas.getContext('2d');

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

  finalCanvas.toBlob(function (blob) {
    const url = URL.createObjectURL(blob);
    window.designImageUrl = url;

    document.getElementById('saveBtn').disabled = false;
    document.getElementById('saveText').textContent = translations[currentLanguage].saveText;

    showResultModal();
  }, 'image/png');
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

function showResultModal() {
  document.getElementById('resultModal').classList.add('active');
}

function closeModal() {
  document.getElementById('resultModal').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', function () {
  const canvas = document.getElementById('bagCanvas');
  if (canvas) {
    // ИСПРАВЛЕННЫЕ начальные размеры с правильными пропорциями
    const initialWidth = 430;  // 43 см
    const initialHeight = 480; // 48 см
    canvas.width = initialWidth;
    canvas.height = initialHeight;
  }

  const style = document.createElement('style');
  style.textContent = `
      .sticker-item {
          opacity: 0;
          transform: scale(0.8);
          transition: opacity 0.3s ease, transform 0.3s ease;
      }
  `;
  document.head.appendChild(style);
});
