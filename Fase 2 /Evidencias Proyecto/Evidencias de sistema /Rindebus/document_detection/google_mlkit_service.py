"""
Detector de documentos optimizado usando solo OpenCV
Diseñado para alta precisión en detección de hojas y documentos
"""

import json
import base64
import numpy as np
from PIL import Image
import io
import cv2
import logging
from typing import Dict, List, Tuple, Optional

logger = logging.getLogger(__name__)

class GoogleMLKitService:
    def __init__(self):
        """Inicializar detector OpenCV optimizado para documentos"""
        self.min_area_ratio = 0.03  # Mínimo 3% del área total
        self.max_area_ratio = 0.97  # Máximo 97% del área total
        
    def process_document(self, image_file) -> Dict:
        """
        Detectar documento usando OpenCV con algoritmos especializados
        """
        try:
            logger.info("🔍 Iniciando detección de documento con OpenCV...")
            
            # Leer imagen
            image = Image.open(image_file)
            original_size = image.size
            logger.info(f"📏 Procesando imagen: {original_size[0]}x{original_size[1]}")
            
            # Convertir a numpy array
            img_array = np.array(image)
            
            # Detectar documento con múltiples algoritmos
            corners, confidence = self._detect_document_multi_algorithm(img_array)
            
            if corners and confidence > 0.5:
                logger.info(f"✅ Documento detectado (confianza: {confidence:.2f})")
                message = f"Documento detectado con OpenCV (confianza: {confidence:.0%})"
            else:
                logger.warning("⚠️ Detección automática falló, usando área completa")
                corners = self._get_safe_area_corners(original_size)
                confidence = 0.3
                message = "Usando área completa con margen de seguridad"
            
            return {
                'success': True,
                'document_found': bool(corners and confidence > 0.5),
                'corners': corners,
                'confidence': confidence,
                'original_size': original_size,
                'message': message
            }
            
        except Exception as e:
            logger.error(f"❌ Error en detección OpenCV: {str(e)}")
            return {
                'success': False,
                'document_found': False,
                'corners': None,
                'confidence': 0.0,
                'error': str(e),
                'message': 'Error en el procesamiento de la imagen'
            }
    
    def _detect_document_multi_algorithm(self, img_array: np.ndarray) -> Tuple[Optional[List[List[int]]], float]:
        """Detectar documento usando múltiples algoritmos en cascada"""
        
        # Convertir a escala de grises
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array.copy()
        
        # Algoritmo 1: Canny + Morfología (mejor para documentos con bordes claros)
        corners, conf = self._algorithm_canny_morphology(gray)
        if corners and conf > 0.75:  # Umbral reducido
            return corners, conf
        
        # Algoritmo 2: Threshold Adaptativo (mejor para documentos en fondos complejos)
        corners2, conf2 = self._algorithm_adaptive_threshold(gray)
        if corners2 and conf2 > max(0.65, conf):  # Umbral reducido
            return corners2, conf2
        
        # Algoritmo 3: Gradiente Sobel (mejor para documentos con poco contraste)
        corners3, conf3 = self._algorithm_sobel_gradient(gray)
        if corners3 and conf3 > max(0.55, conf, conf2):  # Umbral reducido
            return corners3, conf3
        
        # Algoritmo 4: Contorno más grande (fallback robusto)
        corners4, conf4 = self._algorithm_largest_contour(gray)
        if corners4:
            return corners4, max(conf4, 0.4)
        
        # Devolver el mejor resultado encontrado
        best_corners = corners or corners2 or corners3 or corners4
        best_conf = max(conf, conf2, conf3, conf4) if best_corners else 0.0
        
        return best_corners, best_conf
    
    def _algorithm_canny_morphology(self, gray: np.ndarray) -> Tuple[Optional[List[List[int]]], float]:
        """Algoritmo 1: Canny + operaciones morfológicas"""
        
        # Preprocesamiento para mejorar detección
        # 1. Mejorar contraste con CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # 2. Reducir ruido con blur gaussiano
        blurred = cv2.GaussianBlur(enhanced, (5, 5), 0)
        
        # 3. Probar múltiples configuraciones de Canny
        canny_configs = [
            (50, 150),   # Configuración estándar
            (30, 100),   # Más sensible
            (80, 200),   # Menos sensible
            (100, 250)   # Para bordes muy definidos
        ]
        
        best_corners = None
        best_confidence = 0.0
        
        for low_thresh, high_thresh in canny_configs:
            # Detección de bordes Canny
            edges = cv2.Canny(blurred, low_thresh, high_thresh)
            
            # Operaciones morfológicas para conectar bordes fragmentados
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
            edges = cv2.dilate(edges, kernel, iterations=2)
            
            # Encontrar contornos
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            corners, conf = self._extract_document_corners(contours, gray.shape)
            if conf > best_confidence:
                best_corners = corners
                best_confidence = conf
        
        return best_corners, best_confidence
    
    def _algorithm_adaptive_threshold(self, gray: np.ndarray) -> Tuple[Optional[List[List[int]]], float]:
        """Algoritmo 2: Threshold adaptativo"""
        
        # Blur para reducir ruido
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Múltiples configuraciones de threshold adaptativo
        adaptive_configs = [
            (cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 11, 2),
            (cv2.ADAPTIVE_THRESH_MEAN_C, 11, 2),
            (cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 15, 5),
            (cv2.ADAPTIVE_THRESH_MEAN_C, 15, 5)
        ]
        
        best_corners = None
        best_confidence = 0.0
        
        for method, block_size, C in adaptive_configs:
            # Threshold adaptativo
            thresh = cv2.adaptiveThreshold(blurred, 255, method, cv2.THRESH_BINARY, block_size, C)
            
            # Operaciones morfológicas para limpiar
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
            
            # Encontrar contornos
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            corners, conf = self._extract_document_corners(contours, gray.shape)
            if conf > best_confidence:
                best_corners = corners
                best_confidence = conf
        
        return best_corners, best_confidence
    
    def _algorithm_sobel_gradient(self, gray: np.ndarray) -> Tuple[Optional[List[List[int]]], float]:
        """Algoritmo 3: Gradiente Sobel para detectar bordes direccionales"""
        
        # Calcular gradientes Sobel
        sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        
        # Magnitud del gradiente
        magnitude = np.sqrt(sobel_x**2 + sobel_y**2)
        magnitude = np.uint8(magnitude / magnitude.max() * 255)
        
        # Threshold en la magnitud del gradiente
        _, thresh = cv2.threshold(magnitude, 50, 255, cv2.THRESH_BINARY)
        
        # Morfología para conectar bordes
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        # Encontrar contornos
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        return self._extract_document_corners(contours, gray.shape)
    
    def _algorithm_largest_contour(self, gray: np.ndarray) -> Tuple[Optional[List[List[int]]], float]:
        """Algoritmo 4: Fallback usando el contorno más grande"""
        
        # Múltiples técnicas de binarización
        binary_methods = []
        
        # 1. Threshold Otsu
        _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        binary_methods.append(otsu)
        
        # 2. Threshold simple
        _, simple = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        binary_methods.append(simple)
        
        # 3. Threshold adaptativo conservador
        adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 10)
        binary_methods.append(adaptive)
        
        best_corners = None
        best_confidence = 0.0
        
        for binary_img in binary_methods:
            # Encontrar contornos
            contours, _ = cv2.findContours(binary_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Obtener el contorno más grande
                largest_contour = max(contours, key=cv2.contourArea)
                area = cv2.contourArea(largest_contour)
                img_area = gray.shape[0] * gray.shape[1]
                area_ratio = area / img_area
                
                # Verificar que el área es razonable
                if self.min_area_ratio <= area_ratio <= self.max_area_ratio:
                    # Intentar aproximar a rectángulo
                    epsilon = 0.02 * cv2.arcLength(largest_contour, True)
                    approx = cv2.approxPolyDP(largest_contour, epsilon, True)
                    
                    if len(approx) == 4:
                        corners = [[int(pt[0][0]), int(pt[0][1])] for pt in approx]
                        corners = self._order_corners(corners)
                        confidence = min(0.92, area_ratio * 2.2)  # Mayor confianza base
                        
                        if confidence > best_confidence:
                            best_corners = corners
                            best_confidence = confidence
                    elif area_ratio > 0.1:  # Si es un área grande, usar bounding rect
                        x, y, w, h = cv2.boundingRect(largest_contour)
                        corners = [[x, y], [x+w, y], [x+w, y+h], [x, y+h]]
                        confidence = min(0.75, area_ratio * 1.8)  # Mayor confianza para bounding rect
                        
                        if confidence > best_confidence:
                            best_corners = corners
                            best_confidence = confidence
        
        return best_corners, best_confidence
    
    def _extract_document_corners(self, contours: List, image_shape: Tuple[int, int]) -> Tuple[Optional[List[List[int]]], float]:
        """Extraer las esquinas del documento de los contornos"""
        
        if not contours:
            return None, 0.0
        
        img_area = image_shape[0] * image_shape[1]
        best_corners = None
        best_confidence = 0.0
        
        # Evaluar los contornos más prometedores
        for contour in sorted(contours, key=cv2.contourArea, reverse=True)[:15]:
            area = cv2.contourArea(contour)
            area_ratio = area / img_area
            
            # Filtrar por área
            if not (self.min_area_ratio <= area_ratio <= self.max_area_ratio):
                continue
            
            # Intentar aproximar a rectángulo con diferentes precisiones
            for epsilon_factor in [0.01, 0.02, 0.03, 0.05]:
                epsilon = epsilon_factor * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                
                if len(approx) == 4:
                    corners = [[int(pt[0][0]), int(pt[0][1])] for pt in approx]
                    
                    # Validar que es un rectángulo válido
                    if self._is_valid_rectangle(corners, image_shape):
                        corners = self._order_corners(corners)
                        
                        # Calcular confianza basada en área y regularidad
                        confidence = self._calculate_confidence(corners, area_ratio, image_shape)
                        
                        if confidence > best_confidence:
                            best_corners = corners
                            best_confidence = confidence
        
        return best_corners, best_confidence
    
    def _is_valid_rectangle(self, corners: List[List[int]], image_shape: Tuple[int, int]) -> bool:
        """Validar que las esquinas forman un rectángulo válido"""
        
        if len(corners) != 4:
            return False
        
        height, width = image_shape[:2]
        
        # Verificar que todos los puntos están dentro de la imagen
        for x, y in corners:
            if x < 0 or x >= width or y < 0 or y >= height:
                return False
        
        # Calcular los lados del rectángulo
        sides = []
        for i in range(4):
            p1 = corners[i]
            p2 = corners[(i + 1) % 4]
            side_length = np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)
            sides.append(side_length)
        
        # Verificar que los lados opuestos son similares (tolerancia 50% - más permisivo)
        if len(sides) >= 4:
            ratio1 = min(sides[0], sides[2]) / max(sides[0], sides[2]) if max(sides[0], sides[2]) > 0 else 0
            ratio2 = min(sides[1], sides[3]) / max(sides[1], sides[3]) if max(sides[1], sides[3]) > 0 else 0
            return ratio1 > 0.5 and ratio2 > 0.5  # Más permisivo (era 0.6)
        
        return False
    
    def _calculate_confidence(self, corners: List[List[int]], area_ratio: float, image_shape: Tuple[int, int]) -> float:
        """Calcular confianza basada en múltiples factores optimizada"""
        
        # Factor 1: Área (óptima entre 5% y 85% - más rango)
        area_score = 1.0
        if area_ratio < 0.05:
            area_score = area_ratio / 0.05
        elif area_ratio > 0.85:
            area_score = (1.0 - area_ratio) / 0.15
        else:
            # Bonus por área ideal (20% - 70%)
            if 0.2 <= area_ratio <= 0.7:
                area_score = 1.1  # 10% bonus
        
        # Factor 2: Regularidad del rectángulo (mejorado)
        sides = []
        for i in range(4):
            p1 = corners[i]
            p2 = corners[(i + 1) % 4]
            side_length = np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)
            sides.append(side_length)
        
        # Calcular ratios de lados opuestos
        ratio1 = min(sides[0], sides[2]) / max(sides[0], sides[2]) if max(sides[0], sides[2]) > 0 else 0
        ratio2 = min(sides[1], sides[3]) / max(sides[1], sides[3]) if max(sides[1], sides[3]) > 0 else 0
        
        # Mejorar puntuación de regularidad
        regularity_score = (ratio1 + ratio2) / 2
        if regularity_score > 0.9:  # Muy rectangular
            regularity_score = min(1.1, regularity_score * 1.1)  # 10% bonus
        
        # Factor 3: Posición (menos penalización por bordes)
        height, width = image_shape[:2]
        margin_penalty = 1.0
        edge_corners = 0
        for x, y in corners:
            if x < width * 0.03 or x > width * 0.97 or y < height * 0.03 or y > height * 0.97:
                edge_corners += 1
        
        # Penalización más suave por bordes
        if edge_corners > 0:
            margin_penalty = max(0.85, 1.0 - (edge_corners * 0.05))
        
        # Factor 4: Bonus por detección completa
        detection_bonus = 1.05 if area_ratio > 0.15 and regularity_score > 0.8 else 1.0
        
        # Combinar todos los factores
        confidence = area_score * regularity_score * margin_penalty * detection_bonus
        return min(confidence, 0.98)  # Máximo 98% de confianza
    
    def _order_corners(self, corners: List[List[int]]) -> List[List[int]]:
        """Ordenar esquinas: top-left, top-right, bottom-right, bottom-left"""
        
        points = np.array(corners, dtype=np.float32)
        
        # Calcular suma y diferencia de coordenadas
        sums = points.sum(axis=1)
        diffs = np.diff(points, axis=1).flatten()
        
        # Identificar esquinas
        top_left = points[np.argmin(sums)]
        bottom_right = points[np.argmax(sums)]
        top_right = points[np.argmin(diffs)]
        bottom_left = points[np.argmax(diffs)]
        
        return [
            [int(top_left[0]), int(top_left[1])],
            [int(top_right[0]), int(top_right[1])],
            [int(bottom_right[0]), int(bottom_right[1])],
            [int(bottom_left[0]), int(bottom_left[1])]
        ]
    
    def _get_safe_area_corners(self, size: Tuple[int, int]) -> List[List[int]]:
        """Obtener esquinas de área completa con margen de seguridad"""
        
        width, height = size
        # Margen del 2% para evitar cortar contenido importante
        margin_x = max(10, int(width * 0.02))
        margin_y = max(10, int(height * 0.02))
        
        return [
            [margin_x, margin_y],                           # Top-left
            [width - margin_x, margin_y],                   # Top-right
            [width - margin_x, height - margin_y],          # Bottom-right
            [margin_x, height - margin_y]                   # Bottom-left
        ]

    def _expand_corners(self, corners: List[List[int]], image_size: Tuple[int, int], margin_percent: float = 2) -> List[List[int]]:
        """Expandir ligeramente las esquinas para incluir más contenido"""
        
        width, height = image_size
        
        # Convertir a numpy para facilitar cálculos
        corners_array = np.array(corners, dtype=np.float32)
        
        # Calcular el centro del documento
        center_x = np.mean(corners_array[:, 0])
        center_y = np.mean(corners_array[:, 1])
        
        # Calcular factor de expansión
        margin_factor = 1 + (margin_percent / 100)
        
        # Expandir cada esquina alejándola del centro
        expanded_corners = []
        for corner in corners_array:
            x, y = corner
            
            # Vector del centro a la esquina
            dx = x - center_x
            dy = y - center_y
            
            # Expandir
            new_x = center_x + dx * margin_factor
            new_y = center_y + dy * margin_factor
            
            # Asegurar que no salga de los límites de la imagen
            new_x = max(0, min(width - 1, new_x))
            new_y = max(0, min(height - 1, new_y))
            
            expanded_corners.append([int(new_x), int(new_y)])
        
        return expanded_corners

    def crop_document(self, image_file, corners: List[List[int]]) -> bytes:
        """
        Recortar documento usando las esquinas detectadas y aplicar corrección de perspectiva
        """
        try:
            logger.info("🔪 Iniciando recorte de documento...")
            
            # Leer imagen
            image = Image.open(image_file)
            img_array = np.array(image)
            
            if len(corners) != 4:
                raise ValueError("Se requieren exactamente 4 esquinas para el recorte")
            
            # Ordenar las esquinas
            ordered_corners = self._order_corners(corners)
            
            # Expandir ligeramente las esquinas para evitar recorte excesivo
            # Usar más margen para imágenes de alta resolución
            img_area = image.size[0] * image.size[1]
            margin_percent = 3 if img_area > 1000000 else 2  # 3% para imágenes grandes
            expanded_corners = self._expand_corners(ordered_corners, image.size, margin_percent=margin_percent)
            
            # Convertir a array numpy
            src_points = np.array(expanded_corners, dtype=np.float32)
            
            # Calcular dimensiones del rectángulo objetivo
            width = int(max(
                np.linalg.norm(src_points[1] - src_points[0]),  # top side
                np.linalg.norm(src_points[2] - src_points[3])   # bottom side
            ))
            
            height = int(max(
                np.linalg.norm(src_points[3] - src_points[0]),  # left side
                np.linalg.norm(src_points[2] - src_points[1])   # right side
            ))
            
            # Puntos de destino (rectángulo perfecto)
            dst_points = np.array([
                [0, 0],
                [width, 0],
                [width, height],
                [0, height]
            ], dtype=np.float32)
            
            # Calcular matriz de transformación de perspectiva
            matrix = cv2.getPerspectiveTransform(src_points, dst_points)
            
            # Aplicar corrección de perspectiva
            corrected = cv2.warpPerspective(img_array, matrix, (width, height))
            
            # Convertir de vuelta a PIL Image
            corrected_image = Image.fromarray(corrected)
            
            # Convertir a bytes con máxima calidad
            img_byte_arr = io.BytesIO()
            corrected_image.save(img_byte_arr, format='JPEG', quality=98, optimize=True)
            img_bytes = img_byte_arr.getvalue()
            
            logger.info(f"✅ Documento recortado exitosamente: {width}x{height}")
            return img_bytes
            
        except Exception as e:
            logger.error(f"❌ Error en recorte de documento: {str(e)}")
            # Si falla el recorte, devolver imagen original
            image = Image.open(image_file)
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format='JPEG', quality=95)
            return img_byte_arr.getvalue()

    def enhance_document(self, image_bytes: bytes) -> bytes:
        """
        Mejorar calidad del documento aplicando filtros de mejoramiento
        """
        try:
            logger.info("✨ Mejorando calidad del documento...")
            
            # Cargar imagen desde bytes
            image = Image.open(io.BytesIO(image_bytes))
            img_array = np.array(image)
            
            # Si es color, convertir a escala de grises para algunos procesamientos
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array.copy()
            
            # 1. Mejorar contraste con CLAHE
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
            enhanced = clahe.apply(gray)
            
            # 2. Reducir ruido con filtro bilateral
            denoised = cv2.bilateralFilter(enhanced, 9, 75, 75)
            
            # 3. Ajustar brillo y contraste
            alpha = 1.2  # Contraste
            beta = 10    # Brillo
            adjusted = cv2.convertScaleAbs(denoised, alpha=alpha, beta=beta)
            
            # 4. Aplicar sharpening suave
            kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
            sharpened = cv2.filter2D(adjusted, -1, kernel)
            
            # Si la imagen original era a color, convertir de vuelta
            if len(img_array.shape) == 3:
                # Mantener los colores originales pero aplicar mejoras de luminancia
                img_yuv = cv2.cvtColor(img_array, cv2.COLOR_RGB2YUV)
                img_yuv[:,:,0] = sharpened
                enhanced_color = cv2.cvtColor(img_yuv, cv2.COLOR_YUV2RGB)
                final_image = Image.fromarray(enhanced_color)
            else:
                final_image = Image.fromarray(sharpened)
            
            # Convertir a bytes
            img_byte_arr = io.BytesIO()
            final_image.save(img_byte_arr, format='JPEG', quality=95)
            
            logger.info("✅ Documento mejorado exitosamente")
            return img_byte_arr.getvalue()
            
        except Exception as e:
            logger.error(f"❌ Error mejorando documento: {str(e)}")
            return image_bytes  # Devolver imagen original si hay error