import React, { useState } from 'react';
import logoImage from './image/TechResources.png';

const HelpPage = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState('primerosPasos');
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const renderContent = () => {
  {/*Primeros Pasos*/}
    switch (activeSection) {
      case 'primerosPasos':
        return (
          <div className="help-page-content">
            <h2 className="help-page-content-title">Primeros Pasos</h2>
            <p className="help-page-content-description">
              ImageProcessor es una herramienta fácil de usar para procesar múltiples imágenes. Sigue esta guía paso a paso para comenzar.
            </p>
            
            <div className="help-page-steps-container">
              <div className="help-page-step-card">
                <div className="help-page-step-number">1</div>
                <div className="help-page-step-content">
                  <h3 className="help-page-step-title">Cargar Imágenes</h3>
                  <p className="help-page-step-description">
                    Arrastra tus imágenes a la zona de carga o haz clic para seleccionarlas. 
                    Puedes subir múltiples imágenes o archivos ZIP sin límite de cantidad.
                  </p>
                </div>
              </div>

              <div className="help-page-step-card">
                <div className="help-page-step-number">2</div>
                <div className="help-page-step-content">
                  <h3 className="help-page-step-title">Configurar Opciones</h3>
                  <p className="help-page-step-description">
                    Activa los switches según tus necesidades: "Eliminar Fondo" para remover 
                    fondos automáticamente o "Redimensionar" para ajustar dimensiones.
                  </p>
                </div>
              </div>

              <div className="help-page-step-card">
                <div className="help-page-step-number">3</div>
                <div className="help-page-step-content">
                  <h3 className="help-page-step-title">Personalizar Dimensiones</h3>
                  <p className="help-page-step-description">
                    Si activaste redimensionamiento, especifica las dimensiones deseadas.
                  </p>
                </div>
              </div>

              <div className="help-page-step-card">
                <div className="help-page-step-number">4</div>
                <div className="help-page-step-content">
                  <h3 className="help-page-step-title">Procesar y Descargar</h3>
                  <p className="help-page-step-description">
                    Haz clic en "Procesar Imágenes" y espera a que termine. Después da clic en descargar 
                    y las  imágenes se descargarán automáticamente en formato PNG optimizado.
                  </p>
                </div>
              </div>
            </div>

            <div className="help-page-info-box">
              <h4>Importante:</h4>
              <p>
                Todas las imágenes procesadas se exportan en formato PNG optimizado, reduciendo el 
                peso hasta un 60% sin perder calidad visual.
              </p>
            </div>
          </div>
        );


       {/*Funcionalidades Principales*/}
      case 'funcionalidades':
        return (
          <div className="help-page-content">
            <h2 className="help-page-content-title">Funcionalidades Principales</h2>
            <p className="help-page-content-description">
              ImageProcessor ofrece dos funciones principales que puedes usar por separado o en combinación:
            </p>

            <div className="help-page-features-grid">
              <div className="help-page-feature-item">
                <div className="help-page-feature-icon-bg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="54" height="48" fill="none" viewBox="0 0 54 48">
                    <path stroke="#F1F3F3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M36 6h11.25m0 0v10m0-10L36 16m2.25 26h4.5c1.194 0 2.338-.421 3.182-1.172.844-.75 1.318-1.767 1.318-2.828m0-14v6M6.75 14v-4c0-1.06.474-2.078 1.318-2.828C8.912 6.422 10.057 6 11.25 6m0 36 9.324-8.288c.253-.225.553-.403.884-.525a3.021 3.021 0 0 1 2.084 0c.33.122.631.3.884.525L29.25 38m-9-32H27M9 22h18c1.243 0 2.25.895 2.25 2v16c0 1.105-1.007 2-2.25 2H9c-1.243 0-2.25-.895-2.25-2V24c0-1.105 1.007-2 2.25-2Z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="help-page-feature-title">Eliminación de Fondo</h3>
                  <p className="help-page-feature-desc">
                    Remueve automáticamente el fondo de cualquier imagen. 
                    Perfecto para productos, retratos y diseños.
                  </p>
                </div>
              </div>

              <div className="help-page-feature-item">
                <div className="help-page-feature-icon-bg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="54" height="48" fill="none" viewBox="0 0 47 37">
                    <path stroke="#F1F3F3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 8.667V4.833c0-1.016.518-1.991 1.44-2.71C3.362 1.403 4.613 1 5.917 1h4.916m24.584 0h4.916c1.304 0 2.555.404 3.477 1.123.922.719 1.44 1.694 1.44 2.71v3.834m0 19.166v3.834c0 1.016-.518 1.991-1.44 2.71-.922.72-2.173 1.123-3.477 1.123h-4.916m-24.584 0H5.917c-1.304 0-2.555-.404-3.477-1.123-.922-.719-1.44-1.694-1.44-2.71v-3.834m12.292-17.25h19.666c1.358 0 2.459.858 2.459 1.917V24c0 1.058-1.101 1.917-2.459 1.917H13.292c-1.358 0-2.459-.859-2.459-1.917V12.5c0-1.059 1.101-1.917 2.459-1.917Z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="help-page-feature-title">Redimensionamiento</h3>
                  <p className="help-page-feature-desc">
                    Ajusta las dimensiones exactas de tus imágenes. 
                    Soporte para formatos cuadrados y rectangulares.
                  </p>
                </div>
              </div>
            </div>

            <h3 className="help-page-section-subtitle">Control de Operaciones</h3>
            <p className="help-page-section-text">
              Los switches independientes te permiten controlar exactamente qué operaciones aplicar:
            </p>

            <div className="help-page-operation-cards">
              <div className="help-page-operation-card">
                <h3 className="help-page-operation-title">Solo Eliminar Fondo</h3>
                <p className="help-page-operation-desc">
                  Activa únicamente el switch "Eliminar Fondo". Las imágenes mantendrán sus 
                  dimensiones originales pero con fondo transparente.
                </p>
              </div>

              <div className="help-page-operation-card">
                <h3 className="help-page-operation-title">Solo Redimensionar</h3>
                <p className="help-page-operation-desc">
                  Activa únicamente el switch "Redimensionar". Las imágenes cambiarán de 
                  tamaño pero mantendrán su fondo original.
                </p>
              </div>

              <div className="help-page-operation-card">
                <h3 className="help-page-operation-title">Ambas Operaciones</h3>
                <p className="help-page-operation-desc">
                  Activa ambos switches. Primero se redimensionará y luego se  eliminará el fondo, 
                  obteniendo imágenes con fondo transparente y dimensiones exactas.
                </p>
              </div>
            </div>
          </div>
        );

      {/*Formatos Soportados*/}
      case 'formatosSoportados':
        return (
          <div className="help-page-content">
            <h2 className="help-page-content-title">Formatos Soportados</h2>
            <p className="help-page-content-description">
              ImageProcessor acepta una amplia variedad de formatos de entrada y siempre 
              produce archivos PNG optimizados.
            </p>

            <h3 className="help-page-section-subtitle">Formatos de Entrada Aceptados</h3>
            <div className="help-page-format-tags">
              <span className="help-page-format-tag">JPEG</span>
              <span className="help-page-format-tag">JPG</span>
              <span className="help-page-format-tag">PNG</span>
              <span className="help-page-format-tag">GIF</span>
              <span className="help-page-format-tag">WEBP</span>
              <span className="help-page-format-tag">BMP</span>
              <span className="help-page-format-tag">TIFF</span>
              <span className="help-page-format-tag">SVG</span>
              <span className="help-page-format-tag">HEIC</span>
              <span className="help-page-format-tag">RAW</span>
              <span className="help-page-format-tag">ZIP</span>
            </div>

            <h3 className="help-page-section-subtitle">Formato de Salida</h3>
            <div className="help-page-output-format">
              <h4 className="help-page-output-title">PNG Optimizado</h4>
              <p className="help-page-output-desc">
                Todas las imágenes procesadas se exportan exclusivamente en formato PNG 
                con optimización avanzada que reduce el peso del archivo hasta un 60% 
                manteniendo la máxima calidad visual.
              </p>
            </div>

            <h3 className="help-page-section-subtitle">Archivos ZIP</h3>
            <p className="help-page-zip-desc">
             Puedes subir archivos ZIP conteniendo múltiples imágenes. El sistema extraerá 
             automáticamente todas las imágenes válidas y las procesará junto con el resto.
            </p>

            <div className="help-page-limits-box">
              <h4>Límites:</h4>
              <p>
              No hay límite en la cantidad de imágenes que puedes procesar. El único límite 
              es la conexión a internet.
              </p>
            </div>
          </div>
        );

      {/*Preguntas Frecuentes*/}
      case 'preguntasFrecuentes':
        return (
          <div className="help-page-content">
            <h2 className="help-page-content-title">Preguntas Frecuentes</h2>
            
            <div className="help-page-faq-list">
              <div className="help-page-faq-item">
                <button className="help-page-faq-question" onClick={() => toggleFaq(0)}>
                  ¿Cuántas imágenes puedo procesar a la vez?
                  <span className="help-page-faq-icon">{openFaq === 0 ? '−' : '+'}</span>
                </button>
                <div className={`help-page-faq-answer ${openFaq === 0 ? 'show' : ''}`}>
                  No hay límite establecido en la cantidad de imágenes. Puedes procesar desde una sola 
                  imagen hasta cientos simultáneamente. El único límite es la capacidad de tu dispositivo.
                </div>
              </div>

              <div className="help-page-faq-item">
                <button className="help-page-faq-question" onClick={() => toggleFaq(1)}>
                  ¿Por qué solo exporta en formato PNG?
                  <span className="help-page-faq-icon">{openFaq === 1 ? '−' : '+'}</span>
                </button>
                <div className={`help-page-faq-answer ${openFaq === 1 ? 'show' : ''}`}>
                  PNG es el formato ideal para web porque soporta transparencia (crucial para fondos eliminados), 
                  mantiene alta calidad y permite optimización avanzada. Nuestro sistema optimiza automáticamente 
                  los PNG reduciendo su peso sin perder calidad.
                </div>
              </div>

              <div className="help-page-faq-item">
                <button className="help-page-faq-question" onClick={() => toggleFaq(2)}>
                  ¿Puedo usar ambas funciones al mismo tiempo?
                  <span className="help-page-faq-icon">{openFaq === 2 ? '−' : '+'}</span>
                </button>
                <div className={`help-page-faq-answer ${openFaq === 2 ? 'show' : ''}`}>
                  Sí, puedes activar ambos switches simultáneamente. El sistema aplicará primero la 
                  eliminación de fondo y luego el redimensionamiento, preservando la transparencia 
                  durante todo el proceso.
                </div>
              </div>

              <div className="help-page-faq-item">
                <button className="help-page-faq-question" onClick={() => toggleFaq(3)}>
                  ¿Qué pasa si algunas imágenes fallan al procesarse?
                  <span className="help-page-faq-icon">{openFaq === 3 ? '−' : '+'}</span>
                </button>
                <div className={`help-page-faq-answer ${openFaq === 3 ? 'show' : ''}`}>
                  El sistema procesará exitosamente todas las imágenes válidas y te notificará sobre 
                  cualquier archivo que no pudo procesarse, proporcionando detalles sobre la causa del error.
                </div>
              </div>
            </div>
          </div>
        );

      {/*Solución de Problemas*/}
      case 'solucionProblemas':
        return (
          <div className="help-page-content">
            <h2 className="help-page-content-title">Solución de Problemas</h2>
            
            <h3 className="help-page-section-subtitle">Problemas Comunes y Soluciones</h3>
            
            <div className="help-page-problem-list">
              <div className="help-page-problem-item">
                <h3 className="help-page-problem-title">Las imágenes no se cargan</h3>
                <p className="help-page-problem-solution">
                  Verifica que los archivos sean imágenes válidas o archivos ZIP. Asegúrate de tener 
                  una conexión estable a internet y suficiente espacio en tu dispositivo.
                </p>
              </div>

              <div className="help-page-problem-item">
                <h3 className="help-page-problem-title">El procesamiento es lento</h3>
                <p className="help-page-problem-solution">
                  El tiempo de procesamiento depende del número de imágenes, su tamaño y la potencia 
                  de tu dispositivo. Para archivos muy grandes, considera procesarlos en lotes más pequeños.
                </p>
              </div>

              <div className="help-page-problem-item">
                <h3 className="help-page-problem-title">La descarga no inicia</h3>
                <p className="help-page-problem-solution">
                  Verifica que tu navegador permite descargas automáticas. Si procesas múltiples imágenes, 
                  la descarga será un archivo ZIP que puede tardar unos segundos en generarse.
                </p>
              </div>

              <div className="help-page-problem-item">
                <h3 className="help-page-problem-title">Calidad de eliminación de fondo</h3>
                <p className="help-page-problem-solution">
                  La calidad de eliminación de fondo varía según la complejidad de la imagen. Funciona 
                  mejor con sujetos claramente definidos y fondos contrastantes.
                </p>
              </div>
            </div>
          </div>
        );

      {/*Consejos y Trucos*/}
      case 'consejosTrucos':
        return (
          <div className="help-page-content">
            <h2 className="help-page-content-title">Consejos y Trucos</h2>
            
            <h3 className="help-page-section-subtitle">Optimiza tus Resultados</h3>
            
            <div className="help-page-tips-list">
              <div className="help-page-tip-item">
                <h3 className="help-page-tip-title">Para Mejor Eliminación de Fondo</h3>
                <p className="help-page-tip-desc">
                  Usa imágenes con sujetos bien definidos y fondos contrastantes. Evita fondos 
                  con patrones complejos o colores similares al sujeto principal.
                </p>
              </div>

              <div className="help-page-tip-item">
                <h3 className="help-page-tip-title">Para Redimensionamiento Óptimo</h3>
                <p className="help-page-tip-desc">
                  Mantén las proporciones originales cuando sea posible para evitar distorsión. 
                  Usa los presets comunes para resultados consistentes.
                </p>
              </div>

              <div className="help-page-tip-item">
                <h3 className="help-page-tip-title">Procesamiento Masivo Eficiente</h3>
                <p className="help-page-tip-desc">
                  Organiza tus imágenes en carpetas y usa archivos ZIP para cargar múltiples 
                  imágenes relacionadas de una vez.
                </p>
              </div>

              <div className="help-page-tip-item">
                <h3 className="help-page-tip-title">Optimización para Web</h3>
                <p className="help-page-tip-desc">
                  Los PNG optimizados son perfectos para web. Si necesitas archivos aún más pequeños, 
                  considera usar las dimensiones más pequeñas posibles sin perder calidad visual.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen app-background">
      {/* Header */}
      <header className="header">
        <div className="container header-content">
          <div className="logo-section">
            <img 
              src={logoImage}
              alt="TechRessources Logo"
              className="logo-image"
            />
          </div>
          <nav className="navigation">
            <button onClick={() => onNavigate('home')} className="nav-link">
              Inicio
            </button>
            <button onClick={() => onNavigate('procesador')} className="nav-link">
              Procesador
            </button>
            <button onClick={() => onNavigate('ayuda')} className="nav-link nav-active">
              Ayuda
            </button>
            <button onClick={() => onNavigate('contacto')} className="nav-link">
              Contacto
            </button>
          </nav>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="help-page-main">
        <div className="help-page-container">
          <div className="help-page-brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="245" height="39" fill="none" viewBox="0 0 245 39">
                <path fill="url(#a)" d="M5.636 7.727V31H2.818V7.727h2.818ZM10.923 31V13.546h2.591v2.727h.228c.363-.932.95-1.656 1.76-2.17.811-.524 1.785-.785 2.921-.785 1.152 0 2.11.261 2.875.784.773.515 1.375 1.239 1.807 2.17h.182a5.085 5.085 0 0 1 2.011-2.147c.894-.538 1.966-.807 3.216-.807 1.56 0 2.837.489 3.83 1.466.992.97 1.488 2.481 1.488 4.534V31h-2.681V19.318c0-1.288-.353-2.208-1.057-2.761-.705-.553-1.534-.83-2.489-.83-1.227 0-2.178.372-2.852 1.114-.674.735-1.012 1.667-1.012 2.795V31h-2.727V19.046c0-.993-.322-1.792-.966-2.398-.644-.614-1.473-.92-2.488-.92-.697 0-1.349.185-1.955.556a4.205 4.205 0 0 0-1.454 1.546c-.364.651-.546 1.405-.546 2.26V31h-2.682Zm32.95.41c-1.107 0-2.11-.21-3.012-.626a5.168 5.168 0 0 1-2.148-1.83c-.53-.803-.795-1.772-.795-2.909 0-1 .197-1.81.59-2.431a4.17 4.17 0 0 1 1.58-1.478 8.301 8.301 0 0 1 2.182-.795c.803-.182 1.61-.326 2.42-.432 1.06-.136 1.92-.238 2.58-.307.667-.076 1.151-.2 1.454-.375.311-.174.466-.477.466-.909v-.09c0-1.122-.306-1.993-.92-2.614-.606-.622-1.527-.932-2.762-.932-1.28 0-2.284.28-3.01.84-.728.561-1.24 1.16-1.535 1.796l-2.545-.909c.454-1.06 1.06-1.886 1.818-2.477a6.814 6.814 0 0 1 2.5-1.25 10.38 10.38 0 0 1 2.682-.364c.56 0 1.204.068 1.931.205a6.184 6.184 0 0 1 2.125.806c.69.41 1.262 1.027 1.716 1.853.455.826.682 1.932.682 3.318V31H49.19v-2.364h-.136c-.182.38-.485.785-.91 1.216-.423.432-.988.8-1.692 1.102-.705.304-1.565.455-2.58.455ZM44.28 29c1.06 0 1.955-.208 2.682-.625.735-.417 1.288-.954 1.66-1.614a4.118 4.118 0 0 0 .567-2.08v-2.454c-.113.137-.363.262-.75.375-.378.106-.818.201-1.318.284-.492.076-.973.144-1.443.205-.462.053-.837.098-1.125.136a10.22 10.22 0 0 0-1.955.444c-.598.196-1.083.496-1.454.897-.364.394-.546.932-.546 1.614 0 .932.345 1.636 1.035 2.114.697.47 1.58.704 2.647.704Zm19.532 8.91c-1.296 0-2.41-.168-3.341-.5-.932-.327-1.709-.758-2.33-1.296a7.088 7.088 0 0 1-1.466-1.705l2.136-1.5c.243.318.55.682.921 1.091.371.417.879.776 1.523 1.08.651.31 1.504.465 2.556.465 1.41 0 2.573-.34 3.49-1.022.916-.682 1.374-1.75 1.374-3.205v-3.545h-.227c-.197.318-.477.712-.841 1.181-.356.463-.871.875-1.546 1.24-.666.355-1.568.533-2.704.533-1.41 0-2.674-.333-3.795-1-1.114-.666-1.997-1.636-2.648-2.909-.644-1.273-.966-2.818-.966-4.636 0-1.788.314-3.345.943-4.67.629-1.334 1.504-2.364 2.625-3.091 1.121-.735 2.417-1.103 3.886-1.103 1.137 0 2.038.19 2.705.568.674.372 1.19.796 1.545 1.273.364.47.644.856.841 1.16h.273v-2.773h2.591V31.5c0 1.5-.341 2.72-1.023 3.66-.674.946-1.583 1.64-2.727 2.079-1.136.447-2.402.67-3.796.67Zm-.091-9.592c1.075 0 1.984-.246 2.727-.739.742-.492 1.307-1.2 1.693-2.125.386-.924.58-2.03.58-3.318 0-1.257-.19-2.367-.569-3.33-.378-.961-.939-1.715-1.681-2.26-.743-.546-1.66-.819-2.75-.819-1.137 0-2.084.288-2.841.864-.75.576-1.315 1.348-1.694 2.318-.37.97-.556 2.046-.556 3.227 0 1.213.19 2.285.568 3.216.386.924.954 1.652 1.704 2.182.758.523 1.697.784 2.819.784Zm19.863 3.046c-1.682 0-3.132-.372-4.352-1.114-1.212-.75-2.148-1.796-2.807-3.136-.651-1.349-.977-2.917-.977-4.705 0-1.788.326-3.363.977-4.727.66-1.371 1.576-2.44 2.75-3.205 1.182-.773 2.56-1.159 4.136-1.159.91 0 1.807.152 2.694.455a6.674 6.674 0 0 1 2.42 1.477c.727.674 1.307 1.568 1.739 2.682.432 1.114.647 2.485.647 4.114v1.136H77.358v-2.318h10.727c0-.985-.197-1.864-.59-2.637a4.452 4.452 0 0 0-1.66-1.83c-.712-.446-1.553-.67-2.522-.67-1.069 0-1.993.265-2.773.796a5.232 5.232 0 0 0-1.784 2.045 6.008 6.008 0 0 0-.625 2.705v1.545c0 1.318.227 2.436.681 3.352.463.91 1.103 1.603 1.921 2.08.818.47 1.769.704 2.852.704.705 0 1.341-.098 1.91-.295a4.088 4.088 0 0 0 1.488-.909c.417-.41.739-.917.966-1.523l2.59.727a5.745 5.745 0 0 1-1.374 2.319c-.644.659-1.44 1.174-2.387 1.545-.947.364-2.011.546-3.193.546ZM95.255 31V7.727h7.864c1.826 0 3.319.33 4.478.989 1.166.651 2.03 1.534 2.591 2.648.56 1.113.84 2.356.84 3.727s-.28 2.617-.84 3.739c-.554 1.12-1.41 2.015-2.569 2.681-1.159.66-2.644.989-4.454.989h-5.637V20h5.546c1.25 0 2.254-.216 3.011-.648.758-.431 1.307-1.015 1.648-1.75.348-.742.523-1.58.523-2.511 0-.932-.175-1.765-.523-2.5-.341-.735-.894-1.31-1.659-1.727-.765-.425-1.78-.637-3.046-.637h-4.954V31h-2.818Zm19.95 0V13.546h2.59v2.636h.182c.318-.864.894-1.565 1.728-2.102.833-.538 1.772-.807 2.818-.807.197 0 .443.004.738.011.296.008.519.019.671.034v2.728a7.878 7.878 0 0 0-.625-.103 6.152 6.152 0 0 0-1.012-.08c-.848 0-1.606.179-2.272.535a4.027 4.027 0 0 0-1.568 1.454c-.379.614-.569 1.315-.569 2.102V31h-2.681Zm18.465.364c-1.575 0-2.958-.375-4.147-1.125-1.182-.75-2.106-1.8-2.773-3.148-.659-1.349-.989-2.924-.989-4.727 0-1.819.33-3.406.989-4.762.667-1.356 1.591-2.409 2.773-3.159 1.189-.75 2.572-1.125 4.147-1.125 1.576 0 2.955.375 4.137 1.125 1.189.75 2.113 1.803 2.773 3.16.666 1.355 1 2.942 1 4.76 0 1.804-.334 3.38-1 4.728-.66 1.348-1.584 2.398-2.773 3.148-1.182.75-2.561 1.125-4.137 1.125Zm0-2.41c1.197 0 2.182-.306 2.955-.92.773-.613 1.345-1.42 1.716-2.42s.557-2.084.557-3.25c0-1.167-.186-2.254-.557-3.262-.371-1.007-.943-1.822-1.716-2.443s-1.758-.932-2.955-.932-2.181.31-2.954.932c-.773.621-1.345 1.436-1.716 2.443-.371 1.008-.557 2.095-.557 3.262 0 1.166.186 2.25.557 3.25.371 1 .943 1.806 1.716 2.42.773.614 1.757.92 2.954.92Zm19.094 2.41c-1.636 0-3.045-.387-4.227-1.16-1.182-.772-2.091-1.837-2.727-3.193-.637-1.356-.955-2.905-.955-4.647 0-1.773.326-3.338.977-4.694.659-1.363 1.576-2.428 2.75-3.193 1.182-.773 2.561-1.159 4.137-1.159 1.227 0 2.333.228 3.318.682a6.345 6.345 0 0 1 2.42 1.91c.629.817 1.019 1.772 1.171 2.863h-2.682c-.205-.796-.659-1.5-1.364-2.114-.697-.621-1.636-.932-2.818-.932-1.045 0-1.962.273-2.75.819-.78.537-1.39 1.299-1.829 2.284-.432.977-.648 2.125-.648 3.443 0 1.348.212 2.523.636 3.523.432 1 1.038 1.776 1.818 2.329.788.553 1.713.83 2.773.83.697 0 1.33-.122 1.898-.364a3.916 3.916 0 0 0 1.443-1.046c.394-.454.674-1 .841-1.636h2.682a6.224 6.224 0 0 1-1.125 2.784c-.591.818-1.375 1.47-2.352 1.955-.97.477-2.099.716-3.387.716Zm18.102 0c-1.681 0-3.132-.372-4.352-1.114-1.212-.75-2.148-1.796-2.807-3.136-.651-1.349-.977-2.917-.977-4.705 0-1.788.326-3.363.977-4.727.659-1.371 1.576-2.44 2.75-3.205 1.182-.773 2.561-1.159 4.137-1.159.909 0 1.807.152 2.693.455a6.673 6.673 0 0 1 2.42 1.477c.728.674 1.307 1.568 1.739 2.682.432 1.114.648 2.485.648 4.114v1.136h-13.455v-2.318h10.727c0-.985-.196-1.864-.59-2.637a4.457 4.457 0 0 0-1.66-1.83c-.712-.446-1.553-.67-2.522-.67-1.068 0-1.993.265-2.773.796a5.233 5.233 0 0 0-1.784 2.045 6.005 6.005 0 0 0-.625 2.705v1.545c0 1.318.227 2.436.682 3.352.462.91 1.102 1.603 1.92 2.08.818.47 1.769.704 2.852.704.705 0 1.341-.098 1.91-.295a4.086 4.086 0 0 0 1.488-.909c.417-.41.739-.917.966-1.523l2.591.727a5.747 5.747 0 0 1-1.375 2.319c-.644.659-1.439 1.174-2.386 1.545-.947.364-2.012.546-3.194.546Zm23.671-13.91-2.409.682a4.475 4.475 0 0 0-.671-1.17c-.287-.387-.681-.705-1.181-.955s-1.141-.375-1.921-.375c-1.068 0-1.958.247-2.67.739-.705.485-1.057 1.102-1.057 1.852 0 .667.242 1.194.727 1.58.485.386 1.243.708 2.273.966l2.591.636c1.56.379 2.723.958 3.488 1.739.766.773 1.148 1.769 1.148 2.988 0 1-.288 1.894-.864 2.682-.568.788-1.363 1.41-2.386 1.864-1.023.454-2.212.682-3.568.682-1.78 0-3.254-.387-4.421-1.16-1.166-.772-1.905-1.901-2.215-3.386l2.545-.636c.242.94.701 1.644 1.375 2.114.682.47 1.572.704 2.67.704 1.25 0 2.243-.265 2.978-.796.742-.537 1.113-1.181 1.113-1.931a2.03 2.03 0 0 0-.636-1.523c-.424-.417-1.076-.727-1.955-.932l-2.909-.682c-1.598-.378-2.772-.965-3.522-1.761-.743-.803-1.114-1.807-1.114-3.011 0-.985.277-1.856.83-2.614.56-.758 1.322-1.352 2.284-1.784.969-.432 2.068-.648 3.295-.648 1.727 0 3.083.379 4.068 1.136.993.758 1.697 1.758 2.114 3Zm16.719 0-2.409.682a4.475 4.475 0 0 0-.671-1.17c-.288-.387-.682-.705-1.182-.955-.5-.25-1.14-.375-1.92-.375-1.068 0-1.958.247-2.671.739-.704.485-1.056 1.102-1.056 1.852 0 .667.242 1.194.727 1.58.485.386 1.242.708 2.273.966l2.591.636c1.56.379 2.723.958 3.488 1.739.765.773 1.148 1.769 1.148 2.988 0 1-.288 1.894-.864 2.682-.568.788-1.363 1.41-2.386 1.864-1.023.454-2.212.682-3.568.682-1.781 0-3.254-.387-4.421-1.16-1.166-.772-1.905-1.901-2.216-3.386l2.546-.636c.242.94.701 1.644 1.375 2.114.682.47 1.572.704 2.67.704 1.25 0 2.243-.265 2.978-.796.742-.537 1.113-1.181 1.113-1.931a2.03 2.03 0 0 0-.636-1.523c-.424-.417-1.076-.727-1.955-.932l-2.909-.682c-1.598-.378-2.773-.965-3.523-1.761-.742-.803-1.113-1.807-1.113-3.011 0-.985.276-1.856.829-2.614.561-.758 1.322-1.352 2.284-1.784.97-.432 2.069-.648 3.296-.648 1.727 0 3.083.379 4.068 1.136.992.758 1.697 1.758 2.114 3Zm11.446 13.91c-1.576 0-2.959-.375-4.148-1.125-1.182-.75-2.106-1.8-2.773-3.148-.659-1.349-.988-2.924-.988-4.727 0-1.819.329-3.406.988-4.762.667-1.356 1.591-2.409 2.773-3.159 1.189-.75 2.572-1.125 4.148-1.125 1.575 0 2.954.375 4.136 1.125 1.189.75 2.114 1.803 2.773 3.16.666 1.355 1 2.942 1 4.76 0 1.804-.334 3.38-1 4.728-.659 1.348-1.584 2.398-2.773 3.148-1.182.75-2.561 1.125-4.136 1.125Zm0-2.41c1.197 0 2.182-.306 2.954-.92.773-.613 1.345-1.42 1.716-2.42s.557-2.084.557-3.25c0-1.167-.186-2.254-.557-3.262-.371-1.007-.943-1.822-1.716-2.443-.772-.621-1.757-.932-2.954-.932-1.197 0-2.182.31-2.955.932-.773.621-1.345 1.436-1.716 2.443-.371 1.008-.557 2.095-.557 3.262 0 1.166.186 2.25.557 3.25.371 1 .943 1.806 1.716 2.42.773.614 1.758.92 2.955.92ZM234.705 31V13.546h2.59v2.636h.182c.318-.864.894-1.565 1.728-2.102.833-.538 1.772-.807 2.818-.807.197 0 .443.004.738.011.296.008.519.019.671.034v2.728a7.878 7.878 0 0 0-.625-.103 6.152 6.152 0 0 0-1.012-.08c-.848 0-1.606.179-2.272.535a4.027 4.027 0 0 0-1.568 1.454c-.379.614-.569 1.315-.569 2.102V31h-2.681Z"/>
                <defs>
                  <linearGradient id="a" x1="0" x2="245" y1="19.5" y2="19.5" gradientUnits="userSpaceOnUse">
                    <stop offset=".139" stop-color="#0B1425"/>
                    <stop offset=".779" stop-color="#294B8B"/>
                  </linearGradient>
                </defs>
              </svg>
          </div>
          
          <div className="help-page-header">
            <h1 className="help-page-title">Centro de Ayuda</h1>
            <p className="help-page-subtitle">
              Encuentra toda la información que necesitas para sacar el máximo provecho de ImageProcessor
            </p>
          </div>

          <div className="help-page-layout">
            {/* Navegación de la barra lateral */}
            <div className="help-page-sidebar">
              <h3 className="help-page-sidebar-title">Navegación</h3>
              <nav className="help-page-sidebar-nav">
                <button 
                  onClick={() => setActiveSection('primerosPasos')}
                  className={`help-page-sidebar-btn ${activeSection === 'primerosPasos' ? 'active' : ''}`}
                >
                  Primeros Pasos
                </button>
                <button 
                  onClick={() => setActiveSection('funcionalidades')}
                  className={`help-page-sidebar-btn ${activeSection === 'funcionalidades' ? 'active' : ''}`}
                >
                  Funcionalidades
                </button>
                <button 
                  onClick={() => setActiveSection('formatosSoportados')}
                  className={`help-page-sidebar-btn ${activeSection === 'formatosSoportados' ? 'active' : ''}`}
                >
                  Formatos Soportados
                </button>
                <button 
                  onClick={() => setActiveSection('preguntasFrecuentes')}
                  className={`help-page-sidebar-btn ${activeSection === 'preguntasFrecuentes' ? 'active' : ''}`}
                >
                  Preguntas Frecuentes
                </button>
                <button 
                  onClick={() => setActiveSection('solucionProblemas')}
                  className={`help-page-sidebar-btn ${activeSection === 'solucionProblemas' ? 'active' : ''}`}
                >
                  Solución de Problemas
                </button>
                <button 
                  onClick={() => setActiveSection('consejosTrucos')}
                  className={`help-page-sidebar-btn ${activeSection === 'consejosTrucos' ? 'active' : ''}`}
                >
                  Consejos y Trucos
                </button>
              </nav>
            </div>

            {/* Area de Contenido */}
            <div className="help-page-content-area">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;