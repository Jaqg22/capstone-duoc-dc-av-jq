
// Muestra la fecha actual en formato "Día, dd/mm/yyyy" en el elemento con clase .fecha_login

const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

function obtenerFechaDiaTexto() {
    const d = new Date();
    const dia = DIAS[d.getDay()];
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yyyy = d.getFullYear();
    return `${capitalizar(dia)}, ${dd}/${mm}/${yyyy}`;
}

function capitalizar(t){ return t.charAt(0).toUpperCase()+t.slice(1); }

function iniciarFechaHeader() {
    const el = document.querySelector('.fecha_login');
    if(!el) return;
    const tick = () => el.textContent = obtenerFechaDiaTexto();
    tick();
    // Actualiza cada minuto (por si cambia el día a medianoche)
    setInterval(tick, 60 * 1000);
}

// Funcionalidades de validación y login
document.addEventListener('DOMContentLoaded', function() {
    iniciarFechaHeader();
    initLoginForm();
});

function initLoginForm() {
    const form = document.querySelector('.form_login');
    const inputs = form.querySelectorAll('input[type="text"], input[type="password"]');
    const loginButton = document.getElementById('ingresar');
    
    // Validación en tiempo real
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearErrors);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                loginButton.click();
            }
        });
    });
    
    // Manejo del formulario
    form.addEventListener('submit', handleFormSubmit);
    
    function validateField(e) {
        const field = e.target;
        const fieldContainer = field.closest('.input');
        
        if (field.value.trim() === '') {
            fieldContainer.classList.add('error');
            return false;
        } else {
            fieldContainer.classList.remove('error');
            return true;
        }
    }
    
    function clearErrors(e) {
        const fieldContainer = e.target.closest('.input');
        fieldContainer.classList.remove('error');
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const usuario = document.getElementById('usuario').value.trim();
        const contrasena = document.getElementById('contrasena').value.trim();
        
        // Validar campos
        let hasErrors = false;
        inputs.forEach(input => {
            if (!validateField({ target: input })) {
                hasErrors = true;
            }
        });
        
        if (hasErrors) {
            showMessage('Por favor, completa todos los campos', 'error');
            return;
        }
        
        // Validaciones adicionales
        if (usuario.length < 3) {
            showMessage('El usuario debe tener al menos 3 caracteres', 'error');
            return;
        }
        
        if (contrasena.length < 6) {
            showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        // Simular proceso de login
        startLoading();
        
        // Simular petición al servidor
        setTimeout(() => {
            // Aquí irían las credenciales reales
            if (usuario === 'admin' && contrasena === '123456') {
                showMessage('Inicio de sesión exitoso', 'success');
                
                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 1000);
            } else {
                showMessage('Usuario o contraseña incorrectos', 'error');
                stopLoading();
            }
        }, 2000);
    }
    
    function startLoading() {
        const button = document.getElementById('ingresar');
        const btnText = button.querySelector('.btn-text');
        const spinner = button.querySelector('.spinner');
        
        button.classList.add('loading');
        button.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
    }
    
    function stopLoading() {
        const button = document.getElementById('ingresar');
        const btnText = button.querySelector('.btn-text');
        const spinner = button.querySelector('.spinner');
        
        button.classList.remove('loading');
        button.disabled = false;
        btnText.style.display = 'inline-block';
        spinner.style.display = 'none';
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
            background-color: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
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
`;
document.head.appendChild(style);
