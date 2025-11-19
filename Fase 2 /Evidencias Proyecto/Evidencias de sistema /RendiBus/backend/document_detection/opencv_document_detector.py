"""
Servicio de detección de documentos usando OpenCV puro
Optimizado para detección robusta de hojas y documentos
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
        """Inicializar el servicio OpenCV para detección de documentos"""
        self.min_area_ratio = 0.05  # Mínimo 5% del área de la imagen
        self.max_area_ratio = 0.95  # Máximo 95% del área de la imagen
        self.epsilon_factors = [0.01, 0.02, 0.03, 0.05, 0.07]  # Diferentes precisiones
        
    def process_document(self, image_file) -> Dict:
        """
        Detectar documento usando OpenCV con múltiples algoritmos
        """
        try:
            logger.info("🔍 Iniciando detección con OpenCV...")
            
            # Leer imagen
            image = Image.open(image_file)
            original_size = image.size
            logger.info(f"📏 Imagen: {original_size[0]}x{original_size[1]}")
            
            # Convertir a numpy array
            img_array = np.array(image)
            
            # Detectar documento con algoritmos progresivos
            corners = self._detect_document_progressive(img_array)
            
            if corners:
                logger.info("✅ Documento detectado exitosamente")
                confidence = 0.9
                message = "Documento detectado con OpenCV"
            else:
                logger.warning("⚠️ Usando área completa como fallback")
                corners = self._get_full_area_corners(original_size)
                confidence = 0.3
                message = "Usando imagen completa"
            
            return {
                'success': True,
                'document_found': bool(corners),
                'corners': corners,
                'confidence': confidence,
                'original_size': original_size,
                'message': message
            }
            
        except Exception as e:
            logger.error(f"❌ Error en OpenCV: {str(e)}")
            return {
                'success': False,
                'document_found': False,
                'corners': None,
                'confidence': 0.0,
                'error': str(e),
                'message': 'Error en detección OpenCV'
            }
    
    def _detect_document_progressive(self, img_array: np.ndarray) -> Optional[List[List[int]]]:
        """Detección progresiva con múltiples técnicas"""
        
        # Convertir a gris
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array.copy()
        
        # Técnica 1: Detección por bordes Canny mejorada
        corners = self._detect_with_advanced_canny(gray)
        if corners:
            logger.info("✅ Detectado con Canny avanzado")
            return corners
        
        # Técnica 2: Detección por contornos con preprocessing agresivo
        corners = self._detect_with_aggressive_preprocessing(gray)
        if corners:
            logger.info("✅ Detectado con preprocessing agresivo")
            return corners
        
        # Técnica 3: Detección por gradientes morfológicos
        corners = self._detect_with_morphological_gradients(gray)
        if corners:
            logger.info("✅ Detectado con gradientes morfológicos")
            return corners
        
        # Técnica 4: Detección por líneas Hough
        corners = self._detect_with_hough_lines(gray)
        if corners:
            logger.info("✅ Detectado con líneas Hough")
            return corners
        
        # Técnica 5: Fallback con contorno más grande
        corners = self._detect_largest_contour_fallback(gray)
        if corners:
            logger.info("✅ Detectado con fallback de contorno")
            return corners
        
        return None
    
    def _detect_with_advanced_canny(self, gray: np.ndarray) -> Optional[List[List[int]]]:
        """Detección Canny con múltiples configuraciones"""
        
        # Mejorar contraste primero
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # Diferentes configuraciones de Canny
        canny_configs = [
            # (blur_kernel, low_thresh, high_thresh)
            (5, 50, 150),
            (3, 30, 100),
            (7, 80, 200),
            (5, 100, 250),
            (3, 20, 80)
        ]
        
        for blur_size, low, high in canny_configs:
            # Blur gaussiano
            blurred = cv2.GaussianBlur(enhanced, (blur_size, blur_size), 0)
            
            # Canny
            edges = cv2.Canny(blurred, low, high)
            
            # Operaciones morfológicas para conectar bordes
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
            edges = cv2.dilate(edges, kernel, iterations=2)
            
            # Buscar contornos
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            corners = self._find_best_rectangle(contours, gray.shape)
            if corners:
                return corners
        
        return None
    
    def _detect_with_aggressive_preprocessing(self, gray: np.ndarray) -> Optional[List[List[int]]]:
        """Detección con preprocessing muy agresivo"""
        
        # Técnicas de preprocessing agresivas
        preprocessed_images = []
        
        # 1. Threshold adaptativo + blur
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        adaptive_thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        preprocessed_images.append(adaptive_thresh)
        
        # 2. Threshold Otsu + morfología
        _, otsu_thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        otsu_morph = cv2.morphologyEx(otsu_thresh, cv2.MORPH_CLOSE, kernel)
        preprocessed_images.append(otsu_morph)
        
        # 3. Filtro bilateral + threshold
        bilateral = cv2.bilateralFilter(gray, 9, 75, 75)
        _, bilateral_thresh = cv2.threshold(bilateral, 127, 255, cv2.THRESH_BINARY)
        preprocessed_images.append(bilateral_thresh)
        
        # Probar cada imagen procesada
        for processed_img in preprocessed_images:
            contours, _ = cv2.findContours(processed_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            corners = self._find_best_rectangle(contours, gray.shape)
            if corners:
                return corners
        
        return None
    
    def _detect_with_morphological_gradients(self, gray: np.ndarray) -> Optional[List[List[int]]]:
        """Detección usando gradientes morfológicos"""
        
        # Diferentes tamaños de kernel
        kernel_sizes = [3, 5, 7, 9]
        
        for kernel_size in kernel_sizes:
            # Crear kernel
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
            
            # Gradiente morfológico
            gradient = cv2.morphologyEx(gray, cv2.MORPH_GRADIENT, kernel)
            
            # Threshold
            _, thresh = cv2.threshold(gradient, 50, 255, cv2.THRESH_BINARY)
            
            # Operaciones de cierre
            closing_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
            closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, closing_kernel)
            
            # Buscar contornos
            contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            corners = self._find_best_rectangle(contours, gray.shape)
            if corners:
                return corners
        
        return None
    
    def _detect_with_hough_lines(self, gray: np.ndarray) -> Optional[List[List[int]]]:
        """Detección usando líneas Hough"""
        
        # Canny para detectar bordes
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        
        # Hough lines
        lines = cv2.HoughLines(edges, 1, np.pi/180, threshold=100)
        
        if lines is not None and len(lines) >= 4:
            # Agrupar líneas en horizontales y verticales
            horizontal_lines = []
            vertical_lines = []
            
            for line in lines:
                rho, theta = line[0]
                
                # Convertir a grados
                angle_deg = theta * 180 / np.pi
                
                # Clasificar líneas
                if abs(angle_deg) < 20 or abs(angle_deg - 180) < 20:  # Horizontal
                    horizontal_lines.append((rho, theta))
                elif abs(angle_deg - 90) < 20:  # Vertical
                    vertical_lines.append((rho, theta))
            
            # Si tenemos suficientes líneas, intentar formar rectángulo
            if len(horizontal_lines) >= 2 and len(vertical_lines) >= 2:
                corners = self._form_rectangle_from_lines(
                    horizontal_lines, vertical_lines, gray.shape
                )
                if corners:
                    return corners
        
        return None
    
    def _detect_largest_contour_fallback(self, gray: np.ndarray) -> Optional[List[List[int]]]:
        """Fallback: usar el contorno más grande"""
        
        # Múltiples técnicas de binarización
        binary_techniques = []
        
        # 1. Threshold simple
        _, thresh1 = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        binary_techniques.append(thresh1)
        
        # 2. Threshold Otsu
        _, thresh2 = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        binary_techniques.append(thresh2)
        
        # 3. Threshold adaptativo
        thresh3 = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 15, 10
        )
        binary_techniques.append(thresh3)
        
        for binary_img in binary_techniques:
            contours, _ = cv2.findContours(binary_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Encontrar el contorno más grande
                largest_contour = max(contours, key=cv2.contourArea)
                area = cv2.contourArea(largest_contour)
                img_area = gray.shape[0] * gray.shape[1]
                
                # Verificar que es lo suficientemente grande
                if area > img_area * self.min_area_ratio:
                    # Intentar aproximar a rectángulo
                    for epsilon_factor in self.epsilon_factors:
                        epsilon = epsilon_factor * cv2.arcLength(largest_contour, True)
                        approx = cv2.approxPolyDP(largest_contour, epsilon, True)
                        
                        if len(approx) == 4:
                            corners = [[int(pt[0][0]), int(pt[0][1])] for pt in approx]
                            return self._order_corners(corners)
                    
                    # Si no se puede aproximar, usar bounding rectangle
                    x, y, w, h = cv2.boundingRect(largest_contour)
                    return [[x, y], [x+w, y], [x+w, y+h], [x, y+h]]
        
        return None
    
    def _find_best_rectangle(self, contours: List, image_shape: Tuple[int, int]) -> Optional[List[List[int]]]:
        """Encontrar el mejor rectángulo en los contornos"""
        
        if not contours:
            return None
        
        img_area = image_shape[0] * image_shape[1]
        
        # Ordenar contornos por área (mayor primero)
        sorted_contours = sorted(contours, key=cv2.contourArea, reverse=True)
        
        # Probar los 10 contornos más grandes
        for contour in sorted_contours[:10]:
            area = cv2.contourArea(contour)
            
            # Verificar que el área está en el rango válido
            if area < img_area * self.min_area_ratio or area > img_area * self.max_area_ratio:
                continue
            
            # Intentar aproximar a rectángulo con diferentes precisiones
            for epsilon_factor in self.epsilon_factors:
                epsilon = epsilon_factor * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                
                # Si obtenemos exactamente 4 puntos, es un rectángulo
                if len(approx) == 4:
                    corners = [[int(pt[0][0]), int(pt[0][1])] for pt in approx]
                    
                    # Validar que es un rectángulo válido
                    if self._is_valid_rectangle(corners, image_shape):
                        return self._order_corners(corners)
        
        return None
    
    def _is_valid_rectangle(self, corners: List[List[int]], image_shape: Tuple[int, int]) -> bool:
        """Validar que es un rectángulo válido"""
        
        if len(corners) != 4:
            return False
        
        # Verificar que todos los puntos están dentro de la imagen
        height, width = image_shape[:2]
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
        
        # Los lados opuestos deben ser similares (tolerancia del 30%)
        if len(sides) >= 4:
            ratio1 = min(sides[0], sides[2]) / max(sides[0], sides[2])
            ratio2 = min(sides[1], sides[3]) / max(sides[1], sides[3])
            return ratio1 > 0.7 and ratio2 > 0.7
        
        return False
    
    def _order_corners(self, corners: List[List[int]]) -> List[List[int]]:
        """Ordenar esquinas: top-left, top-right, bottom-right, bottom-left"""
        
        points = np.array(corners, dtype=np.float32)
        
        # Calcular sumas y diferencias
        sums = points.sum(axis=1)
        diffs = np.diff(points, axis=1)
        
        # Ordenar puntos
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
    
    def _form_rectangle_from_lines(self, h_lines: List, v_lines: List, image_shape: Tuple[int, int]) -> Optional[List[List[int]]]:
        """Formar rectángulo a partir de líneas Hough"""
        
        # Tomar las líneas más extremas
        h_rhos = [rho for rho, theta in h_lines]
        v_rhos = [rho for rho, theta in v_lines]
        
        if len(h_rhos) >= 2 and len(v_rhos) >= 2:
            h_rhos.sort()
            v_rhos.sort()
            
            # Usar las líneas más extremas
            top_line = (h_rhos[0], np.pi/2)
            bottom_line = (h_rhos[-1], np.pi/2)
            left_line = (v_rhos[0], 0)
            right_line = (v_rhos[-1], 0)
            
            # Calcular intersecciones (simplificado)
            height, width = image_shape
            
            corners = [
                [max(0, min(v_rhos)), max(0, min(h_rhos))],  # Top-left
                [min(width, max(v_rhos)), max(0, min(h_rhos))],  # Top-right
                [min(width, max(v_rhos)), min(height, max(h_rhos))],  # Bottom-right
                [max(0, min(v_rhos)), min(height, max(h_rhos))]   # Bottom-left
            ]
            
            return corners
        
        return None
    
    def _get_full_area_corners(self, size: Tuple[int, int]) -> List[List[int]]:
        """Obtener esquinas de toda el área con un pequeño margen"""
        
        width, height = size
        margin = 10  # Margen pequeño
        
        return [
            [margin, margin],
            [width - margin, margin],
            [width - margin, height - margin],
            [margin, height - margin]
        ]