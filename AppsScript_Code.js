// Google Apps Script - Attendance System Backend
// Paste this into Extensions > Apps Script in your Google Sheet

const SHEET_ID = '1sjIM5izuwx6_dlFg_DWje34InjqwCCgz2IVgo6WzBfU';

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const params = e.parameter;
  const action = params.action;

  // Support payload via GET param (base64 encoded) to avoid POST redirect issues
  function getPayload() {
    if (params.payload) {
      return JSON.parse(Utilities.newBlob(Utilities.base64Decode(params.payload)).getDataAsString());
    }
    if (e.postData && e.postData.contents) {
      return JSON.parse(e.postData.contents);
    }
    return null;
  }

  let result;
  try {
    if (action === 'getRecords') {
      result = getRecords(params.date);
    } else if (action === 'submitAttendance') {
      result = submitAttendance(getPayload());
    } else if (action === 'updateRecord') {
      result = updateRecord(getPayload());
    } else if (action === 'resetAttendance') {
      result = resetAttendance(getPayload());
    } else if (action === 'getSubmissionStatus') {
      result = getSubmissionStatus(params.date);
    } else {
      result = { error: 'Unknown action' };
    }
  } catch (err) {
    result = { error: err.message };
  }

  // Return JSON response with CORS headers for GitHub Pages
  const output = ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers to allow GitHub Pages origin
  return output;
}

// CORS preflight handler (not used directly by ContentService but documented)
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

// Get all records for a specific date
function getRecords(date) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Records');
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return { records: [] };
  
  const headers = data[0];
  const records = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowDate = formatDate(row[0]);
    
    if (!date || rowDate === date) {
      records.push({
        date: rowDate,
        tutor: row[1],
        instrument: row[2],
        classNo: row[3],
        name: row[4],
        status: row[5],
        reason: row[6] || '',
        timestamp: row[7]
      });
    }
  }
  
  return { records: records };
}

// Submit attendance (batch from a tutor)
function submitAttendance(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Records');
  const now = new Date().toISOString();
  
  const date = data.date;
  const tutor = data.tutor;
  const entries = data.entries;
  
  // Remove existing records for this tutor + date
  removeRecords(sheet, date, tutor);
  
  // Add new records
  const rows = [];
  entries.forEach(entry => {
    rows.push([
      date,
      tutor,
      entry.instrument,
      entry.classNo,
      entry.name,
      entry.status,
      entry.reason || '',
      now
    ]);
  });
  
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 8).setValues(rows);
  }
  
  return { success: true, count: rows.length };
}

// Update a single record (admin use)
function updateRecord(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Records');
  const allData = sheet.getDataRange().getValues();
  const now = new Date().toISOString();
  
  for (let i = 1; i < allData.length; i++) {
    const row = allData[i];
    const rowDate = formatDate(row[0]);
    
    if (rowDate === data.date &&
        row[1] === data.tutor &&
        row[2] === data.instrument &&
        row[3] === data.classNo &&
        row[4] === data.name) {
      // Found the record - update it
      sheet.getRange(i + 1, 6).setValue(data.status);
      sheet.getRange(i + 1, 7).setValue(data.reason || '');
      sheet.getRange(i + 1, 8).setValue(now);
      return { success: true };
    }
  }
  
  return { error: 'Record not found' };
}

// Get submission status for all tutors on a date
function getSubmissionStatus(date) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Records');
  const data = sheet.getDataRange().getValues();
  
  const tutors = {};
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowDate = formatDate(row[0]);
    
    if (rowDate === date) {
      tutors[row[1]] = true;
    }
  }
  
  return { submitted: tutors };
}

// Reset attendance for a tutor on a date (admin use)
function resetAttendance(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Records');
  removeRecords(sheet, data.date, data.tutor);
  return { success: true };
}

// Helper: remove all records for a tutor on a date
function removeRecords(sheet, date, tutor) {
  const data = sheet.getDataRange().getValues();
  
  // Find rows to delete (from bottom to top to avoid index shifting)
  const rowsToDelete = [];
  for (let i = data.length - 1; i >= 1; i--) {
    const rowDate = formatDate(data[i][0]);
    if (rowDate === date && data[i][1] === tutor) {
      rowsToDelete.push(i + 1); // 1-based row number
    }
  }
  
  rowsToDelete.forEach(row => {
    sheet.deleteRow(row);
  });
}

// Helper: format date to YYYY-MM-DD
function formatDate(value) {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(value);
}
