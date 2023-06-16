import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {createGlobalStyle} from 'styled-components';

import {App} from '@src/app';

const GlobalCss = createGlobalStyle`
  html, body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    height: 100%;
    background-color: #fbfbfb;
  }
`;

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
      <GlobalCss />
    </StrictMode>
  );
}
