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
        // Aquí puedes agregar lógica para limpiar datos de sesión
        
        // Mostrar mensaje de despedida
        showMessage('Cerrando sesión...', 'info');
        
        // Redirigir al login después de un breve delay
        setTimeout(() => {
            globalThis.location.href = 'inicio.html';
        }, 1500);
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
            showMessage('🤖 Procesando imagen con Google ML Kit...', 'info');
            
            // Procesar inmediatamente con ML Kit
            processImageWithMLKit(file);
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

// Función para intentar integración con Google Lens
function openWithGoogleLens() {
    console.log('🔍 Intentando abrir Google Lens...');
    
    // Cerrar el modal de opciones primero
    closeMobileOptions();
    
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isChrome = /chrome/i.test(navigator.userAgent);
    
    if (isAndroid) {
        // Para Android - mejorada con detección más específica
        showMessage('🔍 Intentando abrir Google Lens...', 'info');
        
        // Método 1: Intent directo para Google Lens
        const intentUrl = 'intent://scan#Intent;scheme=googlelens;package=com.google.ar.lens;S.source=homescreen;end';
        
        // Crear un enlace temporal
        const link = document.createElement('a');
        link.href = intentUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // Intentar activar
        link.click();
        document.body.removeChild(link);
        
        // Método 2: Fallback con Google App
        setTimeout(() => {
            const googleAppIntent = 'intent://lens#Intent;scheme=google;package=com.google.android.googlequicksearchbox;end';
            const link2 = document.createElement('a');
            link2.href = googleAppIntent;
            link2.style.display = 'none';
            document.body.appendChild(link2);
            link2.click();
            document.body.removeChild(link2);
        }, 1000);
        
        // Método 3: Abrir Google Lens via web si no funciona
        setTimeout(() => {
            if (isChrome) {
                window.open('https://lens.google.com/', '_blank');
                showMessage('🌐 Google Lens abierto en navegador', 'info');
            } else {
                showMessage('📱 Instala Google Lens o Google App para mejor experiencia', 'warning');
                openNativeMobileCamera();
            }
        }, 3000);
        
    } else if (isIOS) {
        // Para iOS - mejorada
        showMessage('🔍 Intentando abrir Google Lens en iOS...', 'info');
        
        // Método 1: Google App con Lens
        window.location.href = 'googleapp://lens';
        
        // Método 2: Fallback con Google App general
        setTimeout(() => {
            window.location.href = 'googlegmail://';
        }, 1000);
        
        // Método 3: Abrir en Safari si está disponible
        setTimeout(() => {
            window.open('https://lens.google.com/', '_blank');
            showMessage('🌐 Google Lens abierto en Safari', 'info');
        }, 2500);
        
    } else {
        // Desktop - mejorado con más opciones
        showMessage('💻 Abriendo Google Lens en navegador...', 'info');
        
        if (isChrome) {
            // En Chrome, intentar abrir con mejor integración
            window.open('https://lens.google.com/', '_blank', 'width=800,height=600');
        } else {
            // En otros navegadores
            window.open('https://lens.google.com/', '_blank');
        }
        
        // Mostrar instrucciones adicionales
        setTimeout(() => {
            showMessage('� Tip: Arrastra tu imagen a Google Lens o usa "Subir imagen"', 'info');
        }, 2000);
        
        // Ofrecer alternativa local
        setTimeout(() => {
            const useLocal = confirm('¿Prefieres usar nuestra cámara local con análisis mejorado?');
            if (useLocal) {
                openCamera();
            }
        }, 5000);
    }
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
                
                <button onclick="openWithGoogleLens()" class="option-button google-lens">
                    🔍 Usar Google Lens
                    <small style="display: block; font-size: 12px; margin-top: 5px; opacity: 0.8;">
                        Recomendado: Mejor detección automática
                    </small>
                </button>
                
                <button onclick="openNativeMobileCamera()" class="option-button native-camera">
                    📷 Cámara del dispositivo
                    <small style="display: block; font-size: 12px; margin-top: 5px; opacity: 0.8;">
                        Captura simple y rápida
                    </small>
                </button>
                
                <button onclick="openCamera()" class="option-button web-camera">
                    🌐 Cámara web (avanzado)
                    <small style="display: block; font-size: 12px; margin-top: 5px; opacity: 0.8;">
                        Con herramientas de recorte
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
            overflow: hidden;
        }
        
        .camera-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        
        .camera-header {
            background: rgba(0, 0, 0, 0.8);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: white;
        }
        
        .camera-header h3 {
            margin: 0;
            font-size: 18px;
        }
        
        .camera-close {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 5px 10px;
            border-radius: 50%;
            transition: background 0.3s;
        }
        
        .camera-close:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .camera-viewport {
            flex: 1;
            position: relative;
            overflow: hidden;
            height: calc(100vh - 80px - 160px);
            display: flex;
            align-items: center;
            justify-content: center;
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
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            padding: 20px;
        }
        
        .detection-frame {
            width: 80%;
            max-width: 300px;
            max-height: 400px;
            aspect-ratio: 3/4;
            border: 3px solid #4CAF50;
            border-radius: 8px;
            position: relative;
            background: rgba(76, 175, 80, 0.1);
            box-shadow: 
                0 0 0 2px rgba(76, 175, 80, 0.3),
                0 0 0 2000px rgba(0, 0, 0, 0.4);
        }
        
        .corner-indicator {
            position: absolute;
            width: 24px;
            height: 24px;
            border: 4px solid #4CAF50;
            background: rgba(76, 175, 80, 0.7);
            animation: corner-pulse 2s infinite;
        }
        
        @keyframes corner-pulse {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.7;
                transform: scale(1.1);
            }
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
            bottom: -35px;
            left: 50%;
            transform: translateX(-50%);
            color: #4CAF50;
            background: rgba(0, 0, 0, 0.8);
            padding: 6px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            border: 1px solid #4CAF50;
        }
        
        .camera-controls {
            background: rgba(0, 0, 0, 0.95);
            padding: 30px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 40px;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 10001;
            height: 160px;
            border-top: 2px solid rgba(76, 175, 80, 0.3);
        }
        
        .capture-button {
            width: 100px;
            height: 100px;
            border: 6px solid #4CAF50;
            border-radius: 50%;
            background: rgba(76, 175, 80, 0.2);
            cursor: pointer;
            position: relative;
            transition: all 0.3s ease;
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
            animation: pulse-ready 2s infinite;
        }
        
        @keyframes pulse-ready {
            0% {
                box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
            }
            70% {
                box-shadow: 0 0 0 20px rgba(76, 175, 80, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
            }
        }
        
        .capture-button:hover {
            transform: scale(1.1);
            border-color: #45a049;
            background: rgba(76, 175, 80, 0.3);
            animation: none;
        }
        
        .capture-button:active {
            transform: scale(0.95);
        }
        
        .capture-circle {
            width: 80px;
            height: 80px;
            background: #4CAF50;
            border-radius: 50%;
            margin: 4px auto;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .capture-button:hover .capture-circle {
            background: #45a049;
        }
        
        .capture-text {
            font-size: 32px;
            color: white;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }
        
        .gallery-btn {
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid white;
            border-radius: 12px;
            color: white;
            font-size: 20px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .gallery-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        @media (max-width: 768px) {
            .detection-frame {
                width: 90%;
            }
            
            .camera-controls {
                padding: 30px 20px;
                gap: 30px;
                min-height: 120px;
            }
            
            .capture-button {
                width: 80px;
                height: 80px;
                border-width: 4px;
            }
            
            .capture-circle {
                width: 60px;
                height: 60px;
                margin: 6px auto;
            }
            
            .gallery-btn {
                width: 45px;
                height: 45px;
                font-size: 18px;
            }
        }
        
        @media (max-width: 480px) {
            .camera-header {
                padding: 12px 15px;
            }
            
            .camera-header h3 {
                font-size: 16px;
            }
            
            .camera-controls {
                padding: 25px 15px;
                gap: 25px;
                min-height: 100px;
            }
            
            .capture-button {
                width: 70px;
                height: 70px;
                border-width: 3px;
            }
            
            .capture-circle {
                width: 50px;
                height: 50px;
                margin: 7px auto;
            }
        }
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Inicializar cámara web
async function initializeCamera() {
    const video = document.getElementById('camera-video');
    
    if (!video) {
        console.error('❌ Elemento video no encontrado');
        showMessage('❌ Error: Elemento video no encontrado', 'error');
        return;
    }
    
    try {
        console.log('🔄 Solicitando acceso a la cámara...');
        
        // Configuración de cámara optimizada para documentos
        const constraints = {
            video: {
                width: { ideal: 1920, max: 1920 },
                height: { ideal: 1080, max: 1080 },
                facingMode: { ideal: 'environment' }, // Cámara trasera
                focusMode: { ideal: 'continuous' },
                exposureMode: { ideal: 'continuous' },
                whiteBalanceMode: { ideal: 'continuous' }
            }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        console.log('✅ Cámara inicializada correctamente');
        console.log('📐 Stream tracks:', stream.getTracks().map(track => ({
            kind: track.kind,
            label: track.label,
            enabled: track.enabled
        })));
        
        // Verificar que el botón de captura esté visible
        setTimeout(() => {
            const captureBtn = document.getElementById('capture-btn');
            if (captureBtn) {
                console.log('✅ Botón de captura encontrado:', {
                    visible: captureBtn.offsetParent !== null,
                    display: window.getComputedStyle(captureBtn).display,
                    opacity: window.getComputedStyle(captureBtn).opacity,
                    zIndex: window.getComputedStyle(captureBtn).zIndex
                });
            } else {
                console.error('❌ Botón de captura NO encontrado');
            }
        }, 1000);
        
        showMessage('📷 Cámara lista - Botón de captura visible abajo', 'success');
        
    } catch (error) {
        console.error('❌ Error accessing camera:', error);
        showMessage(`❌ No se pudo acceder a la cámara: ${error.message}`, 'error');
        
        // Fallback a selector de archivos
        setTimeout(() => {
            closeCameraModal();
            selectFromGallery();
        }, 2000);
    }
}

// Capturar foto
function capturePhoto() {
    console.log('📷 Capturando foto...');
    
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const detectionFrame = document.querySelector('.detection-frame');
    
    if (!video || !canvas || !detectionFrame) {
        console.error('❌ Elementos necesarios no encontrados');
        showMessage('❌ Error: Elementos de cámara no encontrados', 'error');
        return;
    }
    
    if (!video.videoWidth || video.videoWidth === 0) {
        console.error('❌ Video no está listo o no tiene dimensiones');
        showMessage('❌ Cámara no está lista - Espera un momento', 'error');
        return;
    }
    
    // Obtener dimensiones del marco de detección
    const frameRect = detectionFrame.getBoundingClientRect();
    const videoRect = video.getBoundingClientRect();
    
    // Calcular coordenadas relativas del marco respecto al video
    const relativeX = (frameRect.left - videoRect.left) / videoRect.width;
    const relativeY = (frameRect.top - videoRect.top) / videoRect.height;
    const relativeWidth = frameRect.width / videoRect.width;
    const relativeHeight = frameRect.height / videoRect.height;
    
    // Asegurar que las coordenadas estén en rango válido [0,1]
    const cropX = Math.max(0, Math.min(1, relativeX));
    const cropY = Math.max(0, Math.min(1, relativeY));
    const cropWidth = Math.max(0.1, Math.min(1 - cropX, relativeWidth));
    const cropHeight = Math.max(0.1, Math.min(1 - cropY, relativeHeight));
    
    console.log('📐 Área del marco de detección:', {
        frame: { x: frameRect.left, y: frameRect.top, width: frameRect.width, height: frameRect.height },
        video: { x: videoRect.left, y: videoRect.top, width: videoRect.width, height: videoRect.height },
        relative: { x: relativeX, y: relativeY, width: relativeWidth, height: relativeHeight },
        crop: { x: cropX, y: cropY, width: cropWidth, height: cropHeight }
    });
    
    // Configurar canvas con dimensiones del área recortada
    const finalWidth = Math.round(video.videoWidth * cropWidth);
    const finalHeight = Math.round(video.videoHeight * cropHeight);
    const startX = Math.round(video.videoWidth * cropX);
    const startY = Math.round(video.videoHeight * cropY);
    
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    
    console.log('✂️ Recortando área:', {
        source: { x: startX, y: startY, width: finalWidth, height: finalHeight },
        destination: { width: finalWidth, height: finalHeight }
    });
    
    // Dibujar SOLO el área dentro del marco de detección
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
        video,
        startX, startY, finalWidth, finalHeight,  // Área de origen (solo el marco)
        0, 0, finalWidth, finalHeight             // Área de destino (canvas completo)
    );
    
    console.log('✅ Imagen del marco capturada en canvas');
    
    // Convertir a blob
    canvas.toBlob(function(blob) {
        if (!blob) {
            console.error('❌ Error al crear blob');
            showMessage('❌ Error al procesar la imagen', 'error');
            return;
        }
        
        console.log('💾 Blob creado:', blob.size, 'bytes');
        
        // Crear archivo desde blob
        const file = new File([blob], 'captured_document.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
        });
        
        console.log('📄 Archivo creado del área del marco:', file.name, file.size, 'bytes');
        
        // Cerrar cámara
        closeCameraModal();
        
        // Procesar inmediatamente con ML Kit real
        showMessage('🤖 Procesando área del marco con ML Kit...', 'info');
        processImageWithMLKit(file);
        
    }, 'image/jpeg', 0.9);
}

// Cerrar modal de cámara
function closeCameraModal() {
    const modal = document.getElementById('camera-modal');
    const video = document.getElementById('camera-video');
    
    // Detener stream de video
    if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
    }
    
    // Remover modal
    if (modal) {
        modal.remove();
    }
    
    // Remover estilos
    const styles = document.getElementById('camera-styles');
    if (styles) {
        styles.remove();
    }
}

// Selector de galería mejorado
function selectFromGallery() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.addEventListener('change', function(event) {
        const file = event.target.files?.[0];
        if (file) {
            // Cerrar cámara si está abierta
            closeCameraModal();
            
            showMessage('🤖 Procesando imagen con Google ML Kit...', 'info');
            processImageWithMLKit(file);
        }
        input.remove();
    });
    
    document.body.appendChild(input);
    input.click();
}

async function processImageWithMLKit(file) {
    try {
        // Mostrar spinner de carga con ML Kit
        showLoadingSpinner('Procesando con Google ML Kit...');
        
        // Convertir archivo a base64
        const base64Image = await fileToBase64(file);
        
        // Enviar al backend Django para detección con ML Kit
        const response = await fetch('/api/detect-document/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                image: base64Image,
                auto_crop: true,
                enhance_image: true
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Documento detectado exitosamente con ML Kit
            hideLoadingSpinner();
            showDocumentDetectionResult(result);
        } else {
            // Error en la detección ML Kit
            hideLoadingSpinner();
            showMessage(`❌ Error ML Kit: ${result.error || 'No se pudo detectar el documento'}`, 'error');
            
            // Fallback: permitir recorte manual
            showManualCropOption(file);
        }
        
    } catch (error) {
        console.error('Error procesando imagen con ML Kit:', error);
        hideLoadingSpinner();
        showMessage('❌ Error de conexión con el servidor ML Kit', 'error');
        
        // Fallback: permitir recorte manual
        showManualCropOption(file);
    }
}

// Función auxiliar para convertir archivo a base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Mantener el prefijo completo "data:image/...;base64,..."
            resolve(reader.result);
        };
        reader.onerror = error => reject(error);
    });
}

// Función auxiliar para obtener CSRF token
function getCsrfToken() {
    // Primero intentar desde el meta tag
    const metaToken = document.querySelector('meta[name="csrf-token"]');
    if (metaToken) {
        return metaToken.content;
    }
    
    // Fallback: intentar desde cookies
    const cookieValue = document.cookie.match('(^|;)\\s*csrftoken\\s*=\\s*([^;]+)');
    return cookieValue ? cookieValue.pop() : '';
}

// Mostrar resultado de la detección automática de OpenCV
function showDocumentDetectionResult(result) {
    // Remover modal existente si existe
    const existingModal = document.getElementById('opencv-result-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'opencv-result-modal';
    modal.innerHTML = `
        <div class="opencv-result-fullscreen">
            <div class="opencv-header">
                <h3>🤖 Documento Detectado con IA</h3>
                <div class="confidence-badge">
                    Precisión: ${Math.round((result.rectangle?.confidence || 0) * 100)}%
                </div>
                <button class="opencv-close-btn" onclick="closeOpenCVResult()">✕</button>
            </div>
            
            <div class="opencv-content">
                <div class="document-preview">
                    ${result.processed_image ? `
                        <div class="detected-document">
                            <h4>� Documento Detectado</h4>
                            <img src="data:image/jpeg;base64,${result.processed_image}" alt="Documento Detectado" class="detected-image">
                            <div class="confidence-info">
                                ✅ Detectado con ${Math.round((result.rectangle?.confidence || 0) * 100)}% de confianza
                            </div>
                        </div>
                    ` : `
                        <div class="no-detection">
                            <h4>❌ No se pudo detectar el documento</h4>
                            <p>Intenta con mejor iluminación o ángulo</p>
                        </div>
                    `}
                </div>
            </div>
            
            <div class="opencv-controls">
                <button class="btn-opencv-retry" onclick="closeOpenCVResult(); openCamera();">
                    � Nueva Foto
                </button>
                ${result.original_image ? `
                <button class="btn-opencv-manual" onclick="openManualCropFromResult('${result.original_image}', ${JSON.stringify(result.rectangle).replace(/"/g, '&quot;')})">
                    ✏️ Editar Recorte
                </button>
                ` : ''}
                ${result.processed_image ? `
                <button class="btn-opencv-save" onclick="saveProcessedDocument('${result.processed_image}', '${result.processing_id || ''}')">
                    💾 Guardar
                </button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Mostrar mensaje de éxito
    showMessage(`✅ Documento detectado con ${Math.round((result.rectangle?.confidence || 0) * 100)}% de precisión`, 'success');
}

// Spinner de carga para OpenCV
function showLoadingSpinner(message = 'Procesando...') {
    // Remover spinner existente
    const existingSpinner = document.getElementById('opencv-spinner');
    if (existingSpinner) {
        existingSpinner.remove();
    }
    
    const spinner = document.createElement('div');
    spinner.id = 'opencv-spinner';
    spinner.innerHTML = `
        <div class="spinner-backdrop">
            <div class="spinner-container">
                <div class="opencv-spinner-icon">
                    <svg width="50" height="50" viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" fill="none" stroke="#4285f4" stroke-width="4" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                            <animate attributeName="stroke-array" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                </div>
                <h3>🤖 Google ML Kit</h3>
                <p>${message}</p>
                <div class="processing-steps">
                    <div class="step active">📷 Análisis de imagen</div>
                    <div class="step active">🔍 Detección de bordes</div>
                    <div class="step active">📐 Corrección geométrica</div>
                    <div class="step active">✨ Mejora de calidad</div>
                </div>
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

// Cerrar modal de resultado de OpenCV
function closeOpenCVResult() {
    const modal = document.getElementById('opencv-result-modal');
    if (modal) {
        modal.remove();
    }
}

// Fallback para recorte manual si ML Kit falla
function showManualCropOption(file) {
    if (confirm('🤖 La detección automática de ML Kit no funcionó.\n\n¿Deseas recortar el documento manualmente?')) {
        // Convertir archivo a data URL para el editor
        const reader = new FileReader();
        reader.onload = function(e) {
            openManualCropEditor(e.target.result, null);
        };
        reader.readAsDataURL(file);
    }
}

// Mostrar recorte manual desde resultado de ML Kit
function openManualCropFromResult(originalImageBase64, detectedCoords) {
    // Convertir base64 a data URL si no tiene prefijo
    let imageDataUrl = originalImageBase64;
    if (!originalImageBase64.startsWith('data:')) {
        imageDataUrl = `data:image/jpeg;base64,${originalImageBase64}`;
    }
    
    // Cerrar modal de resultado
    closeOpenCVResult();
    
    // Abrir editor de recorte manual con coordenadas detectadas
    openManualCropEditor(imageDataUrl, detectedCoords);
}

// Guardar documento procesado
async function saveProcessedDocument(processedImageBase64, processingId) {
    try {
        showMessage('💾 Guardando documento...', 'info');
        
        // Aquí podrías enviar el documento a otro endpoint para guardarlo
        // Por ahora, simularemos el guardado
        
        // Descargar la imagen procesada
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

function createImageProcessorModal(imageFile) {
    // Remover modal existente si existe
    const existingModal = document.getElementById('image-processor-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'image-processor-modal';
    modal.innerHTML = `
        <div class="processor-fullscreen">
            <div class="processor-header">
                <h3>📄 Ajustar Documento</h3>
                <button class="processor-close-btn" onclick="closeImageProcessor()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            
            <div class="image-container">
                <img id="captured-image" src="" alt="Documento capturado">
                <canvas id="crop-canvas" style="display: none;"></canvas>
                
                <!-- Marco de recorte -->
                <div class="crop-overlay">
                    <div class="crop-frame" id="crop-frame">
                        <div class="crop-corner top-left" data-corner="top-left"></div>
                        <div class="crop-corner top-right" data-corner="top-right"></div>
                        <div class="crop-corner bottom-left" data-corner="bottom-left"></div>
                        <div class="crop-corner bottom-right" data-corner="bottom-right"></div>
                        
                        <div class="crop-handle top" data-handle="top"></div>
                        <div class="crop-handle bottom" data-handle="bottom"></div>
                        <div class="crop-handle left" data-handle="left"></div>
                        <div class="crop-handle right" data-handle="right"></div>
                        
                        <div class="crop-drag-area"></div>
                    </div>
                </div>
                
                <div class="processor-instructions">
                    <p>✂️ Ajuste el marco para recortar el documento</p>
                    <p>Arrastre las esquinas para redimensionar</p>
                </div>
            </div>
            
            <div class="processor-controls">
                <button class="btn-processor-cancel" onclick="closeImageProcessor()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Cancelar
                </button>
                <button class="btn-processor-save" onclick="saveProcessedDocument()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2"/>
                        <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2"/>
                        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Guardar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    addImageProcessorStyles();
    loadImageInProcessor(imageFile);
}

function addImageProcessorStyles() {
    const style = document.createElement('style');
    style.id = 'image-processor-styles';
    style.textContent = `
        #image-processor-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 1001;
            font-family: 'Poppins', sans-serif;
            background: rgba(0, 0, 0, 0.95);
        }
        
        .processor-fullscreen {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        
        .processor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            backdrop-filter: blur(10px);
        }
        
        .processor-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        }
        
        .processor-close-btn {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        
        .processor-close-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .image-container {
            flex: 1;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: #000;
        }
        
        #captured-image {
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 8px;
        }
        
        .crop-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        
        .crop-frame {
            position: absolute;
            top: 20%;
            left: 20%;
            width: 60%;
            height: 60%;
            border: 3px solid #2196F3;
            background: rgba(33, 150, 243, 0.15);
            pointer-events: auto;
            cursor: move;
            box-shadow: 
                0 0 0 2000px rgba(0, 0, 0, 0.5),
                inset 0 0 0 1px rgba(255, 255, 255, 0.3);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .crop-frame.auto-detected {
            border-color: #4CAF50;
            background: rgba(76, 175, 80, 0.15);
            box-shadow: 
                0 0 0 2000px rgba(0, 0, 0, 0.5),
                inset 0 0 0 1px rgba(255, 255, 255, 0.3),
                0 0 20px rgba(76, 175, 80, 0.4);
            animation: detectionPulse 0.6s ease-in-out;
        }
        
        @keyframes detectionPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }
        
        .crop-corner {
            position: absolute;
            width: 24px;
            height: 24px;
            background: #2196F3;
            border: 3px solid white;
            border-radius: 50%;
            cursor: nw-resize;
            z-index: 10;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .crop-corner:hover {
            transform: scale(1.1);
            background: #1976D2;
        }
        
        .crop-frame.auto-detected .crop-corner {
            background: #4CAF50;
            border-color: white;
        }
        
        .crop-corner.top-left { top: -12px; left: -12px; }
        .crop-corner.top-right { top: -12px; right: -12px; cursor: ne-resize; }
        .crop-corner.bottom-left { bottom: -12px; left: -12px; cursor: sw-resize; }
        .crop-corner.bottom-right { bottom: -12px; right: -12px; cursor: se-resize; }
        
        .crop-handle {
            position: absolute;
            background: rgba(33, 150, 243, 0.8);
            z-index: 9;
        }
        
        .crop-handle.top, .crop-handle.bottom {
            height: 4px;
            left: 20%;
            right: 20%;
            cursor: ns-resize;
        }
        
        .crop-handle.left, .crop-handle.right {
            width: 4px;
            top: 20%;
            bottom: 20%;
            cursor: ew-resize;
        }
        
        .crop-handle.top { top: -2px; }
        .crop-handle.bottom { bottom: -2px; }
        .crop-handle.left { left: -2px; }
        .crop-handle.right { right: -2px; }
        
        .crop-drag-area {
            position: absolute;
            top: 4px;
            left: 4px;
            right: 4px;
            bottom: 4px;
            cursor: move;
            background: rgba(33, 150, 243, 0.05);
        }
        
        .processor-instructions {
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 16px;
            border-radius: 20px;
            font-size: 12px;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        
        .processor-instructions p {
            margin: 2px 0;
        }
        
        .processor-controls {
            display: flex;
            justify-content: space-between;
            padding: 20px;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
        }
        
        .btn-processor-cancel, .btn-processor-save {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            border: none;
            border-radius: 25px;
            font-family: Poppins, sans-serif;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-processor-cancel {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }
        
        .btn-processor-save {
            background: #4CAF50;
            color: white;
        }
        
        .btn-processor-cancel:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .btn-processor-save:hover {
            background: #45a049;
        }
    `;
    document.head.appendChild(style);
}

function loadImageInProcessor(imageFile) {
    const img = document.getElementById('captured-image');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        img.src = e.target.result;
        img.onload = function() {
            // Mostrar mensaje de detección
            showMessage('🔍 Detectando documento con IA...', 'info');
            
            // Detectar automáticamente usando el backend de OpenCV
            detectDocumentWithOpenCV(e.target.result);
            initializeImageCrop();
        };
    };
    
    reader.readAsDataURL(imageFile);
}

function initializeImageCrop() {
    const frame = document.getElementById('crop-frame');
    if (!frame) return;
    
    // Habilitar arrastrar y redimensionar
    enableFrameDragging(frame);
    enableFrameResizing(frame);
    
    showMessage('✂️ Ajuste el marco arrastrando las esquinas o el centro', 'info');
}

// Habilitar arrastrar el marco completo
function enableFrameDragging(frame) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    
    const dragArea = frame.querySelector('.crop-drag-area');
    
    dragArea.addEventListener('mousedown', startDrag);
    dragArea.addEventListener('touchstart', startDrag);
    
    function startDrag(e) {
        isDragging = true;
        const rect = frame.getBoundingClientRect();
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        startX = clientX;
        startY = clientY;
        initialLeft = Number.parseInt(frame.style.left) || rect.left;
        initialTop = Number.parseInt(frame.style.top) || rect.top;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);
        
        e.preventDefault();
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;
        
        const newLeft = initialLeft + deltaX;
        const newTop = initialTop + deltaY;
        
        // Limitar dentro de los límites de la imagen
        const img = document.getElementById('captured-image');
        const imgRect = img.getBoundingClientRect();
        const frameRect = frame.getBoundingClientRect();
        
        const maxLeft = imgRect.right - frameRect.width;
        const maxTop = imgRect.bottom - frameRect.height;
        
        frame.style.left = Math.max(imgRect.left, Math.min(newLeft, maxLeft)) + 'px';
        frame.style.top = Math.max(imgRect.top, Math.min(newTop, maxTop)) + 'px';
        
        e.preventDefault();
    }
    
    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchend', stopDrag);
    }
}

// Habilitar redimensionar usando las esquinas
function enableFrameResizing(frame) {
    const corners = frame.querySelectorAll('.crop-corner');
    
    for (const corner of corners) {
        corner.addEventListener('mousedown', startResize);
        corner.addEventListener('touchstart', startResize);
    }
    
    let isResizing = false;
    let resizeCorner = null;
    let startX, startY, initialRect;
    
    function startResize(e) {
        isResizing = true;
        resizeCorner = e.target.dataset.corner;
        
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        startX = clientX;
        startY = clientY;
        
        const rect = frame.getBoundingClientRect();
        initialRect = {
            left: Number.parseInt(frame.style.left) || rect.left,
            top: Number.parseInt(frame.style.top) || rect.top,
            width: Number.parseInt(frame.style.width) || rect.width,
            height: Number.parseInt(frame.style.height) || rect.height
        };
        
        document.addEventListener('mousemove', resize);
        document.addEventListener('touchmove', resize);
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('touchend', stopResize);
        
        e.preventDefault();
        e.stopPropagation();
    }
    
    function resize(e) {
        if (!isResizing) return;
        
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;
        
        let newRect = { ...initialRect };
        
        switch (resizeCorner) {
            case 'top-left':
                newRect.left += deltaX;
                newRect.top += deltaY;
                newRect.width -= deltaX;
                newRect.height -= deltaY;
                break;
            case 'top-right':
                newRect.top += deltaY;
                newRect.width += deltaX;
                newRect.height -= deltaY;
                break;
            case 'bottom-left':
                newRect.left += deltaX;
                newRect.width -= deltaX;
                newRect.height += deltaY;
                break;
            case 'bottom-right':
                newRect.width += deltaX;
                newRect.height += deltaY;
                break;
        }
        
        // Aplicar tamaños mínimos
        newRect.width = Math.max(100, newRect.width);
        newRect.height = Math.max(100, newRect.height);
        
        // Limitar dentro de los límites de la imagen
        const img = document.getElementById('captured-image');
        const imgRect = img.getBoundingClientRect();
        
        newRect.left = Math.max(imgRect.left, Math.min(newRect.left, imgRect.right - newRect.width));
        newRect.top = Math.max(imgRect.top, Math.min(newRect.top, imgRect.bottom - newRect.height));
        
        // Aplicar los cambios
        frame.style.left = newRect.left + 'px';
        frame.style.top = newRect.top + 'px';
        frame.style.width = newRect.width + 'px';
        frame.style.height = newRect.height + 'px';
        
        e.preventDefault();
    }
    
    function stopResize() {
        isResizing = false;
        resizeCorner = null;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('touchmove', resize);
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('touchend', stopResize);
    }
}

// Detectar documento usando el backend de ML Kit
async function detectDocumentWithMLKit(imageDataUrl) {
    try {
        showMessage('🤖 Procesando con Google ML Kit...', 'info');
        
        // Llamar al backend de detección con ML Kit
        const response = await fetch('/api/detect-document/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                image: imageDataUrl
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Aplicar detección exitosa con ML Kit
            const img = document.getElementById('captured-image');
            adjustCropFrameToDocument(result.rectangle, img);
            
            const confidence = Math.round(result.rectangle.confidence * 100);
            showMessage(`✅ Documento detectado con ML Kit (${confidence}% confianza)`, 'success');
        } else {
            throw new Error(result.error || 'Error desconocido en ML Kit');
        }
        
    } catch (error) {
        console.error('Error en detección ML Kit:', error);
        
        // Fallback: usar detección simple local
        showMessage('⚠️ Usando detección local como respaldo...', 'warning');
        const img = document.getElementById('captured-image');
        const fallbackRect = detectDocumentSimple(img);
        adjustCropFrameToDocument(fallbackRect, img);
        showMessage('📄 Documento detectado localmente. Ajuste si es necesario', 'info');
    }
}

// Detección simple inteligente del documento
function detectDocumentSimple(img) {
    // Por ahora, usar un rectángulo centrado inteligente basado en proporciones típicas de documentos
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    // Calcular un rectángulo que ocupe la mayor parte de la imagen pero con márgenes inteligentes
    const aspectRatio = imgHeight / imgWidth;
    
    let margin = 0.1; // 10% de margen por defecto
    
    // Ajustar márgenes basado en la proporción de la imagen
    if (aspectRatio > 1.2) {
        // Imagen más alta que ancha (típico documento vertical)
        margin = 0.08;
    } else if (aspectRatio < 0.8) {
        // Imagen más ancha que alta (posible documento horizontal)
        margin = 0.12;
    }
    
    const rect = {
        x: imgWidth * margin,
        y: imgHeight * margin,
        width: imgWidth * (1 - margin * 2),
        height: imgHeight * (1 - margin * 2)
    };
    
    return rect;
}

// Método mejorado para detectar documentos usando contraste y análisis de formas
function detectDocumentUsingContrastAndEdges(imageData, width, height) {
    const data = imageData.data;
    
    // Convertir a escala de grises
    const grayData = new Uint8ClampedArray(width * height);
    for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        grayData[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
    }
    
    // Aplicar filtro Gaussiano para suavizar
    const smoothed = applyGaussianBlur(grayData, width, height);
    
    // Detectar bordes usando Sobel mejorado
    const edges = detectEdgesImproved(smoothed, width, height);
    
    // Buscar rectángulos candidatos
    const candidates = findDocumentCandidates(edges, width, height);
    
    // Seleccionar el mejor candidato
    return selectBestDocumentCandidate(candidates, width, height);
}

// Aplicar filtro Gaussiano para suavizar la imagen
function applyGaussianBlur(data, width, height) {
    const result = new Uint8ClampedArray(width * height);
    const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1]; // Kernel 3x3 normalizado
    const kernelSum = 16;
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let sum = 0;
            let idx = 0;
            
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const pixelIdx = (y + ky) * width + (x + kx);
                    sum += data[pixelIdx] * kernel[idx++];
                }
            }
            
            result[y * width + x] = Math.round(sum / kernelSum);
        }
    }
    
    return result;
}

// Detección de bordes mejorada usando Sobel
function detectEdgesImproved(data, width, height) {
    const edges = new Uint8ClampedArray(width * height);
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const gx = (
                -1 * data[(y - 1) * width + (x - 1)] +
                1 * data[(y - 1) * width + (x + 1)] +
                -2 * data[y * width + (x - 1)] +
                2 * data[y * width + (x + 1)] +
                -1 * data[(y + 1) * width + (x - 1)] +
                1 * data[(y + 1) * width + (x + 1)]
            );
            
            const gy = (
                -1 * data[(y - 1) * width + (x - 1)] +
                -2 * data[(y - 1) * width + x] +
                -1 * data[(y - 1) * width + (x + 1)] +
                1 * data[(y + 1) * width + (x - 1)] +
                2 * data[(y + 1) * width + x] +
                1 * data[(y + 1) * width + (x + 1)]
            );
            
            const magnitude = Math.hypot(gx, gy);
            edges[y * width + x] = magnitude > 40 ? 255 : 0; // Umbral ajustado
        }
    }
    
    return edges;
}

// Buscar candidatos rectangulares para documentos
function findDocumentCandidates(edges, width, height) {
    const candidates = [];
    
    // Método 1: Buscar rectángulos por análisis de proyección
    const horizontalProjection = new Array(height).fill(0);
    const verticalProjection = new Array(width).fill(0);
    
    // Calcular proyecciones
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (edges[y * width + x] === 255) {
                horizontalProjection[y]++;
                verticalProjection[x]++;
            }
        }
    }
    
    // Encontrar límites del documento usando proyecciones
    const topEdge = findEdgeFromProjection(horizontalProjection, true);
    const bottomEdge = findEdgeFromProjection(horizontalProjection, false);
    const leftEdge = findEdgeFromProjection(verticalProjection, true);
    const rightEdge = findEdgeFromProjection(verticalProjection, false);
    
    if (topEdge < bottomEdge && leftEdge < rightEdge) {
        candidates.push({
            x: leftEdge,
            y: topEdge,
            width: rightEdge - leftEdge,
            height: bottomEdge - topEdge,
            score: calculateCandidateScore(leftEdge, topEdge, rightEdge - leftEdge, bottomEdge - topEdge, width, height)
        });
    }
    
    // Método 2: Rectángulo centrado más conservador (fallback)
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const docWidth = width * 0.75;
    const docHeight = height * 0.75;
    
    candidates.push({
        x: centerX - docWidth / 2,
        y: centerY - docHeight / 2,
        width: docWidth,
        height: docHeight,
        score: 0.5 // Puntuación baja como fallback
    });
    
    return candidates;
}

// Encontrar borde desde proyección
function findEdgeFromProjection(projection, fromStart) {
    const threshold = Math.max(5, Math.max(...projection) * 0.1);
    
    if (fromStart) {
        for (let i = 0; i < projection.length; i++) {
            if (projection[i] > threshold) {
                return Math.max(0, i - 10); // Margen de seguridad
            }
        }
    } else {
        for (let i = projection.length - 1; i >= 0; i--) {
            if (projection[i] > threshold) {
                return Math.min(projection.length - 1, i + 10); // Margen de seguridad
            }
        }
    }
    
    return fromStart ? 0 : projection.length - 1;
}

// Calcular puntuación de un candidato
function calculateCandidateScore(x, y, w, h, imgWidth, imgHeight) {
    const area = w * h;
    const imgArea = imgWidth * imgHeight;
    const areaRatio = area / imgArea;
    
    // Penalizar rectángulos muy pequeños o muy grandes
    let areaScore = 0;
    if (areaRatio >= 0.2 && areaRatio <= 0.8) {
        areaScore = 1 - Math.abs(areaRatio - 0.5) * 2;
    }
    
    // Penalizar rectángulos muy cerca de los bordes
    const borderPenalty = Math.min(x, y, imgWidth - (x + w), imgHeight - (y + h)) / Math.min(imgWidth, imgHeight);
    
    // Preferir proporciones de documento (más alto que ancho)
    const aspectRatio = h / w;
    const aspectScore = aspectRatio > 1 ? Math.min(1, aspectRatio / 1.4) : aspectRatio;
    
    return (areaScore * 0.5 + borderPenalty * 0.3 + aspectScore * 0.2);
}

// Seleccionar el mejor candidato
function selectBestDocumentCandidate(candidates, width, height) {
    if (candidates.length === 0) {
        // Rectángulo por defecto
        return {
            x: width * 0.1,
            y: height * 0.1,
            width: width * 0.8,
            height: height * 0.8
        };
    }
    
    // Ordenar por puntuación y seleccionar el mejor
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    
    // Asegurar que el rectángulo está dentro de los límites
    return {
        x: Math.max(0, Math.min(best.x, width - best.width)),
        y: Math.max(0, Math.min(best.y, height - best.height)),
        width: Math.min(best.width, width - best.x),
        height: Math.min(best.height, height - best.y)
    };
}



// Ajustar el marco de recorte al documento detectado con animación suave
function adjustCropFrameToDocument(documentRect, img) {
    const frame = document.getElementById('crop-frame');
    const container = img.parentElement;
    
    if (!frame || !container) return;
    
    // Obtener posición actual de la imagen en el contenedor
    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Calcular offset de la imagen dentro del contenedor
    const imgOffsetX = imgRect.left - containerRect.left;
    const imgOffsetY = imgRect.top - containerRect.top;
    
    // Calcular la escala entre la imagen mostrada y la imagen real
    const scaleX = img.clientWidth / img.naturalWidth;
    const scaleY = img.clientHeight / img.naturalHeight;
    
    // Ajustar las coordenadas del rectángulo a la imagen mostrada
    const adjustedRect = {
        x: imgOffsetX + (documentRect.x * scaleX),
        y: imgOffsetY + (documentRect.y * scaleY),
        width: documentRect.width * scaleX,
        height: documentRect.height * scaleY
    };
    
    // Asegurar que el marco no se salga de los límites de la imagen
    const maxX = imgOffsetX + img.clientWidth - adjustedRect.width;
    const maxY = imgOffsetY + img.clientHeight - adjustedRect.height;
    
    adjustedRect.x = Math.max(imgOffsetX, Math.min(adjustedRect.x, maxX));
    adjustedRect.y = Math.max(imgOffsetY, Math.min(adjustedRect.y, maxY));
    
    // Aplicar transición suave
    frame.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    
    // Aplicar posición y tamaño al marco con animación
    setTimeout(() => {
        frame.style.left = adjustedRect.x + 'px';
        frame.style.top = adjustedRect.y + 'px';
        frame.style.width = adjustedRect.width + 'px';
        frame.style.height = adjustedRect.height + 'px';
    }, 100);
    
    // Añadir feedback visual
    frame.classList.add('auto-detected');
    setTimeout(() => {
        frame.classList.remove('auto-detected');
    }, 1000);
    
    console.log('Marco ajustado automáticamente:', adjustedRect);
}

function closeImageProcessor() {
    const modal = document.getElementById('image-processor-modal');
    const styles = document.getElementById('image-processor-styles');
    
    if (modal) modal.remove();
    if (styles) styles.remove();
}

async function saveProcessedDocument() {
    const img = document.getElementById('captured-image');
    const frame = document.getElementById('crop-frame');
    
    if (!img || !frame) {
        showMessage('Error: No se pudo procesar la imagen', 'error');
        return;
    }
    
    showMessage('📄 Procesando documento...', 'info');
    
    try {
        // Obtener coordenadas del marco de recorte
        const frameRect = getCropFrameCoordinates(frame, img);
        
        // Obtener imagen original en base64
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        
        // Intentar usar backend de ML Kit para recorte preciso
        const response = await fetch('/api/crop-document/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: imageDataUrl,
                rectangle: frameRect
            })
        });
        
        let finalImageUrl;
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                finalImageUrl = result.cropped_image;
                showMessage('✅ Documento procesado con ML Kit', 'success');
            } else {
                throw new Error(result.error);
            }
        } else {
            throw new Error('Backend no disponible');
        }
        
        // Descargar imagen procesada
        downloadImageFromDataUrl(finalImageUrl, `documento-${Date.now()}.jpg`);
        
        setTimeout(() => {
            closeImageProcessor();
        }, 1000);
        
    } catch (error) {
        console.warn('Backend ML Kit no disponible, usando recorte local:', error);
        
        // Fallback: recorte local usando canvas
        const croppedDataUrl = cropImageLocally(img, frame);
        downloadImageFromDataUrl(croppedDataUrl, `documento-${Date.now()}.jpg`);
        
        showMessage('✅ Documento guardado (recorte local)', 'success');
        
        setTimeout(() => {
            closeImageProcessor();
        }, 1000);
    }
}

// Obtener coordenadas del marco de recorte relativas a la imagen original
function getCropFrameCoordinates(frame, img) {
    const frameRect = frame.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    // Calcular posición relativa del marco respecto a la imagen mostrada
    const relativeX = frameRect.left - imgRect.left;
    const relativeY = frameRect.top - imgRect.top;
    
    // Escalar a las dimensiones originales de la imagen
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;
    
    return {
        x: Math.max(0, Math.round(relativeX * scaleX)),
        y: Math.max(0, Math.round(relativeY * scaleY)),
        width: Math.round(frameRect.width * scaleX),
        height: Math.round(frameRect.height * scaleY)
    };
}

// Recorte local usando canvas (fallback)
function cropImageLocally(img, frame) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const cropCoords = getCropFrameCoordinates(frame, img);
    
    // Configurar canvas con las dimensiones del recorte
    canvas.width = cropCoords.width;
    canvas.height = cropCoords.height;
    
    // Dibujar la porción recortada
    ctx.drawImage(
        img,
        cropCoords.x, cropCoords.y, cropCoords.width, cropCoords.height,  // Fuente
        0, 0, cropCoords.width, cropCoords.height                          // Destino
    );
    
    return canvas.toDataURL('image/jpeg', 0.9);
}

// Descargar imagen desde data URL
function downloadImageFromDataUrl(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function createCameraModal() {
    // Remover modal existente si existe
    const existingModal = document.getElementById('camera-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Crear estructura del modal
    const modal = document.createElement('div');
    modal.id = 'camera-modal';
    modal.innerHTML = `
        <div class="camera-fullscreen">
            <button class="camera-close-btn" onclick="closeCameraModal()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            
            <div class="camera-container">
                <video id="camera-video" autoplay playsinline></video>
                <canvas id="camera-canvas" style="display: none;"></canvas>
                    
                    <!-- Overlay para detección automática de documentos -->
                    <div class="scan-overlay" id="detection-mode">
                        <div class="document-detection">
                            <div class="detection-frame" id="detection-frame">
                                <div class="detection-corners">
                                    <div class="corner top-left"></div>
                                    <div class="corner top-right"></div>
                                    <div class="corner bottom-left"></div>
                                    <div class="corner bottom-right"></div>
                                </div>
                                <div class="detection-status">
                                    <span class="status-text">🔍 Buscando documento...</span>
                                </div>
                            </div>
                        </div>
                        <div class="capture-instructions">
                            <p>📄 Coloque el documento en el marco</p>
                            <p>Se detectará automáticamente</p>
                        </div>
                    </div>

                    <!-- Overlay para ajuste de marco (aparece después de capturar) -->
                    <div class="scan-overlay" id="crop-mode" style="display: none;">
                        <div class="document-frame" id="crop-frame">
                            <div class="frame-corner top-left" data-corner="top-left"></div>
                            <div class="frame-corner top-right" data-corner="top-right"></div>
                            <div class="frame-corner bottom-left" data-corner="bottom-left"></div>
                            <div class="frame-corner bottom-right" data-corner="bottom-right"></div>
                            
                            <!-- Bordes para redimensionar -->
                            <div class="resize-handle top" data-handle="top"></div>
                            <div class="resize-handle bottom" data-handle="bottom"></div>
                            <div class="resize-handle left" data-handle="left"></div>
                            <div class="resize-handle right" data-handle="right"></div>
                            
                            <!-- Área de arrastre para mover -->
                            <div class="drag-area"></div>
                        </div>
                        <div class="capture-instructions">
                            <p>✂️ Ajuste el marco para recortar</p>
                            <p>Arrastre esquinas • Mueva el marco • Confirme captura</p>
                        </div>
                    </div>
                    
                    <!-- Controles dentro de la cámara -->
                    <div class="camera-overlay-controls">
                        <button class="btn-camera-capture" onclick="captureImage()" id="main-capture-btn">
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="8" stroke="white" stroke-width="2" fill="none"/>
                                <circle cx="12" cy="12" r="3" fill="white"/>
                            </svg>
                        </button>
                        <button class="btn-camera-gallery" onclick="selectFromGallery()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" stroke-width="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5" stroke="white" stroke-width="2"/>
                                <path d="M21 15L16 10L5 21" stroke="white" stroke-width="2"/>
                            </svg>
                        </button>
                        
                        <!-- Controles para modo de recorte (aparecen después de capturar) -->
                        <div class="crop-controls" id="crop-controls" style="display: none;">
                            <button class="btn-crop-confirm" onclick="confirmCrop()">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <polyline points="20,6 9,17 4,12" stroke="white" stroke-width="2" fill="none"/>
                                </svg>
                                <span>Confirmar</span>
                            </button>
                            <button class="btn-crop-retry" onclick="retryCapture()">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="white" stroke-width="2" fill="none"/>
                                    <path d="M21 3v5h-5" stroke="white" stroke-width="2" fill="none"/>
                                </svg>
                                <span>Repetir</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    addCameraModalStyles();
    initializeCamera();
    initializeDocumentDetection();
}

function addCameraModalStyles() {
    const style = document.createElement('style');
    style.id = 'camera-modal-styles';
    style.textContent = `
        #camera-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 1000;
            font-family: 'Poppins', sans-serif;
            overflow: hidden;
        }
        
        .camera-fullscreen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            display: flex;
            flex-direction: column;
            padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
            box-sizing: border-box;
        }
        
        .camera-close-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            border: none;
            color: white;
            cursor: pointer;
            padding: 12px;
            border-radius: 50%;
            z-index: 10;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }
        
        .camera-close-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .camera-container {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: black;
        }
        
        #camera-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            background: black;
        }
        
        #camera-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
            display: none;
        }
        
        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        
        .modal-content {
            background: white;
            border-radius: 15px;
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            border-bottom: 1px solid #e0e0e0;
            background: var(--primary-color);
            color: white;
        }
        
        .modal-header h3 {
            margin: 0;
            font-size: 1.2rem;
        }
        
        .modal-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 50%;
            transition: background-color 0.3s;
        }
        
        .modal-close:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .camera-container {
            position: relative;
            background: #000;
            height: 70vh;
            max-height: 500px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        #camera-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        /* Overlay para captura de documentos con marco ajustable */
        .scan-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 3;
            pointer-events: none;
        }
        
        /* Detección automática de documentos */
        .document-detection {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 65%;
            height: 35%;
            pointer-events: none;
            z-index: 2;
            max-width: 300px;
            max-height: 220px;
        }
        
        .detection-frame {
            width: 100%;
            height: 100%;
            border: 2px dashed #4CAF50;
            border-radius: 12px;
            background: rgba(76, 175, 80, 0.05);
            position: relative;
            animation: detectionPulse 2s infinite;
            box-shadow: 0 0 0 1px rgba(76, 175, 80, 0.3);
        }
        
        .detection-corners {
            position: absolute;
            width: 100%;
            height: 100%;
        }
        
        .detection-corners .corner {
            position: absolute;
            width: 16px;
            height: 16px;
            border: 2px solid #4CAF50;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 3px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .detection-corners .corner.top-left {
            top: -8px;
            left: -8px;
            border-bottom-color: transparent;
            border-right-color: transparent;
        }
        
        .detection-corners .corner.top-right {
            top: -8px;
            right: -8px;
            border-bottom-color: transparent;
            border-left-color: transparent;
        }
        
        .detection-corners .corner.bottom-left {
            bottom: -8px;
            left: -8px;
            border-top-color: transparent;
            border-right-color: transparent;
        }
        
        .detection-corners .corner.bottom-right {
            bottom: -8px;
            right: -8px;
            border-top-color: transparent;
            border-left-color: transparent;
        }
        
        .detection-status {
            position: absolute;
            bottom: -45px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 3;
        }
        
        @keyframes detectionPulse {
            0%, 100% { 
                opacity: 0.8; 
                transform: translate(-50%, -50%) scale(1);
                border-color: #4CAF50;
            }
            50% { 
                opacity: 1; 
                transform: translate(-50%, -50%) scale(1.02);
                border-color: #66BB6A;
            }
        }

        /* Marco ajustable para recorte */
        .document-frame {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 65%;
            height: 35%;
            border: 2px solid rgba(255, 255, 255, 0.9);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.03);
            box-shadow: 
                0 0 0 9999px rgba(0, 0, 0, 0.4),
                inset 0 0 0 1px rgba(255, 255, 255, 0.3);
            pointer-events: auto;
            cursor: move;
            min-width: 180px;
            min-height: 120px;
            max-width: 300px;
            max-height: 220px;
            backdrop-filter: blur(1px);
            z-index: 2;
        }
        
        .frame-corner {
            position: absolute;
            width: 18px;
            height: 18px;
            border: 2px solid #2196F3;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.95);
            cursor: grab;
            z-index: 10;
            pointer-events: auto;
            touch-action: none;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
            transition: all 0.2s ease;
        }
        
        .frame-corner:active {
            cursor: grabbing;
            transform: scale(1.15);
            background: #2196F3;
            border-color: #1976D2;
            box-shadow: 0 3px 8px rgba(33, 150, 243, 0.4);
        }
        
        .frame-corner.top-left {
            top: -9px;
            left: -9px;
        }
        
        .frame-corner.top-right {
            top: -9px;
            right: -9px;
        }
        
        .frame-corner.bottom-left {
            bottom: -9px;
            left: -9px;
        }
        
        .frame-corner.bottom-right {
            bottom: -9px;
            right: -9px;
        }
        
        .resize-handle {
            position: absolute;
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(33, 150, 243, 0.6);
            border-radius: 2px;
            pointer-events: auto;
            touch-action: none;
            transition: all 0.2s ease;
        }
        
        .resize-handle.top,
        .resize-handle.bottom {
            left: 25%;
            right: 25%;
            height: 6px;
            cursor: ns-resize;
        }
        
        .resize-handle.top {
            top: -3px;
        }
        
        .resize-handle.bottom {
            bottom: -3px;
        }
        
        .resize-handle.left,
        .resize-handle.right {
            top: 25%;
            bottom: 25%;
            width: 6px;
            cursor: ew-resize;
        }
        
        .resize-handle.left {
            left: -3px;
        }
        
        .resize-handle.right {
            right: -3px;
        }
        
        .resize-handle:active {
            background: #2196F3;
            border-color: #1976D2;
        }
        
        .drag-area {
            position: absolute;
            top: 8px;
            left: 8px;
            right: 8px;
            bottom: 8px;
            cursor: move;
            border: 1px dashed rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            background: rgba(33, 150, 243, 0.05);
            pointer-events: auto;
            touch-action: none;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
            font-weight: 500;
        }
        
        .drag-area:active {
            background: rgba(33, 150, 243, 0.1);
            border-color: rgba(255, 255, 255, 0.5);
        }
        
        .drag-area::before {
            content: "📄";
            opacity: 0.8;
        }
        
        .capture-instructions {
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 14px;
            border-radius: 18px;
            font-size: 11px;
            text-align: center;
            line-height: 1.3;
            pointer-events: none;
            max-width: 80%;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            font-weight: 500;
            z-index: 4;
        }
        
        .capture-instructions p {
            margin: 2px 0;
            line-height: 1.3;
        }
        
        .capture-instructions p:first-child {
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        /* Ajustes responsivos para móviles */
        @media (max-width: 768px) {
            /* Video de cámara ajustado para móviles */
            #camera-video {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover;
                position: absolute;
                top: 0;
                left: 0;
            }
            
            .camera-container {
                width: 100% !important;
                height: 100% !important;
                position: relative;
                overflow: hidden;
            }
            
            /* Detección automática centrada y más pequeña */
            .document-detection {
                width: 70%;
                height: 35%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                max-width: 280px;
                max-height: 200px;
            }
            
            .detection-status {
                bottom: -40px;
                font-size: 10px;
                padding: 4px 10px;
                white-space: nowrap;
            }
            
            /* Marco de recorte optimizado para móvil */
            .document-frame {
                width: 70%;
                height: 35%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                min-width: 200px;
                min-height: 140px;
                max-width: 280px;
                max-height: 200px;
            }
            
            /* Esquinas más grandes para toque */
            .frame-corner {
                width: 24px;
                height: 24px;
                border-width: 3px;
            }
            
            .frame-corner.top-left {
                top: -12px;
                left: -12px;
            }
            
            .frame-corner.top-right {
                top: -12px;
                right: -12px;
            }
            
            .frame-corner.bottom-left {
                bottom: -12px;
                left: -12px;
            }
            
            .frame-corner.bottom-right {
                bottom: -12px;
                right: -12px;
            }
            
            /* Bordes más gruesos para móvil */
            .resize-handle.top,
            .resize-handle.bottom {
                height: 10px;
                left: 15%;
                right: 15%;
            }
            
            .resize-handle.top {
                top: -5px;
            }
            
            .resize-handle.bottom {
                bottom: -5px;
            }
            
            .resize-handle.left,
            .resize-handle.right {
                width: 10px;
                top: 15%;
                bottom: 15%;
            }
            
            .resize-handle.left {
                left: -5px;
            }
            
            .resize-handle.right {
                right: -5px;
            }
            
            /* Instrucciones en la parte inferior */
            .capture-instructions {
                bottom: 80px;
                font-size: 10px;
                padding: 6px 10px;
                max-width: 85%;
                border-radius: 15px;
            }
            
            /* Controles de cámara ajustados */
            .camera-overlay-controls {
                bottom: 20px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                gap: 15px;
                position: fixed !important;
            }
            
            .btn-camera-capture {
                width: 65px !important;
                height: 65px !important;
            }
            
            .btn-camera-gallery {
                width: 50px !important;
                height: 50px !important;
            }
            
            .crop-controls {
                bottom: 20px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                position: fixed !important;
                gap: 12px;
            }
            
            .btn-crop-confirm, .btn-crop-retry {
                padding: 8px 14px;
                font-size: 11px;
                min-height: 40px;
            }
            
            /* Marco de detección más visible */
            .detection-frame {
                border-width: 2px;
                border-radius: 8px;
            }
            
            .detection-corners .corner {
                width: 16px;
                height: 16px;
                border-width: 2px;
            }
            
            .detection-corners .corner.top-left {
                top: -8px;
                left: -8px;
            }
            
            .detection-corners .corner.top-right {
                top: -8px;
                right: -8px;
            }
            
            .detection-corners .corner.bottom-left {
                bottom: -8px;
                left: -8px;
            }
            
            .detection-corners .corner.bottom-right {
                bottom: -8px;
                right: -8px;
            }
            
            /* Botón de cerrar más accesible */
            .camera-close-btn {
                top: 15px;
                right: 15px;
                padding: 10px;
                width: 44px;
                height: 44px;
            }
        }
        
        /* Controles de recorte */
        .crop-controls {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        
        .btn-crop-confirm, .btn-crop-retry {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            background: rgba(76, 175, 80, 0.9);
            border: none;
            border-radius: 25px;
            color: white;
            font-family: Poppins, sans-serif;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            min-height: 50px;
            touch-action: manipulation;
        }
        
        .btn-crop-retry {
            background: rgba(255, 152, 0, 0.9);
        }
        
        .btn-crop-confirm:active, .btn-crop-retry:active {
            transform: scale(0.95);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .btn-crop-confirm svg, .btn-crop-retry svg {
            flex-shrink: 0;
        }

        /* Controles superpuestos en la cámara */
        .camera-overlay-controls {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 1.5rem;
            z-index: 4;
        }
        
        .camera-overlay-controls .btn-camera-capture {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            border: 4px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }
        
        .camera-overlay-controls .btn-camera-gallery {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
        }
        
        .camera-overlay-controls .btn-camera-capture:active {
            transform: scale(0.9);
            background: rgba(245, 195, 3, 0.5);
        }
        
        .camera-overlay-controls .btn-camera-gallery:active {
            transform: scale(0.9);
            background: rgba(245, 195, 3, 0.3);
        }
        
        /* Ocultar controles antiguos */
        .camera-controls {
            display: none;
        }
        
        .btn-process,
        .btn-retry {
            flex: 1;
            padding: 0.8rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 1rem;
            min-height: 50px;
        }
        
        .btn-process {
            background: var(--primary-color);
            color: white;
        }
        
        .btn-retry {
            background: #6c757d;
            color: white;
        }
        
        .scan-result {
            padding: 1rem;
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
        }
        
        .scan-result h4 {
            margin: 0 0 0.5rem 0;
            color: var(--primary-color);
        }
        
        .detected-text {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            max-height: 150px;
            overflow-y: auto;
            font-size: 0.9rem;
            line-height: 1.4;
        }
        
        .result-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        @media (max-width: 480px) {
            .modal-overlay {
                padding: 0;
            }
            
            .modal-content {
                height: 100vh;
                max-height: 100vh;
                border-radius: 0;
            }
            
            .camera-container {
                height: calc(100vh - 120px);
                max-height: none;
            }
            
            .scan-frame {
                width: 85%;
                height: 50%;
            }
            
            .camera-overlay-controls {
                bottom: 30px;
                gap: 3rem;
            }
            
            .camera-overlay-controls .btn-camera-capture {
                width: 90px;
                height: 90px;
                border-width: 5px;
            }
            
            .camera-overlay-controls .btn-camera-gallery {
                width: 70px;
                height: 70px;
            }
            
            .scan-instructions {
                bottom: 120px;
                font-size: 1rem;
                padding: 0.8rem 1.5rem;
            }
            
            @keyframes scanLine {
                0%, 100% {
                    transform: translateY(0);
                    opacity: 1;
                }
                50% {
                    transform: translateY(calc(50vh - 4px));
                    opacity: 0.7;
                }
            }
        }
        
        /* Feedback visual para toque */
        .btn-camera-capture:active {
            background: #001d3d !important;
            transform: scale(0.9) !important;
        }
        
        .btn-camera-gallery:active {
            background: #d4a004 !important;
            transform: scale(0.9) !important;
        }
    `;
    
    document.head.appendChild(style);
}

async function initializeCamera() {
    try {
        const video = document.getElementById('camera-video');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // Cámara trasera preferida
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });
        
        video.srcObject = stream;
        showMessage('📹 Cámara lista - Coloque el documento en el marco', 'success');
        
        // No inicializar controles del marco ajustable aquí
        console.log('📹 Cámara inicializada - Esperando detección de documento');
        
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        showMessage('No se pudo acceder a la cámara. Verifique los permisos.', 'error');
        
        // Ofrecer alternativa de galería
        const cameraContainer = document.querySelector('.camera-container');
        cameraContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <p>No se pudo acceder a la cámara</p>
                <p>Use el botón "Galería" para seleccionar una imagen</p>
            </div>
        `;
    }
}

// Funciones de detección automática de documentos
function initializeDocumentDetection() {
    const detectionFrame = document.getElementById('detection-frame');
    const statusText = detectionFrame?.querySelector('.status-text');
    
    if (!detectionFrame || !statusText) return;
    
    // Simular detección automática de documentos
    let detectionInterval;
    let detectionState = 0; // 0: buscando, 1: detectado, 2: confirmado
    
    const detectionStates = [
        { text: '🔍 Buscando documento...', color: '#4CAF50' },
        { text: '📄 Documento detectado', color: '#2196F3' },
        { text: '✅ Listo para capturar', color: '#FF9800' }
    ];
    
    // Función para simular detección automática basada en movimiento/estabilidad
    function simulateDocumentDetection() {
        const video = document.getElementById('camera-video');
        if (!video || video.videoWidth === 0) return;
        
        // Cambiar estado de detección cada 2-3 segundos
        detectionState = (detectionState + 1) % detectionStates.length;
        const currentState = detectionStates[detectionState];
        
        statusText.textContent = currentState.text;
        detectionFrame.style.borderColor = currentState.color;
        
        // Cuando está "listo para capturar", habilitar captura automática después de un momento
        if (detectionState === 2) {
            setTimeout(() => {
                // Opcional: captura automática después de detección estable
                // autoCapture();
            }, 1500);
        }
    }
    
    // Iniciar simulación de detección
    detectionInterval = setInterval(simulateDocumentDetection, 2000);
    
    // Limpiar intervalo cuando se cierre el modal
    const modal = document.getElementById('camera-modal');
    if (modal) {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && !document.contains(modal)) {
                    clearInterval(detectionInterval);
                    observer.disconnect();
                }
            }
        });
        observer.observe(document.body, { childList: true });
    }
}

// Función utilitaria para obtener coordenadas táctiles o de mouse
function getPointerCoords(e) {
    const event = e.touches ? e.touches[0] : e;
    return {
        x: event.clientX,
        y: event.clientY
    };
}

function initializeCropFrame() {
    const frame = document.getElementById('crop-frame');
    if (!frame) return;
    
    let isDragging = false;
    let isResizing = false;
    let currentHandle = null;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let startLeft = 0;
    let startTop = 0;
    
    // Manejar arrastre del marco
    function handleDragStart(e) {
        e.preventDefault();
        isDragging = true;
        const coords = getPointerCoords(e);
        startX = coords.x;
        startY = coords.y;
        
        const rect = frame.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        
        frame.style.cursor = 'grabbing';
    }
    
    // Manejar redimensionamiento
    function handleResizeStart(e) {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        currentHandle = e.target.dataset.handle || e.target.dataset.corner;
        
        const coords = getPointerCoords(e);
        startX = coords.x;
        startY = coords.y;
        
        const rect = frame.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        startLeft = rect.left;
        startTop = rect.top;
    }
    
    // Manejar movimiento
    function handleMove(e) {
        if (!isDragging && !isResizing) return;
        
        e.preventDefault();
        const coords = getPointerCoords(e);
        const deltaX = coords.x - startX;
        const deltaY = coords.y - startY;
        
        if (isDragging) {
            const container = frame.parentElement;
            const containerRect = container.getBoundingClientRect();
            const frameRect = frame.getBoundingClientRect();
            
            let newLeft = startLeft + deltaX - containerRect.left;
            let newTop = startTop + deltaY - containerRect.top;
            
            // Limitar dentro del contenedor
            newLeft = Math.max(0, Math.min(newLeft, containerRect.width - frameRect.width));
            newTop = Math.max(0, Math.min(newTop, containerRect.height - frameRect.height));
            
            frame.style.left = newLeft + 'px';
            frame.style.top = newTop + 'px';
            frame.style.transform = 'none';
        }
        
        if (isResizing) {
            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;
            
            const container = frame.parentElement;
            const containerRect = container.getBoundingClientRect();
            
            switch (currentHandle) {
                case 'top-left':
                    newWidth = startWidth - deltaX;
                    newHeight = startHeight - deltaY;
                    newLeft = startLeft + deltaX;
                    newTop = startTop + deltaY;
                    break;
                case 'top-right':
                    newWidth = startWidth + deltaX;
                    newHeight = startHeight - deltaY;
                    newTop = startTop + deltaY;
                    break;
                case 'bottom-left':
                    newWidth = startWidth - deltaX;
                    newHeight = startHeight + deltaY;
                    newLeft = startLeft + deltaX;
                    break;
                case 'bottom-right':
                    newWidth = startWidth + deltaX;
                    newHeight = startHeight + deltaY;
                    break;
                case 'top':
                    newHeight = startHeight - deltaY;
                    newTop = startTop + deltaY;
                    break;
                case 'bottom':
                    newHeight = startHeight + deltaY;
                    break;
                case 'left':
                    newWidth = startWidth - deltaX;
                    newLeft = startLeft + deltaX;
                    break;
                case 'right':
                    newWidth = startWidth + deltaX;
                    break;
            }
            
            // Aplicar límites mínimos y máximos
            newWidth = Math.max(150, Math.min(newWidth, containerRect.width));
            newHeight = Math.max(100, Math.min(newHeight, containerRect.height));
            
            // Ajustar posición si es necesario
            newLeft = Math.max(0, Math.min(newLeft - containerRect.left, containerRect.width - newWidth));
            newTop = Math.max(0, Math.min(newTop - containerRect.top, containerRect.height - newHeight));
            
            frame.style.width = newWidth + 'px';
            frame.style.height = newHeight + 'px';
            frame.style.left = newLeft + 'px';
            frame.style.top = newTop + 'px';
            frame.style.transform = 'none';
        }
    }
    
    // Finalizar arrastre/redimensionamiento
    function handleEnd(e) {
        isDragging = false;
        isResizing = false;
        currentHandle = null;
        frame.style.cursor = 'move';
        
        // Guardar posición actual para el recorte
        saveCropSettings();
    }
    
    // Guardar configuración del recorte
    function saveCropSettings() {
        const container = frame.parentElement;
        const containerRect = container.getBoundingClientRect();
        const frameRect = frame.getBoundingClientRect();
        
        // Calcular posición relativa como porcentajes
        const cropData = {
            x: (frameRect.left - containerRect.left) / containerRect.width,
            y: (frameRect.top - containerRect.top) / containerRect.height,
            width: frameRect.width / containerRect.width,
            height: frameRect.height / containerRect.height
        };
        
        // Guardar en el frame y globalmente para usar al capturar
        frame.cropData = cropData;
        globalThis.cropData = cropData;
    }
    
    // Event listeners para mouse
    frame.addEventListener('mousedown', handleDragStart);
    
    // Event listeners para touch
    frame.addEventListener('touchstart', handleDragStart, { passive: false });
    
    // Event listeners para esquinas y bordes
    for (const handle of frame.querySelectorAll('.frame-corner, .resize-handle')) {
        handle.addEventListener('mousedown', handleResizeStart);
        handle.addEventListener('touchstart', handleResizeStart, { passive: false });
    }
    
    // Event listeners globales para movimiento y finalización
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    
    // Inicializar configuración del recorte
    setTimeout(saveCropSettings, 100);
}

function captureImage() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    
    if (!video || !canvas) {
        showMessage('Error: Elementos de cámara no encontrados', 'error');
        return;
    }
    
    const context = canvas.getContext('2d');
    
    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Capturar la imagen completa del video
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    showMessage('📸 Imagen capturada - Ajuste el marco para recortar', 'success');
    
    // Cambiar al modo de recorte
    switchToCropMode();
}

function switchToCropMode() {
    // Ocultar modo de detección
    const detectionMode = document.getElementById('detection-mode');
    const cropMode = document.getElementById('crop-mode');
    const mainCaptureBtn = document.getElementById('main-capture-btn');
    const cropControls = document.getElementById('crop-controls');
    
    if (detectionMode) detectionMode.style.display = 'none';
    if (cropMode) cropMode.style.display = 'block';
    if (mainCaptureBtn) mainCaptureBtn.style.display = 'none';
    if (cropControls) cropControls.style.display = 'flex';
    
    // Inicializar controles de recorte
    initializeCropFrame();
    
    // Pausar el video para mostrar la imagen capturada
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    
    if (video && canvas) {
        video.style.opacity = '0.3';
        canvas.style.display = 'block';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.objectFit = 'cover';
        canvas.style.zIndex = '1';
    }
}

function confirmCrop() {
    const canvas = document.getElementById('camera-canvas');
    if (!canvas) {
        showMessage('Error: No hay imagen para procesar', 'error');
        return;
    }
    
    // Aplicar el recorte y descargar
    const croppedCanvas = applyCrop();
    if (croppedCanvas) {
        // Convertir a blob y descargar
        croppedCanvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `documento-${Date.now()}.jpg`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
                
                showMessage('✅ Documento guardado exitosamente', 'success');
                
                // Cerrar modal después de descargar
                setTimeout(() => {
                    closeCameraModal();
                }, 1500);
            }
        }, 'image/jpeg', 0.9);
    }
}

function retryCapture() {
    // Volver al modo de detección
    const detectionMode = document.getElementById('detection-mode');
    const cropMode = document.getElementById('crop-mode');
    const mainCaptureBtn = document.getElementById('main-capture-btn');
    const cropControls = document.getElementById('crop-controls');
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    
    if (detectionMode) detectionMode.style.display = 'block';
    if (cropMode) cropMode.style.display = 'none';
    if (mainCaptureBtn) mainCaptureBtn.style.display = 'block';
    if (cropControls) cropControls.style.display = 'none';
    
    // Restaurar video
    if (video) video.style.opacity = '1';
    if (canvas) canvas.style.display = 'none';
    
    showMessage('📹 Listo para nueva captura', 'info');
}

function selectFromGallery() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(event) {
        const file = event.target.files?.[0];
        if (file) {
            showMessage('📄 Procesando imagen seleccionada...', 'info');
            processNativeCameraImage(file);
        }
    };
    
    input.click();
}

function loadImageFromFile(file) {
    const canvas = document.getElementById('camera-canvas');
    
    if (!canvas) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const context = canvas.getContext('2d');
            
            // Configurar canvas con las dimensiones de la imagen
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Dibujar la imagen en el canvas
            context.drawImage(img, 0, 0);
            
            showMessage('🖼️ Imagen cargada - Ajuste el marco para recortar', 'success');
            
            // Cambiar al modo de recorte
            switchToCropMode();
        };
        img.src = e.target?.result;
    };
    reader.readAsDataURL(file);
}

function applyCrop() {
    const canvas = document.getElementById('camera-canvas');
    
    if (!canvas) return null;
    
    // Obtener datos del recorte
    const cropData = globalThis.cropData || {
        x: 0.1, y: 0.1, width: 0.8, height: 0.8
    };
    
    // Crear nuevo canvas para la imagen recortada
    const croppedCanvas = document.createElement('canvas');
    const ctx = croppedCanvas.getContext('2d');
    
    // Calcular dimensiones del recorte en píxeles
    const sourceWidth = canvas.width;
    const sourceHeight = canvas.height;
    
    const cropX = cropData.x * sourceWidth;
    const cropY = cropData.y * sourceHeight;
    const cropWidth = cropData.width * sourceWidth;
    const cropHeight = cropData.height * sourceHeight;
    
    // Configurar canvas de salida
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;
    
    // Recortar y dibujar la imagen
    ctx.drawImage(
        canvas,
        cropX, cropY, cropWidth, cropHeight,  // Área de origen
        0, 0, cropWidth, cropHeight          // Área de destino
    );
    
    return croppedCanvas;
}

function showCaptureFlash() {
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        z-index: 9999;
        opacity: 0.8;
        pointer-events: none;
    `;
    
    document.body.appendChild(flash);
    
    setTimeout(() => {
        flash.style.opacity = '0';
        flash.style.transition = 'opacity 0.3s ease';
        setTimeout(() => flash.remove(), 300);
    }, 100);
}

function showCapturedDocument(imageData) {
    const video = document.getElementById('camera-video');
    const overlay = document.querySelector('.scan-overlay');
    const container = video.parentElement;
    
    // Crear elemento de imagen para mostrar la captura
    const capturedImg = document.createElement('img');
    capturedImg.id = 'captured-image';
    capturedImg.src = imageData;
    capturedImg.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 2;
    `;
    
    container.appendChild(capturedImg);
    video.style.display = 'none';
    overlay.style.display = 'none';
    
    // Mostrar opciones para el documento capturado
    showDocumentOptions(imageData);
}

function showDocumentOptions(imageData) {
    const resultDiv = document.getElementById('scan-result');
    
    resultDiv.innerHTML = `
        <h4>📄 Documento Capturado</h4>
        <div class="document-preview">
            <img src="${imageData}" alt="Documento capturado" style="
                width: 100%;
                max-height: 200px;
                object-fit: contain;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                background: #f8f9fa;
            ">
        </div>
        <div class="result-actions">
            <button class="btn-process" onclick="saveDocument('${imageData}')">💾 Guardar</button>
            <button class="btn-retry" onclick="retryCapture()">🔄 Tomar Otra</button>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

function saveDocument(imageData) {
    // Crear enlace de descarga
    const link = document.createElement('a');
    link.download = `documento_${Date.now()}.jpg`;
    link.href = imageData;
    
    // Simular clic para descargar
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    showMessage('📄 Documento guardado en descargas', 'success');
    
    // Opcional: Cerrar modal después de guardar
    setTimeout(() => {
        closeCameraModal();
    }, 2000);
}

function openGallery() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                showCapturedDocument(e.target.result);
                showMessage('📄 Imagen seleccionada desde galería', 'success');
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function closeCameraModal() {
    const modal = document.getElementById('camera-modal');
    const styles = document.getElementById('camera-modal-styles');
    
    // Detener la cámara
    const video = document.getElementById('camera-video');
    if (video?.srcObject) {
        const tracks = video.srcObject.getTracks();
        for (const track of tracks) {
            track.stop();
        }
    }
    
    if (modal) modal.remove();
    if (styles) styles.remove();
}

// Agregar estilos de animación para los mensajes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);