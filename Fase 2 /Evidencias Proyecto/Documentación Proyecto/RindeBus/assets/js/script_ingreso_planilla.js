// RindeBus - Script de Ingreso de Planilla Manual
document.addEventListener('DOMContentLoaded', function() {
    initializePlanillaForm();
});

function initializePlanillaForm() {
    const form = document.getElementById('form-planilla');
    if (!form) return;
    
    const totalIngresos = form.querySelector('[name="total_ingresos"]');
    const totalEgresos = form.querySelector('[name="total_egresos"]');

    function toNumber(v) { 
        return v ? parseFloat(v) || 0 : 0; 
    }

    const clpFormatter = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 2 });

    function formatCLP(value) {
        return clpFormatter.format(Number(value || 0));
    }

    function updateTotals() {
        // Calcular total ingresos
        const ingRuta = toNumber(form.ing_total_ruta.value);
        const ingOfi = toNumber(form.ing_total_oficina.value);
        const totalIng = ingRuta + ingOfi;

        const rawTotalField = form.querySelector('[name="total_ingresos_raw"]');
        if (rawTotalField) rawTotalField.value = totalIng.toFixed(2);
        if (totalIngresos) totalIngresos.value = formatCLP(totalIng);

        // Calcular total egresos
        const viaticos = toNumber(form.viaticos.value);
        const losa = toNumber(form.losa.value);
        const pension = toNumber(form.pension.value);
        const cena = toNumber(form.cena.value);
        const otros = toNumber(form.otros.value);
        const totalEgr = viaticos + losa + pension + cena + otros;

        const rawEgrField = form.querySelector('[name="total_egresos_raw"]');
        if (rawEgrField) rawEgrField.value = totalEgr.toFixed(2);
        if (totalEgresos) totalEgresos.value = formatCLP(totalEgr);
    }

    // Simular base de datos de personal (en producción vendría de una API)
    const personalDB = {
        'CON001': 'Juan Pérez',
        'CON002': 'María González',
        'CON003': 'Carlos Rodríguez',
        'AST001': 'Ana Martínez',
        'AST002': 'Luis Fernández',
        'AST003': 'Carmen López'
    };

    function lookupPersonal(codigo, targetField) {
        const nombreField = form.querySelector(`[name="${targetField}"]`);
        if (!nombreField) return;

        if (codigo && personalDB[codigo.toUpperCase()]) {
            nombreField.value = personalDB[codigo.toUpperCase()];
            nombreField.style.backgroundColor = '#e8f5e8'; // Verde claro para indicar éxito
        } else if (codigo) {
            nombreField.value = '';
            nombreField.style.backgroundColor = '#ffe8e8'; // Rojo claro para indicar error
            nombreField.placeholder = 'Código no encontrado';
        } else {
            nombreField.value = '';
            nombreField.style.backgroundColor = '';
            nombreField.placeholder = '';
        }
    }

    // Escuchar cambios en códigos de conductor y asistente
    const codConductor = form.querySelector('[name="cod_conductor"]');
    const codAsistente = form.querySelector('[name="cod_asistente"]');

    if (codConductor) {
        codConductor.addEventListener('blur', function() {
            lookupPersonal(this.value, 'conductor');
        });
    }

    if (codAsistente) {
        codAsistente.addEventListener('blur', function() {
            lookupPersonal(this.value, 'asistente');
        });
    }

    // Escuchar cambios en el formulario para actualizar totales
    form.addEventListener('input', updateTotals);
    
    // Calcular totales iniciales
    updateTotals();
}

function uploadPlanilla() {
    const form = document.getElementById('form-planilla');
    if (!form) return;
    
    // Validación básica de campos obligatorios
    const requiredFields = ['nro_planilla', 'nro_bus', 'fecha'];
    const missingFields = requiredFields.filter(field => !form[field].value.trim());
    
    if (missingFields.length > 0) {
        showMessage('Por favor complete los campos obligatorios: ' + missingFields.join(', '), 'error');
        return;
    }
    
    // Validación de números
    const numericFields = ['cant_tarifas', 'ing_total_ruta', 'ing_total_oficina', 'viaticos', 'losa', 'pension', 'cena', 'otros'];
    const invalidNumbers = numericFields.filter(field => {
        const value = form[field].value;
        return value && isNaN(parseFloat(value));
    });
    
    if (invalidNumbers.length > 0) {
        showMessage('Algunos campos numéricos tienen valores inválidos', 'error');
        return;
    }
    
    // Simulación de carga
    showMessage('Cargando planilla...', 'info');
    
    // Simular delay de envío al servidor
    setTimeout(() => {
        showMessage('Planilla cargada exitosamente', 'success');
        
        // Aquí se implementaría el envío real al servidor
        const formData = new FormData(form);
        console.log('Datos de planilla a enviar:', Object.fromEntries(formData));
        
        // Opcional: limpiar formulario después de carga exitosa
        // form.reset();
        // initializePlanillaForm(); // Reinicializar totales
    }, 2000);
}

function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        // Mostrar mensaje de despedida
        showMessage('Cerrando sesión...', 'info');
        
        // Redirigir después de un breve delay
        setTimeout(() => {
            window.location.href = 'inicio.html';
        }, 1500);
    }
}

function handleKeyPress(event, action) {
    // Permitir activación con Enter o Espacio
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        
        switch(action) {
            case 'upload':
                uploadPlanilla();
                break;
            case 'back':
                history.back();
                break;
            default:
                console.log('Acción no reconocida:', action);
        }
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