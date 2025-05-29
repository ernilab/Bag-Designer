// Улучшенная отрисовка канваса
function redrawCanvas() {
    if (!canvas || !ctx) return;
    
    const canvasWidth = canvas.width / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality;
    const canvasHeight = canvas.height / CANVAS_SETTINGS.pixelRatio / CANVAS_SETTINGS.quality;
    
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Рисуем изображение сумки с улучшенным качеством
    if (bagImage) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bagImage, 0, 0, canvasWidth, canvasHeight);
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
        
        // Включаем сглаживание для наклеек
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Рисуем наклейку от центра
        ctx.drawImage(sticker.image, -sticker.width / 2, -sticker.height / 2, sticker.width, sticker.height);
        
        ctx.restore();
        
        // Подсвечиваем выбранную наклейку
        if (sticker === selectedSticker) {
            ctx.save();
            
            // Создаем рамку вокруг повернутой наклейки
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
            
            // Добавляем угловые маркеры
            const cornerSize = 6;
            ctx.fillStyle = '#46a2e0';
            
            // Четыре угла
            const corners = [
                [-sticker.width / 2 - 3, -sticker.height / 2 - 3],
                [sticker.width / 2 + 3, -sticker.height / 2 - 3],
                [-sticker.width / 2 - 3, sticker.height / 2 + 3],
                [sticker.width / 2 + 3, sticker.height / 2 + 3]
            ];
            
            corners.forEach(([x, y]) => {
                ctx.fillRect(x - cornerSize/2, y - cornerSize/2, cornerSize, cornerSize);
            });
            
            // Индикатор поворота в центре
            if (Math.abs(sticker.rotation) > 1) {
                ctx.strokeStyle = '#ff6b6b';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, 2 * Math.PI);
                ctx.stroke();
                
                // Стрелка направления
                ctx.fillStyle = '#ff6b6b';
                ctx.beginPath();
                ctx.moveTo(12, 0);
                ctx.lineTo(8, -3);
                ctx.lineTo(8, 3);
                ctx.fill();
            }
            
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
