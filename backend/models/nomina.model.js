// models/nomina.model.js
// Modelo principal para gestión y cálculo de nóminas
import { supabase } from '../config/supabase.js';
import calculoService from '../services/calculoNomina.service.js';

export default {
  /**
   * Listar nóminas con filtros
   */
  async listarNominas(filtros = {}) {
    try {
      let query = supabase
        .from('nominas')
        .select(
          `
          id,
          codigo,
          periodo_inicio,
          periodo_fin,
          tipo_periodo,
          numero_periodo,
          anio,
          mes,
          descripcion,
          tipo,
          total_empleados,
          total_percepciones,
          total_deducciones,
          total_neto,
          estado,
          fecha_calculo,
          fecha_aprobacion,
          fecha_pago,
          departamento:categorias!nominas_departamento_id_fkey(id, nombre),
          creado_en
        `,
          { count: 'exact' },
        )
        .eq('eliminado', false)
        .order('periodo_inicio', { ascending: false });

      // Filtros
      if (filtros.estado) query = query.eq('estado', filtros.estado);
      if (filtros.tipo_periodo)
        query = query.eq('tipo_periodo', filtros.tipo_periodo);
      if (filtros.departamento_id)
        query = query.eq('departamento_id', filtros.departamento_id);
      if (filtros.anio) query = query.eq('anio', filtros.anio);
      if (filtros.mes) query = query.eq('mes', filtros.mes);

      // Paginación
      const page = parseInt(filtros.page) || 1;
      const limit = parseInt(filtros.limit) || 20;
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return { data, count };
    } catch (error) {
      console.error('❌ Error listando nóminas:', error);
      throw error;
    }
  },

  /**
   * Obtener nómina completa por ID
   */
  async obtenerNominaPorId(id) {
    try {
      const { data, error } = await supabase
        .from('nominas')
        .select(
          `
          *,
          departamento:categorias!nominas_departamento_id_fkey(id, codigo, nombre),
          detalle:detalle_nomina(
            *,
            empleado:empleados(id, codigo, nombre_completo)
          )
        `,
        )
        .eq('id', id)
        .eq('eliminado', false)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo nómina:', error);
      throw error;
    }
  },

  /**
   * Obtener detalle con movimientos
   */
  async obtenerDetalleConMovimientos(nominaId) {
    try {
      const { data, error } = await supabase
        .from('detalle_nomina')
        .select(
          `
          *,
          empleado:empleados(id, codigo, nombre_completo, cedula, puesto),
          movimientos:movimientos_nomina(*)
        `,
        )
        .eq('nomina_id', nominaId)
        .order('empleado_nombre', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo detalle:', error);
      throw error;
    }
  },

  /**
   * Crear nómina (solo cabecera)
   */
  async crearNomina(datos, userId) {
    try {
      // Generar código automático
      const periodo = new Date(datos.periodo_inicio);
      const anio = periodo.getFullYear();
      const mes = periodo.getMonth() + 1;

      const { count } = await supabase
        .from('nominas')
        .select('*', { count: 'exact', head: true })
        .eq('anio', anio)
        .eq('mes', mes);

      const codigo = `NOM-${anio}${String(mes).padStart(2, '0')}-${String(count + 1).padStart(3, '0')}`;

      const { data, error } = await supabase
        .from('nominas')
        .insert([
          {
            codigo,
            periodo_inicio: datos.periodo_inicio,
            periodo_fin: datos.periodo_fin,
            tipo_periodo: datos.tipo_periodo,
            numero_periodo: datos.numero_periodo || null,
            anio,
            mes,
            descripcion: datos.descripcion || null,
            departamento_id: datos.departamento_id || null,
            tipo: datos.tipo || 'ordinaria',
            estado: 'borrador',
            creado_por: userId,
            actualizado_por: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error creando nómina:', error);
      throw error;
    }
  },

  /**
   * Calcular nómina completa
   */
  async calcularNomina(nominaId, empleadosData, userId) {
    try {
      console.log(`🧮 Calculando nómina ${nominaId}...`);

      // Verificar estado
      const { data: nomina } = await supabase
        .from('nominas')
        .select('estado, periodo_inicio, periodo_fin, tipo_periodo')
        .eq('id', nominaId)
        .single();

      if (nomina.estado !== 'borrador') {
        throw new Error('Solo se pueden calcular nóminas en estado borrador');
      }

      // Obtener conceptos fijos
      const { data: conceptosFijos } = await supabase
        .from('conceptos_nomina')
        .select('*')
        .eq('eliminado', false)
        .eq('activo', true)
        .eq('es_fijo', true)
        .order('orden_calculo', { ascending: true });

      const detallesNomina = [];
      const movimientosNomina = [];

      // Calcular para cada empleado
      for (const empData of empleadosData) {
        const resultado = await calculoService.calcularNominaEmpleado(
          empData,
          conceptosFijos,
          nomina,
        );

        // Preparar detalle
        detallesNomina.push({
          nomina_id: nominaId,
          empleado_id: empData.empleado_id,
          empleado_codigo: empData.codigo,
          empleado_nombre: empData.nombre_completo,
          empleado_cedula: empData.cedula,
          departamento: empData.departamento?.nombre || null,
          puesto: empData.puesto,
          salario_base: empData.salario_base,
          periodo_pago: empData.periodo_pago || nomina.tipo_periodo,
          dias_periodo: resultado.dias_periodo,
          dias_trabajados: empData.dias_trabajados || resultado.dias_periodo,
          dias_ausencias: empData.dias_ausencias || 0,
          horas_extras: empData.horas_extras || 0,
          total_percepciones: resultado.total_percepciones,
          total_deducciones: resultado.total_deducciones,
          salario_neto: resultado.salario_neto,
          afp_patronal: resultado.afp_patronal,
          sfs_patronal: resultado.sfs_patronal,
          srl: resultado.srl,
          infotep: resultado.infotep,
          costo_total_empresa: resultado.costo_total_empresa,
          estado: 'calculado',
        });

        // Guardar movimientos para insertar después
        movimientosNomina.push(resultado.movimientos);
      }

      // Insertar detalles
      const { data: detallesInsertados, error: errorDetalle } = await supabase
        .from('detalle_nomina')
        .insert(detallesNomina)
        .select();

      if (errorDetalle) throw errorDetalle;

      // Insertar movimientos asociados a cada detalle
      const movimientosConDetalle = [];
      for (let i = 0; i < detallesInsertados.length; i++) {
        const detalle = detallesInsertados[i];
        const movimientos = movimientosNomina[i];

        movimientos.forEach((mov) => {
          movimientosConDetalle.push({
            detalle_nomina_id: detalle.id,
            ...mov,
            creado_por: userId,
          });
        });
      }

      if (movimientosConDetalle.length > 0) {
        const { error: errorMov } = await supabase
          .from('movimientos_nomina')
          .insert(movimientosConDetalle);

        if (errorMov) throw errorMov;
      }

      // Actualizar estado de nómina
      await supabase
        .from('nominas')
        .update({
          estado: 'calculada',
          fecha_calculo: new Date().toISOString(),
          calculado_por: userId,
          actualizado_por: userId,
        })
        .eq('id', nominaId);

      console.log('✅ Nómina calculada exitosamente');

      return await this.obtenerNominaPorId(nominaId);
    } catch (error) {
      console.error('❌ Error calculando nómina:', error);
      throw error;
    }
  },

  /**
   * Aprobar nómina
   */
  async aprobarNomina(nominaId, userId) {
    try {
      const { data, error } = await supabase
        .from('nominas')
        .update({
          estado: 'aprobada',
          fecha_aprobacion: new Date().toISOString(),
          aprobado_por: userId,
          actualizado_por: userId,
        })
        .eq('id', nominaId)
        .eq('estado', 'calculada')
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Solo se pueden aprobar nóminas calculadas');

      // Actualizar detalles
      await supabase
        .from('detalle_nomina')
        .update({ estado: 'aprobado' })
        .eq('nomina_id', nominaId);

      return data;
    } catch (error) {
      console.error('❌ Error aprobando nómina:', error);
      throw error;
    }
  },

  /**
   * Marcar como pagada
   */
  async marcarComoPagada(nominaId, userId) {
    try {
      const { data, error } = await supabase
        .from('nominas')
        .update({
          estado: 'pagada',
          fecha_pago: new Date().toISOString(),
          pagado_por: userId,
          actualizado_por: userId,
        })
        .eq('id', nominaId)
        .eq('estado', 'aprobada')
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Solo se pueden pagar nóminas aprobadas');

      // Actualizar detalles
      await supabase
        .from('detalle_nomina')
        .update({
          estado: 'pagado',
          fecha_pago: new Date().toISOString(),
        })
        .eq('nomina_id', nominaId);

      return data;
    } catch (error) {
      console.error('❌ Error marcando como pagada:', error);
      throw error;
    }
  },

  /**
   * Eliminar nómina (solo si está en borrador)
   */
  async eliminarNomina(nominaId, userId) {
    try {
      const { data: nomina } = await supabase
        .from('nominas')
        .select('estado')
        .eq('id', nominaId)
        .single();

      if (nomina.estado !== 'borrador') {
        throw new Error('Solo se pueden eliminar nóminas en borrador');
      }

      const { error } = await supabase
        .from('nominas')
        .update({
          eliminado: true,
          eliminado_en: new Date(),
          eliminado_por: userId,
        })
        .eq('id', nominaId);

      if (error) throw error;

      return { message: 'Nómina eliminada exitosamente' };
    } catch (error) {
      console.error('❌ Error eliminando nómina:', error);
      throw error;
    }
  },

  /**
   * Recalcular nómina (elimina detalle y vuelve a calcular)
   */
  async recalcularNomina(nominaId, empleadosData, userId) {
    try {
      // Eliminar detalle existente
      await supabase.from('detalle_nomina').delete().eq('nomina_id', nominaId);

      // Volver a estado borrador
      await supabase
        .from('nominas')
        .update({ estado: 'borrador' })
        .eq('id', nominaId);

      // Calcular de nuevo
      return await this.calcularNomina(nominaId, empleadosData, userId);
    } catch (error) {
      console.error('❌ Error recalculando nómina:', error);
      throw error;
    }
  },
};
