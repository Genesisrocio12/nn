import React from 'react';
import logoImage from './image/TechResources.png';

const LandingPage = ({ onNavigate }) => {
  const handleStartProcessing = () => {
    onNavigate('procesador');
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
            <button onClick={() => onNavigate('home')} className="nav-link nav-active">
              Inicio
            </button>
            <button onClick={() => onNavigate('procesador')} className="nav-link">
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

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-text">
            <h1 className="hero-title">
              Procesamiento
              <br />
              <span className="hero-highlight">inteligente</span> de
              <br />
              imágenes
            </h1>
            <p className="hero-description">
              Elimina fondos, redimensiona y optimiza tus imágenes de manera automática y profesional. 
              Sin límites, sin complicaciones. Solo arrastra, procesa y descarga.
            </p>
            <button onClick={handleStartProcessing} className="cta-button">
              <span>Comenzar ahora</span>
              <svg className="cta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="hero-preview">
            <div className="preview-card">
              <h3 className="preview-title">Procesamiento rápido y sencillo</h3>
              <div className="preview-content">
                <div className="preview-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="213" height="107" fill="none" viewBox="0 0 213 107">
                      <g filter="url(#a)">
                        <path stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-opacity=".6" stroke-width="2" d="M146.75 89.167c2.674 0 5.239-.94 7.13-2.612 1.891-1.672 2.953-3.94 2.953-6.305V35.667c0-2.365-1.062-4.633-2.953-6.305-1.891-1.673-4.456-2.612-7.13-2.612h-39.829a11.16 11.16 0 0 1-4.839-1.046c-1.488-.701-2.754-1.721-3.682-2.966l-4.083-5.35c-.918-1.233-2.168-2.245-3.638-2.946a11.146 11.146 0 0 0-4.782-1.067H66.083c-2.674 0-5.239.94-7.13 2.612-1.89 1.672-2.953 3.94-2.953 6.305V80.25c0 2.365 1.062 4.633 2.953 6.305 1.891 1.672 4.456 2.612 7.13 2.612h80.667Z" shape-rendering="crispEdges"/>
                      </g>
                      <defs>
                        <filter id="a" width="110.833" height="85.792" x="51" y="12.375" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse">
                          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                          <feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
                          <feOffset dy="4"/>
                          <feGaussianBlur stdDeviation="2"/>
                          <feComposite in2="hardAlpha" operator="out"/>
                          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                          <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_30_141"/>
                          <feBlend in="SourceGraphic" in2="effect1_dropShadow_30_141" result="shape"/>
                        </filter>
                      </defs>
                    </svg>
                  <p className="preview-text">Vista previa de procesamiento</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            {/* Eliminador de Fondo */}
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="800" height="250" fill="none" viewBox="0 0 110 105">
                    <g clip-path="url(#a)">
                      <path fill="#616064" d="M109.839 9.775H40.652v79.869h69.187V9.774Z"/>
                      <path fill="#000" d="M75.245 9.775H40.652v79.869h34.593V9.774Z"/>
                      <path fill="#F2F2F3" d="M68.781 24.94h13L99.75 74.48H85.287l-3.14-9.7H68.343l-3.067 9.7H50.742l18.04-49.54Zm11.102 30.77-4.601-15.35-4.82 15.35h9.42Z"/>
                      <path fill="#DEDDE0" d="M75.245 55.71h-4.784l4.784-15.235V24.939h-6.464l-18.04 49.54h14.535l3.067-9.698h6.902v-9.07Z"/>
                      <path fill="#F2F2F3" d="M69.48 15.282H.291v79.87H69.48v-79.87Z"/>
                      <path fill="#DEDDE0" d="M34.886 15.282H.292v79.87h34.594v-79.87Z"/>
                      <path fill="#616064" d="M28.422 30.447h13l17.968 49.54H44.928l-3.14-9.699H27.984l-3.068 9.7H10.382l18.04-49.541Zm11.102 30.771-4.601-15.351-4.821 15.351h9.422Z"/>
                      <path fill="#000" d="M34.886 61.218h-4.784l4.784-15.236V30.447h-6.464l-18.04 49.54h14.534l3.068-9.699h6.902v-9.07Z"/>
                    </g>
                    <defs>
                      <clipPath id="a">
                        <path fill="#fff" d="M.292.135h109.546v104.656H.292z"/>
                      </clipPath>
                    </defs>
                  </svg>
              </div>
              <h3 className="feature-title">Eliminador de Fondo</h3>
              <p className="feature-description">
                Remueve automáticamente el fondo de cualquier imagen con tecnología AI avanzada.
                Perfecto para productos, retratos y diseños profesionales.
              </p>
            </div>

            {/* Redimensionamiento */}
            <div className="feature-card">
              <div className="feature-icon">
               <svg xmlns="http://www.w3.org/2000/svg" width="102" height="95" fill="none" viewBox="0 0 102 95">
                <g clip-path="url(#a)">
                  <path fill="#fff" fill-rule="evenodd" d="M56.431 42.5H90.29V11.247H56.43v31.255Zm22.573 41.673H11.287V21.664h33.858V52.92h33.858v31.254ZM45.144.828v10.418H0v83.345h90.29V52.919h11.286V.829H45.145Z" clip-rule="evenodd"/>
                </g>
                <defs>
                  <clipPath id="a">
                    <path fill="#fff" d="M0 .828h101.576V94.59H0z"/>
                  </clipPath>
                </defs>
              </svg>
              </div>
              <h3 className="feature-title">Redimensionamiento</h3>
              <p className="feature-description">
                Ajusta las dimensiones de tus imágenes a medidas exactas.
                Soporte para formatos cuadrados y rectangulares con preservación de calidad.
              </p>   
            </div>

            {/* Procesamiento Masivo */}
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="50" height="84" fill="none" viewBox="0 0 73 84">
                  <path fill="#fff" fill-rule="evenodd" d="M25.521 1.07C26.281.385 27.313 0 28.39 0h32.444C67.553 0 73 4.905 73 10.957v47.478c0 2.017-1.816 3.652-4.056 3.652s-4.055-1.635-4.055-3.652V10.956c0-2.016-1.816-3.652-4.056-3.652H32.444v18.261c0 2.017-1.815 3.652-4.055 3.652H8.11v40.174c0 2.017 1.816 3.652 4.056 3.652h8.11c2.24 0 4.056 1.636 4.056 3.653 0 2.017-1.815 3.652-4.055 3.652h-8.111C5.447 80.348 0 75.443 0 69.39V25.565c0-.968.427-1.897 1.188-2.582L25.52 1.07ZM46.64 7.304c3.36 0 6.083 2.453 6.083 5.479 0 3.025-2.724 5.478-6.083 5.478-3.36 0-6.083-2.453-6.083-5.478 0-3.026 2.723-5.479 6.083-5.479ZM13.846 21.913h10.487v-9.444l-10.486 9.444Zm18.598 49.586C32.444 78.403 38.66 84 46.327 84h.624c7.667 0 13.882-5.597 13.882-12.501 0-2.58-.73-5.117-2.121-7.372l-6.048-9.804c-1.216-1.97-3.522-3.193-6.025-3.193-2.503 0-4.81 1.222-6.025 3.193l-6.048 9.804c-1.392 2.255-2.122 4.792-2.122 7.372Zm14.195 5.197c3.36 0 6.083-2.453 6.083-5.479 0-3.025-2.724-5.478-6.083-5.478-3.36 0-6.083 2.453-6.083 5.478 0 3.026 2.723 5.479 6.083 5.479Zm0-29.218c3.36 0 6.083-2.453 6.083-5.478 0-3.026-2.724-5.478-6.083-5.478-3.36 0-6.083 2.453-6.083 5.478 0 3.026 2.723 5.478 6.083 5.478Zm6.083-20.087c0 3.026-2.724 5.479-6.083 5.479-3.36 0-6.083-2.453-6.083-5.479 0-3.025 2.723-5.478 6.083-5.478 3.36 0 6.083 2.453 6.083 5.478Z" clip-rule="evenodd"/>
                </svg>
              </div>
              <h3 className="feature-title">Procesamiento Masivo</h3>
              <p className="feature-description">
                Procesa cientos de imágenes simultáneamente. 
                Sube archivos ZIP y descarga resultados organizados. Sin límites de cantidad.
              </p>
            </div>

            {/* Optimización Automática */}
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="none" viewBox="0 0 100 100">
                  <g clip-path="url(#a)">
                    <path fill="#fff" d="M81.579 12.526A1.58 1.58 0 0 0 80 14.106v.21a1.579 1.579 0 0 0 3.158 0v-.21a1.58 1.58 0 0 0-1.58-1.58ZM62.97 67.491a7.09 7.09 0 0 0-7.082 7.082 7.09 7.09 0 0 0 7.082 7.083 7.09 7.09 0 0 0 7.082-7.083 7.09 7.09 0 0 0-7.082-7.082Zm0 11.007a3.929 3.929 0 0 1-3.925-3.925 3.929 3.929 0 0 1 3.925-3.924 3.929 3.929 0 0 1 3.924 3.924 3.929 3.929 0 0 1-3.924 3.925Zm24.925-65.972a1.58 1.58 0 0 0-1.58 1.58v.21a1.579 1.579 0 0 0 3.159 0v-.21a1.58 1.58 0 0 0-1.58-1.58Z"/>
                    <path fill="#fff" d="M90 6.316H41.053v-.527A5.796 5.796 0 0 0 35.263 0H18.421a5.796 5.796 0 0 0-5.79 5.79v.526H10c-5.514 0-10 4.486-10 10v63.158c0 5.513 4.486 10 10 10h32.919a7.091 7.091 0 0 0 7.705.405l1.472-.85a17.974 17.974 0 0 0 3.792 2.193v1.696A7.09 7.09 0 0 0 62.97 100a7.09 7.09 0 0 0 7.082-7.082v-1.696a17.946 17.946 0 0 0 3.792-2.193l1.471.85a7.092 7.092 0 0 0 7.706-.405H90c5.513 0 10-4.487 10-10V16.316c0-5.514-4.486-10-10-10Zm-74.21-.527a2.634 2.634 0 0 1 2.631-2.631h16.842a2.634 2.634 0 0 1 2.632 2.631v13.158H15.789V5.79ZM3.158 16.316A6.85 6.85 0 0 1 10 9.474h2.632v9.473H3.158v-2.631Zm79.097 69.392a3.93 3.93 0 0 1-5.36 1.436l-2.407-1.39a1.578 1.578 0 0 0-1.817.168 14.857 14.857 0 0 1-4.724 2.732 1.58 1.58 0 0 0-1.053 1.488v2.776a3.929 3.929 0 0 1-3.924 3.924 3.929 3.929 0 0 1-3.925-3.924v-2.776a1.58 1.58 0 0 0-1.052-1.488 14.853 14.853 0 0 1-4.724-2.732 1.578 1.578 0 0 0-1.817-.168l-2.407 1.39a3.93 3.93 0 0 1-4.465-.376 1.602 1.602 0 0 0-.146-.127 3.93 3.93 0 0 1 .687-6.295l2.405-1.388a1.58 1.58 0 0 0 .763-1.654 15.086 15.086 0 0 1 0-5.462 1.579 1.579 0 0 0-.763-1.654l-2.405-1.389a3.929 3.929 0 0 1-1.436-5.36 3.9 3.9 0 0 1 2.383-1.83 3.9 3.9 0 0 1 2.978.393l2.407 1.39a1.58 1.58 0 0 0 1.816-.168 14.856 14.856 0 0 1 4.724-2.732 1.58 1.58 0 0 0 1.053-1.489v-2.775a3.929 3.929 0 0 1 3.924-3.924 3.929 3.929 0 0 1 3.924 3.924v2.775c0 .67.422 1.266 1.053 1.489a14.858 14.858 0 0 1 4.724 2.732 1.58 1.58 0 0 0 1.816.167l2.407-1.39a3.9 3.9 0 0 1 2.978-.391 3.899 3.899 0 0 1 2.383 1.828c.525.908.664 1.965.392 2.978A3.898 3.898 0 0 1 80.82 68.8l-2.405 1.388a1.579 1.579 0 0 0-.763 1.655 15.075 15.075 0 0 1 0 5.462 1.58 1.58 0 0 0 .763 1.654l2.405 1.389a3.9 3.9 0 0 1 1.828 2.383 3.9 3.9 0 0 1-.392 2.978Zm14.587-6.234A6.85 6.85 0 0 1 90 86.316h-4.542a7.029 7.029 0 0 0 .24-4.404 7.037 7.037 0 0 0-3.3-4.3l-1.471-.85a18.288 18.288 0 0 0 0-4.378l1.471-.85a7.036 7.036 0 0 0 3.3-4.3 7.036 7.036 0 0 0-.708-5.374 7.035 7.035 0 0 0-4.3-3.3 7.034 7.034 0 0 0-5.374.708l-1.472.85a17.948 17.948 0 0 0-3.791-2.193v-1.696a7.09 7.09 0 0 0-7.083-7.082 7.09 7.09 0 0 0-7.082 7.082v1.696a17.96 17.96 0 0 0-3.792 2.192l-1.471-.85c-3.382-1.952-7.722-.789-9.675 2.593-1.952 3.382-.79 7.722 2.592 9.675l1.471.85a18.277 18.277 0 0 0 0 4.378l-1.47.85c-3.066 1.77-4.308 5.502-3.06 8.703H10a6.85 6.85 0 0 1-6.842-6.842V22.105h93.684v57.369Zm0-60.526h-55.79V9.474H90a6.85 6.85 0 0 1 6.842 6.842v2.632Z"/>
                    <path fill="#fff" d="M41.368 32.632h46.316a1.579 1.579 0 0 0 0-3.158H41.368a1.579 1.579 0 0 0 0 3.158ZM16.105 78.948h18.948a1.579 1.579 0 0 0 0-3.158H16.105a2.634 2.634 0 0 1-2.631-2.632V45.789a2.635 2.635 0 0 1 2.631-2.631h67.369a2.635 2.635 0 0 1 2.631 2.631v10.527a1.579 1.579 0 0 0 3.158 0V45.789A5.796 5.796 0 0 0 83.473 40H16.106a5.796 5.796 0 0 0-5.79 5.79v27.368a5.796 5.796 0 0 0 5.79 5.79Zm-4.21-46.316h14.737a1.579 1.579 0 0 0 0-3.158H11.895a1.579 1.579 0 0 0 0 3.158Z"/>
                    <path fill="#fff" d="M62.97 61.987c-6.94 0-12.586 5.646-12.586 12.586S56.03 87.16 62.97 87.16s12.586-5.646 12.586-12.586S69.91 61.988 62.97 61.988Zm0 22.014c-5.198 0-9.428-4.23-9.428-9.428 0-5.199 4.23-9.428 9.428-9.428s9.428 4.23 9.428 9.428c0 5.199-4.23 9.428-9.428 9.428Zm12.293-71.475a1.58 1.58 0 0 0-1.579 1.58v.21a1.579 1.579 0 0 0 3.158 0v-.21a1.58 1.58 0 0 0-1.579-1.58Z"/>
                  </g>
                  <defs>
                    <clipPath id="a">
                      <path fill="#fff" d="M0 0h100v100H0z"/>
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h3 className="feature-title">Optimización Automática</h3>
              <p className="feature-description">
                Procesa cientos de imágenes simultáneamente. 
                Sube archivos ZIP y descarga resultados organizados. Sin límites de cantidad.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;