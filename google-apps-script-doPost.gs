/**
 * Вставьте в редактор Apps Script (привязанный к таблице) и заново разверните веб-приложение.
 * Сайт шлёт POST с телом: application/x-www-form-urlencoded, поле payload = JSON.
 */
function doPost(e) {
  try {
    var raw = extractPayload_(e);
    var data = JSON.parse(raw || '{}');

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var ts = data.ts || new Date().toISOString();
    var name = data.guestName || '';
    var song = data.song || '';
    if (!name && data.fields && typeof data.fields === 'object') {
      name = String(data.fields['Имя и фамилия'] || '');
      song = String(data.fields['Песня'] || '');
    }

    sheet.appendRow([ts, data.formId || '', name, song]);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err.message);
  }
}

/** payload из e.parameter или из сырого тела POST (на случай отличий окружения). */
function extractPayload_(e) {
  if (e.parameter && e.parameter.payload) {
    return e.parameter.payload;
  }
  if (e.postData && e.postData.type === 'application/x-www-form-urlencoded' && e.postData.contents) {
    var body = e.postData.contents;
    var match = body.match(/(?:^|&)payload=([^&]*)/);
    if (match) {
      return decodeURIComponent(match[1].replace(/\+/g, ' '));
    }
  }
  return '';
}
