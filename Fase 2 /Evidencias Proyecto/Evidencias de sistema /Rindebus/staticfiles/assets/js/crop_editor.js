// RindeBus - Editor de Recorte Manual
// Permite al usuario ajustar manualmente el recorte del documento

let currentImageData = null;
let currentCoordinates = null;

// Función principal para abrir el editor manual de recorte
function openManualCropEditor(imageData, detectedCoords = null) {
    console.log('🎨 Abriendo editor de recorte manual...');
    
    // Guardar datos para uso posterior
    currentImageData = imageData;
    currentCoordinates = detectedCoords;
    
    // Cerrar cualquier modal existente
    closeExistingModals();
    
    // Crear el modal del editor
    const modal = document.createElement('div');
    modal.className = 'crop-editor-modal';
    modal.id = 'crop-editor-modal';
    modal.innerHTML = `
        <div class="crop-editor-container">
            <div class="crop-editor-header">
                <h3>✂️ Ajustar Recorte Manual</h3>
                <button class="btn-close" onclick="closeCropEditor()">&times;</button>
            </div>
            <div class="crop-editor-content">
                <div class="crop-instructions">
                    <p>📄 Ajusta el marco azul para seleccionar la parte del documento que deseas guardar</p>
                    <p>• Arrastra las esquinas para redimensionar • Arrastra el centro para mover</p>
                </div>
                <div class="image-container" id="crop-image-container">
                    <img id="crop-image" src="${imageData}" alt="Imagen a recortar">
                    <div class="crop-frame" id="crop-frame">
                        <div class="crop-corner top-left" data-corner="top-left"></div>
                        <div class="crop-corner top-right" data-corner="top-right"></div>
                        <div class="crop-corner bottom-left" data-corner="bottom-left"></div>
                        <div class="crop-corner bottom-right" data-corner="bottom-right"></div>
                        <div class="crop-edge top" data-edge="top"></div>
                        <div class="crop-edge bottom" data-edge="bottom"></div>
                        <div class="crop-edge left" data-edge="left"></div>
                        <div class="crop-edge right" data-edge="right"></div>
                        <div class="crop-drag-area"></div>
                    </div>
                </div>
                <div class="crop-controls">
                    <button class="btn btn-auto" onclick="applyAutoDetection()">
                        🤖 Auto Detectar
                    </button>
                    <button class="btn btn-primary" onclick="cropOnlyFrame()">
                        🎯 Recortar Solo Cuadro
                    </button>
                    <button class="btn btn-confirm" onclick="applyCropAndSave()">
                        ✅ Confirmar Recorte
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Agregar estilos si no existen
    addCropEditorStyles();
    
    // Inicializar el marco de recorte cuando la imagen se cargue
    const image = document.getElementById('crop-image');
    image.onload = function() {
        initializeCropFrame(detectedCoords);
        showMessage('🎨 Editor de recorte listo. Ajusta el marco azul', 'info');
    };
}

// Función para cerrar modales existentes
function closeExistingModals() {
    const existingModals = [
        '#crop-editor-modal',
        '#opencv-result-modal', 
        '.opencv-result-modal'
    ];
    
    existingModals.forEach(selector => {
        const modal = document.querySelector(selector);
        if (modal) modal.remove();
    });
}

// Función para agregar estilos CSS del editor
function addCropEditorStyles() {
    if (document.getElementById('crop-editor-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'crop-editor-styles';
    style.textContent = `
        /* Editor de Recorte Manual */
        .crop-editor-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Poppins', sans-serif;
        }

        .crop-editor-container {
            width: 90vw;
            max-width: 900px;
            height: 90vh;
            background: white;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .crop-editor-header {
            background: linear-gradient(135deg, #2196F3, #1976D2);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .crop-editor-header h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
        }

        .crop-editor-header .btn-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 24px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .crop-editor-header .btn-close:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
        }

        .crop-editor-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 20px;
        }

        .crop-instructions {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            text-align: center;
        }

        .crop-instructions p {
            margin: 5px 0;
            font-size: 14px;
            color: #495057;
        }

        .crop-instructions p:first-child {
            font-weight: 600;
            color: #2196F3;
        }

        .image-container {
            position: relative;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f5f5;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 100px;
            min-height: 300px;
        }

        #crop-image {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            user-select: none;
            pointer-events: none;
        }

        .crop-frame {
            position: absolute;
            border: 3px solid #2196F3;
            background: rgba(33, 150, 243, 0.1);
            cursor: move;
            min-width: 50px;
            min-height: 50px;
            box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.3);
            z-index: 10;
        }

        .crop-corner {
            position: absolute;
            width: 20px;
            height: 20px;
            background: #2196F3;
            border: 3px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.2s ease;
            z-index: 10;
        }

        .crop-corner:hover {
            transform: scale(1.2);
            background: #1976D2;
        }

        .crop-corner.top-left {
            top: -10px;
            left: -10px;
            cursor: nw-resize;
        }

        .crop-corner.top-right {
            top: -10px;
            right: -10px;
            cursor: ne-resize;
        }

        .crop-corner.bottom-left {
            bottom: -10px;
            left: -10px;
            cursor: sw-resize;
        }

        .crop-corner.bottom-right {
            bottom: -10px;
            right: -10px;
            cursor: se-resize;
        }

        .crop-edge {
            position: absolute;
            background: rgba(33, 150, 243, 0.5);
            z-index: 5;
        }

        .crop-edge.top,
        .crop-edge.bottom {
            left: 20px;
            right: 20px;
            height: 6px;
            cursor: ns-resize;
        }

        .crop-edge.top {
            top: -3px;
        }

        .crop-edge.bottom {
            bottom: -3px;
        }

        .crop-edge.left,
        .crop-edge.right {
            top: 20px;
            bottom: 20px;
            width: 6px;
            cursor: ew-resize;
        }

        .crop-edge.left {
            left: -3px;
        }

        .crop-edge.right {
            right: -3px;
        }

        .crop-drag-area {
            position: absolute;
            top: 4px;
            left: 4px;
            right: 4px;
            bottom: 4px;
            cursor: move;
            background: rgba(33, 150, 243, 0.02);
            border: 2px dashed rgba(33, 150, 243, 0.3);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(33, 150, 243, 0.7);
            font-size: 12px;
            font-weight: 500;
        }

        .crop-drag-area::before {
            content: "📄 Arrastra para mover";
            opacity: 0.8;
        }

        .crop-controls {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
            padding: 15px;
            border-top: 2px solid #eee;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            z-index: 1001;
            min-height: 80px;
            align-items: center;
        }

        .crop-controls .btn {
            padding: 10px 16px;
            border: none;
            border-radius: 8px;
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 100px;
            justify-content: center;
            flex: 1;
            max-width: 150px;
        }
            justify-content: center;
        }

        .btn-reset {
            background: #FF9800;
            color: white;
        }

        .btn-reset:hover {
            background: #F57C00;
            transform: translateY(-2px);
        }

        .btn-auto {
            background: #4CAF50;
            color: white;
        }

        .btn-auto:hover {
            background: #388E3C;
            transform: translateY(-2px);
        }

        .btn-confirm {
            background: #2196F3;
            color: white;
            font-weight: bold;
        }

        .btn-confirm:hover {
            background: #1976D2;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #2196F3, #1976D2);
            color: white;
            border: none;
        }
        
        .btn-primary:hover {
            background: linear-gradient(135deg, #1976D2, #1565C0);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        }

        /* Responsive para móviles */
        @media (max-width: 768px) {
            .crop-editor-container {
                width: 95vw;
                height: 95vh;
            }
            
            .crop-editor-header {
                padding: 15px;
            }
            
            .crop-editor-header h3 {
                font-size: 18px;
            }
            
            .crop-corner {
                width: 24px;
                height: 24px;
            }
            
            .crop-controls {
                flex-direction: column;
                gap: 10px;
            }
            
            .crop-controls .btn {
                min-height: 50px;
                font-size: 16px;
                min-width: auto;
            }
            
            .crop-instructions {
                padding: 12px;
            }
            
            .crop-instructions p {
                font-size: 13px;
            }
        }

        @media (max-width: 480px) {
            .crop-editor-container {
                width: 98vw;
                height: 98vh;
            }
            
            .crop-editor-content {
                padding: 15px;
            }
            
            .crop-corner {
                width: 28px;
                height: 28px;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Función para inicializar el marco de recorte
function initializeCropFrame(detectedCoords = null) {
    const image = document.getElementById('crop-image');
    const frame = document.getElementById('crop-frame');
    const container = document.getElementById('crop-image-container');
    
    if (!image || !frame || !container) return;
    
    // Esperar a que la imagen se cargue completamente
    if (!image.complete) {
        image.onload = () => initializeCropFrame(detectedCoords);
        return;
    }
    
    const imageRect = image.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Si hay coordenadas detectadas por ML Kit, usarlas
    if (detectedCoords && detectedCoords.x !== undefined) {
        setCropFrameFromMLKitCoords(detectedCoords, imageRect, containerRect);
    } else {
        // Marco por defecto centrado (75% del área de la imagen)
        const defaultSize = 0.75;
        const margin = (1 - defaultSize) / 2;
        
        // Calcular posición absoluta basada en la imagen mostrada
        const frameLeft = imageRect.left - containerRect.left + (imageRect.width * margin);
        const frameTop = imageRect.top - containerRect.top + (imageRect.height * margin);
        const frameWidth = imageRect.width * defaultSize;
        const frameHeight = imageRect.height * defaultSize;
        
        frame.style.position = 'absolute';
        frame.style.left = `${frameLeft}px`;
        frame.style.top = `${frameTop}px`;
        frame.style.width = `${frameWidth}px`;
        frame.style.height = `${frameHeight}px`;
    }
    
    // Hacer el marco interactivo
    makeFrameInteractive(frame);
}

// Función para establecer el marco desde coordenadas de ML Kit
function setCropFrameFromMLKitCoords(coords, imageRect, containerRect) {
    const frame = document.getElementById('crop-frame');
    const image = document.getElementById('crop-image');
    
    // Calcular la escala de la imagen mostrada vs la imagen real
    const scaleX = image.clientWidth / image.naturalWidth;
    const scaleY = image.clientHeight / image.naturalHeight;
    
    // Convertir coordenadas de ML Kit a píxeles en la imagen mostrada
    const scaledX = coords.x * scaleX;
    const scaledY = coords.y * scaleY;
    const scaledWidth = coords.width * scaleX;
    const scaledHeight = coords.height * scaleY;
    
    // Calcular posición absoluta en el contenedor
    const frameLeft = imageRect.left - containerRect.left + scaledX;
    const frameTop = imageRect.top - containerRect.top + scaledY;
    
    // Aplicar al marco con posición absoluta
    frame.style.position = 'absolute';
    frame.style.left = `${frameLeft}px`;
    frame.style.top = `${frameTop}px`;
    frame.style.width = `${scaledWidth}px`;
    frame.style.height = `${scaledHeight}px`;
    
    console.log('🎯 Marco ajustado con coordenadas ML Kit:', {
        original: coords,
        scaled: { x: scaledX, y: scaledY, width: scaledWidth, height: scaledHeight },
        absolute: { left: frameLeft, top: frameTop, width: scaledWidth, height: scaledHeight }
    });
}

// Función para hacer el marco interactivo (arrastrable y redimensionable)
function makeFrameInteractive(frame) {
    const corners = frame.querySelectorAll('.crop-corner');
    const edges = frame.querySelectorAll('.crop-edge');
    const dragArea = frame.querySelector('.crop-drag-area');
    
    // Hacer esquinas arrastrables para redimensionar
    corners.forEach(corner => {
        corner.addEventListener('mousedown', startResize);
        corner.addEventListener('touchstart', startResize);
    });
    
    // Hacer bordes arrastrables para redimensionar
    edges.forEach(edge => {
        edge.addEventListener('mousedown', startResize);
        edge.addEventListener('touchstart', startResize);
    });
    
    // Hacer el área central arrastrable para mover
    dragArea.addEventListener('mousedown', startMove);
    dragArea.addEventListener('touchstart', startMove);
}

// Variables para el arrastre
let isDragging = false;
let dragType = '';
let startX = 0;
let startY = 0;
let startFrame = {};

// Función para comenzar redimensionamiento
function startResize(e) {
    e.preventDefault();
    e.stopPropagation();
    
    isDragging = true;
    dragType = 'resize';
    
    startX = e.clientX || e.touches[0].clientX;
    startY = e.clientY || e.touches[0].clientY;
    
    const frame = document.getElementById('crop-frame');
    const container = document.getElementById('crop-image-container');
    
    // Obtener coordenadas absolutas actuales del marco
    const frameRect = frame.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    startFrame = {
        left: frameRect.left - containerRect.left,
        top: frameRect.top - containerRect.top,
        width: frameRect.width,
        height: frameRect.height,
        element: e.target.dataset.corner || e.target.dataset.edge
    };
    
    console.log('Starting resize:', {
        element: startFrame.element,
        startFrame: startFrame
    });
    
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', doDrag);
    document.addEventListener('touchend', stopDrag);
    
    // Cambiar cursor del body
    document.body.style.userSelect = 'none';
}

// Función para comenzar movimiento
function startMove(e) {
    e.preventDefault();
    e.stopPropagation();
    
    isDragging = true;
    dragType = 'move';
    
    startX = e.clientX || e.touches[0].clientX;
    startY = e.clientY || e.touches[0].clientY;
    
    const frame = document.getElementById('crop-frame');
    const container = document.getElementById('crop-image-container');
    
    // Obtener coordenadas absolutas actuales del marco
    const frameRect = frame.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    startFrame = {
        left: frameRect.left - containerRect.left,
        top: frameRect.top - containerRect.top,
        width: frameRect.width,
        height: frameRect.height
    };
    
    console.log('Starting move:', {
        startFrame: startFrame
    });
    
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', doDrag);
    document.addEventListener('touchend', stopDrag);
    
    document.body.style.userSelect = 'none';
}

// Función para realizar el arrastre
function doDrag(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const currentX = e.clientX || e.touches[0].clientX;
    const currentY = e.clientY || e.touches[0].clientY;
    
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    if (dragType === 'resize') {
        resizeFrameAbsolute(startFrame.element, deltaX, deltaY);
    } else if (dragType === 'move') {
        moveFrameAbsolute(deltaX, deltaY);
    }
}

// Función para redimensionar el marco con coordenadas absolutas
function resizeFrameAbsolute(element, deltaX, deltaY) {
    const frame = document.getElementById('crop-frame');
    const container = document.getElementById('crop-image-container');
    const image = document.getElementById('crop-image');
    
    if (!frame || !container || !image) return;
    
    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    
    let newLeft = startFrame.left;
    let newTop = startFrame.top;
    let newWidth = startFrame.width;
    let newHeight = startFrame.height;
    
    switch (element) {
        case 'top-left':
            newLeft = Math.max(imageRect.left - containerRect.left, Math.min(startFrame.left + startFrame.width - 50, startFrame.left + deltaX));
            newTop = Math.max(imageRect.top - containerRect.top, Math.min(startFrame.top + startFrame.height - 50, startFrame.top + deltaY));
            newWidth = startFrame.width - (newLeft - startFrame.left);
            newHeight = startFrame.height - (newTop - startFrame.top);
            break;
        case 'top-right':
            newTop = Math.max(imageRect.top - containerRect.top, Math.min(startFrame.top + startFrame.height - 50, startFrame.top + deltaY));
            newWidth = Math.max(50, Math.min(imageRect.right - containerRect.left - startFrame.left, startFrame.width + deltaX));
            newHeight = startFrame.height - (newTop - startFrame.top);
            break;
        case 'bottom-left':
            newLeft = Math.max(imageRect.left - containerRect.left, Math.min(startFrame.left + startFrame.width - 50, startFrame.left + deltaX));
            newWidth = startFrame.width - (newLeft - startFrame.left);
            newHeight = Math.max(50, Math.min(imageRect.bottom - containerRect.top - startFrame.top, startFrame.height + deltaY));
            break;
        case 'bottom-right':
            newWidth = Math.max(50, Math.min(imageRect.right - containerRect.left - startFrame.left, startFrame.width + deltaX));
            newHeight = Math.max(50, Math.min(imageRect.bottom - containerRect.top - startFrame.top, startFrame.height + deltaY));
            break;
        case 'top':
            newTop = Math.max(imageRect.top - containerRect.top, Math.min(startFrame.top + startFrame.height - 50, startFrame.top + deltaY));
            newHeight = startFrame.height - (newTop - startFrame.top);
            break;
        case 'bottom':
            newHeight = Math.max(50, Math.min(imageRect.bottom - containerRect.top - startFrame.top, startFrame.height + deltaY));
            break;
        case 'left':
            newLeft = Math.max(imageRect.left - containerRect.left, Math.min(startFrame.left + startFrame.width - 50, startFrame.left + deltaX));
            newWidth = startFrame.width - (newLeft - startFrame.left);
            break;
        case 'right':
            newWidth = Math.max(50, Math.min(imageRect.right - containerRect.left - startFrame.left, startFrame.width + deltaX));
            break;
    }
    
    // Aplicar los nuevos valores
    frame.style.left = `${newLeft}px`;
    frame.style.top = `${newTop}px`;
    frame.style.width = `${newWidth}px`;
    frame.style.height = `${newHeight}px`;
}

// Función para mover el marco completo con coordenadas absolutas
function moveFrameAbsolute(deltaX, deltaY) {
    const frame = document.getElementById('crop-frame');
    const container = document.getElementById('crop-image-container');
    const image = document.getElementById('crop-image');
    
    if (!frame || !container || !image) return;
    
    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    
    const newLeft = Math.max(
        imageRect.left - containerRect.left,
        Math.min(imageRect.right - containerRect.left - startFrame.width, startFrame.left + deltaX)
    );
    const newTop = Math.max(
        imageRect.top - containerRect.top,
        Math.min(imageRect.bottom - containerRect.top - startFrame.height, startFrame.top + deltaY)
    );
    
    frame.style.left = `${newLeft}px`;
    frame.style.top = `${newTop}px`;
}

// Función para parar el arrastre
function stopDrag() {
    isDragging = false;
    dragType = '';
    
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', doDrag);
    document.removeEventListener('touchend', stopDrag);
    
    document.body.style.userSelect = '';
}

// Función para aplicar el recorte y guardar
function applyCropAndSave() {
    const frame = document.getElementById('crop-frame');
    const image = document.getElementById('crop-image');
    const container = document.getElementById('crop-image-container');
    
    if (!frame || !image || !container) {
        showMessage('❌ Error: No se puede procesar la imagen', 'error');
        return;
    }
    
    showMessage('📄 Procesando recorte...', 'info');
    
    try {
        // Obtener coordenadas del marco relativas al contenedor
        const frameRect = frame.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calcular posición relativa del marco respecto a la imagen mostrada
        const relativeX = (frameRect.left - imageRect.left) / image.clientWidth;
        const relativeY = (frameRect.top - imageRect.top) / image.clientHeight;
        const relativeWidth = frameRect.width / image.clientWidth;
        const relativeHeight = frameRect.height / image.clientHeight;
        
        // Asegurar que las coordenadas estén en rango válido [0,1]
        const validX = Math.max(0, Math.min(1, relativeX));
        const validY = Math.max(0, Math.min(1, relativeY));
        const validWidth = Math.max(0.1, Math.min(1 - validX, relativeWidth));
        const validHeight = Math.max(0.1, Math.min(1 - validY, relativeHeight));
        
        // Crear canvas para recortar
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calcular dimensiones del recorte en píxeles reales de la imagen
        const cropX = Math.round(image.naturalWidth * validX);
        const cropY = Math.round(image.naturalHeight * validY);
        const cropWidth = Math.round(image.naturalWidth * validWidth);
        const cropHeight = Math.round(image.naturalHeight * validHeight);
        
        // Configurar canvas con las dimensiones del recorte
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        console.log('🔍 Recortando:', {
            original: { width: image.naturalWidth, height: image.naturalHeight },
            crop: { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
            relative: { x: validX, y: validY, width: validWidth, height: validHeight }
        });
        
        // Dibujar la imagen recortada
        ctx.drawImage(
            image,
            cropX, cropY, cropWidth, cropHeight,  // Área de origen en imagen original
            0, 0, cropWidth, cropHeight           // Área de destino en canvas
        );
        
        // Convertir a blob y mostrar resultado
        canvas.toBlob(function(blob) {
            if (blob) {
                // Crear URL de la imagen recortada
                const url = URL.createObjectURL(blob);
                
                // Mostrar resultado en pantalla
                showCroppedResult(url, 'Área Seleccionada Recortada');
                
            } else {
                showMessage('❌ Error al procesar la imagen', 'error');
            }
        }, 'image/jpeg', 0.9);
        
    } catch (error) {
        console.error('Error al aplicar recorte:', error);
        showMessage('❌ Error al procesar el recorte', 'error');
    }
}

// Función para resetear el marco al centro
function resetCropFrame() {
    const frame = document.getElementById('crop-frame');
    if (frame) {
        frame.style.left = '12.5%';
        frame.style.top = '12.5%';
        frame.style.width = '75%';
        frame.style.height = '75%';
        
        showMessage('🔄 Marco resetea al centro', 'info');
    }
}

// Función para recortar SOLO lo que está en el cuadro azul
function cropOnlyFrame() {
    const frame = document.getElementById('crop-frame');
    const image = document.getElementById('crop-image');
    const container = document.getElementById('crop-image-container');
    
    if (!frame || !image || !container) {
        showMessage('❌ Error: No se puede procesar la imagen', 'error');
        return;
    }
    
    showMessage('🎯 Recortando solo el área del cuadro...', 'info');
    
    try {
        // Obtener coordenadas exactas del marco azul
        const frameRect = frame.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        
        // Calcular posición relativa del marco respecto a la imagen mostrada
        const relativeX = (frameRect.left - imageRect.left) / image.clientWidth;
        const relativeY = (frameRect.top - imageRect.top) / image.clientHeight;
        const relativeWidth = frameRect.width / image.clientWidth;
        const relativeHeight = frameRect.height / image.clientHeight;
        
        // Asegurar que las coordenadas estén en rango válido [0,1]
        const validX = Math.max(0, Math.min(1, relativeX));
        const validY = Math.max(0, Math.min(1, relativeY));
        const validWidth = Math.max(0.1, Math.min(1 - validX, relativeWidth));
        const validHeight = Math.max(0.1, Math.min(1 - validY, relativeHeight));
        
        // Crear canvas para recortar
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calcular dimensiones del recorte en píxeles reales de la imagen
        const cropX = Math.round(image.naturalWidth * validX);
        const cropY = Math.round(image.naturalHeight * validY);
        const cropWidth = Math.round(image.naturalWidth * validWidth);
        const cropHeight = Math.round(image.naturalHeight * validHeight);
        
        // Configurar canvas con las dimensiones del recorte
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        console.log('🎯 Recortando solo cuadro:', {
            original: { width: image.naturalWidth, height: image.naturalHeight },
            crop: { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
            relative: { x: validX, y: validY, width: validWidth, height: validHeight }
        });
        
        // Dibujar SOLO la imagen dentro del cuadro azul
        ctx.drawImage(
            image,
            cropX, cropY, cropWidth, cropHeight,  // Área de origen (solo el cuadro)
            0, 0, cropWidth, cropHeight           // Área de destino en canvas
        );
        
        // Convertir a blob y mostrar resultado
        canvas.toBlob(function(blob) {
            if (blob) {
                // Crear URL de la imagen recortada
                const url = URL.createObjectURL(blob);
                
                // Mostrar resultado en pantalla
                showCroppedResult(url, 'Solo el Cuadro Recortado');
                
            } else {
                showMessage('❌ Error al procesar el cuadro', 'error');
            }
        }, 'image/jpeg', 0.9);
        
    } catch (error) {
        console.error('Error al recortar cuadro:', error);
        showMessage('❌ Error al procesar el recorte del cuadro', 'error');
    }
}

// Función para mostrar el resultado recortado en pantalla
function showCroppedResult(imageUrl, title) {
    // Cerrar el editor actual
    closeCropEditor();
    
    // Crear modal para mostrar resultado
    const modal = document.createElement('div');
    modal.id = 'cropped-result-modal';
    modal.innerHTML = `
        <div class="result-modal-overlay">
            <div class="result-modal-container">
                <div class="result-header">
                    <h3>✅ ${title}</h3>
                    <button class="result-close" onclick="closeCroppedResult()">✕</button>
                </div>
                <div class="result-content">
                    <div class="result-image-container">
                        <img src="${imageUrl}" alt="Imagen Recortada" class="result-image">
                    </div>
                </div>
                <div class="result-controls">
                    <button class="btn btn-secondary" onclick="closeCroppedResult()">
                        🔄 Volver al Editor
                    </button>
                    <button class="btn btn-primary" onclick="downloadCroppedImage('${imageUrl}')">
                        💾 Descargar
                    </button>
                    <button class="btn btn-confirm" onclick="continueCroppedProcess('${imageUrl}')">
                        ➡️ Continuar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    addResultStyles();
    
    showMessage('✅ Imagen recortada exitosamente', 'success');
}

// Cerrar modal de resultado
function closeCroppedResult() {
    const modal = document.getElementById('cropped-result-modal');
    if (modal) {
        modal.remove();
    }
}

// Descargar imagen recortada
function downloadCroppedImage(imageUrl) {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `documento_recortado_${new Date().getTime()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showMessage('💾 Imagen descargada', 'success');
}

// Continuar con el proceso (placeholder para uso futuro)
function continueCroppedProcess(imageUrl) {
    showMessage('➡️ Continuando con el proceso...', 'info');
    // Aquí puedes agregar la lógica para el siguiente paso
    console.log('Imagen recortada para continuar:', imageUrl);
}

// Estilos para el modal de resultado
function addResultStyles() {
    if (document.getElementById('result-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'result-styles';
    style.textContent = `
        .result-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .result-modal-container {
            background: white;
            border-radius: 15px;
            max-width: 90vw;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .result-header {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .result-header h3 {
            margin: 0;
            font-size: 18px;
        }
        
        .result-close {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 5px 10px;
            border-radius: 50%;
            transition: background 0.3s;
        }
        
        .result-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .result-content {
            flex: 1;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 300px;
        }
        
        .result-image-container {
            max-width: 100%;
            max-height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .result-image {
            max-width: 100%;
            max-height: 60vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .result-controls {
            display: flex;
            gap: 10px;
            justify-content: center;
            padding: 20px;
            border-top: 1px solid #eee;
            flex-wrap: wrap;
        }
        
        .result-controls .btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 120px;
        }
        
        @media (max-width: 768px) {
            .result-controls .btn {
                min-width: 100px;
                font-size: 12px;
                padding: 10px 16px;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Función para aplicar detección automática
function applyAutoDetection() {
    if (currentCoordinates) {
        showMessage('🤖 Aplicando detección automática...', 'info');
        
        const image = document.getElementById('crop-image');
        const container = document.getElementById('crop-image-container');
        
        if (image && container) {
            const imageRect = image.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            setCropFrameFromMLKitCoords(currentCoordinates, imageRect, containerRect);
        }
    } else {
        showMessage('⚠️ No hay detección automática disponible', 'warning');
    }
}

// Función para cerrar el editor
function closeCropEditor() {
    const modal = document.getElementById('crop-editor-modal');
    if (modal) {
        modal.remove();
    }
    
    // Limpiar variables globales
    currentImageData = null;
    currentCoordinates = null;
    
    // Restaurar selección del body
    document.body.style.userSelect = '';
}