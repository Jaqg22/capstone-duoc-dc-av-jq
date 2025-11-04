// RindeBus - Script del Menú Principal (Versión Simplificada)
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
    
    // Remover el mensaje después de 5 segundos (más tiempo para leer)
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageDiv.remove(), 300);
    }, 5000);
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

// Funciones para Planilla Digital (Cámara + OCR) - Simplificadas
function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isMobileUA = mobileRegex.test(userAgent.toLowerCase());
    const isMobileScreen = window.innerWidth <= 768;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isMobileUA || (isMobileScreen && isTouchDevice);
}

function openNativeMobileCamera() {
    console.log('📱 Abriendo cámara nativa del dispositivo móvil...');
    closeMobileOptions();
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Usar cámara trasera
    input.style.display = 'none';
    
    document.body.appendChild(input);
    
    input.onchange = function(event) {
        const files = event.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            
            if (!file.type.startsWith('image/')) {
                showMessage('❌ Por favor selecciona una imagen válida', 'error');
                return;
            }
            
            if (file.size > 10 * 1024 * 1024) {
                showMessage('⚠️ La imagen es muy grande (máx. 10MB)', 'warning');
                return;
            }
            
            console.log('📄 Archivo capturado:', file.name);
            showMessage('🚀 Enviando imagen...', 'info');
            
            // Enviar imagen directamente al endpoint
            uploadImageToServer(file);
        }
        
        document.body.removeChild(input);
    };
    
    showMessage('📱 Abriendo cámara del dispositivo...', 'info');
    setTimeout(() => input.click(), 500);
}

function showMobileOptions() {
    const optionsHtml = `
        <div class="mobile-options-overlay">
            <div class="options-container">
                <h3>Selecciona una opción</h3>
                <p style="color: #666; margin-bottom: 20px; font-size: 14px;">
                    Elige cómo quieres cargar tu imagen
                </p>
                
                <button onclick="openNativeMobileCamera()" class="option-button native-camera">
                    📷 Tomar Nueva Foto
                </button>
                
                <button onclick="selectFromGallery(); closeMobileOptions();" class="option-button web-camera">
                    📁 Seleccionar de Galería
                </button>
                
                <button onclick="closeMobileOptions()" class="option-button cancel">
                    ❌ Cancelar
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', optionsHtml);
}

function closeMobileOptions() {
    const overlay = document.querySelector('.mobile-options-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function openCamera() {
    console.log('📷 Iniciando cámara...');
    showMessage('📷 Preparando cámara...', 'info');
    setTimeout(() => openNativeCamera(), 500);
}

function openNativeCamera() {
    console.log('📷 Abriendo cámara web nativa...');
    
    // Crear modal de cámara simplificado
    const modal = document.createElement('div');
    modal.id = 'camera-modal';
    modal.className = 'camera-modal';
    modal.innerHTML = `
        <div class="camera-container">
            <div class="camera-header">
                <h3>📷 Tomar Foto</h3>
                <button class="camera-close" onclick="closeCameraModal()">✕</button>
            </div>
            <div class="camera-viewport">
                <video id="camera-video" autoplay playsinline muted></video>
                <canvas id="camera-canvas" style="display: none;"></canvas>
            </div>
            <div class="camera-controls">
                <button id="capture-btn" class="capture-button" onclick="capturePhoto()">
                    📷 Capturar
                </button>
                <button class="gallery-btn" onclick="selectFromGallery()">📁 Galería</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    addCameraStyles();
    initializeCamera();
}

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
        
        .camera-controls {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            gap: 20px;
            background: rgba(0, 0, 0, 0.8);
        }
        
        .capture-button, .gallery-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 25px;
            color: white;
            cursor: pointer;
            font-size: 16px;
        }
        
        .capture-button {
            background: #4CAF50;
        }
        
        .gallery-btn {
            background: #FF9800;
        }
    `;
    
    document.head.appendChild(style);
}

async function initializeCamera() {
    try {
        const video = document.getElementById('camera-video');
        if (!video) return;
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showMessage('❌ Tu navegador no soporta acceso a cámara', 'error');
            return;
        }
        
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
        } catch (backError) {
            stream = await navigator.mediaDevices.getUserMedia({
                video: true
            });
        }
        
        video.srcObject = stream;
        video.onloadedmetadata = async () => {
            await video.play();
            showMessage('✅ Cámara inicializada', 'success');
        };
        
    } catch (error) {
        console.error('❌ Error inicializando cámara:', error);
        showMessage('❌ Error accediendo a la cámara', 'error');
    }
}

async function capturePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    
    if (!video || !canvas) return;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        showMessage('❌ La cámara no está activa', 'error');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(function(blob) {
        if (!blob) {
            showMessage('❌ Error procesando la captura', 'error');
            return;
        }
        
        const file = new File([blob], `captura_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        closeCameraModal();
        showMessage('🚀 Enviando imagen capturada...', 'info');
        uploadImageToServer(file);
        
    }, 'image/jpeg', 0.9);
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
            closeCameraModal();
            showMessage('📁 Enviando imagen de galería...', 'info');
            uploadImageToServer(file);
        }
        input.remove();
    };
    
    document.body.appendChild(input);
    input.click();
}

// Función principal para subir imagen al servidor
async function uploadImageToServer(file) {
    try {
        // Información detallada del archivo
        const fileInfo = {
            name: file.name,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            type: file.type,
            lastModified: new Date(file.lastModified).toLocaleString()
        };
        
        console.log('📤 Subiendo imagen al servidor:', fileInfo);
        showMessage(`📤 Enviando: ${fileInfo.name} (${fileInfo.size})`, 'info');
        
        // Crear FormData
        const formData = new FormData();
        formData.append('imagen', file);
        
        // Mostrar que se está enviando
        showMessage('🔄 Conectando con API...', 'info');
        
        // Enviar através del proxy (funciona tanto en localhost como ngrok)
        const response = await fetch('/api/planillas/', {
            method: 'POST',
            body: formData
        });
        
        // Mostrar código de respuesta
        showMessage(`📡 Respuesta API: ${response.status} ${response.statusText}`, response.ok ? 'info' : 'error');
        
        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            // Si no es JSON, obtener el texto
            const textResult = await response.text();
            throw new Error(`Respuesta no válida: ${textResult.substring(0, 100)}...`);
        }
        
        if (response.ok) {
            console.log('✅ Imagen subida exitosamente:', result);
            
            // Obtener ID de la planilla
            const planillaId = result.id;
            showMessage(`✅ Imagen guardada! ID: ${planillaId}`, 'success');
            
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
                        
                        // Redirigir a manual.html después de obtener los datos
                        setTimeout(() => {
                            window.location.href = '/manual/';
                        }, 1000);
                    } else {
                        console.warn('⚠️ No se pudieron obtener datos extraídos');
                        showMessage('⚠️ Imagen guardada, pero sin datos extraídos', 'warning');
                        
                        // Redirigir de todos modos
                        setTimeout(() => {
                            window.location.href = '/manual/';
                        }, 1500);
                    }
                } catch (error) {
                    console.error('❌ Error obteniendo datos extraídos:', error);
                    showMessage('⚠️ Error obteniendo datos, redirigiendo...', 'warning');
                    
                    // Redirigir de todos modos
                    setTimeout(() => {
                        window.location.href = '/manual/';
                    }, 1500);
                }
            }, 2000); // Esperar 2 segundos para que se procese la imagen
            
        } else {
            const errorMsg = result.error || result.message || `HTTP ${response.status}`;
            throw new Error(errorMsg);
        }
        
    } catch (error) {
        console.error('❌ Error subiendo imagen:', error);
        
        // Mostrar diferentes tipos de errores
        let userErrorMsg = 'Error desconocido';
        
        if (error.message.includes('Failed to fetch')) {
            userErrorMsg = '🔌 No se puede conectar con la API. ¿Está funcionando en puerto 8000?';
        } else if (error.message.includes('NetworkError')) {
            userErrorMsg = '🌐 Error de red. Verifica tu conexión.';
        } else if (error.message.includes('404')) {
            userErrorMsg = '🔍 Endpoint no encontrado. Verifica la URL de la API.';
        } else if (error.message.includes('500')) {
            userErrorMsg = '🚨 Error interno del servidor API.';
        } else {
            userErrorMsg = `❌ ${error.message}`;
        }
        
        showMessage(userErrorMsg, 'error');
        
        // Log completo para debugging
        console.error('❌ Error completo:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            timestamp: new Date().toISOString()
        });
    }
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
    
    .mobile-options-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .options-container {
        background: white;
        padding: 30px;
        border-radius: 15px;
        text-align: center;
        max-width: 300px;
        width: 90%;
    }
    
    .option-button {
        display: block;
        width: 100%;
        padding: 15px;
        margin: 10px 0;
        border: none;
        border-radius: 8px;
        background: #007bff;
        color: white;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.2s;
    }
    
    .option-button:hover {
        background: #0056b3;
    }
    
    .option-button.cancel {
        background: #dc3545;
    }
    
    .option-button.cancel:hover {
        background: #c82333;
    }
`;
document.head.appendChild(style);