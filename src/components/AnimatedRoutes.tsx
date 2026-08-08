import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import LoginAdmin from '../pages/LoginAdmin';
import LoginMitra from '../pages/LoginMitra';
import Admin from '../pages/Admin';
import PackageDetail from '../pages/PackageDetail';
import DashboardJamaah from '../pages/DashboardJamaah';
import DashboardMitra from '../pages/DashboardMitra';
import Legalitas from '../pages/Legalitas';
import Blog from '../pages/Blog';
import KatalogPaket from '../pages/KatalogPaket';
import Kemitraan from '../pages/Kemitraan';

export default function AnimatedRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/mitra" element={<Navigate to="/mitra/login" replace />} />
      <Route path="/mitra/login" element={<LoginMitra />} />
      <Route path="/admin/login" element={<LoginAdmin />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/paket/:id" element={<PackageDetail />} />
      <Route path="/mitra/dashboard" element={<DashboardMitra />} />
      <Route path="/dashboard" element={<DashboardJamaah />} />
      <Route path="/legalitas" element={<Legalitas />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/katalog" element={<KatalogPaket />} />
      <Route path="/kemitraan" element={<Kemitraan />} />
    </Routes>
  );
}
