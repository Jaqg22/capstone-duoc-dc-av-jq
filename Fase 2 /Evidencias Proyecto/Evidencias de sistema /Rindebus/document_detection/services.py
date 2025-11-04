"""
Servicio de detección de documentos usando OpenCV
Clase principal para el procesamiento inteligente de imágenes
"""

import cv2
import numpy as np
from PIL import Image
import io
import time
from typing import Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class DocumentDetectionService:
    """
    Servicio avanzado de detección de documentos usando OpenCV
    """
    
    def __init__(self):
        self.processing_stats = {
            'total_processed': 0,
            'successful_detections': 0,
            'average_processing_time': 0.0
        }
    
    def process_image(self, image_file) -> Dict[str, Any]:
        """
        Procesa una imagen y detecta documentos automáticamente
        
        Args:
            image_file: Archivo de imagen Django UploadedFile
            
        Returns:
            Dict con resultados de la detección
        """
        start_time = time.time()
        
        try:
            # Convertir imagen de Django a OpenCV
            opencv_image = self._convert_django_image_to_opencv(image_file)
            
            if opencv_image is None:
                return self._create_error_result("Error al convertir imagen")
            
            # Obtener dimensiones originales
            original_height, original_width = opencv_image.shape[:2]
            
            # Preprocesar imagen
            processed_image, gray_image, edges = self._preprocess_image(opencv_image)
            
            # Detectar contorno del documento
            document_contour = self._find_document_contour(edges)
            
            # Calcular rectángulo y confianza
            rectangle = self._get_document_rectangle(
                document_contour, 
                (original_width, original_height),
                processed_image.shape[:2]
            )
            
            # Calcular tiempo de procesamiento
            processing_time = time.time() - start_time
            
            # Actualizar estadísticas
            self._update_stats(processing_time, rectangle['confidence'])
            
            return {
                'success': True,
                'rectangle': rectangle,
                'processing_time': processing_time,
                'image_dimensions': {
                    'width': original_width,
                    'height': original_height
                },
                'algorithm_used': 'opencv_canny_advanced',
                'message': f'Documento detectado con {rectangle["confidence"]:.1%} de confianza'
            }
            
        except Exception as e:
            logger.error(f"Error en detección de documento: {str(e)}")
            return self._create_error_result(f"Error interno: {str(e)}")
    
    def crop_document(self, image_file, rectangle: Dict[str, Any]) -> Optional[bytes]:
        """
        Recorta el documento usando las coordenadas proporcionadas
        
        Args:
            image_file: Archivo de imagen Django
            rectangle: Diccionario con coordenadas {x, y, width, height}
            
        Returns:
            Bytes de la imagen recortada o None si hay error
        """
        try:
            # Convertir imagen a OpenCV
            opencv_image = self._convert_django_image_to_opencv(image_file)
            
            if opencv_image is None:
                return None
            
            # Extraer coordenadas
            x = max(0, int(rectangle.get('x', 0)))
            y = max(0, int(rectangle.get('y', 0)))
            width = int(rectangle.get('width', opencv_image.shape[1]))
            height = int(rectangle.get('height', opencv_image.shape[0]))
            
            # Asegurar que las coordenadas estén dentro de los límites
            img_height, img_width = opencv_image.shape[:2]
            x = min(x, img_width - 1)
            y = min(y, img_height - 1)
            width = min(width, img_width - x)
            height = min(height, img_height - y)
            
            # Recortar imagen
            cropped = opencv_image[y:y+height, x:x+width]
            
            # Mejorar la imagen recortada
            enhanced_crop = self._enhance_document(cropped)
            
            # Convertir a bytes
            return self._opencv_to_bytes(enhanced_crop)
            
        except Exception as e:
            logger.error(f"Error al recortar documento: {str(e)}")
            return None
    
    def _convert_django_image_to_opencv(self, image_file) -> Optional[np.ndarray]:
        """Convierte archivo Django a formato OpenCV"""
        try:
            # Leer archivo como PIL Image
            pil_image = Image.open(image_file)
            
            # Convertir a RGB si es necesario
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # Convertir a numpy array para OpenCV (RGB -> BGR)
            opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            
            return opencv_image
            
        except Exception as e:
            logger.error(f"Error convirtiendo imagen: {str(e)}")
            return None
    
    def _preprocess_image(self, image: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Preprocesa la imagen para mejor detección de bordes"""
        
        # Redimensionar si es muy grande (mantener ratio)
        height, width = image.shape[:2]
        max_size = 1200
        
        if max(height, width) > max_size:
            scale = max_size / max(height, width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
        
        # Convertir a escala de grises
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Aplicar filtro bilateral para reducir ruido preservando bordes
        gray = cv2.bilateralFilter(gray, 11, 17, 17)
        
        # Detectar bordes usando Canny adaptativo
        # Calcular umbrales automáticamente usando método de Otsu
        high_thresh, _ = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        low_thresh = 0.5 * high_thresh
        
        edges = cv2.Canny(gray, low_thresh, high_thresh, apertureSize=3, L2gradient=True)
        
        # Operación morfológica para conectar bordes cercanos
        kernel = np.ones((3, 3), np.uint8)
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=1)
        
        return image, gray, edges
    
    def _find_document_contour(self, edges: np.ndarray) -> Optional[np.ndarray]:
        """Encuentra el contorno más probable del documento"""
        
        # Encontrar contornos
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return None
        
        # Filtrar contornos por área mínima
        height, width = edges.shape
        min_area = (width * height) * 0.05  # Al menos 5% del área total
        
        valid_contours = []
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > min_area:
                # Aproximar contorno a polígono
                epsilon = 0.02 * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                
                # Calcular métricas del contorno
                aspect_ratio = self._calculate_aspect_ratio(approx)
                solidity = self._calculate_solidity(contour)
                
                valid_contours.append({
                    'contour': contour,
                    'approx': approx,
                    'area': area,
                    'aspect_ratio': aspect_ratio,
                    'solidity': solidity,
                    'score': self._calculate_contour_score(approx, area, aspect_ratio, solidity)
                })
        
        if not valid_contours:
            return None
        
        # Ordenar por puntuación y seleccionar el mejor
        valid_contours.sort(key=lambda x: x['score'], reverse=True)
        
        return valid_contours[0]['approx']
    
    def _calculate_aspect_ratio(self, contour: np.ndarray) -> float:
        """Calcula la relación de aspecto del contorno"""
        x, y, w, h = cv2.boundingRect(contour)
        return float(h) / float(w) if w > 0 else 0
    
    def _calculate_solidity(self, contour: np.ndarray) -> float:
        """Calcula la solidez del contorno (área / área del hull convexo)"""
        area = cv2.contourArea(contour)
        hull = cv2.convexHull(contour)
        hull_area = cv2.contourArea(hull)
        return area / hull_area if hull_area > 0 else 0
    
    def _calculate_contour_score(self, approx: np.ndarray, area: float, 
                                aspect_ratio: float, solidity: float) -> float:
        """Calcula una puntuación para determinar qué tan probable es que sea un documento"""
        
        score = 0
        
        # Preferir contornos con 4 puntos (rectángulos)
        if len(approx) == 4:
            score += 40
        elif len(approx) >= 4:
            score += 20
        
        # Preferir proporciones típicas de documentos (vertical)
        if 1.2 <= aspect_ratio <= 1.8:
            score += 30
        elif 0.6 <= aspect_ratio <= 2.0:
            score += 15
        
        # Preferir contornos sólidos (no muy cóncavos)
        if solidity >= 0.8:
            score += 20
        elif solidity >= 0.6:
            score += 10
        
        # Bonificación por área grande
        score += min(10, area / 100000)
        
        return score
    
    def _get_document_rectangle(self, contour: Optional[np.ndarray], 
                              original_size: Tuple[int, int],
                              processed_size: Tuple[int, int]) -> Dict[str, Any]:
        """Calcula el rectángulo del documento y escala a dimensiones originales"""
        
        orig_width, orig_height = original_size
        proc_height, proc_width = processed_size
        
        # Calcular factores de escala
        scale_x = orig_width / proc_width
        scale_y = orig_height / proc_height
        
        if contour is None:
            # Rectángulo por defecto inteligente
            margin_x = orig_width * 0.08
            margin_y = orig_height * 0.08
            
            return {
                'x': int(margin_x),
                'y': int(margin_y),
                'width': int(orig_width - 2 * margin_x),
                'height': int(orig_height - 2 * margin_y),
                'confidence': 0.3,
                'points': [],
                'method': 'default_intelligent'
            }
        
        # Obtener rectángulo delimitador
        x, y, w, h = cv2.boundingRect(contour)
        
        # Escalar coordenadas
        x = int(x * scale_x)
        y = int(y * scale_y)
        w = int(w * scale_x)
        h = int(h * scale_y)
        
        # Calcular confianza basada en múltiples factores
        contour_area = cv2.contourArea(contour)
        rect_area = w * h / (scale_x * scale_y)  # Área en coordenadas procesadas
        area_ratio = contour_area / rect_area if rect_area > 0 else 0
        
        # Factores de confianza
        area_confidence = min(1.0, area_ratio * 1.2)
        aspect_confidence = self._calculate_aspect_confidence(h / w if w > 0 else 0)
        size_confidence = min(1.0, (w * h) / (orig_width * orig_height * 0.1))
        
        overall_confidence = (area_confidence * 0.4 + 
                             aspect_confidence * 0.3 + 
                             size_confidence * 0.3)
        
        # Obtener puntos del contorno
        points = self._extract_corner_points(contour, scale_x, scale_y)
        
        return {
            'x': x,
            'y': y,
            'width': w,
            'height': h,
            'confidence': float(overall_confidence),
            'points': points,
            'method': 'opencv_contour_analysis'
        }
    
    def _calculate_aspect_confidence(self, aspect_ratio: float) -> float:
        """Calcula confianza basada en la relación de aspecto"""
        # Los documentos típicos tienen ratios entre 1.2 y 1.8
        if 1.2 <= aspect_ratio <= 1.8:
            return 1.0
        elif 1.0 <= aspect_ratio <= 2.0:
            return 0.8
        elif 0.7 <= aspect_ratio <= 2.5:
            return 0.6
        else:
            return 0.3
    
    def _extract_corner_points(self, contour: np.ndarray, 
                              scale_x: float, scale_y: float) -> list:
        """Extrae los puntos de las esquinas del contorno"""
        if len(contour) < 4:
            return []
        
        # Obtener el contorno aproximado
        epsilon = 0.02 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)
        
        if len(approx) >= 4:
            # Ordenar puntos: top-left, top-right, bottom-right, bottom-left
            points = approx.reshape(-1, 2)
            
            # Encontrar esquinas usando sumas y diferencias
            sums = points.sum(axis=1)
            diffs = np.diff(points, axis=1).flatten()
            
            top_left = points[np.argmin(sums)]
            bottom_right = points[np.argmax(sums)]
            top_right = points[np.argmin(diffs)]
            bottom_left = points[np.argmax(diffs)]
            
            # Escalar puntos
            corners = [top_left, top_right, bottom_right, bottom_left]
            scaled_corners = []
            
            for corner in corners:
                scaled_corners.append({
                    'x': int(corner[0] * scale_x),
                    'y': int(corner[1] * scale_y)
                })
            
            return scaled_corners[:4]  # Máximo 4 puntos
        
        return []
    
    def _enhance_document(self, image: np.ndarray) -> np.ndarray:
        """Mejora la calidad del documento recortado"""
        
        # Convertir a escala de grises para análisis
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Aplicar corrección gamma para mejorar contraste
        gamma = self._calculate_optimal_gamma(gray)
        enhanced = self._adjust_gamma(image, gamma)
        
        # Aplicar filtro de sharpening sutil
        kernel = np.array([[-1,-1,-1],
                          [-1, 9,-1],
                          [-1,-1,-1]])
        sharpened = cv2.filter2D(enhanced, -1, kernel * 0.1)
        
        # Mezclar imagen original con sharpened
        result = cv2.addWeighted(enhanced, 0.8, sharpened, 0.2, 0)
        
        return result
    
    def _calculate_optimal_gamma(self, gray_image: np.ndarray) -> float:
        """Calcula el gamma óptimo basado en el histograma"""
        hist = cv2.calcHist([gray_image], [0], None, [256], [0, 256])
        
        # Calcular percentiles
        total_pixels = gray_image.shape[0] * gray_image.shape[1]
        cumsum = np.cumsum(hist.flatten())
        
        # Encontrar percentil 50 (mediana)
        median_idx = np.where(cumsum >= total_pixels * 0.5)[0][0]
        
        # Calcular gamma basado en la mediana
        if median_idx < 128:
            gamma = 1.2  # Imagen oscura, aclarar
        else:
            gamma = 0.8  # Imagen clara, oscurecer ligeramente
        
        return gamma
    
    def _adjust_gamma(self, image: np.ndarray, gamma: float) -> np.ndarray:
        """Aplica corrección gamma"""
        inv_gamma = 1.0 / gamma
        table = np.array([((i / 255.0) ** inv_gamma) * 255
                         for i in np.arange(0, 256)]).astype("uint8")
        
        return cv2.LUT(image, table)
    
    def _opencv_to_bytes(self, opencv_image: np.ndarray, 
                        format_ext: str = '.jpg', quality: int = 95) -> bytes:
        """Convierte imagen OpenCV a bytes"""
        
        # Configurar parámetros de codificación
        encode_params = []
        if format_ext.lower() == '.jpg':
            encode_params = [cv2.IMWRITE_JPEG_QUALITY, quality]
        elif format_ext.lower() == '.png':
            encode_params = [cv2.IMWRITE_PNG_COMPRESSION, 1]
        
        # Codificar imagen
        success, encoded_image = cv2.imencode(format_ext, opencv_image, encode_params)
        
        if success:
            return encoded_image.tobytes()
        else:
            raise Exception("Error al codificar imagen")
    
    def _create_error_result(self, message: str) -> Dict[str, Any]:
        """Crea un resultado de error estandarizado"""
        return {
            'success': False,
            'error': message,
            'rectangle': None,
            'processing_time': 0.0
        }
    
    def _update_stats(self, processing_time: float, confidence: float):
        """Actualiza estadísticas del servicio"""
        self.processing_stats['total_processed'] += 1
        
        if confidence >= 0.5:
            self.processing_stats['successful_detections'] += 1
        
        # Actualizar tiempo promedio
        total = self.processing_stats['total_processed']
        current_avg = self.processing_stats['average_processing_time']
        new_avg = ((current_avg * (total - 1)) + processing_time) / total
        self.processing_stats['average_processing_time'] = new_avg
    
    def get_service_stats(self) -> Dict[str, Any]:
        """Devuelve estadísticas del servicio"""
        total = self.processing_stats['total_processed']
        successful = self.processing_stats['successful_detections']
        
        return {
            'total_processed': total,
            'successful_detections': successful,
            'success_rate': (successful / total * 100) if total > 0 else 0,
            'average_processing_time': self.processing_stats['average_processing_time']
        }