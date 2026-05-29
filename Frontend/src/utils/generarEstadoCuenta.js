import jsPDF from 'jspdf';

/**
 * Genera un PDF formal de estado de cuenta
 * @param {object} socio  - datos del socio
 * @param {object} cuenta - datos de la cuenta mensual
 */
export function generarEstadoCuenta(socio, cuenta) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const W = 210; // ancho A4
    const margen = 18;
    const colDer = W - margen;

    // ── Paleta ──────────────────────────────────────────────
    const azulOscuro  = [30,  58,  95];
    const azulMedio   = [37,  99, 235];
    const azulClaro   = [239,246,255];
    const grisTexto   = [71,  85, 105];
    const grisFondo   = [248,250,252];
    const negro       = [15,  23,  42];
    const blanco      = [255,255,255];
    
    

    let y = 0; // cursor vertical

    // ════════════════════════════════════════════════════════
    // CABECERA AZUL
    // ════════════════════════════════════════════════════════
    doc.setFillColor(...azulOscuro);
    doc.rect(0, 0, W, 42, 'F');

    // Acento decorativo derecho
    doc.setFillColor(...azulMedio);
    doc.roundedRect(W - 38, -8, 36, 36, 6, 6, 'F');

    // Nombre de la empresa
    doc.setTextColor(...blanco);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('CLUB SOCIAL', margen, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(180, 210, 255);
    doc.text('Sistema de Gestión de Socios', margen, 22);

    // Línea separadora dentro del header
    doc.setDrawColor(...azulMedio);
    doc.setLineWidth(0.3);
    doc.line(margen, 27, colDer, 27);

    // Título del documento
    doc.setTextColor(...blanco);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ESTADO DE CUENTA MENSUAL', margen, 35);

    // Número de documento (esquina derecha)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 210, 255);
    const fechaHoy = new Date();
    const nroDoc = `N° ${fechaHoy.getFullYear()}${String(fechaHoy.getMonth()+1).padStart(2,'0')}${String(fechaHoy.getDate()).padStart(2,'0')}-${(socio?.nroSocio || '001')}`;
    doc.text(nroDoc, colDer, 35, { align: 'right' });

    y = 52;

    // ════════════════════════════════════════════════════════
    // BLOQUE DE DATOS DEL SOCIO
    // ════════════════════════════════════════════════════════
    // Fondo del bloque
    doc.setFillColor(...grisFondo);
    doc.roundedRect(margen, y - 4, W - margen * 2, 38, 4, 4, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margen, y - 4, W - margen * 2, 38, 4, 4, 'S');

    // Etiqueta "DATOS DEL SOCIO"
    doc.setFillColor(...azulMedio);
    doc.roundedRect(margen, y - 4, 38, 7, 2, 2, 'F');
    doc.setTextColor(...blanco);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('DATOS DEL SOCIO', margen + 3, y + 0.5);

    y += 8;

    // Columna izquierda
    const col1 = margen + 4;
    const col2 = 115;

    const campo = (label, valor, cx, cy) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...grisTexto);
        doc.text(label, cx, cy);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...negro);
        doc.text(valor || '—', cx, cy + 5);
    };

    campo('Apellidos y Nombres',
        `${socio?.apellido || ''}, ${socio?.nombre || ''}`,
        col1, y);

    campo('N° de Socio',
        socio?.nroSocio || '—',
        col2, y);

    y += 12;

    campo('Tipo de Membresía',
        socio?.tipoSocio || 'Socio Titular',
        col1, y);

    campo('Estado',
        socio?.estado || 'Activo',
        col2, y);

    y += 12;

    campo('Período',
        cuenta?.mes || '—',
        col1, y);

    campo('Fecha de emisión',
        fechaHoy.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }),
        col2, y);

    y += 18;

    // ════════════════════════════════════════════════════════
    // TABLA DE CONCEPTOS
    // ════════════════════════════════════════════════════════
    // Título sección
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...azulOscuro);
    doc.text('DETALLE DE CUENTA', margen, y);

    doc.setDrawColor(...azulMedio);
    doc.setLineWidth(0.5);
    doc.line(margen, y + 2, margen + 52, y + 2);

    y += 8;

    // Encabezado de tabla
    const colConcepto = margen;
    const colTipo     = margen + 90;
    const colMonto    = colDer;
    const filH        = 8;

    doc.setFillColor(...azulOscuro);
    doc.rect(margen, y, W - margen * 2, filH, 'F');

    doc.setTextColor(...blanco);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('CONCEPTO', colConcepto + 3, y + 5.5);
    doc.text('TIPO', colTipo, y + 5.5);
    doc.text('IMPORTE (S/)', colMonto, y + 5.5, { align: 'right' });

    y += filH;

    // Filas
    const filas = [
        {
            concepto: 'Consumos del Mes',
            detalle:  'Cargos generados por consumo en instalaciones',
            tipo:     'Consumo',
            monto:    Number(cuenta?.consumosMes || 0),
            color:    [6, 182, 212],
        },
        {
            concepto: 'Cargos Fijos',
            detalle:  'Membresía mensual y servicios fijos',
            tipo:     'Fijo',
            monto:    Number(cuenta?.cargosFijos || 0),
            color:    [245, 158, 11],
        },
        {
            concepto: 'Pagos Realizados',
            detalle:  'Abonos registrados durante el período',
            tipo:     'Crédito',
            monto:    Number(cuenta?.pagosRealizados || 0),
            color:    [34, 197, 94],
        },
    ];

    filas.forEach((fila, i) => {
        const bg = i % 2 === 0 ? blanco : [246, 249, 255];
        doc.setFillColor(...bg);
        doc.rect(margen, y, W - margen * 2, 14, 'F');

        // Acento de color izquierdo
        doc.setFillColor(...fila.color);
        doc.rect(margen, y, 3, 14, 'F');

        // Concepto
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...negro);
        doc.text(fila.concepto, colConcepto + 6, y + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...grisTexto);
        doc.text(fila.detalle, colConcepto + 6, y + 10.5);

        // Tipo badge
        doc.setFillColor(...fila.color.map(c => Math.min(255, c + 180)));
        doc.roundedRect(colTipo, y + 3, 22, 7, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...fila.color.map(c => Math.max(0, c - 40)));
        doc.text(fila.tipo, colTipo + 11, y + 7.5, { align: 'center' });

        // Monto
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...negro);
        doc.text(`${fila.monto.toFixed(2)}`, colMonto, y + 7.5, { align: 'right' });

        // Separador
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margen, y + 14, colDer, y + 14);

        y += 14;
    });

    y += 4;

    // ════════════════════════════════════════════════════════
    // BLOQUE DE SALDO
    // ════════════════════════════════════════════════════════
    const saldo = Number(cuenta?.saldoPendiente || 0);
    

    doc.setFillColor(...azulOscuro);
    doc.roundedRect(margen, y, W - margen * 2, 20, 4, 4, 'F');

    doc.setTextColor(...blanco);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('SALDO PENDIENTE AL CIERRE', margen + 6, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 210, 255);
    doc.text(cuenta?.mes || '', margen + 6, y + 14);

    // Monto destacado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...(saldo > 0 ? [255, 180, 180] : [134, 239, 172]));
    doc.text(`S/ ${saldo.toFixed(2)}`, colDer, y + 13, { align: 'right' });

    y += 28;

    // ════════════════════════════════════════════════════════
    // NOTA INFORMATIVA
    // ════════════════════════════════════════════════════════
    doc.setFillColor(...azulClaro);
    doc.roundedRect(margen, y, W - margen * 2, 18, 3, 3, 'F');
    doc.setDrawColor(...azulMedio);
    doc.setLineWidth(0.3);
    doc.roundedRect(margen, y, W - margen * 2, 18, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...azulMedio);
    doc.text('ℹ  INFORMACIÓN IMPORTANTE', margen + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...grisTexto);
    doc.text(
        'Este documento es un comprobante informativo del estado de su cuenta. Para consultas o',
        margen + 4, y + 11
    );
    doc.text(
        'reclamos, comuníquese con administración dentro de los 5 días hábiles de recibido.',
        margen + 4, y + 15.5
    );

    y += 26;

    // ════════════════════════════════════════════════════════
    // LÍNEA DE FIRMA
    // ════════════════════════════════════════════════════════
    const firmaX = W / 2;

    doc.setDrawColor(...grisTexto);
    doc.setLineWidth(0.4);
    doc.line(firmaX - 35, y + 14, firmaX + 35, y + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...negro);
    doc.text('Administración', firmaX, y + 19, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...grisTexto);
    doc.text('Club Social — Área de Tesorería', firmaX, y + 24, { align: 'center' });

    // ════════════════════════════════════════════════════════
    // PIE DE PÁGINA
    // ════════════════════════════════════════════════════════
    const pieY = 287;

    doc.setFillColor(...azulOscuro);
    doc.rect(0, pieY - 2, W, 12, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(180, 210, 255);
    doc.text('Club Social  •  Sistema de Gestión de Socios', margen, pieY + 4);
    doc.text(
        `Documento generado el ${fechaHoy.toLocaleString('es-PE')}`,
        colDer, pieY + 4, { align: 'right' }
    );

    // ── Guardar ─────────────────────────────────────────────
    const nombreArchivo = `EstadoCuenta_${socio?.apellido || 'Socio'}_${cuenta?.mes?.replace(/ /g,'_') || 'Mes'}.pdf`;
    doc.save(nombreArchivo);
}