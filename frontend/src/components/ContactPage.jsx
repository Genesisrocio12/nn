import React, { useEffect } from 'react';

const ContactPage = ({ onNavigate }) => {
  useEffect(() => {
    window.location.href = 'https://recursos-tecnologicos.com/contactos/';
  }, []);

  return null;
};

export default ContactPage;

