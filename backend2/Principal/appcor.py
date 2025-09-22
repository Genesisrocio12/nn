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

# Intentar importar rembg
try:
    from rembg import remove, new_session
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False

# Verificar si oxipng está disponible
try:
    result = subprocess.run(['oxipng', '--version'], capture_output=True, text=True, timeout=5)
    OXIPNG_AVAILABLE = result.returncode == 0
    print(f"oxipng disponible: {OXIPNG_AVAILABLE}")
except:
    OXIPNG_AVAILABLE = False
    print("oxipng NO disponible")

app = Flask(__name__)
CORS(app)

# Configuración
UPLOAD_FOLDER = 'uploads'
MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB

ALLOWED_EXTENSIONS = {
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 
    'tiff', 'tif', 'svg', 'raw', 'heic', 'heif',
    'psd', 'eps', 'ai', 'zip'
}

# Crear directorios
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def cleanup_old_sessions():
    """Limpiar sesiones más viejas de 1 hora"""
    while True:
        try:
            current_time = datetime.now()
            for session_dir in os.listdir(UPLOAD_FOLDER):
                session_path = os.path.join(UPLOAD_FOLDER, session_dir)
                if os.path.isdir(session_path):
                    # Verificar si la sesión es más vieja de 1 hora
                    dir_time = datetime.fromtimestamp(os.path.getctime(session_path))
                    if current_time - dir_time > timedelta(hours=1):
                        shutil.rmtree(session_path)
                        print(f"Sesión expirada limpiada: {session_dir}")
        except Exception as e:
            print(f"Error en cleanup automático: {str(e)}")
        
        # Ejecutar cada 30 minutos
        time.sleep(1800)

# Iniciar hilo de limpieza automática
cleanup_thread = threading.Thread(target=cleanup_old_sessions, daemon=True)
cleanup_thread.start()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def is_image_file(filename):
    image_extensions = {
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 
        'tiff', 'tif', 'raw', 'heic', 'heif'
    }
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in image_extensions

def extract_images_from_zip(zip_path, extract_to):
    """Extraer imágenes de archivo ZIP"""
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
                        
                        # Manejar directorios en ZIP
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
    """Optimizar PNG usando oxipng con configuración más agresiva"""
    if not OXIPNG_AVAILABLE:
        return False, "oxipng no disponible"
    
    try:
        # Configuración más agresiva para mayor compresión
        result = subprocess.run([
            'oxipng', 
            '-o', '6',           # Nivel máximo de optimización
            '--strip', 'safe',   # Remover metadatos seguros
            '--alpha',           # Optimizar canal alpha
            '-Z',               # Usar algoritmo de compresión más agresivo
            image_path
        ], capture_output=True, text=True, timeout=45)
        
        if result.returncode == 0:
            return True, "Optimizado con oxipng (nivel máximo)"
        else:
            print(f"Error oxipng: {result.stderr}")
            return False, f"Error oxipng: {result.stderr}"
            
    except subprocess.TimeoutExpired:
        return False, "Timeout en optimización oxipng"
    except Exception as e:
        print(f"Error ejecutando oxipng: {str(e)}")
        return False, f"Error ejecutando oxipng: {str(e)}"

def remove_background(image_path, output_path):
    """Eliminar fondo usando rembg con transparencia real"""
    if not REMBG_AVAILABLE:
        try:
            # Simulación - convertir a PNG con transparencia
            with Image.open(image_path) as img:
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                img.save(output_path, 'PNG', optimize=True, compress_level=9)
                return True, "Convertido a PNG (REMBG no disponible)"
        except Exception as e:
            return False, f"Error en conversión: {str(e)}"
    
    try:
        # Procesar con rembg
        with open(image_path, 'rb') as input_file:
            input_data = input_file.read()
        
        # Eliminar fondo
        output_data = remove(input_data)
        
        # Guardar resultado
        with open(output_path, 'wb') as output_file:
            output_file.write(output_data)
        
        # Verificar transparencia y optimizar con PIL
        try:
            with Image.open(output_path) as img:
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                img.save(output_path, 'PNG', optimize=True, compress_level=9)
        except:
            pass
        
        # Intentar optimizar con oxipng
        oxipng_success, oxipng_msg = optimize_with_oxipng(output_path)
        
        message = "Fondo eliminado con transparencia"
        if oxipng_success:
            message += " y optimizado con oxipng"
        
        return True, message
    
    except Exception as e:
        return False, f"Error eliminando fondo: {str(e)}"

def resize_image(image_path, output_path, width=None, height=None):
    """Redimensionar imagen preservando transparencia con máxima optimización"""
    try:
        with Image.open(image_path) as img:
            original_size = img.size
            
            # Preservar transparencia
            if img.mode in ('RGBA', 'LA'):
                pass  # Ya tiene transparencia
            elif 'transparency' in img.info:
                img = img.convert('RGBA')
            else:
                img = img.convert('RGBA')
            
            # Redimensionar si se especifican dimensiones
            if width and height:
                img_resized = img.resize((int(width), int(height)), Image.Resampling.LANCZOS)
                message = f"Redimensionado de {original_size[0]}x{original_size[1]} a {width}x{height}"
            else:
                img_resized = img
                message = f"Convertido a PNG (tamaño: {original_size[0]}x{original_size[1]})"
            
            # Guardar como PNG con máxima compresión PIL
            img_resized.save(output_path, 'PNG', optimize=True, compress_level=9)
            
            # Intentar optimizar con oxipng para reducir aún más el tamaño
            oxipng_success, oxipng_msg = optimize_with_oxipng(output_path)
            if oxipng_success:
                message += " y optimizado con oxipng"
            
            return True, message
            
    except Exception as e:
        return False, f"Error redimensionando: {str(e)}"

def create_image_preview_data(image_path):
    """Crear datos de preview de la imagen en base64"""
    try:
        with Image.open(image_path) as img:
            # Crear thumbnail pequeño
            img.thumbnail((150, 150), Image.Resampling.LANCZOS)
            
            # Convertir a base64
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
    """Procesar una sola imagen según las opciones"""
    input_path = image_info['path']
    original_size = os.path.getsize(input_path)
    
    # Crear nombre de salida
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
        # Determinar el tipo de procesamiento
        has_background_removal = options.get('background_removal', False)
        has_resize = options.get('resize', False)
        png_only = options.get('png_optimize_only', False)
        
        print(f"Procesando {image_info['original_name']}: bg_removal={has_background_removal}, resize={has_resize}, png_only={png_only}")
        
        # Caso 1: Solo conversión PNG optimizada (switches OFF)
        if png_only and not has_background_removal and not has_resize:
            success, message = resize_image(current_path, final_path)
            if success:
                result['operations'].append("Convertido a PNG optimizado")
            else:
                result['message'] = message
                return result
        
        # Caso 2: Procesamiento con switches activos
        else:
            # Paso 1: Eliminar fondo si está activado
            if has_background_removal:
                success, message = remove_background(current_path, temp_path)
                result['operations'].append(message)
                if success:
                    current_path = temp_path
                    temp_files.append(temp_path)
                else:
                    result['message'] = message
                    return result
            
            # Paso 2: Redimensionar o convertir
            if has_resize:
                width = options.get('width')
                height = options.get('height')
                success, message = resize_image(current_path, final_path, width, height)
                result['operations'].append(message)
            else:
                # Solo convertir a PNG
                if current_path != input_path:
                    # Ya procesamos, mover temp a final
                    shutil.move(current_path, final_path)
                    result['operations'].append("Guardado como PNG optimizado")
                else:
                    # Convertir original a PNG
                    success, message = resize_image(current_path, final_path)
                    result['operations'].append(message)
        
        # Verificar resultado final
        if os.path.exists(final_path):
            final_size = os.path.getsize(final_path)
            size_reduction = ((original_size - final_size) / original_size) * 100
            
            # Crear preview de la imagen procesada
            preview_url = create_image_preview_data(final_path)
            
            result['success'] = True
            result['message'] = 'Procesado exitosamente'
            result['final_size'] = final_size
            result['size_reduction'] = max(0, size_reduction)
            result['path'] = final_path
            result['preview_url'] = preview_url
            
            # Log de reducción de tamaño
            print(f"Reducción de tamaño: {original_size//1024}KB -> {final_size//1024}KB (-{size_reduction:.1f}%)")
        else:
            result['message'] = 'Error: archivo final no encontrado'
    
    except Exception as e:
        result['message'] = f'Error procesando: {str(e)}'
    
    finally:
        # Limpiar archivos temporales
        for temp_file in temp_files:
            if os.path.exists(temp_file) and temp_file != final_path:
                try:
                    os.remove(temp_file)
                except:
                    pass
    
    return result

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'ImageProcessor Backend funcionando',
        'rembg_available': REMBG_AVAILABLE,
        'oxipng_available': OXIPNG_AVAILABLE,
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
                        errors.append(f"No se encontraron imágenes válidas en {filename}")
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
                    
                    # Eliminar archivo ZIP temporal
                    os.remove(file_path)
                
                else:
                    # Archivo directo
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
        # Limpiar en caso de error
        if os.path.exists(session_folder):
            shutil.rmtree(session_folder)
        return jsonify({'error': f'Error procesando archivos: {str(e)}'}), 500
    
    if not uploaded_files:
        if os.path.exists(session_folder):
            shutil.rmtree(session_folder)
        return jsonify({'error': 'No se encontraron archivos válidos'}), 400
    
    # CORRECCIÓN CRÍTICA: Lógica correcta para determinar tipo de descarga
    # Solo es 'single' si subió 1 archivo directo Y resultó en 1 imagen final
    upload_type = 'single' if len(uploaded_files) == 1 and direct_count == 1 and zip_count == 0 else 'multiple'
    
    # Guardar metadatos de sesión
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
    
    print(f"Cargados {len(uploaded_files)} archivos (Directos: {direct_count}, ZIP: {zip_count}) - Tipo: {upload_type}")
    
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
    
    # Cargar metadatos
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except Exception as e:
        return jsonify({'error': f'Error leyendo metadatos: {str(e)}'}), 500
    
    # Opciones de procesamiento
    background_removal = data.get('background_removal', False)
    resize = data.get('resize', False)
    
    options = {
        'background_removal': background_removal,
        'resize': resize,
        'width': data.get('width'),
        'height': data.get('height'),
        'png_optimize_only': False
    }
    
    # NUEVA LÓGICA: Si no hay switches activos, hacer solo conversión PNG
    if not background_removal and not resize:
        options['png_optimize_only'] = True
        print(f"Modo: Solo conversión PNG optimizada para {len(metadata['files'])} imágenes")
    else:
        print(f"Procesando {len(metadata['files'])} imágenes con opciones: bg_removal={background_removal}, resize={resize}")
    
    # Procesar cada imagen
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
        
        print(f"Procesando: {file_info['original_name']}")
        result = process_single_image(file_info, session_folder, options)
        processed_results.append(result)
        
        if result['success']:
            print(f"{result['original_name']} -> {result['final_size']//1024}KB (-{result['size_reduction']:.1f}%)")
        else:
            print(f"ERROR {result['original_name']}: {result['message']}")
    
    # Actualizar metadatos
    metadata['processed'] = True
    metadata['processed_at'] = datetime.now().isoformat()
    metadata['processing_options'] = options
    metadata['results'] = processed_results
    
    try:
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error guardando metadatos: {str(e)}")
    
    # Estadísticas
    successful = sum(1 for r in processed_results if r['success'])
    failed = len(processed_results) - successful
    
    mode_message = "PNG optimizado" if options['png_optimize_only'] else "procesamiento completo"
    print(f"Completado ({mode_message}): {successful} exitosos, {failed} fallidos")
    
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
    """Descargar imágenes procesadas - LÓGICA CORREGIDA PARA DESCARGA INDIVIDUAL"""
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
    
    # Obtener archivos exitosos
    successful_files = [r for r in metadata.get('results', []) if r.get('success', False)]
    
    if not successful_files:
        return jsonify({'error': 'No hay archivos procesados para descargar'}), 400
    
    print(f"Descarga solicitada: {len(successful_files)} archivos exitosos")
    print(f"Tipo de carga original: {metadata.get('upload_type', 'unknown')}")
    
    def cleanup_session():
        """Limpiar archivos de la sesión"""
        try:
            if os.path.exists(session_folder):
                shutil.rmtree(session_folder)
                print(f"Sesión limpiada: {session_id}")
        except Exception as e:
            print(f"Error limpiando sesión {session_id}: {str(e)}")
    
    # LÓGICA CORREGIDA: Descarga individual solo si:
    # 1. Solo hay 1 archivo procesado exitosamente Y
    # 2. El tipo de carga original fue 'single' (1 archivo directo)
    original_upload_type = metadata.get('upload_type', 'multiple')
    should_download_single = len(successful_files) == 1 and original_upload_type == 'single'
    
    if should_download_single:
        result = successful_files[0]
        file_path = result.get('path')
        
        if not file_path or not os.path.exists(file_path):
            cleanup_session()
            return jsonify({'error': 'Archivo procesado no encontrado'}), 404
        
        print(f"DESCARGA INDIVIDUAL: {result['processed_name']}")
        
        try:
            # Verificar que el archivo no está corrupto
            file_size = os.path.getsize(file_path)
            if file_size == 0:
                cleanup_session()
                return jsonify({'error': 'Archivo procesado está vacío'}), 500
            
            # Leer el archivo en memoria antes de limpiar
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            # Limpiar la sesión
            cleanup_session()
            
            # Crear respuesta desde memoria
            from io import BytesIO
            file_buffer = BytesIO(file_data)
            
            return send_file(
                file_buffer,
                as_attachment=True,
                download_name=result['processed_name'],
                mimetype='image/png'
            )
            
        except Exception as e:
            cleanup_session()
            print(f"Error enviando archivo individual: {str(e)}")
            return jsonify({'error': f'Error descargando archivo: {str(e)}'}), 500
    
    # DESCARGA MÚLTIPLE EN ZIP - para todos los otros casos
    print(f"DESCARGA MÚLTIPLE (ZIP): {len(successful_files)} archivos")
    zip_filename = f"imagenes_procesadas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    
    try:
        print(f"Creando ZIP en memoria: {zip_filename}")
        
        # Crear ZIP en memoria
        from io import BytesIO
        zip_buffer = BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zipf:
            for result in successful_files:
                file_path = result.get('path')
                if file_path and os.path.exists(file_path):
                    # Verificar que el archivo no está vacío
                    if os.path.getsize(file_path) > 0:
                        zipf.write(file_path, result['processed_name'])
                        print(f"Agregado al ZIP: {result['processed_name']}")
                    else:
                        print(f"Saltando archivo vacío: {result['processed_name']}")
        
        zip_buffer.seek(0)
        zip_size = len(zip_buffer.getvalue())
        
        if zip_size == 0:
            cleanup_session()
            return jsonify({'error': 'ZIP creado pero está vacío'}), 500
        
        print(f"ZIP creado exitosamente: {zip_size//1024}KB")
        
        # Limpiar la sesión
        cleanup_session()
        
        return send_file(
            zip_buffer,
            as_attachment=True,
            download_name=zip_filename,
            mimetype='application/zip'
        )
    
    except Exception as e:
        cleanup_session()
        print(f"Error creando ZIP: {str(e)}")
        return jsonify({'error': f'Error creando ZIP: {str(e)}'}), 500

@app.route('/api/session/<session_id>', methods=['GET'])
def get_session_info(session_id):
    """Obtener información de sesión"""
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
    """Endpoint para obtener preview de imagen"""
    
    # Buscar el archivo en todas las sesiones activas
    found_path = None
    
    try:
        for session_dir in os.listdir(UPLOAD_FOLDER):
            session_path = os.path.join(UPLOAD_FOLDER, session_dir)
            if os.path.isdir(session_path):
                # Buscar archivo en esta sesión
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
        # Verificar que es una imagen
        with Image.open(found_path) as img:
            # Crear thumbnail pequeño para preview
            thumbnail = img.copy()
            thumbnail.thumbnail((300, 300), Image.Resampling.LANCZOS)
            
            # Convertir a bytes para envío
            img_buffer = io.BytesIO()
            
            # Mantener formato original si es posible
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
    """Obtener dimensiones de la primera imagen en la sesión"""
    
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
    
    # Usar la primera imagen como referencia
    first_file = files[0]
    image_path = first_file.get('path')
    
    if not image_path or not os.path.exists(image_path):
        return jsonify({'error': 'Archivo de imagen no encontrado'}), 404
    
    try:
        with Image.open(image_path) as img:
            dimensions = {
                'width': img.width,
                'height': img.height,
                'aspect_ratio': img.width / img.height,
                'format': img.format,
                'mode': img.mode,
                'size_bytes': os.path.getsize(image_path),
                'filename': first_file.get('original_name', 'unknown')
            }
            
            print(f"Dimensiones obtenidas: {dimensions['width']}x{dimensions['height']} (ratio: {dimensions['aspect_ratio']:.2f})")
            
            return jsonify({
                'success': True,
                'dimensions': dimensions
            })
            
    except Exception as e:
        return jsonify({'error': f'Error obteniendo dimensiones: {str(e)}'}), 500

if __name__ == '__main__':
    print("Iniciando ImageProcessor Backend...")
    print(f"Directorio uploads: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"Formatos soportados: {', '.join(sorted(ALLOWED_EXTENSIONS))}")
    print(f"REMBG disponible: {REMBG_AVAILABLE}")
    print(f"oxipng disponible: {OXIPNG_AVAILABLE}")
    print(f"Servidor: http://localhost:5000")
    print(f"Health check: http://localhost:5000/api/health")
    
    app.run(debug=True, host='0.0.0.0', port=5000)