import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import Login from './pages/Login';
import CallerDashboard from './pages/CallerDashboard';
import Display from './pages/Display';

const socket = io(window.location.origin);

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    socket.on('theme_sync', (data) => {
      if (data.theme) setTheme(data.theme);
    });
    return () => socket.off('theme_sync');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    socket.emit('set_theme', { theme: newTheme });
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/caller" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/caller" element={<CallerDashboard toggleTheme={toggleTheme} theme={theme} />} />
        <Route path="/display" element={<Display />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
