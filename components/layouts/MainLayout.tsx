import React from 'react';
import SideBar from './sideBar';
import Header from './header';

interface MainLayoutProps {
  children: React.ReactNode;
  noZoom?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, noZoom }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideBar />
      <div className="flex-1 ml-64">
        <Header />
        <main className={`${noZoom ? '' : 'zoom-90 pt-20'} `}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
