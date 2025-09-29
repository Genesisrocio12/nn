import { useState, useCallback } from 'react';

export const useProportionalResize = () => {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [originalDimensions, setOriginalDimensions] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [isLoadingDimensions, setIsLoadingDimensions] = useState(false);
  const [isLocked, setIsLocked] = useState(true); 
  const [fileCount, setFileCount] = useState(0);

  const loadImageDimensions = useCallback(async (sessionId, totalFiles = 1) => {
    if (!sessionId) return;

    setIsLoadingDimensions(true);
    setFileCount(totalFiles);

    try {
      const response = await fetch(`http://localhost:5000/api/dimensions/${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Error obteniendo dimensiones del servidor');
      }

      const data = await response.json();
      
      if (data.success && data.dimensions) {
        const dimensions = {
          width: data.dimensions.width,
          height: data.dimensions.height,
          aspectRatio: data.dimensions.aspect_ratio,
        };
        
        setOriginalDimensions(dimensions);
        setAspectRatio(dimensions.aspectRatio);
        
        if (totalFiles === 1 && isLocked) {
          setWidth(dimensions.width.toString());
          setHeight(dimensions.height.toString());
          console.log(`Dimensiones cargadas (1 imagen): ${dimensions.width}x${dimensions.height}`);
        } else {
          setWidth('');
          setHeight('');
          console.log(`Dimensiones cargadas (${totalFiles} imágenes): campos libres`);
        }
      }

    } catch (error) {
      console.error('Error obteniendo dimensiones:', error);
      if (totalFiles === 1 && isLocked) {
        const defaultDimensions = { width: 800, height: 600, aspectRatio: 800/600 };
        setOriginalDimensions(defaultDimensions);
        setAspectRatio(defaultDimensions.aspectRatio);
        setWidth('800');
        setHeight('600');
      } else {
        setWidth('');
        setHeight('');
      }
    } finally {
      setIsLoadingDimensions(false);
    }
  }, [isLocked]);

  const toggleLock = useCallback(() => {
    const newLockState = !isLocked;
    setIsLocked(newLockState);
    
    if (newLockState && fileCount === 1 && originalDimensions) {
      setWidth(originalDimensions.width.toString());
      setHeight(originalDimensions.height.toString());
      console.log('Candadito cerrado: dimensiones restauradas');
    } else if (!newLockState) {
      console.log('Candadito abierto: edición libre');
    }
  }, [isLocked, fileCount, originalDimensions]);

  const shouldAutoComplete = useCallback(() => {
    return fileCount === 1 && isLocked;
  }, [fileCount, isLocked]);

  const handleWidthChange = useCallback((newWidth) => {
    setWidth(newWidth);
    
    if (shouldAutoComplete() && newWidth && aspectRatio && !isNaN(newWidth)) {
      const numWidth = parseInt(newWidth);
      if (numWidth > 0) {
        const calculatedHeight = Math.round(numWidth / aspectRatio);
        setHeight(calculatedHeight.toString());
        console.log(`Auto-completado ancho: ${numWidth}px → ${calculatedHeight}px`);
      }
    } else if (!newWidth && shouldAutoComplete()) {
      setHeight('');
    }
  }, [aspectRatio, shouldAutoComplete]);

  const handleHeightChange = useCallback((newHeight) => {
    setHeight(newHeight);
    
    if (shouldAutoComplete() && newHeight && aspectRatio && !isNaN(newHeight)) {
      const numHeight = parseInt(newHeight);
      if (numHeight > 0) {
        const calculatedWidth = Math.round(numHeight * aspectRatio);
        setWidth(calculatedWidth.toString());
        console.log(`Auto-completado altura: ${numHeight}px → ${calculatedWidth}px`);
      }
    } else if (!newHeight && shouldAutoComplete()) {
      setWidth('');
    }
  }, [aspectRatio, shouldAutoComplete]);

  const makeSquare = useCallback((size) => {
    const targetSize = size || parseInt(width) || parseInt(height) || 400;
    setWidth(targetSize.toString());
    setHeight(targetSize.toString());
    console.log(`Aplicado cuadrado: ${targetSize}x${targetSize}px`);
  }, [width, height]);

  const resetDimensions = useCallback(() => {
    if (originalDimensions && fileCount === 1) {
      setWidth(originalDimensions.width.toString());
      setHeight(originalDimensions.height.toString());
      setIsLocked(true); 
      console.log('Dimensiones reseteadas a originales');
    } else {
      setWidth('');
      setHeight('');
    }
  }, [originalDimensions, fileCount]);

  const applyPreset = useCallback((targetWidth) => {
    if (aspectRatio && shouldAutoComplete()) {
      const calculatedHeight = Math.round(targetWidth / aspectRatio);
      setWidth(targetWidth.toString());
      setHeight(calculatedHeight.toString());
      console.log(`Preset aplicado: ${targetWidth}px → ${calculatedHeight}px`);
    } else {
      setWidth(targetWidth.toString());
      console.log(`Preset aplicado (modo libre): ${targetWidth}px`);
    }
  }, [aspectRatio, shouldAutoComplete]);

  const clearDimensions = useCallback(() => {
    setWidth('');
    setHeight('');
    setFileCount(0);
    setIsLocked(true); 
  }, []);

  const updateFileCount = useCallback((count) => {
    setFileCount(count);
    
    if (count > 1 && isLocked) {
      setIsLocked(false);
      console.log(`Múltiples archivos detectados (${count}): candadito abierto automáticamente`);
    }
    else if (count === 1 && !isLocked) {
      console.log('Una imagen detectada: candadito disponible para cerrar');
    }
  }, [isLocked]);

  return {
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
    hasValidDimensions: originalDimensions !== null,
    shouldAutoComplete: shouldAutoComplete(),
    currentDimensions: {
      width: parseInt(width) || 0,
      height: parseInt(height) || 0
    },
    
    editingMode: shouldAutoComplete() ? 'proportional' : 'free',
    canToggleLock: fileCount === 1 
  };
};