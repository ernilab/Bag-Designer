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
let dpr = window.devicePixelRatio || 1;
let lastTapTime = 0;
let imageCache = {};
let modalScrollY = 0;

const STICKER_LIMITS = {
  MIN: 2,
  MAX: 5
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function () {
  fixMobileScrollIssues();
  initializeApp();
});

// Функция для исправления проблем скролла на мобильных устройствах
function fixMobileScrollIssues() {
  // Исправление высоты для мобильных браузеров (проблема с адресной строкой)
  const setVhProperty = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  setVhProperty();
  window.addEventListener('resize', setVhProperty);
  window.addEventListener('orientationchange', setVhProperty);

  // Блокируем двойной тап для масштабирования
  document.addEventListener('touchend', function (event) {
    const now = Date.now();
    const DOUBLE_TAP_THRESHOLD = 300;
    if (now - lastTapTime < DOUBLE_TAP_THRESHOLD) {
      event.preventDefault();
    }
    lastTapTime = now;
  }, { passive: false });

  // Предотвращаем масштабирование жестами "pinch"
  document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
  }, { passive: false });

  // Предотвращаем стандартные действия браузера при свайпе в Safari
  document.addEventListener('touchmove', function (e) {
    // Блокируем только при открытом модальном окне
    if (document.body.classList.contains('modal-open')) {
      e.preventDefault();
    }
  }, { passive: false });

  // Исправляем проблему с контекстным меню на долгом нажатии
  document.addEventListener('contextmenu', function (e) {
    if (e.target.className.includes('sticker-item') ||
      e.target.tagName === 'BUTTON' ||
      e.target.tagName === 'CANVAS') {
      e.preventDefault();
    }
  });
}

function initializeApp() {
  console.log('Initializing Uber Bag Designer...');
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
    'rotateLabel', 'deleteText', 'deselectText',
    'warningTitle', 'missingStickersText', 'okText'
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

  // включаем сглаживание и ставим максимальное качество
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  setupCanvasEvents();
  setupControls();
  loadBagImage();
  loadStickers();
  checkRequiredStickers();
}

// Настройка контролов
function setupControls() {
  const rotateSlider = document.getElementById('rotateSlider');
  const rotateValue = document.getElementById('rotateValue');

  if (!rotateSlider || !rotateValue) return;

  // показываем начальное значение
  rotateValue.textContent = `${rotateSlider.value}°`;

  rotateSlider.addEventListener('input', function () {
    rotateValue.textContent = `${this.value}°`;
    if (selectedSticker) {
      selectedSticker.rotation = parseFloat(this.value);
      redrawCanvas();
    }
  });
}

// Панель управления
function showControlPanel() {
  const controlPanel = document.getElementById('controlPanel');
  if (!controlPanel) return;

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
  if (!selectedSticker) return;

  const rotateSlider = document.getElementById('rotateSlider');
  const rotateValue = document.getElementById('rotateValue');

  if (rotateSlider && rotateValue) {
    rotateSlider.value = selectedSticker.rotation || 0;
    rotateValue.textContent = `${rotateSlider.value}°`;
  }

  // Показать информацию о размере наклейки
  updateStickerInfo();
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
           display: none;
        `;

    const controlPanel = document.getElementById('controlPanel');
    if (controlPanel) {
      controlPanel.appendChild(infoElement);
    }
  }

  const sizeText = translations[currentLanguage].stickerInfo || 'Size:';
  infoElement.innerHTML = `
        <strong>${config.name}</strong><br>
        ${sizeText} ${config.width / 10}×${config.height / 10} см
    `;
}

// Загрузка изображений с Promise и кэшированием
function loadImage(src) {
  return new Promise((resolve, reject) => {
    // Проверяем кэш
    if (imageCache[src]) {
      resolve(imageCache[src]);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = function () {
      // Добавляем в кэш
      imageCache[src] = img;
      resolve(img);
    };

    img.onerror = function (err) {
      reject(err);
    };

    img.src = src;
  });
}

// Загрузка изображений из репозитория
function loadBagImage() {
  loadImage(getBagImagePath())
    .then(img => {
      bagImage = img;
      document.getElementById('loadingBag').style.display = 'none';
      redrawCanvas();
      console.log('Bag image loaded successfully');
    })
    .catch(error => {
      console.error('Failed to load bag image:', error);
      document.getElementById('loadingBag').textContent = 'Failed to load bag image';
    });
}

function loadStickers() {
  const stickersList = document.getElementById('stickersList');
  if (stickersList) {
    stickersList.innerHTML = '<div class="loading">Loading stickers...</div>';
  }

  // Загружаем стикеры параллельно с Promise.all
  const loadPromises = [];

  for (let i = 1; i <= APP_CONFIG.MAX_STICKERS; i++) {
    const src = getStickerImagePath(i);
    loadPromises.push(
      loadImage(src)
        .then(img => ({
          id: i,
          src: src,
          image: img,
          config: getStickerConfig(i),
          required: isRequiredSticker(i)
        }))
        .catch(() => null) // Если не удалось загрузить, возвращаем null
    );
  }

  Promise.all(loadPromises)
    .then(results => {
      // Фильтруем успешно загруженные стикеры
      const loadedStickers = results.filter(result => result !== null);
      displayStickers(loadedStickers.sort((a, b) => a.id - b.id));
    });
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

    // Если наклейка обязательная, отмечаем её
    if (sticker.required) {
      stickerDiv.classList.add('required');
    }

    // Добавляем обработчики для мыши И касаний
    const addSticker = (e) => {
      e.preventDefault();
      e.stopPropagation();
      addStickerToBag(sticker);
    };

    stickerDiv.addEventListener('click', addSticker);
    stickerDiv.addEventListener('touchend', addSticker);

    const config = sticker.config;
    const stickerName = sticker.required
      ? getRequiredStickerName(sticker.id)
      : config.name;

    stickerDiv.title = `${stickerName}\nРазмер: ${config.width / 10}×${config.height / 10} см`;

    const img = document.createElement('img');
    img.src = sticker.src;
    img.alt = stickerName;
    img.style.pointerEvents = 'none'; // Предотвращаем события на изображении

    stickerDiv.appendChild(img);
    stickersList.appendChild(stickerDiv);

    // Анимация появления
    setTimeout(() => {
      stickerDiv.style.opacity = '1';
      stickerDiv.style.transform = 'scale(1)';
    }, index * 50); // Уменьшаем задержку для более быстрой анимации
  });

  console.log(`Loaded ${stickers.length} stickers`);
}

// Функция для добавления наклейки на сумку
function addStickerToBag(sticker) {
  console.log('Adding sticker to bag:', sticker);

  // Проверяем, не превышено ли максимальное количество наклеек
  if (placedStickers.length >= STICKER_LIMITS.MAX) {
    showTooManyStickerWarning();
    return;
  }

  const config = sticker.config;
  const canvasSize = calculateCanvasSize(config.width, config.height);

  // Используем CSS-размеры для позиционирования
  const cssWidth = canvas.width / dpr;
  const cssHeight = canvas.height / dpr;

  const placedSticker = {
    image: sticker.image,
    x: cssWidth / 2 - canvasSize.width / 2,
    y: cssHeight / 2 - canvasSize.height / 2,
    width: canvasSize.width,
    height: canvasSize.height,
    rotation: 0,
    id: Date.now(),
    stickerId: sticker.id,
    realWidth: config.width,
    realHeight: config.height,
    type: config.type,
    name: config.name,
    required: sticker.required
  };

  placedStickers.push(placedSticker);
  selectedSticker = placedSticker;
  showControlPanel();
  redrawCanvas();

  // Проверяем, добавлены ли все обязательные наклейки
  checkRequiredStickers();
}

// Функция для проверки обязательных наклеек
function checkRequiredStickers() {
  const saveButton = document.getElementById('saveBtn');
  if (!saveButton) return;

  // Получаем список ID всех размещенных наклеек
  const placedStickerIds = placedStickers.map(sticker => sticker.stickerId);

  // Проверяем, есть ли хотя бы одна обязательная наклейка
  const hasAtLeastOneRequiredSticker = REQUIRED_STICKERS.some(id =>
    placedStickerIds.includes(id)
  );

  // Проверяем количественные ограничения
  const totalStickers = placedStickers.length;
  const withinLimits = totalStickers >= STICKER_LIMITS.MIN && totalStickers <= STICKER_LIMITS.MAX;

  // Включаем кнопку только если все условия выполняются
  saveButton.disabled = !(hasAtLeastOneRequiredSticker && withinLimits);

  // Обновляем информацию о количественных ограничениях
  updateStickerCountDisplay(totalStickers);
}

// Функции расчета размеров и масштабирования
function calculateCanvasSize(realWidthMM, realHeightMM) {
  // Используем CSS-размеры для расчета, а не физические
  const cssWidth = canvas.width / dpr;
  const cssHeight = canvas.height / dpr;

  const scaleX = cssWidth / REAL_BAG_SIZE.width;
  const scaleY = cssHeight / REAL_BAG_SIZE.height;
  const scale = Math.min(scaleX, scaleY);

  return {
    width: realWidthMM * scale,
    height: realHeightMM * scale
  };
}

function resizeCanvas() {
  if (!canvas) return;

  // вычисляем размер в CSS-пикселях
  const container = canvas.parentElement;
  const maxWidth = Math.min(container.clientWidth - 60, 500);
  const maxHeight = Math.min(window.innerHeight * 0.6, 500);
  const bagAR = REAL_BAG_SIZE.width / REAL_BAG_SIZE.height;

  let cssWidth, cssHeight;
  if (maxWidth / maxHeight > bagAR) {
    cssHeight = maxHeight;
    cssWidth = cssHeight * bagAR;
  } else {
    cssWidth = maxWidth;
    cssHeight = cssWidth / bagAR;
  }

  // ставим видимые размеры
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';

  // ставим «физические» размеры под DPR
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);

  // ресетим трансформ и масштабируем контекст под DPR
  if (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // восстанавливаем качество
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  redrawCanvas();
}

// Настройка событий канваса
function setupCanvasEvents() {
  let lastTapCanvas = 0;
  let isTouching = false;

  // События мыши
  canvas.addEventListener('mousedown', function (e) {
    if (!isTouching) handleStart(e);
  });
  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('mouseup', handleEnd);

  // События касания
  canvas.addEventListener('touchstart', function (e) {
    isTouching = true;
    handleStart(e);
  }, { passive: false });
  canvas.addEventListener('touchmove', handleMove, { passive: false });
  canvas.addEventListener('touchend', function (e) {
    isTouching = false;
    handleEnd(e);

    // Предотвращаем двойной тап
    const now = Date.now();
    if (now - lastTapCanvas < 300) {
      e.preventDefault();
    }
    lastTapCanvas = now;
  }, { passive: false });
}

function getEventPos(e) {
  const rect = canvas.getBoundingClientRect();
  // Используем CSS-размеры для расчета позиции
  const scaleX = (canvas.width / dpr) / rect.width;
  const scaleY = (canvas.height / dpr) / rect.height;

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

    // Используем CSS-размеры для границ
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;

    selectedSticker.x = Math.max(0, Math.min(cssWidth - selectedSticker.width, selectedSticker.x));
    selectedSticker.y = Math.max(0, Math.min(cssHeight - selectedSticker.height, selectedSticker.y));
    redrawCanvas();
  }
}

function handleEnd(e) {
  e.preventDefault();
  isDragging = false;
}

// Отрисовка канваса с requestAnimationFrame
function redrawCanvas() {
  if (!canvas || !ctx) return;

  requestAnimationFrame(() => {
    // при любом перерисовывании убеждаемся, что сглаживание включено
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // очищаем в CSS-координатах
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // рисуем сумку
    if (bagImage) {
      ctx.drawImage(
        bagImage,
        0, 0,
        canvas.width / dpr,
        canvas.height / dpr
      );
    }

    // рисуем наклейки
    placedStickers.forEach(sticker => {
      ctx.save();

      // центр наклейки
      ctx.translate(
        sticker.x + sticker.width / 2,
        sticker.y + sticker.height / 2
      );

      if (sticker.rotation) {
        ctx.rotate(sticker.rotation * Math.PI / 180);
      }

      // размер и положение в CSS px
      ctx.drawImage(
        sticker.image,
        -sticker.width / 2,
        -sticker.height / 2,
        sticker.width,
        sticker.height
      );

      ctx.restore();
    });

    // Выделение выбранной наклейки
    if (selectedSticker) {
      ctx.save();
      ctx.strokeStyle = '#42445A00';
      ctx.lineWidth = 0;
      ctx.setLineDash([0, 0]);
      ctx.strokeRect(
        selectedSticker.x,
        selectedSticker.y,
        selectedSticker.width,
        selectedSticker.height
      );

      // Маркеры по углам
      const cornerSize = 0;
      ctx.fillStyle = '#42445A00';
      ctx.setLineDash([]);

      ctx.fillRect(selectedSticker.x - cornerSize / 2, selectedSticker.y - cornerSize / 2, cornerSize, cornerSize);
      ctx.fillRect(selectedSticker.x + selectedSticker.width - cornerSize / 2, selectedSticker.y - cornerSize / 2, cornerSize, cornerSize);
      ctx.fillRect(selectedSticker.x - cornerSize / 2, selectedSticker.y + selectedSticker.height - cornerSize / 2, cornerSize, cornerSize);
      ctx.fillRect(selectedSticker.x + selectedSticker.width - cornerSize / 2, selectedSticker.y + selectedSticker.height - cornerSize / 2, cornerSize, cornerSize);

      ctx.restore();
    }
  });
}

// Функции управления наклейками
function deleteSelectedSticker() {
  if (!selectedSticker) return;

  const index = placedStickers.indexOf(selectedSticker);
  if (index > -1) {
    placedStickers.splice(index, 1);
    selectedSticker = null;
    hideControlPanel();
    redrawCanvas();

    // Перепроверяем наклейки
    checkRequiredStickers();
  }
}

function deselectSticker() {
  selectedSticker = null;
  hideControlPanel();
  redrawCanvas();
}

// Сохранение дизайна
function saveBag(event) {
  // Проверяем, есть ли хотя бы одна обязательная наклейка
  const placedStickerIds = placedStickers.map(sticker => sticker.stickerId);
  const hasAnyRequiredSticker = REQUIRED_STICKERS.some(id =>
    placedStickerIds.includes(id)
  );

  if (!hasAnyRequiredSticker) {
    showMissingStickersModal(REQUIRED_STICKERS);
    return;
  }

  // Проверяем минимальное и максимальное количество наклеек
  const totalStickers = placedStickers.length;
  if (totalStickers < STICKER_LIMITS.MIN) {
    showTooFewStickersWarning();
    return;
  }

  if (totalStickers > STICKER_LIMITS.MAX) {
    showTooManyStickerWarning();
    return;
  }

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
  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = 'high';

  // Рисуем сумку в высоком разрешении
  if (bagImage) {
    finalCtx.drawImage(bagImage, 0, 0, finalCanvas.width, finalCanvas.height);
  }

  // Масштабируем и рисуем наклейки в финальном раз
  // Масштабируем и рисуем наклейки в финальном разрешении
  placedStickers.forEach(sticker => {
    finalCtx.save();

    // Рассчитываем финальную позицию и размер
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;

    const finalX = (sticker.x / cssWidth) * finalCanvas.width;
    const finalY = (sticker.y / cssHeight) * finalCanvas.height;
    const finalWidth = sticker.realWidth * pixelsPerMM;
    const finalHeight = sticker.realHeight * pixelsPerMM;

    finalCtx.translate(finalX + finalWidth / 2, finalY + finalHeight / 2);

    if (sticker.rotation) {
      finalCtx.rotate(sticker.rotation * Math.PI / 180);
    }

    finalCtx.drawImage(
      sticker.image,
      -finalWidth / 2,
      -finalHeight / 2,
      finalWidth,
      finalHeight
    );

    finalCtx.restore();
  });

  // Конвертируем в blob для скачивания
  finalCanvas.toBlob(function (blob) {
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

function downloadImage(event) {
  if (event) {
    event.preventDefault();
  }

  if (window.designImageUrl) {
    const link = document.createElement('a');
    link.download = 'uber-bag-design.png';
    link.href = window.designImageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Обновленные функции модального окна
function showResultModal() {
    const modal = document.getElementById('resultModal');
    if (modal) {
        // Предотвращаем скролл только когда открыто модальное окно
        modalScrollY = window.scrollY || document.documentElement.scrollTop || 0;
        
        document.body.classList.add('modal-open');
        modal.classList.add('active');
        
        // Зафиксируем положение body
        document.body.style.position = 'fixed';
        document.body.style.top = `-${modalScrollY}px`;
        document.body.style.width = '100%';
        
        // Добавляем обработчик только при открытом модальном окне
        document.addEventListener('touchmove', preventModalScroll, { passive: false });
    }
}

function closeModal() {
    const modal = document.getElementById('resultModal');
    if (modal) {
        modal.classList.remove('active');
        
        // Восстанавливаем прокрутку
        document.body.classList.remove('modal-open');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        
        window.scrollTo(0, modalScrollY);
        
        document.removeEventListener('touchmove', preventModalScroll);
    }
}

function showMissingStickersModal(missingIds) {
  const modal = document.getElementById('missingStickersModal');
  const detailsContainer = document.getElementById('missingStickersDetails');

  if (!modal || !detailsContainer) return;

  detailsContainer.innerHTML = '';

  missingIds.forEach(id => {
    const div = document.createElement('div');
    div.textContent = getRequiredStickerName(id);
    detailsContainer.appendChild(div);
  });

  // Сохраняем позицию прокрутки
  modalScrollY = window.scrollY || document.documentElement.scrollTop;
  document.body.style.top = `-${modalScrollY}px`;

  // Блокируем прокрутку
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('modal-open');

  // Показываем модальное окно
  modal.classList.add('active');

  // Предотвращаем прокрутку
  document.addEventListener('touchmove', preventModalScroll, { passive: false });
}

function closeMissingStickersModal() {
  const modal = document.getElementById('missingStickersModal');
  if (modal) {
    modal.classList.remove('active');

    // Восстанавливаем прокрутку
    setTimeout(() => {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      document.body.style.top = '';

      window.scrollTo(0, modalScrollY || 0);

      document.removeEventListener('touchmove', preventModalScroll);
    }, 100);
  }
}

// Блокируем прокрутку при открытом модальном окне
function preventModalScroll(e) {
  e.preventDefault();
}

// Добавьте эту функцию для отображения количества наклеек
function updateStickerCountDisplay(count) {
  const stickerCountElement = document.getElementById('stickerCount');
  if (!stickerCountElement) {
    // Создаем элемент, если его еще нет
    const stickersPanel = document.querySelector('.stickers-panel');
    if (!stickersPanel) return;

    const countDisplay = document.createElement('div');
    countDisplay.id = 'stickerCount';
    countDisplay.className = 'sticker-count';
    stickersPanel.insertBefore(countDisplay, stickersPanel.firstChild);
  }

  const stickerCountText = document.getElementById('stickerCount');
  if (stickerCountText) {
    const min = STICKER_LIMITS.MIN;
    const max = STICKER_LIMITS.MAX;

    let statusClass = '';
    if (count < min) {
      statusClass = 'count-warning';
    } else if (count > max) {
      statusClass = 'count-error';
    } else {
      statusClass = 'count-ok';
    }

    stickerCountText.className = `sticker-count ${statusClass}`;

    // Обновляем текст с учетом выбранного языка
    const countText = translations[currentLanguage].stickerCountText || 'Stickers: {0}/{1}-{2}';
    stickerCountText.textContent = countText
      .replace('{0}', count)
      .replace('{1}', min)
      .replace('{2}', max);
  }
}

// Функция для отображения предупреждения о превышении лимита наклеек
function showTooManyStickerWarning() {
  // Можно использовать существующую модель или показать всплывающее сообщение
  const warningText = translations[currentLanguage].tooManyStickerWarning ||
    `Maximum ${STICKER_LIMITS.MAX} stickers allowed!`;

  alert(warningText);
}

// Функция для отображения предупреждения о недостаточном количестве наклеек
function showTooFewStickersWarning() {
  const warningText = translations[currentLanguage].tooFewStickersWarning ||
    `Minimum ${STICKER_LIMITS.MIN} stickers required!`;

  alert(warningText);
}
