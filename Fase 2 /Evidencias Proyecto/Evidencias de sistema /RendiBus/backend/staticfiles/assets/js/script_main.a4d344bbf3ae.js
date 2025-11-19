// RendiBus - Script del Menú Principal
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está autenticado
    checkAuthentication();
    
    // Agregar efectos de carga
    addLoadingEffects();
});

function checkAuthentication() {
    // Aquí puedes agregar lógica para verificar si el usuario está logueado
    // Por ahora, solo mostraremos un mensaje de bienvenida
    console.log('Usuario autenticado en RendiBus');
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
            // Abrir modal de carga de imagen en lugar de redirigir
            showMessage('📸 Abriendo scanner de documentos...', 'info');
            openImageScannerModal();
            break;
        case 'planilla-manual':
            // Redirigir a la página de planilla manual
            showMessage('🔄 Cargando planilla manual...', 'info');
            setTimeout(() => {
                globalThis.location.href = '/manual/';
            }, 1000);
            break;
        case 'consultas':
            // Redirigir a la página de consultas
            showMessage('🔄 Cargando módulo de consultas...', 'info');
            setTimeout(() => {
                window.location.href = '/consultas/';
            }, 1000);
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
            
            // Guardar en localStorage y redirigir a preview
            console.log('💾 Guardando imagen en localStorage para preview...');
            showMessage('📸 Preparando vista previa...', 'info');
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    console.log('💾 Guardando datos...');
                    localStorage.setItem('tempImageData', e.target.result);
                    localStorage.setItem('tempImageName', file.name);
                    localStorage.setItem('tempImageSize', file.size);
                    
                    console.log('✅ Guardado exitoso, redirigiendo...');
                    
                    // Usar replace para forzar navegación
                    window.location.replace('/preview/');
                } catch (error) {
                    console.error('❌ Error:', error);
                    alert('Error al procesar imagen');
                }
            };
            reader.onerror = function() {
                console.error('❌ Error leyendo archivo');
                alert('Error al leer archivo');
            };
            reader.readAsDataURL(file);
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
        
        // Convertir canvas directamente a DataURL (más rápido y confiable)
        const dataURL = canvas.toDataURL('image/jpeg', 0.9);
        const filename = `captura_${Date.now()}.jpg`;
        
        console.log('📄 Imagen capturada:', {
            filename: filename,
            size: `${(dataURL.length / 1024).toFixed(2)} KB`
        });
        
        console.log('🚨 VERSIÓN ACTUALIZADA - DEBE REDIRIGIR A /preview/');
        
        // Cerrar modal de cámara
        closeCameraModal();
        
        // Guardar directamente en localStorage
        console.log('💾 Guardando imagen en localStorage...');
        localStorage.setItem('tempImageData', dataURL);
        localStorage.setItem('tempImageName', filename);
        localStorage.setItem('tempImageSize', Math.round(dataURL.length * 0.75));
        
        console.log('✅ Datos guardados en localStorage');
        console.log('🚀 EJECUTANDO REDIRECCIÓN A /preview/ AHORA...');
        
        // Navegar a preview inmediatamente
        window.location.href = '/preview/';
        
        console.log('⚠️ SI VES ESTO, LA REDIRECCIÓN FALLÓ');
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
            
            console.log('📁 Imagen seleccionada de galería:', file.name);
            showMessage('📸 Preparando vista previa...', 'info');
            
            // Convertir a DataURL usando Promise para mayor confiabilidad
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    console.log('💾 Guardando en localStorage...');
                    localStorage.setItem('tempImageData', e.target.result);
                    localStorage.setItem('tempImageName', file.name);
                    localStorage.setItem('tempImageSize', file.size);
                    
                    console.log('✅ Guardado exitoso');
                    console.log('🚀 Redirigiendo a /preview/');
                    
                    // Forzar redirección inmediata
                    window.location.replace('/preview/');
                } catch (error) {
                    console.error('❌ Error guardando:', error);
                    alert('Error al procesar imagen');
                }
            };
            reader.onerror = function() {
                console.error('❌ Error leyendo archivo');
                alert('Error al leer archivo');
            };
            reader.readAsDataURL(file);
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

// ===== SISTEMA DE MODAL SCANNER DE IMÁGENES =====

let selectedFile = null;
let cameraStream = null;
let canvas = null;
let context = null;

function openImageScannerModal() {
    console.log('📸 Abriendo modal de scanner de imágenes...');
    
    // Crear el modal si no existe
    if (!document.getElementById('imageScannerModal')) {
        createImageScannerModal();
    }
    
    // Mostrar el modal
    const modal = document.getElementById('imageScannerModal');
    modal.style.display = 'flex';
    
    // Preparar canvas para la cámara
    if (!canvas) {
        canvas = document.createElement('canvas');
        context = canvas.getContext('2d');
    }
}

function createImageScannerModal() {
    const modalHTML = `
        <!-- Modal Scanner de Imágenes -->
        <div id="imageScannerModal" style="
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #003E84;
            z-index: 10000;
            justify-content: center;
            align-items: center;
        ">
            <div style="
                position: relative;
                width: 95%;
                max-width: 600px;
                max-height: 90vh;
                background: #FFFFFF;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 15px 35px rgba(0, 62, 132, 0.4);
                display: flex;
                flex-direction: column;
                border: 1px solid rgba(245, 195, 3, 0.3);
            ">
                <!-- Header -->
                <div style="
                    padding: 1.5rem;
                    background: linear-gradient(135deg, #003E84, #002856);
                    color: #FFFFFF;
                    text-align: center;
                    font-weight: 700;
                    font-size: 1.3rem;
                    position: relative;
                    flex-shrink: 0;
                ">
                    <button onclick="closeImageScannerModal()" style="
                        position: absolute;
                        top: 15px;
                        right: 20px;
                        background: rgba(245, 195, 3, 0.2);
                        border: 1px solid rgba(245, 195, 3, 0.4);
                        color: #FFFFFF;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        font-size: 1.5rem;
                        cursor: pointer;
                        backdrop-filter: blur(10px);
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(245, 195, 3, 0.3)'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(245, 195, 3, 0.2)'; this.style.transform='scale(1)'">×</button>
                    📁 Cargar Planilla
                </div>
                
                <!-- Subtitle -->
                <div style="
                    padding: 1rem 1.5rem 0;
                    text-align: center;
                    color: #003E84;
                    font-size: 0.95rem;
                    background: #E8F4FD;
                    flex-shrink: 0;
                    font-weight: 500;
                ">
                    Sube una imagen de tu planilla para procesamiento automático
                </div>
                
                <!-- Upload Options -->
                <div style="
                    padding: 1.5rem;
                    background: #E8F4FD;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    flex: 1;
                    align-items: center;
                ">
                    <!-- Tomar Foto -->
                    <button onclick="document.getElementById('modalCameraInput').click()" style="
                        background: linear-gradient(135deg, #FFFFFF, #F8FAFC);
                        border: 3px dashed #003E84;
                        border-radius: 15px;
                        padding: 1.5rem 1rem;
                        text-align: center;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        color: #374151;
                        font-weight: 600;
                        height: 140px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        box-shadow: 0 4px 15px rgba(0, 62, 132, 0.2);
                    " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px rgba(0, 62, 132, 0.3)'; this.style.borderColor='#F5C303'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0, 62, 132, 0.2)'; this.style.borderColor='#003E84'">
                        <div style="font-size: 2.5rem; margin-bottom: 0.8rem;">📷</div>
                        <div style="font-size: 1rem; margin-bottom: 0.3rem; color: #003E84;">Tomar Foto</div>
                        <div style="font-size: 0.8rem; color: #6B7280;">Usar cámara del dispositivo</div>
                    </button>
                    
                    <!-- Subir Archivo -->
                    <button onclick="document.getElementById('modalFileInput').click()" style="
                        background: linear-gradient(135deg, #FFFFFF, #F8FAFC);
                        border: 3px dashed #003E84;
                        border-radius: 15px;
                        padding: 1.5rem 1rem;
                        text-align: center;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        color: #374151;
                        font-weight: 600;
                        height: 140px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        box-shadow: 0 4px 15px rgba(0, 62, 132, 0.2);
                    " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px rgba(0, 62, 132, 0.3)'; this.style.borderColor='#F5C303'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0, 62, 132, 0.2)'; this.style.borderColor='#003E84'">
                        <div style="font-size: 2.5rem; margin-bottom: 0.8rem;">🖼️</div>
                        <div style="font-size: 1rem; margin-bottom: 0.3rem; color: #003E84;">Subir Archivo</div>
                        <div style="font-size: 0.8rem; color: #6B7280;">Seleccionar de galería</div>
                    </button>
                </div>
                
                <!-- Inputs de archivo ocultos -->
                <input type="file" id="modalCameraInput" accept="image/*" capture="environment" style="display: none;">
                <input type="file" id="modalFileInput" accept="image/*,.pdf" style="display: none;">
            </div>
            
            <!-- Modal Preview -->
            <div id="modalPreviewContainer" style="display: none;">
                <!-- El contenido del preview se generará dinámicamente -->
            </div>
        </div>
        
        <style>
        @media (max-width: 768px) {
            #imageScannerModal > div:first-child {
                width: 98% !important;
                max-height: 95vh !important;
                margin: 1% !important;
            }
            #imageScannerModal > div:first-child > div:nth-child(3) {
                grid-template-columns: 1fr !important;
                gap: 1rem !important;
                padding: 1rem !important;
            }
            #imageScannerModal > div:first-child > div:nth-child(3) button {
                height: 120px !important;
                font-size: 0.9rem !important;
            }
            #imageScannerModal > div:first-child > div:nth-child(3) button > div:first-child {
                font-size: 2rem !important;
                margin-bottom: 0.5rem !important;
            }
        }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Agregar event listeners para ambos inputs de archivo
    document.getElementById('modalCameraInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleModalFileSelect(file);
        }
    });
    
    document.getElementById('modalFileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleModalFileSelect(file);
        }
    });
}

function closeImageScannerModal() {
    const modal = document.getElementById('imageScannerModal');
    modal.style.display = 'none';
    
    // Resetear variables y inputs
    selectedFile = null;
    if (document.getElementById('modalFileInput')) {
        document.getElementById('modalFileInput').value = '';
    }
    if (document.getElementById('modalCameraInput')) {
        document.getElementById('modalCameraInput').value = '';
    }
}

function handleModalFileSelect(file) {
    console.log('📁 Archivo seleccionado en modal:', file.name, 'Tamaño:', file.size, 'bytes');

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        showMessage('❌ Tipo de archivo no soportado. Use JPG, PNG o PDF', 'error');
        return;
    }

    // Validar tamaño (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showMessage('❌ El archivo es muy grande. Máximo 10MB', 'error');
        return;
    }

    selectedFile = file;
    console.log('✅ Archivo válido almacenado en selectedFile');
    
    // Leer la imagen y guardar en localStorage
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('📸 Imagen leída, guardando en localStorage...');
        
        // Guardar datos de la imagen en localStorage
        localStorage.setItem('tempImageData', e.target.result);
        localStorage.setItem('tempImageName', file.name);
        localStorage.setItem('tempImageSize', file.size);
        
        console.log('✅ Datos guardados, navegando a /preview/');
        
        // Navegar a la página de preview
        window.location.href = '/preview/';
    };
    
    reader.readAsDataURL(file);
}

function showModalPreview() {
    console.log('🔍 Mostrando preview en modal...');
    
    if (!selectedFile) {
        showMessage('❌ Por favor selecciona una imagen primero', 'error');
        return;
    }
    
    // Cerrar el modal principal primero
    const imageScannerModal = document.getElementById('imageScannerModal');
    const mainContent = imageScannerModal.children[0];
    
    // Ocultar contenido principal
    mainContent.style.display = 'none';
    
    const previewContainer = document.getElementById('modalPreviewContainer');
    
    let previewHTML = '';
    
    if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewHTML = `
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #FFFFFF;
                    border-radius: 20px;
                    overflow: hidden;
                    width: 95%;
                    max-width: 500px;
                    max-height: 90vh;
                    box-shadow: 0 15px 35px rgba(0, 62, 132, 0.4);
                    display: flex;
                    flex-direction: column;
                    border: 1px solid rgba(245, 195, 3, 0.3);
                ">
                    <!-- Header -->
                    <div style="
                        padding: 1rem 1.5rem;
                        background: linear-gradient(135deg, #003E84, #002856);
                        color: #FFFFFF;
                        text-align: center;
                        font-weight: 700;
                        position: relative;
                        font-size: 1rem;
                        flex-shrink: 0;
                    ">
                        🔍 Vista Previa - Confirmar Imagen
                        <button onclick="closeModalPreview()" style="
                            position: absolute;
                            top: 10px;
                            right: 15px;
                            background: rgba(245, 195, 3, 0.2);
                            border: 1px solid rgba(245, 195, 3, 0.4);
                            color: #FFFFFF;
                            width: 35px;
                            height: 35px;
                            border-radius: 50%;
                            font-size: 1.2rem;
                            cursor: pointer;
                            backdrop-filter: blur(10px);
                            transition: all 0.3s ease;
                        " onmouseover="this.style.background='rgba(245, 195, 3, 0.3)'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='rgba(245, 195, 3, 0.2)'; this.style.transform='scale(1)'">×</button>
                    </div>
                    
                    <!-- Image Container -->
                    <div style="
                        padding: 1rem;
                        text-align: center;
                        background: #E8F4FD;
                        flex: 1;
                        overflow-y: auto;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    ">
                        <img id="modalPreviewImage" src="${e.target.result}" style="
                            width: 100%;
                            max-width: 400px;
                            height: auto;
                            max-height: 40vh;
                            object-fit: contain;
                            border-radius: 12px;
                            box-shadow: 0 8px 25px rgba(0, 62, 132, 0.3);
                            margin-bottom: 1rem;
                            border: 2px solid rgba(245, 195, 3, 0.3);
                        ">
                        
                        <!-- File Info -->
                        <div style="
                            background: #FFFFFF;
                            border-radius: 12px;
                            padding: 1rem;
                            box-shadow: 0 4px 15px rgba(0, 62, 132, 0.2);
                            border: 1px solid rgba(245, 195, 3, 0.3);
                            text-align: left;
                            width: 100%;
                            max-width: 400px;
                        ">
                            <h4 style="
                                color: #27ae60;
                                margin: 0 0 0.8rem 0;
                                font-size: 0.9rem;
                                font-weight: 700;
                                text-align: center;
                                padding-bottom: 0.5rem;
                                border-bottom: 1px solid #E8F4FD;
                            ">📋 Detalles del Archivo:</h4>
                            
                            <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.3rem 0.8rem; font-size: 0.8rem;">
                                <span style="color: #6B7280; font-weight: 600;">Nombre:</span>
                                <span style="color: #002856; font-weight: 500; word-break: break-all; font-size: 0.75rem;">${selectedFile.name}</span>
                                
                                <span style="color: #6B7280; font-weight: 600;">Tamaño:</span>
                                <span style="color: #002856; font-weight: 500;">${formatFileSize(selectedFile.size)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div style="
                        padding: 1rem;
                        display: flex;
                        flex-direction: column;
                        gap: 0.8rem;
                        background: #E8F4FD;
                        border-top: 1px solid rgba(245, 195, 3, 0.3);
                        flex-shrink: 0;
                    ">
                        <button onclick="closeModalPreview()" style="
                            background: #6B7280;
                            color: #FFFFFF;
                            border: none;
                            padding: 0.8rem 1rem;
                            font-size: 0.9rem;
                            font-weight: 600;
                            border-radius: 25px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            width: 100%;
                            box-shadow: 0 4px 15px rgba(107, 123, 128, 0.2);
                        " onmouseover="this.style.background='#4B5563'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 20px rgba(107, 123, 128, 0.3)'" onmouseout="this.style.background='#6B7280'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(107, 123, 128, 0.2)'">🔄 Tomar Otra</button>
                        
                        <button onclick="rotateModalImage()" style="
                            background: linear-gradient(135deg, #F5C303, #E6B003);
                            color: #002856;
                            border: none;
                            padding: 0.8rem 1rem;
                            font-size: 0.9rem;
                            font-weight: 600;
                            border-radius: 25px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            width: 100%;
                            box-shadow: 0 4px 15px rgba(245, 195, 3, 0.3);
                        " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 8px 25px rgba(245, 195, 3, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(245, 195, 3, 0.3)'">🔄 Rotar</button>
                        
                        <button onclick="confirmAndUploadModal()" style="
                            background: linear-gradient(135deg, #003E84, #002856);
                            color: #FFFFFF;
                            border: none;
                            padding: 0.8rem 1rem;
                            font-size: 0.9rem;
                            font-weight: 600;
                            border-radius: 25px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            width: 100%;
                            box-shadow: 0 4px 15px rgba(0, 62, 132, 0.3);
                        " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 8px 25px rgba(0, 62, 132, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0, 62, 132, 0.3)'">🚀 Enviar Imagen</button>
                    </div>
                    
                    <!-- Tip -->
                    <div style="
                        padding: 0.8rem 1rem;
                        background: linear-gradient(135deg, #002856, #1F2937);
                        color: #F5C303;
                        text-align: center;
                        font-size: 0.75rem;
                        font-weight: 500;
                        flex-shrink: 0;
                    ">
                        💡 Asegúrate de que el documento sea legible y esté bien iluminado
                    </div>
                </div>
            `;
            
            previewContainer.innerHTML = previewHTML;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(selectedFile);
    }
}

function closeModalPreview() {
    const previewContainer = document.getElementById('modalPreviewContainer');
    previewContainer.style.display = 'none';
    previewContainer.innerHTML = '';
    
    // Restaurar el modal principal
    const imageScannerModal = document.getElementById('imageScannerModal');
    const mainContent = imageScannerModal.children[0];
    mainContent.style.display = 'block';
    
    // Resetear selección de archivo
    selectedFile = null;
    document.getElementById('modalFileInput').value = '';
    document.getElementById('modalCameraInput').value = '';
}

function rotateModalImage() {
    const img = document.getElementById('modalPreviewImage');
    if (img) {
        // Obtener rotación actual o inicializar en 0
        let currentRotation = Number.parseInt(img.dataset.rotation || '0');
        currentRotation = (currentRotation + 90) % 360;
        img.dataset.rotation = currentRotation;
        img.style.transform = `rotate(${currentRotation}deg)`;
    }
}

// Función para comprimir imagen antes de enviar
async function compressImage(file, maxSizeMB = 2, maxWidthOrHeight = 1920) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Redimensionar si es muy grande
                if (width > height) {
                    if (width > maxWidthOrHeight) {
                        height *= maxWidthOrHeight / width;
                        width = maxWidthOrHeight;
                    }
                } else {
                    if (height > maxWidthOrHeight) {
                        width *= maxWidthOrHeight / height;
                        height = maxWidthOrHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Comprimir con calidad ajustable
                let quality = 0.85;
                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    console.log(`🗜️ Compresión: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`);
                    resolve(compressedFile);
                }, 'image/jpeg', quality);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

async function confirmAndUploadModal() {
    console.log('✅ Confirmando y subiendo imagen desde modal...');
    
    if (!selectedFile) {
        showMessage('❌ Por favor selecciona una imagen primero', 'error');
        return;
    }
    
    try {
        // Mostrar mensaje de procesamiento
        showMessage('🗜️ Comprimiendo imagen...', 'info');
        
        // Comprimir imagen antes de enviar
        const compressedFile = await compressImage(selectedFile, 2, 1920);
        
        showMessage('📤 Subiendo imagen a Azure OCR...', 'info');
        
        // Crear FormData
        const formData = new FormData();
        formData.append('imagen', compressedFile);
        
        console.log('📤 Enviando archivo:', compressedFile.name, 'Tamaño:', compressedFile.size);
        
        // Obtener token CSRF
        const csrfToken = getCsrfTokenFromCookie();
        
        // Paso 1: Enviar imagen a Azure OCR
        const uploadResponse = await fetch('/api/upload_imagen/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrfToken
            }
        });
        
        console.log('📥 Respuesta de upload:', uploadResponse.status);
        
        if (!uploadResponse.ok) {
            throw new Error(`Error en upload: ${uploadResponse.status}`);
        }
        
        const uploadData = await uploadResponse.json();
        console.log('✅ Upload exitoso:', uploadData);
        
        if (uploadData.success && uploadData.planilla_id) {
            // Guardar SOLO el planilla_id antes de navegar
            localStorage.setItem('planillaIdPendiente', uploadData.planilla_id);
            localStorage.setItem('imagenNombre', selectedFile.name);
            localStorage.setItem('tiempoOCR', Date.now().toString());
            
            console.log('💾 Planilla ID guardado:', uploadData.planilla_id);
            console.log('🚀 Navegando a manual.html...');
            
            // Ocultar body instantáneamente
            document.body.style.visibility = 'hidden';
            
            // Navegar
            setTimeout(() => {
                window.location.href = '/manual/';
            }, 50);
        } else {
            throw new Error(uploadData.error || uploadData.message || 'Error en el procesamiento');
        }
    } catch (error) {
        console.error('❌ Error al procesar:', error);
        
        // Mensajes más específicos según el tipo de error
        let mensajeError = '';
        if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
            mensajeError = '🚫 Servidor de Azure OCR no disponible.\n\n' +
                          '💡 Posibles soluciones:\n' +
                          '• Verifique que el servidor esté corriendo en puerto 8001\n' +
                          '• Contacte al administrador del sistema\n' +
                          '• Intente nuevamente en unos minutos';
        } else if (error.message.includes('504') || error.message.includes('Timeout')) {
            mensajeError = '⏱️ Tiempo de espera agotado. El servidor tardó mucho en responder.\n\nIntente nuevamente.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            mensajeError = '📡 Error de conexión con Azure OCR.\n\n' +
                          '• Verifique su conexión a internet\n' +
                          '• Asegúrese que el servidor Azure OCR esté disponible en localhost:8001\n' +
                          '• Verifique configuración de CORS si es necesario';
        } else if (error.message.includes('Error obteniendo datos de Azure')) {
            mensajeError = '❌ Error obteniendo datos extraídos de Azure OCR.\n\n' +
                          '• La imagen fue subida correctamente\n' +
                          '• Pero no se pudieron obtener los datos procesados\n' +
                          '• Intente nuevamente o contacte soporte técnico';
        } else {
            mensajeError = `❌ Error: ${error.message}`;
        }
        
        showMessage(mensajeError, 'error');
    }
}

function getCsrfTokenFromCookie() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return value;
        }
    }
    return '';
}

function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Number.parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}