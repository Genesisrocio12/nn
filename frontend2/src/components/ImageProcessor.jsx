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
                  <svg xmlns="http://www.w3.org/2000/svg" width="120" height="98" fill="none" viewBox="0 0 120 98">
                    <g clip-path="url(#a)">
                      <path fill="#000" fill-rule="evenodd" d="M112.5 85.75c0 3.381-3.36 6.125-7.5 6.125H85.62L57.99 69.013 90 42.872l22.5 18.375V85.75ZM15 91.875c-4.14 0-7.5-2.744-7.5-6.125v-2.876l29.794-21.792 37.71 30.793H15ZM30 12.25c8.284 0 15 5.485 15 12.25s-6.716 12.25-15 12.25c-8.284 0-15-5.485-15-12.25s6.716-12.25 15-12.25ZM105 0H15C6.716 0 0 5.485 0 12.25v73.5C0 92.515 6.716 98 15 98h90c8.284 0 15-5.485 15-12.25v-73.5C120 5.485 113.284 0 105 0ZM30 30.625c4.14 0 7.5-2.744 7.5-6.125s-3.36-6.125-7.5-6.125c-4.14 0-7.5 2.744-7.5 6.125s3.36 6.125 7.5 6.125Z" clip-rule="evenodd"/>
                    </g>
                    <defs>
                      <clipPath id="a">
                        <path fill="#fff" d="M0 0h120v98H0z"/>
                      </clipPath>
                    </defs>
                  </svg>
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="70"  fill="none" viewBox="0 0 84 70">
                    <path fill="#6383a1ff" d="M54.25 11.667 75.075 14l-17.15 14.292-3.675-16.625Zm-24.5 46.666L8.925 56l17.15-14.292 3.675 16.625ZM14 24.792l2.8-17.355L33.95 21.73 14 24.792Z"/>
                    <path fill="#fff" d="m16.275 30.917-7.35 1.166C8.75 33.104 8.75 33.98 8.75 35c0 6.708 2.8 13.125 8.05 18.083l5.25-3.791c-4.025-3.938-6.3-9.042-6.3-14.292 0-1.313.175-2.77.525-4.083ZM42 7.292c-9.45 0-17.85 3.354-23.975 8.604l4.9 4.083c4.9-4.229 11.55-6.854 19.075-6.854 1.575 0 3.325.146 4.9.438l1.225-5.688C46.2 7.438 44.1 7.292 42 7.292Zm25.725 31.791 7.35-1.166c.175-1.021.175-1.896.175-2.917 0-6.417-2.625-12.688-7.525-17.646L62.3 21c3.85 3.938 5.95 8.896 5.95 13.854 0 1.459-.175 2.917-.525 4.23Zm-6.65 10.938c-4.9 4.229-11.55 6.854-19.075 6.854a27.82 27.82 0 0 1-4.9-.438l-1.225 5.688c2.1.292 4.2.438 6.125.438 9.45 0 17.85-3.355 23.975-8.605l-4.9-3.937Z"/>
                    <path fill="#fff" d="m70 45.208-2.8 17.355L50.05 48.27 70 45.208Z"/>
                  </svg>
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