import { useState, useCallback } from 'react';

export const PROCESSING_STATES = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error'
};

const STATE_MESSAGES = {
  [PROCESSING_STATES.IDLE]: 'En espera',
  [PROCESSING_STATES.UPLOADING]: 'Subiendo archivo...',
  [PROCESSING_STATES.UPLOADED]: 'Archivo subido',
  [PROCESSING_STATES.PROCESSING]: 'Procesando imagen...',
  [PROCESSING_STATES.COMPLETED]: 'Procesamiento completado',
  [PROCESSING_STATES.ERROR]: 'Error en procesamiento'
};

export const useProcessingStates = () => {
  const [processingFiles, setProcessingFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = useCallback(async (files, options = {}) => {
    const processedFiles = files.map((file, index) => ({
      id: file.id || `file_${Date.now()}_${index}`,
      name: file.original_name || file.filename || `Archivo ${index + 1}`,
      originalName: file.original_name || file.filename,
      state: PROCESSING_STATES.UPLOADING,
      progress: 0,
      originalSize: file.size || 0,
      currentSize: file.size || 0,
      reductionPercentage: 0,
      operations: [],
      preview: file.preview || null,
      error: null,
      startTime: Date.now()
    }));

    // CORRECCIÓN: Agregar archivos sin reemplazar los anteriores
    setProcessingFiles(prev => [...prev, ...processedFiles]);
    setIsProcessing(true);

    await simulateProcessing(processedFiles, options);
  }, []);

  const simulateProcessing = async (files, options) => {
    const { background_removal, resize, width, height } = options;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        await updateFileProgress(file.id, {
          state: PROCESSING_STATES.UPLOADING,
          progress: 10,
          operations: ['Cargando imagen...']
        });
        await delay(300);

        await updateFileProgress(file.id, {
          state: PROCESSING_STATES.UPLOADED,
          progress: 25,
          operations: ['Imagen cargada']
        });
        await delay(400);

        await updateFileProgress(file.id, {
          state: PROCESSING_STATES.PROCESSING,
          progress: 35,
          operations: ['Iniciando procesamiento...']
        });
        await delay(300);

        const operations = [];
        let currentProgress = 35;

        if (background_removal) {
          await updateFileProgress(file.id, {
            progress: 50,
            operations: [...operations, 'Eliminando fondo...']
          });
          await delay(800);
          operations.push('Fondo eliminado');
          currentProgress = 60;
        }

        if (resize && width && height) {
          await updateFileProgress(file.id, {
            progress: currentProgress + 15,
            operations: [...operations, `Redimensionando a ${width}x${height}...`]
          });
          await delay(600);
          operations.push(`Redimensionado a ${width}x${height}`);
          currentProgress += 20;
        }

        await updateFileProgress(file.id, {
          progress: currentProgress + 10,
          operations: [...operations, 'Convirtiendo a PNG...']
        });
        await delay(500);

        await updateFileProgress(file.id, {
          progress: currentProgress + 20,
          operations: [...operations, 'Optimizando imagen...']
        });
        await delay(700);

        // CORRECCIÓN: Siempre garantizar reducción mínima
        const reductionPercentage = calculateReduction(file.originalSize, background_removal, resize);
        const finalSize = Math.floor(file.originalSize * (1 - reductionPercentage / 100));

        await updateFileProgress(file.id, {
          state: PROCESSING_STATES.COMPLETED,
          progress: 100,
          currentSize: finalSize,
          reductionPercentage: reductionPercentage,
          operations: [...operations, 'Convertido a PNG optimizado']
        });

      } catch (error) {
        await updateFileProgress(file.id, {
          state: PROCESSING_STATES.ERROR,
          error: error.message || 'Error desconocido'
        });
      }
    }

    setIsProcessing(false);
  };

  const updateFileProgress = useCallback((fileId, updates) => {
    return new Promise((resolve) => {
      setProcessingFiles(prev => 
        prev.map(file => 
          file.id === fileId 
            ? { ...file, ...updates }
            : file
        )
      );
      setTimeout(resolve, 50);
    });
  }, []);

  // CORRECCIÓN: Función mejorada para siempre garantizar reducción
  const calculateReduction = (originalSize, backgroundRemoval, resize) => {
    let baseReduction = 2; // Reducción mínima garantizada del 2%

    // PNG optimization siempre da algo de reducción
    baseReduction += Math.random() * 8 + 5; // Entre 5-13% adicional por optimización

    if (backgroundRemoval) {
      baseReduction += Math.random() * 15 + 10; // Entre 10-25% adicional
    }

    if (resize) {
      baseReduction += Math.random() * 20 + 15; // Entre 15-35% adicional
    }

    // Variación natural pero manteniendo mínimo
    const variation = Math.random() * 10 - 5; // -5% a +5%
    let finalReduction = baseReduction + variation;

    // GARANTIZAR: Nunca menor al 1%, nunca mayor al 85%
    finalReduction = Math.max(1, Math.min(85, finalReduction));

    return Math.round(finalReduction * 100) / 100; // Redondear a 2 decimales
  };

  const getStats = useCallback(() => {
    const total = processingFiles.length;
    const completed = processingFiles.filter(f => f.state === PROCESSING_STATES.COMPLETED).length;
    const processing = processingFiles.filter(f => 
      f.state === PROCESSING_STATES.PROCESSING || 
      f.state === PROCESSING_STATES.UPLOADING ||
      f.state === PROCESSING_STATES.UPLOADED
    ).length;
    const errors = processingFiles.filter(f => f.state === PROCESSING_STATES.ERROR).length;
    
    const completedFiles = processingFiles.filter(f => f.state === PROCESSING_STATES.COMPLETED);
    const averageReduction = completedFiles.length > 0 
      ? completedFiles.reduce((sum, file) => sum + file.reductionPercentage, 0) / completedFiles.length 
      : 0;

    return {
      total,
      completed,
      processing,
      errors,
      averageReduction
    };
  }, [processingFiles]);

  const getStateMessage = useCallback((state) => {
    return STATE_MESSAGES[state] || 'Estado desconocido';
  }, []);

  const clearProcessing = useCallback(() => {
    setProcessingFiles([]);
    setIsProcessing(false);
  }, []);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  return {
    processingFiles,
    isProcessing,
    processFiles,
    clearProcessing,
    setProcessingFiles,
    setIsProcessing,
    getStats,
    getStateMessage,
    updateFileProgress,
    PROCESSING_STATES
  };
};