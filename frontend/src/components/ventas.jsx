// src/pages/Ventas.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import { ventasService } from '../services/ventasService';
import { inventarioService } from '../services/inventarioService';
import './Ventas.css';

const Ventas = () => {
  const [ventas, setVentas] = useState([]);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroFormaPago, setFiltroFormaPago] = useState('todas');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [ventaEditando, setVentaEditando] = useState(null);
  const [vistaActual, setVistaActual] = useState('lista');

  const [formData, setFormData] = useState({
    cliente_id: '',
    forma_pago: 'contado',
    descripcion: '',
    descuento: 0,
    items: [],
  });

  const [itemActual, setItemActual] = useState({
    producto_id: '',
    cantidad: 1,
    precio_unitario: 0,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    filtrarVentas();
  }, [busqueda, filtroFormaPago, ventas]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando ventas, clientes y productos...');

      const [ventasRes, clientesRes, productosRes] = await Promise.all([
        ventasService.obtenerVentas().catch((err) => {
          console.error('Error cargando ventas:', err);
          return { data: [] };
        }),
        ventasService.obtenerClientes().catch((err) => {
          console.error('Error cargando clientes:', err);
          return [];
        }),
        inventarioService.obtenerProductos().catch((err) => {
          console.error('Error cargando productos:', err);
          return { data: [] };
        }),
      ]);

      const ventasData = Array.isArray(ventasRes?.data) ? ventasRes.data : [];
      const clientesData = Array.isArray(clientesRes) ? clientesRes : [];
      const productosData = Array.isArray(productosRes?.data)
        ? productosRes.data
        : [];

      setVentas(ventasData);
      setVentasFiltradas(ventasData);
      setClientes(clientesData);
      setProductos(productosData);

      console.log(
        `✅ Cargados ${ventasData.length} ventas, ${clientesData.length} clientes, ${productosData.length} productos`
      );
    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      mostrarNotificacion('❌ Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtrarVentas = () => {
    let resultado = ventas;

    if (busqueda) {
      resultado = resultado.filter(
        (v) =>
          v.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
          v.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
          v.id?.toString().includes(busqueda)
      );
    }

    if (filtroFormaPago !== 'todas') {
      resultado = resultado.filter((v) => v.forma_pago === filtroFormaPago);
    }

    setVentasFiltradas(resultado);
  };

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

  const abrirModal = (venta = null) => {
    if (venta) {
      setVentaEditando(venta);
      setFormData({
        cliente_id: venta.cliente_id || '',
        forma_pago: venta.forma_pago || 'contado',
        descripcion: venta.descripcion || '',
        descuento: 0,
        items: venta.items || [],
      });
    } else {
      setVentaEditando(null);
      setFormData({
        cliente_id: '',
        forma_pago: 'contado',
        descripcion: '',
        descuento: 0,
        items: [],
      });
    }
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setVentaEditando(null);
    setFormData({
      cliente_id: '',
      forma_pago: 'contado',
      descripcion: '',
      descuento: 0,
      items: [],
    });
    setItemActual({
      producto_id: '',
      cantidad: 1,
      precio_unitario: 0,
    });
  };

  const agregarItem = () => {
    if (!itemActual.producto_id || itemActual.cantidad <= 0) {
      mostrarNotificacion(
        '⚠️ Selecciona un producto y cantidad válida',
        'error'
      );
      return;
    }

    const producto = productos.find((p) => p.id === itemActual.producto_id);
    if (!producto) {
      mostrarNotificacion('⚠️ Producto no encontrado', 'error');
      return;
    }

    // ✅ CORRECCIÓN: Usar stock_actual en lugar de cantidad
    if (itemActual.cantidad > producto.stock_actual) {
      mostrarNotificacion(
        `⚠️ Stock insuficiente. Disponible: ${producto.stock_actual}`,
        'error'
      );
      return;
    }

    const precio = itemActual.precio_unitario || producto.precio_venta;
    const subtotal = itemActual.cantidad * precio;

    const nuevoItem = {
      producto_id: itemActual.producto_id,
      producto_nombre: producto.nombre,
      producto_codigo: producto.codigo,
      cantidad: itemActual.cantidad,
      precio_unitario: precio,
      subtotal: subtotal,
    };

    setFormData({
      ...formData,
      items: [...formData.items, nuevoItem],
    });

    // Resetear item actual
    setItemActual({
      producto_id: '',
      cantidad: 1,
      precio_unitario: 0,
    });

    mostrarNotificacion('✅ Producto agregado', 'success');
  };

  const eliminarItem = (index) => {
    const nuevosItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: nuevosItems });
  };

  const calcularTotales = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    const descuento = parseFloat(formData.descuento) || 0;
    const monto_neto = subtotal - descuento;
    const itbis = monto_neto * 0.18; // 18% ITBIS
    const total = monto_neto + itbis;

    return { subtotal, descuento, monto_neto, itbis, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (formData.items.length === 0) {
        mostrarNotificacion('⚠️ Agrega al menos un producto', 'error');
        return;
      }

      if (!formData.cliente_id) {
        mostrarNotificacion('⚠️ Selecciona un cliente', 'error');
        return;
      }

      const totales = calcularTotales();

      // ✅ CORRECCIÓN: NO enviar usuario_id ni auth_id
      // El backend lo obtiene automáticamente del token
      const ventaData = {
        cliente_id: parseInt(formData.cliente_id),
        monto: totales.subtotal,
        descripcion: formData.descripcion || null,
        forma_pago: formData.forma_pago,
        descuento: totales.descuento,
        itbis: totales.itbis,
        items: formData.items.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal,
        })),
        // ❌ NO enviar: usuario_id, auth_id
      };

      console.log('📤 Enviando venta:', ventaData);

      if (ventaEditando) {
        await ventasService.actualizarVenta(ventaEditando.id, ventaData);
        mostrarNotificacion('✅ Venta actualizada correctamente', 'success');
      } else {
        const resultado = await ventasService.crearVenta(ventaData);
        console.log('✅ Venta creada:', resultado);
        mostrarNotificacion('✅ Venta creada correctamente', 'success');
      }

      await cargarDatos();
      cerrarModal();
    } catch (err) {
      console.error('❌ Error al guardar venta:', err);
      mostrarNotificacion(
        '❌ ' + (err.message || 'Error al guardar la venta'),
        'error'
      );
    }
  };

  const handleAnular = async (id) => {
    const motivo = prompt('Ingresa el motivo de anulación:');
    if (!motivo || motivo.trim() === '') {
      mostrarNotificacion('⚠️ Debes ingresar un motivo', 'error');
      return;
    }

    try {
      await ventasService.anularVenta(id, motivo);
      await cargarDatos();
      mostrarNotificacion('✅ Venta anulada correctamente', 'success');
    } catch (err) {
      console.error('Error al anular:', err);
      mostrarNotificacion(
        '❌ ' + (err.message || 'Error al anular la venta'),
        'error'
      );
    }
  };

  const handleEliminar = async (id) => {
    const venta = ventas.find((v) => v.id === id);
    const mensaje = venta
      ? `¿Estás seguro de eliminar la venta #${id}?\n\nEsta acción restaurará el inventario pero no se puede deshacer.`
      : '¿Estás seguro de eliminar esta venta?';

    if (!window.confirm(mensaje)) return;

    try {
      await ventasService.eliminarVenta(id);
      await cargarDatos();
      mostrarNotificacion('✅ Venta eliminada correctamente', 'success');
    } catch (err) {
      console.error('Error al eliminar:', err);
      mostrarNotificacion(
        '❌ ' + (err.message || 'Error al eliminar la venta'),
        'error'
      );
    }
  };

  const handleProductoChange = (producto_id) => {
    const producto = productos.find((p) => p.id === parseInt(producto_id));
    setItemActual({
      ...itemActual,
      producto_id: parseInt(producto_id),
      precio_unitario: producto ? producto.precio_venta : 0,
    });
  };

  const totales = calcularTotales();

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          Cargando ventas...
        </div>
      </div>
    );
  }

  return (
    <div className="ventas-container">
      {/* Header */}
      <div className="ventas-header">
        <div className="header-top">
          <div className="header-title">
            <h1>💰 Ventas</h1>
            <p>Gestión de ventas y facturación</p>
          </div>
          <button onClick={() => abrirModal()} className="btn-nuevo">
            ➕ Nueva Venta
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{ventas.length}</div>
              <div className="stat-label">Total Ventas</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💵</div>
            <div className="stat-content">
              <div className="stat-value">
                $
                {ventas
                  .reduce((sum, v) => sum + parseFloat(v.monto || 0), 0)
                  .toFixed(2)}
              </div>
              <div className="stat-label">Monto Total</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-value">
                {ventas.filter((v) => v.forma_pago === 'contado').length}
              </div>
              <div className="stat-label">Al Contado</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💳</div>
            <div className="stat-content">
              <div className="stat-value">
                {ventas.filter((v) => v.forma_pago === 'credito').length}
              </div>
              <div className="stat-label">A Crédito</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-card">
        <div className="filtros-wrapper">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="🔍 Buscar por cliente, descripción o ID..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={filtroFormaPago}
            onChange={(e) => setFiltroFormaPago(e.target.value)}
            className="select-filtro"
          >
            <option value="todas">💰 Todas las formas de pago</option>
            <option value="contado">📈 Al Contado</option>
            <option value="credito">💳 A Crédito</option>
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
          Mostrando <strong>{ventasFiltradas.length}</strong> de{' '}
          <strong>{ventas.length}</strong> ventas
        </div>
      </div>

      {/* Vista de Lista */}
      {vistaActual === 'lista' ? (
        <div className="tabla-card">
          <div className="tabla-wrapper">
            <table className="ventas-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Descripción</th>
                  <th className="text-center">Forma Pago</th>
                  <th className="text-right">Monto</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventasFiltradas.map((venta) => (
                  <tr key={venta.id}>
                    <td className="id-cell">#{venta.id}</td>
                    <td>
                      {new Date(venta.fecha_venta).toLocaleDateString('es-DO')}
                    </td>
                    <td className="cliente-cell">
                      {venta.cliente?.nombre || 'Sin cliente'}
                    </td>
                    <td className="descripcion-cell">
                      {venta.descripcion || '-'}
                    </td>
                    <td className="text-center">
                      <span className={`badge-forma-pago ${venta.forma_pago}`}>
                        {venta.forma_pago === 'contado'
                          ? '📈 Contado'
                          : '💳 Crédito'}
                      </span>
                    </td>
                    <td className="monto-cell">
                      ${parseFloat(venta.monto).toFixed(2)}
                    </td>
                    <td className="text-center">
                      <span className={`badge-estado ${venta.estado}`}>
                        {venta.estado === 'activa' ? '✅ Activa' : '❌ Anulada'}
                      </span>
                    </td>
                    <td>
                      <div className="acciones-cell">
                        <button
                          onClick={() => abrirModal(venta)}
                          className="btn-ver"
                          title="Ver detalles"
                        >
                          👁️
                        </button>
                        {venta.estado === 'activa' && (
                          <>
                            <button
                              onClick={() => handleAnular(venta.id)}
                              className="btn-anular"
                              title="Anular venta"
                            >
                              ❌
                            </button>
                            <button
                              onClick={() => handleEliminar(venta.id)}
                              className="btn-eliminar"
                              title="Eliminar venta"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {ventasFiltradas.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p className="empty-text">No se encontraron ventas</p>
            </div>
          )}
        </div>
      ) : (
        // Vista de Tarjetas
        <div className="tarjetas-grid">
          {ventasFiltradas.map((venta) => (
            <div key={venta.id} className="venta-card">
              <div className="card-header">
                <div className="card-id">Venta #{venta.id}</div>
                <span className={`badge-estado ${venta.estado}`}>
                  {venta.estado === 'activa' ? '✅' : '❌'}
                </span>
              </div>

              <div className="card-info">
                <div className="info-row">
                  <span className="info-label">Cliente:</span>
                  <span className="info-value">
                    {venta.cliente?.nombre || 'Sin cliente'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Fecha:</span>
                  <span className="info-value">
                    {new Date(venta.fecha_venta).toLocaleDateString('es-DO')}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Forma de pago:</span>
                  <span className={`badge-forma-pago ${venta.forma_pago}`}>
                    {venta.forma_pago === 'contado' ? 'Contado' : 'Crédito'}
                  </span>
                </div>
              </div>

              <div className="card-monto">
                <div className="monto-label">Monto Total</div>
                <div className="monto-value">
                  ${parseFloat(venta.monto).toFixed(2)}
                </div>
              </div>

              <div className="card-acciones">
                <button onClick={() => abrirModal(venta)} className="btn-ver">
                  👁️ Ver
                </button>
                {venta.estado === 'activa' && (
                  <>
                    <button
                      onClick={() => handleAnular(venta.id)}
                      className="btn-anular"
                    >
                      ❌ Anular
                    </button>
                    <button
                      onClick={() => handleEliminar(venta.id)}
                      className="btn-eliminar"
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Crear/Ver Venta */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div
            className="modal-content modal-venta"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-header">
              {ventaEditando
                ? `👁️ Detalles de Venta #${ventaEditando.id}`
                : '➕ Nueva Venta'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* Datos básicos */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Cliente *</label>
                    <select
                      required
                      value={formData.cliente_id}
                      onChange={(e) =>
                        setFormData({ ...formData, cliente_id: e.target.value })
                      }
                      className="form-input"
                      disabled={ventaEditando}
                    >
                      <option value="">Seleccione un cliente</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Forma de Pago *</label>
                    <select
                      required
                      value={formData.forma_pago}
                      onChange={(e) =>
                        setFormData({ ...formData, forma_pago: e.target.value })
                      }
                      className="form-input"
                      disabled={ventaEditando}
                    >
                      <option value="contado">📈 Al Contado</option>
                      <option value="credito">💳 A Crédito</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    className="form-input"
                    rows="2"
                    placeholder="Descripción de la venta..."
                    disabled={ventaEditando}
                  />
                </div>

                {/* Sección de items - solo en modo crear */}
                {!ventaEditando && (
                  <div className="items-section">
                    <h3>Productos</h3>

                    {/* Agregar item */}
                    <div className="agregar-item">
                      <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                          <label>Producto</label>
                          <select
                            value={itemActual.producto_id}
                            onChange={(e) =>
                              handleProductoChange(e.target.value)
                            }
                            className="form-input"
                          >
                            <option value="">Seleccionar producto...</option>
                            {productos.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.codigo} - {prod.nombre} (Stock:{' '}
                                {prod.stock_actual})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Cantidad</label>
                          <input
                            type="number"
                            min="1"
                            value={itemActual.cantidad}
                            onChange={(e) =>
                              setItemActual({
                                ...itemActual,
                                cantidad: parseInt(e.target.value) || 1,
                              })
                            }
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label>Precio</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={itemActual.precio_unitario}
                            onChange={(e) =>
                              setItemActual({
                                ...itemActual,
                                precio_unitario:
                                  parseFloat(e.target.value) || 0,
                              })
                            }
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label>&nbsp;</label>
                          <button
                            type="button"
                            onClick={agregarItem}
                            className="btn-agregar-item"
                          >
                            ➕ Agregar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Lista de items */}
                    {formData.items.length > 0 && (
                      <div className="items-lista">
                        <table className="items-table">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th className="text-center">Cantidad</th>
                              <th className="text-right">Precio Unit.</th>
                              <th className="text-right">Subtotal</th>
                              <th className="text-center">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.items.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  <div className="item-nombre">
                                    {item.producto_nombre}
                                  </div>
                                  <div className="item-codigo">
                                    {item.producto_codigo}
                                  </div>
                                </td>
                                <td className="text-center">{item.cantidad}</td>
                                <td className="text-right">
                                  ${item.precio_unitario.toFixed(2)}
                                </td>
                                <td className="text-right">
                                  ${item.subtotal.toFixed(2)}
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    onClick={() => eliminarItem(index)}
                                    className="btn-eliminar-item"
                                  >
                                    🗑️
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Mostrar items en modo ver */}
                {ventaEditando &&
                  ventaEditando.items &&
                  ventaEditando.items.length > 0 && (
                    <div className="items-section">
                      <h3>Productos Vendidos</h3>
                      <div className="items-lista">
                        <table className="items-table">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th className="text-center">Cantidad</th>
                              <th className="text-right">Precio Unit.</th>
                              <th className="text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ventaEditando.items.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  <div className="item-nombre">
                                    {item.producto?.nombre}
                                  </div>
                                  <div className="item-codigo">
                                    {item.producto?.codigo}
                                  </div>
                                </td>
                                <td className="text-center">{item.cantidad}</td>
                                <td className="text-right">
                                  ${parseFloat(item.precio_unitario).toFixed(2)}
                                </td>
                                <td className="text-right">
                                  ${parseFloat(item.subtotal).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* Totales - solo en modo crear */}
                {!ventaEditando && formData.items.length > 0 && (
                  <div className="totales-section">
                    <div className="totales-grid">
                      <div className="total-row">
                        <span>Subtotal:</span>
                        <span>${totales.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="total-row">
                        <span>Descuento:</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={totales.subtotal}
                          value={formData.descuento}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              descuento: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="form-input-small"
                        />
                      </div>
                      <div className="total-row">
                        <span>Monto Neto:</span>
                        <span>${totales.monto_neto.toFixed(2)}</span>
                      </div>
                      <div className="total-row">
                        <span>ITBIS (18%):</span>
                        <span>${totales.itbis.toFixed(2)}</span>
                      </div>
                      <div className="total-row total-final">
                        <span>Total a Pagar:</span>
                        <span>${totales.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="btn-cancelar"
                >
                  Cerrar
                </button>
                {!ventaEditando && (
                  <button
                    type="submit"
                    className="btn-guardar"
                    disabled={formData.items.length === 0}
                  >
                    💰 Registrar Venta
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ventas;
