// seedDataCorrected.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seedTestData() {
  try {
    const userId = 'a3fb4d9c-c064-42f5-b271-9ae88cdee0c6';
    console.log('🌱 Creando datos de prueba...');

    // 1. Primero crear categorías contables necesarias
    const { data: categorias, error: catError } = await supabase
      .from('cuentas_contables')
      .insert([
        {
          codigo: '101',
          nombre: 'Inventario de Mercancías',
          tipo: 'activo',
          descripcion: 'Cuenta de inventario principal',
        },
        {
          codigo: '401',
          nombre: 'Ventas',
          tipo: 'ingreso',
          descripcion: 'Ingresos por ventas',
        },
        {
          codigo: '501',
          nombre: 'Costos de Ventas',
          tipo: 'costo',
          descripcion: 'Costos asociados a ventas',
        },
      ])
      .select('id');

    if (catError) {
      console.error('❌ Error en categorías:', catError);
    } else {
      console.log('✅ Categorías contables creadas');
    }

    // 2. Crear proveedor
    const { data: proveedores, error: provError } = await supabase
      .from('proveedores')
      .insert([
        {
          nombre: 'TecnoSuministros RD',
          rnc: '131123456',
          telefono: '809-555-0101',
          email: 'ventas@tecnosuministros.com',
        },
      ])
      .select('id');

    if (provError) {
      console.error('❌ Error en proveedores:', provError);
    } else {
      console.log('✅ Proveedor creado');
    }

    // 3. Crear cliente
    const { data: clientes, error: cliError } = await supabase
      .from('clientes')
      .insert([
        {
          nombre: 'Juan Pérez',
          cedula: '00112345678',
          telefono: '809-555-0123',
          email: 'juan@example.com',
        },
      ])
      .select('id');

    if (cliError) {
      console.error('❌ Error en clientes:', cliError);
    } else {
      console.log('✅ Cliente creado');
    }

    // 4. Crear productos en inventario (usando la estructura correcta)
    const inventarioData = [
      {
        codigo: 'LAP-001',
        nombre: 'Laptop HP EliteBook',
        descripcion: 'Laptop empresarial i7, 16GB RAM, 512GB SSD',
        categoria_id: categorias[0].id,
        unidad_medida: 'unidad',
        cantidad: 15,
        precio_compra: 900,
        precio_venta: 1200,
        min_stock: 3,
        proveedor_id: proveedores[0].id,
        ubicacion: 'Estante A-1',
        activo: true,
        creado_por: userId,
      },
      {
        codigo: 'MOU-001',
        nombre: 'Mouse Inalámbrico',
        descripcion: 'Mouse ergonómico inalámbrico',
        categoria_id: categorias[0].id,
        unidad_medida: 'unidad',
        cantidad: 50,
        precio_compra: 15,
        precio_venta: 25,
        min_stock: 10,
        proveedor_id: proveedores[0].id,
        ubicacion: 'Estante B-2',
        activo: true,
        creado_por: userId,
      },
      {
        codigo: 'TEC-001',
        nombre: 'Teclado Mecánico',
        descripcion: 'Teclado mecánico RGB',
        categoria_id: categorias[0].id,
        unidad_medida: 'unidad',
        cantidad: 30,
        precio_compra: 50,
        precio_venta: 80,
        min_stock: 5,
        proveedor_id: proveedores[0].id,
        ubicacion: 'Estante B-3',
        activo: true,
        creado_por: userId,
      },
    ];

    const { data: productos, error: invError } = await supabase
      .from('inventario')
      .insert(inventarioData)
      .select('id');

    if (invError) {
      console.error('❌ Error en inventario:', invError);
    } else {
      console.log('✅ Productos de inventario creados');
    }

    // 5. Crear movimientos de inventario
    if (productos) {
      const { error: movError } = await supabase
        .from('movimientos_inventario')
        .insert([
          {
            producto_id: productos[0].id,
            tipo: 'entrada',
            cantidad: 15,
            precio_unitario: 900,
            motivo: 'Compra inicial',
            usuario_id: userId,
          },
          {
            producto_id: productos[1].id,
            tipo: 'entrada',
            cantidad: 50,
            precio_unitario: 15,
            motivo: 'Compra mayorista',
            usuario_id: userId,
          },
        ]);

      if (movError) {
        console.error('❌ Error en movimientos:', movError);
      } else {
        console.log('✅ Movimientos de inventario creados');
      }
    }

    // 6. Crear movimientos contables (usando la estructura correcta)
    const { error: contError } = await supabase
      .from('movimientos_contables')
      .insert([
        {
          cuenta_id: categorias[1].id, // Ventas
          origen_tabla: 'ventas',
          origen_id: 1,
          descripcion: 'Venta de laptops',
          haber: 3600, // Monto de la venta
          creado_por: userId,
        },
        {
          cuenta_id: categorias[2].id, // Costos de ventas
          origen_tabla: 'ventas',
          origen_id: 1,
          descripcion: 'Costo de laptops vendidas',
          debe: 13500, // 15 laptops * $900
          creado_por: userId,
        },
      ]);

    if (contError) {
      console.error('❌ Error en movimientos contables:', contError);
    } else {
      console.log('✅ Movimientos contables creados');
    }

    console.log('🎉 ¡Datos de prueba creados exitosamente!');
    console.log('🔄 Recarga el dashboard para ver los datos');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

seedTestData();
