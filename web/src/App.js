import React from 'react'
import { useMediaQuery } from 'react-responsive';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { ExamplesPenLoader } from './components/Examples.js';
import { PersonalPenLoader } from './components/PersonalPens.js';
import { SharedPenLoader } from './components/Share.js';
import PenEditor from './components/PenEditor.js';
import MainPage from './components/MainPage.js';
import 'antd/dist/reset.css';
import './App.css';

function App() {
  if (!useMediaQuery({query: '(min-width: 1224px)'})) {
    return (
      <div className="App">
        <h1>{"Sorry. Netpen doesn't support small screens"}</h1>
        <p>Please use a wider screen or expand the window</p>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/main" replace />} />
          <Route path="/pen" element={<PenEditor />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/shared/:id" element={<SharedPenLoader />} />
          <Route path="/personal/:id" element={<PersonalPenLoader />} />
          <Route path="/examples/:id" element={<ExamplesPenLoader />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
