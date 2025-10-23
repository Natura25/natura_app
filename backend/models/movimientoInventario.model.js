import { supabase } from '../config/supabase.js';

export default {
  //!REGISTRO DE MOVIMIENTOS DE INVENTARIO

  async registrarMovimiento(movimiento) {
    const { data, error } = await supabase
      .from('movimientos_inventario')
      .insert([movimiento])
      .select('*, producto: producto_id (*), usuario: usuario_id (username)');

    if (error) throw new Error(error.message);
    return data[0];
  },

  //! OBTENER MOVIMIENTOS DE INVENTARIO CON FILTROS

  async obtenerMovimientos(filtros = {}) {
    let query = supabase.from('movimientos_inventario').select(
      `
        id, tipo, cantidad, motivo, creado_en,
        producto: producto_id (id, nombre, codigo),
        usuario: usuario_id (username)
      `,
      { count: 'exact' }
    );

    //! Filtros
    if (filtros.productoId) query = query.eq('producto_id', filtros.productoId);
    if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
    if (filtros.desde) query = query.gte('creado_en', filtros.desde);
    if (filtros.hasta) query = query.lte('creado_en', filtros.hasta);

    const { data, error, count } = await query.order('creado_en', {
      ascending: false,
    });
    if (error) throw new Error(error.message);
    return { data, count };
  },
};
