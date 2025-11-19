// Cache local para empleados, buses y ciudades
let empleadosCache = {
    loaded: false,
    conductores: {},
    asistentes: {}
};

let validacionCache = {
    buses: { loaded: false, data: {} },
    ciudades: { loaded: false, data: {} }
};

// Cargar empleados al cargar la página
async function cargarEmpleados() {
    try {
        const respConductores = await fetch('/api/manual-save/empleados/?cargo=conductor');
        
        if (!respConductores.ok) {
            throw new Error(`Error HTTP: ${respConductores.status}`);
        }
        
        const dataConductores = await respConductores.json();
        
        const respAsistentes = await fetch('/api/manual-save/empleados/?cargo=asistente');
        
        if (!respAsistentes.ok) {
            throw new Error(`Error HTTP: ${respAsistentes.status}`);
        }
        
        const dataAsistentes = await respAsistentes.json();
        
        if (dataConductores.success && dataAsistentes.success) {
            // Poblar cache de conductores
            dataConductores.empleados.forEach(emp => {
                empleadosCache.conductores[emp.id] = emp;
            });
            
            // Poblar cache de asistentes
            dataAsistentes.empleados.forEach(emp => {
                empleadosCache.asistentes[emp.id] = emp;
            });
            
            empleadosCache.loaded = true;
            
            // ⭐ IMPORTANTE: Hacer el cache disponible globalmente para auto-llenado
            globalThis.empleadosCache = empleadosCache;
            
            // Mostrar notificación de éxito
            mostrarNotificacion(`✅ ${dataConductores.empleados.length} conductores y ${dataAsistentes.empleados.length} asistentes cargados`, 'success');
        } else {
            throw new Error('Los APIs no devolvieron success: true');
        }
    } catch (error) {
        mostrarNotificacion('Error cargando empleados: ' + error.message, 'error');
    }
}

// Buscar empleado por código
function buscarEmpleado(codigo, tipo) {
    if (!empleadosCache.loaded) {
        return null;
    }
    
    const cache = tipo === 'conductor' ? empleadosCache.conductores : empleadosCache.asistentes;
    const empleado = cache[String(codigo)] || cache[Number(codigo)];
    
    return empleado;
}

// Cargar buses y ciudades al inicio
async function cargarValidaciones() {
    try {
        // Cargar buses
        const respBuses = await fetch('/api/manual-save/buses/');
        
        if (respBuses.ok) {
            const dataBuses = await respBuses.json();
            
            if (dataBuses.success) {
                dataBuses.buses.forEach(bus => {
                    validacionCache.buses.data[bus.id] = bus;
                });
                validacionCache.buses.loaded = true;
            }
        }

        // Cargar ciudades
        const respCiudades = await fetch('/api/manual-save/ciudades/');
        
        if (respCiudades.ok) {
            const dataCiudades = await respCiudades.json();
            
            if (dataCiudades.success) {
                dataCiudades.ciudades.forEach(ciudad => {
                    // Guardar por código (en mayúsculas para búsqueda consistente)
                    validacionCache.ciudades.data[ciudad.codigo.toUpperCase()] = ciudad;
                    // Guardar por nombre (en minúsculas para búsqueda)
                    validacionCache.ciudades.data[ciudad.nombre.toLowerCase()] = ciudad;
                    // También guardar variaciones comunes
                    if (ciudad.codigo.toLowerCase() !== ciudad.nombre.toLowerCase()) {
                        validacionCache.ciudades.data[ciudad.codigo.toLowerCase()] = ciudad;
                    }
                });
                validacionCache.ciudades.loaded = true;
            }
        }

    } catch (error) {
        mostrarNotificacion('Error cargando datos de validación: ' + error.message, 'error', 5000);
    }
}

// Validar bus por ID
function validarBus(busId) {
    if (!validacionCache.buses.loaded) {
        return { valido: false, mensaje: 'Cargando datos de buses...' };
    }
    
    const bus = validacionCache.buses.data[String(busId)] || validacionCache.buses.data[Number(busId)];
    
    if (bus) {
        const modeloInfo = bus.modelo ? ` ${bus.modelo}` : '';
        const añoInfo = bus.año ? ` ${bus.año}` : '';
        return { 
            valido: true, 
            bus: bus, 
            mensaje: `Bus ${bus.id} - ${bus.patente}${modeloInfo}${añoInfo}`
        };
    } else {
        return { 
            valido: false, 
            mensaje: `Bus ${busId} no encontrado o inactivo`
        };
    }
}

// Validar ciudad por código o nombre
function validarCiudad(valor) {
    console.log('DEBUG validarCiudad:', {
        valor: valor,
        tipo: typeof valor,
        cacheLoaded: validacionCache.ciudades.loaded,
        cacheKeys: Object.keys(validacionCache.ciudades.data)
    });
    
    if (!validacionCache.ciudades.loaded) {
        return { valido: false, mensaje: 'Cargando datos de ciudades...' };
    }
    
    // Buscar por código primero (exacto)
    const valorBusqueda = valor.toString().trim();
    let ciudad = validacionCache.ciudades.data[valorBusqueda.toUpperCase()];
    
    console.log('DEBUG búsqueda por código:', {
        valorBusqueda: valorBusqueda,
        valorMayuscula: valorBusqueda.toUpperCase(),
        encontrado: !!ciudad
    });
    
    // Si no se encuentra por código, buscar por nombre (case insensitive)
    if (!ciudad) {
        ciudad = validacionCache.ciudades.data[valorBusqueda.toLowerCase()];
        console.log('DEBUG búsqueda por nombre:', {
            valorMinuscula: valorBusqueda.toLowerCase(),
            encontrado: !!ciudad
        });
    }
    
    // Búsqueda parcial SOLO si tiene al menos 3 caracteres Y no se encontró exacto
    if (!ciudad && valorBusqueda.length >= 3) {
        const ciudades = Object.values(validacionCache.ciudades.data);
        ciudad = ciudades.find(c => 
            c.nombre && (
                c.nombre.toLowerCase().includes(valorBusqueda.toLowerCase()) ||
                c.codigo.toLowerCase() === valorBusqueda.toLowerCase()
            )
        );
        console.log('DEBUG búsqueda parcial:', {
            valorBusqueda: valorBusqueda,
            longitudMinima: valorBusqueda.length >= 3,
            totalCiudades: ciudades.length,
            encontrado: !!ciudad
        });
    } else if (valorBusqueda.length < 3 && valorBusqueda.length > 0) {
        console.log('DEBUG búsqueda parcial omitida: valor muy corto (<3 chars)');
    }
    
    // 🔍 NUEVA LÓGICA: Si no se encontró nada Y tiene contenido, es inválido
    const resultado = ciudad && ciudad.codigo ? {
        valido: true, 
        ciudad: ciudad, 
        mensaje: `${ciudad.nombre} (${ciudad.codigo}) - ${ciudad.region}`
    } : {
        valido: false, 
        mensaje: valorBusqueda.length === 0 ? 'Campo vacío' : `Ciudad "${valor}" no encontrada`
    };
    
    console.log('DEBUG resultado final:', resultado);
    return resultado;
}

// Aplicar estilos de validación a un input
function aplicarEstiloValidacion(input, esValido, mensaje = '') {
    if (esValido) {
        input.style.backgroundColor = '#e8f5e8';
        input.style.borderColor = '#27ae60';
        input.style.color = '#27ae60';
        if (mensaje) {
            input.title = `✅ ${mensaje}`;
        }
    } else {
        input.style.backgroundColor = '#ffe8e8';
        input.style.borderColor = '#e74c3c';
        input.style.color = '#e74c3c';
        if (mensaje) {
            input.title = `❌ ${mensaje}`;
        }
    }
}

// Limpiar estilos de validación
function limpiarEstiloValidacion(input) {
    input.style.backgroundColor = '';
    input.style.borderColor = '';
    input.style.color = '';
    input.title = '';
}

// Formatear número como moneda chilena
function formatearMoneda(valor) {
    const numero = parseFloat(valor) || 0;
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numero);
}

// Calcular total de ingresos
function calcularTotalIngresos() {
    const ingresoRuta = parseFloat(document.querySelector('input[name="ing_total_ruta"]').value) || 0;
    const ingresoOficina = parseFloat(document.querySelector('input[name="ing_total_oficina"]').value) || 0;
    const total = ingresoRuta + ingresoOficina;
    
    // Actualizar campos de total ingresos
    const totalIngresosInput = document.querySelector('input[name="total_ingresos"]');
    const totalIngresosRawInput = document.querySelector('input[name="total_ingresos_raw"]');
    
    if (totalIngresosInput) {
        totalIngresosInput.value = formatearMoneda(total);
    }
    if (totalIngresosRawInput) {
        totalIngresosRawInput.value = total;
    }
    
    return total;
}

// Calcular total de egresos
function calcularTotalEgresos() {
    const viaticos = parseFloat(document.querySelector('input[name="viaticos"]').value) || 0;
    const losa = parseFloat(document.querySelector('input[name="losa"]').value) || 0;
    const pension = parseFloat(document.querySelector('input[name="pension"]').value) || 0;
    const cena = parseFloat(document.querySelector('input[name="cena"]').value) || 0;
    const otros = parseFloat(document.querySelector('input[name="otros"]').value) || 0;
    const total = viaticos + losa + pension + cena + otros;
    
    // Actualizar campos de total egresos
    const totalEgresosInput = document.querySelector('input[name="total_egresos"]');
    const totalEgresosRawInput = document.querySelector('input[name="total_egresos_raw"]');
    
    if (totalEgresosInput) {
        totalEgresosInput.value = formatearMoneda(total);
    }
    if (totalEgresosRawInput) {
        totalEgresosRawInput.value = total;
    }
    
    return total;
}

// Configurar calculadoras automáticas
function configurarCalculadoras() {
    // Campos de ingresos
    const camposIngresos = ['ing_total_ruta', 'ing_total_oficina'];
    camposIngresos.forEach(nombreCampo => {
        const campo = document.querySelector(`input[name="${nombreCampo}"]`);
        if (campo) {
            campo.addEventListener('input', function() {
                calcularTotalIngresos();
            });
            campo.addEventListener('blur', function() {
                calcularTotalIngresos();
            });
        }
    });
    
    // Campos de egresos
    const camposEgresos = ['viaticos', 'losa', 'pension', 'cena', 'otros'];
    camposEgresos.forEach(nombreCampo => {
        const campo = document.querySelector(`input[name="${nombreCampo}"]`);
        if (campo) {
            campo.addEventListener('input', function() {
                calcularTotalEgresos();
            });
            campo.addEventListener('blur', function() {
                calcularTotalEgresos();
            });
        }
    });
    
    // Calcular totales iniciales
    calcularTotalIngresos();
    calcularTotalEgresos();
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo) {
    // ⭐ TRIGGER PARA AUTO-LLENADO: Verificar si es mensaje de empleados cargados
    if (tipo === 'success' && 
        mensaje.includes('conductores y') && 
        mensaje.includes('asistentes cargados')) {
        
        // Verificar si la función está disponible
        if (typeof globalThis.ejecutarAutoLlenado === 'function') {
            // Ejecutar auto-llenado si hay datos disponibles
            setTimeout(() => {
                const datosExtraidos = localStorage.getItem('datosExtraidos');
                if (datosExtraidos) {
                    globalThis.ejecutarAutoLlenado(
                        datosExtraidos,
                        localStorage.getItem('imagenNombre'),
                        localStorage.getItem('planillaId')
                    );
                }
            }, 300);
        }
    }
    
    // Crear elemento de notificación
    const notif = document.createElement('div');
    notif.style.position = 'fixed';
    notif.style.top = '20px';
    notif.style.right = '20px';
    notif.style.padding = '12px 20px';
    notif.style.borderRadius = '6px';
    notif.style.color = 'white';
    notif.style.fontWeight = 'bold';
    notif.style.zIndex = '9999';
    notif.style.maxWidth = '300px';
    notif.textContent = mensaje;
    
    if (tipo === 'success') {
        notif.style.backgroundColor = '#28a745';
    } else if (tipo === 'error') {
        notif.style.backgroundColor = '#dc3545';
    } else {
        notif.style.backgroundColor = '#17a2b8';
    }
    
    document.body.appendChild(notif);
    
    // Eliminar después de 4 segundos
    setTimeout(() => {
        if (notif.parentNode) {
            notif.parentNode.removeChild(notif);
        }
    }, 4000);
}

// Configurar event listeners cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // ⭐ IMPORTANTE: Hacer mostrarNotificacion disponible globalmente
    globalThis.mostrarNotificacion = mostrarNotificacion;
    
    // Cargar todos los datos necesarios
    cargarEmpleados();
    cargarValidaciones();
    
    // Configurar calculadoras automáticas
    configurarCalculadoras();
    
    // Configurar búsqueda para conductor
    const codConductorInput = document.querySelector('input[name="cod_conductor"]');
    const conductorInput = document.querySelector('input[name="conductor"]');
    
    if (codConductorInput && conductorInput) {
        codConductorInput.addEventListener('input', function() {
            const codigo = this.value.trim();
            if (codigo.length >= 1) {
                const empleado = buscarEmpleado(codigo, 'conductor');
                if (empleado) {
                    conductorInput.value = empleado.nombre_completo;
                    aplicarEstiloValidacion(conductorInput, true, empleado.nombre_completo);
                } else {
                    conductorInput.value = '';
                    conductorInput.placeholder = 'Conductor no encontrado';
                    aplicarEstiloValidacion(conductorInput, false, 'Conductor no encontrado');
                }
            } else {
                conductorInput.value = '';
                conductorInput.placeholder = 'Se llenará automáticamente';
                limpiarEstiloValidacion(conductorInput);
            }
        });
    }
    
    // Configurar búsqueda para asistente
    const codAsistenteInput = document.querySelector('input[name="cod_asistente"]');
    const asistenteInput = document.querySelector('input[name="asistente"]');
    
    if (codAsistenteInput && asistenteInput) {
        codAsistenteInput.addEventListener('input', function() {
            const codigo = this.value.trim();
            if (codigo.length >= 2) {
                const empleado = buscarEmpleado(codigo, 'asistente');
                if (empleado) {
                    asistenteInput.value = empleado.nombre_completo;
                    aplicarEstiloValidacion(asistenteInput, true, empleado.nombre_completo);
                } else {
                    asistenteInput.value = '';
                    asistenteInput.placeholder = 'Asistente no encontrado';
                    aplicarEstiloValidacion(asistenteInput, false, 'Asistente no encontrado');
                }
            } else if (codigo.length === 0) {
                asistenteInput.value = '';
                asistenteInput.placeholder = 'Se llenará automáticamente';
                limpiarEstiloValidacion(asistenteInput);
            }
        });
    }
    
    // Configurar validación de bus
    const nroBusInput = document.querySelector('input[name="nro_bus"]');
    if (nroBusInput) {
        nroBusInput.addEventListener('blur', function() {
            const busId = this.value.trim();
            console.log('DEBUG blur bus:', busId);
            if (busId && busId.length >= 1) {
                const validacion = validarBus(busId);
                if (validacion.valido) {
                    aplicarEstiloValidacion(this, true, validacion.mensaje);
                } else {
                    aplicarEstiloValidacion(this, false, validacion.mensaje);
                    // SIEMPRE mostrar error para debug
                    mostrarNotificacion(`❌ ${validacion.mensaje}`, 'error', 5000);
                }
            } else {
                limpiarEstiloValidacion(this);
            }
        });
        
        nroBusInput.addEventListener('input', function() {
            const busId = this.value.trim();
            if (busId && busId.length >= 1) {
                const validacion = validarBus(busId);
                aplicarEstiloValidacion(this, validacion.valido, validacion.mensaje);
            } else {
                limpiarEstiloValidacion(this);
            }
        });
    }
    
    // Configurar validación de origen (OBLIGATORIO)
    const origenInput = document.querySelector('input[name="origen"]');
    if (origenInput) {
        origenInput.addEventListener('blur', function() {
            const valor = this.value.trim();
            console.log('DEBUG blur origen (obligatorio):', valor);
            if (valor.length > 0) {
                // Si hay contenido, SIEMPRE validar
                const validacion = validarCiudad(valor);
                if (validacion.valido) {
                    aplicarEstiloValidacion(this, true, validacion.mensaje);
                } else {
                    aplicarEstiloValidacion(this, false, validacion.mensaje);
                    mostrarNotificacion(`❌ Origen: ${validacion.mensaje}`, 'error', 5000);
                }
            } else {
                // Campo vacío es inválido (obligatorio)
                aplicarEstiloValidacion(this, false, 'Campo origen es obligatorio');
                mostrarNotificacion('❌ Campo origen es obligatorio', 'error', 5000);
            }
        });
        
        origenInput.addEventListener('input', function() {
            const valor = this.value.trim();
            if (valor.length > 0) {
                // Si hay contenido, validar inmediatamente
                const validacion = validarCiudad(valor);
                aplicarEstiloValidacion(this, validacion.valido, validacion.mensaje);
            } else {
                // Campo vacío: marcar como obligatorio
                aplicarEstiloValidacion(this, false, 'Campo requerido');
            }
        });
    }
    
    // Configurar validación de retorno (OPCIONAL)
    const retornoInput = document.querySelector('input[name="retorno"]');
    if (retornoInput) {
        retornoInput.addEventListener('blur', function() {
            const valor = this.value.trim();
            console.log('DEBUG blur retorno (opcional):', valor);
            if (valor.length > 0) {
                // Si hay contenido, SIEMPRE validar (sin importar longitud)
                const validacion = validarCiudad(valor);
                if (validacion.valido) {
                    aplicarEstiloValidacion(this, true, validacion.mensaje);
                } else {
                    aplicarEstiloValidacion(this, false, validacion.mensaje);
                    mostrarNotificacion(`❌ Retorno: ${validacion.mensaje}`, 'error', 5000);
                }
            } else {
                // Campo vacío es válido (opcional)
                limpiarEstiloValidacion(this);
            }
        });
        
        retornoInput.addEventListener('input', function() {
            const valor = this.value.trim();
            if (valor.length > 0) {
                // Si hay contenido, validar inmediatamente
                const validacion = validarCiudad(valor);
                aplicarEstiloValidacion(this, validacion.valido, validacion.mensaje);
            } else {
                // Limpiar validación si está vacío
                limpiarEstiloValidacion(this);
            }
        });
    }
    
    // Función global de debug
    window.debugValidaciones = function() {
        console.log('🔍 DEBUG VALIDACIONES:');
        console.log('Empleados cache cargado:', empleadosCache.loaded);
        console.log('Buses cache cargado:', validacionCache.buses.loaded);
        console.log('Ciudades cache cargado:', validacionCache.ciudades.loaded);
        console.log('Total conductores:', Object.keys(empleadosCache.conductores).length);
        console.log('Total asistentes:', Object.keys(empleadosCache.asistentes).length);
        console.log('Total buses:', Object.keys(validacionCache.buses.data).length);
        console.log('Total ciudades:', Object.keys(validacionCache.ciudades.data).length);
        return { empleadosCache, validacionCache };
    };
    
});

// Función de test para verificar endpoint
async function testEndpoint() {
    try {        
        // Datos mínimos para test
        const datosTest = {
            id_planilla: 99999,  // Número único para test
            fecha: '2025-11-16',
            horario_origen: '08:00',
            bus_id: 710,
            cod_conductor: 4,
            cod_origen: 'STG'
        };
        
        const response = await fetch('/api/manual-save/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': obtenerCSRFToken(),
                'Accept': 'application/json'
            },
            body: JSON.stringify(datosTest)
        });
        
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        
        if (response.ok) {
            mostrarNotificacion(`✅ Test exitoso: Endpoint funciona correctamente`, 'success', 5000);
        } else {
            mostrarNotificacion(`⚠️ Test completado: ${response.status} ${response.statusText}`, 'info', 5000);
        }
        
    } catch (error) {
        mostrarNotificacion(`❌ Test falló: ${error.message}`, 'error', 5000);
    }
}

// Función para llenar formulario con datos de test válidos
function llenarFormularioTest() {
    // Datos conocidos válidos
    const datosTest = {
        nro_planilla: Math.floor(Math.random() * 10000) + 1, // Número aleatorio
        origen: 'STG',
        retorno: 'CON', 
        cod_conductor: '4',
        cod_asistente: '89',
        fecha: '2025-11-16',
        nro_bus: '710',
        h_origen: '08:00',
        h_retorno: '18:00',
        ing_total_ruta: '50000',
        ing_total_oficina: '25000',
        viaticos: '5000',
        losa: '3000',
        pension: '8000',
        cena: '2000',
        otros: '1000'
    };
    
    // Llenar cada campo
    for (const [campo, valor] of Object.entries(datosTest)) {
        const input = document.querySelector(`input[name="${campo}"]`);
        if (input) {
            input.value = valor;
            // Disparar eventos para validaciones
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
    
    // Calcular totales
    setTimeout(() => {
        calcularTotalIngresos();
        calcularTotalEgresos();
    }, 100);
    
    mostrarNotificacion('🔧 Formulario llenado con datos de test', 'info', 3000);
}

// Agregar funciones al objeto global para poder llamarlas desde consola
globalThis.testEndpoint = testEndpoint;
globalThis.llenarFormularioTest = llenarFormularioTest;

// Función para enviar planilla con validación completa
async function enviarPlanilla() {
    try {
        // Mostrar indicador de carga
        mostrarNotificacion('📤 Enviando planilla...', 'info', 30000);
        
        // Obtener todos los datos del formulario
        const datosFormulario = obtenerDatosFormulario();
        
        // Validar datos antes del envío
        const resultadoValidacion = await validarFormularioCompleto(datosFormulario);
        if (!resultadoValidacion.valido) {
            mostrarNotificacion(`❌ Error de validación: ${resultadoValidacion.errores.join(', ')}`, 'error', 10000);
            return;
        }
        
        // Preparar datos para el API
        const datosPlanilla = prepararDatosParaAPI(datosFormulario);
        
        // Enviar al servidor
        const response = await fetch('/api/manual-save/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': obtenerCSRFToken(),
                'Accept': 'application/json'
            },
            body: JSON.stringify(datosPlanilla)
        });
        
        // Verificar si la respuesta contiene JSON válido
        const contentType = response.headers.get('content-type');
        let resultado;
        
        if (contentType && contentType.includes('application/json')) {
            resultado = await response.json();
        } else {
            // Si no es JSON, obtener el texto para debug
            const textoRespuesta = await response.text();
            throw new Error(`Respuesta del servidor no es JSON válido. Status: ${response.status}, Contenido: ${textoRespuesta.substring(0, 200)}...`);
        }
        
        // Manejar respuesta
        if (response.ok && resultado.success) {
            mostrarNotificacion(`✅ Planilla ${resultado.planilla.id_planilla} creada exitosamente`, 'success', 5000);
            
            // Preguntar si desea crear otra planilla
            setTimeout(() => {
                if (confirm('Planilla creada exitosamente. ¿Desea crear otra planilla?')) {
                    limpiarFormularioCompleto();
                } else {
                    globalThis.location.href = '/';
                }
            }, 2000);
            
        } else {
            // Manejo de errores específicos
            const mensajeError = resultado.error || resultado.message || 'Error desconocido del servidor';
            mostrarNotificacion(`❌ Error: ${mensajeError}`, 'error', 10000);
        }
        
    } catch (error) {
        let mensajeError;
        
        // Categorizar el tipo de error para dar mejor feedback
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            mensajeError = 'Error de conexión con el servidor. Verifique su conexión a internet.';
        } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
            mensajeError = 'Error en la respuesta del servidor (JSON inválido).';
        } else if (error.message.includes('CSRF')) {
            mensajeError = 'Error de seguridad (CSRF). Recargue la página e intente nuevamente.';
        } else {
            mensajeError = `Error de conexión: ${error.message}`;
        }
        
        mostrarNotificacion(`❌ ${mensajeError}`, 'error', 10000);
    }
}

// Obtener todos los datos del formulario
function obtenerDatosFormulario() {
    const form = document.getElementById('form-planilla');
    const formData = new FormData(form);
    const datos = {};
    
    // Obtener todos los campos
    for (let [clave, valor] of formData.entries()) {
        datos[clave] = valor || '';
    }
    
    // Agregar valores calculados
    datos.total_ingresos_raw = document.querySelector('input[name="total_ingresos_raw"]')?.value || '0';
    datos.total_egresos_raw = document.querySelector('input[name="total_egresos_raw"]')?.value || '0';
    
    return datos;
}

// Validar formulario completo antes del envío
async function validarFormularioCompleto(datos) {
    const errores = [];
    
    // 1. Campos requeridos básicos
    const camposRequeridos = {
        'nro_planilla': 'Número de planilla',
        'origen': 'Ciudad de origen',
        'cod_conductor': 'Código de conductor',
        'fecha': 'Fecha',
        'nro_bus': 'Número de bus',
        'h_origen': 'Horario de origen'
        // Nota: retorno y h_retorno son OPCIONALES
    };
    
    for (const [campo, nombre] of Object.entries(camposRequeridos)) {
        if (!datos[campo] || datos[campo].trim() === '') {
            errores.push(`${nombre} es requerido`);
        }
    }
    
    // 2. Validar empleados si el cache está cargado
    if (empleadosCache.loaded) {
        // Validar conductor
        if (datos.cod_conductor) {
            const conductor = empleadosCache.conductores[datos.cod_conductor];
            if (!conductor) {
                errores.push(`Conductor con código ${datos.cod_conductor} no existe`);
            }
        }
        
        // Validar asistente (opcional)
        if (datos.cod_asistente && datos.cod_asistente.trim() !== '') {
            const asistente = empleadosCache.asistentes[datos.cod_asistente];
            if (!asistente) {
                errores.push(`Asistente con código ${datos.cod_asistente} no existe`);
            }
            
            // Validar que conductor y asistente sean diferentes
            if (datos.cod_conductor === datos.cod_asistente) {
                errores.push('El conductor y asistente no pueden ser la misma persona');
            }
        }
    }
    
    // 3. Validar bus si el cache está cargado
    if (validacionCache.buses.loaded && datos.nro_bus) {
        const bus = validacionCache.buses.data[datos.nro_bus];
        if (!bus) {
            errores.push(`Bus ${datos.nro_bus} no existe o está inactivo`);
        }
    }
    
    // 4. Validar ciudades si el cache está cargado
    if (validacionCache.ciudades.loaded) {
        // Validar origen
        if (datos.origen) {
            const origen = validacionCache.ciudades.data[datos.origen] || 
                          validacionCache.ciudades.data[datos.origen.toLowerCase()];
            if (!origen) {
                errores.push(`Ciudad de origen "${datos.origen}" no existe`);
            }
        }
        
        // Validar retorno (OPCIONAL)
        if (datos.retorno && datos.retorno.trim() !== '') {
            const retorno = validacionCache.ciudades.data[datos.retorno] || 
                           validacionCache.ciudades.data[datos.retorno.toLowerCase()];
            if (!retorno) {
                errores.push(`Ciudad de retorno "${datos.retorno}" no existe`);
            }
        }
        // Nota: retorno es opcional, no se valida si está vacío
    }
    
    // 5. Validar fecha
    if (datos.fecha) {
        const fechaPlanilla = new Date(datos.fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fechaPlanilla > hoy) {
            errores.push('La fecha no puede ser futura');
        }
    }
    
    // 6. Validar horarios (retorno es opcional)
    if (datos.h_origen && datos.h_retorno) {
        if (datos.h_origen >= datos.h_retorno) {
            errores.push('El horario de retorno debe ser posterior al horario de origen');
        }
    }
    // Nota: h_retorno es opcional, no se valida si está vacío
    
    // 7. Validar montos (valores numéricos válidos)
    const camposMonetarios = ['ing_total_ruta', 'ing_total_oficina', 'viaticos', 'losa', 'pension', 'cena', 'otros'];
    for (const campo of camposMonetarios) {
        const valor = datos[campo];
        if (valor && valor !== '' && (isNaN(valor) || Number.parseFloat(valor) < 0)) {
            errores.push(`${campo.replace('_', ' ')} debe ser un número válido mayor o igual a 0`);
        }
    }
    
    // 8. Validar número de planilla único (esto lo validará el backend)
    if (datos.nro_planilla) {
        const numero = Number.parseInt(datos.nro_planilla);
        if (isNaN(numero) || numero <= 0 || numero > 99999) {
            errores.push('El número de planilla debe estar entre 1 y 99999');
        }
    }
    
    return {
        valido: errores.length === 0,
        errores: errores
    };
}

// Preparar datos para enviar al API
function prepararDatosParaAPI(datos) {
    const datosPlanilla = {
        id_planilla: Number.parseInt(datos.nro_planilla),
        fecha: datos.fecha,
        horario_origen: datos.h_origen,
        horario_retorno: datos.h_retorno || null,
        ingreso_ruta: Number.parseFloat(datos.ing_total_ruta || 0),
        ingreso_oficina: Number.parseFloat(datos.ing_total_oficina || 0),
        viaticos: Number.parseFloat(datos.viaticos || 0),
        losa: Number.parseFloat(datos.losa || 0),
        pension: Number.parseFloat(datos.pension || 0),
        cena: Number.parseFloat(datos.cena || 0),
        otros_gastos: Number.parseFloat(datos.otros || 0),
        bus_id: Number.parseInt(datos.nro_bus),
        cod_conductor: Number.parseInt(datos.cod_conductor),
        cod_asistente: datos.cod_asistente && datos.cod_asistente.trim() !== '' ? Number.parseInt(datos.cod_asistente) : null,
        cod_origen: obtenerCodigoCiudad(datos.origen),
        cod_retorno: obtenerCodigoCiudad(datos.retorno)
    };
    
    // Validar que todos los campos requeridos están presentes y son válidos
    const problemasConversion = [];
    
    if (isNaN(datosPlanilla.id_planilla)) problemasConversion.push('id_planilla no es un número válido');
    if (!datosPlanilla.fecha) problemasConversion.push('fecha es requerida');
    if (!datosPlanilla.horario_origen) problemasConversion.push('horario_origen es requerido');
    if (isNaN(datosPlanilla.bus_id)) problemasConversion.push('bus_id no es un número válido');
    if (isNaN(datosPlanilla.cod_conductor)) problemasConversion.push('cod_conductor no es un número válido');
    if (!datosPlanilla.cod_origen) problemasConversion.push('cod_origen es requerido');
    
    if (problemasConversion.length > 0) {
        throw new Error(`Errores de conversión: ${problemasConversion.join(', ')}`);
    }
    
    return datosPlanilla;
}

// Obtener código de ciudad (puede ser código directo o nombre)
function obtenerCodigoCiudad(valorCiudad) {
    if (!valorCiudad) {
        return null;
    }
    
    if (!validacionCache.ciudades.loaded) {
        return valorCiudad;
    }
    
    // Si es un código directo, devolverlo
    const ciudad = validacionCache.ciudades.data[valorCiudad];
    if (ciudad && ciudad.codigo) {
        return ciudad.codigo;
    }
    
    // Si es un nombre, buscar por nombre
    const ciudadPorNombre = validacionCache.ciudades.data[valorCiudad.toLowerCase()];
    if (ciudadPorNombre && ciudadPorNombre.codigo) {
        return ciudadPorNombre.codigo;
    }
    
    // Si no se encuentra, asumir que es el código directo
    return valorCiudad;
}

// Limpiar formulario completo
function limpiarFormularioCompleto() {
    const form = document.getElementById('form-planilla');
    form.reset();
    
    // Limpiar estilos de validación
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        limpiarEstiloValidacion(input);
        if (input.hasAttribute('data-original-placeholder')) {
            input.placeholder = input.getAttribute('data-original-placeholder');
        }
    });
    
    // Reiniciar totales
    calcularTotalIngresos();
    calcularTotalEgresos();
}

// Obtener token CSRF
function obtenerCSRFToken() {
    // Intentar obtener del elemento csrf_token en el DOM
    const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
    if (csrfInput) {
        return csrfInput.value;
    }
    
    // Fallback: obtener de las cookies
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return decodeURIComponent(value);
        }
    }
    return '';
}