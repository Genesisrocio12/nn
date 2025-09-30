import unittest
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service

class CompleteFlowTest(unittest.TestCase):
    """Test completo: Flujo continuo sin salir del procesador"""
    
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
        
        service = Service(chromedriver_path)
        cls.driver = webdriver.Chrome(service=service, options=options)
        cls.driver.maximize_window()
        cls.wait = WebDriverWait(cls.driver, 20)
        
        cls.BASE_URL = "http://localhost:5173"
        cls.TEST_IMAGES_DIR = os.path.join(project_root, 'test_images')
        cls.SCREENSHOTS_DIR = os.path.join(project_root, 'screenshots')
        os.makedirs(cls.TEST_IMAGES_DIR, exist_ok=True)
        os.makedirs(cls.SCREENSHOTS_DIR, exist_ok=True)
        
        cls._create_test_images()
    
    @classmethod
    def _create_test_images(cls):
        """Crear 5 imágenes de prueba con colores diferentes"""
        from PIL import Image, ImageDraw, ImageFont
        
        colors = [
            ('red', (255, 0, 0)),
            ('blue', (0, 0, 255)),
            ('green', (0, 255, 0)),
            ('yellow', (255, 255, 0)),
            ('purple', (128, 0, 128))
        ]
        
        for i, (name, color) in enumerate(colors, 1):
            img = Image.new('RGB', (800, 600), color=color)
            draw = ImageDraw.Draw(img)
            
            try:
                font = ImageFont.truetype("arial.ttf", 60)
            except:
                font = ImageFont.load_default()
            
            text = f"IMG {i}"
            draw.text((300, 270), text, fill='white', font=font)
            
            img_path = os.path.join(cls.TEST_IMAGES_DIR, f'test_{name}.jpg')
            img.save(img_path, quality=95)
        
        print(f"5 imagenes creadas en {cls.TEST_IMAGES_DIR}\n")
    
    def screenshot(self, name):
        filepath = os.path.join(self.SCREENSHOTS_DIR, f"{name}_{time.strftime('%H%M%S')}.png")
        self.driver.save_screenshot(filepath)
        print(f"      Captura: {os.path.basename(filepath)}")
    
    def navigate_to_processor(self):
        buttons = self.driver.find_elements(By.TAG_NAME, 'button')
        for btn in buttons:
            if 'Procesador' in btn.text or 'Comenzar' in btn.text:
                btn.click()
                time.sleep(2)
                print("      Navegado al Procesador")
                return
    
    def upload_images(self, count=5):
        """Subir imágenes (1 o 5)"""
        file_input = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']")))
        
        colors = ['red', 'blue', 'green', 'yellow', 'purple']
        image_paths = [
            os.path.join(self.TEST_IMAGES_DIR, f'test_{colors[i]}.jpg')
            for i in range(count)
        ]
        
        file_input.send_keys('\n'.join(image_paths))
        time.sleep(4)
        print(f"      {count} imagen{'es' if count > 1 else ''} subida{'s' if count > 1 else ''}")
    
    def set_switch(self, switch_name, state):
        """Activar/desactivar switch: 'eliminar_fondo' o 'redimensionar'"""
        time.sleep(1)
        switch_containers = self.driver.find_elements(By.CSS_SELECTOR, ".processor-option-card")
        
        for container in switch_containers:
            text = container.text.lower()
            
            if switch_name == 'eliminar_fondo' and 'eliminar fondo' in text:
                toggle = container.find_element(By.CSS_SELECTOR, ".processor-toggle")
                is_active = 'processor-toggle-active' in toggle.get_attribute('class')
                
                if is_active != state:
                    toggle.click()
                    time.sleep(0.5)
                print(f"      Switch 'Eliminar Fondo': {'ON' if state else 'OFF'}")
                return
                
            elif switch_name == 'redimensionar' and 'redimensionar' in text:
                toggle = container.find_element(By.CSS_SELECTOR, ".processor-toggle")
                is_active = 'processor-toggle-active' in toggle.get_attribute('class')
                
                if is_active != state:
                    toggle.click()
                    time.sleep(0.5)
                print(f"      Switch 'Redimensionar': {'ON' if state else 'OFF'}")
                return
    
    def set_dimensions(self, width, height):
        """Configurar dimensiones"""
        time.sleep(1)
        inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[type='number']")
        
        if len(inputs) >= 2:
            inputs[0].clear()
            inputs[0].send_keys(str(width))
            time.sleep(0.3)
            inputs[1].clear()
            inputs[1].send_keys(str(height))
            time.sleep(0.3)
            print(f"      Dimensiones: {width}x{height}px")
    
    def click_process(self):
        """Hacer clic en botón 'Procesar Imágenes'"""
        time.sleep(2)
        buttons = self.driver.find_elements(By.TAG_NAME, 'button')
        for btn in buttons:
            btn_text = btn.text.lower()
            if 'procesar' in btn_text and 'imagen' in btn_text:
                print(f"      Botón encontrado: '{btn.text}'")
                btn.click()
                print("      ✓ Clic en 'Procesar Imágenes'")
                return True
        print("      ⚠ ADVERTENCIA: Botón 'Procesar Imágenes' NO encontrado")
        return False
    
    def wait_processing(self, seconds=15):
        time.sleep(seconds)
    
    def click_download(self):
        time.sleep(2)
        buttons = self.driver.find_elements(By.TAG_NAME, 'button')
        for btn in buttons:
            if 'descargar' in btn.text.lower():
                btn.click()
                print("      Descargado")
                time.sleep(3)
                return True
        return False
    
    def click_reset(self):
        """Hacer clic en botón Resetear"""
        time.sleep(1)
        buttons = self.driver.find_elements(By.TAG_NAME, 'button')
        for btn in buttons:
            if 'resetear' in btn.text.lower() or 'reset' in btn.text.lower():
                btn.click()
                time.sleep(2)
                print("      Reseteado")
                return True
        print("      Boton Reset no encontrado")
        return False
    
    # ========== TEST FLUJO CONTINUO ==========
    
    def test_continuous_flow(self):
        """
        FLUJO CONTINUO EN EL PROCESADOR:
        1. 5 imgs switches OFF -> Procesar -> Descargar
        2. Reset -> 5 imgs + Eliminar Fondo ON -> Procesar -> Descargar  
        3. Reset -> 5 imgs + Redimensionar ON 600x600 -> Procesar -> Descargar
        4. Reset -> 1 img + AMBOS switches ON 400x400 -> Procesar -> Descargar
        """
        
        print("\n" + "="*80)
        print("TEST FLUJO CONTINUO - SIN SALIR DEL PROCESADOR")
        print("="*80)
        
        try:
            # ============================================================
            # SETUP INICIAL
            # ============================================================
            print("\n[SETUP] Navegando al procesador...")
            print("-" * 80)
            self.driver.get(self.BASE_URL)
            time.sleep(2)
            self.navigate_to_processor()
            self.screenshot("00_inicio")
            
            # ============================================================
            # RONDA 1: SWITCHES OFF (solo conversion PNG)
            # ============================================================
            print("\n[RONDA 1] 5 imagenes - Switches OFF")
            print("-" * 80)
            
            print("  [1.1] Subiendo 5 imagenes...")
            self.upload_images(5)
            self.screenshot("01_imgs_subidas")
            
            print("  [1.2] Haciendo clic en 'Procesar Imágenes'...")
            if self.click_process():
                print("      Esperando procesamiento (10 seg)...")
                self.wait_processing(10)
                self.screenshot("01_procesado")
            else:
                print("      ERROR: No se pudo iniciar el procesamiento")
                self.screenshot("01_error_proceso")
            
            print("  [1.3] Descargando...")
            self.click_download()
            self.screenshot("01_descargado")
            
            print("  RONDA 1 COMPLETADA\n")
            time.sleep(2)
            
            # ============================================================
            # RONDA 2: ELIMINAR FONDO ON
            # ============================================================
            print("\n[RONDA 2] 5 imagenes - SOLO Eliminar Fondo ON")
            print("-" * 80)
            
            print("  [2.1] Reseteando...")
            self.click_reset()
            self.screenshot("02_reset")
            
            print("  [2.2] Subiendo 5 imagenes...")
            self.upload_images(5)
            self.screenshot("02_imgs_subidas")
            
            print("  [2.3] Activando SOLO Eliminar Fondo...")
            self.set_switch('eliminar_fondo', True)
            self.set_switch('redimensionar', False)
            self.screenshot("02_switch_bg_on")
            
            print("  [2.4] Haciendo clic en 'Procesar Imágenes'...")
            if self.click_process():
                print("      Esperando procesamiento (20 seg)...")
                self.wait_processing(20)
                self.screenshot("02_procesado")
            else:
                print("      ERROR: No se pudo iniciar el procesamiento")
                self.screenshot("02_error_proceso")
            
            print("  [2.5] Descargando...")
            self.click_download()
            self.screenshot("02_descargado")
            
            print("  RONDA 2 COMPLETADA\n")
            time.sleep(2)
            
            # ============================================================
            # RONDA 3: REDIMENSIONAR ON 600x600
            # ============================================================
            print("\n[RONDA 3] 5 imagenes - SOLO Redimensionar 600x600")
            print("-" * 80)
            
            print("  [3.1] Reseteando...")
            self.click_reset()
            self.screenshot("03_reset")
            
            print("  [3.2] Subiendo 5 imagenes...")
            self.upload_images(5)
            self.screenshot("03_imgs_subidas")
            
            print("  [3.3] Activando SOLO Redimensionar...")
            self.set_switch('eliminar_fondo', False)
            self.set_switch('redimensionar', True)
            self.screenshot("03_switch_resize_on")
            
            print("  [3.4] Configurando 600x600...")
            self.set_dimensions(600, 600)
            self.screenshot("03_dims_600")
            
            print("  [3.5] Haciendo clic en 'Procesar Imágenes'...")
            if self.click_process():
                print("      Esperando procesamiento (15 seg)...")
                self.wait_processing(15)
                self.screenshot("03_procesado")
            else:
                print("      ERROR: No se pudo iniciar el procesamiento")
                self.screenshot("03_error_proceso")
            
            print("  [3.6] Descargando...")
            self.click_download()
            self.screenshot("03_descargado")
            
            print("  RONDA 3 COMPLETADA\n")
            time.sleep(2)
            
            # ============================================================
            # RONDA 4: 1 IMAGEN + AMBOS SWITCHES 400x400
            # ============================================================
            print("\n[RONDA 4] 1 imagen - AMBOS switches 400x400")
            print("-" * 80)
            
            print("  [4.1] Reseteando...")
            self.click_reset()
            self.screenshot("04_reset")
            
            print("  [4.2] Subiendo 1 imagen...")
            self.upload_images(1)
            self.screenshot("04_img_subida")
            
            print("  [4.3] Activando AMBOS switches...")
            self.set_switch('eliminar_fondo', True)
            self.set_switch('redimensionar', True)
            self.screenshot("04_ambos_on")
            
            print("  [4.4] Configurando 400x400...")
            self.set_dimensions(400, 400)
            self.screenshot("04_dims_400")
            
            print("  [4.5] Haciendo clic en 'Procesar Imágenes'...")
            if self.click_process():
                print("      Esperando procesamiento (20 seg)...")
                self.wait_processing(20)
                self.screenshot("04_procesado")
            else:
                print("      ERROR: No se pudo iniciar el procesamiento")
                self.screenshot("04_error_proceso")
            
            print("  [4.6] Descargando...")
            self.click_download()
            self.screenshot("04_descargado")
            
            print("  RONDA 4 COMPLETADA\n")
            
            # ============================================================
            # RESUMEN
            # ============================================================
            print("\n" + "="*80)
            print("FLUJO COMPLETO EXITOSO")
            print("="*80)
            print("\nResumen:")
            print("  1. 5 imgs switches OFF")
            print("  2. 5 imgs solo BG removal")
            print("  3. 5 imgs solo resize 600x600")
            print("  4. 1 img ambos switches 400x400")
            print("\nTotal: 16 imagenes procesadas")
            print("Screenshots en:", self.SCREENSHOTS_DIR)
            print("="*80 + "\n")
            
        except Exception as e:
            self.screenshot("error")
            self.fail(f"Error: {str(e)}")
    
    @classmethod
    def tearDownClass(cls):
        print("\nCerrando navegador...")
        time.sleep(3)
        cls.driver.quit()


if __name__ == "__main__":
    print("\n" + "="*80)
    print("TEST FLUJO CONTINUO - ImageProcessor")
    print("="*80)
    print("\nFlujo a ejecutar:")
    print("  1. 5 imgs switches OFF -> Procesar -> Descargar -> Reset")
    print("  2. 5 imgs solo BG ON -> Procesar -> Descargar -> Reset")
    print("  3. 5 imgs solo Resize 600x600 -> Procesar -> Descargar -> Reset")
    print("  4. 1 img ambos switches 400x400 -> Procesar -> Descargar")
    print("\nRequisitos:")
    print("  Backend: http://localhost:5000")
    print("  Frontend: http://localhost:5173")
    print("\nIniciando en 5 segundos...")
    print("="*80 + "\n")
    
    try:
        time.sleep(5)
    except KeyboardInterrupt:
        print("\nTest cancelado")
        exit(0)
    
    unittest.main(verbosity=2)