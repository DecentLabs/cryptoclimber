/** @OnlyCurrentDoc */

var SHEET_NAME = "Raw";

function doGet(e) {
  var lock = LockService.getPublicLock()
  lock.waitLock(30000);  // wait 30 seconds before conceding defeat.
  
  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getSheetByName(SHEET_NAME);
    
    var headRow = 1;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow() + 1; // get next row
    var row = [];
    var cols = {};
    // loop through the header columns
    for (var i in headers){
      if (headers[i] == "time") {
        // always use server-time for this column
        row.push(new Date().toISOString().substr(0, 19).replace('T', ' '));
      } else { // else use header name to get data
        row.push(e.parameter[headers[i]]);
      }
      cols[headers[i]] = i;
    }
    var result = { result: 'success' };
    if (e.parameter['player']) {
      sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
    }
    result['top'] = topRank(sheet, cols, e.parameter['start'], e.parameter['stop'], nextRow - 1);

    return ContentService
      .createTextOutput("callback(" + JSON.stringify(result) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } catch(e) {
    // if error return this
    return ContentService
      .createTextOutput('callback({"result": "error", "error": "' + JSON.stringify(e) + '"})')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } finally { // release lock
    lock.releaseLock();
  }
}

function topRank(sheet, cols, start, stop, selfRow) {
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  selfRow--; // since we have skipped the header
  var timeCol = cols['time'];
  var playerCol = cols['player'];
  var returnCol = cols['return'];
  var tradesCol = cols['trades'];
  var startCol = cols['start'];
  var stopCol = cols['stop'];
  var tradeListCol = cols['tradeList'];

  var topList = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (row[startCol] == start && row[stopCol] == stop) {
      var tradeList;
      try {
        tradeList = JSON.parse(row[tradeListCol]);
      } catch (error) {
        tradeList = null;
      }
      topList.push([row[playerCol], row[returnCol], row[timeCol], row[tradesCol], i == selfRow, tradeList]);
    }
  }
  topList.sort(function(p1, p2) { return p1[1] > p2[1] ? -1 : 1; });
  return topList.slice(0, 10);
}