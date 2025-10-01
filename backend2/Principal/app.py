from flask import Flask, request, jsonify, send_file, Response
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

# Importaciones para formatos especiales
try:
    import cairosvg
    SVG_SUPPORT = True
except ImportError:
    SVG_SUPPORT = False

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
    HEIF_SUPPORT = True
except ImportError:
    HEIF_SUPPORT = False

try:
    from rembg import remove, new_session
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
MAX_CONTENT_LENGTH = 500 * 1024 * 1024

STANDARD_FORMATS = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif'}
SPECIAL_FORMATS = {'svg', 'heif', 'heic', 'eps', 'ai', 'psd', 'raw'}
ALLOWED_EXTENSIONS = STANDARD_FORMATS | SPECIAL_FORMATS | {'zip'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ============================================================================
# SISTEMA DE LIMPIEZA
# ============================================================================

def schedule_session_cleanup(session_folder, delay=3):
    def cleanup():
        time.sleep(delay)
        try:
            if os.path.exists(session_folder):
                shutil.rmtree(session_folder)
                print(f"✓ Sesión limpiada: {os.path.basename(session_folder)}")
        except Exception as e:
            print(f"✗ Error limpiando sesión: {str(e)}")
    
    threading.Thread(target=cleanup, daemon=True).start()

def cleanup_old_sessions():
    while True:
        try:
            current_time = datetime.now()
            cleaned = 0
            for session_dir in os.listdir(UPLOAD_FOLDER):
                session_path = os.path.join(UPLOAD_FOLDER, session_dir)
                if os.path.isdir(session_path):
                    dir_time = datetime.fromtimestamp(os.path.getctime(session_path))
                    if current_time - dir_time > timedelta(hours=2):
                        shutil.rmtree(session_path)
                        cleaned += 1
            
            if cleaned > 0:
                print(f"🧹 Limpieza: {cleaned} sesiones antiguas eliminadas")
        except Exception as e:
            print(f"Error en limpieza: {str(e)}")
        
        time.sleep(3600)

cleanup_thread = threading.Thread(target=cleanup_old_sessions, daemon=True)
cleanup_thread.start()

# ============================================================================
# CONVERSIÓN DE FORMATOS ESPECIALES
# ============================================================================

def convert_svg_to_png(svg_path, output_path, width=None, height=None):
    try:
        if not SVG_SUPPORT:
            return False, None, "SVG no soportado (instala cairosvg: pip install cairosvg)"
        
        # Intentar con cairosvg
        try:
            if width and height:
                cairosvg.svg2png(url=svg_path, write_to=output_path, 
                               output_width=int(width), output_height=int(height))
            else:
                cairosvg.svg2png(url=svg_path, write_to=output_path, output_width=2000)
            
            # Verificar que se creó el archivo
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                return True, output_path, "SVG convertido a PNG"
            else:
                raise Exception("Archivo PNG no generado correctamente")
                
        except Exception as e:
            # Fallback: Intentar con PIL/Pillow
            print(f"Cairosvg falló, intentando con Pillow: {str(e)}")
            try:
                from PIL import Image
                img = Image.open(svg_path)
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                img.save(output_path, 'PNG', optimize=True)
                return True, output_path, "SVG convertido a PNG (Pillow)"
            except Exception as e2:
                return False, None, f"Error convirtiendo SVG: {str(e2)}"
                
    except Exception as e:
        return False, None, f"Error convirtiendo SVG: {str(e)}"

def convert_heif_to_png(heif_path, output_path):
    try:
        if not HEIF_SUPPORT:
            return False, None, "HEIF no soportado (instala pillow-heif: pip install pillow-heif)"
        
        with Image.open(heif_path) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            img.save(output_path, 'PNG', optimize=True, compress_level=9)
        
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            return True, output_path, "HEIF convertido a PNG"
        return False, None, "Error: archivo no generado"
    except Exception as e:
        return False, None, f"Error convirtiendo HEIF: {str(e)}"

def convert_eps_to_png(eps_path, output_path):
    try:
        with Image.open(eps_path) as img:
            img.load(scale=2)
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            img.save(output_path, 'PNG', optimize=True, compress_level=9)
        
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            return True, output_path, "EPS convertido a PNG"
        return False, None, "Error: archivo no generado"
    except Exception as e:
        try:
            result = subprocess.run([
                'gs', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-sDEVICE=pngalpha',
                '-r300', f'-sOutputFile={output_path}', eps_path
            ], check=True, capture_output=True, timeout=30)
            
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                return True, output_path, "EPS convertido con Ghostscript"
            return False, None, "Error: Ghostscript no generó archivo"
        except:
            return False, None, f"Error convirtiendo EPS: {str(e)}"

def convert_psd_to_png(psd_path, output_path):
    try:
        from psd_tools import PSDImage
        psd = PSDImage.open(psd_path)
        img = psd.topil()
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        img.save(output_path, 'PNG', optimize=True, compress_level=9)
        
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            return True, output_path, "PSD convertido a PNG"
        return False, None, "Error: archivo no generado"
    except ImportError:
        try:
            with Image.open(psd_path) as img:
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                img.save(output_path, 'PNG', optimize=True, compress_level=9)
            
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                return True, output_path, "PSD convertido (Pillow)"
            return False, None, "Error: archivo no generado"
        except Exception as e:
            return False, None, f"Error PSD: {str(e)}"
    except Exception as e:
        return False, None, f"Error PSD: {str(e)}"

def normalize_image_format(image_path):
    file_ext = os.path.splitext(image_path)[1].lower().replace('.', '')
    
    if file_ext in STANDARD_FORMATS:
        return True, image_path, f"Formato {file_ext.upper()} soportado"
    
    temp_output = os.path.join(
        os.path.dirname(image_path),
        f"normalized_{uuid.uuid4()}.png"
    )
    
    try:
        if file_ext == 'svg':
            success, output_path, message = convert_svg_to_png(image_path, temp_output)
            if success and output_path:
                return True, output_path, message
            return False, None, message
        
        elif file_ext in ['heif', 'heic']:
            success, output_path, message = convert_heif_to_png(image_path, temp_output)
            if success and output_path:
                return True, output_path, message
            return False, None, message
        
        elif file_ext in ['eps', 'ai']:
            success, output_path, message = convert_eps_to_png(image_path, temp_output)
            if success and output_path:
                return True, output_path, message
            return False, None, message
        
        elif file_ext == 'psd':
            success, output_path, message = convert_psd_to_png(image_path, temp_output)
            if success and output_path:
                return True, output_path, message
            return False, None, message
        
        elif file_ext == 'raw':
            try:
                import rawpy
                with rawpy.imread(image_path) as raw:
                    rgb = raw.postprocess()
                img = Image.fromarray(rgb)
                img.save(temp_output, 'PNG', optimize=True, compress_level=9)
                
                if os.path.exists(temp_output) and os.path.getsize(temp_output) > 0:
                    return True, temp_output, "RAW convertido a PNG"
                return False, None, "Error: archivo RAW no generado"
            except ImportError:
                return False, None, "RAW no soportado (instala rawpy: pip install rawpy)"
            except Exception as e:
                return False, None, f"Error RAW: {str(e)}"
        
        else:
            return False, None, f"Formato {file_ext} no reconocido"
            
    except Exception as e:
        if os.path.exists(temp_output):
            try:
                os.remove(temp_output)
            except:
                pass
        return False, None, f"Error normalizando: {str(e)}"

# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def is_image_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in (STANDARD_FORMATS | SPECIAL_FORMATS)

def extract_images_from_zip(zip_path, extract_to):
    extracted_images = []
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            for file_info in zip_ref.filelist:
                if not file_info.is_dir() and is_image_file(file_info.filename):
                    try:
                        zip_ref.extract(file_info, extract_to)
                        
                        original_name = os.path.basename(file_info.filename)
                        unique_name = f"{uuid.uuid4()}_{original_name}"
                        
                        old_path = os.path.join(extract_to, file_info.filename)
                        new_path = os.path.join(extract_to, unique_name)
                        
                        if os.path.dirname(file_info.filename):
                            os.makedirs(os.path.dirname(new_path), exist_ok=True)
                        
                        if os.path.exists(old_path):
                            shutil.move(old_path, new_path)
                            extracted_images.append({
                                'filename': unique_name,
                                'original_name': original_name,
                                'path': new_path,
                                'size': os.path.getsize(new_path)
                            })
                    except Exception as e:
                        print(f"Error extrayendo {file_info.filename}: {str(e)}")
                        continue
                        
    except Exception as e:
        return [], str(e)
    
    return extracted_images, None

def optimize_with_oxipng(image_path):
    try:
        result = subprocess.run(['oxipng', '-o', '6', '--strip', 'safe', image_path], 
                              capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            return True, "Optimizado con oxipng"
        else:
            return False, f"Error oxipng: {result.stderr}"
            
    except Exception as e:
        return False, f"Error ejecutando oxipng: {str(e)}"

def force_size_reduction_safe(image_path, original_dimensions, target_reduction_percent=10):
    try:
        original_size = os.path.getsize(image_path)
        target_size = original_size * (1 - target_reduction_percent / 100)
        
        with Image.open(image_path) as img:
            current_dimensions = img.size
            
            if current_dimensions != original_dimensions:
                img = img.resize(original_dimensions, Image.Resampling.LANCZOS)
            
            has_transparency = False
            if img.mode in ('RGBA', 'LA'):
                if img.mode == 'RGBA':
                    try:
                        alpha = img.getchannel('A')
                        alpha_min, alpha_max = alpha.getextrema()
                        has_transparency = alpha_min < 255
                    except:
                        has_transparency = True
                else:
                    has_transparency = True
            
            if has_transparency:
                img.save(image_path, 'PNG', optimize=True, compress_level=9, pnginfo=None)
            else:
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                base_path = os.path.splitext(image_path)[0]
                jpg_path = base_path + '.jpg'
                
                for quality in [85, 80, 75, 70]:
                    img.save(jpg_path, 'JPEG', quality=quality, optimize=True)
                    current_size = os.path.getsize(jpg_path)
                    if current_size < target_size:
                        break
                
                if os.path.exists(image_path):
                    os.remove(image_path)
                os.rename(jpg_path, image_path)
            
            with Image.open(image_path) as final_check:
                final_dimensions = final_check.size
                if final_dimensions != original_dimensions:
                    corrected = final_check.resize(original_dimensions, Image.Resampling.LANCZOS)
                    if final_check.mode in ('RGBA', 'LA'):
                        corrected.save(image_path, 'PNG', optimize=True)
                    else:
                        corrected.save(image_path, 'JPEG', quality=80, optimize=True)
            
            return True, "Peso reducido manteniendo dimensiones"
            
    except Exception as e:
        return False, f"Error en reducción: {str(e)}"

def remove_background(image_path, output_path):
    original_dimensions = None
    try:
        with Image.open(image_path) as img:
            original_dimensions = img.size
    except Exception as e:
        return False, f"Error obteniendo dimensiones: {str(e)}"
    
    if not REMBG_AVAILABLE:
        try:
            with Image.open(image_path) as img:
                if img.size != original_dimensions:
                    img = img.resize(original_dimensions, Image.Resampling.LANCZOS)
                
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                
                img.save(output_path, 'PNG', optimize=True, compress_level=9)
                
                with Image.open(output_path) as check:
                    if check.size != original_dimensions:
                        corrected = check.resize(original_dimensions, Image.Resampling.LANCZOS)
                        corrected.save(output_path, 'PNG', optimize=True)
                
                return True, "Fondo eliminado"
        except Exception as e:
            return False, f"Error: {str(e)}"
    
    try:
        with open(image_path, 'rb') as input_file:
            input_data = input_file.read()
        
        output_data = remove(input_data)
        
        with open(output_path, 'wb') as output_file:
            output_file.write(output_data)
        
        with Image.open(output_path) as img:
            if img.size != original_dimensions:
                img = img.resize(original_dimensions, Image.Resampling.LANCZOS)
            
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            img.save(output_path, 'PNG', optimize=True, compress_level=9, pnginfo=None)
        
        force_size_reduction_safe(output_path, original_dimensions, 15)
        optimize_with_oxipng(output_path)
        
        return True, "Fondo eliminado"
    
    except Exception as e:
        return False, f"Error eliminando fondo: {str(e)}"

def resize_image(image_path, output_path, width=None, height=None):
    try:
        with Image.open(image_path) as img:
            original_dimensions = img.size
            
            if img.mode in ('RGBA', 'LA'):
                pass
            elif 'transparency' in img.info:
                img = img.convert('RGBA')
            else:
                img = img.convert('RGBA')
            
            if width and height:
                target_width = int(width)
                target_height = int(height)
                
                if target_width != original_dimensions[0] or target_height != original_dimensions[1]:
                    img_resized = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
                    message = f"Redimensionado a {target_width}x{target_height}"
                    
                    img_resized.save(output_path, 'PNG', optimize=True, compress_level=9, pnginfo=None)
                    
                    with Image.open(output_path) as check:
                        if check.size != (target_width, target_height):
                            corrected = check.resize((target_width, target_height), Image.Resampling.LANCZOS)
                            corrected.save(output_path, 'PNG', optimize=True)
                else:
                    img.save(output_path, 'PNG', optimize=True, compress_level=9, pnginfo=None)
                    message = None
            else:
                img.save(output_path, 'PNG', optimize=True, compress_level=9, pnginfo=None)
                message = None
            
            return True, message
            
    except Exception as e:
        return False, f"Error redimensionando: {str(e)}"

def optimize_png_only(image_path, output_path):
    try:
        with Image.open(image_path) as img:
            original_dimensions = img.size
            
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            img.save(output_path, 'PNG', optimize=True, compress_level=9, pnginfo=None)
            
            with Image.open(output_path) as check:
                if check.size != original_dimensions:
                    corrected = check.resize(original_dimensions, Image.Resampling.LANCZOS)
                    corrected.save(output_path, 'PNG', optimize=True)
            
            force_size_reduction_safe(output_path, original_dimensions, 8)
            optimize_with_oxipng(output_path)
            
            message = f"PNG optimizado ({original_dimensions[0]}x{original_dimensions[1]})"
            return True, message
            
    except Exception as e:
        return False, f"Error optimizando: {str(e)}"

def create_image_preview_data(image_path):
    try:
        with Image.open(image_path) as img:
            img.thumbnail((150, 150), Image.Resampling.LANCZOS)
            
            buffer = io.BytesIO()
            if img.mode in ('RGBA', 'LA'):
                img.save(buffer, format='PNG')
            else:
                img.save(buffer, format='JPEG', quality=70)
            
            img_data = buffer.getvalue()
            import base64
            b64_data = base64.b64encode(img_data).decode()
            
            format_type = 'png' if img.mode in ('RGBA', 'LA') else 'jpeg'
            return f"data:image/{format_type};base64,{b64_data}"
    except:
        return None

def process_single_image(image_info, session_folder, options):
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
        success, normalized_path, norm_msg = normalize_image_format(input_path)
        if not success:
            result['message'] = norm_msg
            return result
        
        if normalized_path != input_path:
            result['operations'].append(norm_msg)
            current_path = normalized_path
            temp_files.append(normalized_path)
        
        try:
            with Image.open(current_path) as img:
                original_dimensions = img.size
        except Exception as e:
            result['message'] = f"Error leyendo imagen: {str(e)}"
            return result
        
        has_background_removal = options.get('background_removal', False)
        has_resize = options.get('resize', False)
        png_only = options.get('png_optimize_only', False)
        
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
            
            print(f"✓ {image_info['original_name']}: {original_size//1024}KB -> {final_size//1024}KB")
        else:
            result['message'] = 'Error: archivo final no encontrado'
    
    except Exception as e:
        result['message'] = f'Error procesando: {str(e)}'
        print(f"✗ Error en {image_info['original_name']}: {str(e)}")
    
    finally:
        for temp_file in temp_files:
            if os.path.exists(temp_file) and temp_file != final_path:
                try:
                    os.remove(temp_file)
                except:
                    pass
    
    return result

# ============================================================================
# ENDPOINTS
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    oxipng_available = False
    try:
        result = subprocess.run(['oxipng', '--version'], 
                              capture_output=True, text=True, timeout=5)
        oxipng_available = result.returncode == 0
    except:
        pass
    
    return jsonify({
        'status': 'ok',
        'message': 'ImageProcessor Backend funcionando',
        'rembg_available': REMBG_AVAILABLE,
        'svg_support': SVG_SUPPORT,
        'heif_support': HEIF_SUPPORT,
        'oxipng_available': oxipng_available,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return jsonify({'error': 'No se encontraron archivos'}), 400
    
    files = request.files.getlist('files')
    
    if not files or all(f.filename == '' for f in files):
        return jsonify({'error': 'No se seleccionaron archivos'}), 400
    
    session_id = str(uuid.uuid4())
    session_folder = os.path.join(UPLOAD_FOLDER, session_id)
    os.makedirs(session_folder, exist_ok=True)
    
    uploaded_files = []
    errors = []
    zip_count = 0
    direct_count = 0
    
    try:
        for file in files:
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                file_path = os.path.join(session_folder, unique_filename)
                
                file.save(file_path)
                
                if filename.lower().endswith('.zip'):
                    zip_count += 1
                    extracted_images, error = extract_images_from_zip(file_path, session_folder)
                    
                    if error:
                        errors.append(f"Error extrayendo {filename}: {error}")
                        continue
                    
                    if not extracted_images:
                        errors.append(f"No se encontraron imágenes en {filename}")
                        continue
                    
                    for img in extracted_images:
                        uploaded_files.append({
                            'id': str(uuid.uuid4()),
                            'filename': img['filename'],
                            'original_name': img['original_name'],
                            'type': 'image',
                            'source': 'zip',
                            'size': img['size'],
                            'path': img['path']
                        })
                    os.remove(file_path)
                
                else:
                    direct_count += 1
                    file_size = os.path.getsize(file_path)
                    uploaded_files.append({
                        'id': str(uuid.uuid4()),
                        'filename': unique_filename,
                        'original_name': filename,
                        'type': 'image',
                        'source': 'direct',
                        'size': file_size,
                        'path': file_path
                    })
            
            else:
                errors.append(f"Archivo no permitido: {file.filename if file.filename else 'sin nombre'}")
    
    except Exception as e:
        if os.path.exists(session_folder):
            shutil.rmtree(session_folder)
        return jsonify({'error': f'Error procesando archivos: {str(e)}'}), 500
    
    if not uploaded_files:
        if os.path.exists(session_folder):
            shutil.rmtree(session_folder)
        return jsonify({'error': 'No se encontraron archivos válidos'}), 400
    
    upload_type = 'single' if direct_count == 1 and zip_count == 0 and len(uploaded_files) == 1 else 'multiple'
    
    session_metadata = {
        'session_id': session_id,
        'created_at': datetime.now().isoformat(),
        'files': uploaded_files,
        'errors': errors,
        'processed': False,
        'upload_type': upload_type,
        'stats': {
            'direct_files': direct_count,
            'zip_files': zip_count,
            'total_images': len(uploaded_files)
        }
    }
    
    metadata_path = os.path.join(session_folder, 'metadata.json')
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(session_metadata, f, indent=2, ensure_ascii=False)
    
    print(f"Cargados {len(uploaded_files)} archivos en sesión {session_id}")
    
    return jsonify({
        'success': True,
        'session_id': session_id,
        'uploaded_files': len(uploaded_files),
        'files': uploaded_files,
        'errors': errors,
        'upload_type': upload_type
    })

@app.route('/api/process', methods=['POST'])
def process_images():
    data = request.get_json()
    
    if not data or 'session_id' not in data:
        return jsonify({'error': 'session_id requerido'}), 400
    
    session_id = data['session_id']
    session_folder = os.path.join(UPLOAD_FOLDER, session_id)
    metadata_path = os.path.join(session_folder, 'metadata.json')
    
    if not os.path.exists(metadata_path):
        return jsonify({'error': 'Sesión no encontrada'}), 404
    
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except Exception as e:
        return jsonify({'error': f'Error leyendo metadatos: {str(e)}'}), 500
    
    background_removal = data.get('background_removal', False)
    resize = data.get('resize', False)
    width = data.get('width')
    height = data.get('height')
    
    actual_resize = resize and width and height and int(width) > 0 and int(height) > 0
    
    options = {
        'background_removal': background_removal,
        'resize': actual_resize,
        'width': int(width) if width and str(width).strip() != '' else None,
        'height': int(height) if height and str(height).strip() != '' else None,
        'png_optimize_only': False
    }
    
    if not background_removal and not actual_resize:
        options['png_optimize_only'] = True
    
    processed_results = []
    
    for file_info in metadata['files']:
        if not os.path.exists(file_info['path']):
            processed_results.append({
                'id': file_info['id'],
                'original_name': file_info['original_name'],
                'success': False,
                'message': 'Archivo no encontrado'
            })
            continue
        
        result = process_single_image(file_info, session_folder, options)
        processed_results.append(result)
    
    metadata['processed'] = True
    metadata['processed_at'] = datetime.now().isoformat()
    metadata['processing_options'] = options
    metadata['results'] = processed_results
    
    try:
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error guardando metadatos: {str(e)}")
    
    successful = sum(1 for r in processed_results if r['success'])
    failed = len(processed_results) - successful
    
    print(f"Completado: {successful} exitosos, {failed} fallidos")
    
    return jsonify({
        'success': True,
        'message': f'Procesamiento completado: {successful} exitosos, {failed} fallidos',
        'session_id': session_id,
        'results': processed_results,
        'stats': {
            'total': len(processed_results),
            'successful': successful,
            'failed': failed
        }
    })

@app.route('/api/download/<session_id>', methods=['GET'])
def download_processed(session_id):
    session_folder = os.path.join(UPLOAD_FOLDER, session_id)
    metadata_path = os.path.join(session_folder, 'metadata.json')
    
    if not os.path.exists(metadata_path):
        return jsonify({'error': 'Sesión no encontrada'}), 404
    
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except Exception as e:
        return jsonify({'error': f'Error leyendo sesión: {str(e)}'}), 500
    
    if not metadata.get('processed', False):
        return jsonify({'error': 'Imágenes no procesadas'}), 400
    
    successful_files = [r for r in metadata.get('results', []) if r.get('success', False)]
    
    if not successful_files:
        schedule_session_cleanup(session_folder, delay=1)
        return jsonify({'error': 'No hay archivos procesados'}), 400
    
    if len(successful_files) == 1:
        result = successful_files[0]
        file_path = result.get('path')
        
        if not file_path or not os.path.exists(file_path):
            schedule_session_cleanup(session_folder, delay=1)
            return jsonify({'error': 'Archivo procesado no encontrado'}), 404
        
        try:
            file_size = os.path.getsize(file_path)
            if file_size == 0:
                schedule_session_cleanup(session_folder, delay=1)
                return jsonify({'error': 'Archivo procesado está vacío'}), 500
            
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            schedule_session_cleanup(session_folder, delay=3)
            
            if file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
                mimetype = 'image/jpeg'
            else:
                mimetype = 'image/png'
            
            response = Response(
                file_data,
                mimetype=mimetype,
                headers={
                    'Content-Disposition': f'attachment; filename="{result["processed_name"]}"',
                    'Content-Type': mimetype,
                    'Content-Length': str(len(file_data))
                }
            )
            
            print(f"Descarga individual: {result['processed_name']} ({file_size//1024}KB)")
            return response
            
        except Exception as e:
            schedule_session_cleanup(session_folder, delay=1)
            return jsonify({'error': f'Error descargando: {str(e)}'}), 500
    
    zip_filename = f"imagenes_procesadas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    
    try:
        from io import BytesIO
        zip_buffer = BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zipf:
            for result in successful_files:
                file_path = result.get('path')
                if file_path and os.path.exists(file_path):
                    if os.path.getsize(file_path) > 0:
                        zipf.write(file_path, result['processed_name'])
        
        zip_buffer.seek(0)
        zip_data = zip_buffer.getvalue()
        zip_size = len(zip_data)
        
        if zip_size == 0:
            schedule_session_cleanup(session_folder, delay=1)
            return jsonify({'error': 'ZIP creado pero está vacío'}), 500
        
        schedule_session_cleanup(session_folder, delay=3)
        
        response = Response(
            zip_data,
            mimetype='application/zip',
            headers={
                'Content-Disposition': f'attachment; filename="{zip_filename}"',
                'Content-Type': 'application/zip',
                'Content-Length': str(zip_size)
            }
        )
        
        print(f"Descarga ZIP: {zip_filename} ({zip_size//1024}KB) - {len(successful_files)} imágenes")
        return response
    
    except Exception as e:
        schedule_session_cleanup(session_folder, delay=1)
        return jsonify({'error': f'Error creando ZIP: {str(e)}'}), 500

@app.route('/api/session/<session_id>', methods=['GET'])
def get_session_info(session_id):
    session_folder = os.path.join(UPLOAD_FOLDER, session_id)
    metadata_path = os.path.join(session_folder, 'metadata.json')
    
    if not os.path.exists(metadata_path):
        return jsonify({'error': 'Sesión no encontrada'}), 404
    
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        return jsonify(metadata)
    except Exception as e:
        return jsonify({'error': f'Error leyendo sesión: {str(e)}'}), 500

@app.route('/api/preview/<filename>', methods=['GET'])
def get_image_preview(filename):
    found_path = None
    
    try:
        for session_dir in os.listdir(UPLOAD_FOLDER):
            session_path = os.path.join(UPLOAD_FOLDER, session_dir)
            if os.path.isdir(session_path):
                for file in os.listdir(session_path):
                    if file == filename:
                        found_path = os.path.join(session_path, file)
                        break
                if found_path:
                    break
    except Exception as e:
        return jsonify({'error': f'Error buscando archivo: {str(e)}'}), 500
    
    if not found_path or not os.path.exists(found_path):
        return jsonify({'error': 'Archivo no encontrado'}), 404
    
    try:
        with Image.open(found_path) as img:
            thumbnail = img.copy()
            thumbnail.thumbnail((300, 300), Image.Resampling.LANCZOS)
            
            img_buffer = io.BytesIO()
            
            format = img.format if img.format else 'PNG'
            if format in ['JPEG', 'JPG']:
                if thumbnail.mode in ('RGBA', 'LA'):
                    thumbnail = thumbnail.convert('RGB')
                thumbnail.save(img_buffer, format='JPEG', quality=85, optimize=True)
                mimetype = 'image/jpeg'
            else:
                thumbnail.save(img_buffer, format='PNG', optimize=True)
                mimetype = 'image/png'
            
            img_buffer.seek(0)
            
            return send_file(
                img_buffer,
                mimetype=mimetype,
                as_attachment=False
            )
            
    except Exception as e:
        return jsonify({'error': f'Error procesando imagen: {str(e)}'}), 500

@app.route('/api/dimensions/<session_id>', methods=['GET'])
def get_image_dimensions(session_id):
    session_folder = os.path.join(UPLOAD_FOLDER, session_id)
    metadata_path = os.path.join(session_folder, 'metadata.json')
    
    if not os.path.exists(metadata_path):
        return jsonify({'error': 'Sesión no encontrada'}), 404
    
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except Exception as e:
        return jsonify({'error': f'Error leyendo sesión: {str(e)}'}), 500
    
    files = metadata.get('files', [])
    if not files:
        return jsonify({'error': 'No hay archivos en la sesión'}), 404
    
    first_file = files[0]
    image_path = first_file.get('path')
    
    if not image_path or not os.path.exists(image_path):
        return jsonify({'error': 'Archivo de imagen no encontrado'}), 404
    
    try:
        success, normalized_path, norm_msg = normalize_image_format(image_path)
        if not success:
            return jsonify({'error': f'Error normalizando imagen: {norm_msg}'}), 500
        
        with Image.open(normalized_path) as img:
            dimensions = {
                'width': img.width,
                'height': img.height,
                'aspect_ratio': img.width / img.height,
                'format': img.format,
                'mode': img.mode,
                'size_bytes': os.path.getsize(normalized_path),
                'filename': first_file.get('original_name', 'unknown')
            }
            
            if normalized_path != image_path and os.path.exists(normalized_path):
                try:
                    os.remove(normalized_path)
                except:
                    pass
            
            return jsonify({
                'success': True,
                'dimensions': dimensions
            })
            
    except Exception as e:
        return jsonify({'error': f'Error obteniendo dimensiones: {str(e)}'}), 500

@app.route('/api/cleanup/<session_id>', methods=['DELETE'])
def manual_cleanup(session_id):
    session_folder = os.path.join(UPLOAD_FOLDER, session_id)
    
    if not os.path.exists(session_folder):
        return jsonify({'error': 'Sesión no encontrada'}), 404
    
    try:
        shutil.rmtree(session_folder)
        return jsonify({
            'success': True,
            'message': f'Sesión {session_id} eliminada correctamente'
        })
    except Exception as e:
        return jsonify({'error': f'Error eliminando sesión: {str(e)}'}), 500

@app.route('/api/cleanup/all', methods=['DELETE'])
def cleanup_all_sessions():
    try:
        cleaned = 0
        for session_dir in os.listdir(UPLOAD_FOLDER):
            session_path = os.path.join(UPLOAD_FOLDER, session_dir)
            if os.path.isdir(session_path):
                shutil.rmtree(session_path)
                cleaned += 1
        
        return jsonify({
            'success': True,
            'message': f'{cleaned} sesiones eliminadas',
            'cleaned_count': cleaned
        })
    except Exception as e:
        return jsonify({'error': f'Error en limpieza masiva: {str(e)}'}), 500

if __name__ == '__main__':
    print("=" * 70)
    print(" Iniciando ImageProcessor Backend")
    print("=" * 70)
    print(f" Directorio uploads: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f" Formatos soportados: {', '.join(sorted(ALLOWED_EXTENSIONS))}")
    print(f" Servidor: http://localhost:5000")
    print(f" Health check: http://localhost:5000/api/health")
    print(f" REMBG disponible: {REMBG_AVAILABLE}")
    print(f" SVG soporte: {SVG_SUPPORT}")
    print(f" HEIF soporte: {HEIF_SUPPORT}")
    print("=" * 70)
    print("   Sistema de limpieza automática ACTIVADO")
    print("   - Limpieza inmediata: 3 segundos después de descarga")
    print("   - Limpieza de respaldo: Cada 1 hora (sesiones > 2 horas)")
    print("=" * 70)
    
    app.run(debug=True, host='0.0.0.0', port=5000)