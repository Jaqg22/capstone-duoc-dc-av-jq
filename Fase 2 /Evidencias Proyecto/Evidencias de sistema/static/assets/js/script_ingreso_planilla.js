// RindeBus - Script de Ingreso de Planilla Manual
document.addEventListener('DOMContentLoaded', function() {
    initializePlanillaForm();
    loadExtractedData(); // Cargar datos extraídos si existen
});

function goBack() {
    // Regresar al menú principal
    globalThis.location.href = 'main.html';
}

function logout() {
    // Mostrar confirmación antes de cerrar sesión
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        // Redirigir al login
        globalThis.location.href = 'inicio.html';
    }
}

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
    
    // Mostrar indicador de carga
    showMessage('💾 Guardando planilla en PostgreSQL...', 'info');
    
    // Crear FormData con todos los datos del formulario
    const formData = new FormData(form);
    
    // Enviar a nuestro endpoint de PostgreSQL
    fetch('/api/save_planilla/', {
        method: 'POST',
        body: formData
    })
    .then(async response => {
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('✅ Planilla guardada exitosamente:', result);
            showMessage('✅ Planilla guardada exitosamente en la base de datos', 'success');
            
            // Mostrar información adicional
            setTimeout(() => {
                showMessage(`💰 Total producción: $${result.total_produccion.toLocaleString('es-CL')}`, 'info');
            }, 1500);
            
            // Redirigir al menú principal después de 3 segundos
            setTimeout(() => {
                window.location.href = '/main/';
            }, 3000);
        } else {
            throw new Error(result.error || `HTTP ${response.status}`);
        }
    })
    .catch(error => {
        console.error('❌ Error guardando planilla:', error);
        showMessage('❌ Error al guardar la planilla: ' + error.message, 'error');
    });
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

function loadExtractedData() {
    // Cargar datos extraídos desde localStorage y pre-llenar el formulario
    try {
        // Obtener datos del localStorage
        const datosExtraidosStr = localStorage.getItem('planilla_datos_extraidos');
        const planillaId = localStorage.getItem('planilla_id');
        
        if (!datosExtraidosStr) {
            console.log('ℹ️ No hay datos extraídos en localStorage');
            return;
        }
        
        const datosExtraidos = JSON.parse(datosExtraidosStr);
        console.log('📋 Cargando datos extraídos:', datosExtraidos);
        console.log('🔍 Datos extraídos específicos:', datosExtraidos.datos_extraidos);
        
        // Mostrar qué campos están disponibles
        if (datosExtraidos.datos_extraidos) {
            const camposDisponibles = Object.keys(datosExtraidos.datos_extraidos);
            console.log('📊 Campos disponibles en datos extraídos:', camposDisponibles);
        }
        
        // Mostrar mensaje de que se están cargando datos
        showMessage(`📊 Cargando datos extraídos de planilla ${planillaId}`, 'info');
        
        // Obtener el formulario
        const form = document.getElementById('form-planilla');
        if (!form) {
            console.error('❌ No se encontró el formulario');
            return;
        }
        
        // Mapeo entre campos de la API y campos del formulario
        const fieldMapping = {
            // Datos generales
            'numero_planilla': 'nro_planilla',
            'numero_bus': 'nro_bus', 
            'fecha': 'fecha',
            'codigo_conductor': 'cod_conductor',
            'codigo_asistente': 'cod_asistente',
            
            // Horarios (AGREGADOS)
            'horario_origen': 'h_origen',
            'horario_retorno': 'h_retorno',
            
            // Tarifas
            'tarifa_1': 'tarifa_1',
            'tarifa_2': 'tarifa_2', 
            'tarifa_3': 'tarifa_3',
            'tarifa_4': 'tarifa_4',
            'tarifa_5': 'tarifa_5',
            'tarifa_6': 'tarifa_6',
            
            // Boletos iniciales
            'b_inicial_1': 'boleto_inicial_1',
            'b_inicial_2': 'boleto_inicial_2',
            'b_inicial_3': 'boleto_inicial_3', 
            'b_inicial_4': 'boleto_inicial_4',
            'b_inicial_5': 'boleto_inicial_5',
            'b_inicial_6': 'boleto_inicial_6',
            
            // Boletos finales (CORREGIDOS)
            'b_final_1': 'ticket_1',
            'b_final_2': 'ticket_2',
            'b_final_3': 'ticket_3',
            'b_final_4': 'ticket_4', 
            'b_final_5': 'ticket_5',
            'b_final_6': 'ticket_6',
            
            // Ingresos
            'total_ingreso_ruta': 'ing_total_ruta',
            'total_ingreso_oficina': 'ing_total_oficina', 
            'total_ingresos': 'total_ingresos',
            
            // Egresos
            'losa': 'losa',
            'pension': 'pension',
            'cena': 'cena',
            'viaticos': 'viaticos',
            'otros': 'otros',
            'total_egresos': 'total_egresos'
        };
        
        let camposLlenados = 0;
        
        // Llenar campos del formulario con datos extraídos
        for (const [apiField, formField] of Object.entries(fieldMapping)) {
            let value = datosExtraidos.datos_extraidos?.[apiField];
            if (value !== null && value !== undefined && value !== '') {
                
                // Formato especial para campos de hora
                if (formField === 'h_origen' || formField === 'h_retorno') {
                    // Convertir formato de hora si es necesario
                    value = formatTimeForInput(value);
                }
                
                const input = form.querySelector(`[name="${formField}"]`);
                if (input) {
                    input.value = value;
                    input.style.backgroundColor = '#e8f5e8'; // Verde claro para indicar dato extraído
                    camposLlenados++;
                    console.log(`✅ Campo ${formField} llenado con: ${value}`);
                } else {
                    console.warn(`⚠️ Campo ${formField} no encontrado en formulario`);
                }
            }
        }
        
        // Actualizar totales después de llenar campos
        updateTotals();
        
        if (camposLlenados > 0) {
            showMessage(`✅ ${camposLlenados} campos llenados automáticamente`, 'success');
        } else {
            showMessage('ℹ️ No se encontraron datos para llenar', 'info');
        }
        
        // Limpiar localStorage después de usar los datos
        localStorage.removeItem('planilla_datos_extraidos');
        localStorage.removeItem('planilla_id');
        
    } catch (error) {
        console.error('❌ Error cargando datos extraídos:', error);
        showMessage('❌ Error cargando datos extraídos', 'error');
        
        // Limpiar localStorage en caso de error
        localStorage.removeItem('planilla_datos_extraidos');
        localStorage.removeItem('planilla_id');
    }
}

function formatTimeForInput(timeValue) {
    /**
     * Convierte diferentes formatos de hora al formato HH:MM requerido por input[type="time"]
     */
    if (!timeValue) return '';
    
    try {
        // Si ya está en formato HH:MM, devolverlo tal como está
        if (typeof timeValue === 'string' && /^\d{2}:\d{2}$/.test(timeValue)) {
            return timeValue;
        }
        
        // Si es un string con formato "HH:MM:SS", extraer solo HH:MM
        if (typeof timeValue === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(timeValue)) {
            return timeValue.substring(0, 5);
        }
        
        // Si viene como timestamp o fecha completa, extraer la hora
        if (typeof timeValue === 'string' && timeValue.includes('T')) {
            const date = new Date(timeValue);
            return date.toTimeString().substring(0, 5);
        }
        
        // Si es solo hora sin formato específico (ej: "1430" -> "14:30")
        if (typeof timeValue === 'string' && /^\d{4}$/.test(timeValue)) {
            const hours = timeValue.substring(0, 2);
            const minutes = timeValue.substring(2, 4);
            return `${hours}:${minutes}`;
        }
        
        // Si es número (ej: 1430 -> "14:30")
        if (typeof timeValue === 'number') {
            const timeStr = timeValue.toString().padStart(4, '0');
            const hours = timeStr.substring(0, 2);
            const minutes = timeStr.substring(2, 4);
            return `${hours}:${minutes}`;
        }
        
        // Fallback: devolver el valor original
        console.warn(`⚠️ Formato de hora no reconocido: ${timeValue}`);
        return timeValue;
        
    } catch (error) {
        console.error('❌ Error formateando hora:', error);
        return timeValue;
    }
}