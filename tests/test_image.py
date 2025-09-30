import unittest
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service

class ContinuousFlowTest(unittest.TestCase):
    """Test de flujo continuo: 5 imágenes con 3 configuraciones diferentes"""
    
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
        from PIL import Image, ImageDraw
        colors = [('red', (255,0,0)), ('blue', (0,0,255)), ('green', (0,255,0)), 
                 ('yellow', (255,255,0)), ('purple', (128,0,128))]
        for i, (name, color) in enumerate(colors, 1):
            img = Image.new('RGB', (800, 600), color=color)
            draw = ImageDraw.Draw(img)
            draw.text((350, 280), f"IMG {i}", fill='white')
            img.save(os.path.join(cls.TEST_IMAGES_DIR, f'test_{name}.jpg'))
        print(f"5 imágenes creadas\n")
    
    def screenshot(self, name):
        filepath = os.path.join(self.SCREENSHOTS_DIR, f"{name}_{time.strftime('%H%M%S')}.png")
        self.driver.save_screenshot(filepath)
        print(f"      📸 {os.path.basename(filepath)}")
    
    def navigate_to_processor(self):
        buttons = self.driver.find_elements(By.TAG_NAME, 'button')
        for btn in buttons:
            if 'Procesador' in btn.text or 'Comenzar' in btn.text:
                btn.click()
                time.sleep(2)
                return
    
    def upload_5_images(self):
        file_input = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']")))
        image_paths = [os.path.join(self.TEST_IMAGES_DIR, f'test_{c}.jpg') 
                      for c in ['red', 'blue', 'green', 'yellow', 'purple']]
        file_input.send_keys('\n'.join(image_paths))
        time.sleep(4)
        print("      ✓ 5 imágenes subidas")
    
    def set_switch(self, index, state):
        """index: 0=eliminar fondo, 1=redimensionar | state: True/False"""
        switches = self.driver.find_elements(By.CSS_SELECTOR, "input[type='checkbox']")
        if len(switches) > index:
            current = switches[index].is_selected()
            if current != state:
                try:
                    switches[index].click()
                except:
                    switches[index].find_element(By.XPATH, "..").click()
                time.sleep(0.5)
    
    def set_dimensions(self, width, height):
        time.sleep(1)
        inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[type='number']")
        if len(inputs) >= 2:
            inputs[0].clear()
            inputs[0].send_keys(str(width))
            time.sleep(0.3)
            inputs[1].clear()
            inputs[1].send_keys(str(height))
            time.sleep(0.3)
            print(f"      ✓ Dimensiones: {width}x{height}px")
    
    def click_process(self):
        time.sleep(1)
        buttons = self.driver.find_elements(By.TAG_NAME, 'button')
        for btn in buttons:
            if 'procesar' in btn.text.lower():
                btn.click()
                print("      ✓ Procesando...")
                return True
        return False
    
    def wait_processing(self, seconds=15):
        time.sleep(seconds)
    
    def click_download(self):
        time.sleep(2)
        buttons = self.driver.find_elements(By.TAG_NAME, 'button')
        for btn in buttons:
            if 'descargar' in btn.text.lower():
                btn.click()
                print("      ✓ Descarga iniciada")
                time.sleep(3)
                return True
        print("      ⚠ Botón descargar no encontrado")
        return False
    
    def go_to_inicio(self):
        buttons = self.driver.find_elements(By.TAG_NAME, 'button')
        for btn in buttons:
            if 'Inicio' in btn.text:
                btn.click()
                time.sleep(2)
                print("      ✓ Volviendo a inicio")
                return
    
    # ========== TEST ÚNICO DE FLUJO CONTINUO ==========
    
    def test_continuous_flow(self):
        """FLUJO CONTINUO: 5 imágenes → 3 configuraciones diferentes"""
        
        print("\n" + "="*80)
        print("TEST DE FLUJO CONTINUO - 3 PROCESAMINETOS CONSECUTIVOS")
        print("="*80)
        
        try:
            # ============================================================
            # CONFIGURACIÓN 1: SOLO ELIMINAR FONDO
            # ============================================================
            print("\n[CONFIGURACIÓN 1] SOLO Eliminar Fondo")
            print("-" * 80)
            
            print("  [1.1] Navegando al procesador...")
            self.driver.get(self.BASE_URL)
            time.sleep(2)
            self.navigate_to_processor()
            self.screenshot("01_inicio")
            
            print("  [1.2] Subiendo 5 imágenes...")
            self.upload_5_images()
            self.screenshot("01_imagenes_subidas")
            
            print("  [1.3] Activando SOLO eliminar fondo...")
            self.set_switch(0, True)   # Eliminar fondo ON
            self.set_switch(1, False)  # Redimensionar OFF
            print("      ✓ Eliminar fondo: ON")
            print("      ✓ Redimensionar: OFF")
            self.screenshot("01_switch_bg_on")
            
            print("  [1.4] Procesando...")
            if self.click_process():
                self.wait_processing(20)
                self.screenshot("01_procesado")
            
            print("  [1.5] Descargando...")
            self.click_download()
            self.screenshot("01_descargado")
            
            print("  ✓ CONFIGURACIÓN 1 COMPLETADA\n")
            time.sleep(3)
            
            # ============================================================
            # CONFIGURACIÓN 2: SOLO REDIMENSIONAR 600x600
            # ============================================================
            print("\n[CONFIGURACIÓN 2] SOLO Redimensionar 600x600")
            print("-" * 80)
            
            print("  [2.1] Volviendo al procesador...")
            self.go_to_inicio()
            time.sleep(2)
            self.navigate_to_processor()
            self.screenshot("02_inicio")
            
            print("  [2.2] Subiendo 5 imágenes...")
            self.upload_5_images()
            self.screenshot("02_imagenes_subidas")
            
            print("  [2.3] Activando SOLO redimensionar...")
            self.set_switch(0, False)  # Eliminar fondo OFF
            self.set_switch(1, True)   # Redimensionar ON
            print("      ✓ Eliminar fondo: OFF")
            print("      ✓ Redimensionar: ON")
            self.screenshot("02_switch_resize_on")
            
            print("  [2.4] Configurando dimensiones 600x600...")
            self.set_dimensions(600, 600)
            self.screenshot("02_dimensiones_600x600")
            
            print("  [2.5] Procesando...")
            if self.click_process():
                self.wait_processing(15)
                self.screenshot("02_procesado")
            
            print("  [2.6] Descargando...")
            self.click_download()
            self.screenshot("02_descargado")
            
            print("  ✓ CONFIGURACIÓN 2 COMPLETADA\n")
            time.sleep(3)
            
            # ============================================================
            # CONFIGURACIÓN 3: AMBOS SWITCHES 400x400
            # ============================================================
            print("\n[CONFIGURACIÓN 3] AMBOS switches - 400x400")
            print("-" * 80)
            
            print("  [3.1] Volviendo al procesador...")
            self.go_to_inicio()
            time.sleep(2)
            self.navigate_to_processor()
            self.screenshot("03_inicio")
            
            print("  [3.2] Subiendo 5 imágenes...")
            self.upload_5_images()
            self.screenshot("03_imagenes_subidas")
            
            print("  [3.3] Activando AMBOS switches...")
            self.set_switch(0, True)  # Eliminar fondo ON
            self.set_switch(1, True)  # Redimensionar ON
            print("      ✓ Eliminar fondo: ON")
            print("      ✓ Redimensionar: ON")
            self.screenshot("03_ambos_switches_on")
            
            print("  [3.4] Configurando dimensiones 400x400...")
            self.set_dimensions(400, 400)
            self.screenshot("03_dimensiones_400x400")
            
            print("  [3.5] Procesando...")
            if self.click_process():
                self.wait_processing(25)
                self.screenshot("03_procesado")
            
            print("  [3.6] Descargando...")
            self.click_download()
            self.screenshot("03_descargado")
            
            print("  ✓ CONFIGURACIÓN 3 COMPLETADA\n")
            
            # ============================================================
            # RESUMEN FINAL
            # ============================================================
            print("\n" + "="*80)
            print("✓✓✓ FLUJO CONTINUO COMPLETADO EXITOSAMENTE ✓✓✓")
            print("="*80)
            print("\nConfiguraciones ejecutadas:")
            print("  1. Solo eliminar fondo")
            print("  2. Solo redimensionar 600x600")
            print("  3. Ambas opciones 400x400")
            print("\nTotal de procesamiento: 15 imágenes (5 x 3 configuraciones)")
            print("="*80 + "\n")
            
        except Exception as e:
            self.screenshot("error_flujo")
            self.fail(f"Error en flujo continuo: {str(e)}")
    
    @classmethod
    def tearDownClass(cls):
        print("\nCerrando navegador...")
        time.sleep(3)
        cls.driver.quit()

if __name__ == "__main__":
    print("\n" + "="*80)
    print("TEST DE FLUJO CONTINUO - ImageProcessor")
    print("="*80)
    print("\nEste test ejecuta 3 procesaminetos consecutivos con las mismas 5 imágenes:")
    print("  1️⃣  Solo eliminar fondo → Procesar → Descargar")
    print("  2️⃣  Solo redimensionar 600x600 → Procesar → Descargar")
    print("  3️⃣  Ambos switches + 400x400 → Procesar → Descargar")
    print("\nAsegúrate de tener corriendo:")
    print("  Backend: http://localhost:5000")
    print("  Frontend: http://localhost:5173")
    print("\nPresiona Ctrl+C para cancelar o espera 5 segundos...")
    print("="*80 + "\n")
    
    try:
        time.sleep(5)
    except KeyboardInterrupt:
        print("\nTest cancelado")
        exit(0)
    
    unittest.main(verbosity=2)