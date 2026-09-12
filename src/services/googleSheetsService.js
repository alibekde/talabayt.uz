const { google } = require('googleapis');
const config = require('../config');
const studentService = require('./studentService');
const logger = require('../utils/logger');

class GoogleSheetsService {
  getAuthClient() {
    // 1. Service Account bilan tekshirish
    if (config.google.serviceAccountEmail && config.google.privateKey) {
      return new google.auth.JWT(
        config.google.serviceAccountEmail,
        null,
        config.google.privateKey,
        ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
      );
    }

    // 2. OAuth2 Refresh Token bilan tekshirish
    if (config.google.clientId && config.google.clientSecret && config.google.refreshToken) {
      const oauth2Client = new google.auth.OAuth2(
        config.google.clientId,
        config.google.clientSecret,
        config.google.redirectUri
      );
      oauth2Client.setCredentials({
        refresh_token: config.google.refreshToken,
      });
      return oauth2Client;
    }

    return null;
  }

  /**
   * Talabalar ro'yxatini Google Sheets ga eksport qilish
   */
  async exportToGoogleSheets() {
    const auth = this.getAuthClient();
    if (!auth) {
      const err = new Error(
        'Google Sheets API konfiguratsiyasi topilmadi. Iltimos, .env faylida GOOGLE_CLIENT_ID / GOOGLE_REFRESH_TOKEN yoki GOOGLE_SERVICE_ACCOUNT ma\'lumotlarini kiriting.'
      );
      err.statusCode = 400;
      err.isCustom = true;
      throw err;
    }

    const reportData = await studentService.getGroupedRoomReport();

    if (reportData.totalStudents === 0) {
      const err = new Error('⚠️ Eksport qilish uchun hali ma\'lumot mavjud emas.');
      err.statusCode = 400;
      err.isCustom = true;
      throw err;
    }

    const sheets = google.sheets({ version: 'v4', auth });
    let spreadsheetId = config.google.spreadsheetId;

    // Agar belgilangan spreadsheetId bo'lmasa, yangi jadval yaratamiz
    if (!spreadsheetId) {
      const createRes = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `Yotoqxona Talabalari (${new Date().toLocaleDateString('uz-UZ')})`,
          },
        },
      });
      spreadsheetId = createRes.data.spreadsheetId;
      logger.info('Yangi Google Spreadsheet yaratildi:', spreadsheetId);
    }

    // Ma'lumotlar massivini shakllantirish
    const headers = [
      '№',
      'Ismi',
      'Familiyasi',
      'Otasining ismi',
      'Yo‘nalishi',
      'Telefon raqami',
      'Xona raqami',
    ];

    const rows = [headers];
    let index = 1;

    for (const room of reportData.rooms) {
      for (const st of room.students) {
        rows.push([
          index++,
          st.firstName,
          st.lastName,
          st.fatherName,
          st.direction,
          st.phone, // Text format
          st.roomNumber,
        ]);
      }
    }

    // 1. Jadvaldagi eski ma'lumotlarni tozalash
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Sheet1!A1:Z5000',
    });

    // 2. Batch orqali yangi qatorlarni yozish (Tezkor va samarali)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows,
      },
    });

    // 3. Formatlash, Filter qo'shish, Freeze 1-qator (BatchUpdate Requests)
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            // 1-qatorni freeze qilish
            {
              updateSheetProperties: {
                properties: {
                  sheetId: 0,
                  gridProperties: {
                    frozenRowCount: 1,
                  },
                },
                fields: 'gridProperties.frozenRowCount',
              },
            },
            // Header qatorini formatlash (Ko'k fon, oq matn, qalin)
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 7,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.12, green: 0.35, blue: 0.8 },
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                    horizontalAlignment: 'CENTER',
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
              },
            },
            // Ustunlar kengligini avtomatik moslash
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: 0,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: 7,
                },
              },
            },
          ],
        },
      });
    } catch (formatErr) {
      logger.warn('Google Sheets formatlashda ogohlantirish:', formatErr.message);
    }

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    return {
      spreadsheetId,
      spreadsheetUrl,
      totalStudents: reportData.totalStudents,
      totalRooms: reportData.totalRooms,
    };
  }
}

module.exports = new GoogleSheetsService();
