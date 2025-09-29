import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useProportionalResize } from '../hooks/useProportionalResize';
import logoImage from './image/TechResources.png';
import { useProcessingStates } from '../hooks/useProcessingStates';

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

 const {
     width,
     height,
     originalDimensions,
     isLoadingDimensions,
     isLocked,
     fileCount,
     handleWidthChange,
     handleHeightChange,
     toggleLock,
     updateFileCount,
     loadImageDimensions,
     makeSquare,
     resetDimensions,
     applyPreset,
     clearDimensions,
     hasValidDimensions,
     shouldAutoComplete,
     canToggleLock,
     editingMode
   } = useProportionalResize();
 
   const {
     processingFiles,
     isProcessing,
     processFiles,
     clearProcessing,
     setProcessingFiles,
     setIsProcessing,
     getStats,
     getStateMessage,
     PROCESSING_STATES
   } = useProcessingStates();
 
   useEffect(() => {
     updateFileCount(uploadedFiles.length);
   }, [uploadedFiles.length, updateFileCount]);
 
   useEffect(() => {
     if (sessionId && uploadedFiles.length > 0) {
       loadImageDimensions(sessionId, uploadedFiles.length);
     }
   }, [sessionId, uploadedFiles.length, loadImageDimensions]);
 
   const handleDrag = useCallback((e) => {
     e.preventDefault();
     e.stopPropagation();
     if (e.type === "dragenter" || e.type === "dragover") {
       setDragActive(true);
     } else if (e.type === "dragleave") {
       setDragActive(false);
     }
   }, []);
 
   const handleDrop = useCallback((e) => {
     e.preventDefault();
     e.stopPropagation();
     setDragActive(false);
     
     if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       handleFiles(Array.from(e.dataTransfer.files));
     }
   }, []);
 
   const handleFileInput = (e) => {
     if (e.target.files && e.target.files.length > 0) {
       handleFiles(Array.from(e.target.files));
     }
   };
 
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
       
       const newFiles = data.files;
       setUploadedFiles(prev => {
         const combinedFiles = [...prev, ...newFiles];
         console.log(`Archivos combinados: ${prev.length} anteriores + ${newFiles.length} nuevos = ${combinedFiles.length} total`);
         return combinedFiles;
       });
       
       const currentSessionId = sessionId || data.session_id;
       if (!sessionId) {
         setSessionId(data.session_id);
       }
       
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
 
   const handleProcess = async () => {
     if (!sessionId || uploadedFiles.length === 0) {
       setError('No hay archivos para procesar');
       return;
     }
     
     setError('');
     setSwitchProcessing(true);
     
     try {
       
       await processFiles(uploadedFiles, {
         background_removal: backgroundRemoval,
         resize: resize,
         width: width ? parseInt(width) : null,
         height: height ? parseInt(height) : null,
       });
       
       
       const result = await handleProcessWithSession(sessionId);
       return result;
     } catch (err) {
       setError(err.message);
       console.error('Error en procesamiento manual:', err);
     } finally {
       setSwitchProcessing(false);
     }
   };
 
   const handleProcessWithSession = async (currentSessionId) => {
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
       
       setProcessingFiles(prev => 
         prev.map(file => {
           const result = data.results.find(r => r.id === file.id);
           if (result && result.success) {
             return {
               ...file,
               state: PROCESSING_STATES.COMPLETED,
               progress: 100,
               currentSize: result.final_size || file.originalSize,
               reductionPercentage: result.size_reduction || 0,
               operations: result.operations || [],
               preview: result.preview_url || file.preview
             };
           } else if (result && !result.success) {
             return {
               ...file,
               state: PROCESSING_STATES.ERROR,
               error: result.message
             };
           }
           return file;
         })
       );
       
       setProcessedResults(data.results);
       
     } catch (err) {
       setError(err.message);
       console.error('Error processing images:', err);
       
       setProcessingFiles(prev => 
         prev.map(file => ({
           ...file,
           state: PROCESSING_STATES.ERROR,
           error: err.message
         }))
       );
       
     } finally {
       setProcessing(false);
       setIsProcessing(false);
     }
   };
 
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
 
       const contentType = response.headers.get('content-type');
       const contentDisposition = response.headers.get('content-disposition');
   
       let filename = 'archivo_procesado';
       if (contentDisposition) {
         const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
         if (match && match[1]) {
           filename = match[1].replace(/['"]/g, '');
         }
       } else {
         const successfulCount = processedResults.filter(r => r.success).length;
         if (successfulCount === 1) {
           const singleResult = processedResults.find(r => r.success);
           filename = singleResult?.processed_name || 'imagen_procesada.png';
         } else {
           filename = `imagenes_procesadas_${Date.now()}.zip`;
         }
       }
 
       const blob = await response.blob();
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = filename;
       
       document.body.appendChild(a);
       a.click();
       
       document.body.removeChild(a);
       window.URL.revokeObjectURL(url);
 
       console.log(`Descarga completada: ${filename} (${contentType})`);
 
     } catch (err) {
       setError(err.message);
       console.error('Error en descarga:', err);
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
     clearDimensions();
     clearProcessing();
     if (fileInputRef.current) {
       fileInputRef.current.value = '';
     }
   };
 
   const shouldShowResults = processedResults.length > 0 || processingFiles.length > 0;
   const stats = getStats();
 
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
          <div className="processor-page-header">
             {/* dejame aqui va algo */}
          </div>
          <div className="processor-title-section">
            <h2 className="processor-main-title">Procesador de Imágenes</h2>
            <p className="processor-main-subtitle">
              Sube múltiples imágenes o archivos ZIP y configura las opciones de procesamiento
            </p>
          </div>

          
          <div className="processor-content-grid">
          
            <div className="processor-upload-section">
              <div 
                className={`processor-upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="processor-upload-icon">
                  {/* dejame aqui va algo */}
                  {loading ? (
                    <div className="loading-icon">⏳ Cargando...</div>
                  ) : (
                    <div className="folder-icon"></div>
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
                    disabled={loading || isProcessing}
                  >
                    Seleccionar Archivos 
                  </button>
                  
                  {uploadedFiles.length > 0 && (
                    <button 
                      className="processor-clear-btn"
                      onClick={clearFiles}
                      disabled={loading || processing || switchProcessing || isProcessing}
                    >
                      Resetear
                    </button>
                  )}
                </div>

                {/* Mensajes de estado */}
                {error && (
                  <div className="message-error">
                    {error}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.zip"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Botón de procesar manual - NUEVO POSICIONAMIENTO */}
              {uploadedFiles.length > 0 && (
                <div className="process-btns">
                  <button 
                    className="process-btn manual"
                    onClick={handleProcess}
                    disabled={processing || loading || isProcessing || switchProcessing}
                  >
                    {processing || isProcessing || switchProcessing ? 'Procesando...' : 'Procesar Imágenes'}
                  </button>
                </div>
              )}
            </div>

            
            {/* Sección de opciones */}
            <div className="processor-options-section">
              <h3 className="processor-options-title">Opciones de Procesamiento</h3>
              
              <div className={`processor-option-card ${backgroundRemoval ? 'active' : ''}`}>
                <div className="processor-option-content">
                  <div className="processor-option-text">
                    <h4 className="processor-option-title">
                      Eliminar Fondo
                      {switchProcessing && backgroundRemoval && (
                        <span className="processing-indicator"> ↻ </span>
                      )}
                    </h4>
                    <p className="processor-option-description">
                      Remueve automáticamente el fondo
                    </p>
                  </div>
                  <div className="processor-option-toggle">
                   <div 
                      className={`processor-toggle ${backgroundRemoval ? 'processor-toggle-active' : ''} ${(processing || switchProcessing || isProcessing) ? 'disabled' : ''}`}
                      onClick={handleBackgroundRemovalToggle}
                    >
                      <div className="processor-toggle-slider"> </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`processor-option-card ${resize ? 'active' : ''}`}>
                <div className="processor-option-content">
                  <div className="processor-option-text">
                    <h4 className="processor-option-title">
                      Redimensionar
                      {switchProcessing && resize && (
                        <span className="processing-indicator"> ↺ </span>
                      )}
                    </h4>
                    <p className="processor-option-description">
                      Ajusta las dimensiones de la imagen
                    </p>
                  </div>
                  <div className="processor-option-toggle">
                    <div 
                      className={`processor-toggle ${resize ? 'processor-toggle-active' : ''} ${(processing || switchProcessing || isProcessing) ? 'disabled' : ''}`}
                      onClick={handleResizeToggle}
                    >
                      <div className="processor-toggle-slider"></div>
                    </div>
                  </div>
                </div>
              </div>

          {/* Dimensiones personalizadas - Solo aparece cuando resize está ON */}
          {resize && (
                <div className="dimensions-panel">
                  <div className="dimensions-header">
                    <h4 className="dimensions-title">Nuevas Dimensiones</h4>
                    
                    <div className="file-status">
                      {fileCount === 1 ? (
                        <span className="file-count single"> 
                        <span className="file-count-number">1</span>
                        <span className="file-conut-text">imagen</span>
                        </span>
                      ) : (
                        <span className="file-count multiple">
                        <span className="file-count-number">{fileCount}</span>
                        <span className="file-count-text">imágenes</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {hasValidDimensions && fileCount === 1 && (
                    <div className="original-info">
                      <span className="info-label">Original:</span>
                      <span className="info-value">
                        {originalDimensions.width} × {originalDimensions.height} px
                      </span>
                    </div>
                  )}

                  {isLoadingDimensions && (
                    <div className="loading-info">
                      Analizando imagen{fileCount > 1 ? 'es' : ''}...
                    </div>
                  )}

                  <div className="editing-mode">
                    <div className="mode-header">
                      <div className="mode-info">
                        <span className="mode-label">
                          {editingMode === 'proportional' ? 'Proporcional' : 'Libre'}
                        </span>
                        {fileCount > 1 && (
                          <span className="multi-notice">Múltiples imágenes</span>
                        )}
                      </div>
                      
                      {canToggleLock && (
                        <button 
                          className={`lock-button ${isLocked ? 'locked' : 'unlocked'}`}
                          onClick={toggleLock}
                          disabled={processing || switchProcessing || isLoadingDimensions || isProcessing}
                          title={isLocked ? 'Abrir candado (edición libre)' : 'Cerrar candado (mantener proporción)'}
                        >
                          {isLocked ? '🔒' : '🔓'}
                        </button>
                      )}
                    </div>
                    
                    <p className="mode-description">
                      {fileCount === 1 ? (
                        isLocked 
                          ? 'Escribe un valor y el otro se auto-completa (candado cerrado)' 
                          : 'Edita ambos campos independientemente (candado abierto)'
                      ) : (
                        'Con múltiples imágenes puedes usar cualquier dimensión'
                      )}
                    </p>
                  </div>

                  <div className={`dimensions-inputs ${editingMode}`}>
                    <div className="input-field">
                      <label>
                        Ancho (px)
                        {shouldAutoComplete && (
                          <span className="auto-indicator">🔗</span>
                        )}
                      </label>
                      <input
                        type="number"
                        value={width}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        placeholder={fileCount === 1 ? "Ej: 400" : " Ej: 600"}
                        disabled={processing || switchProcessing || isLoadingDimensions || isProcessing}
                        className="dimension-input"
                      />
                    </div>
                    
                    <div className="input-field">
                      <label>
                        Alto (px)
                        {shouldAutoComplete && (
                          <span className="auto-indicator">🔗</span>
                        )}
                      </label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        placeholder={fileCount === 1 ? "Ej: 300" : "Ej: 600"}
                        disabled={processing || switchProcessing || isLoadingDimensions || isProcessing}
                        className="dimension-input"
                      />
                    </div>
                  </div>


                  {uploadedFiles.length > 0 && !switchProcessing && !isProcessing && (
                    <div className="manual-process-section">
                      {(!width || !height) && (
                        <div className="manual-notice">
                          <span className="notice-icon">⚠️</span>
                          <span className="notice-text">
                            Configura las dimensiones y presiona procesar
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sección de Resultados - Solo aparece cuando hay switches activos y resultados */}
          {shouldShowResults && (
            <div className="processor-results-section">
              <div className="processor-results-header">
                <div className="processor-results-header-left">
                  <div className="processor-results-icon">
                    {/* dejame aqui va algo */}
                <h3 className="processor-results-title">
                  {isProcessing ? 'Procesando Imágenes' : 'Imágenes Procesadas'}
                </h3>
                </div>
                </div>
                {stats.total > 0 && (
                  <div className="processor-results-stats">
                    <span className="stats-item">
                      ✅ {stats.completed} completadas
                    </span>
                    {stats.processing > 0 && (
                      <span className="stats-item processing">
                        ⏳ {stats.processing} procesando
                      </span>
                    )}
                    {stats.errors > 0 && (
                      <span className="stats-item error">
                        ❌ {stats.errors} errores
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="processor-results-content">
                <div className="results-grid-processing">
                  {processingFiles.map((file) => (
                    <div key={file.id} className={`processing-item ${file.state}`}>
                      <div className="processing-preview">
                        {file.preview ? (
                          <img 
                            src={file.preview} 
                            alt={file.name}
                            className="processing-image"
                          />
                        ) : (
                          <div className="processing-placeholder">➀ 🖼️</div>
                        )}
                        {/* <div className="processing-placeholder">➀ Imagen...</div>*/}
                      </div>
                      
                      <div className="processing-info">
                        <h5 className="processing-name">{file.name}</h5>
                        <p className="processing-status">
                          {getStateMessage(file.state)}
                        </p>
                        
                        {file.state !== PROCESSING_STATES.ERROR && (
                          <div className="processing-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${file.progress}%` }}
                              ></div>
                            </div>
                            <span className="progress-text">{file.progress}%</span>
                          </div>
                        )}
                        
                        <div className="processing-details">
                          <div className="size-info">
                            <span className="size-original">
                              {(file.originalSize / 1024).toFixed(1)} KB
                            </span>
                            {file.currentSize !== file.originalSize && (
                              <>
                                <span className="size-arrow">→</span>
                                <span className="size-final">
                                  {(file.currentSize / 1024).toFixed(1)} KB
                                </span>
                              </>
                            )}
                          </div>
                          
                          {file.reductionPercentage > 0 && (
                            <div className="reduction-info">
                              <span className="reduction-badge">
                                -{file.reductionPercentage.toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {file.operations && file.operations.length > 0 && (
                          <div className="processing-operations">
                            {file.operations.map((op, i) => (
                              <span key={i} className="operation-tag">{op}</span>
                            ))}
                          </div>
                        )}
                        
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {stats.completed > 0 && !isProcessing && (
                <div className="processor-download-section">
                  <div className="download-summary">
                    <span className="summary-text">
                      {stats.completed} imagen{stats.completed > 1 ? 'es' : ''} procesada{stats.completed > 1 ? 's' : ''} correctamente
                    </span>
                    {stats.averageReduction > 0 && (
                      <span className="summary-savings">
                        Reducción promedio: {stats.averageReduction.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <button 
                    className="processor-download-btn"
                    onClick={handleDownload}
                    disabled={stats.completed === 0}
                  >
                    {stats.completed === 1 
                      ? 'Descargar Imagen' 
                      : 'Descargar ZIP'
                    }
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ImageProcessor;