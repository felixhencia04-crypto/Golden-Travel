import { useState, useEffect } from 'react';
import logoImg from '../assets/logo.png';

export const useLogo = () => {
  const [logo, setLogo] = useState<string>(logoImg);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedLogo = localStorage.getItem('golden_travel_logo');
      if (savedLogo) {
        setLogo(savedLogo);
      } else {
        setLogo(logoImg);
      }
    };

    handleStorageChange();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('logo-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logo-updated', handleStorageChange);
    };
  }, []);

  return logo;
};

export const updateLogo = (newLogoBase64: string) => {
  localStorage.setItem('golden_travel_logo', newLogoBase64);
  window.dispatchEvent(new Event('logo-updated'));
};
