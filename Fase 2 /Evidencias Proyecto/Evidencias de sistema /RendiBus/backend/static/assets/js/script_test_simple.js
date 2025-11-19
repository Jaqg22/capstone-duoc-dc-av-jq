// Script de prueba simple para verificar la funcionalidad básica
console.log('🚀 Script de prueba iniciado');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM cargado - Iniciando pruebas');
    
    // Probar fetch básico
    fetch('/api/planillas/empleados/?cargo=conductor')
        .then(response => {
            console.log('📡 Respuesta recibida:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('📋 Datos recibidos:', data);
            if (data.success && data.empleados) {
                console.log(`✅ ${data.empleados.length} empleados cargados exitosamente`);
                console.log('Primer empleado:', data.empleados[0]);
            }
        })
        .catch(error => {
            console.error('❌ Error en fetch:', error);
        });
        
    // Probar después de 2 segundos con otro cargo
    setTimeout(() => {
        console.log('🔄 Probando asistentes...');
        fetch('/api/planillas/empleados/?cargo=asistente')
            .then(response => response.json())
            .then(data => {
                console.log('📋 Asistentes:', data);
                if (data.success && data.empleados) {
                    console.log(`✅ ${data.empleados.length} asistentes cargados`);
                }
            })
            .catch(error => {
                console.error('❌ Error cargando asistentes:', error);
            });
    }, 2000);
});