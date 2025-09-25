'use client';

import React from 'react';
import { ThemeProvider } from './theme-provider';

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};
