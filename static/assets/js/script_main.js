// RindeBus - Script del Menú Principal
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está autenticado
    checkAuthentication();
    
    // Agregar efectos de carga
    addLoadingEffects();
});

function checkAuthentication() {
    // Aquí puedes agregar lógica para verificar si el usuario está logueado
    // Por ahora, solo mostraremos un mensaje de bienvenida
    console.log('Usuario autenticado en RindeBus');
}

function logout() {
    // Mostrar confirmación antes de cerrar sesión
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        showMessage('Cerrando sesión...', 'info');
        
        // Redirigir a la ruta de logout de Django
        setTimeout(() => {
            window.location.href = '/logout/';
        }, 1000);
    }
}

function openModule(module) {
    console.log('🚀 Abriendo módulo:', module);
    
    switch(module) {
        case 'planilla-digital':
            // Detectar si es dispositivo móvil
            if (isMobileDevice()) {
                // Mostrar opciones para móvil
                showMobileOptions();
            } else {
                // En desktop, usar nuestra implementación mejorada
                openCamera();
            }
            break;
        case 'planilla-manual':
            // Redirigir a la página de planilla manual
            showMessage('🔄 Cargando planilla manual...', 'info');
            setTimeout(() => {
                globalThis.location.href = '/manual/';
            }, 1000);
            break;
        case 'consultas':
            showMessage('📋 Módulo Consultas próximamente disponible', 'warning');
            break;
        default:
            showMessage('❌ Módulo no reconocido', 'error');
    }
}

function getModuleName(module) {
    const moduleNames = {
        'planilla-digital': 'Planilla Digital',
        'planilla-manual': 'Planilla Manual',
        'consultas': 'Consultas'
    };
    return moduleNames[module] || module;
}

function handleKeyPress(event, module) {
    // Permitir activación con Enter o Espacio
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModule(module);
    }
}

function showMessage(message, type) {
    // Remover mensaje anterior si existe
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Estilos del mensaje
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-family: Poppins, sans-serif;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        background-color: ${colors[type] || colors.info};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(messageDiv);
    
    // Remover el mensaje después de 3 segundos
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

function addLoadingEffects() {
    // Agregar efectos de carga suaves a las tarjetas
    const cards = document.querySelectorAll('.feature_card');
    
    for (const [index, card] of cards.entries()) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 * (index + 1));
    }
}

// Funciones para Planilla Digital (Cámara + OCR)
function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Detectar dispositivos móviles por User Agent
    const mobileRegex = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isMobileUA = mobileRegex.test(userAgent.toLowerCase());
    
    // Detectar por tamaño de pantalla
    const isMobileScreen = window.innerWidth <= 768;
    
    // Detectar características táctiles
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    console.log('📱 Detección de dispositivo:', {
        isMobileUA,
        isMobileScreen,
        isTouchDevice,
        final: isMobileUA || (isMobileScreen && isTouchDevice)
    });
    
    return isMobileUA || (isMobileScreen && isTouchDevice);
}

// Función para abrir cámara nativa en dispositivos móviles
function openNativeMobileCamera() {
    console.log('📱 Abriendo cámara nativa del dispositivo móvil...');
    
    // Cerrar el modal de opciones si está abierto
    closeMobileOptions();
    
    // Detectar tipo de dispositivo para optimizar
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    
    // Crear input de archivo con capture para cámara
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Usar cámara trasera
    input.style.display = 'none';
    
    // Agregar atributos adicionales para mejor calidad
    input.setAttribute('capture', 'camera');
    
    document.body.appendChild(input);
    
    console.log('📸 Configuración de cámara:', {
        accept: input.accept,
        capture: input.capture,
        isAndroid,
        isIOS
    });
    
    input.onchange = function(event) {
        const files = event.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            
            // Validar que es una imagen
            if (!file.type.startsWith('image/')) {
                showMessage('❌ Por favor selecciona una imagen válida', 'error');
                return;
            }
            
            // Validar tamaño (máximo 10MB)
            if (file.size > 10 * 1024 * 1024) {
                showMessage('⚠️ La imagen es muy grande (máx. 10MB)', 'warning');
                return;
            }
            
            console.log('📄 Archivo capturado:', {
                name: file.name,
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                type: file.type,
                lastModified: new Date(file.lastModified)
            });
            
            // Mostrar mensaje de procesamiento
            showMessage('🤖 Procesando imagen con OpenCV...', 'info');
            
            // Procesar inmediatamente con OpenCV
            processImageWithOpenCV(file);
        } else {
            showMessage('❌ No se seleccionó ninguna imagen', 'error');
        }
        
        // Limpiar y remover el input
        document.body.removeChild(input);
    };
    
    // Manejar cancelación
    input.oncancel = function() {
        console.log('📱 Usuario canceló la captura');
        showMessage('📱 Captura cancelada', 'info');
        document.body.removeChild(input);
    };
    
    // Mostrar mensaje informativo
    showMessage('📱 Abriendo cámara del dispositivo...', 'info');
    
    // Activar la cámara nativa con delay para mejor UX
    setTimeout(() => {
        input.click();
    }, 500);
}

// Mostrar opciones para dispositivos móviles
function showMobileOptions() {
    const optionsHtml = `
        <div class="mobile-options-overlay">
            <div class="options-container">
                <h3>Selecciona una opción</h3>
                <p style="color: #666; margin-bottom: 20px; font-size: 14px;">
                    Elige cómo quieres escanear tu documento
                </p>
                
                <button onclick="openNativeMobileCamera()" class="option-button native-camera">
                    📷 Tomar Nueva Foto
                    <small style="display: block; font-size: 12px; margin-top: 5px; opacity: 0.8;">
                        Detección automática con OpenCV
                    </small>
                </button>
                
                <button onclick="selectFromGallery(); closeMobileOptions();" class="option-button web-camera">
                    📁 Seleccionar de Galería
                    <small style="display: block; font-size: 12px; margin-top: 5px; opacity: 0.8;">
                        Elige una imagen existente
                    </small>
                </button>
                
                <button onclick="closeMobileOptions()" class="option-button cancel">
                    ❌ Cancelar
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', optionsHtml);
}

// Cerrar opciones móviles
function closeMobileOptions() {
    const overlay = document.querySelector('.mobile-options-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function openCamera() {
    // Simular el comportamiento de planilla-digital sin verificación de móvil
    console.log('📷 Iniciando escaneo de documento...');
    showMessage('📷 Preparando cámara...', 'info');
    
    // Abrir cámara web nativa directamente
    setTimeout(() => {
        openNativeCamera();
    }, 500);
}

function openAdvancedDocumentScanner() {
    // Abrir cámara web nativa para mejor rendimiento
    openNativeCamera();
}

// Función para abrir cámara web nativa
function openNativeCamera() {
    console.log('📷 Abriendo cámara web nativa...');
    
    // Crear modal de cámara
    const modal = document.createElement('div');
    modal.id = 'camera-modal';
    modal.className = 'camera-modal';
    modal.innerHTML = `
        <div class="camera-container">
            <div class="camera-header">
                <h3>📷 Escanear Documento</h3>
                <button class="camera-close" onclick="closeCameraModal()">✕</button>
            </div>
            <div class="camera-viewport">
                <video id="camera-video" autoplay playsinline muted></video>
                <canvas id="camera-canvas" style="display: none;"></canvas>
                
                <!-- Marco de detección -->
                <div class="detection-overlay">
                    <div class="detection-frame">
                        <div class="corner-indicator top-left"></div>
                        <div class="corner-indicator top-right"></div>
                        <div class="corner-indicator bottom-left"></div>
                        <div class="corner-indicator bottom-right"></div>
                        <div class="detection-text">📄 Coloca el documento en el marco</div>
                    </div>
                </div>
            </div>
            <div class="camera-controls">
                <button id="capture-btn" class="capture-button" onclick="capturePhoto()" title="Tomar Foto">
                    <div class="capture-circle"></div>
                    <div class="capture-text">📷</div>
                </button>
                <button class="gallery-btn" onclick="selectFromGallery()" title="Seleccionar desde Galería">📁</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    console.log('✅ Modal de cámara creado y agregado al DOM');
    
    addCameraStyles();
    console.log('✅ Estilos de cámara aplicados');
    
    // Inicializar cámara
    initializeCamera();
    console.log('🔄 Inicializando cámara...');
}

// Estilos para la cámara nativa
function addCameraStyles() {
    if (document.getElementById('camera-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'camera-styles';
    style.textContent = `
        .camera-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            font-family: 'Poppins', sans-serif;
        }
        
        .camera-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        
        .camera-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
        }
        
        .camera-close {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 5px;
        }
        
        .camera-viewport {
            flex: 1;
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }
        
        #camera-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .detection-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        
        .detection-frame {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            max-width: 400px;
            aspect-ratio: 1.4;
            border: 2px solid #4CAF50;
            border-radius: 10px;
        }
        
        .corner-indicator {
            position: absolute;
            width: 20px;
            height: 20px;
            border: 3px solid #4CAF50;
        }
        
        .corner-indicator.top-left {
            top: -3px;
            left: -3px;
            border-right: none;
            border-bottom: none;
        }
        
        .corner-indicator.top-right {
            top: -3px;
            right: -3px;
            border-left: none;
            border-bottom: none;
        }
        
        .corner-indicator.bottom-left {
            bottom: -3px;
            left: -3px;
            border-right: none;
            border-top: none;
        }
        
        .corner-indicator.bottom-right {
            bottom: -3px;
            right: -3px;
            border-left: none;
            border-top: none;
        }
        
        .detection-text {
            position: absolute;
            bottom: -40px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 14px;
            background: rgba(0, 0, 0, 0.7);
            padding: 5px 10px;
            border-radius: 5px;
        }
        
        .camera-controls {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            gap: 20px;
            background: rgba(0, 0, 0, 0.8);
        }
        
        .capture-button {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            border: 4px solid white;
            background: #fff;
            cursor: pointer;
            position: relative;
            transition: transform 0.1s;
        }
        
        .capture-button:active {
            transform: scale(0.95);
        }
        
        .capture-circle {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #4CAF50;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        
        .capture-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
            color: white;
        }
        
        .gallery-btn {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 2px solid white;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            font-size: 20px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .gallery-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    `;
    
    document.head.appendChild(style);
}

// Funciones esenciales para el procesamiento de imágenes

async function initializeCamera() {
    try {
        console.log('🔍 Iniciando cámara...');
        const video = document.getElementById('camera-video');
        
        if (!video) {
            console.error('❌ Elemento video no encontrado');
            showMessage('❌ Error: Elemento video no encontrado', 'error');
            return;
        }
        
        // Verificar soporte de mediaDevices
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('❌ getUserMedia no soportado');
            showMessage('❌ Tu navegador no soporta acceso a cámara', 'error');
            return;
        }
        
        console.log('📷 Solicitando acceso a cámara...');
        
        // Intentar con cámara trasera primero
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            console.log('✅ Cámara trasera obtenida');
        } catch (backError) {
            console.log('⚠️ Cámara trasera no disponible, intentando cámara frontal...');
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        facingMode: 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });
                console.log('✅ Cámara frontal obtenida');
            } catch (frontError) {
                console.log('⚠️ Cámara frontal fallida, intentando sin restricciones...');
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true
                });
                console.log('✅ Cámara básica obtenida');
            }
        }
        
        video.srcObject = stream;
        console.log('📹 Stream asignado al video');
        
        // Esperar a que el video esté listo
        video.onloadedmetadata = async () => {
            console.log('📐 Video metadata cargada:', {
                width: video.videoWidth,
                height: video.videoHeight
            });
            
            try {
                await video.play();
                console.log('▶️ Video reproduciendo correctamente');
                showMessage('✅ Cámara inicializada correctamente', 'success');
            } catch (playError) {
                console.error('❌ Error reproduciendo video:', playError);
                showMessage('❌ Error iniciando reproducción de video', 'error');
            }
        };
        
        video.onerror = (error) => {
            console.error('❌ Error en video:', error);
            showMessage('❌ Error reproduciendo video de cámara', 'error');
        };
        
    } catch (error) {
        console.error('❌ Error inicializando cámara:', error);
        let errorMessage = '❌ Error accediendo a la cámara';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = '❌ Permiso de cámara denegado. Por favor, permite el acceso.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = '❌ No se encontró ninguna cámara en el dispositivo.';
        } else if (error.name === 'NotReadableError') {
            errorMessage = '❌ Cámara en uso por otra aplicación.';
        }
        
        showMessage(errorMessage, 'error');
    }
}

async function capturePhoto() {
    console.log('📸 Iniciando captura de foto...');
    
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    
    if (!video) {
        console.error('❌ Elemento video no encontrado');
        showMessage('❌ Error: Elemento video no encontrado', 'error');
        return;
    }
    
    if (!canvas) {
        console.error('❌ Elemento canvas no encontrado');
        showMessage('❌ Error: Elemento canvas no encontrado', 'error');
        return;
    }
    
    // Verificar que el video esté reproduciendo
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('❌ Video no está reproduciendo');
        showMessage('❌ Error: La cámara no está activa. Espera un momento e intenta de nuevo.', 'error');
        return;
    }
    
    // Verificar que el stream esté activo
    if (!video.srcObject) {
        console.error('❌ Stream no está asignado');
        showMessage('❌ Error: Stream de cámara no disponible', 'error');
        return;
    }
    
    // Verificar que el video no esté pausado
    if (video.paused) {
        console.warn('⚠️ Video pausado, intentando reanudar...');
        try {
            await video.play();
        } catch (playError) {
            console.error('❌ Error reanudando video:', playError);
            showMessage('❌ Error: No se puede reanudar el video', 'error');
            return;
        }
    }
    
    console.log('📹 Estado del video:', {
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        currentTime: video.currentTime,
        duration: video.duration
    });
    
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    try {
        ctx.drawImage(video, 0, 0);
        console.log('✅ Imagen dibujada en canvas');
        
        canvas.toBlob(function(blob) {
            if (!blob) {
                console.error('❌ Error creando blob de imagen');
                showMessage('❌ Error procesando la captura', 'error');
                return;
            }
            
            console.log('📄 Blob creado:', {
                size: `${(blob.size / 1024).toFixed(2)} KB`,
                type: blob.type
            });
            
            const file = new File([blob], `captura_${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            console.log('📁 Archivo creado:', {
                name: file.name,
                size: `${(file.size / 1024).toFixed(2)} KB`,
                type: file.type
            });
            
            // Cerrar modal de cámara
            closeCameraModal();
            
            // Procesar inmediatamente con OpenCV
            showMessage('🤖 Procesando imagen capturada con OpenCV...', 'info');
            processImageWithOpenCV(file);
            
        }, 'image/jpeg', 0.9);
    } catch (error) {
        console.error('❌ Error en captura:', error);
        showMessage('❌ Error capturando la imagen', 'error');
    }
}

function closeCameraModal() {
    const modal = document.getElementById('camera-modal');
    if (modal) {
        const video = document.getElementById('camera-video');
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        modal.remove();
    }
}

function selectFromGallery() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            // Cerrar cámara si está abierta
            closeCameraModal();
            
            showMessage('📁 Procesando imagen de galería...', 'info');
            processGalleryImage(file);
        }
        input.remove();
    };
    
    document.body.appendChild(input);
    input.click();
}

async function processGalleryImage(file) {
    try {
        console.log('📁 Procesando imagen de galería sin OpenCV...');
        console.log('📊 Archivo recibido:', {
            name: file.name,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            type: file.type
        });
        
        showMessage('📁 Preparando imagen...', 'info');
        
        // Convertir imagen a base64 con calidad optimizada
        console.log('🔄 Convirtiendo archivo a base64...');
        const base64Image = await fileToBase64(file);
        console.log('✅ Conversión completada');
        
        // Mostrar imagen tal como está y procesar con Azure
        const result = {
            success: true,
            document_found: true,
            processed_image: base64Image.replace(/^data:image\/[a-z]+;base64,/, ''), // Quitar prefijo
            confidence: 1.0, // 100% de confianza ya que es selección manual
            original_size: [file.width || 0, file.height || 0],
            message: 'Imagen seleccionada de galería',
            source: 'gallery'
        };
        
        console.log('📋 Resultado de galería:', result);
        showMessage('✅ Imagen preparada exitosamente', 'success');
        
        // Mostrar imagen y opciones
        showDocumentDetectionResult(result);
        
    } catch (error) {
        console.error('❌ Error procesando imagen de galería:', error);
        showMessage('❌ Error procesando imagen: ' + error.message, 'error');
    }
}

async function processImageWithOpenCV(file) {
    try {
        console.log('🤖 Iniciando procesamiento con OpenCV...');
        console.log('📁 Archivo recibido:', {
            name: file.name,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            type: file.type
        });
        
        // Mostrar spinner de carga con OpenCV
        showLoadingSpinner('Procesando con OpenCV...');
        
        console.log('🔄 Convirtiendo archivo a base64...');
        console.log('📊 Dimensiones del archivo original antes de conversión:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified)
        });
        
        // Convertir archivo a base64
        const base64Image = await fileToBase64(file);
        console.log('✅ Conversión a base64 completada');
        console.log('📏 Tamaño base64:', base64Image.length, 'caracteres');
        
        console.log('🌐 Enviando petición al backend...');
        console.log('📍 URL:', '/api/detect-document/');
        
        // Enviar al backend Django para detección con OpenCV
        const response = await fetch('/api/detect-document/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                image: base64Image,
                auto_crop: true,
                enhance_image: true,
                source: 'gallery' // Indicar que viene de galería
            })
        });
        
        console.log('📨 Respuesta recibida:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });
        
        if (!response.ok) {
            console.error('❌ Error HTTP:', response.status, response.statusText);
            hideLoadingSpinner();
            showMessage(`❌ Error del servidor: ${response.status} ${response.statusText}`, 'error');
            return;
        }
        
        const result = await response.json();
        console.log('📊 Resultado procesado:', result);
        
        if (result.success) {
            // Documento detectado exitosamente con OpenCV
            console.log('✅ Detección exitosa con confianza:', result.confidence);
            hideLoadingSpinner();
            showDocumentDetectionResult(result);
        } else {
            // Error en la detección OpenCV
            console.error('❌ Error en detección:', result.error);
            hideLoadingSpinner();
            showMessage(`❌ Error OpenCV: ${result.error || 'No se pudo detectar el documento'}`, 'error');
            
            // Fallback: permitir recorte manual
            showManualCropOption(file);
        }
        
    } catch (error) {
        console.error('❌ Error procesando imagen con OpenCV:', error);
        console.error('📊 Detalles del error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        hideLoadingSpinner();
        showMessage('❌ Error de conexión con el servidor OpenCV', 'error');
        
        // Fallback: permitir recorte manual
        showManualCropOption(file);
    }
}

// Función auxiliar para convertir archivo a base64
function fileToBase64(file, maxWidth = 2000, maxHeight = 2000, quality = 0.92) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = function() {
            console.log('🖼️ Imagen original cargada:', {
                width: img.width,
                height: img.height,
                aspectRatio: (img.width / img.height).toFixed(2)
            });
            
            // Calcular nuevas dimensiones manteniendo proporción
            let { width, height } = img;
            
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
                console.log('📐 Redimensionando a:', { width, height, ratio: ratio.toFixed(2) });
            } else {
                console.log('📐 Manteniendo tamaño original');
            }
            
            // Configurar canvas
            canvas.width = width;
            canvas.height = height;
            
            // Mejorar calidad de renderizado
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Dibujar imagen redimensionada
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertir a base64 con calidad especificada
            const base64 = canvas.toDataURL('image/jpeg', quality);
            console.log('✅ Imagen procesada y convertida a base64:', {
                finalSize: `${width}x${height}`,
                base64Length: base64.length,
                compressionRatio: ((file.size - base64.length) / file.size * 100).toFixed(1) + '%'
            });
            
            resolve(base64);
        };
        
        img.onerror = () => {
            console.error('❌ Error cargando imagen');
            // Fallback al método original
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        };
        
        // Cargar imagen
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => img.src = e.target.result;
        reader.onerror = error => reject(error);
    });
}

// Función auxiliar para obtener CSRF token
function getCsrfToken() {
    console.log('🔐 Obteniendo CSRF token...');
    
    // Primero intentar desde el meta tag
    const metaToken = document.querySelector('meta[name="csrf-token"]');
    if (metaToken) {
        console.log('✅ CSRF token encontrado en meta tag');
        return metaToken.content;
    }
    
    // Fallback: intentar desde cookies
    const cookieValue = document.cookie.match('(^|;)\\s*csrftoken\\s*=\\s*([^;]+)');
    if (cookieValue) {
        console.log('✅ CSRF token encontrado en cookies');
        return cookieValue.pop();
    }
    
    console.log('⚠️ CSRF token no encontrado');
    return '';
}

// Mostrar resultado de la detección automática de OpenCV
function showDocumentDetectionResult(result) {
    const existingModal = document.getElementById('opencv-result-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'opencv-result-modal';
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10001; display: flex; flex-direction: column;">
            <div style="padding: 20px; color: white; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.8);">
                <h3>${result.source === 'gallery' ? '� Imagen de Galería' : '�📄 Documento Recortado Automáticamente'}</h3>
                <div style="background: #4CAF50; padding: 5px 10px; border-radius: 15px; font-size: 12px;">
                    ${result.source === 'gallery' ? 'Selección Manual' : `Precisión: ${Math.round((result.confidence || 0) * 100)}%`}
                </div>
                <button onclick="closeOpenCVResult()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">✕</button>
            </div>
            
            <div style="flex: 1; display: flex; justify-content: center; align-items: center; padding: 20px;">
                ${result.processed_image ? `
                    <div style="text-align: center;">
                        <img src="data:image/jpeg;base64,${result.processed_image}" style="max-width: 90%; max-height: 70vh; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                        <p style="color: white; margin-top: 15px;">
                            ${result.source === 'gallery' 
                                ? '✅ Imagen seleccionada de galería' 
                                : `✅ Documento recortado con ${Math.round((result.confidence || 0) * 100)}% de confianza`
                            }
                        </p>
                    </div>
                ` : `
                    <div style="text-align: center; color: white;">
                        <h4>❌ No se pudo detectar el documento</h4>
                        <p>Intenta con mejor iluminación o ángulo</p>
                    </div>
                `}
            </div>
            
            <div style="padding: 20px; display: flex; gap: 10px; justify-content: center;">
                <button onclick="closeOpenCVResult(); selectFromGallery();" style="padding: 12px 24px; background: #FF9800; color: white; border: none; border-radius: 25px; cursor: pointer;">
                    � Seleccionar de Galería
                </button>
                ${result.processed_image ? `
                <button onclick="processWithAzureOCR('${result.processed_image}', '${result.processing_id || ''}')" style="padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 25px; cursor: pointer;">
                    � Cargar
                </button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    showMessage(
        result.source === 'gallery' 
            ? `✅ Imagen de galería lista para procesar` 
            : `✅ Documento recortado con ${Math.round((result.confidence || 0) * 100)}% de precisión`, 
        'success'
    );
}

function showLoadingSpinner(message = 'Procesando...') {
    const existingSpinner = document.getElementById('opencv-spinner');
    if (existingSpinner) {
        existingSpinner.remove();
    }
    
    const spinner = document.createElement('div');
    spinner.id = 'opencv-spinner';
    spinner.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10002; display: flex; justify-content: center; align-items: center;">
            <div style="background: white; padding: 30px; border-radius: 15px; text-align: center; max-width: 300px;">
                <div style="width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #4285f4; border-radius: 50%; animation: spin 2s linear infinite; margin: 0 auto 20px;"></div>
                <h3 style="margin: 0 0 10px 0;">🤖 OpenCV</h3>
                <p style="margin: 0; color: #666;">${message}</p>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </div>
        </div>
    `;
    
    document.body.appendChild(spinner);
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('opencv-spinner');
    if (spinner) {
        spinner.remove();
    }
}

function closeOpenCVResult() {
    const modal = document.getElementById('opencv-result-modal');
    if (modal) {
        modal.remove();
    }
}

function showManualCropOption(file) {
    if (confirm('🤖 La detección automática no funcionó.\n\n¿Deseas recortar el documento manualmente?')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Aquí podrías implementar el editor de recorte manual
            showMessage('📝 Editor manual próximamente disponible', 'info');
        };
        reader.readAsDataURL(file);
    }
}

async function saveProcessedDocument(processedImageBase64, processingId) {
    try {
        showMessage('💾 Guardando documento...', 'info');
        
        const link = document.createElement('a');
        link.download = `documento_${new Date().getTime()}.jpg`;
        link.href = `data:image/jpeg;base64,${processedImageBase64}`;
        link.click();
        
        showMessage('✅ Documento guardado exitosamente', 'success');
        closeOpenCVResult();
        
    } catch (error) {
        console.error('Error guardando documento:', error);
        showMessage('❌ Error al guardar el documento', 'error');
    }
}

// Configuración de API
const API_BASE = 'http://127.0.0.1:8000/api';

async function processWithAzureOCR(processedImageBase64, processingId) {
    try {
        console.log('🚀 Enviando imagen procesada...');
        showMessage('🚀 Enviando imagen...', 'info');
        
        // Mostrar spinner de carga
        showLoadingSpinner('Subiendo imagen...');
        
        // Convertir base64 a blob
        const imageBlob = base64ToBlob(processedImageBase64, 'image/jpeg');
        const imageFile = new File([imageBlob], `planilla_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Crear FormData para envío
        const formData = new FormData();
        formData.append('imagen', imageFile);
        
        // Enviar através del proxy (funciona tanto en localhost como ngrok)
        console.log('📤 Subiendo imagen...');
        const response = await fetch('/api/planillas/', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Imagen subida exitosamente:', result);
            hideLoadingSpinner();
            
            // Obtener ID de la planilla
            const planillaId = result.id;
            showMessage(`✅ Imagen guardada! ID: ${planillaId}`, 'success');
            
            // Cerrar modal de OpenCV
            closeOpenCVResult();
            
            // Obtener datos extraídos de la API
            setTimeout(async () => {
                showMessage('🔄 Obteniendo datos extraídos...', 'info');
                
                try {
                    const datosResponse = await fetch(`/api/planillas/${planillaId}/datos_extraidos/`);
                    
                    if (datosResponse.ok) {
                        const datosExtraidos = await datosResponse.json();
                        console.log('📊 Datos extraídos:', datosExtraidos);
                        
                        // Guardar datos en localStorage para usarlos en manual.html
                        localStorage.setItem('planilla_datos_extraidos', JSON.stringify(datosExtraidos));
                        localStorage.setItem('planilla_id', planillaId);
                        
                        showMessage('✅ Datos extraídos obtenidos!', 'success');
                    } else {
                        console.warn('⚠️ No se pudieron obtener datos extraídos');
                        showMessage('⚠️ Imagen guardada, pero sin datos extraídos', 'warning');
                    }
                } catch (error) {
                    console.error('❌ Error obteniendo datos extraídos:', error);
                    showMessage('⚠️ Error obteniendo datos', 'warning');
                }
                
                // Redirigir a manual.html
                setTimeout(() => {
                    window.location.href = '/manual/';
                }, 1000);
            }, 2000); // Esperar 2 segundos para que se procese la imagen
        } else {
            throw new Error(result.error || `HTTP ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Error enviando imagen:', error);
        hideLoadingSpinner();
        showMessage('❌ Error cargando imagen: ' + error.message, 'error');
    }
}

// Función auxiliar para convertir base64 a blob
function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

function showExtractedData(extractedData, confidence) {
    console.log('📋 Mostrando datos extraídos:', extractedData);
    
    // Crear modal para mostrar datos extraídos
    const existingModal = document.getElementById('extracted-data-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'extracted-data-modal';
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10001; display: flex; flex-direction: column; overflow-y: auto;">
            <div style="padding: 20px; color: white; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.8);">
                <h3>📋 Datos Extraídos del Documento</h3>
                <div style="background: #2196F3; padding: 5px 10px; border-radius: 15px; font-size: 12px;">
                    Confianza: ${Math.round((confidence || 0) * 100)}%
                </div>
                <button onclick="closeExtractedDataModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">✕</button>
            </div>
            
            <div style="flex: 1; padding: 20px; color: white; max-width: 800px; margin: 0 auto;">
                <div id="extracted-data-content">
                    ${formatExtractedData(extractedData)}
                </div>
            </div>
            
            <div style="padding: 20px; display: flex; gap: 10px; justify-content: center;">
                <button onclick="editExtractedData()" style="padding: 12px 24px; background: #FF9800; color: white; border: none; border-radius: 25px; cursor: pointer;">
                    ✏️ Editar Datos
                </button>
                <button onclick="confirmExtractedData()" style="padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 25px; cursor: pointer;">
                    ✅ Confirmar y Continuar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function formatExtractedData(data) {
    // Formatear los datos extraídos para mostrar de forma legible
    if (!data || typeof data !== 'object') {
        return '<p style="text-align: center; color: #ccc;">No se pudieron extraer datos del documento</p>';
    }
    
    let html = '<div style="display: grid; gap: 15px;">';
    
    // Campos típicos de planillas que Azure puede extraer
    const fieldLabels = {
        'rut': 'RUT',
        'nombre': 'Nombre',
        'apellido': 'Apellido',
        'fecha': 'Fecha',
        'monto': 'Monto',
        'tipo_documento': 'Tipo de Documento',
        'numero_documento': 'Número de Documento',
        'empresa': 'Empresa',
        'direccion': 'Dirección',
        'telefono': 'Teléfono',
        'email': 'Email',
        'codigo': 'Código',
        'descripcion': 'Descripción',
        'observaciones': 'Observaciones'
    };
    
    // Recorrer todos los campos extraídos
    Object.keys(data).forEach(key => {
        const value = data[key];
        const label = fieldLabels[key.toLowerCase()] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Solo mostrar campos que tengan valor
        if (value && value !== 'null' && value !== 'undefined' && value.toString().trim() !== '') {
            html += `
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
                    <div style="font-weight: bold; color: #2196F3; margin-bottom: 5px;">${label}:</div>
                    <div style="font-size: 16px; word-break: break-word;">${value}</div>
                </div>
            `;
        }
    });
    
    // Si no hay datos para mostrar
    if (html === '<div style="display: grid; gap: 15px;">') {
        html += '<p style="text-align: center; color: #ccc;">No se encontraron datos específicos en el documento</p>';
    }
    
    html += '</div>';
    return html;
}

function closeExtractedDataModal() {
    const modal = document.getElementById('extracted-data-modal');
    if (modal) {
        modal.remove();
    }
}

function editExtractedData() {
    console.log('✏️ Iniciando modo de edición...');
    
    // Obtener el contenedor de datos
    const dataContent = document.getElementById('extracted-data-content');
    if (!dataContent) return;
    
    // Convertir todos los campos a editables
    const dataFields = dataContent.querySelectorAll('div[style*="background: rgba(255,255,255,0.1)"]');
    
    dataFields.forEach(field => {
        const valueDiv = field.querySelector('div:last-child');
        if (valueDiv) {
            const currentValue = valueDiv.textContent;
            const fieldLabel = field.querySelector('div:first-child').textContent;
            
            // Crear input editable
            valueDiv.innerHTML = `
                <input type="text" 
                       value="${currentValue}" 
                       style="width: 100%; padding: 8px; border: 1px solid #2196F3; border-radius: 4px; background: rgba(255,255,255,0.9); color: #000; font-size: 16px;"
                       data-field="${fieldLabel.replace(':', '').toLowerCase().replace(/\s+/g, '_')}"
                />
            `;
        }
    });
    
    // Cambiar botones de acción
    const buttonsContainer = document.querySelector('#extracted-data-modal div[style*="padding: 20px; display: flex"]');
    if (buttonsContainer) {
        buttonsContainer.innerHTML = `
            <button onclick="cancelEdit()" style="padding: 12px 24px; background: #f44336; color: white; border: none; border-radius: 25px; cursor: pointer;">
                ❌ Cancelar
            </button>
            <button onclick="saveEditedData()" style="padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 25px; cursor: pointer;">
                💾 Guardar Cambios
            </button>
        `;
    }
    
    showMessage('✏️ Modo de edición activado. Modifica los datos y guarda', 'info');
}

function cancelEdit() {
    // Recargar el modal con los datos originales
    closeExtractedDataModal();
    showMessage('❌ Edición cancelada', 'info');
}

function saveEditedData() {
    console.log('💾 Guardando datos editados...');
    
    // Recolectar todos los valores editados
    const inputs = document.querySelectorAll('#extracted-data-content input[data-field]');
    const editedData = {};
    
    inputs.forEach(input => {
        const field = input.getAttribute('data-field');
        const value = input.value.trim();
        if (value) {
            editedData[field] = value;
        }
    });
    
    console.log('📝 Datos editados:', editedData);
    
    // Mostrar confirmación
    showMessage('💾 Cambios guardados exitosamente', 'success');
    
    // Convertir de vuelta a modo de solo lectura
    const dataContent = document.getElementById('extracted-data-content');
    if (dataContent) {
        dataContent.innerHTML = formatExtractedData(editedData);
    }
    
    // Restaurar botones originales
    const buttonsContainer = document.querySelector('#extracted-data-modal div[style*="padding: 20px; display: flex"]');
    if (buttonsContainer) {
        buttonsContainer.innerHTML = `
            <button onclick="editExtractedData()" style="padding: 12px 24px; background: #FF9800; color: white; border: none; border-radius: 25px; cursor: pointer;">
                ✏️ Editar Datos
            </button>
            <button onclick="confirmExtractedData()" style="padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 25px; cursor: pointer;">
                ✅ Confirmar y Continuar
            </button>
        `;
    }
}

function confirmExtractedData() {
    // Función para confirmar y continuar con los datos
    showMessage('✅ Datos confirmados. Redirigiendo a planilla manual...', 'success');
    closeExtractedDataModal();
    
    // Redirigir a manual.html después de 1.5 segundos
    setTimeout(() => {
        window.location.href = '/manual/';
    }, 1500);
}

// Nueva función para mostrar lista de planillas
async function mostrarListaPlanillas() {
    try {
        showMessage('📋 Cargando lista de planillas...', 'info');
        const planillas = await listarPlanillas();
        
        if (planillas && planillas.length > 0) {
            console.log('📋 Planillas encontradas:', planillas);
            showMessage(`✅ Se encontraron ${planillas.length} planillas`, 'success');
            
            // Aquí podrías mostrar un modal con la lista
            // Por ahora solo mostrar en consola
            planillas.forEach((planilla, index) => {
                console.log(`${index + 1}. Planilla ID: ${planilla.id}, Fecha: ${planilla.created_at || 'N/A'}`);
            });
        } else {
            showMessage('📋 No se encontraron planillas', 'info');
        }
    } catch (error) {
        console.error('Error listando planillas:', error);
        showMessage('❌ Error al cargar lista de planillas', 'error');
    }
}