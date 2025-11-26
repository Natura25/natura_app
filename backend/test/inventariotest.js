// inventariotest.js
import { supabase } from '../config/supabase.js';

// Usuario que hará las acciones
const USER_ID = 'ab5c5c74-fb58-4d61-9ee7-1905796fccc8';

async function crearProducto(producto) {
  const { data, error } = await supabase
    .from('inventario')
    .insert([{ ...producto, creado_por: USER_ID }])
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  console.log('✅ Producto creado:', data);
  return data;
}

async function registrarMovimiento(movimiento) {
  const { data, error } = await supabase
    .from('movimientos_inventario')
    .insert([{ ...movimiento, usuario_id: USER_ID }])
    .select(
      `
      *,
      producto:producto_id (*),
      usuario:usuario_id(username)
    `
    )
    .single();

  if (error) throw new Error(error.message);
  console.log('✅ Movimiento registrado:', data);
  return data;
}

async function listarMovimientos() {
  const { data, error } = await supabase.from('movimientos_inventario').select(`
      *,
      producto:producto_id(id, codigo, nombre),
      usuario:usuario_id(username)
    `);

  if (error) throw new Error(error.message);
  console.log(`📦 Movimientos encontrados (${data.length}):`, data);
}

// Test principal
async function main() {
  try {
    // Crear varios productos con código único
    const productos = [
      {
        codigo: `TK-${Math.floor(Math.random() * 1000)}`,
        nombre: 'Mouse Gamer',
        cantidad: 15,
        unidad_medida: 'unidad',
        categoria_id: 1,
        min_stock: 3,
        proveedor_id: 1,
      },
      {
        codigo: `TK-${Math.floor(Math.random() * 1000)}`,
        nombre: 'Auriculares',
        cantidad: 8,
        unidad_medida: 'unidad',
        categoria_id: 1,
        min_stock: 2,
        proveedor_id: 1,
      },
      {
        codigo: `TK-${Math.floor(Math.random() * 1000)}`,
        nombre: 'Monitor 24"',
        cantidad: 5,
        unidad_medida: 'unidad',
        categoria_id: 1,
        min_stock: 1,
        proveedor_id: 1,
      },
    ];

    for (const prod of productos) {
      const creado = await crearProducto(prod);

      // Registrar un movimiento de entrada para cada producto
      await registrarMovimiento({
        producto_id: creado.id,
        tipo: 'entrada',
        cantidad: creado.cantidad,
        motivo: 'Stock inicial',
      });
    }

    // Listar todos los movimientos
    await listarMovimientos();
  } catch (err) {
    console.error('❌ Error en test:', err.message);
  }
}

main();
