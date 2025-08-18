import React from 'react';
import SideBar from './sideBar';
import Header from './header';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <SideBar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="zoom-90">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
