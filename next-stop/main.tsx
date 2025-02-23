import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { NextStopDisplay } from './NextStopDisplay';
import '../src/index.css';

createRoot(document.getElementById('next-stop-root')!).render(
  <StrictMode>
    <NextStopDisplay />
  </StrictMode>
);