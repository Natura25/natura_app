// src/pages/Inventario.jsx
import React, { useState, useEffect } from 'react';
import { inventarioService } from '../services/inventarioService';
import './Inventario.css';

const Inventario = () => {
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [alertasStock, setAlertasStock] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [vistaActual, setVistaActual] = useState('lista');

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria_id: '',
    unidad_medida: 'unidad',
    cantidad: 0,
    min_stock: 0,
    precio_compra: 0,
    precio_venta: 0,
    ubicacion: '',
    notas: '',
  });

  useEffect(() => {
    cargarDatos();
    cargarCategorias();
  }, []);

  useEffect(() => {
    filtrarProductos();
  }, [busqueda, categoriaFiltro, productos]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔄 Cargando productos y alertas...');

      const [productosRes, alertasRes] = await Promise.all([
        inventarioService.obtenerProductos().catch((err) => {
          console.error('❌ Error cargando productos:', err);
          return { data: [], total: 0 };
        }),
        inventarioService.obtenerAlertasStock().catch((err) => {
          console.warn('⚠️ No se pudieron cargar alertas:', err);
          return [];
        }),
      ]);

      console.log('📦 Productos recibidos:', productosRes);
      console.log('🔔 Alertas recibidas:', alertasRes);

      const productosData = Array.isArray(productosRes?.data)
        ? productosRes.data
        : Array.isArray(productosRes)
        ? productosRes
        : [];

      const alertasData = Array.isArray(alertasRes)
        ? alertasRes
        : alertasRes?.data || [];

      setProductos(productosData);
      setProductosFiltrados(productosData);
      setAlertasStock(alertasData);

      console.log(
        `✅ Cargados ${productosData.length} productos y ${alertasData.length} alertas`
      );
    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      setError(err.message || 'Error al cargar los datos');
      setProductos([]);
      setProductosFiltrados([]);
      setAlertasStock([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      console.log('📁 Cargando categorías...');
      const response = await inventarioService.obtenerCategorias();
      console.log('📂 Categorías recibidas:', response);

      const categoriasData = Array.isArray(response)
        ? response
        : response?.data || [];

      console.log(`✅ ${categoriasData.length} categorías cargadas`);
      setCategorias(categoriasData);
    } catch (err) {
      console.error('❌ Error cargando categorías:', err);
      setCategorias([]);
    }
  };

  const filtrarProductos = () => {
    let resultado = productos;

    if (busqueda) {
      resultado = resultado.filter(
        (p) =>
          p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.codigo.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    if (categoriaFiltro !== 'todas') {
      resultado = resultado.filter(
        (p) => p.categoria_id?.toString() === categoriaFiltro
      );
    }

    setProductosFiltrados(resultado);
  };

  const abrirModal = (producto = null) => {
    if (producto) {
      setProductoEditando(producto);
      setFormData({
        codigo: producto.codigo,
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        categoria_id: producto.categoria_id || '',
        unidad_medida: producto.unidad_medida || 'unidad',
        cantidad: producto.cantidad,
        min_stock: producto.min_stock,
        precio_compra: producto.precio_compra,
        precio_venta: producto.precio_venta,
        ubicacion: producto.ubicacion || '',
        notas: producto.notas || '',
      });
    } else {
      setProductoEditando(null);
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        categoria_id: '',
        unidad_medida: 'unidad',
        cantidad: 0,
        min_stock: 0,
        precio_compra: 0,
        precio_venta: 0,
        ubicacion: '',
        notas: '',
      });
    }
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setProductoEditando(null);
  };

  // ============ FUNCIÓN MEJORADA: Mostrar Notificaciones ============
  const mostrarNotificacion = (mensaje, tipo = 'info') => {
    const notif = document.createElement('div');
    notif.className = `notificacion notificacion-${tipo}`;
    notif.textContent = mensaje;
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${
        tipo === 'success'
          ? '#10b981'
          : tipo === 'error'
          ? '#ef4444'
          : '#3b82f6'
      };
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-weight: 500;
      animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notif);

    setTimeout(() => {
      notif.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  };

  // ============ FUNCIÓN MEJORADA: handleSubmit con Validación ============
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validar longitud de campos
      const errores = [];

      if (formData.codigo && formData.codigo.length > 50) {
        errores.push('El código no puede exceder 50 caracteres');
      }

      if (formData.nombre && formData.nombre.length > 255) {
        errores.push('El nombre no puede exceder 255 caracteres');
      }

      if (formData.ubicacion && formData.ubicacion.length > 100) {
        errores.push('La ubicación no puede exceder 100 caracteres');
      }

      if (errores.length > 0) {
        mostrarNotificacion('⚠️ ' + errores.join('. '), 'error');
        return;
      }

      // Preparar datos limpios
      const datosLimpios = {
        codigo: formData.codigo.trim(),
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null,
        categoria_id: formData.categoria_id || null,
        unidad_medida: formData.unidad_medida,
        cantidad: parseInt(formData.cantidad) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
        precio_compra: parseFloat(formData.precio_compra) || 0,
        precio_venta: parseFloat(formData.precio_venta) || 0,
        ubicacion: formData.ubicacion?.trim() || null,
        notas: formData.notas?.trim() || null,
      };

      if (productoEditando) {
        await inventarioService.actualizarProducto(
          productoEditando.id,
          datosLimpios
        );
        mostrarNotificacion('✅ Producto actualizado correctamente', 'success');
      } else {
        await inventarioService.crearProducto(datosLimpios);
        mostrarNotificacion('✅ Producto creado correctamente', 'success');
      }

      await cargarDatos();
      cerrarModal();
    } catch (err) {
      console.error('Error al guardar:', err);
      mostrarNotificacion(
        '❌ ' + (err.message || 'Error al guardar el producto'),
        'error'
      );
    }
  };

  // ============ FUNCIÓN MEJORADA: handleEliminar ============
  const handleEliminar = async (id) => {
    const producto = productos.find((p) => p.id === id);
    const mensaje = producto
      ? `¿Estás seguro de eliminar "${producto.nombre}"?\n\nEsta acción no se puede deshacer.`
      : '¿Estás seguro de eliminar este producto?';

    if (!window.confirm(mensaje)) return;

    try {
      await inventarioService.eliminarProducto(id);
      await cargarDatos();
      mostrarNotificacion('✅ Producto eliminado correctamente', 'success');
    } catch (err) {
      console.error('Error al eliminar:', err);
      mostrarNotificacion(
        '❌ ' + (err.message || 'Error al eliminar el producto'),
        'error'
      );
    }
  };

  const categoriasUnicas = categorias.reduce((acc, cat) => {
    if (!acc.find((c) => c.id === cat.id)) {
      acc.push(cat);
    }
    return acc;
  }, []);

  const margenGanancia = formData.precio_venta - formData.precio_compra;
  const porcentajeGanancia =
    formData.precio_compra > 0
      ? (margenGanancia / formData.precio_compra) * 100
      : 0;

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          Cargando inventario...
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
            <h1>📦 Inventario</h1>
            <p>Gestión de productos y stock</p>
          </div>
          <button onClick={() => abrirModal()} className="btn-nuevo">
            ➕ Nuevo Producto
          </button>
        </div>

        {/* Alertas de Stock Bajo - MEJORADAS */}
        {alertasStock.length > 0 && (
          <div className="alerta-stock">
            <div className="alerta-content">
              <span className="alerta-icon">⚠️</span>
              <div className="alerta-text">
                <strong>Alerta de Stock Bajo</strong>
                <p>
                  {alertasStock.length} producto(s) necesitan reabastecimiento:
                  {alertasStock.slice(0, 3).map((p, i) => (
                    <span key={p.id}>
                      {i > 0 && ', '}
                      <strong>{p.nombre}</strong> ({p.cantidad}/{p.min_stock})
                    </span>
                  ))}
                  {alertasStock.length > 3 && (
                    <span> y {alertasStock.length - 3} más...</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros y Búsqueda */}
      <div className="filtros-card">
        <div className="filtros-wrapper">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="select-categoria"
          >
            <option value="todas">📂 Todas las categorías</option>
            {categoriasUnicas.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.codigo} - {cat.nombre}
              </option>
            ))}
          </select>

          <div className="view-buttons">
            <button
              onClick={() => setVistaActual('lista')}
              className={`btn-view ${vistaActual === 'lista' ? 'active' : ''}`}
              title="Vista de lista"
            >
              ☰
            </button>
            <button
              onClick={() => setVistaActual('tarjetas')}
              className={`btn-view ${
                vistaActual === 'tarjetas' ? 'active' : ''
              }`}
              title="Vista de tarjetas"
            >
              ▦
            </button>
          </div>
        </div>

        <div className="filtros-info">
          Mostrando <strong>{productosFiltrados.length}</strong> de{' '}
          <strong>{productos.length}</strong> productos
        </div>
      </div>

      {/* Vista de Lista */}
      {vistaActual === 'lista' ? (
        <div className="tabla-card">
          <div className="tabla-wrapper">
            <table className="productos-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="text-center">Stock</th>
                  <th className="text-right">Precio Compra</th>
                  <th className="text-right">Precio Venta</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((producto) => {
                  const stockBajo = producto.cantidad <= producto.min_stock;
                  return (
                    <tr key={producto.id}>
                      <td className="codigo-cell">{producto.codigo}</td>
                      <td className="nombre-cell">{producto.nombre}</td>
                      <td>
                        {producto.categoria ? (
                          <span className="badge-categoria">
                            {producto.categoria.codigo} -{' '}
                            {producto.categoria.nombre}
                          </span>
                        ) : (
                          <span className="badge-categoria">Sin categoría</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span
                          className={`stock-badge ${
                            stockBajo ? 'bajo' : 'normal'
                          }`}
                        >
                          {producto.cantidad}
                        </span>
                        <span className="stock-minimo">
                          / {producto.min_stock}
                        </span>
                      </td>
                      <td className="precio-cell">
                        ${producto.precio_compra?.toFixed(2) || '0.00'}
                      </td>
                      <td className="precio-venta">
                        ${producto.precio_venta?.toFixed(2) || '0.00'}
                      </td>
                      <td>
                        <div className="acciones-cell">
                          <button
                            onClick={() => abrirModal(producto)}
                            className="btn-editar"
                            title="Editar producto"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleEliminar(producto.id)}
                            className="btn-eliminar"
                            title="Eliminar producto"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {productosFiltrados.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p className="empty-text">No se encontraron productos</p>
            </div>
          )}
        </div>
      ) : (
        // Vista de Tarjetas
        <div className="tarjetas-grid">
          {productosFiltrados.map((producto) => {
            const stockBajo = producto.cantidad <= producto.min_stock;
            return (
              <div key={producto.id} className="producto-card">
                {stockBajo && (
                  <div className="stock-bajo-badge">STOCK BAJO</div>
                )}

                <div className="card-header">
                  <div className="card-codigo">{producto.codigo}</div>
                  <h3 className="card-nombre">{producto.nombre}</h3>
                  {producto.categoria && (
                    <span className="badge-categoria">
                      {producto.categoria.codigo} - {producto.categoria.nombre}
                    </span>
                  )}
                </div>

                <div className="card-stats">
                  <div>
                    <div className="stat-label">Stock</div>
                    <div
                      className={`stat-value ${
                        stockBajo ? 'stock-bajo' : 'stock-ok'
                      }`}
                    >
                      {producto.cantidad}
                    </div>
                  </div>
                  <div>
                    <div className="stat-label">Precio Venta</div>
                    <div className="stat-value">${producto.precio_venta}</div>
                  </div>
                </div>

                <div className="card-acciones">
                  <button
                    onClick={() => abrirModal(producto)}
                    className="btn-editar"
                    title="Editar producto"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(producto.id)}
                    className="btn-eliminar"
                    title="Eliminar producto"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Crear/Editar - MEJORADO */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-header">
              {productoEditando ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Código *{' '}
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                        (máx. 50)
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength="50"
                      value={formData.codigo}
                      onChange={(e) =>
                        setFormData({ ...formData, codigo: e.target.value })
                      }
                      className="form-input"
                      placeholder="PROD-001"
                    />
                    {formData.codigo.length > 40 && (
                      <span
                        className={`char-counter ${
                          formData.codigo.length > 45 ? 'warning' : ''
                        }`}
                      >
                        {formData.codigo.length}/50
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Unidad de Medida *</label>
                    <select
                      required
                      value={formData.unidad_medida}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          unidad_medida: e.target.value,
                        })
                      }
                      className="form-input"
                    >
                      <option value="unidad">Unidad</option>
                      <option value="caja">Caja</option>
                      <option value="paquete">Paquete</option>
                      <option value="kg">Kilogramo (kg)</option>
                      <option value="g">Gramo (g)</option>
                      <option value="l">Litro (L)</option>
                      <option value="ml">Mililitro (mL)</option>
                      <option value="m">Metro (m)</option>
                      <option value="cm">Centímetro (cm)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Nombre del Producto *{' '}
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                      (máx. 255)
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="255"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    placeholder="Ej: Laptop Dell XPS 15"
                    className="form-input"
                  />
                  {formData.nombre.length > 200 && (
                    <span
                      className={`char-counter ${
                        formData.nombre.length > 240 ? 'warning' : ''
                      }`}
                    >
                      {formData.nombre.length}/255
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>Categoría (Cuenta Contable)</label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        categoria_id: parseInt(e.target.value) || '',
                      })
                    }
                    className="form-input"
                  >
                    <option value="">Seleccione una categoría</option>
                    {categoriasUnicas.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.codigo} - {cat.nombre} ({cat.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Descripción{' '}
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                      (opcional)
                    </span>
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    className="form-input"
                    rows="3"
                    placeholder="Descripción del producto..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Cantidad Actual *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.cantidad}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cantidad: parseInt(e.target.value) || 0,
                        })
                      }
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Stock Mínimo *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.min_stock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_stock: parseInt(e.target.value) || 0,
                        })
                      }
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Precio Compra *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.precio_compra}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          precio_compra: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Precio Venta *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.precio_venta}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          precio_venta: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Ubicación{' '}
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                      (máx. 100)
                    </span>
                  </label>
                  <input
                    type="text"
                    maxLength="100"
                    value={formData.ubicacion}
                    onChange={(e) =>
                      setFormData({ ...formData, ubicacion: e.target.value })
                    }
                    className="form-input"
                    placeholder="Ej: Almacén A, Estante 3"
                  />
                  {formData.ubicacion?.length > 80 && (
                    <span
                      className={`char-counter ${
                        formData.ubicacion.length > 90 ? 'warning' : ''
                      }`}
                    >
                      {formData.ubicacion.length}/100
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Notas{' '}
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                      (opcional)
                    </span>
                  </label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) =>
                      setFormData({ ...formData, notas: e.target.value })
                    }
                    className="form-input"
                    rows="2"
                    placeholder="Notas adicionales..."
                  />
                </div>

                {formData.precio_compra > 0 && formData.precio_venta > 0 && (
                  <div
                    style={{
                      background:
                        'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      border: '2px solid #86efac',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: '600', color: '#166534' }}>
                      💰 Margen de Ganancia:
                    </span>
                    <span
                      style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: margenGanancia >= 0 ? '#15803d' : '#dc2626',
                      }}
                    >
                      ${margenGanancia.toFixed(2)} (
                      {porcentajeGanancia.toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="btn-cancelar"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  {productoEditando ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
