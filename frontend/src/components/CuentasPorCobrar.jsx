// src/pages/CuentasPorCobrar.jsx
import { useState, useEffect } from 'react';
import { cuentasPorCobrarService } from '../services/cuentasPorCobrarService';
import './CuentasPorCobrar.css';

export default function CuentasPorCobrar() {
  const [cuentas, setCuentas] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState('tabla');

  const [filtros, setFiltros] = useState({
    estado: '',
    cliente_id: '',
    busqueda: '',
  });

  const [modalNueva, setModalNueva] = useState(false);
  const [modalPago, setModalPago] = useState(false);
  const [modalHistorial, setModalHistorial] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [historialPagos, setHistorialPagos] = useState([]);

  const [nuevaCuenta, setNuevaCuenta] = useState({
    cliente_id: '',
    monto_total: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    notas: '',
  });

  const [nuevoPago, setNuevoPago] = useState({
    monto: '',
    metodo_pago: 'efectivo',
    referencia: '',
    notas: '',
  });

  useEffect(() => {
    cargarDatos();
  }, [filtros.estado, filtros.cliente_id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const filtrosLimpios = {};
      if (filtros.estado) filtrosLimpios.estado = filtros.estado;
      if (filtros.cliente_id) filtrosLimpios.cliente_id = filtros.cliente_id;

      const resCuentas = await cuentasPorCobrarService.obtenerCuentas(
        filtrosLimpios
      );
      setCuentas(resCuentas.data || []);

      const resDashboard = await cuentasPorCobrarService.obtenerDashboard();
      setDashboard(resDashboard.data || null);

      if (clientes.length === 0) {
        const resClientes = await cuentasPorCobrarService.obtenerClientes();
        setClientes(resClientes.data || []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error cargando datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearCuenta = async (e) => {
    e.preventDefault();
    try {
      await cuentasPorCobrarService.crearCuenta(nuevaCuenta);
      alert('✅ Cuenta creada exitosamente');
      setModalNueva(false);
      setNuevaCuenta({
        cliente_id: '',
        monto_total: '',
        fecha_emision: new Date().toISOString().split('T')[0],
        fecha_vencimiento: '',
        notas: '',
      });
      cargarDatos();
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleRegistrarPago = async (e) => {
    e.preventDefault();
    if (!cuentaSeleccionada) return;

    try {
      await cuentasPorCobrarService.registrarPago(
        cuentaSeleccionada.id,
        nuevoPago
      );
      alert('✅ Pago registrado exitosamente');
      setModalPago(false);
      setNuevoPago({
        monto: '',
        metodo_pago: 'efectivo',
        referencia: '',
        notas: '',
      });
      setCuentaSeleccionada(null);
      cargarDatos();
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleVerHistorial = async (cuenta) => {
    try {
      setCuentaSeleccionada(cuenta);
      const res = await cuentasPorCobrarService.obtenerHistorialPagos(
        cuenta.id
      );
      setHistorialPagos(res.data || []);
      setModalHistorial(true);
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleEliminarCuenta = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta cuenta?')) return;

    try {
      await cuentasPorCobrarService.eliminarCuenta(id);
      alert('✅ Cuenta eliminada');
      cargarDatos();
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const abrirModalPago = (cuenta) => {
    setCuentaSeleccionada(cuenta);
    setNuevoPago({
      monto: cuenta.saldo_pendiente || '',
      metodo_pago: 'efectivo',
      referencia: '',
      notas: '',
    });
    setModalPago(true);
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(valor || 0);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-DO');
  };

  const obtenerColorEstado = (estado) => {
    const colores = {
      pendiente: 'badge-estado pendiente',
      pagado: 'badge-estado pagado',
      vencido: 'badge-estado vencido',
    };
    return colores[estado] || 'badge-estado';
  };

  const cuentasFiltradas = cuentas.filter((cuenta) => {
    if (!filtros.busqueda) return true;
    const busqueda = filtros.busqueda.toLowerCase();
    return (cuenta.clientes?.nombre || '').toLowerCase().includes(busqueda);
  });

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Cargando cuentas por cobrar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cxc-container">
      <div className="cxc-header">
        <div className="header-top">
          <div className="header-title">
            <h1>💰 Cuentas por Cobrar</h1>
            <p>Gestiona las cuentas pendientes de cobro</p>
          </div>
          <button className="btn-nuevo" onClick={() => setModalNueva(true)}>
            ➕ Nueva Cuenta
          </button>
        </div>

        {dashboard && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💵</div>
              <div className="stat-content">
                <div className="stat-value">
                  {formatearMoneda(dashboard.total_pendiente)}
                </div>
                <div className="stat-label">Total Pendiente</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <div className="stat-value">
                  {formatearMoneda(dashboard.total_vencido)}
                </div>
                <div className="stat-label">Total Vencido</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">
                  {formatearMoneda(dashboard.total_pagado)}
                </div>
                <div className="stat-label">Total Pagado</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{dashboard.cantidad_pendiente}</div>
                <div className="stat-label">Cuentas Pendientes</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏰</div>
              <div className="stat-content">
                <div className="stat-value">{dashboard.proximas_a_vencer}</div>
                <div className="stat-label">Por Vencer (7 días)</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="filtros-card">
        <div className="filtros-wrapper">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Buscar por cliente..."
              value={filtros.busqueda}
              onChange={(e) =>
                setFiltros({ ...filtros, busqueda: e.target.value })
              }
            />
          </div>

          <select
            className="select-filtro"
            value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
          >
            <option value="">📋 Todos los estados</option>
            <option value="pendiente">🟡 Pendiente</option>
            <option value="pagado">🟢 Pagado</option>
            <option value="vencido">🔴 Vencido</option>
          </select>

          <select
            className="select-filtro"
            value={filtros.cliente_id}
            onChange={(e) =>
              setFiltros({ ...filtros, cliente_id: e.target.value })
            }
          >
            <option value="">👤 Todos los clientes</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>

          <div className="view-buttons">
            <button
              className={`btn-view ${vistaActual === 'tabla' ? 'active' : ''}`}
              onClick={() => setVistaActual('tabla')}
              title="Vista Tabla"
            >
              📊
            </button>
            <button
              className={`btn-view ${
                vistaActual === 'tarjetas' ? 'active' : ''
              }`}
              onClick={() => setVistaActual('tarjetas')}
              title="Vista Tarjetas"
            >
              🎴
            </button>
          </div>
        </div>

        <div className="filtros-info">
          Mostrando {cuentasFiltradas.length} cuenta(s)
        </div>
      </div>

      {cuentasFiltradas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-text">No hay cuentas por cobrar</div>
        </div>
      ) : vistaActual === 'tabla' ? (
        <div className="tabla-card">
          <div className="tabla-wrapper">
            <table className="cxc-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Monto Total</th>
                  <th>Pagado</th>
                  <th>Saldo</th>
                  <th>Fecha Emisión</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cuentasFiltradas.map((cuenta) => (
                  <tr key={cuenta.id}>
                    <td className="id-cell">#{cuenta.id}</td>
                    <td className="cliente-cell">
                      {cuenta.clientes?.nombre || '-'}
                    </td>
                    <td className="monto-cell">
                      {formatearMoneda(cuenta.monto_total)}
                    </td>
                    <td>{formatearMoneda(cuenta.monto_pagado)}</td>
                    <td className="saldo-cell">
                      {formatearMoneda(cuenta.saldo_pendiente)}
                    </td>
                    <td>{formatearFecha(cuenta.fecha_emision)}</td>
                    <td>{formatearFecha(cuenta.fecha_vencimiento)}</td>
                    <td>
                      <span className={obtenerColorEstado(cuenta.estado)}>
                        {cuenta.estado}
                      </span>
                    </td>
                    <td className="acciones-cell">
                      {cuenta.estado !== 'pagado' && (
                        <button
                          className="btn-pagar"
                          onClick={() => abrirModalPago(cuenta)}
                          title="Registrar pago"
                        >
                          💳 Pagar
                        </button>
                      )}
                      <button
                        className="btn-historial"
                        onClick={() => handleVerHistorial(cuenta)}
                        title="Ver historial"
                      >
                        📜
                      </button>
                      <button
                        className="btn-eliminar"
                        onClick={() => handleEliminarCuenta(cuenta.id)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="tarjetas-grid">
          {cuentasFiltradas.map((cuenta) => (
            <div key={cuenta.id} className="cuenta-card">
              <div className="card-header">
                <div className="card-id">#{cuenta.id}</div>
                <span className={obtenerColorEstado(cuenta.estado)}>
                  {cuenta.estado}
                </span>
              </div>

              <div className="card-info">
                <div className="info-row">
                  <span className="info-label">Cliente:</span>
                  <span className="info-value">
                    {cuenta.clientes?.nombre || '-'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Emisión:</span>
                  <span className="info-value">
                    {formatearFecha(cuenta.fecha_emision)}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Vencimiento:</span>
                  <span className="info-value">
                    {formatearFecha(cuenta.fecha_vencimiento)}
                  </span>
                </div>
              </div>

              <div className="card-montos">
                <div className="monto-item">
                  <span className="monto-label">Total:</span>
                  <span className="monto-value">
                    {formatearMoneda(cuenta.monto_total)}
                  </span>
                </div>
                <div className="monto-item">
                  <span className="monto-label">Pagado:</span>
                  <span className="monto-value pagado">
                    {formatearMoneda(cuenta.monto_pagado)}
                  </span>
                </div>
                <div className="monto-item saldo">
                  <span className="monto-label">Saldo:</span>
                  <span className="monto-value pendiente">
                    {formatearMoneda(cuenta.saldo_pendiente)}
                  </span>
                </div>
              </div>

              <div className="card-acciones">
                {cuenta.estado !== 'pagado' && (
                  <button
                    className="btn-pagar"
                    onClick={() => abrirModalPago(cuenta)}
                  >
                    💳 Pagar
                  </button>
                )}
                <button
                  className="btn-historial"
                  onClick={() => handleVerHistorial(cuenta)}
                >
                  📜 Historial
                </button>
                <button
                  className="btn-eliminar"
                  onClick={() => handleEliminarCuenta(cuenta.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalNueva && (
        <div className="modal-overlay" onClick={() => setModalNueva(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-header">Nueva Cuenta por Cobrar</h2>
            <form onSubmit={handleCrearCuenta}>
              <div className="form-grid">
                <div className="form-row">
                  <div className="form-group">
                    <label>Cliente *</label>
                    <select
                      className="form-input"
                      required
                      value={nuevaCuenta.cliente_id}
                      onChange={(e) =>
                        setNuevaCuenta({
                          ...nuevaCuenta,
                          cliente_id: e.target.value,
                        })
                      }
                    >
                      <option value="">Seleccionar cliente</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Monto Total *</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      step="0.01"
                      min="0"
                      value={nuevaCuenta.monto_total}
                      onChange={(e) =>
                        setNuevaCuenta({
                          ...nuevaCuenta,
                          monto_total: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha Emisión *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={nuevaCuenta.fecha_emision}
                      onChange={(e) =>
                        setNuevaCuenta({
                          ...nuevaCuenta,
                          fecha_emision: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Fecha Vencimiento *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={nuevaCuenta.fecha_vencimiento}
                      onChange={(e) =>
                        setNuevaCuenta({
                          ...nuevaCuenta,
                          fecha_vencimiento: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Notas</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={nuevaCuenta.notas}
                    onChange={(e) =>
                      setNuevaCuenta({ ...nuevaCuenta, notas: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => setModalNueva(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalPago && cuentaSeleccionada && (
        <div className="modal-overlay" onClick={() => setModalPago(false)}>
          <div
            className="modal-content modal-pago"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-header">Registrar Pago</h2>

            <div className="pago-info">
              <p>
                <strong>Cliente:</strong> {cuentaSeleccionada.clientes?.nombre}
              </p>
              <p>
                <strong>Saldo Pendiente:</strong>{' '}
                {formatearMoneda(cuentaSeleccionada.saldo_pendiente)}
              </p>
            </div>

            <form onSubmit={handleRegistrarPago}>
              <div className="form-grid">
                <div className="form-row">
                  <div className="form-group">
                    <label>Monto a Pagar *</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      step="0.01"
                      min="0"
                      max={cuentaSeleccionada.saldo_pendiente}
                      value={nuevoPago.monto}
                      onChange={(e) =>
                        setNuevoPago({ ...nuevoPago, monto: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Método de Pago *</label>
                    <select
                      className="form-input"
                      required
                      value={nuevoPago.metodo_pago}
                      onChange={(e) =>
                        setNuevoPago({
                          ...nuevoPago,
                          metodo_pago: e.target.value,
                        })
                      }
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="cheque">Cheque</option>
                      <option value="tarjeta">Tarjeta</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Referencia</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Número de referencia o transacción"
                    value={nuevoPago.referencia}
                    onChange={(e) =>
                      setNuevoPago({ ...nuevoPago, referencia: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Notas</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={nuevoPago.notas}
                    onChange={(e) =>
                      setNuevoPago({ ...nuevoPago, notas: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => setModalPago(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalHistorial && cuentaSeleccionada && (
        <div className="modal-overlay" onClick={() => setModalHistorial(false)}>
          <div
            className="modal-content modal-historial"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-header">
              Historial de Pagos - Cuenta #{cuentaSeleccionada.id}
            </h2>

            <div className="historial-info">
              <p>
                <strong>Cliente:</strong> {cuentaSeleccionada.clientes?.nombre}
              </p>
              <p>
                <strong>Total:</strong>{' '}
                {formatearMoneda(cuentaSeleccionada.monto_total)}
              </p>
              <p>
                <strong>Pagado:</strong>{' '}
                {formatearMoneda(cuentaSeleccionada.monto_pagado)}
              </p>
            </div>

            {historialPagos.length === 0 ? (
              <div className="empty-state">
                <p>No hay pagos registrados</p>
              </div>
            ) : (
              <div className="tabla-wrapper">
                <table className="historial-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Monto</th>
                      <th>Método</th>
                      <th>Referencia</th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialPagos.map((pago) => (
                      <tr key={pago.id}>
                        <td>{formatearFecha(pago.fecha_pago)}</td>
                        <td className="monto-cell">
                          {formatearMoneda(pago.monto)}
                        </td>
                        <td>{pago.metodo_pago}</td>
                        <td>{pago.referencia || '-'}</td>
                        <td>{pago.notas || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn-cancelar"
                onClick={() => setModalHistorial(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
