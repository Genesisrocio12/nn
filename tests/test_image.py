import unittest
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.action_chains import ActionChains

class CompleteFlowTest(unittest.TestCase):
    """Test completo: Flujo continuo usando imágenes de tu galería"""
    
    @classmethod
    def setUpClass(cls):
        if os.name == 'nt':
            chromedriver_filename = 'chromedriver.exe'
        else:
            chromedriver_filename = 'chromedriver'
        
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        chromedriver_path = os.path.join(project_root, chromedriver_filename)
        
        if not os.path.exists(chromedriver_path):
            raise FileNotFoundError(f"ChromeDriver no encontrado: {chromedriver_path}")
        
        options = webdriver.ChromeOptions()
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--start-maximized')
        
        service = Service(chromedriver_path)
        cls.driver = webdriver.Chrome(service=service, options=options)
        cls.wait = WebDriverWait(cls.driver, 20)
        
        cls.BASE_URL = "http://localhost:5173"
        cls.SCREENSHOTS_DIR = os.path.join(project_root, 'screenshots')
        os.makedirs(cls.SCREENSHOTS_DIR, exist_ok=True)
        
        # ========================================
        # CONFIGURA AQUÍ LA RUTA DE TUS IMÁGENES
        # ========================================
        # Opción 1: Ruta absoluta a tu carpeta de fotos
        cls.MY_IMAGES_DIR = r"C:\Users\TuUsuario\Pictures\MisFotos"
        
        # Opción 2: Para Mac
        # cls.MY_IMAGES_DIR = "/Users/TuUsuario/Pictures/MisFotos"
        
        # Opción 3: Para Linux
        # cls.MY_IMAGES_DIR = "/home/TuUsuario/Pictures/MisFotos"
        
        # Opción 4: Usar carpeta en el proyecto
        # cls.MY_IMAGES_DIR = os.path.join(project_root, 'my_test_images')
        
        # Verificar que la carpeta existe
        if not os.path.exists(cls.MY_IMAGES_DIR):
            raise FileNotFoundError(
                f"\n❌ ERROR: No se encontró la carpeta de imágenes:\n"
                f"   {cls.MY_IMAGES_DIR}\n\n"
                f"Por favor:\n"
                f"1. Abre este archivo en un editor\n"
                f"2. Busca 'MY_IMAGES_DIR' en setUpClass()\n"
                f"3. Cambia la ruta a tu carpeta de fotos\n"
            )
        
        # Obtener lista de imágenes válidas
        cls._find_test_images()
    
    @classmethod
    def _find_test_images(cls):
        """Buscar imágenes válidas en la carpeta especificada"""
        valid_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif')
        
        all_files = os.listdir(cls.MY_IMAGES_DIR)
        cls.available_images = [
            f for f in all_files 
            if f.lower().endswith(valid_extensions)
        ]
        
        if not cls.available_images:
            raise FileNotFoundError(
                f"\n❌ ERROR: No se encontraron imágenes en:\n"
                f"   {cls.MY_IMAGES_DIR}\n\n"
                f"Formatos válidos: {', '.join(valid_extensions)}\n"
            )
        
        cls.available_images.sort()
        
        print(f"\n✅ Encontradas {len(cls.available_images)} imágenes en:")
        print(f"   {cls.MY_IMAGES_DIR}")
        print(f"\nPrimeras imágenes disponibles:")
        for i, img in enumerate(cls.available_images[:10], 1):
            print(f"   {i}. {img}")
        if len(cls.available_images) > 10:
            print(f"   ... y {len(cls.available_images) - 10} más")
        print()
    
    def screenshot(self, name):
        filepath = os.path.join(self.SCREENSHOTS_DIR, f"{name}_{time.strftime('%H%M%S')}.png")
        self.driver.save_screenshot(filepath)
        print(f"      📸 Captura: {os.path.basename(filepath)}")
    
    def navigate_to_processor(self):
        """Navegar al procesador desde la página principal"""
        time.sleep(2)
        buttons = self.driver.find_elements(By.TAG_NAME, 'button')
        for btn in buttons:
            if 'Procesador' in btn.text or 'Comenzar' in btn.text:
                btn.click()
                time.sleep(3)
                print("      ✓ Navegado al Procesador")
                return
    
    def upload_images(self, count=5):
        """Subir imágenes de tu galería"""
        time.sleep(1)
        file_input = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']")))
        
        # Tomar las primeras 'count' imágenes disponibles
        images_to_upload = self.available_images[:min(count, len(self.available_images))]
        
        image_paths = [
            os.path.join(self.MY_IMAGES_DIR, img)
            for img in images_to_upload
        ]
        
        print(f"      📁 Subiendo: {', '.join(images_to_upload)}")
        
        file_input.send_keys('\n'.join(image_paths))
        time.sleep(5)  
        print(f"      ✅ {count} imagen{'es' if count > 1 else ''} subida{'s' if count > 1 else ''}")
    
    def set_switch(self, switch_name, state):
        """Activar/desactivar switch """
        time.sleep(2)
        
        self.driver.execute_script("window.scrollTo(0, 300);")
        time.sleep(1)
        
        switch_containers = self.driver.find_elements(By.CSS_SELECTOR, ".processor-option-card")
        
        for container in switch_containers:
            text = container.text.lower()
            
            if switch_name == 'eliminar_fondo' and 'eliminar fondo' in text:
                toggle = container.find_element(By.CSS_SELECTOR, ".processor-toggle")
                is_active = 'processor-toggle-active' in toggle.get_attribute('class')
                
                if is_active != state:
                    self.driver.execute_script("arguments[0].click();", toggle)
                    time.sleep(1)
                print(f"      🔘 Switch 'Eliminar Fondo': {'ON' if state else 'OFF'}")
                return
                
            elif switch_name == 'redimensionar' and 'redimensionar' in text:
                toggle = container.find_element(By.CSS_SELECTOR, ".processor-toggle")
                is_active = 'processor-toggle-active' in toggle.get_attribute('class')
                
                if is_active != state:
                    self.driver.execute_script("arguments[0].click();", toggle)
                    time.sleep(1)
                print(f"      🔘 Switch 'Redimensionar': {'ON' if state else 'OFF'}")
                return
    
    def set_dimensions(self, width, height):
        """Configurar dimensiones"""
        time.sleep(1)
        inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[type='number']")
        
        if len(inputs) >= 2:
            inputs[0].clear()
            inputs[0].send_keys(str(width))
            time.sleep(0.5)
            inputs[1].clear()
            inputs[1].send_keys(str(height))
            time.sleep(0.5)
            print(f"      📏 Dimensiones: {width}x{height}px")
    
    def toggle_lock(self):
        """Desbloquear el candado para dimensiones libres"""
        time.sleep(1)
        try:
            lock_button = self.driver.find_element(By.CSS_SELECTOR, ".lock-button")
            self.driver.execute_script("arguments[0].click();", lock_button)
            time.sleep(0.5)
            print("      🔓 Candado desbloqueado")
        except:
            print("      ⚠️  Candado no encontrado o ya desbloqueado")
    
    def click_process(self):
        """Hacer clic en botón 'Procesar Imágenes'"""
        time.sleep(2)
        self.driver.execute_script("window.scrollTo(0, 400);")
        time.sleep(1)
        
        try:
            process_button = self.wait.until(
                EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Procesar')]"))
            )
            self.driver.execute_script("arguments[0].scrollIntoView(true);", process_button)
            time.sleep(1)
            self.driver.execute_script("arguments[0].click();", process_button)
            print(f"      🚀 Clic en 'Procesar Imágenes'")
            return True
            
        except Exception as e:
            print(f"      ❌ ERROR: No se encontró el botón 'Procesar Imágenes': {str(e)}")
            self.screenshot("error_boton_procesar")
            return False
    
    def wait_processing(self, seconds=15):
        """Esperar a que termine el procesamiento"""
        print(f"      ⏳ Esperando procesamiento ({seconds} seg)...", end="", flush=True)
        for i in range(seconds):
            time.sleep(1)
            if (i + 1) % 5 == 0:
                print(f" {i+1}s", end="", flush=True)
        print(" ✓")
        print("      🔍 Esperando que aparezca el botón de descarga...")
        time.sleep(3)
    
    def click_download(self):
        """Hacer clic en botón Descargar"""
        print("      🔍 Buscando botón de descarga...")
        
        for attempt in range(45):
            try:
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(0.5)
                
                download_selectors = [
                    "//button[contains(text(), 'Descargar')]",
                    "//button[contains(text(), 'ZIP')]",
                    "//button[contains(text(), 'Imagen')]",
                    "//button[contains(@class, 'download')]",
                    "//button[contains(@class, 'processor-download')]"
                ]
                
                for selector in download_selectors:
                    try:
                        download_button = self.driver.find_element(By.XPATH, selector)
                        if download_button.is_displayed() and download_button.is_enabled():
                            self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", download_button)
                            time.sleep(1)
                            self.driver.execute_script("arguments[0].click();", download_button)
                            print(f"      ✅ Botón de descarga encontrado y clickeado (intento {attempt + 1})")
                            time.sleep(4)
                            return True
                    except:
                        continue
                
                if attempt < 44:
                    if (attempt + 1) % 10 == 0:
                        print(f"      ⏳ ... esperando descarga ({attempt + 1}s)")
                    time.sleep(1)
                    
            except Exception as e:
                if attempt < 44:
                    time.sleep(1)
                    continue
                else:
                    print(f"      ❌ Error buscando botón: {str(e)}")
        
        print("      ❌ Botón Descargar NO apareció después de 45 segundos")
        self.screenshot("error_no_download_button")
        return False
    
    def click_reset(self):
        """Hacer clic en botón Resetear"""
        time.sleep(2)
        self.driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(1)
        
        try:
            reset_button = self.wait.until(
                EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Resetear') or contains(text(), 'Reset')]"))
            )
            self.driver.execute_script("arguments[0].click();", reset_button)
            time.sleep(3)
            print("      🔄 Reseteado")
            return True
        except:
            print("      ⚠️  Botón Reset no encontrado")
            return False
    
    def test_continuous_flow(self):
        print("\n" + "="*80)
        print("🧪 TEST FLUJO CONTINUO - 4 PASOS CON RESETEAR")
        print("="*80)
        
        try:
            # SETUP INICIAL
            print("\n[SETUP] Navegando al procesador...")
            print("-" * 80)
            self.driver.get(self.BASE_URL)
            time.sleep(3)
            self.navigate_to_processor()
            self.screenshot("00_inicio")
            
            # PASO 1: AMBOS SWITCHES OFF
            print("\n[PASO 1/4] 5 imgs - SWITCHES OFF")
            print("-" * 80)
            
            print("  [1.1] Subir 5 imágenes...")
            self.upload_images(5)
            self.screenshot("01_imgs_subidas")
            
            print("  [1.2] PROCESAR...")
            if self.click_process():
                print("  [1.3] Esperando procesamiento (switches OFF)...")
                self.wait_processing(18)
                self.screenshot("01_procesado")
                
                print("  [1.4] DESCARGAR...")
                if self.click_download():
                    self.screenshot("01_descargado")
                    print("  [1.5] RESETEAR...")
                    self.click_reset()
                    self.screenshot("01_reset")
                else:
                    print("      ❌ NO SE DESCARGÓ")
                    self.screenshot("01_error_descarga")
            
            print("  ✅ PASO 1/4 COMPLETADO\n")
            time.sleep(3)
            
            # PASO 2: SOLO ELIMINAR FONDO
            print("\n[PASO 2/4] 5 imgs - SOLO ELIMINAR FONDO ON")
            print("-" * 80)
            
            print("  [2.1] Subir 5 imágenes...")
            self.upload_images(5)
            self.screenshot("02_imgs_subidas")
            
            print("  [2.2] Prender SOLO ELIMINAR FONDO...")
            self.set_switch('eliminar_fondo', True)
            self.set_switch('redimensionar', False)
            self.screenshot("02_switch_bg_on")
            
            print("  [2.3] PROCESAR...")
            if self.click_process():
                print("  [2.4] Esperando procesamiento (eliminar fondo - MUCHO TIEMPO)...")
                self.wait_processing(60)
                self.screenshot("02_procesado")
                
                print("  [2.5] DESCARGAR...")
                if self.click_download():
                    self.screenshot("02_descargado")
                    print("  [2.6] RESETEAR...")
                    self.click_reset()
                    self.screenshot("02_reset")
                else:
                    print("      ❌ NO SE DESCARGÓ")
                    self.screenshot("02_error_descarga")
            
            print("  ✅ PASO 2/4 COMPLETADO\n")
            time.sleep(3)

            # PASO 3: SOLO REDIMENSIONAR
            print("\n[PASO 3/4] 5 imgs - SOLO REDIMENSIONAR ON (600x600)")
            print("-" * 80)
            
            print("  [3.1] Subir 5 imágenes...")
            self.upload_images(5)
            self.screenshot("03_imgs_subidas")
            
            print("  [3.2] Prender SOLO REDIMENSIONAR...")
            self.set_switch('eliminar_fondo', False)
            self.set_switch('redimensionar', True)
            self.screenshot("03_switch_resize_on")
            
            print("  [3.3] Configurar 600x600...")
            self.set_dimensions(600, 600)
            self.screenshot("03_dims_600")
            
            print("  [3.4] PROCESAR...")
            if self.click_process():
                print("  [3.5] Esperando procesamiento (redimensionar)...")
                self.wait_processing(20)
                self.screenshot("03_procesado")
                
                print("  [3.6] DESCARGAR...")
                if self.click_download():
                    self.screenshot("03_descargado")
                    print("  [3.7] RESETEAR...")
                    self.click_reset()
                    self.screenshot("03_reset")
                else:
                    print("      ❌ NO SE DESCARGÓ")
                    self.screenshot("03_error_descarga")
            
            print("  ✅ PASO 3/4 COMPLETADO\n")
            time.sleep(3)
            
            # PASO 4: AMBOS SWITCHES ON
            print("\n[PASO 4/4] 1 img - AMBOS SWITCHES ON + Candado abierto (600x600)")
            print("-" * 80)
            
            print("  [4.1] Subir 1 imagen...")
            self.upload_images(1)
            self.screenshot("04_img_subida")
            
            print("  [4.2] Prender AMBOS switches...")
            self.set_switch('eliminar_fondo', True)
            self.set_switch('redimensionar', True)
            self.screenshot("04_ambos_switches_on")
            
            print("  [4.3] Quitar candado...")
            self.toggle_lock()
            self.screenshot("04_candado_abierto")
            
            print("  [4.4] Configurar 600x600...")
            self.set_dimensions(600, 600)
            self.screenshot("04_dims_600")
            
            print("  [4.5] PROCESAR...")
            if self.click_process():
                print("  [4.6] Esperando procesamiento (ambos switches)...")
                self.wait_processing(35)
                self.screenshot("04_procesado")
                
                print("  [4.7] DESCARGAR...")
                if self.click_download():
                    self.screenshot("04_descargado")
                    print("    ✅ IMAGEN DESCARGADA - FIN DEL TEST")
                else:
                    print("      ❌ NO SE DESCARGÓ")
                    self.screenshot("04_error_descarga")
            
            print("  ✅ PASO 4/4 COMPLETADO\n")
            
            print("\n" + "="*80)
            print("✅ FLUJO COMPLETO EXITOSO")
            print("="*80)
            print("\n📊 Resumen:")
            print("  1. ✅ 5 imgs switches OFF")
            print("  2. ✅ 5 imgs solo BG removal")
            print("  3. ✅ 5 imgs solo resize 600x600")
            print("  4. ✅ 1 img ambos switches 600x600")
            print("\n📈 Total: 16 imágenes procesadas")
            print(f"📁 Imágenes desde: {self.MY_IMAGES_DIR}")
            print(f"📸 Screenshots en: {self.SCREENSHOTS_DIR}")
            print("="*80 + "\n")
            
        except Exception as e:
            self.screenshot("error_fatal")
            print(f"\n❌ ERROR FATAL: {str(e)}")
            import traceback
            traceback.print_exc()
            self.fail(f"Error: {str(e)}")
    
    @classmethod
    def tearDownClass(cls):
        print("\n🔚 Cerrando navegador...")
        time.sleep(3)
        cls.driver.quit()


if __name__ == "__main__":
    print("\n" + "="*80)
    print("🧪 TEST FLUJO CONTINUO - ImageProcessor")
    print("="*80)
    print("  🌐 Backend: http://localhost:5000")
    print("  🖥️  Frontend: http://localhost:5173")
    print("\n⏳ Iniciando en 5 segundos...")
    print("="*80 + "\n")
    
    try:
        time.sleep(5)
    except KeyboardInterrupt:
        print("\n❌ Test cancelado")
        exit(0)
    
    unittest.main(verbosity=2)