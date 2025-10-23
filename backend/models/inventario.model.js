import { supabase } from '../config/supabase.js';

export default {
  // CRUD Básico
  async crearProducto(producto) {
    const { data, error } = await supabase
      .from('inventario')
      .insert([producto])
      .select('*, categorias: categoria_id (*), proveedores: proveedor_id (*)');

    if (error) throw new Error(error.message);
    return data[0];
  },

  async actualizarProducto(id, updates) {
    const { data, error } = await supabase
      .from('inventario')
      .update({ ...updates, actualizado_en: new Date() })
      .eq('id', id)
      .select('*, categorias: categoria_id (*), proveedores: proveedor_id (*)');

    if (error) throw new Error(error.message);
    return data[0];
  },

  async eliminarProducto(id) {
    const { error } = await supabase.from('inventario').delete().eq('id', id);

    if (error) throw new Error(error.message);
  },

  async obtenerProducto(id) {
    const { data, error } = await supabase
      .from('inventario')
      .select('*, categorias: categoria_id (*), proveedores: proveedor_id (*)')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async listarProductos(filtros = {}) {
    let query = supabase
      .from('inventario')
      .select(
        '*, categorias: categoria_id (codigo, nombre), proveedores: proveedor_id (nombre),  creado_por: creado_por (username), actualizado_por: actualizado_por (username)',
        { count: 'exact' }
      );

    // Filtros
    if (filtros.categoria) query = query.eq('categoria_id', filtros.categoria);
    if (filtros.proveedor) query = query.eq('proveedor_id', filtros.proveedor);
    if (filtros.stockBajo) query = query.lte('cantidad', 'min_stock');

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data, count };
  },

  // Control de Stock
  async actualizarStock(productoId, cantidad, tipo = 'ajuste') {
    const { data, error } = await supabase.rpc('actualizar_stock', {
      producto_id: productoId,
      delta: cantidad,
      tipo_movimiento: tipo,
    });

    if (error) throw new Error(error.message);
    return data;
  },

  async obtenerProductosStockBajo() {
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .lte('cantidad', 'min_stock');

    if (error) throw new Error(error.message);
    return data;
  },
};
