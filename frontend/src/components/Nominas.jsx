// src/pages/Nominas.jsx
import React, { useState, useEffect } from 'react';
import './Inventario.css';

const API_URL = 'http://localhost:3000/api';

export default function Nominas() {
  const [nominas, setNominas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nominaSeleccionada, setNominaSeleccionada] = useState(null);

  useEffect(() => {
    cargarNominas();
  }, []);

  const cargarNominas = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/nomina/nominas`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Error cargando nóminas');

      const data = await res.json();
      setNominas(data.data || data); // Maneja ambos formatos
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar nóminas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Cargando nóminas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inventario-container">
      <div className="inventario-header">
        <div className="header-top">
          <div className="header-title">
            <h1>💰 Nóminas</h1>
            <p>Gestión de pagos de nómina</p>
          </div>
          <button className="btn-nuevo" onClick={() => setModalAbierto(true)}>
            ➕ Nueva Nómina
          </button>
        </div>
      </div>

      <div className="tabla-card">
        <div className="tabla-wrapper">
          {!nominas || nominas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💸</div>
              <p className="empty-text">No hay nóminas registradas</p>
            </div>
          ) : (
            <table className="productos-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Período</th>
                  <th>Tipo</th>
                  <th className="text-right">Empleados</th>
                  <th className="text-right">Total Neto</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {nominas.map((nom) => (
                  <tr key={nom.id}>
                    <td className="codigo-cell">{nom.codigo}</td>
                    <td>
                      {new Date(nom.periodo_inicio).toLocaleDateString('es-DO')}{' '}
                      - {new Date(nom.periodo_fin).toLocaleDateString('es-DO')}
                    </td>
                    <td>
                      <span className="badge-categoria">
                        {nom.tipo_periodo}
                      </span>
                    </td>
                    <td className="text-right">{nom.total_empleados || 0}</td>
                    <td className="precio-venta">
                      RD$ {(nom.total_neto || 0).toLocaleString('es-DO')}
                    </td>
                    <td>
                      <span
                        className={`stock-badge ${
                          nom.estado === 'pagado'
                            ? 'normal'
                            : nom.estado === 'aprobado'
                              ? 'normal'
                              : 'bajo'
                        }`}
                      >
                        {nom.estado}
                      </span>
                    </td>
                    <td className="acciones-cell">
                      <button
                        className="btn-editar"
                        onClick={() => setNominaSeleccionada(nom)}
                      >
                        👁️ Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalAbierto && (
        <ModalNuevaNomina
          onClose={() => setModalAbierto(false)}
          onGuardar={() => {
            setModalAbierto(false);
            cargarNominas();
          }}
        />
      )}

      {nominaSeleccionada && (
        <ModalDetalle
          nomina={nominaSeleccionada}
          onClose={() => setNominaSeleccionada(null)}
          onRefresh={cargarNominas}
        />
      )}
    </div>
  );
}

function ModalNuevaNomina({ onClose, onGuardar }) {
  const [paso, setPaso] = useState(1);
  const [formData, setFormData] = useState({
    periodo_inicio: '',
    periodo_fin: '',
    tipo_periodo: 'quincenal',
    descripcion: '',
  });
  const [empleados, setEmpleados] = useState([]);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState([]);
  const [calculando, setCalculando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (paso === 2) cargarEmpleados();
  }, [paso]);

  const cargarEmpleados = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/nomina/empleados/para-nomina`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Error cargando empleados');

      const data = await res.json();
      setEmpleados(data.data || data);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar empleados');
    }
  };

  const crearYCalcular = async () => {
    setCalculando(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      // 1. Crear nómina
      console.log('📝 Creando nómina...');
      const resNomina = await fetch(`${API_URL}/nomina/nominas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!resNomina.ok) {
        const errorData = await resNomina.json();
        throw new Error(errorData.error || 'Error creando nómina');
      }

      const nomina = await resNomina.json();
      console.log('✅ Nómina creada:', nomina.codigo);

      // 2. Preparar datos para calcular
      const empleadosData = empleadosSeleccionados.map((emp) => ({
        empleado_id: emp.id,
        codigo: emp.codigo,
        nombre_completo: emp.nombre_completo,
        cedula: emp.cedula,
        puesto: emp.puesto,
        salario_base: emp.configuracion_salarial?.[0]?.salario_base || 0,
        periodo_pago:
          emp.configuracion_salarial?.[0]?.periodo_pago || 'quincenal',
        dias_trabajados: 15,
        dias_ausencias: 0,
        horas_extras: 0,
        descuento_prestamo: 0,
        conceptos_adicionales: [],
      }));

      console.log('🧮 Calculando nómina...');
      const resCalculo = await fetch(
        `${API_URL}/nomina/nominas/${nomina.id}/calcular`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ empleados: empleadosData }),
        },
      );

      if (!resCalculo.ok) {
        const errorData = await resCalculo.json();
        throw new Error(errorData.error || 'Error calculando nómina');
      }

      console.log('✅ Nómina calculada exitosamente');
      alert('✅ Nómina creada y calculada correctamente');
      onGuardar();
    } catch (error) {
      console.error('❌ Error:', error);
      setError(error.message);
      alert(`Error: ${error.message}`);
    } finally {
      setCalculando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '800px' }}
      >
        <h2 className="modal-header">
          {paso === 1 && '📅 Nueva Nómina - Configuración'}
          {paso === 2 && '👥 Seleccionar Empleados'}
          {paso === 3 && '🧮 Confirmar y Calcular'}
        </h2>

        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#ffebee',
              border: '1px solid #f44336',
              borderRadius: '8px',
              marginBottom: '16px',
              color: '#c62828',
            }}
          >
            {error}
          </div>
        )}

        {paso === 1 && (
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              setPaso(2);
            }}
          >
            <div className="form-row">
              <div className="form-group">
                <label>Período Inicio *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.periodo_inicio}
                  onChange={(e) =>
                    setFormData({ ...formData, periodo_inicio: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Período Fin *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.periodo_fin}
                  onChange={(e) =>
                    setFormData({ ...formData, periodo_fin: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tipo Período</label>
              <select
                className="form-input"
                value={formData.tipo_periodo}
                onChange={(e) =>
                  setFormData({ ...formData, tipo_periodo: e.target.value })
                }
              >
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <input
                type="text"
                className="form-input"
                placeholder="1ra Quincena Febrero 2026"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancelar" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-guardar">
                Siguiente →
              </button>
            </div>
          </form>
        )}

        {paso === 2 && (
          <div>
            <p style={{ marginBottom: '16px', color: '#666' }}>
              Selecciona los empleados a incluir en esta nómina
            </p>
            <div
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                marginBottom: '20px',
              }}
            >
              {empleados.length === 0 ? (
                <p
                  style={{
                    textAlign: 'center',
                    color: '#999',
                    padding: '40px',
                  }}
                >
                  No hay empleados con salario configurado
                </p>
              ) : (
                empleados.map((emp) => (
                  <label
                    key={emp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      backgroundColor: empleadosSeleccionados.some(
                        (e) => e.id === emp.id,
                      )
                        ? '#e8f5e9'
                        : 'white',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={empleadosSeleccionados.some(
                        (e) => e.id === emp.id,
                      )}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEmpleadosSeleccionados([
                            ...empleadosSeleccionados,
                            emp,
                          ]);
                        } else {
                          setEmpleadosSeleccionados(
                            empleadosSeleccionados.filter(
                              (e) => e.id !== emp.id,
                            ),
                          );
                        }
                      }}
                      style={{
                        marginRight: '12px',
                        width: '18px',
                        height: '18px',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600' }}>
                        {emp.nombre_completo}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {emp.puesto} - RD${' '}
                        {(
                          emp.configuracion_salarial?.[0]?.salario_base || 0
                        ).toLocaleString('es-DO')}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setPaso(1)}>
                ← Atrás
              </button>
              <button
                className="btn-guardar"
                onClick={() => setPaso(3)}
                disabled={empleadosSeleccionados.length === 0}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div>
            <div className="margen-info" style={{ marginBottom: '20px' }}>
              <div>
                <div className="margen-label">Empleados Seleccionados</div>
                <div className="margen-valor">
                  {empleadosSeleccionados.length}
                </div>
              </div>
              <div>
                <div className="margen-label">Período</div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                  {formData.periodo_inicio} al {formData.periodo_fin}
                </div>
              </div>
            </div>

            <p style={{ color: '#666', marginBottom: '20px' }}>
              ⚠️ Se calculará la nómina automáticamente con AFP, SFS, ISR y
              demás deducciones.
            </p>

            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setPaso(2)}>
                ← Atrás
              </button>
              <button
                className="btn-guardar"
                onClick={crearYCalcular}
                disabled={calculando}
              >
                {calculando ? '⏳ Calculando...' : '🧮 Crear y Calcular'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModalDetalle({ nomina, onClose, onRefresh }) {
  const [detalle, setDetalle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarDetalle();
  }, []);

  const cargarDetalle = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_URL}/nomina/nominas/${nomina.id}/detalle`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error('Error cargando detalle');

      const data = await res.json();
      setDetalle(data.data || data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar detalle');
    } finally {
      setLoading(false);
    }
  };

  const aprobar = async () => {
    if (!window.confirm('¿Aprobar esta nómina?')) return;

    setProcesando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_URL}/nomina/nominas/${nomina.id}/aprobar`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error aprobando');
      }

      alert('✅ Nómina aprobada');
      onRefresh();
      onClose();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setProcesando(false);
    }
  };

  const pagar = async () => {
    if (!window.confirm('¿Marcar esta nómina como pagada?')) return;

    setProcesando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/nomina/nominas/${nomina.id}/pagar`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error marcando como pagada');
      }

      alert('✅ Nómina marcada como pagada');
      onRefresh();
      onClose();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '900px' }}
      >
        <h2 className="modal-header">📋 Detalle de Nómina - {nomina.codigo}</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div
              className="loading-spinner"
              style={{ margin: '0 auto 20px' }}
            ></div>
            Cargando detalle...
          </div>
        ) : (
          <div>
            {detalle.length === 0 ? (
              <p
                style={{ textAlign: 'center', padding: '40px', color: '#999' }}
              >
                No hay detalle calculado para esta nómina
              </p>
            ) : (
              <>
                <table className="productos-table">
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th className="text-right">Salario Base</th>
                      <th className="text-right">Percepciones</th>
                      <th className="text-right">Deducciones</th>
                      <th className="text-right">Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.map((det) => (
                      <tr key={det.id}>
                        <td className="nombre-cell">{det.empleado_nombre}</td>
                        <td className="precio-cell">
                          RD$ {Number(det.salario_base).toLocaleString('es-DO')}
                        </td>
                        <td
                          className="precio-cell"
                          style={{ color: '#4caf50' }}
                        >
                          RD${' '}
                          {Number(det.total_percepciones).toLocaleString(
                            'es-DO',
                          )}
                        </td>
                        <td
                          className="precio-cell"
                          style={{ color: '#f44336' }}
                        >
                          RD${' '}
                          {Number(det.total_deducciones).toLocaleString(
                            'es-DO',
                          )}
                        </td>
                        <td className="precio-venta">
                          RD$ {Number(det.salario_neto).toLocaleString('es-DO')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="margen-info" style={{ marginTop: '20px' }}>
                  <div>
                    <div className="margen-label">Total Neto</div>
                    <div className="margen-valor">
                      RD${' '}
                      {Number(nomina.total_neto || 0).toLocaleString('es-DO')}
                    </div>
                  </div>
                  <div>
                    <div className="margen-label">Estado</div>
                    <span
                      className={`stock-badge ${
                        nomina.estado === 'pagado'
                          ? 'normal'
                          : nomina.estado === 'aprobado'
                            ? 'normal'
                            : 'bajo'
                      }`}
                    >
                      {nomina.estado}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="modal-actions">
              <button className="btn-cancelar" onClick={onClose}>
                Cerrar
              </button>
              {nomina.estado === 'pendiente' && (
                <button
                  className="btn-guardar"
                  onClick={aprobar}
                  disabled={procesando}
                >
                  {procesando ? '⏳ Procesando...' : '✅ Aprobar'}
                </button>
              )}
              {nomina.estado === 'aprobado' && (
                <button
                  className="btn-guardar"
                  onClick={pagar}
                  disabled={procesando}
                >
                  {procesando ? '⏳ Procesando...' : '💰 Marcar Pagada'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
