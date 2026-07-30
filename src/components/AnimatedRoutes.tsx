import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Home from '../pages/Home';
import Login from '../pages/Login';
import LoginAdmin from '../pages/LoginAdmin';
import Mitra from '../pages/Mitra';
import LoginMitra from '../pages/LoginMitra';
import Admin from '../pages/Admin';
import PackageDetail from '../pages/PackageDetail';
import DashboardJamaah from '../pages/DashboardJamaah';
import DashboardMitra from '../pages/DashboardMitra';
import Legalitas from '../pages/Legalitas';
import Blog from '../pages/Blog';
import KatalogPaket from '../pages/KatalogPaket';

const pageVariants = {
  initial: { opacity: 0, y: 15 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -15 }
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.4
};

const AnimatedPage = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      {/* @ts-ignore */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
        <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
        <Route path="/mitra" element={<AnimatedPage><Mitra /></AnimatedPage>} />
        <Route path="/mitra/login" element={<AnimatedPage><LoginMitra /></AnimatedPage>} />
        <Route path="/admin/login" element={<AnimatedPage><LoginAdmin /></AnimatedPage>} />
        <Route path="/admin" element={<AnimatedPage><Admin /></AnimatedPage>} />
        <Route path="/paket/:id" element={<AnimatedPage><PackageDetail /></AnimatedPage>} />
        <Route path="/mitra/dashboard" element={<AnimatedPage><DashboardMitra /></AnimatedPage>} />
        <Route path="/dashboard" element={<AnimatedPage><DashboardJamaah /></AnimatedPage>} />
        <Route path="/legalitas" element={<AnimatedPage><Legalitas /></AnimatedPage>} />
        <Route path="/blog" element={<AnimatedPage><Blog /></AnimatedPage>} />
        <Route path="/katalog" element={<AnimatedPage><KatalogPaket /></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  );
}
