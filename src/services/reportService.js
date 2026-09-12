const fs = require('fs');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const studentService = require('./studentService');

// Typography helper
function cleanText(str) {
  if (!str) return '';
  return String(str)
    .replace(/[ʻʼ`‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();
}

class ReportService {
  /**
   * Mukammal, Haqiqiy Chiziqli Jadval (Grid Table) Shaklidagi Professional PDF
   */
  async generatePDF(customData = null) {
    const reportData = customData || (await studentService.getGroupedRoomReport());

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 30,
          size: 'A4',
          bufferPages: true,
          info: {
            Title: 'Yotoqxona Talabalari Rasmiy Hisoboti',
            Author: 'Yotoqxona Boshqaruv Tizimi',
          },
        });

        // TrueType Unicode fonts
        let fontRegular = 'Helvetica';
        let fontBold = 'Helvetica-Bold';

        if (fs.existsSync('C:/Windows/Fonts/arial.ttf')) {
          fontRegular = 'C:/Windows/Fonts/arial.ttf';
        }
        if (fs.existsSync('C:/Windows/Fonts/arialbd.ttf')) {
          fontBold = 'C:/Windows/Fonts/arialbd.ttf';
        }

        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on('error', (err) => reject(err));

        const startX = 30;
        const pageWidth = doc.page.width; // 595.28
        const tableWidth = pageWidth - startX * 2; // 535.28

        // Ustunlar o'lchami va parametrlari (Jami: 535px)
        const columns = [
          { key: 'no', label: '№', width: 28, align: 'center' },
          { key: 'name', label: 'Familiyasi va Ismi', width: 145, align: 'left' },
          { key: 'father', label: 'Otasining ismi', width: 112, align: 'left' },
          { key: 'dir', label: 'Yo\'nalishi', width: 105, align: 'left' },
          { key: 'phone', label: 'Telefon raqami', width: 80, align: 'center' },
          { key: 'status', label: 'Holati', width: 65, align: 'center' },
        ];

        // 1. Asosiy Hujjat Sarlavhasi Bloki
        let currentY = 30;
        doc.rect(startX, currentY, tableWidth, 54).fillAndStroke('#f8fafc', '#0f172a');

        doc
          .font(fontBold)
          .fontSize(14)
          .fillColor('#0f172a')
          .text('YOTOQXONA TALABALARI RASMIY HISOBOTI', startX, currentY + 12, {
            align: 'center',
            width: tableWidth,
          });

        const dateStr = new Date().toLocaleDateString('uz-UZ', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        doc
          .font(fontRegular)
          .fontSize(8.5)
          .fillColor('#475569')
          .text(
            `Hujjat sanasi: ${cleanText(dateStr)}  |  Jami talabalar: ${reportData.totalStudents} ta  |  Band xonalar: ${reportData.totalRooms} ta`,
            startX,
            currentY + 34,
            { align: 'center', width: tableWidth }
          );

        currentY += 68;

        // Agar ma'lumot bo'lmasa
        if (reportData.totalStudents === 0) {
          doc
            .font(fontRegular)
            .fontSize(12)
            .fillColor('#64748b')
            .text('Hozircha hisobot yaratish uchun talabalar ro\'yxatga olinmagan.', startX, currentY + 20, {
              align: 'center',
              width: tableWidth,
            });
          doc.end();
          return;
        }

        // Helper: Jadval Sarlavhasini chizish
        const drawTableHeader = (y) => {
          const headerHeight = 22;

          // Header fonini bo'yash
          doc.rect(startX, y, tableWidth, headerHeight).fillAndStroke('#e2e8f0', '#334155');

          // Header matnlarini yozish va vertikal chiziqlar
          let colX = startX;
          columns.forEach((col, idx) => {
            // Vertikal ajratgich chizig'i
            if (idx > 0) {
              doc
                .moveTo(colX, y)
                .lineTo(colX, y + headerHeight)
                .strokeColor('#64748b')
                .lineWidth(0.8)
                .stroke();
            }

            doc
              .font(fontBold)
              .fontSize(8.5)
              .fillColor('#0f172a')
              .text(col.label, colX + 2, y + 6, {
                width: col.width - 4,
                align: col.align,
              });

            colX += col.width;
          });

          return y + headerHeight;
        };

        // 2. Xonalar bo'yicha ketma-ket jadval chizish
        for (let rIdx = 0; rIdx < reportData.rooms.length; rIdx++) {
          const room = reportData.rooms[rIdx];

          // Agar sahifada joy yetarli bo'lmasa
          if (currentY > 700) {
            doc.addPage();
            currentY = 35;
          }

          const roomFloor = Math.floor(room.roomNumber / 100) || 1;
          const insideCount = room.students.filter((s) => s.status === 'INSIDE').length;
          const outsideCount = room.students.filter((s) => s.status === 'OUTSIDE').length;

          // Xona Sarlavhasi Kartochkasi
          doc.rect(startX, currentY, tableWidth, 20).fillAndStroke('#1e293b', '#0f172a');
          doc
            .font(fontBold)
            .fontSize(9.5)
            .fillColor('#ffffff')
            .text(
              `[XONA ${room.roomNumber}] -- ${roomFloor}-qavat patogi  (Jami: ${room.studentsCount}/4 ta  |  Xonada: ${insideCount}  |  Tashqarida: ${outsideCount})`,
              startX + 8,
              currentY + 5,
              { width: tableWidth - 16 }
            );

          currentY += 20;

          // Jadval Sarlavhasini chizish
          currentY = drawTableHeader(currentY);

          // Jadval qatorlarini chizish
          const rowHeight = 19;

          for (let sIdx = 0; sIdx < room.students.length; sIdx++) {
            const st = room.students[sIdx];
            const isInside = st.status === 'INSIDE';

            // Agar qator sahifadan chiqib ketsa
            if (currentY + rowHeight > 780) {
              doc.addPage();
              currentY = 35;
              currentY = drawTableHeader(currentY);
            }

            // Qator foni (Zebra: Oq va juda och kulrang)
            const rowBg = sIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
            doc.rect(startX, currentY, tableWidth, rowHeight).fillAndStroke(rowBg, '#cbd5e1');

            // Hujayralar va matnlar
            let colX = startX;
            const rowValues = [
              { val: String(sIdx + 1), col: columns[0] },
              { val: cleanText(`${st.lastName || ''} ${st.firstName || ''}`), col: columns[1] },
              { val: cleanText(st.fatherName || ''), col: columns[2] },
              { val: cleanText(st.direction || ''), col: columns[3] },
              { val: cleanText(st.phone || ''), col: columns[4] },
              { val: isInside ? 'Yotoqxonada' : 'Chiqib ketgan', col: columns[5] },
            ];

            rowValues.forEach((item, idx) => {
              // Vertikal chiziq
              if (idx > 0) {
                doc
                  .moveTo(colX, currentY)
                  .lineTo(colX, currentY + rowHeight)
                  .strokeColor('#cbd5e1')
                  .lineWidth(0.6)
                  .stroke();
              }

              // Matn
              doc.font(idx === 1 ? fontBold : fontRegular).fontSize(8);

              if (idx === 5) {
                doc.fillColor(isInside ? '#047857' : '#b91c1c'); // Yashil / Qizil
              } else {
                doc.fillColor('#0f172a'); // Qora
              }

              doc.text(item.val, colX + 3, currentY + 5, {
                width: item.col.width - 6,
                align: item.col.align,
                lineBreak: false,
                ellipsis: true,
              });

              colX += item.col.width;
            });

            currentY += rowHeight;
          }

          currentY += 14; // Xonalar orasidagi masofa
        }

        // 3. Sahifa Raqamlari (Footer)
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          doc
            .font(fontRegular)
            .fontSize(7.5)
            .fillColor('#64748b')
            .text(
              `Yotoqxona Talabalari Boshqaruv Tizimi  --  Sahifa ${i + 1} / ${range.count}`,
              startX,
              doc.page.height - 20,
              { align: 'center', width: tableWidth }
            );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Excel (.xlsx) hisobot generatsiyasi
   */
  async generateExcel(customData = null) {
    const reportData = customData || (await studentService.getGroupedRoomReport());

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Yotoqxona Tizimi';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Talabalar ro\'yxati', {
      views: [{ state: 'frozen', ySplit: 3 }],
    });

    // 1-qator: Sarlavha
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'YOTOQXONA TALABALARI RO\'YXATI VA HARAKATI';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF000000' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 28;

    // 2-qator: Meta ma'lumot
    worksheet.mergeCells('A2:H2');
    const metaCell = worksheet.getCell('A2');
    const now = new Date().toLocaleDateString('uz-UZ');
    metaCell.value = `Sana: ${now} | Jami talabalar: ${reportData.totalStudents} ta | Jami xonalar: ${reportData.totalRooms} ta`;
    metaCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF334155' } };
    metaCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' },
    };
    metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 18;

    // 3-qator: Ustunlar sarlavhasi
    const headers = [
      '№',
      'Ismi',
      'Familiyasi',
      'Otasining ismi',
      'Yo\'nalishi',
      'Telefon raqami',
      'Xona raqami',
      'Holati',
    ];

    const headerRow = worksheet.getRow(3);
    headerRow.values = headers;
    headerRow.height = 22;

    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCBD5E1' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF475569' } },
        left: { style: 'thin', color: { argb: 'FF475569' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF475569' } },
      };
    });

    let globalIndex = 1;

    for (const room of reportData.rooms) {
      for (const st of room.students) {
        const isInside = st.status === 'INSIDE';
        const row = worksheet.addRow([
          globalIndex++,
          st.firstName,
          st.lastName,
          st.fatherName,
          st.direction,
          st.phone,
          st.roomNumber,
          isInside ? 'Yotoqxonada' : 'Chiqib ketgan',
        ]);

        row.height = 20;
        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };

          if (colNumber === 1 || colNumber === 6 || colNumber === 7 || colNumber === 8) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }

          if (colNumber === 8) {
            cell.font = {
              name: 'Calibri',
              size: 10,
              bold: true,
              color: { argb: isInside ? 'FF047857' : 'FFB91C1C' },
            };
          }
        });
      }
    }

    // Auto-fit column widths
    worksheet.columns.forEach((col) => {
      let maxLen = 12;
      col.eachCell({ includeEmpty: false }, (cell) => {
        const val = cell.value ? String(cell.value) : '';
        if (val.length > maxLen) {
          maxLen = Math.min(val.length + 4, 35);
        }
      });
      col.width = maxLen;
    });

    worksheet.getColumn(1).width = 6;
    worksheet.getColumn(6).width = 18;
    worksheet.getColumn(7).width = 14;
    worksheet.getColumn(8).width = 16;

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}

module.exports = new ReportService();
