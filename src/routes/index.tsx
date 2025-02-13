// src/routes/index.tsx

import { Route, Routes } from 'react-router-dom';
import Home from '../pages/home/Home';
import Dashboard from '../pages/dashboard/Dashboard';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
};

export default AppRoutes;
