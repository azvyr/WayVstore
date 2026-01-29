import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductsPage from './pages/ProductsPage';
import CommunityPage from './pages/CommunityPage';
import AboutPage from './pages/AboutPage';
import Footer from './components/Footer';
// ...existing code...

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="bg-wayv-dark min-h-screen text-slate-200 selection:bg-wayv-accent selection:text-black flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        <Footer />
        {/* AiAssistant removed */}
      </div>
    </HashRouter>
  );
};

export default App;