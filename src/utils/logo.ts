import { useState, useEffect } from 'react';
import { DEFAULT_LOGO_DATA } from '../assets/logoData';

const defaultLogo = DEFAULT_LOGO_DATA;

export const useLogo = () => {
  const [logo, setLogo] = useState<string>(defaultLogo);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedLogo = localStorage.getItem('golden_travel_logo');
      if (savedLogo && !savedLogo.includes('placehold.co')) {
        setLogo(savedLogo);
      } else {
        setLogo(defaultLogo);
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
