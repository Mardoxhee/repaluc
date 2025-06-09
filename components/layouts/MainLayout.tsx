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
      <div className="flex-1 min-h-screen ml-64">
        <Header />
        <main className="pt-24 px-8 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
