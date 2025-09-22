import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import ImageProcessor from './components/ImageProcessor';
import HelpPage from './components/HelpPage';
import ContactPage from './components/ContactPage';
import './App.css';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      {currentPage === 'home' && <LandingPage onNavigate={handleNavigation} />}
      {currentPage === 'procesador' && <ImageProcessor onNavigate={handleNavigation} />}
      {currentPage === 'ayuda' && <HelpPage onNavigate={handleNavigation} />}
      {currentPage === 'contacto' && <ContactPage onNavigate={handleNavigation} />}
    </div>
  );
};

export default App;