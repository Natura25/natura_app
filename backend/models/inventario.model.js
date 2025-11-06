// models/inventario.model.js
import { supabase } from '../config/supabase.js';

export default {
  async listarProductos(filtros = {}) {
    try {
      let query = supabase
        .from('inventario')
        .select(
          `
          *,
          categoria:cuentas_contables!categoria_id(id, codigo, nombre, tipo),
          proveedor:proveedores(id, nombre),
          creador:usuarios!creado_por(username),
          actualizador:usuarios!actualizado_por(username)
        `,
          { count: 'exact' }
        )
        .eq('activo', true)
        .order('creado_en', { ascending: false });

      // Filtros
      if (filtros.busqueda) {
        query = query.or(
          `nombre.ilike.%${filtros.busqueda}%,codigo.ilike.%${filtros.busqueda}%`
        );
      }

      if (filtros.categoria_id) {
        query = query.eq('categoria_id', filtros.categoria_id);
      }

      if (filtros.proveedor_id) {
        query = query.eq('proveedor_id', filtros.proveedor_id);
      }

      // Paginación
      const page = parseInt(filtros.page) || 1;
      const limit = parseInt(filtros.limit) || 50;
      const offset = (page - 1) * limit;

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return { data, count };
    } catch (error) {
      console.error('❌ Error listando productos:', error);
      throw error;
    }
  },

  async obtenerProductoPorId(id) {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select(
          `
          *,
          categoria:cuentas_contables!categoria_id(id, codigo, nombre, tipo),
          proveedor:proveedores(id, nombre, contacto, telefono),
          creador:usuarios!creado_por(username, email),
          actualizador:usuarios!actualizado_por(username, email)
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo producto:', error);
      throw error;
    }
  },

  async crearProducto(datos) {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .insert([
          {
            codigo: datos.codigo,
            nombre: datos.nombre,
            descripcion: datos.descripcion || null,
            categoria_id: datos.categoria_id || null,
            unidad_medida: datos.unidad_medida || 'unidad',
            cantidad: datos.cantidad || 0,
            min_stock: datos.min_stock || 0,
            precio_compra: datos.precio_compra || 0,
            precio_venta: datos.precio_venta || 0,
            proveedor_id: datos.proveedor_id || null,
            ubicacion: datos.ubicacion || null,
            notas: datos.notas || null,
            activo: true,
            creado_por: datos.creado_por,
            actualizado_por: datos.actualizado_por,
          },
        ])
        .select(
          `
          *,
          categoria:cuentas_contables!categoria_id(id, codigo, nombre, tipo),
          proveedor:proveedores(id, nombre)
        `
        )
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error creando producto:', error);
      throw error;
    }
  },

  async actualizarProducto(id, datos) {
    try {
      const updateData = {
        actualizado_por: datos.actualizado_por,
        actualizado_en: new Date(),
      };

      // Solo actualizar campos que vengan en datos
      if (datos.codigo !== undefined) updateData.codigo = datos.codigo;
      if (datos.nombre !== undefined) updateData.nombre = datos.nombre;
      if (datos.descripcion !== undefined)
        updateData.descripcion = datos.descripcion;
      if (datos.categoria_id !== undefined)
        updateData.categoria_id = datos.categoria_id;
      if (datos.unidad_medida !== undefined)
        updateData.unidad_medida = datos.unidad_medida;
      if (datos.cantidad !== undefined) updateData.cantidad = datos.cantidad;
      if (datos.min_stock !== undefined) updateData.min_stock = datos.min_stock;
      if (datos.precio_compra !== undefined)
        updateData.precio_compra = datos.precio_compra;
      if (datos.precio_venta !== undefined)
        updateData.precio_venta = datos.precio_venta;
      if (datos.proveedor_id !== undefined)
        updateData.proveedor_id = datos.proveedor_id;
      if (datos.ubicacion !== undefined) updateData.ubicacion = datos.ubicacion;
      if (datos.notas !== undefined) updateData.notas = datos.notas;

      const { data, error } = await supabase
        .from('inventario')
        .update(updateData)
        .eq('id', id)
        .select(
          `
          *,
          categoria:cuentas_contables!categoria_id(id, codigo, nombre, tipo),
          proveedor:proveedores(id, nombre)
        `
        )
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
      throw error;
    }
  },

  async eliminarProducto(id) {
    try {
      // Soft delete
      const { data, error } = await supabase
        .from('inventario')
        .update({ activo: false })
        .eq('id', id);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      throw error;
    }
  },

  async actualizarStock(productoId, cantidad, tipo, datos = {}) {
    try {
      console.log('📦 Actualizando stock:', { productoId, cantidad, tipo });

      // 1. Obtener producto actual
      const { data: producto, error: fetchError } = await supabase
        .from('inventario')
        .select('cantidad, precio_compra, codigo, nombre')
        .eq('id', productoId)
        .single();

      if (fetchError) throw fetchError;

      if (!producto) {
        throw new Error(`Producto ${productoId} no encontrado`);
      }

      // 2. Calcular nueva cantidad
      const nuevaCantidad = producto.cantidad + cantidad;

      if (nuevaCantidad < 0) {
        throw new Error(
          `Stock insuficiente para ${producto.nombre}. ` +
            `Disponible: ${producto.cantidad}, Solicitado: ${Math.abs(
              cantidad
            )}`
        );
      }

      // 3. Actualizar cantidad en inventario
      const { data: productoActualizado, error: updateError } = await supabase
        .from('inventario')
        .update({
          cantidad: nuevaCantidad,
          actualizado_en: new Date().toISOString(),
          actualizado_por: datos.usuario_id || null,
        })
        .eq('id', productoId)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log(
        `✅ Stock actualizado: ${producto.cantidad} → ${nuevaCantidad}`
      );

      // 4. Registrar movimiento en movimientos_inventario
      const movimiento = {
        producto_id: productoId,
        tipo: tipo, // 'entrada', 'salida', 'ajuste', 'venta', 'compra'
        cantidad: Math.abs(cantidad), // Siempre positivo
        precio_unitario: datos.precio_unitario || producto.precio_compra || 0,
        referencia_id: datos.referencia_id || null,
        motivo: datos.motivo || `Movimiento de tipo: ${tipo}`,
        usuario_id: datos.usuario_id || null,
      };

      console.log('📝 Registrando movimiento:', movimiento);

      const { error: movError } = await supabase
        .from('movimientos_inventario')
        .insert([movimiento]);

      if (movError) {
        console.error('❌ Error registrando movimiento:', movError);
        // No lanzar error aquí para no bloquear la venta
        // El stock ya se actualizó correctamente
      } else {
        console.log('✅ Movimiento registrado correctamente');
      }

      return productoActualizado;
    } catch (error) {
      console.error('❌ Error actualizando stock:', error);
      throw error;
    }
  },

  async obtenerProductosStockBajo() {
    try {
      const { data, error } = await supabase.rpc(
        'obtener_productos_stock_bajo'
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo productos con stock bajo:', error);
      throw error;
    }
  },
};
