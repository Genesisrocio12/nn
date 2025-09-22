import { useState, useCallback } from 'react';

export const useProcessingStates = () => {
  const [processingFiles, setProcessingFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const PROCESSING_STATES = {
    UPLOADING: 'uploading',
    ANALYZING: 'analyzing',
    REMOVING_BACKGROUND: 'removing_background',
    RESIZING: 'resizing',
    OPTIMIZING: 'optimizing',
    COMPLETED: 'completed',
    ERROR: 'error'
  };

  const getStateMessage = useCallback((state) => {
    const messages = {
      [PROCESSING_STATES.UPLOADING]: 'Subiendo imagen...',
      [PROCESSING_STATES.ANALYZING]: 'Analizando imagen...',
      [PROCESSING_STATES.REMOVING_BACKGROUND]: 'Eliminando fondo...',
      [PROCESSING_STATES.RESIZING]: 'Redimensionando imagen...',
      [PROCESSING_STATES.OPTIMIZING]: 'Optimizando y convirtiendo a PNG...',
      [PROCESSING_STATES.COMPLETED]: 'Procesamiento completado',
      [PROCESSING_STATES.ERROR]: 'Error en el procesamiento'
    };
    return messages[state] || 'Procesando...';
  }, []);

  const createImagePreview = useCallback((file) => {
    // Crear una URL preview desde el path del backend
    if (file.path) {
      // Si viene del backend, usar la ruta de preview API
      if (file.filename) {
        return `http://localhost:5000/api/preview/${file.filename}`;
      }
      return file.path;
    }
    
    // Crear preview desde el archivo original si está disponible
    if (file.file && file.file instanceof File) {
      return URL.createObjectURL(file.file);
    }
    
    // Fallback: sin preview
    return null;
  }, []);

  const processFiles = useCallback(async (files, options) => {
    const { background_removal, resize, width, height } = options;

    // Determinar tipo de procesamiento
    let processType = 'optimize'; // Solo PNG optimizado
    if (background_removal && resize) {
      processType = 'combined';
    } else if (background_removal) {
      processType = 'background';
    } else if (resize) {
      processType = 'resize';
    }

    console.log(`Iniciando procesamiento: ${processType} para ${files.length} archivos`);
    setIsProcessing(true);

    // Inicializar archivos en el estado con previews correctas
    const initialFiles = files.map(file => ({
      id: file.id,
      name: file.original_name,
      state: PROCESSING_STATES.ANALYZING,
      progress: 0,
      originalSize: file.size,
      currentSize: file.size,
      reductionPercentage: 0,
      operations: [],
      error: null,
      preview: `http://localhost:5000/api/preview/${file.filename}` // Preview de archivo original
    }));

    setProcessingFiles(initialFiles);

    // Solo simular progreso inicial - el backend actualizará con resultados reales
    setTimeout(() => {
      setProcessingFiles(prev => 
        prev.map(f => ({
          ...f,
          state: PROCESSING_STATES.ANALYZING,
          progress: 25
        }))
      );
    }, 500);

  }, [setIsProcessing, setProcessingFiles, PROCESSING_STATES]);

  // Simular solo optimización PNG
  const simulateOptimizeOnly = async (fileId) => {
    const steps = [
      { state: PROCESSING_STATES.ANALYZING, duration: 400, progress: 25 },
      { state: PROCESSING_STATES.OPTIMIZING, duration: 1000, progress: 80 },
      { state: PROCESSING_STATES.COMPLETED, duration: 300, progress: 100 }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.duration));
      
      setProcessingFiles(prev => 
        prev.map(f => f.id === fileId ? {
          ...f,
          state: step.state,
          progress: step.progress,
          ...(step.state === PROCESSING_STATES.OPTIMIZING && {
            operations: ['Convertido a PNG optimizado'],
            currentSize: Math.round(f.originalSize * 0.75)
          }),
          ...(step.state === PROCESSING_STATES.COMPLETED && {
            currentSize: Math.round(f.originalSize * 0.72),
            reductionPercentage: 28
          })
        } : f)
      );
    }
  };

  // Simular eliminación de fondo
  const simulateBackgroundRemoval = async (fileId) => {
    const steps = [
      { state: PROCESSING_STATES.ANALYZING, duration: 600, progress: 15 },
      { state: PROCESSING_STATES.REMOVING_BACKGROUND, duration: 1800, progress: 70 },
      { state: PROCESSING_STATES.OPTIMIZING, duration: 800, progress: 95 },
      { state: PROCESSING_STATES.COMPLETED, duration: 200, progress: 100 }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.duration));
      
      setProcessingFiles(prev => 
        prev.map(f => f.id === fileId ? {
          ...f,
          state: step.state,
          progress: step.progress,
          ...(step.state === PROCESSING_STATES.REMOVING_BACKGROUND && {
            operations: ['Fondo eliminado con transparencia']
          }),
          ...(step.state === PROCESSING_STATES.OPTIMIZING && {
            operations: ['Fondo eliminado con transparencia', 'Convertido a PNG optimizado'],
            currentSize: Math.round(f.originalSize * 0.65)
          }),
          ...(step.state === PROCESSING_STATES.COMPLETED && {
            currentSize: Math.round(f.originalSize * 0.62),
            reductionPercentage: 38
          })
        } : f)
      );
    }
  };

  // Simular redimensionado
  const simulateResize = async (fileId, { width, height }) => {
    const steps = [
      { state: PROCESSING_STATES.ANALYZING, duration: 500, progress: 20 },
      { state: PROCESSING_STATES.RESIZING, duration: 1200, progress: 75 },
      { state: PROCESSING_STATES.OPTIMIZING, duration: 600, progress: 95 },
      { state: PROCESSING_STATES.COMPLETED, duration: 200, progress: 100 }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.duration));
      
      setProcessingFiles(prev => 
        prev.map(f => f.id === fileId ? {
          ...f,
          state: step.state,
          progress: step.progress,
          ...(step.state === PROCESSING_STATES.RESIZING && {
            operations: [`Redimensionado a ${width}x${height}`]
          }),
          ...(step.state === PROCESSING_STATES.OPTIMIZING && {
            operations: [`Redimensionado a ${width}x${height}`, 'Convertido a PNG optimizado'],
            currentSize: Math.round(f.originalSize * 0.55)
          }),
          ...(step.state === PROCESSING_STATES.COMPLETED && {
            currentSize: Math.round(f.originalSize * 0.52),
            reductionPercentage: 48
          })
        } : f)
      );
    }
  };

  // Simular procesamiento combinado
  const simulateCombined = async (fileId, { width, height }) => {
    const steps = [
      { state: PROCESSING_STATES.ANALYZING, duration: 700, progress: 10 },
      { state: PROCESSING_STATES.REMOVING_BACKGROUND, duration: 2000, progress: 40 },
      { state: PROCESSING_STATES.RESIZING, duration: 1400, progress: 70 },
      { state: PROCESSING_STATES.OPTIMIZING, duration: 1000, progress: 95 },
      { state: PROCESSING_STATES.COMPLETED, duration: 300, progress: 100 }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.duration));
      
      setProcessingFiles(prev => 
        prev.map(f => f.id === fileId ? {
          ...f,
          state: step.state,
          progress: step.progress,
          ...(step.state === PROCESSING_STATES.REMOVING_BACKGROUND && {
            operations: ['Fondo eliminado con transparencia']
          }),
          ...(step.state === PROCESSING_STATES.RESIZING && {
            operations: ['Fondo eliminado con transparencia', `Redimensionado a ${width}x${height}`]
          }),
          ...(step.state === PROCESSING_STATES.OPTIMIZING && {
            operations: ['Fondo eliminado con transparencia', `Redimensionado a ${width}x${height}`, 'Convertido a PNG optimizado'],
            currentSize: Math.round(f.originalSize * 0.35)
          }),
          ...(step.state === PROCESSING_STATES.COMPLETED && {
            currentSize: Math.round(f.originalSize * 0.32),
            reductionPercentage: 68
          })
        } : f)
      );
    }
  };

  const clearProcessing = useCallback(() => {
    // Limpiar URLs de objeto para evitar memory leaks
    processingFiles.forEach(file => {
      if (file.preview && file.preview.startsWith('blob:')) {
        URL.revokeObjectURL(file.preview);
      }
    });
    
    setProcessingFiles([]);
    setIsProcessing(false);
  }, [processingFiles]);

  const getStats = useCallback(() => {
    const completed = processingFiles.filter(f => f.state === PROCESSING_STATES.COMPLETED).length;
    const errors = processingFiles.filter(f => f.state === PROCESSING_STATES.ERROR).length;
    const processing = processingFiles.filter(f => 
      f.state !== PROCESSING_STATES.COMPLETED && 
      f.state !== PROCESSING_STATES.ERROR
    ).length;

    return {
      total: processingFiles.length,
      completed,
      errors,
      processing,
      averageReduction: processingFiles.length > 0 
        ? processingFiles.reduce((sum, f) => sum + f.reductionPercentage, 0) / processingFiles.length 
        : 0
    };
  }, [processingFiles, PROCESSING_STATES]);

  return {
    // Estados
    processingFiles,
    isProcessing,
    
    // Funciones principales
    processFiles,
    clearProcessing,
    
    // Funciones para actualizar estado (necesarias para backend)
    setProcessingFiles,
    setIsProcessing,
    
    // Utilidades
    getStats,
    getStateMessage,
    
    // Constantes
    PROCESSING_STATES
  };
};