// models/prestamo.model.js
import { supabase } from '../config/supabase.js';

export default {
  async listarPrestamos(filtros = {}) {
    try {
      let query = supabase
        .from('prestamos_empleados')
        .select(
          `
          *,
          empleado:empleados(id, codigo, nombre_completo, puesto)
        `,
          { count: 'exact' },
        )
        .eq('eliminado', false)
        .order('fecha_otorgamiento', { ascending: false });

      if (filtros.empleado_id)
        query = query.eq('empleado_id', filtros.empleado_id);
      if (filtros.estado) query = query.eq('estado', filtros.estado);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('❌ Error listando préstamos:', error);
      throw error;
    }
  },

  async crearPrestamo(datos, userId) {
    try {
      // Generar código
      const { count } = await supabase
        .from('prestamos_empleados')
        .select('*', { count: 'exact', head: true });
      const codigo = `PREST-${String(count + 1).padStart(4, '0')}`;

      const montoCuota = datos.monto_total / datos.numero_cuotas;

      const { data, error } = await supabase
        .from('prestamos_empleados')
        .insert([
          {
            codigo,
            empleado_id: datos.empleado_id,
            tipo: datos.tipo || 'personal',
            monto_total: datos.monto_total,
            numero_cuotas: datos.numero_cuotas,
            monto_cuota: this.redondear(montoCuota),
            tasa_interes: datos.tasa_interes || 0,
            saldo_pendiente: datos.monto_total,
            fecha_otorgamiento:
              datos.fecha_otorgamiento ||
              new Date().toISOString().split('T')[0],
            fecha_primer_descuento: datos.fecha_primer_descuento,
            motivo: datos.motivo || null,
            estado: datos.requiere_aprobacion
              ? 'pendiente_aprobacion'
              : 'activo',
            requiere_aprobacion: datos.requiere_aprobacion || true,
            creado_por: userId,
            actualizado_por: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Generar cuotas
      await this.generarCuotas(data.id, data);

      return data;
    } catch (error) {
      console.error('❌ Error creando préstamo:', error);
      throw error;
    }
  },

  async generarCuotas(prestamoId, prestamo) {
    try {
      const cuotas = [];
      let saldoRestante = prestamo.monto_total;
      let fechaProgramada = new Date(prestamo.fecha_primer_descuento);

      for (let i = 1; i <= prestamo.numero_cuotas; i++) {
        const montoCapital = prestamo.monto_cuota;
        saldoRestante -= montoCapital;

        cuotas.push({
          prestamo_id: prestamoId,
          numero_cuota: i,
          monto_cuota: prestamo.monto_cuota,
          monto_capital: montoCapital,
          monto_interes: 0,
          saldo_restante: this.redondear(Math.max(0, saldoRestante)),
          fecha_programada: fechaProgramada.toISOString().split('T')[0],
          estado: 'pendiente',
        });

        // Siguiente quincena
        fechaProgramada.setDate(fechaProgramada.getDate() + 15);
      }

      const { error } = await supabase.from('cuotas_prestamo').insert(cuotas);
      if (error) throw error;
    } catch (error) {
      console.error('❌ Error generando cuotas:', error);
      throw error;
    }
  },

  async aprobarPrestamo(id, userId) {
    try {
      const { data, error } = await supabase
        .from('prestamos_empleados')
        .update({
          estado: 'activo',
          aprobado_por: userId,
          fecha_aprobacion: new Date().toISOString(),
          actualizado_por: userId,
        })
        .eq('id', id)
        .eq('estado', 'pendiente_aprobacion')
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error aprobando préstamo:', error);
      throw error;
    }
  },

  redondear(valor) {
    return Math.round(valor * 100) / 100;
  },
};
