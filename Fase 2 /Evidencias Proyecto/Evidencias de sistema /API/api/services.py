import logging
from typing import Dict, Any
from django.conf import settings
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import AzureError
import datetime
from decimal import Decimal

logger = logging.getLogger(__name__)


class AzureFormRecognizerService:
    """
    Servicio para interactuar con Azure Form Recognizer.
    Procesa imágenes de planillas y extrae datos estructurados.
    
    Configurado para usar:
    - Endpoint: https://azure-rendibus.cognitiveservices.azure.com/
    - Modelo entrenado personalizado (pendiente de configurar)
    - Mapeo de campos a modelos Django: Planilla, Tarifa, Ingreso, Egreso, ControlBoleto
    """
    
    def __init__(self):
        self.endpoint = settings.AZURE_FORM_RECOGNIZER_ENDPOINT
        self.key = settings.AZURE_FORM_RECOGNIZER_KEY
        self.model_id = settings.AZURE_FORM_RECOGNIZER_MODEL_ID
        
        if not self.endpoint or not self.key:
            logger.warning("Azure Form Recognizer credentials not configured")
            self.client = None
        else:
            try:
                self.client = DocumentAnalysisClient(
                    endpoint=self.endpoint,
                    credential=AzureKeyCredential(self.key)
                )
                logger.info("Azure Form Recognizer client initialized successfully")
            except Exception as e:
                logger.error("Failed to initialize Azure Form Recognizer client: %s", e)
                self.client = None
    
    def is_configured(self) -> bool:
        """Verificar si el servicio está configurado correctamente"""
        return self.client is not None and bool(self.endpoint and self.key)
    
    def analyze_document(self, image_path: str) -> Dict[str, Any]:
        """
        Analizar un documento usando el modelo entrenado personalizado.
        
        Args:
            image_path: Ruta al archivo de imagen
            
        Returns:
            Dict con los datos extraídos del documento
        """
        if not self.is_configured():
            raise ValueError("Azure Form Recognizer not configured")
        
        try:
            with open(image_path, "rb") as f:
                # Usar el modelo entrenado personalizado
                poller = self.client.begin_analyze_document(
                    self.model_id, 
                    document=f
                )
                result = poller.result()
            
            # Extraer datos del resultado
            extracted_data = self._extract_data_from_result(result)
            
            logger.info("Successfully analyzed document: %s", image_path)
            return extracted_data
            
        except AzureError as e:
            logger.error("Azure Form Recognizer error: %s", e)
            raise
        except FileNotFoundError:
            logger.error("Image file not found: %s", image_path)
            raise
        except Exception as e:
            logger.error("Unexpected error analyzing document: %s", e)
            raise
    
    def _extract_data_from_result(self, result) -> Dict[str, Any]:
        """
        Extraer datos estructurados del resultado del modelo entrenado.
        Solo extrae los campos necesarios de los recuadros de colores.
        
        Args:
            result: Resultado del análisis de Azure
            
        Returns:
            Dict con los datos extraídos de los recuadros de colores
        """
        extracted_data = {
            # Información básica
            'codigo_origen': None,
            'codigo_retorno': None,
            'numero_bus': None,
            'horario_origen': None,
            'horario_retorno': None,
            'numero_planilla': None,
            'fecha': None,
            'codigo_conductor': None,
            'codigo_asistente': None,
            
            # Tarifas
            'tarifa_1': None,
            'tarifa_2': None,
            'tarifa_3': None,
            'tarifa_4': None,
            'tarifa_5': None,
            'tarifa_6': None,
            
            # Boletos iniciales
            'b_inicial_1': None,
            'b_inicial_2': None,
            'b_inicial_3': None,
            'b_inicial_4': None,
            'b_inicial_5': None,
            'b_inicial_6': None,
            
            # Boletos finales
            'b_final_1': None,
            'b_final_2': None,
            'b_final_3': None,
            'b_final_4': None,
            'b_final_5': None,
            'b_final_6': None,
            
            # Totales
            'total_ingreso_ruta': None,
            'total_ingreso_oficina': None,
            'total_ingresos': None,
            
            # Egresos
            'losa': None,
            'pension': None,
            'cena': None,
            'viaticos': None,
            'otros': None,
            'total_egresos': None
        }
        
        # asegurar claves auxiliares usadas más abajo
        extracted_data.setdefault('texto_completo', '')
        extracted_data.setdefault('tablas', [])
        extracted_data.setdefault('campos_detectados', {})
        extracted_data.setdefault('raw_result', {})
        try:
            # Extraer texto completo
            if hasattr(result, 'content'):
                extracted_data['texto_completo'] = result.content
            
            # Extraer tablas (manejar atributos opcionales del SDK)
            if hasattr(result, 'tables'):
                for table in result.tables:
                    table_data = {
                        'row_count': getattr(table, 'row_count', None),
                        'column_count': getattr(table, 'column_count', None),
                        'cells': []
                    }

                    for cell in getattr(table, 'cells', []):
                        table_data['cells'].append({
                            'text': getattr(cell, 'content', None),
                            'row_index': getattr(cell, 'row_index', None),
                            'column_index': getattr(cell, 'column_index', None),
                            'confidence': getattr(cell, 'confidence', None)
                        })

                    extracted_data['tablas'].append(table_data)
            
            # Extraer campos específicos (key-value pairs)
            if hasattr(result, 'key_value_pairs'):
                for kv_pair in result.key_value_pairs:
                    try:
                        key_text = getattr(kv_pair.key, 'content', None) if getattr(kv_pair, 'key', None) else None
                        value_text = getattr(kv_pair.value, 'content', None) if getattr(kv_pair, 'value', None) else None
                        if key_text:
                            extracted_data['campos_detectados'][key_text] = {
                                'value': value_text,
                                'confidence': getattr(kv_pair, 'confidence', None)
                            }
                    except Exception:
                        # no queremos que un par clave-valor mal formado rompa toda la extracción
                        continue
            
            # Guardar resultado completo (solo datos serializables)
            # Algunos objetos devueltos por el SDK no son JSON-serializables
            # (por ejemplo AnalyzedDocument). Intentamos convertir usando to_dict()
            # si está disponible; si no, guardamos únicamente conteos.
            documents_serializable = []
            if hasattr(result, 'to_dict') and callable(getattr(result, 'to_dict')):
                try:
                    documents_serializable = result.to_dict().get('documents', [])
                except Exception:
                    documents_serializable = []

            extracted_data['raw_result'] = {
                'pages': len(result.pages) if hasattr(result, 'pages') else 0,
                'tables_count': len(result.tables) if hasattr(result, 'tables') else 0,
                'key_value_pairs_count': len(result.key_value_pairs) if hasattr(result, 'key_value_pairs') else 0,
                'documents_count': len(getattr(result, 'documents', [])),
                'documents': documents_serializable
            }
            
            # Procesar datos específicos de planillas usando el modelo entrenado
            extracted_data = self._process_planilla_data(extracted_data)

            # Asegurar que el dict final es serializable a JSON (convertir date/datetime/Decimal)
            extracted_data = self._sanitize_for_json(extracted_data)
            
        except Exception as e:
            logger.error("Error processing Azure result: %s", e)
            extracted_data['error'] = str(e)
        
        return extracted_data

    def _sanitize_for_json(self, value):
        """
        Convertir recursivamente estructuras que no son JSON-serializables
        (date, datetime, Decimal, objetos SDK) a tipos serializables.
        """
        # Tipos primitivos que ya son serializables
        if value is None or isinstance(value, (str, bool, int, float)):
            return value

        # Fechas y datetimes -> ISO string
        if isinstance(value, (datetime.date, datetime.datetime)):
            try:
                return value.isoformat()
            except Exception:
                return str(value)

        # Decimal -> float (puede perder precisión, pero es serializable)
        if isinstance(value, Decimal):
            try:
                return float(value)
            except Exception:
                return str(value)

        # Listas/tuplas -> procesar elementos
        if isinstance(value, (list, tuple)):
            return [self._sanitize_for_json(v) for v in value]

        # Diccionarios -> procesar claves y valores
        if isinstance(value, dict):
            new = {}
            for k, v in value.items():
                # convertir key a str
                try:
                    key = str(k)
                except Exception:
                    key = repr(k)
                new[key] = self._sanitize_for_json(v)
            return new

        # Si el objeto tiene to_dict(), intentar usarlo
        to_dict = getattr(value, 'to_dict', None)
        if callable(to_dict):
            try:
                return self._sanitize_for_json(value.to_dict())
            except Exception:
                pass

        # Último recurso: convertir a string
        try:
            return str(value)
        except Exception:
            return None
    
    def _process_planilla_data(self, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Procesa los datos del modelo Modelov3_rendibus y extrae los valores de los campos.
        Prioriza extracción de tablas y usa Azure Form Recognizer como respaldo.
        
        Args:
            extracted_data: Datos extraídos de Azure
            
        Returns:
            Datos procesados específicos para planillas
        """
        try:
            # PASO 1: Extraer datos de las tablas PRIMERO (más confiables)
            tablas = extracted_data.get('tablas', [])
            if tablas:
                for tabla in tablas:
                    cells = tabla.get('cells', [])
                    
                    # Convertir células a diccionario para fácil búsqueda
                    cell_data = {}
                    for cell in cells:
                        row = cell.get('row_index', 0)
                        col = cell.get('column_index', 0)
                        text = cell.get('text', '').strip()
                        cell_data[(row, col)] = text
                    
                    # Extraer datos según la estructura de cada tabla
                    self._extract_from_table(cell_data, extracted_data)
            
            # PASO 2: Usar Azure Form Recognizer para completar datos faltantes
            self._extract_from_azure_fields(extracted_data)
            
            # PASO 3: Validar y corregir datos inconsistentes
            self._validate_and_fix_data(extracted_data)
            
            logger.info("Datos extraídos exitosamente de Azure Form Recognizer")
            
        except Exception as e:
            logger.error("Error processing planilla data: %s", e)
            extracted_data['processing_error'] = str(e)
        
        return extracted_data
    
    def _extract_from_azure_fields(self, extracted_data: Dict[str, Any]):
        """
        Extrae datos de los campos detectados directamente por Azure Form Recognizer
        Solo como RESPALDO si no hay datos en las tablas
        
        Args:
            extracted_data: Diccionario de datos extraídos a actualizar
        """
        try:
            # Obtener los campos de Azure Form Recognizer
            raw_result = extracted_data.get('raw_result', {})
            documents = raw_result.get('documents', [])
            
            if not documents:
                logger.warning("No se encontraron documentos en el resultado de Azure")
                return
                
            # Tomar el primer documento
            document = documents[0]
            fields = document.get('fields', {})
            
            # Función auxiliar para extraer valores de Azure
            def get_field_value(field_name):
                field = fields.get(field_name, {})
                return field.get('value')
            
            # Mapeo de los campos de Azure a los campos del modelo Django
            # SOLO aplicar si el campo no existe aún (las tablas tienen prioridad)
            field_mapping = {
                # Información básica
                'codigo_origen': get_field_value('Código_Origen'),
                'codigo_retorno': get_field_value('Código_Retorno'), 
                'numero_bus': get_field_value('Número_bus'),
                'horario_origen': get_field_value('Horario_Origen'),
                'horario_retorno': get_field_value('Horario_Retorno'),
                'numero_planilla': get_field_value('Número_Planilla'),
                'fecha': get_field_value('Fecha'),
                'codigo_conductor': get_field_value('Código_Conductor'),
                'codigo_asistente': get_field_value('Código_Asistente'),
                
                # Tarifas
                'tarifa_1': get_field_value('Tarifa_1'),
                'tarifa_2': get_field_value('Tarifa_2'),
                'tarifa_3': get_field_value('Tarifa_3'),
                'tarifa_4': get_field_value('Tarifa_4'),
                'tarifa_5': get_field_value('Tarifa_5'),
                'tarifa_6': get_field_value('Tarifa_6'),
                
                # Boletos iniciales
                'b_inicial_1': get_field_value('B. Inicial_1'),
                'b_inicial_2': get_field_value('B. Inicial_2'),
                'b_inicial_3': get_field_value('B. Inicial_3'),
                'b_inicial_4': get_field_value('B. Inicial_4'),
                'b_inicial_5': get_field_value('B. Inicial_5'),
                'b_inicial_6': get_field_value('B. Inicial_6'),
                
                # Boletos finales
                'b_final_1': get_field_value('B. Final_1'),
                'b_final_2': get_field_value('B. Final_2'),
                'b_final_3': get_field_value('B. Final_3'),
                'b_final_4': get_field_value('B. Final_4'),
                'b_final_5': get_field_value('B. Final_5'),
                'b_final_6': get_field_value('B. Final_6'),
                
                # Totales
                'total_ingreso_ruta': get_field_value('Total_Ingreso_Ruta'),
                'total_ingreso_oficina': get_field_value('Total_Ingreso_Oficina'),
                'total_ingresos': get_field_value('Total_Ingresos'),
                
                # Egresos
                'losa': get_field_value('Losa'),
                'pension': get_field_value('Pension'),
                'cena': get_field_value('Cena'),
                'viaticos': get_field_value('Viaticos'),
                'otros': get_field_value('Otros'),
                'total_egresos': get_field_value('Total_Egresos'),
            }
            
            # Solo actualizar campos que estén vacíos (las tablas ya llenaron los importantes)
            for key, value in field_mapping.items():
                if value is not None and not extracted_data.get(key):
                    extracted_data[key] = value
                    logger.info(f"Azure field backup: {key} = {value}")
            
            logger.info(f"Campos detectados por Azure (como respaldo): {list(fields.keys())}")
            
        except Exception as e:
            logger.error("Error extracting from Azure fields: %s", e)
    
    def _extract_from_table(self, cell_data: Dict, extracted_data: Dict[str, Any]):
        """
        Extrae datos específicos de una tabla basándose en su contenido
        
        Args:
            cell_data: Diccionario con datos de celdas {(row, col): text}
            extracted_data: Diccionario de datos extraídos a actualizar
        """
        try:
            # Extraer información básica de tablas de 2 columnas
            self._extract_basic_info_from_table(cell_data, extracted_data)
            
            # Extraer tarifas de tabla de tickets
            self._extract_tarifas_from_table(cell_data, extracted_data)
            
            # Extraer boletos iniciales y finales
            self._extract_boletos_from_table(cell_data, extracted_data)
            
            # Extraer ingresos y egresos
            self._extract_ingresos_egresos_from_table(cell_data, extracted_data)
            
        except Exception as e:
            logger.error("Error extracting from table: %s", e)
    
    def _extract_basic_info_from_table(self, cell_data: Dict, extracted_data: Dict[str, Any]):
        """Extrae información básica de tablas de 2 columnas"""
        label_mappings = {
            'Código Origen': 'codigo_origen',
            'Código Retorno': 'codigo_retorno', 
            'Número Bus': 'numero_bus',
            'Horario Origen': 'horario_origen',
            'Horario Retorno': 'horario_retorno',
            'Nro Planilla': 'numero_planilla',
            'Fecha': 'fecha',
            'Nom. Conductor': 'codigo_conductor',
            'Cód. Conductor': 'codigo_conductor',
            'Nom. Asistente': 'codigo_asistente',
            'Cód. Asistente': 'codigo_asistente'
        }
        
        for (row, col), text in cell_data.items():
            if col == 0:  # Primera columna contiene etiquetas
                value_cell = cell_data.get((row, 1), '').strip()
                field_name = label_mappings.get(text)
                
                if field_name and value_cell:
                    # SIEMPRE actualizar desde la tabla (más confiable que Azure)
                    extracted_data[field_name] = value_cell
                    logger.info(f"Extracted from table: {field_name} = {value_cell}")
    
    def _extract_tarifas_from_table(self, cell_data: Dict, extracted_data: Dict[str, Any]):
        """Extrae tarifas de la tabla de tickets"""
        # Buscar la fila que contiene las tarifas (valores monetarios en secuencia)
        tarifa_row = None
        
        # Buscar fila con "Tarifas/Tickets" y tomar la siguiente
        for (row, col), text in cell_data.items():
            if 'Tarifas/Tickets' in text or 'Tarifas' in text:
                tarifa_row = row + 1
                break
        
        # Si no encontramos el header, buscar fila con valores monetarios típicos
        if tarifa_row is None:
            for row in range(10):  # Revisar primeras 10 filas
                first_val = cell_data.get((row, 1), '')
                if first_val in ['2000', '1000', '1500']:  # Valores típicos de tarifas
                    tarifa_row = row
                    break
        
        if tarifa_row is not None:
            # Extraer tarifas de las columnas 1-6
            for col in range(1, 7):
                value = cell_data.get((tarifa_row, col), '').strip()
                if value and value.isdigit():
                    tarifa_field = f'tarifa_{col}'
                    # SIEMPRE actualizar desde tabla
                    extracted_data[tarifa_field] = int(value)
                    logger.info(f"Extracted tarifa from table: {tarifa_field} = {value}")
    
    def _extract_boletos_from_table(self, cell_data: Dict, extracted_data: Dict[str, Any]):
        """Extrae boletos iniciales y finales de la tabla de oficina"""
        # Buscar las filas de las ciudades para extraer boletos
        ciudades = ['RAR', 'TAL', 'STG', 'PAR']  # Códigos de ciudades
        
        for (row, col), text in cell_data.items():
            if text in ciudades and col == 0:
                # Extraer boletos de esta fila
                for ticket_col in range(1, 7):
                    boleto_value = cell_data.get((row, ticket_col), '').strip()
                    
                    if boleto_value and boleto_value.isdigit():
                        # Determinar si es boleto inicial o final basado en la posición
                        # Las primeras 3 filas son iniciales, las últimas finales
                        if row <= 3:  # Boletos iniciales (primeras filas)
                            field_name = f'b_inicial_{ticket_col}'
                        else:  # Boletos finales (últimas filas)
                            field_name = f'b_final_{ticket_col}'
                        
                        if not extracted_data.get(field_name):
                            extracted_data[field_name] = int(boleto_value)
        
        # Método alternativo: buscar específicamente la primera y última fila de cada ciudad
        for ciudad in ciudades:
            ciudad_rows = [row for (row, col), text in cell_data.items() 
                          if text == ciudad and col == 0]
            
            if ciudad_rows:
                first_row = min(ciudad_rows)
                last_row = max(ciudad_rows)
                
                # Extraer boletos iniciales de la primera fila
                for col in range(1, 7):
                    inicial_value = cell_data.get((first_row, col), '').strip()
                    if inicial_value and inicial_value.isdigit():
                        field_name = f'b_inicial_{col}'
                        if not extracted_data.get(field_name):
                            extracted_data[field_name] = int(inicial_value)
                
                # Extraer boletos finales de la última fila (si es diferente)
                if last_row != first_row:
                    for col in range(1, 7):
                        final_value = cell_data.get((last_row, col), '').strip()
                        if final_value and final_value.isdigit():
                            field_name = f'b_final_{col}'
                            if not extracted_data.get(field_name):
                                extracted_data[field_name] = int(final_value)
    
    def _extract_ingresos_egresos_from_table(self, cell_data: Dict, extracted_data: Dict[str, Any]):
        """Extrae totales, ingresos y egresos de las tablas"""
        mappings = {
            'Total Ingreso Ruta': 'total_ingreso_ruta',
            'Total Ingreso Oficina': 'total_ingreso_oficina',
            'Total ingresos': 'total_ingresos',
            'Losa': 'losa',
            'Pensión': 'pension',
            'Cena': 'cena',
            'Viáticos': 'viaticos',
            'Otros': 'otros',
            'Total Egresos': 'total_egresos'
        }
        
        for (row, col), text in cell_data.items():
            # Limpiar el texto de caracteres especiales
            clean_text = text.split('\n')[0].strip() if '\n' in text else text.strip()
            
            field_name = mappings.get(clean_text)
            if field_name:
                # Buscar valor en la siguiente columna
                value_cell = cell_data.get((row, col + 1), '').strip()
                
                if value_cell and not extracted_data.get(field_name):
                    # Limpiar valor de caracteres especiales
                    clean_value = value_cell.split('\n')[0] if '\n' in value_cell else value_cell
                    clean_value = clean_value.split(':')[0] if ':' in clean_value else clean_value
                    
                    parsed_value = self._parse_money(clean_value)
                    if parsed_value is not None:
                        extracted_data[field_name] = parsed_value
    
    def _validate_and_fix_data(self, extracted_data: Dict[str, Any]):
        """
        Valida y corrige datos inconsistentes basándose en las tablas
        
        Args:
            extracted_data: Datos extraídos a validar y corregir
        """
        try:
            # Corregir datos usando las tablas como fuente principal de verdad
            tablas = extracted_data.get('tablas', [])
            
            # Validar que las tarifas sean valores monetarios válidos
            for i in range(1, 7):
                tarifa_field = f'tarifa_{i}'
                tarifa_value = extracted_data.get(tarifa_field)
                
                # Si la tarifa no es un número válido, buscar en tablas
                if tarifa_value is None or not isinstance(tarifa_value, (int, float)):
                    extracted_data[tarifa_field] = None
            
            # Validar boletos finales - no deberían ser valores monetarios
            for i in range(1, 7):
                b_final_field = f'b_final_{i}'
                b_final_value = extracted_data.get(b_final_field)
                
                # Si el boleto final es un valor muy alto (>1000), probablemente es erróneo
                if isinstance(b_final_value, (int, float)) and b_final_value > 1000:
                    logger.warning(f"Valor sospechoso en {b_final_field}: {b_final_value}")
                    # Buscar valor más razonable en las tablas
                    extracted_data[b_final_field] = self._find_correct_boleto_value(tablas, i)
            
            # Validar códigos y números - deben ser strings cortos
            string_fields = ['codigo_origen', 'codigo_retorno', 'numero_bus', 'numero_planilla']
            for field in string_fields:
                value = extracted_data.get(field)
                if value and len(str(value)) > 20:  # Muy largo para ser un código
                    extracted_data[field] = self._extract_correct_code(tablas, field)
            
            # Validar fecha - NO sobrescribir si ya se extrajo de tablas
            fecha = extracted_data.get('fecha')
            # Solo intentar extraer fecha si está completamente vacía
            if not fecha:
                extracted_data['fecha'] = self._extract_correct_date(tablas)
            
            logger.info("Validación y corrección de datos completada")
            
        except Exception as e:
            logger.error("Error validating data: %s", e)
    
    def _find_correct_boleto_value(self, tablas: list, column: int) -> int:
        """Busca el valor correcto de boleto en las tablas"""
        # Implementación simplificada - busca valores razonables (< 1000)
        for tabla in tablas:
            for cell in tabla.get('cells', []):
                if (cell.get('column_index') == column and 
                    cell.get('text', '').isdigit() and
                    int(cell.get('text', '0')) < 1000):
                    return int(cell.get('text'))
        return 0
    
    def _extract_correct_code(self, tablas: list, field: str) -> str:
        """Extrae el código correcto de las tablas"""
        # Mapeo de campos a etiquetas esperadas en tablas
        label_map = {
            'codigo_origen': 'Código Origen',
            'codigo_retorno': 'Código Retorno',
            'numero_bus': 'Número Bus',
            'numero_planilla': 'Nro Planilla'
        }
        
        target_label = label_map.get(field)
        if not target_label:
            return ''
            
        # Buscar en las tablas
        for tabla in tablas:
            cells = tabla.get('cells', [])
            for i, cell in enumerate(cells):
                if cell.get('text') == target_label:
                    # Buscar el valor en la siguiente celda de la misma fila
                    for next_c in cells[i+1:]:
                        if (next_c.get('row_index') == cell.get('row_index') and
                            next_c.get('column_index') == cell.get('column_index') + 1):
                            return next_c.get('text', '')
        return ''
    
    def _extract_correct_date(self, tablas: list) -> str:
        """Extrae la fecha correcta de las tablas"""
        for tabla in tablas:
            for cell in tabla.get('cells', []):
                text = cell.get('text', '')
                if self._is_valid_date_format(text):
                    return text
        return ''
    
    def _is_valid_date_format(self, text: str) -> bool:
        """Valida si un texto tiene formato de fecha válido"""
        if not text:
            return False
        
        # Buscar patrones de fecha comunes: dd-mm-yyyy, dd/mm/yyyy, etc.
        import re
        date_patterns = [
            r'\d{1,2}[-/]\d{1,2}[-/]\d{4}',
            r'\d{4}[-/]\d{1,2}[-/]\d{1,2}',
        ]
        
        for pattern in date_patterns:
            if re.match(pattern, text.strip()):
                return True
        return False

    def _parse_money(self, value):
        """
        Convierte un valor monetario a entero, manejando puntos y comas.
        Ejemplo: "1.294.500" -> 1294500
        """
        if value is None:
            return None
        try:
            # Remover caracteres no numéricos excepto puntos y comas
            cleaned = ''.join(c for c in str(value) if c.isdigit() or c in '.,')
            # Remover puntos de miles y convertir comas decimales a puntos
            if '.' in cleaned and ',' in cleaned:
                # Formato: 1.234.567,89 -> 1234567.89
                cleaned = cleaned.replace('.', '').replace(',', '.')
            elif '.' in cleaned and cleaned.count('.') > 1:
                # Formato: 1.234.567 -> 1234567
                cleaned = cleaned.replace('.', '')
            elif ',' in cleaned:
                # Formato: 1234,56 -> 1234.56
                cleaned = cleaned.replace(',', '.')
            
            # Convertir a float primero y luego a int para manejar decimales
            return int(float(cleaned)) if cleaned else None
        except (ValueError, TypeError):
            return None
    
    def _parse_int(self, value):
        """
        Convierte un valor a entero, manejando espacios y casos especiales.
        """
        if value is None:
            return None
        try:
            # Remover espacios y caracteres no numéricos
            cleaned = ''.join(c for c in str(value) if c.isdigit())
            return int(cleaned) if cleaned else None
        except (ValueError, TypeError):
            return None

    def test_connection(self) -> Dict[str, Any]:
        """
        Probar la conexión con Azure Form Recognizer.
        
        Returns:
            Dict con el resultado de la prueba
        """
        if not self.is_configured():
            return {
                'success': False,
                'error': 'Azure Form Recognizer not configured',
                'endpoint': self.endpoint,
                'key_configured': bool(self.key)
            }

        # Validación ligera: cliente inicializado y credenciales presentes
        return {
            'success': True,
            'message': 'Azure Form Recognizer client configured',
            'endpoint': self.endpoint,
            'key_configured': True
        }


# Instancia global del servicio
azure_service = AzureFormRecognizerService()
