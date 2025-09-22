import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useProportionalResize } from '../hooks/useProportionalResize';
import logoImage from './image/TechResources.png';

const ImageProcessor = ({ onNavigate }) => {
  const [backgroundRemoval, setBackgroundRemoval] = useState(false);
  const [resize, setResize] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [showManualProcess, setShowManualProcess] = useState(false);
  const [processingFiles, setProcessingFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [originalDimensions, setOriginalDimensions] = useState(null);

  const fileInputRef = useRef(null);
  const API_BASE_URL = 'http://localhost:5000/api';

  // Auto-procesar cuando cambian los switches
  useEffect(() => {
    if (uploadedFiles.length > 0 && sessionId && !loading && !isProcessing) {
      // Si se activa resize pero no hay dimensiones, mostrar panel para configurar
      if (resize && (!width || !height)) {
        setShowManualProcess(true);
        return;
      }
      
      // Si no es resize o ya tiene dimensiones, procesar automáticamente
      if (!resize || (resize && width && height)) {
        handleAutoProcess();
      }
    }
  }, [backgroundRemoval, resize, uploadedFiles.length, sessionId]);

  // Procesar automáticamente
  const handleAutoProcess = useCallback(async () => {
    if (!uploadedFiles.length || isProcessing) return;

    const options = {
      backgroundRemoval,
      resize,
      width: resize ? parseInt(width) || null : null,
      height: resize ? parseInt(height) || null : null
    };

    console.log('Procesamiento automático iniciado:', options);
    await processFiles(uploadedFiles, options);
  }, [uploadedFiles, backgroundRemoval, resize, width, height, isProcessing]);

  // Procesar manualmente
  const handleManualProcess = useCallback(async () => {
    if (!uploadedFiles.length || isProcessing) return;
    
    if (resize && (!width || !height)) {
      setError('Por favor ingresa las dimensiones antes de procesar');
      return;
    }

    const options = {
      backgroundRemoval,
      resize,
      width: resize ? parseInt(width) || null : null,
      height: resize ? parseInt(height) || null : null
    };

    console.log('Procesamiento manual iniciado:', options);
    setShowManualProcess(false);
    await processFiles(uploadedFiles, options);
  }, [uploadedFiles, backgroundRemoval, resize, width, height, isProcessing]);

  // Simular procesamiento
  const processFiles = async (files, options) => {
    setIsProcessing(true);
    setError('');
    
    const initialFiles = files.map(file => ({
      id: file.id,
      name: file.original_name,
      state: 'processing',
      progress: 0,
      originalSize: file.size,
      currentSize: file.size,
      reductionPercentage: 0,
      operations: [],
      preview: createPreviewUrl(file.path || file.name)
    }));

    setProcessingFiles(initialFiles);

    // Simular procesamiento
    for (let i = 0; i < files.length; i++) {
      const file = initialFiles[i];
      
      // Simular pasos de procesamiento
      for (let progress = 20; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setProcessingFiles(prev => 
          prev.map(f => f.id === file.id ? {
            ...f,
            progress,
            state: progress === 100 ? 'completed' : 'processing',
            currentSize: progress === 100 ? file.originalSize * 0.7 : file.originalSize,
            reductionPercentage: progress === 100 ? 30 : 0,
            operations: progress === 100 ? getOperations(options) : []
          } : f)
        );
      }
    }

    setIsProcessing(false);
  };

  const getOperations = (options) => {
    const ops = [];
    if (!options.backgroundRemoval && !options.resize) {
      ops.push('Convertido a PNG optimizado');
    } else {
      if (options.backgroundRemoval) ops.push('Fondo eliminado con transparencia');
      if (options.resize) ops.push(`Redimensionado a ${options.width}x${options.height}`);
      ops.push('Convertido a PNG optimizado');
    }
    return ops;
  };

  const createPreviewUrl = (fileName) => {
    // Simular URL de preview
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
  };

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
      // Simular carga de archivos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockFiles = files.map((file, index) => ({
        id: `file-${Date.now()}-${index}`,
        filename: `${Date.now()}_${file.name}`,
        original_name: file.name,
        type: 'image',
        source: 'direct',
        size: file.size,
        path: URL.createObjectURL(file)
      }));

      setUploadedFiles(prev => [...prev, ...mockFiles]);
      setSessionId(`session-${Date.now()}`);

      // Obtener dimensiones de la primera imagen
      if (mockFiles.length === 1) {
        const img = new Image();
        img.onload = () => {
          setOriginalDimensions({
            width: img.width,
            height: img.height
          });
          setWidth(img.width.toString());
          setHeight(img.height.toString());
        };
        img.src = mockFiles[0].path;
      }

    } catch (err) {
      setError(`Error cargando archivos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Descargar resultados
  const handleDownload = async () => {
    const completedFiles = processingFiles.filter(f => f.state === 'completed');
    if (completedFiles.length === 0) {
      setError('No hay archivos procesados para descargar');
      return;
    }

    if (completedFiles.length === 1) {
      // Descargar imagen individual
      const file = completedFiles[0];
      const link = document.createElement('a');
      link.href = file.preview;
      link.download = `${file.name.split('.')[0]}_processed.png`;
      link.click();
    } else {
      // Simular descarga ZIP
      console.log(`Descargando ZIP con ${completedFiles.length} archivos`);
      // Aquí iría la lógica real de descarga ZIP
      alert(`Descargando ZIP con ${completedFiles.length} archivos procesados`);
    }
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const clearFiles = () => {
    setUploadedFiles([]);
    setSessionId(null);
    setError('');
    setShowManualProcess(false);
    setProcessingFiles([]);
    setWidth('');
    setHeight('');
    setOriginalDimensions(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBackgroundRemovalToggle = () => {
    if (!isProcessing) {
      setBackgroundRemoval(!backgroundRemoval);
    }
  };

  const handleResizeToggle = () => {
    if (!isProcessing) {
      setResize(!resize);
      if (!resize) {
        setShowManualProcess(true);
      }
    }
  };

  const stats = {
    total: processingFiles.length,
    completed: processingFiles.filter(f => f.state === 'completed').length,
    errors: processingFiles.filter(f => f.state === 'error').length,
    averageReduction: processingFiles.length > 0 
      ? processingFiles.reduce((sum, f) => sum + f.reductionPercentage, 0) / processingFiles.length 
      : 0
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
      <main style={{ padding: '28px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* Título */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ 
              fontSize: '4rem', 
              fontWeight: '490', 
              color: '#000', 
              margin: '0 0 16px 0',
              lineHeight: '1.2'
            }}>
              Procesador de Imágenes
            </h2>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#152645', 
              margin: 0,
              opacity: 0.8
            }}>
              Sube múltiples imágenes y mira el procesamiento en tiempo real
            </p>
          </div>

          {/* Grid de contenido */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 400px', 
            gap: '60px',
            marginBottom: '40px',
            alignItems: 'start'
          }}>
            
            {/* Sección de carga */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div 
                style={{
                  background: '#DADBDB',
                  borderRadius: '50px',
                  padding: '80px 40px',
                  textAlign: 'center',
                  width: '100%',
                  maxWidth: '650px',
                  height: '460px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                  border: `2px solid ${dragActive ? '#7B934D' : '#080806'}`,
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={openFileSelector}
              >
                <div style={{ color: '#000', marginBottom: '5px', fontSize: '3rem' }}>
                  {loading ? '⏳' : '📁'}
                </div>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  color: '#000', 
                  margin: 0,
                  fontStretch: 'condensed'
                }}>
                  {uploadedFiles.length > 0 
                    ? `${uploadedFiles.length} archivos cargados`
                    : 'Arrastra tus imágenes aquí'
                  }
                </h3>
                <p style={{ 
                  fontSize: '1rem', 
                  color: '#566582', 
                  margin: 0,
                  fontStretch: 'condensed'
                }}>
                  {uploadedFiles.length > 0 
                    ? 'Puedes agregar más archivos o resetear'
                    : 'o haz clic para seleccionar archivos'
                  }
                </p>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button 
                    style={{
                      background: '#0B1425',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '12px 32px',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openFileSelector();
                    }}
                    disabled={loading || isProcessing}
                  >
                    {uploadedFiles.length > 0 ? 'Agregar Más' : 'Seleccionar Archivos'}
                  </button>
                  
                  {uploadedFiles.length > 0 && (
                    <button 
                      style={{
                        background: '#dc3545',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '12px 32px',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFiles();
                      }}
                      disabled={loading || isProcessing}
                    >
                      Resetear
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Sección de opciones */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              padding: '30px 25px 40px 25px',
              borderRadius: '10px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              width: '340px',
              minHeight: '300px',
              height: 'auto'
            }}>
              <h3 style={{ 
                fontSize: '1.4rem', 
                fontWeight: '600', 
                color: '#000', 
                margin: '0 0 20px 0',
                textAlign: 'center'
              }}>
                Opciones de Procesamiento
              </h3>
              
              {/* Opción eliminar fondo */}
              <div style={{
                background: backgroundRemoval ? 'rgba(11, 20, 37, 0.95)' : '#D9D9D9',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.4s ease'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '15px',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ 
                      fontSize: '1.2rem', 
                      color: backgroundRemoval ? '#F1F3F3' : '#000',
                      fontWeight: '600',
                      margin: 0,
                      lineHeight: '1.2'
                    }}>
                      Eliminar Fondo
                    </h4>
                    <p style={{ 
                      fontSize: '0.9rem', 
                      color: backgroundRemoval ? '#B8C5D1' : '#000',
                      fontWeight: '200',
                      margin: 0,
                      lineHeight: '1.3'
                    }}>
                      Remueve automáticamente el fondo
                    </p>
                  </div>
                  <div 
                    style={{
                      width: '76px',
                      height: '40px',
                      background: backgroundRemoval ? '#F1F3F3' : '#0B1425',
                      borderRadius: '20px',
                      position: 'relative',
                      cursor: 'pointer',
                      border: `2px solid ${backgroundRemoval ? '#0B1425' : '#DADBDB'}`,
                      flexShrink: 0
                    }}
                    onClick={handleBackgroundRemovalToggle}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: backgroundRemoval ? '#0B1425' : '#F1F3F3',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '2px',
                      left: backgroundRemoval ? '38px' : '2px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }} />
                  </div>
                </div>
              </div>

              {/* Opción redimensionar */}
              <div style={{
                background: resize ? 'rgba(11, 20, 37, 0.95)' : '#D9D9D9',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.4s ease'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '15px',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ 
                      fontSize: '1.2rem', 
                      color: resize ? '#F1F3F3' : '#000',
                      fontWeight: '600',
                      margin: 0,
                      lineHeight: '1.2'
                    }}>
                      Redimensionar
                    </h4>
                    <p style={{ 
                      fontSize: '0.9rem', 
                      color: resize ? '#B8C5D1' : '#000',
                      fontWeight: '200',
                      margin: 0,
                      lineHeight: '1.3'
                    }}>
                      Ajusta las dimensiones automáticamente
                    </p>
                  </div>
                  <div 
                    style={{
                      width: '76px',
                      height: '40px',
                      background: resize ? '#F1F3F3' : '#0B1425',
                      borderRadius: '20px',
                      position: 'relative',
                      cursor: 'pointer',
                      border: `2px solid ${resize ? '#0B1425' : '#DADBDB'}`,
                      flexShrink: 0
                    }}
                    onClick={handleResizeToggle}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: resize ? '#0B1425' : '#F1F3F3',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '2px',
                      left: resize ? '38px' : '2px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }} />
                  </div>
                </div>
              </div>

              {/* Panel de dimensiones */}
              {resize && (
                <div style={{
                  background: 'rgba(11, 20, 37, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '25px',
                  marginTop: '20px',
                  boxShadow: '0 8px 32px rgba(11, 20, 37, 0.3)'
                }}>
                  <h4 style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: '600', 
                    color: '#F1F3F3',
                    margin: '0 0 20px 0',
                    textAlign: 'center'
                  }}>
                    Nuevas Dimensiones
                  </h4>
                  
                  {originalDimensions && uploadedFiles.length === 1 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '18px',
                      padding: '12px 16px',
                      background: 'rgba(241, 243, 243, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#B8C5D1' }}>
                        Original:
                      </span>
                      <span style={{ fontSize: '13px', color: '#F1F3F3', fontWeight: '600' }}>
                        {originalDimensions.width} × {originalDimensions.height} px
                      </span>
                    </div>
                  )}

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '15px',
                    marginBottom: '22px'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ 
                        fontSize: '13px', 
                        fontWeight: '500', 
                        color: '#F1F3F3',
                        textAlign: 'center'
                      }}>
                        Ancho (px)
                      </label>
                      <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        placeholder="Ej: 400"
                        disabled={isProcessing}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: '2px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: '500',
                          textAlign: 'center',
                          background: '#EBFEFE',
                          color: '#152645',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ 
                        fontSize: '13px', 
                        fontWeight: '500', 
                        color: '#F1F3F3',
                        textAlign: 'center'
                      }}>
                        Alto (px)
                      </label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="Ej: 300"
                        disabled={isProcessing}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: '2px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: '500',
                          textAlign: 'center',
                          background: '#EBFEFE',
                          color: '#152645',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {(showManualProcess || (resize && (!width || !height))) && uploadedFiles.length > 0 && !isProcessing && (
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '15px',
                        padding: '10px',
                        background: 'rgba(255, 193, 7, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 193, 7, 0.3)'
                      }}>
                        <span>⚠️</span>
                        <span style={{ color: '#F1F3F3', fontSize: '13px' }}>
                          Configura las dimensiones y presiona procesar
                        </span>
                      </div>
                      <button 
                        onClick={handleManualProcess}
                        disabled={isProcessing || !width || !height}
                        style={{
                          width: '100%',
                          padding: '14px',
                          background: 'linear-gradient(135deg, #566582 0%, #7B934D 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '15px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(86, 101, 130, 0.2)'
                        }}
                      >
                        Procesar Imágenes
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sección de Resultados */}
          {processingFiles.length > 0 && (
            <div style={{
              marginTop: '50px',
              borderRadius: '5px',
              background: '#DADBDB',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                background: '#1C1C1C',
                padding: '20px 30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ color: '#FFFFFF', fontSize: '1.5rem' }}>
                    {isProcessing ? '⏳' : '✅'}
                  </div>
                  <h3 style={{ 
                    fontSize: '1.8rem', 
                    fontWeight: '500', 
                    color: '#F1F3F3',
                    margin: 0
                  }}>
                    {isProcessing ? 'Procesando Imágenes' : 'Imágenes Procesadas'}
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#B8C5D1', fontSize: '14px' }}>Completado:</span>
                    <span style={{ color: '#F1F3F3', fontSize: '14px', fontWeight: '600' }}>
                      {stats.completed}/{stats.total}
                    </span>
                  </div>
                  {stats.averageReduction > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#B8C5D1', fontSize: '14px' }}>Reducción promedio:</span>
                      <span style={{ color: '#7B934D', fontSize: '14px', fontWeight: '600' }}>
                        -{stats.averageReduction.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Barra de progreso en la parte inferior del header */}
              {isProcessing && (
                <div style={{
                  background: '#2a2a2a',
                  padding: '8px 30px',
                  borderBottom: '1px solid #444'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ color: '#F1F3F3', fontSize: '14px' }}>
                      Procesando...
                    </span>
                    <span style={{ color: '#7B934D', fontSize: '14px', fontWeight: '600' }}>
                      {stats.completed + stats.errors}/{stats.total} completados
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    background: '#444',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div 
                      style={{
                        width: `${((stats.completed + stats.errors) / stats.total) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #566582 0%, #7B934D 100%)',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              )}
              
              <div style={{
                padding: '40px',
                minHeight: '300px',
                background: '#DADBDB'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                  gap: '20px'
                }}>
                  {processingFiles.map((file) => (
                    <div key={file.id} style={{
                      background: '#fff',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      display: 'grid',
                      gridTemplateColumns: '120px 1fr auto',
                      gap: '20px',
                      alignItems: 'center',
                      border: file.state === 'completed' ? '2px solid #7B934D' : '2px solid #e0e0e0',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      
                      {/* Preview de imagen */}
                      <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        position: 'relative',
                        background: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {file.preview ? (
                          <img 
                            src={file.preview} 
                            alt={file.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{
                            fontSize: '2rem',
                            color: file.state === 'completed' ? '#7B934D' : 
                                   file.state === 'error' ? '#dc3545' : '#666'
                          }}>
                            {file.state === 'completed' ? '🖼️' :
                             file.state === 'error' ? '❌' : '📷'}
                          </div>
                        )}
                        
                        {/* Overlay de procesamiento */}
                        {file.state === 'processing' && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '1.5rem'
                          }}>
                            ⏳
                          </div>
                        )}
                      </div>
                      
                      {/* Información del archivo */}
                      <div style={{ minWidth: 0 }}>
                        <h5 style={{ 
                          margin: '0 0 8px 0',
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: '#333',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {file.name}
                        </h5>
                        
                        {/* Estado actual */}
                        <div style={{ 
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ 
                            color: file.state === 'completed' ? '#7B934D' : 
                                   file.state === 'error' ? '#dc3545' : '#666',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}>
                            {file.state === 'completed' ? 'Procesamiento completado' :
                             file.state === 'error' ? 'Error en el procesamiento' :
                             'Procesando...'}
                          </span>
                          {file.state === 'processing' && (
                            <span style={{ 
                              color: '#7B934D', 
                              fontSize: '14px', 
                              fontWeight: '600' 
                            }}>
                              {file.progress}%
                            </span>
                          )}
                        </div>

                        {/* Barra de progreso individual */}
                        {file.state === 'processing' && (
                          <div style={{
                            width: '100%',
                            height: '4px',
                            background: '#e0e0e0',
                            borderRadius: '2px',
                            overflow: 'hidden',
                            marginBottom: '8px'
                          }}>
                            <div 
                              style={{
                                width: `${file.progress}%`,
                                height: '100%',
                                background: '#7B934D',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Operaciones completadas */}
                        {file.operations && file.operations.length > 0 && (
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            marginBottom: '8px'
                          }}>
                            {file.operations.map((op, i) => (
                              <span key={i} style={{
                                background: '#e8f5e8',
                                color: '#2d5a2d',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}>
                                {op}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Error */}
                        {file.error && (
                          <div style={{
                            background: '#fee',
                            color: '#c33',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            marginTop: '8px'
                          }}>
                            {file.error}
                          </div>
                        )}
                      </div>

                      {/* Estadísticas de tamaño */}
                      <div style={{ textAlign: 'right', minWidth: '120px' }}>
                        {file.state === 'completed' && (
                          <div>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              marginBottom: '8px'
                            }}>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                Antes: {(file.originalSize / 1024).toFixed(1)} KB
                              </div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                Después: {(file.currentSize / 1024).toFixed(1)} KB
                              </div>
                            </div>
                            
                            {file.reductionPercentage > 0 && (
                              <div style={{
                                background: '#7B934D',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600'
                              }}>
                                -{file.reductionPercentage.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        )}
                        
                        {file.state === 'processing' && (
                          <div>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                              {(file.currentSize / 1024).toFixed(1)} KB
                            </div>
                            {file.reductionPercentage > 0 && (
                              <div style={{
                                background: '#f0f8ff',
                                color: '#4a90e2',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '12px'
                              }}>
                                -{file.reductionPercentage.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Botón de descarga */}
              {stats.completed > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#1A1A1A',
                  padding: '20px 40px',
                  borderTop: '1px solid #333'
                }}>
                  <div>
                    <div style={{ color: '#F1F3F3', fontSize: '16px', fontWeight: '500' }}>
                      {stats.completed} imagen{stats.completed !== 1 ? 'es' : ''} lista{stats.completed !== 1 ? 's' : ''} para descargar
                    </div>
                    {stats.averageReduction > 0 && (
                      <div style={{ color: '#7B934D', fontSize: '14px', marginTop: '4px' }}>
                        Ahorro promedio: {stats.averageReduction.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleDownload}
                    disabled={stats.completed === 0}
                    style={{
                      background: '#7B934D',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '14px 32px',
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(123, 147, 77, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#566582';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = '#7B934D';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    {stats.completed === 1 ? 'Descargar Imagen' : 'Descargar ZIP'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mensajes de error - Movidos abajo */}
          {error && (
            <div style={{
              background: '#fee',
              color: '#c33',
              padding: '15px 20px',
              borderRadius: '8px',
              marginTop: '20px',
              border: '1px solid #fcc',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ImageProcessor