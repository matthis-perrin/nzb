import React from 'react';
import ReactDOM from 'react-dom';
import {createGlobalStyle} from 'styled-components';

import {App} from './app';

const GlobalCss = createGlobalStyle`
  html, body, #root {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    width: 100%;
    height: 100%;
    background-color: #000;
  }
  a {
    text-decoration: none;
    color: inherit;
  }
`;

ReactDOM.render(
  <React.StrictMode>
    <App />
    <GlobalCss />
  </React.StrictMode>,
  document.getElementById('root')
);
