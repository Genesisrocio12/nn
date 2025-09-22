import { useState, useCallback } from 'react';

export const useProportionalResize = () => {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [originalDimensions, setOriginalDimensions] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [isLoadingDimensions, setIsLoadingDimensions] = useState(false);

  // Cargar dimensiones desde el backend
  const loadImageDimensions = useCallback(async (sessionId) => {
    if (!sessionId) return;

    setIsLoadingDimensions(true);

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
        
        // Inicializar con las dimensiones originales
        setWidth(dimensions.width.toString());
        setHeight(dimensions.height.toString());
        
        console.log(`Dimensiones cargadas: ${dimensions.width}x${dimensions.height} (ratio: ${dimensions.aspectRatio.toFixed(2)})`);
      }

    } catch (error) {
      console.error('Error obteniendo dimensiones:', error);
      // Valores por defecto
      const defaultDimensions = { width: 800, height: 600, aspectRatio: 800/600 };
      setOriginalDimensions(defaultDimensions);
      setAspectRatio(defaultDimensions.aspectRatio);
      setWidth('800');
      setHeight('600');
    } finally {
      setIsLoadingDimensions(false);
    }
  }, []);

  // Manejar cambio de ANCHO - Auto-completa la altura
  const handleWidthChange = useCallback((newWidth) => {
    setWidth(newWidth);
    
    // Auto-completar altura solo si hay un ancho válido y tenemos aspect ratio
    if (newWidth && aspectRatio && !isNaN(newWidth)) {
      const numWidth = parseInt(newWidth);
      if (numWidth > 0) {
        const calculatedHeight = Math.round(numWidth / aspectRatio);
        setHeight(calculatedHeight.toString());
        console.log(`Auto-completado ancho: ${numWidth}px → ${calculatedHeight}px`);
      }
    } else if (!newWidth) {
      // Si borra el ancho, limpiar también la altura
      setHeight('');
    }
  }, [aspectRatio]);

  // Manejar cambio de ALTURA - Auto-completa el ancho
  const handleHeightChange = useCallback((newHeight) => {
    setHeight(newHeight);
    
    // Auto-completar ancho solo si hay una altura válida y tenemos aspect ratio
    if (newHeight && aspectRatio && !isNaN(newHeight)) {
      const numHeight = parseInt(newHeight);
      if (numHeight > 0) {
        const calculatedWidth = Math.round(numHeight * aspectRatio);
        setWidth(calculatedWidth.toString());
        console.log(`Auto-completado altura: ${numHeight}px → ${calculatedWidth}px`);
      }
    } else if (!newHeight) {
      // Si borra la altura, limpiar también el ancho
      setWidth('');
    }
  }, [aspectRatio]);

  // Manejar cambio de ancho SIN auto-completar (para edición libre)
  const handleWidthChangeOnly = useCallback((newWidth) => {
    setWidth(newWidth);
    // NO auto-completar - permite edición libre
  }, []);

  // Manejar cambio de altura SIN auto-completar (para edición libre)
  const handleHeightChangeOnly = useCallback((newHeight) => {
    setHeight(newHeight);
    // NO auto-completar - permite edición libre  
  }, []);

  // Aplicar cuadrado rápido
  const makeSquare = useCallback((size) => {
    const targetSize = size || parseInt(width) || parseInt(height) || 400;
    setWidth(targetSize.toString());
    setHeight(targetSize.toString());
    console.log(`Aplicado cuadrado: ${targetSize}x${targetSize}px`);
  }, [width, height]);

  // Resetear a dimensiones originales
  const resetDimensions = useCallback(() => {
    if (originalDimensions) {
      setWidth(originalDimensions.width.toString());
      setHeight(originalDimensions.height.toString());
      console.log('Dimensiones reseteadas a originales');
    }
  }, [originalDimensions]);

  // Aplicar preset manteniendo proporción
  const applyPreset = useCallback((targetWidth) => {
    if (aspectRatio) {
      const calculatedHeight = Math.round(targetWidth / aspectRatio);
      setWidth(targetWidth.toString());
      setHeight(calculatedHeight.toString());
      console.log(`Preset aplicado: ${targetWidth}px → ${calculatedHeight}px`);
    }
  }, [aspectRatio]);

  // Limpiar campos
  const clearDimensions = useCallback(() => {
    setWidth('');
    setHeight('');
  }, []);

  return {
    // Estados
    width,
    height,
    originalDimensions,
    isLoadingDimensions,
    
    // Funciones principales (con auto-completado)
    handleWidthChange,
    handleHeightChange,
    
    // Funciones libres (sin auto-completado)
    handleWidthChangeOnly,
    handleHeightChangeOnly,
    
    // Funciones especiales
    loadImageDimensions,
    makeSquare,
    
    // Utilidades
    resetDimensions,
    applyPreset,
    clearDimensions,
    
    // Info
    hasValidDimensions: originalDimensions !== null,
    currentDimensions: {
      width: parseInt(width) || 0,
      height: parseInt(height) || 0
    }
  };
};