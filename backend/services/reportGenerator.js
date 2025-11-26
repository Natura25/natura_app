import ExcelJS from 'exceljs';
import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';

// Carga de fuentes para PDF
// Es fundamental cargar las fuentes antes de crear documentos PDF.
try {
  pdfMake.vfs = pdfFonts.default || pdfFonts;
  // Se recomienda usar fuentes estándar como roboto

  // para mayor compatibilidad y consistencia.
  pdfMake.fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf',
    },
  };
} catch (error) {
  console.error(
    'Error al cargar las fuentes de pdfMake. Asegúrate de que los archivos VFS estén disponibles.',
    error
  );
}

// Paleta de colores profesional, centralizada para consistencia
const colors = {
  // Colores principales
  primary: '#2B6CB0', // Azul oscuro
  secondary: '#4299E1', // Azul medio
  accent: '#A0AEC0', // Gris azulado
  // Colores de estado
  success: '#38A169', // Verde para éxito
  warning: '#ECC94B', // Amarillo para advertencia
  danger: '#E53E3E', // Rojo para peligro
  // Colores de texto y fondo
  text: '#2D3748', // Gris oscuro para texto
  background: '#F7FAFC', // Blanco grisáceo para fondos
  border: '#E2E8F0', // Gris para bordes
};

// Estilos para PDF, centralizados para reuso
const pdfStyles = {
  header: {
    fontSize: 24,
    bold: true,
    color: colors.primary,
    alignment: 'center',
    margin: [0, 0, 0, 15],
  },
  subheader: {
    fontSize: 12,
    color: colors.text,
    alignment: 'center',
    italics: true,
    margin: [0, 0, 0, 10],
  },
  tableHeader: {
    bold: true,
    fontSize: 10,
    fillColor: colors.primary,
    color: 'white',
    alignment: 'center',
    margin: [3, 6, 3, 6],
  },
  statsBox: {
    fillColor: colors.background,
    margin: [0, 5, 0, 5],
    color: colors.text,
    alignment: 'center',
  },
  statsText: {
    fontSize: 16,
    bold: true,
    color: colors.primary,
  },
};

// --- Funciones Principales ---

/**
 * Genera un reporte de inventario en el formato especificado.
 * @param {Array} productos - Lista de productos.
 * @param {string} formato - Formato de salida ('pdf' o 'excel').
 */
export const generarReporteInventario = async (productos, formato = 'pdf') => {
  if (formato === 'pdf') {
    return await generarPDFInventario(productos);
  } else if (formato === 'excel') {
    return await generarExcelInventario(productos);
  } else {
    throw new Error('Formato no soportado');
  }
};

/**
 * Genera un reporte de movimientos en el formato especificado.
 * @param {Array} movimientos - Historial de movimientos.
 * @param {string} formato - Formato de salida ('pdf' o 'excel').
 */
export const generarReporteMovimientos = async (
  movimientos,
  formato = 'pdf'
) => {
  if (formato === 'pdf') {
    return await generarPDFMovimientos(movimientos);
  } else if (formato === 'excel') {
    return await generarExcelMovimientos(movimientos);
  } else {
    throw new Error('Formato no soportado');
  }
};

// --- Funciones Auxiliares de Lógica ---

/**
 * Calcula estadísticas clave del inventario.
 * @param {Array} productos - Lista de productos.
 * @returns {Object} - Objeto con las estadísticas.
 */
function calcularEstadisticasInventario(productos) {
  const totalProductos = productos.length;
  const stockBajo = productos.filter((p) => p.cantidad <= p.min_stock).length;
  const valorTotal = productos.reduce(
    (sum, p) => sum + p.cantidad * (p.precio_venta || 0),
    0
  );
  const sinStock = productos.filter((p) => p.cantidad === 0).length;

  return { totalProductos, stockBajo, valorTotal, sinStock };
}

// --- Funciones para Generar Reportes PDF ---

/**
 * Genera el reporte de inventario en formato PDF.
 * @param {Array} productos - Lista de productos.
 */
async function generarPDFInventario(productos) {
  const stats = calcularEstadisticasInventario(productos);

  const statsPanel = {
    columns: [
      {
        text: `Total Productos\n${stats.totalProductos}`,
        alignment: 'center',
        color: colors.text,
        style: 'statsBox',
      },
      {
        text: `Stock Bajo\n${stats.stockBajo}`,
        alignment: 'center',
        color: colors.warning,
        style: 'statsBox',
      },
      {
        text: `Sin Stock\n${stats.sinStock}`,
        alignment: 'center',
        color: colors.danger,
        style: 'statsBox',
      },
      {
        text: `Valor Total\n$${stats.valorTotal.toLocaleString()}`,
        alignment: 'center',
        color: colors.success,
        style: 'statsBox',
      },
    ],
    columnGap: 10,
    margin: [0, 10, 0, 20],
  };

  const body = [
    [
      { text: 'Código', style: 'tableHeader' },
      { text: 'Producto', style: 'tableHeader' },
      { text: 'Categoría', style: 'tableHeader' },
      { text: 'Stock Actual', style: 'tableHeader' },
      { text: 'Stock Mín.', style: 'tableHeader' },
      { text: 'P. Compra', style: 'tableHeader' },
      { text: 'P. Venta', style: 'tableHeader' },
      { text: 'Ubicación', style: 'tableHeader' },
      { text: 'Estado', style: 'tableHeader' },
    ],
  ];

  productos.forEach((p, index) => {
    const isLowStock = p.cantidad <= p.min_stock;
    const isOutOfStock = p.cantidad === 0;

    let rowFillColor = index % 2 === 0 ? colors.background : 'white';
    let estado = 'Normal';
    let estadoColor = colors.success;

    if (isOutOfStock) {
      rowFillColor = '#FDE8E8'; // Fondo rojo claro
      estado = 'Sin Stock';
      estadoColor = colors.danger;
    } else if (isLowStock) {
      rowFillColor = '#FCF8E3'; // Fondo amarillo claro
      estado = 'Stock Bajo';
      estadoColor = colors.warning;
    }

    body.push([
      { text: p.codigo, fillColor: rowFillColor, fontSize: 9 },
      { text: p.nombre, fillColor: rowFillColor, fontSize: 9 },
      {
        text: p.categoria_id || 'N/A',
        fillColor: rowFillColor,
        fontSize: 9,
      },
      {
        text: p.cantidad.toString(),
        fillColor: rowFillColor,
        alignment: 'center',
        fontSize: 9,
      },
      {
        text: p.min_stock.toString(),
        fillColor: rowFillColor,
        alignment: 'center',
        fontSize: 9,
      },
      {
        text: `$${(p.precio_compra || 0).toFixed(2)}`,
        fillColor: rowFillColor,
        alignment: 'right',
        fontSize: 9,
      },
      {
        text: `$${(p.precio_venta || 0).toFixed(2)}`,
        fillColor: rowFillColor,
        alignment: 'right',
        fontSize: 9,
      },
      { text: p.ubicacion || 'N/A', fillColor: rowFillColor, fontSize: 9 },
      {
        text: estado,
        fillColor: rowFillColor,
        alignment: 'center',
        color: estadoColor,
        bold: true,
        fontSize: 8,
      },
    ]);
  });

  const docDefinition = {
    pageSize: 'LETTER',
    pageOrientation: 'landscape',
    pageMargins: [40, 80, 40, 60],
    header: (currentPage, pageCount, pageSize) => {
      if (currentPage === 1) {
        return {
          stack: [
            { text: 'Reporte de Inventario', style: 'header' },
            {
              text: `Fecha: ${new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}`,
              style: 'subheader',
            },
          ],
          margin: [40, 40, 40, 0],
        };
      }
      return null;
    },
    content: [
      statsPanel,
      {
        table: {
          headerRows: 1,
          widths: [
            'auto',
            '*',
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
          ],
          body: body,
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => colors.border,
          vLineColor: () => colors.border,
        },
      },
    ],
    footer: (currentPage, pageCount) => ({
      columns: [
        {
          text: `Generado por Mi Empresa S.A. - ${new Date().toLocaleString()}`,
          fontSize: 8,
          color: colors.text,
          alignment: 'left',
        },
        {
          text: `Página ${currentPage} de ${pageCount}`,
          fontSize: 8,
          color: colors.text,
          alignment: 'right',
        },
      ],
      margin: [40, 10],
    }),
    styles: pdfStyles,
    defaultStyle: {
      fontSize: 9,
      font: 'Roboto',
    },
  };

  const pdfDoc = pdfMake.createPdf(docDefinition);
  return new Promise((resolve) => {
    pdfDoc.getBuffer(resolve);
  });
}

/**
 * Genera el reporte de movimientos en formato PDF.
 * @param {Array} movimientos - Historial de movimientos.
 */
async function generarPDFMovimientos(movimientos) {
  const body = [
    [
      { text: 'Fecha', style: 'tableHeader' },
      { text: 'Producto', style: 'tableHeader' },
      { text: 'Tipo', style: 'tableHeader' },
      { text: 'Cantidad', style: 'tableHeader' },
      { text: 'Motivo', style: 'tableHeader' },
      { text: 'Usuario', style: 'tableHeader' },
    ],
  ];

  movimientos.forEach((m, index) => {
    let rowFillColor = index % 2 === 0 ? colors.background : 'white';
    let tipoText = m.tipo.toUpperCase();
    let tipoColor = colors.text;

    if (m.tipo === 'entrada') {
      rowFillColor = '#E3F2E3';
      tipoText = '⬆️ ENTRADA';
      tipoColor = colors.success;
    } else if (m.tipo === 'salida') {
      rowFillColor = '#FDE8E8';
      tipoText = '⬇️ SALIDA';
      tipoColor = colors.danger;
    } else if (m.tipo === 'ajuste') {
      rowFillColor = '#FCF8E3';
      tipoText = '⚖️ AJUSTE';
      tipoColor = colors.warning;
    }

    body.push([
      {
        text: new Date(m.creado_en).toLocaleDateString('es-ES'),
        fillColor: rowFillColor,
        fontSize: 9,
      },
      { text: m.producto.nombre, fillColor: rowFillColor, fontSize: 9 },
      {
        text: tipoText,
        fillColor: rowFillColor,
        fontSize: 9,
        alignment: 'center',
        bold: true,
        color: tipoColor,
      },
      {
        text: m.cantidad.toString(),
        fillColor: rowFillColor,
        fontSize: 9,
        alignment: 'center',
      },
      { text: m.motivo || 'N/A', fillColor: rowFillColor, fontSize: 9 },
      {
        text: m.usuario.username,
        fillColor: rowFillColor,
        fontSize: 9,
        italics: true,
      },
    ]);
  });

  const docDefinition = {
    pageSize: 'LETTER',
    pageOrientation: 'landscape',
    pageMargins: [40, 80, 40, 60],
    header: (currentPage, pageCount, pageSize) => {
      if (currentPage === 1) {
        return {
          stack: [
            { text: 'Historial de Movimientos', style: 'header' },
            {
              text: `Fecha: ${new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}`,
              style: 'subheader',
            },
          ],
          margin: [40, 40, 40, 0],
        };
      }
      return null;
    },
    content: [
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', '*', 'auto'],
          body: body,
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => colors.border,
          vLineColor: () => colors.border,
        },
      },
    ],
    footer: (currentPage, pageCount) => ({
      columns: [
        {
          text: `Generado por Mi Empresa S.A. - ${new Date().toLocaleString()}`,
          fontSize: 8,
          color: colors.text,
          alignment: 'left',
        },
        {
          text: `Página ${currentPage} de ${pageCount}`,
          fontSize: 8,
          color: colors.text,
          alignment: 'right',
        },
      ],
      margin: [40, 10],
    }),
    styles: pdfStyles,
    defaultStyle: {
      fontSize: 9,
      font: 'Roboto',
    },
  };

  const pdfDoc = pdfMake.createPdf(docDefinition);
  return new Promise((resolve) => {
    pdfDoc.getBuffer(resolve);
  });
}

// --- Funciones para Generar Reportes Excel ---

/**
 * Genera el reporte de inventario en formato Excel.
 * @param {Array} productos - Lista de productos.
 */
async function generarExcelInventario(productos) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inventario', {
    views: [{ state: 'frozen', ySplit: 6 }],
  });

  const stats = calcularEstadisticasInventario(productos);

  // HEADER PRINCIPAL
  worksheet.mergeCells('A1:I2');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = '📊 REPORTE DE INVENTARIO';
  titleCell.font = {
    bold: true,
    size: 20,
    color: { argb: 'FFFFFFFF' },
    name: 'Calibri',
  };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2B6CB0' },
  };
  titleCell.alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };

  // Información de fecha y empresa
  worksheet.mergeCells('A3:I3');
  const dateCell = worksheet.getCell('A3');
  dateCell.value = `🏢 Mi Empresa S.A. | Generado: ${new Date().toLocaleString(
    'es-ES'
  )}`;
  dateCell.font = {
    italic: true,
    color: { argb: 'FF4A5568' },
    size: 11,
    name: 'Calibri',
  };
  dateCell.alignment = { horizontal: 'center' };
  dateCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEDF2F7' },
  };

  // PANEL DE ESTADÍSTICAS
  const statsRow = 5;

  // Tarjetas de estadísticas
  const cardStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'medium', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'medium', color: { argb: 'FFD1D5DB' } },
      left: { style: 'medium', color: { argb: 'FFD1D5DB' } },
      right: { style: 'medium', color: { argb: 'FFD1D5DB' } },
    },
  };

  worksheet.mergeCells(`A${statsRow}:B${statsRow}`);
  const totalCard = worksheet.getCell(`A${statsRow}`);
  totalCard.value = `📦 Total Productos: ${stats.totalProductos}`;
  totalCard.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4299E1' },
  };
  Object.assign(totalCard, cardStyle);

  worksheet.mergeCells(`C${statsRow}:D${statsRow}`);
  const lowStockCard = worksheet.getCell(`C${statsRow}`);
  lowStockCard.value = `⚠️ Stock Bajo: ${stats.stockBajo}`;
  lowStockCard.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD97706' },
  };
  Object.assign(lowStockCard, cardStyle);

  worksheet.mergeCells(`E${statsRow}:F${statsRow}`);
  const noStockCard = worksheet.getCell(`E${statsRow}`);
  noStockCard.value = `🚫 Sin Stock: ${stats.sinStock}`;
  noStockCard.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE53E3E' },
  };
  Object.assign(noStockCard, cardStyle);

  worksheet.mergeCells(`G${statsRow}:I${statsRow}`);
  const valueCard = worksheet.getCell(`G${statsRow}`);
  valueCard.value = `💰 Valor Total: $${stats.valorTotal.toLocaleString()}`;
  valueCard.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF38A169' },
  };
  Object.assign(valueCard, cardStyle);

  // ➡️ Definición de los encabezados de la tabla
  const headers = [
    { header: 'Código', key: 'codigo', width: 15 },
    { header: 'Producto', key: 'nombre', width: 35 },
    { header: 'Categoría', key: 'categoria', width: 20 },
    { header: 'Stock', key: 'cantidad', width: 12 },
    { header: 'Mínimo', key: 'min_stock', width: 12 },
    { header: 'P. Compra', key: 'precio_compra', width: 15 },
    { header: 'P. Venta', key: 'precio_venta', width: 15 },
    { header: 'Ubicación', key: 'ubicacion', width: 18 },
    { header: 'Estado', key: 'estado', width: 15 },
  ];

  worksheet.columns = headers;
  const headerRow = worksheet.getRow(7);
  headerRow.height = 25;
  headerRow.font = {
    bold: true,
    color: { argb: 'FFFFFFFF' },
    size: 10,
    name: 'Calibri',
  };

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2B6CB0' },
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1E40AF' } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'medium', color: { argb: 'FF1E40AF' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    };
  });

  // DATOS CON FORMATO
  productos.forEach((p, index) => {
    const isLowStock = p.cantidad <= p.min_stock;
    const isOutOfStock = p.cantidad === 0;

    let estado = '✅ Normal';
    let estadoColor = 'FF38A169';
    let fillColor = index % 2 === 0 ? 'FFEDF2F7' : 'FFFFFFFF';

    if (isOutOfStock) {
      estado = '🚫 Sin Stock';
      estadoColor = 'FFE53E3E';
      fillColor = 'FFFEEFEE';
    } else if (isLowStock) {
      estado = '⚠️ Stock Bajo';
      estadoColor = 'FFD97706';
      fillColor = 'FFFFFAEE';
    }

    const row = worksheet.addRow({
      codigo: p.codigo,
      nombre: p.nombre,
      categoria: p.categoria?.nombre || 'Sin Categoría',
      cantidad: p.cantidad,
      min_stock: p.min_stock,
      precio_compra: p.precio_compra || 0,
      precio_venta: p.precio_venta || 0,
      ubicacion: p.ubicacion || 'No Definida',
      estado: estado,
    });

    // Aplicar estilos a la fila
    row.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fillColor },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });

    // Color especial para la columna de estado
    const estadoCell = row.getCell('estado');
    estadoCell.font = {
      bold: true,
      color: { argb: estadoColor },
      name: 'Calibri',
      size: 10,
    };
  });

  // FORMATO DE COLUMNAS
  worksheet.getColumn('precio_compra').numFmt = '"$"#,##0.00';
  worksheet.getColumn('precio_venta').numFmt = '"$"#,##0.00';
  worksheet.getColumn('cantidad').numFmt = '#,##0';
  worksheet.getColumn('min_stock').numFmt = '#,##0';

  // Alineaciones
  ['cantidad', 'min_stock', 'estado'].forEach((col) => {
    worksheet.getColumn(col).alignment = { horizontal: 'center' };
  });

  ['precio_compra', 'precio_venta'].forEach((col) => {
    worksheet.getColumn(col).alignment = { horizontal: 'right' };
  });

  // FILTROS AUTOMÁTICOS
  worksheet.autoFilter = 'A7:I7';

  return workbook.xlsx.writeBuffer();
}

/**
 * Genera el reporte de movimientos en formato Excel.
 * @param {Array} movimientos - Historial de movimientos.
 */
async function generarExcelMovimientos(movimientos) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Movimientos', {
    views: [{ state: 'frozen', ySplit: 5 }],
  });

  // HEADER PRINCIPAL
  worksheet.mergeCells('A1:F2');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = '📈 HISTORIAL DE MOVIMIENTOS';
  titleCell.font = {
    bold: true,
    size: 20,
    color: { argb: 'FFFFFFFF' },
    name: 'Calibri',
  };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2B6CB0' },
  };
  titleCell.alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };

  // Información de fecha
  worksheet.mergeCells('A3:F3');
  const dateCell = worksheet.getCell('A3');
  dateCell.value = `🏢 Mi Empresa S.A. | Generado: ${new Date().toLocaleString(
    'es-ES'
  )}`;
  dateCell.font = {
    italic: true,
    color: { argb: 'FF4A5568' },
    name: 'Calibri',
  };
  dateCell.alignment = { horizontal: 'center' };
  dateCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEDF2F7' },
  };

  // ➡️ Definición de los encabezados de la tabla
  const headers = [
    { header: 'Fecha & Hora', key: 'fecha', width: 25 },
    { header: 'Producto', key: 'producto', width: 35 },
    { header: 'Tipo Movimiento', key: 'tipo', width: 20 },
    { header: 'Cantidad', key: 'cantidad', width: 15 },
    { header: 'Motivo/Observación', key: 'motivo', width: 30 },
    { header: 'Usuario', key: 'usuario', width: 25 },
  ];

  worksheet.columns = headers;
  const headerRow = worksheet.getRow(5);
  headerRow.height = 25;
  headerRow.font = {
    bold: true,
    color: { argb: 'FFFFFFFF' },
    size: 11,
    name: 'Calibri',
  };

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2B6CB0' },
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1E40AF' } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'medium', color: { argb: 'FF1E40AF' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    };
  });

  // DATOS
  movimientos.forEach((m, index) => {
    let tipoTexto = '';
    let tipoColor = '';
    let fillColor = index % 2 === 0 ? 'FFEDF2F7' : 'FFFFFFFF';

    switch (m.tipo) {
      case 'entrada':
        tipoTexto = '⬆️ ENTRADA';
        tipoColor = 'FF38A169';
        fillColor = 'FFEDFFF1';
        break;
      case 'salida':
        tipoTexto = '⬇️ SALIDA';
        tipoColor = 'FFE53E3E';
        fillColor = 'FFFFEDED';
        break;
      case 'ajuste':
        tipoTexto = '⚖️ AJUSTE';
        tipoColor = 'FFD97706';
        fillColor = 'FFFFF2ED';
        break;
      default:
        tipoTexto = m.tipo.toUpperCase();
        tipoColor = 'FF4A5568';
    }

    const row = worksheet.addRow({
      fecha: new Date(m.creado_en),
      producto: m.producto.nombre,
      tipo: tipoTexto,
      cantidad: m.cantidad,
      motivo: m.motivo || 'Sin especificar',
      usuario: m.usuario.username,
    });

    // Aplicar estilos a la fila
    row.eachCell((cell, colNumber) => {
      cell.font = {
        name: 'Calibri',
        size: 10,
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fillColor },
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Estilo especial para columna de tipo
      if (colNumber === 3) {
        cell.font = {
          ...cell.font,
          bold: true,
          color: { argb: tipoColor },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Estilo para cantidad
      if (colNumber === 4) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { ...cell.font, bold: true };

        if (m.tipo === 'entrada') {
          cell.font.color = { argb: 'FF38A169' };
        } else if (m.tipo === 'salida') {
          cell.font.color = { argb: 'FFE53E3E' };
        }
      }

      // Estilo especial para usuario (cursiva)
      if (colNumber === 6) {
        cell.font = {
          ...cell.font,
          italic: true,
          color: { argb: 'FF4A5568' },
        };
      }
    });
  });

  // FORMATO DE COLUMNAS
  worksheet.getColumn('fecha').numFmt = 'dd/mm/yyyy hh:mm AM/PM';
  worksheet.getColumn('fecha').alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  worksheet.getColumn('cantidad').numFmt = '#,##0';
  worksheet.getColumn('cantidad').alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  worksheet.getColumn('producto').alignment = {
    horizontal: 'left',
    vertical: 'middle',
    wrapText: true,
  };
  worksheet.getColumn('motivo').alignment = {
    horizontal: 'left',
    vertical: 'middle',
    wrapText: true,
  };
  worksheet.getColumn('usuario').alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };

  // FILTROS AUTOMÁTICOS
  worksheet.autoFilter = 'A5:F5';

  return workbook.xlsx.writeBuffer();
}
