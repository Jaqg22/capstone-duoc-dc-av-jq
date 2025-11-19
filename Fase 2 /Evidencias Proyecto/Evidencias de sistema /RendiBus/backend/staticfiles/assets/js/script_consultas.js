/**
 * Consultas Dashboard JavaScript - v1.0
 * Sistema completo de dashboard con gráficos, filtros y exportación
 */

// Variables globales
let datosOriginales = [];
let datosFiltrados = [];
let graficos = {};

// Variables de paginación
let paginaActual = 1;
let registrosPorPagina = 20;
let totalRegistros = 0;

// Configuración de gráficos
const configGraficos = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                padding: 15,
                font: {
                    family: 'Poppins',
                    size: 12
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(0, 62, 132, 0.9)',
            titleFont: {
                family: 'Poppins',
                size: 13,
                weight: 'bold'
            },
            bodyFont: {
                family: 'Poppins',
                size: 12
            },
            cornerRadius: 8
        }
    },
    scales: {
        x: {
            grid: {
                display: false
            },
            ticks: {
                font: {
                    family: 'Poppins',
                    size: 11
                }
            }
        },
        y: {
            grid: {
                color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
                font: {
                    family: 'Poppins',
                    size: 11
                }
            }
        }
    }
};

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando Dashboard de Consultas');
    inicializarDashboard();
});

async function inicializarDashboard() {
    try {
        showLoading(true);
        
        // Cargar opciones de filtros primero
        await cargarOpcionesFiltros();
        
        // Configurar fechas por defecto
        configurarFechasDefault();
        
        // Inicializar gráficos
        inicializarGraficos();
        
        // Cargar datos iniciales (sin filtros para mostrar datos generales)
        await cargarDatosPlanillas();
        
        // Actualizar dashboard con datos iniciales
        actualizarGraficos();
        actualizarMetricas();
        actualizarTabla();
        
        showLoading(false);
        
        console.log('✅ Dashboard inicializado correctamente');
        
        // Mostrar mensaje informativo sobre los datos cargados
        if (datosOriginales.length > 0) {
            mostrarNotificacion(`Dashboard cargado: ${datosOriginales.length} registros iniciales`, 'success');
        } else {
            mostrarNotificacion('No se encontraron datos para mostrar', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error al inicializar dashboard:', error);
        mostrarNotificacion('Error al cargar el dashboard', 'error');
        showLoading(false);
    }
}

async function cargarDatosPlanillas() {
    try {
        // Obtener parámetros de filtros actuales
        const fechaDesde = document.getElementById('fecha-desde').value;
        const fechaHasta = document.getElementById('fecha-hasta').value;
        const conductor = document.getElementById('conductor-filter').value;
        const bus = document.getElementById('bus-filter').value;
        const ciudad = document.getElementById('ciudad-filter').value;
        
        // Construir URL con parámetros
        const params = new URLSearchParams();
        if (fechaDesde) params.append('fecha_desde', fechaDesde);
        if (fechaHasta) params.append('fecha_hasta', fechaHasta);
        if (conductor) params.append('conductor', conductor);
        if (bus) params.append('bus', bus);
        if (ciudad) params.append('ciudad', ciudad);
        
        const url = `/api/consultas/planillas/?${params.toString()}`;
        console.log(`🔍 Cargando planillas desde: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        datosOriginales = data.planillas || [];
        datosFiltrados = [...datosOriginales];
        
        console.log(`📊 Cargadas ${datosOriginales.length} planillas de ${data.total || 0} totales`);
        console.log('🔧 Filtros aplicados:', data.filters_applied);
        return datosOriginales;
    } catch (error) {
        console.error('Error al cargar planillas:', error);
        datosOriginales = [];
        datosFiltrados = [];
        throw error;
    }
}

async function cargarOpcionesFiltros() {
    try {
        const [conductoresRes, busesRes, ciudadesRes] = await Promise.all([
            fetch('/api/consultas/empleados/'),
            fetch('/api/consultas/buses/'),
            fetch('/api/consultas/ciudades/')
        ]);

        // Cargar conductores
        if (conductoresRes.ok) {
            const conductores = await conductoresRes.json();
            const selectConductor = document.getElementById('conductor-filter');
            selectConductor.innerHTML = '<option value="">Todos los conductores</option>';
            
            conductores.forEach(conductor => {
                const option = document.createElement('option');
                option.value = conductor.empleado_id;
                option.textContent = `${conductor.nombre} ${conductor.apellidos}`;
                selectConductor.appendChild(option);
            });
        }

        // Cargar buses
        if (busesRes.ok) {
            const buses = await busesRes.json();
            const selectBus = document.getElementById('bus-filter');
            selectBus.innerHTML = '<option value="">Todos los buses</option>';
            
            buses.forEach(bus => {
                const option = document.createElement('option');
                option.value = bus.bus_id;
                option.textContent = bus.bus_id; // Solo el número
                selectBus.appendChild(option);
            });
        }

        // Cargar ciudades
        if (ciudadesRes.ok) {
            const ciudades = await ciudadesRes.json();
            const selectCiudad = document.getElementById('ciudad-filter');
            selectCiudad.innerHTML = '<option value="">Todas las ciudades</option>';
            
            ciudades.forEach(ciudad => {
                const option = document.createElement('option');
                option.value = ciudad.ciudad_id;
                option.textContent = ciudad.nombre_ciudad;
                selectCiudad.appendChild(option);
            });
        }

        console.log('✅ Opciones de filtros cargadas');
    } catch (error) {
        console.error('Error al cargar opciones de filtros:', error);
    }
}

function configurarFechasDefault() {
    const hoy = new Date();
    const hace30Dias = new Date(hoy);
    hace30Dias.setDate(hoy.getDate() - 30);

    const fechaDesde = document.getElementById('fecha-desde');
    const fechaHasta = document.getElementById('fecha-hasta');

    if (fechaDesde) fechaDesde.value = hace30Dias.toISOString().split('T')[0];
    if (fechaHasta) fechaHasta.value = hoy.toISOString().split('T')[0];
}

function inicializarGraficos() {
    const ctx1 = document.getElementById('ingresosPeriodoChart');
    const ctx2 = document.getElementById('topConductoresChart');
    const ctx3 = document.getElementById('utilizacionBusesChart');
    const ctx4 = document.getElementById('rutasChart');

    if (!ctx1 || !ctx2 || !ctx3 || !ctx4) {
        console.error('No se encontraron todos los canvas para los gráficos');
        return;
    }

    // Gráfico 1: Ingresos por Período
    graficos.ingresosPeriodo = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Ingresos Totales',
                data: [],
                borderColor: '#003E84',
                backgroundColor: 'rgba(0, 62, 132, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            ...configGraficos,
            scales: {
                ...configGraficos.scales,
                y: {
                    ...configGraficos.scales.y,
                    ticks: {
                        ...configGraficos.scales.y.ticks,
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });

    // Gráfico 2: Top Conductores
    graficos.topConductores = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Ingresos Generados',
                data: [],
                backgroundColor: [
                    '#003E84', '#0056b3', '#007bff', '#20a2d8', '#6ac4f0'
                ],
                borderRadius: 8
            }]
        },
        options: {
            ...configGraficos,
            plugins: {
                ...configGraficos.plugins,
                legend: {
                    display: false
                }
            },
            scales: {
                ...configGraficos.scales,
                y: {
                    ...configGraficos.scales.y,
                    ticks: {
                        ...configGraficos.scales.y.ticks,
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });

    // Gráfico 3: Producción por Bus
    graficos.utilizacionBuses = new Chart(ctx3, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#003E84', '#0056b3', '#007bff', '#20a2d8', '#6ac4f0',
                    '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'
                ],
                borderWidth: 0
            }]
        },
        options: {
            ...configGraficos,
            cutout: '50%',
            plugins: {
                ...configGraficos.plugins,
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            return label + ': ' + value;
                        }
                    }
                }
            }
        }
    });

    // Gráfico 4: Producción por Ruta
    graficos.distribuccionRutas = new Chart(ctx4, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Producción Total',
                data: [],
                backgroundColor: '#28a745',
                borderRadius: 8
            }]
        },
        options: {
            ...configGraficos,
            plugins: {
                ...configGraficos.plugins,
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Producción: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('es-CL');
                        }
                    }
                }
            }
        }
    });

    console.log('📊 Gráficos inicializados');
}

async function aplicarFiltros() {
    showLoading(true);
    
    try {
        // Resetear a la primera página
        paginaActual = 1;
        
        // Recargar datos con filtros desde la API
        await cargarDatosPlanillas();
        
        // Los datos ya vienen filtrados de la API, usar directamente
        // datosFiltrados ya está actualizado en cargarDatosPlanillas
        
        // Actualizar dashboard
        actualizarGraficos();
        actualizarMetricas();
        actualizarTabla();
        
        showLoading(false);
        
        console.log(`🔍 Filtros aplicados: ${datosFiltrados.length} planillas`);
        mostrarNotificacion(`Filtros aplicados: ${datosFiltrados.length} registros encontrados`, 'success');
        
    } catch (error) {
        console.error('Error al aplicar filtros:', error);
        mostrarNotificacion('Error al aplicar filtros', 'error');
        showLoading(false);
    }
}

function limpiarFiltros() {
    document.getElementById('fecha-desde').value = '';
    document.getElementById('fecha-hasta').value = '';
    document.getElementById('conductor-filter').value = '';
    document.getElementById('bus-filter').value = '';
    document.getElementById('ciudad-filter').value = '';
    
    configurarFechasDefault();
    aplicarFiltros();
    
    mostrarNotificacion('Filtros limpiados correctamente', 'success');
}

function actualizarGraficos() {
    // Gráfico 1: Ingresos por Período
    const ingresosPorFecha = procesarIngresosPorPeriodo(datosFiltrados);
    graficos.ingresosPeriodo.data.labels = ingresosPorFecha.fechas;
    graficos.ingresosPeriodo.data.datasets[0].data = ingresosPorFecha.valores;
    graficos.ingresosPeriodo.update();

    // Gráfico 2: Top Conductores
    const topConductores = procesarTopConductores(datosFiltrados);
    graficos.topConductores.data.labels = topConductores.nombres;
    graficos.topConductores.data.datasets[0].data = topConductores.ingresos;
    graficos.topConductores.update();

    // Gráfico 3: Producción por Bus
    const produccionBuses = procesarProduccionBuses(datosFiltrados);
    graficos.utilizacionBuses.data.labels = produccionBuses.buses;
    graficos.utilizacionBuses.data.datasets[0].data = produccionBuses.producciones;
    graficos.utilizacionBuses.update();

    // Gráfico 4: Producción por Ruta
    const produccionRutas = procesarProduccionRutas(datosFiltrados);
    graficos.distribuccionRutas.data.labels = produccionRutas.rutas;
    graficos.distribuccionRutas.data.datasets[0].data = produccionRutas.producciones;
    graficos.distribuccionRutas.update();
}

function procesarIngresosPorPeriodo(datos) {
    const ingresosPorFecha = {};
    
    datos.forEach(planilla => {
        const fecha = planilla.fecha;
        const ingresos = parseFloat(planilla.total_produccion || 0);
        
        if (!ingresosPorFecha[fecha]) {
            ingresosPorFecha[fecha] = 0;
        }
        ingresosPorFecha[fecha] += ingresos;
    });

    const fechasOrdenadas = Object.keys(ingresosPorFecha).sort();
    
    return {
        fechas: fechasOrdenadas,
        valores: fechasOrdenadas.map(fecha => ingresosPorFecha[fecha])
    };
}

function procesarTopConductores(datos) {
    const conductores = {};
    
    datos.forEach(planilla => {
        const conductorId = planilla.conductor_id;
        const conductorNombre = planilla.conductor_nombre || `Conductor ${conductorId}`;
        const ingresos = parseFloat(planilla.total_produccion || 0);
        
        if (!conductores[conductorId]) {
            conductores[conductorId] = {
                nombre: conductorNombre,
                ingresos: 0
            };
        }
        conductores[conductorId].ingresos += ingresos;
    });

    const topConductores = Object.values(conductores)
        .sort((a, b) => b.ingresos - a.ingresos)
        .slice(0, 5);
    
    return {
        nombres: topConductores.map(c => c.nombre),
        ingresos: topConductores.map(c => c.ingresos)
    };
}

function procesarProduccionBuses(datos) {
    const buses = {};
    
    datos.forEach(planilla => {
        const busId = planilla.bus_id;
        const busNombre = busId; // Solo el número
        const produccion = parseFloat(planilla.total_produccion || 0);
        
        if (!buses[busId]) {
            buses[busId] = {
                nombre: busNombre,
                produccion: 0
            };
        }
        buses[busId].produccion += produccion;
    });

    const busesOrdenados = Object.values(buses)
        .sort((a, b) => b.produccion - a.produccion)
        .slice(0, 10);
    
    return {
        buses: busesOrdenados.map(b => b.nombre),
        producciones: busesOrdenados.map(b => b.produccion)
    };
}

function procesarProduccionRutas(datos) {
    const rutas = {};
    
    datos.forEach(planilla => {
        const origen = planilla.ciudad_origen || 'Origen';
        const retorno = planilla.ciudad_retorno || 'Retorno';
        const ruta = `${origen} - ${retorno}`;  // Usar guión en lugar de flecha
        const produccion = parseFloat(planilla.total_produccion || 0);
        
        if (!rutas[ruta]) {
            rutas[ruta] = 0;
        }
        rutas[ruta] += produccion;
    });

    const rutasOrdenadas = Object.entries(rutas)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8);
    
    return {
        rutas: rutasOrdenadas.map(([ruta]) => ruta),
        producciones: rutasOrdenadas.map(([,produccion]) => produccion)
    };
}

function actualizarMetricas() {
    const totalIngresos = datosFiltrados.reduce((sum, planilla) => 
        sum + parseFloat(planilla.total_produccion || 0), 0);
    
    const totalPlanillas = datosFiltrados.length;
    
    const busesUnicos = new Set(datosFiltrados.map(p => p.bus_id)).size;
    
    const conductoresUnicos = new Set(datosFiltrados.map(p => p.conductor_id)).size;

    document.getElementById('total-ingresos').textContent = formatCurrency(totalIngresos);
    document.getElementById('total-planillas').textContent = totalPlanillas.toLocaleString();
    document.getElementById('buses-utilizados').textContent = busesUnicos;
    document.getElementById('conductores-activos').textContent = conductoresUnicos;
}

function actualizarTabla() {
    const tbody = document.getElementById('tabla-body');
    const noDataDiv = document.getElementById('no-data');
    
    totalRegistros = datosFiltrados.length;
    
    if (totalRegistros === 0) {
        tbody.innerHTML = '';
        noDataDiv.style.display = 'block';
        document.getElementById('paginacion-container').style.display = 'none';
        return;
    }
    
    noDataDiv.style.display = 'none';
    
    // Calcular índices de paginación
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = Math.min(inicio + registrosPorPagina, totalRegistros);
    const datosPagina = datosFiltrados.slice(inicio, fin);
    
    // Mostrar datos de la página actual
    tbody.innerHTML = datosPagina.map(planilla => {
        const ganancia = parseFloat(planilla.total_produccion || 0) - parseFloat(planilla.total_egresos || 0);
        const gananciaClass = ganancia >= 0 ? 'text-success' : 'text-danger';
        
        return `
            <tr>
                <td>${planilla.numero_planilla || planilla.id}</td>
                <td>${formatDate(planilla.fecha)}</td>
                <td>${planilla.conductor_nombre || 'No especificado'}</td>
                <td>${planilla.asistente_nombre || 'Sin Asistente'}</td>
                <td>${planilla.bus_id}</td>
                <td>${planilla.ciudad_origen || 'N/A'} - ${planilla.ciudad_retorno || 'N/A'}</td>
                <td>${formatCurrency(planilla.total_produccion)}</td>
                <td>${formatCurrency(planilla.total_egresos)}</td>
                <td class="${gananciaClass}">${formatCurrency(ganancia)}</td>
            </tr>
        `;
    }).join('');
    
    // Actualizar controles de paginación
    actualizarPaginacion();
}

function actualizarPaginacion() {
    const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);
    const paginacionContainer = document.getElementById('paginacion-container');
    
    if (totalPaginas <= 1) {
        paginacionContainer.style.display = 'none';
        return;
    }
    
    paginacionContainer.style.display = 'flex';
    
    // Actualizar información de registros
    const inicio = (paginaActual - 1) * registrosPorPagina + 1;
    const fin = Math.min(paginaActual * registrosPorPagina, totalRegistros);
    document.getElementById('info-registros').textContent = 
        `Mostrando ${inicio} a ${fin} de ${totalRegistros} registros`;
    
    // Generar botones de paginación
    const paginacionBotones = document.getElementById('paginacion-botones');
    let botonesHTML = '';
    
    // Botón anterior
    botonesHTML += `
        <button class="btn-pagina ${paginaActual === 1 ? 'disabled' : ''}" 
                onclick="cambiarPagina(${paginaActual - 1})" 
                ${paginaActual === 1 ? 'disabled' : ''}>
            ‹ Anterior
        </button>
    `;
    
    // Botones de páginas
    const maxBotones = 5;
    let inicioRango = Math.max(1, paginaActual - Math.floor(maxBotones / 2));
    let finRango = Math.min(totalPaginas, inicioRango + maxBotones - 1);
    
    if (finRango - inicioRango + 1 < maxBotones) {
        inicioRango = Math.max(1, finRango - maxBotones + 1);
    }
    
    for (let i = inicioRango; i <= finRango; i++) {
        botonesHTML += `
            <button class="btn-pagina ${i === paginaActual ? 'active' : ''}" 
                    onclick="cambiarPagina(${i})">
                ${i}
            </button>
        `;
    }
    
    // Botón siguiente
    botonesHTML += `
        <button class="btn-pagina ${paginaActual === totalPaginas ? 'disabled' : ''}" 
                onclick="cambiarPagina(${paginaActual + 1})" 
                ${paginaActual === totalPaginas ? 'disabled' : ''}>
            Siguiente ›
        </button>
    `;
    
    paginacionBotones.innerHTML = botonesHTML;
}

function cambiarPagina(nuevaPagina) {
    const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);
    
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) {
        return;
    }
    
    paginaActual = nuevaPagina;
    actualizarTabla();
}

async function exportarExcel() {
    try {
        if (datosFiltrados.length === 0) {
            mostrarNotificacion('No hay datos para exportar', 'warning');
            return;
        }

        // Preparar datos para Excel
        const datosExcel = datosFiltrados.map(planilla => ({
            'N° Planilla': planilla.numero_planilla || planilla.id,
            'Fecha': formatDate(planilla.fecha),
            'Conductor': planilla.conductor_nombre || 'No especificado',
            'Asistente': planilla.asistente_nombre || 'Sin Asistente',
            'Bus': planilla.bus_id,
            'Ruta': `${planilla.ciudad_origen || 'N/A'} - ${planilla.ciudad_retorno || 'N/A'}`,
            'Total Producción': parseFloat(planilla.total_produccion || 0),
            'Total Egresos': parseFloat(planilla.total_egresos || 0),
            'Ganancia Neta': parseFloat(planilla.total_produccion || 0) - parseFloat(planilla.total_egresos || 0)
        }));

        // Crear workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datosExcel);

        // Agregar hoja al workbook
        XLSX.utils.book_append_sheet(wb, ws, "Planillas");

        // Generar archivo
        const fecha = new Date().toISOString().split('T')[0];
        const filename = `planillas_consulta_${fecha}.xlsx`;
        
        XLSX.writeFile(wb, filename);
        
        mostrarNotificacion('Archivo Excel exportado correctamente', 'success');
    } catch (error) {
        console.error('Error al exportar Excel:', error);
        mostrarNotificacion('Error al exportar a Excel', 'error');
    }
}

async function exportarPDF() {
    try {
        if (datosFiltrados.length === 0) {
            mostrarNotificacion('No hay datos para exportar', 'warning');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape para más espacio
        
        // Título
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Reporte de Planillas - RendiBus', 20, 20);
        
        // Fecha del reporte
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`, 20, 30);
        doc.text(`Total de registros: ${datosFiltrados.length}`, 20, 36);
        
        // Preparar datos para la tabla
        const headers = [
            'N° Planilla', 'Fecha', 'Conductor', 'Bus', 'Ruta', 
            'Producción', 'Egresos', 'Ganancia'
        ];
        
        const data = datosFiltrados.slice(0, 50).map(planilla => [
            planilla.numero_planilla || planilla.id,
            formatDate(planilla.fecha),
            (planilla.conductor_nombre || 'No especificado').substring(0, 15),
            `Bus ${planilla.bus_id}`,
            `${planilla.ciudad_origen || 'N/A'} → ${planilla.ciudad_retorno || 'N/A'}`.substring(0, 20),
            formatCurrency(planilla.total_produccion),
            formatCurrency(planilla.total_egresos),
            formatCurrency(parseFloat(planilla.total_produccion || 0) - parseFloat(planilla.total_egresos || 0))
        ]);

        // Agregar tabla usando autoTable si está disponible
        if (doc.autoTable) {
            doc.autoTable({
                head: [headers],
                body: data,
                startY: 45,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [0, 62, 132] },
                alternateRowStyles: { fillColor: [245, 245, 245] }
            });
        } else {
            // Tabla manual simple
            let y = 45;
            doc.setFontSize(8);
            
            // Headers
            doc.setFont('helvetica', 'bold');
            headers.forEach((header, i) => {
                doc.text(header, 20 + (i * 35), y);
            });
            
            y += 8;
            
            // Data
            doc.setFont('helvetica', 'normal');
            data.forEach(row => {
                row.forEach((cell, i) => {
                    doc.text(String(cell), 20 + (i * 35), y);
                });
                y += 6;
                if (y > 190) return; // Evitar overflow
            });
        }
        
        // Guardar archivo
        const fecha = new Date().toISOString().split('T')[0];
        doc.save(`planillas_reporte_${fecha}.pdf`);
        
        mostrarNotificacion('Archivo PDF exportado correctamente', 'success');
    } catch (error) {
        console.error('Error al exportar PDF:', error);
        mostrarNotificacion('Error al exportar a PDF', 'error');
    }
}

// Funciones auxiliares
function formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(num);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function showLoading(show) {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
    }
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear notificación flotante
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.innerHTML = `
        <div class="notificacion-content">
            <span class="notificacion-icon">
                ${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : tipo === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span class="notificacion-text">${mensaje}</span>
        </div>
    `;
    
    // Estilos de notificación
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'success' ? '#28a745' : tipo === 'error' ? '#dc3545' : tipo === 'warning' ? '#ffc107' : '#007bff'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notificacion);
    
    // Animar entrada
    setTimeout(() => {
        notificacion.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover después de 4 segundos
    setTimeout(() => {
        notificacion.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.parentNode.removeChild(notificacion);
            }
        }, 300);
    }, 4000);
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

console.log('📊 Dashboard Consultas JavaScript v1.0 cargado');