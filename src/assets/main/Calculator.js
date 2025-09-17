import React, { Component } from 'react';
import './Calculator.css';
import Display from '../components/Display/Display';
import Button from '../components/Button/Button';

class Calculator extends Component {
  state = {
    displayValue: '0',
    num1: null,
    operation: null,
    waitingForNewNumber: false,
    history: [],
    showModal: false,            // Modal de histórico
    showPercentageModal: false,  // Modal de porcentagem
    showDropdown: false,         // Dropdown de opções

    // Calculadora de porcentagem
    totalValue: '',
    percentageValue: '',
    percentageResult: '',
  };

  // === DROPDOWN ===
  toggleDropdown = () => {
    this.setState({ showDropdown: !this.state.showDropdown });
  };

  closeDropdown = () => {
    this.setState({ showDropdown: false });
  };

  // === HISTÓRICO ===
  handleOpenHistory = () => {
    this.setState({ showModal: true, showDropdown: false });
  };
  toggleModal = () => {
    this.setState({ showModal: !this.state.showModal });
  };

  // === PORCENTAGEM ===
  handleOpenPercentage = () => {
    this.setState({ showPercentageModal: true, showDropdown: false });
  };
  togglePercentageModal = () => {
    this.setState({ showPercentageModal: !this.state.showPercentageModal });
  };

  // Botão "Limpar" na calculadora de porcentagem
  clearPercentage = () => {
    this.setState({
      totalValue: '',
      percentageValue: '',
      percentageResult: ''
    });
  };

  calculatePercentage = () => {
    // Converte valor total (remove pontos e troca vírgula por ponto, se quiser)
    const total = parseFloat(this.state.totalValue.replace(/\./g, '').replace(',', '.'));
    const pct = parseFloat(this.state.percentageValue.replace(/\./g, '').replace(',', '.'));

    if (isNaN(total) || isNaN(pct)) {
      this.setState({ percentageResult: 'Entrada inválida' });
      return;
    }

    const result = (total * pct) / 100;
    // Formata com 2 casas decimais
    this.setState({ percentageResult: result.toFixed(2) });
  };

 



  // === LÓGICA CALCULADORA NORMAL ===
  clearMemory = () => {
    this.setState({
      displayValue: '0',
      num1: null,
      operation: null,
      waitingForNewNumber: false,
    });
  };

  backspace = () => {
    this.setState((prevState) => {
      const newValue =
        prevState.displayValue.length > 1
          ? prevState.displayValue.slice(0, -1)
          : '0';
      return { displayValue: newValue };
    });
  };

  addDigit = (digit) => {
    const { displayValue, waitingForNewNumber } = this.state;
    if (digit === '.' && displayValue.includes('.')) return;

    this.setState({
      displayValue: waitingForNewNumber
        ? digit
        : displayValue === '0'
        ? digit
        : displayValue + digit,
      waitingForNewNumber: false,
    });
  };

  addToHistory = (calcString) => {
    this.setState((prevState) => ({
      history: [...prevState.history, calcString],
    }));
  };

  setOperation = (operation) => {
    const { displayValue, num1, operation: prevOperation } = this.state;
    const currentValue = parseFloat(displayValue);

    if (num1 === null) {
      this.setState({
        num1: currentValue,
        operation,
        waitingForNewNumber: true,
      });
    } else if (prevOperation) {
      let result = this.calculate(num1, currentValue, prevOperation);
      // Ao concluir a operação com '=', adiciona ao histórico
      if (operation === '=') {
        const calcString = `${num1} ${prevOperation} ${currentValue} = ${result}`;
        this.addToHistory(calcString);
      }
      this.setState({
        displayValue: String(result),
        num1: operation === '=' ? null : result,
        operation: operation === '=' ? null : operation,
        waitingForNewNumber: true,
      });
    }
  };

  calculate = (num1, num2, operation) => {
    switch (operation) {
      case '+':
        return num1 + num2;
      case '-':
        return num1 - num2;
      case '*':
        return num1 * num2;
      case '/':
        return num2 !== 0 ? num1 / num2 : 'Erro';
      default:
        return num2;
    }
  };

  restoreCalculation = (calcString) => {
    const parts = calcString.split('=');
    if (parts.length === 2) {
      this.setState({ displayValue: parts[1].trim(), waitingForNewNumber: true });
    }
  };

  render() {
    return (
      <div className="calculator card p-3 mx-auto" style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Display value={this.state.displayValue} />

          {/* Botão de três pontos */}
          <button
            onClick={this.toggleDropdown}
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              fontSize: '1rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            &#8942;
          </button>

          {/* Dropdown de opções */}
          {this.state.showDropdown && (
            <div
              className="my-dropdown-menu"
              style={{
                position: 'absolute',
                right: '5px',
                top: '30px',
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: 999
              }}
            >
              <button
                className="my-dropdown-item"
                style={{
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px',
                  cursor: 'pointer'
                }}
                onClick={this.handleOpenHistory}
              >
                Histórico
              </button>
              <button
                className="my-dropdown-item"
                style={{
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px',
                  cursor: 'pointer'
                }}
                onClick={this.handleOpenPercentage}
              >
                Calculadora de porcentagem
              </button>
            </div>
          )}
        </div>

        {/* Modal de histórico */}
        {this.state.showModal && (
          <div className="modal-overlay" onClick={this.toggleModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Histórico</h3>
              {this.state.history.length === 0 ? (
                <p>Sem cálculos realizados.</p>
              ) : (
                <ul>
                  {this.state.history.map((calc, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        this.restoreCalculation(calc);
                        this.toggleModal();
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {calc}
                    </li>
                  ))}
                </ul>
              )}
              <button className="btn btn-secondary mt-2" onClick={this.toggleModal}>
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Modal de porcentagem */}
        {this.state.showPercentageModal && (
          <div className="modal-overlay" onClick={this.togglePercentageModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Calculadora de Porcentagem</h3>

              <div className="mb-3">
                <label>Total:</label>
                <input
                  type="text"
                  className="form-control"
                  value={this.state.totalValue}
                  onChange={(e) => this.setState({ totalValue: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label>Porcentagem (%):</label>
                <input
                  type="text"
                  className="form-control"
                  value={this.state.percentageValue}
                  onChange={(e) => this.setState({ percentageValue: e.target.value })}
                />
              </div>
               <div className="mt-3 mb-4">
                <strong>Resultado:</strong> {this.state.percentageResult}
              </div>

              <button className="btn btn-primary" onClick={this.calculatePercentage}>
                Calcular
              </button>

             

              {/* Botão de limpar campos */}
              <button className="btn btn-danger mt-2" onClick={this.clearPercentage}>
                Limpar
              </button>

              <button className="btn btn-secondary mt-2" onClick={this.togglePercentageModal}>
                Fechar
              </button>
            </div>
          </div>
        )}

        

        {/* Botões da calculadora principal */}
        <div className="row">
          <Button label="CA" className="col-4 btn btn-danger" click={this.clearMemory} />
          <Button label="⌫" className="col-4 btn btn-dark" click={this.backspace} />
          <Button label="/" className="col-3 btn btn-warning" click={this.setOperation} />
          <Button label="*" className="col-3 btn btn-warning" click={this.setOperation} />
        </div>
        <div className="row">
          <Button label="7" className="col-3 btn btn-secondary" click={this.addDigit} />
          <Button label="8" className="col-3 btn btn-secondary" click={this.addDigit} />
          <Button label="9" className="col-3 btn btn-secondary" click={this.addDigit} />
          <Button label="-" className="col-3 btn btn-warning" click={this.setOperation} />
        </div>
        <div className="row">
          <Button label="4" className="col-3 btn btn-secondary" click={this.addDigit} />
          <Button label="5" className="col-3 btn btn-secondary" click={this.addDigit} />
          <Button label="6" className="col-3 btn btn-secondary" click={this.addDigit} />
          <Button label="+" className="col-3 btn btn-warning" click={this.setOperation} />
        </div>
        <div className="row">
          <Button label="1" className="col-3 btn btn-secondary" click={this.addDigit} />
          <Button label="2" className="col-3 btn btn-secondary" click={this.addDigit} />
          <Button label="3" className="col-3 btn btn-secondary" click={this.addDigit} />
          <Button label="=" className="col-3 btn btn-success" click={this.setOperation} />
        </div>
        <div className="row">
          <Button label="0" className="col-6 btn btn-secondary" click={this.addDigit} />
          <Button label="." className="col-3 btn btn-secondary" click={this.addDigit} />
        </div>
      </div>
    );
  }
}

export default Calculator;
