import request from 'supertest';
import app from '../app.js'; // Ajusta la ruta
import { generarReporteInventario } from '../services/reporteService.js';

// Mock de datos
const mockProductos = [
  {
    codigo: 'TEST-001',
    nombre: 'Producto prueba',
    categoria: { nombre: 'Test' },
    cantidad: 5,
    min_stock: 10,
    precio_compra: 100,
    precio_venta: 150,
    ubicacion: 'Almacén A',
  },
];

describe('Reportes API', () => {
  test('Genera reporte de inventario PDF', async () => {
    const buffer = await generarReporteInventario(mockProductos, 'pdf');
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  test('Genera reporte de inventario Excel', async () => {
    const buffer = await generarReporteInventario(mockProductos, 'excel');
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  test('Descarga reporte de inventario via API', async () => {
    const response = await request(app)
      .get('/api/inventario?formato=pdf')
      .expect(200)
      .expect('Content-Type', 'application/pdf')
      .expect('Content-Disposition', /attachment; filename=inventario\.pdf/);

    expect(response.body).toBeInstanceOf(Buffer);
  });
});
