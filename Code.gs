
// original from: http://mashe.hawksey.info/2014/07/google-sheets-as-a-database-insert-with-apps-script-using-postget-methods-with-ajax-example/
// original gist: https://gist.github.com/willpatera/ee41ae374d3c9839c2d6 

function doGet(e){
  return handleResponse(e);
}

//  Enter sheet name where data is to be written below
var SHEET_NAME = "Raw";
var RANK_SHEET_NAME = "Rank";

var SCRIPT_PROP = PropertiesService.getScriptProperties(); // new property service

function handleResponse(e) {
  // shortly after my original solution Google announced the LockService[1]
  // this prevents concurrent access overwritting data
  // [1] http://googleappsdeveloper.blogspot.co.uk/2011/10/concurrency-and-google-apps-script.html
  // we want a public lock, one that locks for all invocations
  var lock = LockService.getPublicLock();
  lock.waitLock(30000);  // wait 30 seconds before conceding defeat.
  
  try {
    if (e.parameter.hasOwnProperty("rank")) {
      return handleRank(e);
    }
    
    // next set where we write the data - you could write to multiple/alternate destinations
    var doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
    var sheet = doc.getSheetByName(SHEET_NAME);
    
    // we'll assume header is in row 1 but you can override with header_row in GET/POST data
    var headRow = e.parameter.header_row || 1;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow()+1; // get next row
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
      result['row'] = nextRow;
    }
    result['top'] = topRank(sheet, cols, e.parameter['start'], nextRow - 1);

    return ContentService
    .createTextOutput("callback('"+JSON.stringify(result)+"');")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } catch(e){
    // if error return this
    return ContentService
    .createTextOutput('callback({"result":"error", "error": "'+JSON.stringify(e)+'"})')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } finally { //release lock
    lock.releaseLock();
  }
}

function topRank(sheet, cols, start, selfRow) {
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  selfRow--; // since we have skipped the header
  var startCol = cols['start'];
  var playerCol = cols['player'];
  var resultCol = cols['return'];
  var timeCol = cols['time'];
  var tradesCol = cols['trades'];
  var topList = []
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (row[startCol] == start) {
      topList.push([row[playerCol], row[resultCol], row[timeCol], row[tradesCol], i == selfRow])
    }
  }
  topList.sort(function(p1, p2){ return p1[1] > p2[1] ? -1 : 1; });
  return topList.slice(0, 10);
}


function setup() {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    SCRIPT_PROP.setProperty("key", doc.getId());
}
