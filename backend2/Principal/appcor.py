from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import zipfile
import shutil
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime, timedelta
import json
from PIL import Image
import io
import subprocess
import threading
import time
import cairosvg  # Para SVG
from pillow_heif import register_heif_opener  # Para HEIF

try:
    from rembg import remove, new_session
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False

# Registrar soporte HEIF en Pillow
try:
    register_heif_opener()
    HEIF_SUPPORT = True
except:
    HEIF_SUPPORT = False

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
MAX_CONTENT_LENGTH = 500 * 1024 * 1024  

# Formatos que PIL puede manejar directamente
STANDARD_FORMATS = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif'}

# Formatos que requieren conversión especial
SPECIAL_FORMATS = {'svg', 'heif', 'heic', 'eps', 'ai', 'psd', 'raw'}

ALLOWED_EXTENSIONS = STANDARD_FORMATS | SPECIAL_FORMATS | {'zip'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ============================================================================
# FUNCIONES DE CONVERSIÓN PARA FORMATOS ESPECIALES
# ============================================================================

def convert_svg_to_png(svg_path, output_path, width=None, height=None):
    """Convertir SVG a PNG usando cairosvg"""
    try:
        if width and height:
            cairosvg.svg2png(url=svg_path, write_to=output_path, 
                           output_width=width, output_height=height)
        else:
            cairosvg.svg2png(url=svg_path, write_to=output_path)
        return True, "SVG convertido a PNG"
    except Exception as e:
        return False, f"Error convirtiendo SVG: {str(e)}"

def convert_heif_to_png(heif_path, output_path):
    """Convertir HEIF/HEIC a PNG"""
    try:
        if not HEIF_SUPPORT:
            return False, "HEIF no soportado (instala pillow-heif)"
        
        with Image.open(heif_path) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            img.save(output_path, 'PNG', optimize=True)
        return True, "HEIF convertido a PNG"
    except Exception as e:
        return False, f"Error convirtiendo HEIF: {str(e)}"

def convert_eps_to_png(eps_path, output_path):
    """Convertir EPS/AI a PNG usando Ghostscript"""
    try:
        # Intentar con Pillow primero
        with Image.open(eps_path) as img:
            img.load(scale=2)  # Mayor resolución
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            img.save(output_path, 'PNG', optimize=True)
        return True, "EPS convertido a PNG"
    except Exception as e:
        # Intentar con Ghostscript como fallback
        try:
            subprocess.run([
                'gs', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-sDEVICE=pngalpha',
                '-r300', f'-sOutputFile={output_path}', eps_path
            ], check=True, capture_output=True)
            return True, "EPS convertido a PNG (Ghostscript)"
        except:
            return False, f"Error convirtiendo EPS: {str(e)}"

def convert_psd_to_png(psd_path, output_path):
    """Convertir PSD a PNG"""
    try:
        from psd_tools import PSDImage
        psd = PSDImage.open(psd_path)
        img = psd.topil()
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        img.save(output_path, 'PNG', optimize=True)
        return True, "PSD convertido a PNG"
    except ImportError:
        # Fallback: intentar con Pillow directamente
        try:
            with Image.open(psd_path) as img:
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                img.save(output_path, 'PNG', optimize=True)
            return True, "PSD convertido a PNG (Pillow)"
        except Exception as e:
            return False, f"Error convirtiendo PSD: {str(e)}"
    except Exception as e:
        return False, f"Error convirtiendo PSD: {str(e)}"

def normalize_image_format(image_path):
    """
    Convierte cualquier formato de imagen a PNG estandarizado
    Retorna: (success, converted_path, message)
    """
    file_ext = os.path.splitext(image_path)[1].lower().replace('.', '')
    
    # Si ya es un formato estándar que PIL maneja bien
    if file_ext in STANDARD_FORMATS:
        return True, image_path, f"Formato {file_ext.upper()} soportado"
    
    # Crear ruta de salida temporal
    temp_output = os.path.join(
        os.path.dirname(image_path),
        f"normalized_{uuid.uuid4()}.png"
    )
    
    try:
        # SVG
        if file_ext == 'svg':
            success, msg = convert_svg_to_png(image_path, temp_output)
            if success:
                return True, temp_output, msg
            return False, None, msg
        
        # HEIF/HEIC
        elif file_ext in ['heif', 'heic']:
            success, msg = convert_heif_to_png(image_path, temp_output)
            if success:
                return True, temp_output, msg
            return False, None, msg
        
        # EPS/AI
        elif file_ext in ['eps', 'ai']:
            success, msg = convert_eps_to_png(image_path, temp_output)
            if success:
                return True, temp_output, msg
            return False, None, msg
        
        # PSD
        elif file_ext == 'psd':
            success, msg = convert_psd_to_png(image_path, temp_output)
            if success:
                return True, temp_output, msg
            return False, None, msg
        
        # RAW - Requiere rawpy
        elif file_ext == 'raw':
            try:
                import rawpy
                with rawpy.imread(image_path) as raw:
                    rgb = raw.postprocess()
                img = Image.fromarray(rgb)
                img.save(temp_output, 'PNG', optimize=True)
                return True, temp_output, "RAW convertido a PNG"
            except ImportError:
                return False, None, "RAW no soportado (instala rawpy)"
            except Exception as e:
                return False, None, f"Error convirtiendo RAW: {str(e)}"
        
        else:
            return False, None, f"Formato {file_ext} no reconocido"
            
    except Exception as e:
        if os.path.exists(temp_output):
            os.remove(temp_output)
        return False, None, f"Error normalizando formato: {str(e)}"

# ============================================================================
# MODIFICAR process_single_image para usar normalización
# ============================================================================

def process_single_image(image_info, session_folder, options):
    """Procesar una sola imagen según las opciones"""
    input_path = image_info['path']
    original_size = os.path.getsize(input_path)
    
    base_name = os.path.splitext(image_info['original_name'])[0]
    output_filename = f"{base_name}_processed.png"
    temp_path = os.path.join(session_folder, f"temp_{uuid.uuid4()}.png")
    final_path = os.path.join(session_folder, output_filename)
    
    result = {
        'id': image_info['id'],
        'original_name': image_info['original_name'],
        'processed_name': output_filename,
        'success': False,
        'message': '',
        'operations': [],
        'original_size': original_size,
        'final_size': None,
        'size_reduction': None,
        'preview_url': None
    }
    
    current_path = input_path
    temp_files = []
    
    try:
        # PASO 1: Normalizar formato de entrada
        success, normalized_path, norm_msg = normalize_image_format(input_path)
        if not success:
            result['message'] = norm_msg
            return result
        
        if normalized_path != input_path:
            result['operations'].append(norm_msg)
            current_path = normalized_path
            temp_files.append(normalized_path)
        
        # PASO 2: Obtener dimensiones originales
        try:
            with Image.open(current_path) as img:
                original_dimensions = img.size
        except Exception as e:
            result['message'] = f"Error leyendo imagen: {str(e)}"
            return result
        
        has_background_removal = options.get('background_removal', False)
        has_resize = options.get('resize', False)
        png_only = options.get('png_optimize_only', False)
        
        # PASO 3: Procesamiento según opciones
        if png_only and not has_background_removal and not has_resize:
            success, message = optimize_png_only(current_path, final_path)
            if success:
                result['operations'].append(message)
            else:
                result['message'] = message
                return result
        else:
            if has_background_removal:
                success, message = remove_background(current_path, temp_path)
                result['operations'].append(message)
                if success:
                    current_path = temp_path
                    temp_files.append(temp_path)
                else:
                    result['message'] = message
                    return result
            
            if has_resize:
                width = options.get('width')
                height = options.get('height')
                success, message = resize_image(current_path, final_path, width, height)
                if message:
                    result['operations'].append(message)
                if not success:
                    result['message'] = message
                    return result
            else:
                if current_path != input_path:
                    shutil.move(current_path, final_path)
                    result['operations'].append("Convertido a PNG optimizado")
                else:
                    success, message = optimize_png_only(current_path, final_path)
                    result['operations'].append(message)
        
        # PASO 4: Resultados finales
        if os.path.exists(final_path):
            final_size = os.path.getsize(final_path)
            size_reduction = ((original_size - final_size) / original_size) * 100
            preview_url = create_image_preview_data(final_path)
            
            result['success'] = True
            result['message'] = 'Procesado exitosamente'
            result['final_size'] = final_size
            result['size_reduction'] = max(0, size_reduction)
            result['path'] = final_path
            result['preview_url'] = preview_url
            
            print(f"✓ {image_info['original_name']}: {original_size//1024}KB -> {final_size//1024}KB (-{size_reduction:.1f}%)")
        else:
            result['message'] = 'Error: archivo final no encontrado'
    
    except Exception as e:
        result['message'] = f'Error procesando: {str(e)}'
        print(f"✗ Error en {image_info['original_name']}: {str(e)}")
    
    finally:
        # Limpiar archivos temporales
        for temp_file in temp_files:
            if os.path.exists(temp_file) and temp_file != final_path:
                try:
                    os.remove(temp_file)
                except:
                    pass
    
    return result

# El resto del código permanece igual...