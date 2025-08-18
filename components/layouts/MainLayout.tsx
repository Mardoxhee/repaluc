import React from 'react';
import SideBar from './sideBar';
import Header from './header';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
      <SideBar />
      <div className="flex-1 ml-64 overflow-auto">
        <Header />
        <main className="zoom-90 pt-20">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
