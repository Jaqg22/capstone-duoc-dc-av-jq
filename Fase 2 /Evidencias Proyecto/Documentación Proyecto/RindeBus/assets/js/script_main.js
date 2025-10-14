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
            window.location.href = 'inicio.html';
        }, 1500);
    }
}

function openModule(module) {
    // Mostrar mensaje de carga
    showMessage(`Cargando ${getModuleName(module)}...`, 'info');
    
    // Simular carga del módulo
    setTimeout(() => {
        switch(module) {
            case 'planilla-digital':
                showMessage('Módulo Planilla Digital próximamente disponible', 'warning');
                break;
            case 'planilla-manual':
                showMessage('Módulo Planilla Manual próximamente disponible', 'warning');
                break;
            case 'consultas':
                showMessage('Módulo Consultas próximamente disponible', 'warning');
                break;
            default:
                showMessage('Módulo no encontrado', 'error');
        }
    }, 1000);
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
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 * (index + 1));
    });
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