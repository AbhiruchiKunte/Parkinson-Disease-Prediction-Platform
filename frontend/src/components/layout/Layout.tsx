import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen font-sans antialiased text-foreground bg-background">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
