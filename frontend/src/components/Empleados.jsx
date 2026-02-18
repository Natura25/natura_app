// src/pages/Empleados.jsx
import React, { useState, useEffect } from 'react';
import './inventario.css'; // Reutiliza los estilos

const API_URL = /*import.meta.env.VITE_API_URL ||*/ 'http://localhost:3000/api';

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [departamentos, setDepartamentos] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [empleadoEditar, setEmpleadoEditar] = useState(null);
  const [vistaActual, setVistaActual] = useState('tabla');

  useEffect(() => {
    cargarEmpleados();
    cargarDepartamentos();
  }, []);

  const cargarEmpleados = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/nomina/empleados`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEmpleados(data.data || data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDepartamentos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/categorias?tipo=departamento`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDepartamentos(data.data || data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const empleadosFiltrados = empleados.filter((emp) => {
    const matchBusqueda =
      emp.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      emp.cedula?.includes(busqueda) ||
      emp.codigo?.includes(busqueda);
    const matchDepartamento =
      !departamento || emp.departamento_id === departamento;
    return matchBusqueda && matchDepartamento;
  });

  const eliminarEmpleado = async (id) => {
    if (!window.confirm('¿Eliminar este empleado?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/nomina/empleados/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      cargarEmpleados();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Cargando empleados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inventario-container">
      {/* Header */}
      <div className="inventario-header">
        <div className="header-top">
          <div className="header-title">
            <h1>👥 Empleados</h1>
            <p>Gestión del personal de la empresa</p>
          </div>
          <button
            className="btn-nuevo"
            onClick={() => {
              setEmpleadoEditar(null);
              setModalAbierto(true);
            }}
          >
            ➕ Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-card">
        <div className="filtros-wrapper">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Buscar por nombre, cédula o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <select
            className="select-categoria"
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
          >
            <option value="">Todos los departamentos</option>
            {departamentos.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.nombre}
              </option>
            ))}
          </select>
          <div className="view-buttons">
            <button
              className={`btn-view ${vistaActual === 'tabla' ? 'active' : ''}`}
              onClick={() => setVistaActual('tabla')}
            >
              📋
            </button>
            <button
              className={`btn-view ${vistaActual === 'tarjetas' ? 'active' : ''}`}
              onClick={() => setVistaActual('tarjetas')}
            >
              🎴
            </button>
          </div>
        </div>
        <div className="filtros-info">
          Mostrando {empleadosFiltrados.length} de {empleados.length} empleados
        </div>
      </div>

      {/* Vista Tabla */}
      {vistaActual === 'tabla' ? (
        <div className="tabla-card">
          <div className="tabla-wrapper">
            {empleadosFiltrados.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p className="empty-text">No hay empleados registrados</p>
              </div>
            ) : (
              <table className="productos-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Cédula</th>
                    <th>Puesto</th>
                    <th>Departamento</th>
                    <th>Estado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {empleadosFiltrados.map((emp) => (
                    <tr key={emp.id}>
                      <td className="codigo-cell">{emp.codigo}</td>
                      <td className="nombre-cell">{emp.nombre_completo}</td>
                      <td>{emp.cedula}</td>
                      <td>{emp.puesto}</td>
                      <td>
                        <span className="badge-categoria">
                          {emp.departamento?.nombre || 'Sin departamento'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`stock-badge ${emp.estado === 'activo' ? 'normal' : 'bajo'}`}
                        >
                          {emp.estado}
                        </span>
                      </td>
                      <td className="acciones-cell">
                        <button
                          className="btn-editar"
                          onClick={() => {
                            setEmpleadoEditar(emp);
                            setModalAbierto(true);
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="btn-eliminar"
                          onClick={() => eliminarEmpleado(emp.id)}
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* Vista Tarjetas */
        <div className="tarjetas-grid">
          {empleadosFiltrados.map((emp) => (
            <div key={emp.id} className="producto-card">
              <div className="card-header">
                <div className="card-codigo">{emp.codigo}</div>
                <h3 className="card-nombre">{emp.nombre_completo}</h3>
                <span className="badge-categoria">{emp.puesto}</span>
              </div>
              <div className="card-stats">
                <div>
                  <div className="stat-label">Cédula</div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>
                    {emp.cedula}
                  </div>
                </div>
                <div>
                  <div className="stat-label">Estado</div>
                  <span
                    className={`stock-badge ${emp.estado === 'activo' ? 'normal' : 'bajo'}`}
                  >
                    {emp.estado}
                  </span>
                </div>
              </div>
              <div className="card-acciones">
                <button
                  className="btn-editar"
                  onClick={() => {
                    setEmpleadoEditar(emp);
                    setModalAbierto(true);
                  }}
                >
                  ✏️ Editar
                </button>
                <button
                  className="btn-eliminar"
                  onClick={() => eliminarEmpleado(emp.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <ModalEmpleado
          empleado={empleadoEditar}
          departamentos={departamentos}
          onClose={() => setModalAbierto(false)}
          onGuardar={() => {
            setModalAbierto(false);
            cargarEmpleados();
          }}
        />
      )}
    </div>
  );
}

function ModalEmpleado({ empleado, departamentos, onClose, onGuardar }) {
  const [formData, setFormData] = useState({
    nombres: empleado?.nombres || '',
    apellidos: empleado?.apellidos || '',
    cedula: empleado?.cedula || '',
    fecha_ingreso:
      empleado?.fecha_ingreso || new Date().toISOString().split('T')[0],
    puesto: empleado?.puesto || '',
    departamento_id: empleado?.departamento_id || '',
    telefono: empleado?.telefono || '',
    email: empleado?.email || '',
    tipo_contrato: empleado?.tipo_contrato || 'indefinido',
    salario_base: empleado?.configuracion_salarial?.[0]?.salario_base || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = empleado
        ? `${API_URL}/api/nomina/empleados/${empleado.id}`
        : `${API_URL}/api/nomina/empleados`;

      const res = await fetch(url, {
        method: empleado ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        // Configurar salario si es nuevo
        if (!empleado && formData.salario_base) {
          await fetch(`${API_URL}/api/nomina/empleados/${data.id}/salario`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              salario_base: formData.salario_base,
              periodo_pago: 'quincenal',
            }),
          });
        }
        onGuardar();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar empleado');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-header">
          {empleado ? '✏️ Editar Empleado' : '➕ Nuevo Empleado'}
        </h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-row">
            <div className="form-group">
              <label>Nombres *</label>
              <input
                type="text"
                className="form-input"
                value={formData.nombres}
                onChange={(e) =>
                  setFormData({ ...formData, nombres: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Apellidos *</label>
              <input
                type="text"
                className="form-input"
                value={formData.apellidos}
                onChange={(e) =>
                  setFormData({ ...formData, apellidos: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cédula *</label>
              <input
                type="text"
                className="form-input"
                placeholder="001-1234567-8"
                value={formData.cedula}
                onChange={(e) =>
                  setFormData({ ...formData, cedula: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                className="form-input"
                placeholder="809-555-1234"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Puesto *</label>
              <input
                type="text"
                className="form-input"
                value={formData.puesto}
                onChange={(e) =>
                  setFormData({ ...formData, puesto: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Departamento</label>
              <select
                className="form-input"
                value={formData.departamento_id}
                onChange={(e) =>
                  setFormData({ ...formData, departamento_id: e.target.value })
                }
              >
                <option value="">Seleccionar...</option>
                {departamentos.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha Ingreso *</label>
              <input
                type="date"
                className="form-input"
                value={formData.fecha_ingreso}
                onChange={(e) =>
                  setFormData({ ...formData, fecha_ingreso: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Tipo Contrato</label>
              <select
                className="form-input"
                value={formData.tipo_contrato}
                onChange={(e) =>
                  setFormData({ ...formData, tipo_contrato: e.target.value })
                }
              >
                <option value="indefinido">Indefinido</option>
                <option value="temporal">Temporal</option>
                <option value="por_obra">Por Obra</option>
                <option value="pasantia">Pasantía</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Salario Base (RD$)</label>
            <input
              type="number"
              className="form-input"
              placeholder="25000"
              value={formData.salario_base}
              onChange={(e) =>
                setFormData({ ...formData, salario_base: e.target.value })
              }
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-guardar">
              💾 Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
