from rest_framework import serializers
from .models import Planilla, Tarifa, Ingreso, Egreso, ControlBoleto


class TarifaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Tarifa"""
    
    class Meta:
        model = Tarifa
        fields = ['id', 'concepto', 'precio', 'cantidad', 'subtotal', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']
    
    def validate_precio(self, value):
        """Validar que el precio sea mayor a 0"""
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser mayor a 0")
        return value
    
    def validate_cantidad(self, value):
        """Validar que la cantidad sea mayor a 0"""
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor a 0")
        return value


class IngresoSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Ingreso"""
    
    class Meta:
        model = Ingreso
        fields = ['id', 'concepto', 'monto', 'observaciones', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']
    
    def validate_monto(self, value):
        """Validar que el monto sea mayor a 0"""
        if value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a 0")
        return value


class EgresoSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Egreso"""
    
    class Meta:
        model = Egreso
        fields = ['id', 'concepto', 'monto', 'observaciones', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']
    
    def validate_monto(self, value):
        """Validar que el monto sea mayor a 0"""
        if value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a 0")
        return value


class ControlBoletoSerializer(serializers.ModelSerializer):
    """Serializer para el modelo ControlBoleto"""
    
    class Meta:
        model = ControlBoleto
        fields = [
            'id', 'numero_inicial', 'numero_final', 'cantidad_vendidos',
            'cantidad_devueltos', 'cantidad_anulados', 'total_boletos',
            'boletos_faltantes', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'total_boletos', 'boletos_faltantes', 'fecha_creacion']
    
    def validate(self, data):
        """Validar que el número final sea mayor al inicial"""
        if data['numero_final'] <= data['numero_inicial']:
            raise serializers.ValidationError(
                "El número final debe ser mayor al número inicial"
            )
        return data


class PlanillaListSerializer(serializers.ModelSerializer):
    """Serializer para listar planillas (versión simplificada)"""
    
    class Meta:
        model = Planilla
        fields = [
            'id', 'imagen', 'status', 'fecha_creacion', 'fecha_actualizacion',
            'nombre_archivo', 'tamaño_archivo'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


class PlanillaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para el modelo Planilla"""
    
    class Meta:
        model = Planilla
        fields = [
            # Campos básicos
            'id', 'imagen', 'status', 'fecha_creacion', 'fecha_actualizacion',
            # Información de la planilla
            'codigo_origen', 'codigo_retorno', 'numero_bus', 'horario_origen',
            'horario_retorno', 'numero_planilla', 'fecha', 'codigo_conductor',
            'codigo_asistente',
            # Tarifas
            'tarifa_1', 'tarifa_2', 'tarifa_3', 'tarifa_4', 'tarifa_5', 'tarifa_6',
            # Boletos iniciales
            'b_inicial_1', 'b_inicial_2', 'b_inicial_3', 'b_inicial_4', 'b_inicial_5', 'b_inicial_6',
            # Boletos finales
            'b_final_1', 'b_final_2', 'b_final_3', 'b_final_4', 'b_final_5', 'b_final_6',
            # Totales
            'total_ingreso_ruta', 'total_ingreso_oficina', 'total_ingresos',
            # Egresos
            'losa', 'pension', 'cena', 'viaticos', 'otros', 'total_egresos'
        ]
        read_only_fields = [
            'id', 'fecha_creacion', 'fecha_actualizacion',
            'codigo_origen', 'codigo_retorno', 'numero_bus', 'horario_origen',
            'horario_retorno', 'numero_planilla', 'fecha', 'codigo_conductor',
            'codigo_asistente',
            'tarifa_1', 'tarifa_2', 'tarifa_3', 'tarifa_4', 'tarifa_5', 'tarifa_6',
            'b_final_1', 'b_final_2', 'b_final_3', 'b_final_4', 'b_final_5', 'b_final_6',
            'total_ingreso_ruta', 'total_ingreso_oficina', 'total_ingresos',
            'losa', 'pension', 'cena', 'viaticos', 'otros', 'total_egresos'
        ]


class PlanillaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear planillas (solo imagen)"""
    
    class Meta:
        model = Planilla
        fields = ['imagen', 'nombre_archivo']
    
    def create(self, validated_data):
        """Crear planilla y extraer metadatos del archivo"""
        imagen = validated_data.get('imagen')
        
        # Extraer metadatos del archivo
        if imagen:
            validated_data['nombre_archivo'] = imagen.name
            validated_data['tamaño_archivo'] = imagen.size
        
        return super().create(validated_data)


class PlanillaUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar el status de una planilla"""
    
    class Meta:
        model = Planilla
        fields = ['status', 'datos_extraidos', 'error_procesamiento']
        read_only_fields = ['datos_extraidos', 'error_procesamiento']
