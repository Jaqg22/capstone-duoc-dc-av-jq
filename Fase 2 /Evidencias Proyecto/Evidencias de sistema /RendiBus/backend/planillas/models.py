from django.db import models
from django.core.validators import RegexValidator


class Cargo(models.Model):
    """Tabla de cargos de empleados"""
    cargo_id = models.AutoField(primary_key=True)
    nombre_cargo = models.CharField(max_length=100, unique=True)
    
    class Meta:
        db_table = 'cargo'
        verbose_name = 'Cargo'
        verbose_name_plural = 'Cargos'
    
    def __str__(self):
        return self.nombre_cargo


class Empleado(models.Model):
    """Tabla de empleados"""
    empleado_id = models.AutoField(primary_key=True)
    primer_nombre = models.CharField(max_length=50)
    segundo_nombre = models.CharField(max_length=50, blank=True, null=True)
    primer_apellido = models.CharField(max_length=50)
    segundo_apellido = models.CharField(max_length=50, blank=True, null=True)
    
    # Validador para teléfono chileno
    phone_regex = RegexValidator(
        regex=r'^\+?56?[0-9]{8,9}$',
        message="El teléfono debe tener el formato: '+56987654321' o '987654321'"
    )
    telefono = models.CharField(validators=[phone_regex], max_length=15)
    email = models.EmailField(unique=True)
    
    # FK a Cargo
    cargo = models.ForeignKey(Cargo, on_delete=models.PROTECT, db_column='cargo_id')
    
    # Campos de auditoría
    fecha_ingreso = models.DateField(auto_now_add=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'empleado'
        verbose_name = 'Empleado'
        verbose_name_plural = 'Empleados'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['activo']),
        ]
        permissions = [
            ("can_manage_conductores", "Puede gestionar conductores"),
            ("can_manage_asistentes", "Puede gestionar asistentes"),
            ("can_view_employee_reports", "Puede ver reportes de empleados"),
            ("can_import_employees", "Puede importar empleados desde Excel"),
        ]
    
    def __str__(self):
        return f"{self.primer_nombre} {self.primer_apellido}"
    
    @property
    def nombre_completo(self):
        nombres = [self.primer_nombre]
        if self.segundo_nombre:
            nombres.append(self.segundo_nombre)
        apellidos = [self.primer_apellido]
        if self.segundo_apellido:
            apellidos.append(self.segundo_apellido)
        return f"{' '.join(nombres)} {' '.join(apellidos)}"


class Bus(models.Model):
    """Tabla de buses"""
    bus_id = models.SmallIntegerField(primary_key=True)  # No auto incrementable
    patente = models.CharField(max_length=8, unique=True)  # Formato patente chilena
    
    # Campos adicionales para gestión
    modelo = models.CharField(max_length=50, blank=True)
    año = models.IntegerField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'bus'
        verbose_name = 'Bus'
        verbose_name_plural = 'Buses'
        indexes = [
            models.Index(fields=['patente']),
            models.Index(fields=['activo']),
        ]
    
    def __str__(self):
        return f"Bus {self.bus_id} - {self.patente}"


class Ciudad(models.Model):
    """Tabla de ciudades"""
    ciudad_id = models.CharField(max_length=4, primary_key=True)  # No auto incrementable
    nombre_ciudad = models.CharField(max_length=100, unique=True)
    
    # Campos adicionales
    region = models.CharField(max_length=100, blank=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'ciudad'
        verbose_name = 'Ciudad'
        verbose_name_plural = 'Ciudades'
        indexes = [
            models.Index(fields=['nombre_ciudad']),
            models.Index(fields=['activo']),
        ]
    
    def __str__(self):
        return f"{self.nombre_ciudad} ({self.ciudad_id})"


class Planilla(models.Model):
    """Tabla principal de planillas"""
    id_planilla = models.BigIntegerField(primary_key=True)  # No auto incrementable
    fecha = models.DateField()
    
    # Horarios
    horario_origen = models.TimeField()
    horario_retorno = models.TimeField(blank=True, null=True)
    
    # Ingresos
    ingreso_oficina = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    ingreso_ruta = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total_produccion = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    
    # Egresos
    pension = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    viaticos = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    losa = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    cena = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    otros_gastos = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total_egresos = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    
    # Foreign Keys
    bus = models.ForeignKey(Bus, on_delete=models.PROTECT, db_column='bus_id')
    cod_origen = models.ForeignKey(
        Ciudad, 
        related_name='planillas_origen',
        on_delete=models.PROTECT, 
        db_column='cod_origen',
        verbose_name='Ciudad de Origen'
    )
    cod_retorno = models.ForeignKey(
        Ciudad, 
        related_name='planillas_retorno',
        on_delete=models.PROTECT, 
        db_column='cod_retorno',
        blank=True, 
        null=True,
        verbose_name='Ciudad de Retorno'
    )
    cod_conductor = models.ForeignKey(
        Empleado, 
        related_name='planillas_conductor',
        on_delete=models.PROTECT, 
        db_column='cod_conductor',
        verbose_name='Conductor'
    )
    cod_asistente = models.ForeignKey(
        Empleado, 
        related_name='planillas_asistente',
        on_delete=models.PROTECT, 
        db_column='cod_asistente',
        blank=True, 
        null=True,
        verbose_name='Asistente'
    )
    
    # Campos de auditoría
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'planilla'
        verbose_name = 'Planilla'
        verbose_name_plural = 'Planillas'
        indexes = [
            models.Index(fields=['fecha']),
            models.Index(fields=['bus']),
            models.Index(fields=['cod_conductor']),
            models.Index(fields=['fecha_creacion']),
        ]
        constraints = [
            # Constraint para validar que el conductor y asistente sean diferentes
            models.CheckConstraint(
                check=~models.Q(cod_conductor=models.F('cod_asistente')),
                name='conductor_diferente_asistente'
            ),
            # Constraint para validar que los montos sean positivos
            models.CheckConstraint(
                check=models.Q(total_produccion__gte=0),
                name='total_produccion_positivo'
            ),
            models.CheckConstraint(
                check=models.Q(total_egresos__gte=0),
                name='total_egresos_positivo'
            ),
        ]
        permissions = [
            ("can_approve_planilla", "Puede aprobar planillas"),
            ("can_reject_planilla", "Puede rechazar planillas"),
            ("can_view_all_planillas", "Puede ver todas las planillas"),
            ("can_export_planillas", "Puede exportar planillas"),
            ("can_import_planillas", "Puede importar planillas"),
            ("can_view_reports", "Puede ver reportes avanzados"),
        ]
    
    def __str__(self):
        return f"Planilla {self.id_planilla} - {self.fecha} - Bus {self.bus.bus_id}"
    
    def save(self, *args, **kwargs):
        """Calcular totales automáticamente antes de guardar"""
        self.total_produccion = self.ingreso_oficina + self.ingreso_ruta
        self.total_egresos = (
            self.pension + self.viaticos + self.losa + 
            self.cena + self.otros_gastos
        )
        super().save(*args, **kwargs)
    
    @property
    def ganancia_neta(self):
        """Calcula la ganancia neta (ingresos - egresos)"""
        return self.total_produccion - self.total_egresos
    
    @property
    def duracion_viaje(self):
        """Calcula la duración del viaje si hay horario de retorno"""
        if self.horario_retorno:
            from datetime import datetime, timedelta
            origen = datetime.combine(self.fecha, self.horario_origen)
            retorno = datetime.combine(self.fecha, self.horario_retorno)
            
            # Si el retorno es al día siguiente
            if retorno < origen:
                retorno += timedelta(days=1)
            
            return retorno - origen
        return None
