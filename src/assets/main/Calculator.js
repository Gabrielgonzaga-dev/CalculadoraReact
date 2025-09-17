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
    showModal: false,           // Modal de histórico
    showPercentageModal: false, // Modal de porcentagem
    showDropdown: false,        // Dropdown de opções

    // Calculadora de porcentagem
    totalValue: '',
    percentageValue: '',
    percentageResult: '',
  };

  // === FUNÇÃO PARA ENVIAR MÉTRICAS ===
  // Esta função envia um POST para seu backend leve
  sendMetric = async (name, value, labels = {}) => {
    try {
      // ATENÇÃO: Verifique a porta do seu backend leve (3001 no exemplo)
      await fetch('http://localhost:3001/metrics/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, value, labels }),
      });
      // console.log(`Métrica '${name}' enviada com sucesso!`); // Para depuração
    } catch (error) {
      console.error('Erro ao enviar métrica:', error);
    }
  };

  // === DROPDOWN ===
  toggleDropdown = () => {
    this.setState({ showDropdown: !this.state.showDropdown });
    // Opcional: registrar abertura/fechamento do dropdown
    this.sendMetric('dropdown_toggles_total', 1, { action: this.state.showDropdown ? 'close' : 'open' });
  };

  closeDropdown = () => {
    this.setState({ showDropdown: false });
  };

  // === HISTÓRICO ===
  handleOpenHistory = () => {
    this.setState({ showModal: true, showDropdown: false });
    this.sendMetric('history_modal_opens_total', 1);
  };
  toggleModal = () => {
    this.setState({ showModal: !this.state.showModal });
  };

  // === PORCENTAGEM ===
  handleOpenPercentage = () => {
    this.setState({ showPercentageModal: true, showDropdown: false });
    this.sendMetric('percentage_modal_opens_total', 1);
  };
  togglePercentageModal = () => {
    this.setState({ showPercentageModal: !this.state.showPercentageModal });
  };

  clearPercentage = () => {
    this.setState({
      totalValue: '',
      percentageValue: '',
      percentageResult: ''
    });
    this.sendMetric('percentage_calculator_clears_total', 1);
  };

  calculatePercentage = () => {
    const total = parseFloat(this.state.totalValue.replace(/\./g, '').replace(',', '.'));
    const pct = parseFloat(this.state.percentageValue.replace(/\./g, '').replace(',', '.'));

    if (isNaN(total) || isNaN(pct)) {
      this.setState({ percentageResult: 'Entrada inválida' });
      this.sendMetric('percentage_calculation_total', 1, { status: 'invalid_input' });
      return;
    }

    const result = (total * pct) / 100;
    this.setState({ percentageResult: result.toFixed(2) });
    this.sendMetric('percentage_calculation_total', 1, { status: 'success' });
  };

  // === LÓGICA CALCULADORA NORMAL ===
  clearMemory = () => {
    this.setState({
      displayValue: '0',
      num1: null,
      operation: null,
      waitingForNewNumber: false,
    });
    this.sendMetric('calculator_clears_total', 1);
  };

  backspace = () => {
    this.setState((prevState) => {
      const newValue =
        prevState.displayValue.length > 1
          ? prevState.displayValue.slice(0, -1)
          : '0';
      this.sendMetric('backspace_uses_total', 1);
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
    this.sendMetric('digit_inputs_total', 1, { digit: digit });
  };

  addToHistory = (calcString) => {
    this.setState((prevState) => ({
      history: [...prevState.history, calcString],
    }));
    this.sendMetric('calculation_added_to_history_total', 1);
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
      this.sendMetric('operation_selected_total', 1, { operation: operation });
    } else if (prevOperation) {
      let result = this.calculate(num1, currentValue, prevOperation);

      if (operation === '=') {
        const calcString = `${num1} ${prevOperation} ${currentValue} = ${result}`;
        this.addToHistory(calcString);
        this.sendMetric('main_calculation_total', 1, { status: result === 'Erro' ? 'error' : 'success', operation: prevOperation });
      } else {
        this.sendMetric('operation_selected_total', 1, { operation: operation });
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
        if (num2 === 0) {
          this.sendMetric('division_by_zero_errors_total', 1);
          return 'Erro';
        }
        return num1 / num2;
      default:
        return num2;
    }
  };

  restoreCalculation = (calcString) => {
    const parts = calcString.split('=');
    if (parts.length === 2) {
      this.setState({ displayValue: parts[1].trim(), waitingForNewNumber: true });
      this.sendMetric('history_restorations_total', 1);
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