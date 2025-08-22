import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// `App.css`は`App.jsx`の中で読み込んでいるので、ここでの読み込みは不要です。

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// パフォーマンス測定は行わないため、reportWebVitalsに関する記述はすべて削除します。
