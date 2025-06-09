import { Venta } from '../models/venta.model.js';

export const getVentas = async (req, res) => {
  try {
    const ventas = await Venta.getAll();
    res.json(ventas);
  } catch (error) {
    console.error('💥 Error al obtener venta:', error);
    res.status(500).json({ error: 'Error al obtener las ventas' });
  }
};

export async function getVentaById(req, res) {
  try {
    const venta = await Venta.getById(req.params.id);
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    res.json(venta);
  } catch (error) {
    console.error('Error al obtener venta por ID:', error); // Aquí mostramos el error real
    res.status(500).json({ error: 'Error al obtener la venta' });
  }
}

export async function createVenta(req, res) {
  try {
    const nuevaVenta = await Venta.createVenta(req.body);
    res.status(201).json(nuevaVenta);
  } catch (error) {
    console.error('💥 Error real al registrar venta:', error); // 👈 ESTE LÍNEA ES CLAVE
    res.status(500).json({ error: 'Error al registrar la venta' });
  }
}
