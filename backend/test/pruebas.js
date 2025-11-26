import ExcelJS from 'exceljs';
import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';

pdfMake.vfs = pdfFonts.default || pdfFonts;

// Configuración de fuentes estándar PDF (Helvetica es una fuente estándar en PDF)
pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
};

//! Configuración común para estilos
const styles = {
  header: {
    fontSize: 18,
    bold: true,
    margin: [0, 0, 0, 10],
    alignment: 'center',
    color: '#2c3e50',
  },
  subheader: {
    fontSize: 12,
    margin: [0, 0, 0, 10],
    alignment: 'center',
    color: '#7f8c8d',
  },
  tableHeader: {
    bold: true,
    fontSize: 10,
    fillColor: '#3498db',
    color: 'white',
    alignment: 'center',
  },
  warningRow: {
    fillColor: '#ffebee',
  },
  footer: {
    fontSize: 8,
    color: '#95a5a6',
    alignment: 'right',
    margin: [0, 10, 0, 0],
  },
};

export const generarReporteInventario = async (productos, formato = 'pdf') => {
  if (formato === 'pdf') {
    return await generarPDFInventario(productos);
  } else if (formato === 'excel') {
    return await generarExcelInventario(productos);
  } else {
    throw new Error('Formato no soportado');
  }
};

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

//! Generar PDF para reporte de inventario (MEJORADO)
async function generarPDFInventario(productos) {
  // Cabecera profesional
  const header = [
    {
      columns: [
        {
          text: 'Mi Empresa S.A.',
          fontSize: 16,
          bold: true,
          alignment: 'left',
          width: '50%',
        },
        {
          text: 'Reporte de Inventario',
          style: 'header',
          width: '50%',
        },
      ],
    },
    {
      text: `Generado: ${new Date().toLocaleString('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })}`,
      style: 'subheader',
    },
  ];

  // Cuerpo de la tabla
  const body = [
    [
      { text: 'Código', style: 'tableHeader' },
      { text: 'Nombre', style: 'tableHeader' },
      { text: 'Categoría', style: 'tableHeader' },
      { text: 'Stock', style: 'tableHeader' },
      { text: 'Mínimo', style: 'tableHeader' },
      { text: 'P. Compra', style: 'tableHeader' },
      { text: 'P. Venta', style: 'tableHeader' },
      { text: 'Ubicación', style: 'tableHeader' },
    ],
  ];

  // Construir filas con mejor formato condicional
  productos.forEach((p) => {
    const isLowStock = p.cantidad <= p.min_stock;
    const rowStyle = isLowStock ? 'warningRow' : null;

    body.push([
      { text: p.codigo, style: rowStyle, alignment: 'left' },
      { text: p.nombre, style: rowStyle, alignment: 'left' },
      {
        text: p.categoria?.nombre || 'N/A',
        style: rowStyle,
        alignment: 'left',
      },
      { text: p.cantidad, style: rowStyle, alignment: 'center' },
      { text: p.min_stock, style: rowStyle, alignment: 'center' },
      {
        text: `$${(p.precio_compra || 0).toFixed(2)}`,
        style: rowStyle,
        alignment: 'right',
      },
      {
        text: `$${(p.precio_venta || 0).toFixed(2)}`,
        style: rowStyle,
        alignment: 'right',
      },
      { text: p.ubicacion || 'N/A', style: rowStyle, alignment: 'left' },
    ]);
  });

  // Pie de página con paginación
  const footer = (currentPage, pageCount) => ({
    text: `Página ${currentPage} de ${pageCount}`,
    style: 'footer',
  });

  // Definición del documento mejorada
  const docDefinition = {
    pageSize: 'LETTER',
    pageOrientation: 'landscape',
    pageMargins: [40, 80, 40, 60],
    header: header,
    content: [
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: body,
        },
        layout: {
          fillColor: (rowIndex) => {
            if (rowIndex === 0) return '#3498db'; // Color cabecera
            return null;
          },
        },
      },
    ],
    footer: footer,
    styles: styles,
    defaultStyle: {
      fontSize: 9,
      font: 'Roboto', // Solo el nombre de la fuente como string
    },
  };

  const pdfDoc = pdfMake.createPdf(docDefinition);
  return new Promise((resolve) => {
    pdfDoc.getBuffer(resolve);
  });
}

// ... (resto del código se mantiene igual, solo asegúrate de que en generarPDFMovimientos también uses font: 'Helvetica' en defaultStyle)

//! Generar Excel para reporte de inventario (MEJORADO)
async function generarExcelInventario(productos) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inventario');

  // Título y fecha de generación
  worksheet.mergeCells('A1:H1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Reporte de Inventario';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF2C3E50' } };
  titleCell.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:H2');
  const dateCell = worksheet.getCell('A2');
  dateCell.value = `Generado: ${new Date().toLocaleString()}`;
  dateCell.font = { italic: true, color: { argb: 'FF7F8C8D' } };
  dateCell.alignment = { horizontal: 'center' };

  // Espacio entre título y tabla
  worksheet.addRow([]);

  // Encabezados de tabla con formato profesional
  const headers = [
    { header: 'Código', key: 'codigo', width: 15 },
    { header: 'Nombre', key: 'nombre', width: 30 },
    { header: 'Categoría', key: 'categoria', width: 20 },
    { header: 'Stock', key: 'cantidad', width: 10 },
    { header: 'Mínimo', key: 'min_stock', width: 10 },
    { header: 'P. Compra', key: 'precio_compra', width: 12 },
    { header: 'P. Venta', key: 'precio_venta', width: 12 },
    { header: 'Ubicación', key: 'ubicacion', width: 15 },
  ];

  worksheet.columns = headers;

  // Estilo para encabezados
  const headerRow = worksheet.getRow(4);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3498DB' },
  };
  headerRow.alignment = { horizontal: 'center' };

  // Datos
  productos.forEach((p) => {
    const row = worksheet.addRow({
      codigo: p.codigo,
      nombre: p.nombre,
      categoria: p.categoria?.nombre || 'N/A',
      cantidad: p.cantidad,
      min_stock: p.min_stock,
      precio_compra: p.precio_compra,
      precio_venta: p.precio_venta,
      ubicacion: p.ubicacion || 'N/A',
    });

    // Formato condicional para stock bajo
    if (p.cantidad <= p.min_stock) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCC' },
        };
      });
    }
  });

  // Formato de moneda con protección contra valores nulos
  worksheet.getColumn('F').numFmt = '"$"#,##0.00';
  worksheet.getColumn('G').numFmt = '"$"#,##0.00';

  // Centrar columnas numéricas
  worksheet.getColumn('D').alignment = { horizontal: 'center' };
  worksheet.getColumn('E').alignment = { horizontal: 'center' };

  // Autoajustar columnas al contenido
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      let columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength < 10 ? 10 : maxLength + 2;
  });

  // Congelar encabezados para mejor navegación
  worksheet.views = [
    {
      state: 'frozen',
      ySplit: 4, // Congelar hasta la fila 4 (encabezados)
    },
  ];

  return workbook.xlsx.writeBuffer();
}

//! Generar PDF para reporte de movimientos (MEJORADO)
async function generarPDFMovimientos(movimientos) {
  // Cabecera profesional
  const header = [
    {
      columns: [
        {
          text: 'Mi Empresa S.A.',
          fontSize: 16,
          bold: true,
          alignment: 'left',
          width: '50%',
        },
        {
          text: 'Reporte de Movimientos',
          style: 'header',
          width: '50%',
        },
      ],
    },
    {
      text: `Generado: ${new Date().toLocaleString('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })}`,
      style: 'subheader',
    },
  ];

  // Cuerpo de la tabla
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

  // Filas con formato condicional por tipo
  movimientos.forEach((m) => {
    let rowColor;
    if (m.tipo === 'entrada') rowColor = '#C6EFCE'; // Verde claro
    else if (m.tipo === 'salida') rowColor = '#FFC7CE'; // Rojo claro
    else if (m.tipo === 'ajuste') rowColor = '#FFEB9C'; // Amarillo claro

    body.push([
      { text: new Date(m.creado_en).toLocaleDateString(), fillColor: rowColor },
      { text: m.producto.nombre, fillColor: rowColor },
      { text: m.tipo, fillColor: rowColor },
      { text: m.cantidad, fillColor: rowColor },
      { text: m.motivo || 'N/A', fillColor: rowColor },
      { text: m.usuario.username, fillColor: rowColor },
    ]);
  });

  // Pie de página con paginación
  const footer = (currentPage, pageCount) => ({
    text: `Página ${currentPage} de ${pageCount}`,
    style: 'footer',
  });

  // Definición del documento mejorada
  const docDefinition = {
    pageSize: 'LETTER',
    pageOrientation: 'landscape',
    pageMargins: [40, 80, 40, 60],
    header: header,
    content: [
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', '*', 'auto'],
          body: body,
        },
      },
    ],
    footer: footer,
    styles: styles,
    defaultStyle: {
      fontSize: 9,
      font: 'Helvetica', // Solo el nombre de la fuente como string
    },
  };

  const pdfDoc = pdfMake.createPdf(docDefinition);
  return new Promise((resolve) => {
    pdfDoc.getBuffer(resolve);
  });
}

//! Generar Excel para reporte de movimientos (MEJORADO)
async function generarExcelMovimientos(movimientos) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Movimientos');

  // Título y fecha de generación
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Reporte de Movimientos';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF2C3E50' } };
  titleCell.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:F2');
  const dateCell = worksheet.getCell('A2');
  dateCell.value = `Generado: ${new Date().toLocaleString()}`;
  dateCell.font = { italic: true, color: { argb: 'FF7F8C8D' } };
  dateCell.alignment = { horizontal: 'center' };

  // Espacio entre título y tabla
  worksheet.addRow([]);

  // Encabezados
  worksheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 20 },
    { header: 'Producto', key: 'producto', width: 30 },
    { header: 'Tipo', key: 'tipo', width: 12 },
    { header: 'Cantidad', key: 'cantidad', width: 12 },
    { header: 'Motivo', key: 'motivo', width: 25 },
    { header: 'Usuario', key: 'usuario', width: 20 },
  ];

  // Estilo para encabezados
  const headerRow = worksheet.getRow(4);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3498DB' },
  };
  headerRow.alignment = { horizontal: 'center' };

  // Datos
  movimientos.forEach((m) => {
    const row = worksheet.addRow({
      fecha: new Date(m.creado_en),
      producto: m.producto.nombre,
      tipo: m.tipo,
      cantidad: m.cantidad,
      motivo: m.motivo || 'N/A',
      usuario: m.usuario.username,
    });

    // Color por tipo de movimiento
    let color;
    if (m.tipo === 'entrada') color = 'FFC6EFCE';
    else if (m.tipo === 'salida') color = 'FFFFC7CE';
    else if (m.tipo === 'ajuste') color = 'FFFFEB9C';

    if (color) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: color },
        };
      });
    }
  });

  // Formato de fecha
  worksheet.getColumn('fecha').numFmt = 'dd/mm/yyyy hh:mm AM/PM';

  // Centrar columnas
  worksheet.getColumn('tipo').alignment = { horizontal: 'center' };
  worksheet.getColumn('cantidad').alignment = { horizontal: 'center' };

  // Autoajustar columnas
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      let columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength < 10 ? 10 : maxLength + 2;
  });

  // Congelar encabezados
  worksheet.views = [
    {
      state: 'frozen',
      ySplit: 4,
    },
  ];

  return workbook.xlsx.writeBuffer();
}
