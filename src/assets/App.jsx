import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Calculator from './main/Calculator';

function App() {
  return (
    <div className="container text-center mt-2">
      <h1 className="mb-4">Calculadora</h1>
      <Calculator />
    </div>
  );
}

export default App;
