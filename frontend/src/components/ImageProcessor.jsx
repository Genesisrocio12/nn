import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useProportionalResize } from '../hooks/useProportionalResize';
import logoImage from './image/TechResources.png';

const ImageProcessor = ({ onNavigate }) => {
  const [backgroundRemoval, setBackgroundRemoval] = useState(false);
  const [resize, setResize] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processedResults, setProcessedResults] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [switchProcessing, setSwitchProcessing] = useState(false);

  const fileInputRef = useRef(null);
  const API_BASE_URL = 'http://localhost:5000/api';

  // Hook simplificado para auto-completado
  const {
    width,
    height,
    originalDimensions,
    isLoadingDimensions,
    handleWidthChange,
    handleHeightChange,
    handleWidthChangeOnly,
    handleHeightChangeOnly,
    loadImageDimensions,
    resetDimensions,
    applyPreset,
    clearDimensions,
    hasValidDimensions,
    makeSquare
  } = useProportionalResize();

  // Estado para modo de edición
  const [editingMode, setEditingMode] = useState('proportional'); // 'proportional' o 'free'

  // Cargar dimensiones cuando se obtiene sessionId
  useEffect(() => {
    if (sessionId && uploadedFiles.length > 0) {
      loadImageDimensions(sessionId);
    }
  }, [sessionId, uploadedFiles.length, loadImageDimensions]);

  // Auto-procesar cuando se cargan archivos o cambian switches
  useEffect(() => {
    if (uploadedFiles.length > 0 && sessionId && !loading && !processing && !switchProcessing) {
      setSwitchProcessing(true);
      const timer = setTimeout(() => {
        handleProcess().finally(() => {
          setSwitchProcessing(false);
        });
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [backgroundRemoval, resize, uploadedFiles.length]);

  // Manejar drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Manejar drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  // Manejar input de archivos
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // Procesar archivos cargados
  const handleFiles = async (files) => {
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error subiendo archivos');
      }

      const data = await response.json();
      
      setUploadedFiles(prev => [...prev, ...data.files]);
      setSessionId(data.session_id);
      
      // Auto-procesar después de cargar
      setTimeout(() => {
        handleProcessWithSession(data.session_id);
      }, 500);
      
      if (data.errors && data.errors.length > 0) {
        setError(`Advertencias: ${data.errors.join(', ')}`);
      }

    } catch (err) {
      setError(err.message);
      console.error('Error uploading files:', err);
    } finally {
      setLoading(false);
    }
  };

  // Procesar imágenes
  const handleProcess = async () => {
    if (!sessionId || uploadedFiles.length === 0) {
      setError('No hay archivos para procesar');
      return;
    }
    return await handleProcessWithSession(sessionId);
  };

  // Procesar con session específica
  const handleProcessWithSession = async (currentSessionId) => {
    setError('');
    setProcessing(true);

    try {
      const response = await fetch(`${API_BASE_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: currentSessionId,
          background_removal: backgroundRemoval,
          resize: resize,
          width: width ? parseInt(width) : null,
          height: height ? parseInt(height) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error procesando imágenes');
      }

      const data = await response.json();
      setProcessedResults(data.results);
      
    } catch (err) {
      setError(err.message);
      console.error('Error processing images:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Descargar resultados
  const handleDownload = async () => {
    if (!sessionId) {
      setError('No hay archivos para descargar');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/download/${sessionId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error descargando archivos');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `imagenes_procesadas_${Date.now()}.zip`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError(err.message);
    }
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const clearFiles = () => {
    setUploadedFiles([]);
    setProcessedResults([]);
    setSessionId(null);
    setError('');
    setSwitchProcessing(false);
    clearDimensions(); // Limpiar también las dimensiones
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const shouldShowResults = processedResults.length > 0;

  const handleBackgroundRemovalToggle = () => {
    if (!processing && !switchProcessing) {
      setBackgroundRemoval(!backgroundRemoval);
    }
  };

  const handleResizeToggle = () => {
    if (!processing && !switchProcessing) {
      setResize(!resize);
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
              alt="TechResources Logo"
              className="logo-image"
            />
          </div>
          <nav className="navigation">
            <button onClick={() => onNavigate('home')} className="nav-link">
              Inicio
            </button>
            <button onClick={() => onNavigate('procesador')} className="nav-link nav-active">
              Procesador
            </button>
            <button onClick={() => onNavigate('ayuda')} className="nav-link">
              Ayuda
            </button>
            <button onClick={() => onNavigate('contacto')} className="nav-link">
              Contacto
            </button>
          </nav>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="processor-main">
        <div className="processor-container">
          <div className="processor-title-section">
            <h2 className="processor-main-title">Procesador de Imágenes</h2>
            <p className="processor-main-subtitle">
              Sube múltiples imágenes o archivos ZIP y configura las opciones de procesamiento
            </p>
          </div>

          {/* Mensajes de estado */}
          {error && (
            <div className="message-error">
              {error}
            </div>
          )}

          {/* Cuadrícula de Contenido */}
          <div className="processor-content-grid">
            
            {/* Sección de carga */}
            <div className="processor-upload-section">
              <div 
                className={`processor-upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="processor-upload-icon">
                  {loading ? (
                    <div className="loading-icon">⏳ Cargando...</div>
                  ) : (
                    <div className="folder-icon">📁</div>
                  )}
                </div>
                <h3 className="processor-upload-title">
                  {uploadedFiles.length > 0 
                    ? `${uploadedFiles.length} archivos cargados`
                    : 'Arrastra tus imágenes aquí'
                  }
                </h3>
                <p className="processor-upload-subtitle">
                  {uploadedFiles.length > 0 
                    ? 'Puedes agregar más archivos o resetear'
                    : 'o haz clic para seleccionar archivos'
                  }
                </p>
                
                <div className="upload-buttons">
                  <button 
                    className="processor-select-files-btn"
                    onClick={openFileSelector}
                    disabled={loading}
                  >
                    {uploadedFiles.length > 0 ? 'Agregar Más' : 'Seleccionar Archivos'}
                  </button>
                  
                  {uploadedFiles.length > 0 && (
                    <button 
                      className="processor-clear-btn"
                      onClick={clearFiles}
                      disabled={loading || processing || switchProcessing}
                    >
                      Resetear
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.zip"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Sección de opciones */}
            <div className="processor-options-section">
              <h3 className="processor-options-title">Opciones de Procesamiento</h3>
              
              {/* Opción eliminar fondo */}
              <div className={`processor-option-card ${backgroundRemoval ? 'active' : ''}`}>
                <div className="processor-option-content">
                  <div className="processor-option-text">
                    <h4 className="processor-option-title">
                      Eliminar Fondo
                      {switchProcessing && backgroundRemoval && (
                        <span className="processing-indicator"> ⏳</span>
                      )}
                    </h4>
                    <p className="processor-option-description">
                      Remueve automáticamente el fondo
                    </p>
                  </div>
                  <div className="processor-option-toggle">
                    <div 
                      className={`processor-toggle ${backgroundRemoval ? 'processor-toggle-active' : ''} ${(processing || switchProcessing) ? 'disabled' : ''}`}
                      onClick={handleBackgroundRemovalToggle}
                    >
                      <div className="processor-toggle-slider"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opción redimensionar */}
              <div className={`processor-option-card ${resize ? 'active' : ''}`}>
                <div className="processor-option-content">
                  <div className="processor-option-text">
                    <h4 className="processor-option-title">
                      Redimensionar
                      {switchProcessing && resize && (
                        <span className="processing-indicator"> ⏳</span>
                      )}
                    </h4>
                    <p className="processor-option-description">
                      Ajusta las dimensiones automáticamente
                    </p>
                  </div>
                  <div className="processor-option-toggle">
                    <div 
                      className={`processor-toggle ${resize ? 'processor-toggle-active' : ''} ${(processing || switchProcessing) ? 'disabled' : ''}`}
                      onClick={handleResizeToggle}
                    >
                      <div className="processor-toggle-slider"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel de dimensiones - Solo cuando resize está ON */}
              {resize && (
                <div className="dimensions-panel">
                  <h4 className="dimensions-title">Nuevas Dimensiones</h4>
                  
                  {/* Info de imagen original */}
                  {hasValidDimensions && (
                    <div className="original-info">
                      <span className="info-label">Original:</span>
                      <span className="info-value">
                        {originalDimensions.width} × {originalDimensions.height} px
                      </span>
                    </div>
                  )}

                  {isLoadingDimensions && (
                    <div className="loading-info">
                      Analizando imagen...
                    </div>
                  )}

                  {/* Modo de edición */}
                  <div className="editing-mode">
                    <div className="mode-tabs">
                      <button 
                        className={`mode-tab ${editingMode === 'proportional' ? 'active' : ''}`}
                        onClick={() => setEditingMode('proportional')}
                      >
                        Proporcional
                      </button>
                      <button 
                        className={`mode-tab ${editingMode === 'free' ? 'active' : ''}`}
                        onClick={() => setEditingMode('free')}
                      >
                        Libre
                      </button>
                    </div>
                    <p className="mode-description">
                      {editingMode === 'proportional' 
                        ? 'Escribe un valor y el otro se auto-completa' 
                        : 'Edita ambos campos independientemente'
                      }
                    </p>
                  </div>

                  {/* Inputs de dimensiones */}
                  <div className="dimensions-inputs">
                    <div className="input-field">
                      <label>Ancho (px)</label>
                      <input
                        type="number"
                        value={width}
                        onChange={(e) => 
                          editingMode === 'proportional' 
                            ? handleWidthChange(e.target.value)
                            : handleWidthChangeOnly(e.target.value)
                        }
                        placeholder="Ej: 400"
                        disabled={processing || switchProcessing || isLoadingDimensions}
                        className="dimension-input"
                      />
                    </div>
                    
                    <div className="input-field">
                      <label>Alto (px)</label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => 
                          editingMode === 'proportional' 
                            ? handleHeightChange(e.target.value)
                            : handleHeightChangeOnly(e.target.value)
                        }
                        placeholder="Ej: 300"
                        disabled={processing || switchProcessing || isLoadingDimensions}
                        className="dimension-input"
                      />
                    </div>
                  </div>

                  {/* Botón procesar manual */}
                  {uploadedFiles.length > 0 && !switchProcessing && (
                    <button 
                      className="process-btn"
                      onClick={handleProcess}
                      disabled={processing || loading}
                    >
                      {processing ? 'Procesando...' : 'Procesar Imágenes'}
                    </button>
                  )}
                </div>
              )}
              </div>
            </div>

          {/* Sección de Resultados */}
          {shouldShowResults && (
            <div className="processor-results-section">
              <div className="processor-results-header">
                <div className="processor-results-header-left">
                  <div className="processor-results-icon">🔄</div>
                  <h3 className="processor-results-title">Imágenes Procesadas</h3>
                </div>
                <p className="processor-results-stats">
                  {processedResults.filter(r => r.success).length} de {processedResults.length} procesadas exitosamente
                </p>
              </div>
              
              <div className="processor-results-content">
                <div className="results-grid">
                  {processedResults.map((result) => (
                    <div key={result.id} className={`result-item ${result.success ? 'success' : 'error'}`}>
                      <div className="result-left-section">
                        {result.success && result.preview_url ? (
                          <div className="result-image-preview">
                            <img 
                              src={result.preview_url} 
                              alt={result.original_name}
                              className="preview-image"
                            />
                          </div>
                        ) : (
                          <div className="result-icon">
                            {result.success ? '✅' : '❌'}
                          </div>
                        )}
                        
                        <div className="result-info">
                          <h5 className="result-name">{result.original_name}</h5>
                          <p className="result-status">{result.message}</p>
                          
                          {result.success && result.operations && result.operations.length > 0 && (
                            <div className="result-operations">
                              {result.operations.map((op, i) => (
                                <span key={i} className="operation-detail">{op}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {result.success && (
                        <div className="result-right-section">
                          <div className="result-stats">
                            {result.final_size && (
                              <div className="size-info">
                                <span className="size-label">Tamaño:</span>
                                <span className="size-value">{(result.final_size / 1024).toFixed(1)} KB</span>
                              </div>
                            )}
                            
                            {result.size_reduction !== null && result.size_reduction > 0 && (
                              <div className="size-reduction">
                                -{result.size_reduction.toFixed(0)}%
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="processor-download-section">
                <button 
                  className="processor-download-btn"
                  onClick={handleDownload}
                  disabled={!processedResults.some(r => r.success)}
                >
                  {processedResults.filter(r => r.success).length === 1 
                    ? 'Descargar Imagen' 
                    : 'Descargar ZIP'
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ImageProcessor;