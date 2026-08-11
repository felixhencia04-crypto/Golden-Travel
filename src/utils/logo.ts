import { DEFAULT_LOGO_DATA } from '../assets/logoData';

export const useLogo = () => {
  return DEFAULT_LOGO_DATA;
};

export const updateLogo = (newLogoBase64: string) => {
  // no-op, logo is statically handled
};
