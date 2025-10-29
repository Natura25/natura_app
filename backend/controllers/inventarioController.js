// inventario.model.js - COMPLETO CON FIX

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

  async actualizarStock(productoId, cantidad, tipo) {
    try {
      const { data: producto, error: fetchError } = await supabase
        .from('inventario')
        .select('cantidad')
        .eq('id', productoId)
        .single();

      if (fetchError) throw fetchError;

      const nuevaCantidad = producto.cantidad + cantidad;

      if (nuevaCantidad < 0) {
        throw new Error('Stock insuficiente');
      }

      const { data, error } = await supabase
        .from('inventario')
        .update({
          cantidad: nuevaCantidad,
          actualizado_en: new Date(),
        })
        .eq('id', productoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error actualizando stock:', error);
      throw error;
    }
  },

  async obtenerProductosStockBajo() {
    try {
      // Obtener todos los productos activos
      const { data, error } = await supabase
        .from('inventario')
        .select(
          `
          id,
          codigo,
          nombre,
          cantidad,
          min_stock,
          categoria:cuentas_contables!categoria_id(nombre, codigo)
        `
        )
        .eq('activo', true);

      if (error) throw error;

      // Filtrar en JavaScript los productos con stock bajo
      const productosStockBajo = data.filter(
        (producto) => producto.cantidad <= producto.min_stock
      );

      // Ordenar por cantidad ascendente
      productosStockBajo.sort((a, b) => a.cantidad - b.cantidad);

      return productosStockBajo;
    } catch (error) {
      console.error('❌ Error obteniendo productos con stock bajo:', error);
      throw error;
    }
  },
};
