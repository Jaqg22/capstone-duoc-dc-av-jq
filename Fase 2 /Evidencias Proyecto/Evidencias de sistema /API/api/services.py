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
        Extrae datos de las tablas Y de los campos detectados por Azure Form Recognizer.
        
        Args:
            extracted_data: Datos extraídos de Azure
            
        Returns:
            Datos procesados específicos para planillas
        """
        try:
            # PASO 1: Extraer datos de los campos detectados por Azure Form Recognizer
            self._extract_from_azure_fields(extracted_data)
            
            # PASO 2: Extraer datos de las tablas (para completar datos faltantes)
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
            
            logger.info("Datos extraídos exitosamente de Azure Form Recognizer")
            
        except Exception as e:
            logger.error("Error processing planilla data: %s", e)
            extracted_data['processing_error'] = str(e)
        
        return extracted_data
    
    def _extract_from_azure_fields(self, extracted_data: Dict[str, Any]):
        """
        Extrae datos de los campos detectados directamente por Azure Form Recognizer
        
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
            
            # Actualizar solo los campos que no sean None
            for key, value in field_mapping.items():
                if value is not None:
                    extracted_data[key] = value
            
            logger.info(f"Campos extraídos de Azure Form Recognizer: {list(fields.keys())}")
            
        except Exception as e:
            logger.error("Error extracting from Azure fields: %s", e)
    
    def _extract_from_table(self, cell_data: Dict, extracted_data: Dict[str, Any]):
        """
        Extrae datos específicos de una tabla basándose en su contenido
        
        Args:
            cell_data: Diccionario con datos de celdas {(row, col): text}
            extracted_data: Diccionario de datos extraídos a actualizar
        """
        # Buscar información básica en tablas de 2 columnas
        for (row, col), text in cell_data.items():
            if col == 0:  # Primera columna contiene etiquetas
                value_cell = cell_data.get((row, 1), None)  # Segunda columna contiene valores
                
                # Mapeo de etiquetas a campos del modelo
                label_mappings = {
                    'Ciudad Origen': 'codigo_origen',
                    'Código Origen': 'codigo_origen',
                    'Ciudad Retorno': 'codigo_retorno',
                    'Código Retorno': 'codigo_retorno', 
                    'Número Bus': 'numero_bus',
                    'Horario Horigen': 'horario_origen',
                    'Horario Origen': 'horario_origen',
                    'Horario Retorno': 'horario_retorno',
                    'Nro Planilla': 'numero_planilla',
                    'Fecha': 'fecha',
                    'Cód. Conductor': 'codigo_conductor',
                    'Cód. Asistente': 'codigo_asistente'
                }
                
                field_name = label_mappings.get(text)
                if field_name and value_cell and extracted_data.get(field_name) is None:
                    # Solo actualizar si el campo aún no tiene valor
                    extracted_data[field_name] = value_cell
        
        # Buscar tarifas en tabla de tarifas/tickets
        tarifa_row = None
        for (row, col), text in cell_data.items():
            if 'Tarifas/Tickets' in text:
                tarifa_row = row + 1  # La fila siguiente contiene los valores
                break
            elif text in ['2000', '1000', '3000', '4000'] and col == 1:
                tarifa_row = row  # Ya estamos en la fila de valores
                break
        
        if tarifa_row is not None:
            # Extraer tarifas (fila con valores monetarios)
            for col in range(1, 7):  # Columnas 1-6 para tarifas 1-6
                value = cell_data.get((tarifa_row, col))
                if value:
                    tarifa_num = f'tarifa_{col}'
                    # Solo actualizar si el campo aún no tiene valor
                    if extracted_data.get(tarifa_num) is None:
                        extracted_data[tarifa_num] = self._parse_money(value)
        
        # Buscar boletos iniciales y finales en tabla de oficina
        # Buscar las filas de datos de boletos (ParRal, Talca, Santiago, etc.)
        for (row, col), text in cell_data.items():
            if text in ['ParRal', 'Talca', 'Santiago'] and col == 0:
                # Extraer boletos iniciales y finales de esta fila
                for ticket_col in range(1, 7):  # Columnas 1-6 para boletos 1-6
                    inicial_value = cell_data.get((row, ticket_col))
                    
                    # Para boletos finales, buscar en la última fila con datos (ParRal final)
                    if text == 'ParRal':
                        # Determinar si es la primera o última aparición de ParRal
                        parral_rows = [r for (r, c), t in cell_data.items() if t == 'ParRal' and c == 0]
                        if parral_rows:
                            first_parral = min(parral_rows)
                            last_parral = max(parral_rows)
                            
                            if row == first_parral and inicial_value:
                                # Primera fila de ParRal = boletos iniciales
                                field_name = f'b_inicial_{ticket_col}'
                                extracted_data[field_name] = self._parse_int(inicial_value)
                            elif row == last_parral and inicial_value:
                                # Última fila de ParRal = boletos finales
                                field_name = f'b_final_{ticket_col}'
                                extracted_data[field_name] = self._parse_int(inicial_value)
        
        # Buscar totales e ingresos en tabla de totales
        ingreso_egreso_mappings = {
            'T. Ingreso Ruta (1)': 'total_ingreso_ruta',
            'Total Ingreso Ruta': 'total_ingreso_ruta',
            'T. Ingreso Oficina (2)': 'total_ingreso_oficina',
            'Total Ingreso Oficina': 'total_ingreso_oficina',
            'Total Ingresos': 'total_ingresos',
            'Total ingresos': 'total_ingresos',
            'Losa (4)': 'losa',
            'Losa': 'losa',
            'Pensión (5)': 'pension',
            'Pensión': 'pension',
            'Cena (6)': 'cena',
            'Cena': 'cena',
            'Viáticos (3)': 'viaticos',
            'Viáticos': 'viaticos',
            'Otros (7)': 'otros',
            'Otros': 'otros',
            'Total Egresos (3 + 4 + 5 + 6 + 7)': 'total_egresos',
            'Total Egresos': 'total_egresos'
        }
        
        for (row, col), text in cell_data.items():
            field_name = ingreso_egreso_mappings.get(text)
            if field_name:
                # Buscar el valor en la siguiente columna
                value_cell = cell_data.get((row, col + 1))
                if value_cell and extracted_data.get(field_name) is None:
                    # Solo actualizar si el campo aún no tiene valor
                    # Limpiar valores con texto adicional como "(1 + 2)"
                    clean_value = value_cell.split('\n')[0] if '\n' in value_cell else value_cell
                    clean_value = clean_value.split('(')[0].strip() if '(' in clean_value else clean_value
                    extracted_data[field_name] = self._parse_money(clean_value)
    
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
