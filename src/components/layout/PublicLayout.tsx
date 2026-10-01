import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicHeader } from './PublicHeader.js';
import { PublicFooter } from './PublicFooter.js';

export const PublicLayout: React.FC = () => {
  return (
    <div className="theme-page min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};
