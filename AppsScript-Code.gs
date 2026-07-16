// AppADay 060 Task Manager -- Cloud Sync Backend
//
// Deploy this as its own Apps Script Web App. It stores the entire task
// list as one JSON blob in a plain Drive file (never a Google Doc, since
// Docs auto-correct straight quotes into curly quotes and silently corrupt
// JSON). Full setup steps are in the App 060 README.
//
// Contract:
//   GET  ?pass=PASSPHRASE            -> returns the stored JSON object,
//                                        or {"error": "..."} on failure.
//   POST body: {"pass":"...","data":{...}}
//                                     -> overwrites the stored JSON with
//                                        data, returns {"success": true}
//                                        or {"error": "..."}.

var SYNC_FILE_ID   = 'PASTE_YOUR_SYNC_FILE_ID_HERE';
var SYNC_PASSPHRASE = 'PASTE_YOUR_OWN_PASSPHRASE_HERE';

// Run this once from the Apps Script editor before deploying. It creates a
// blank plain-text file in your Drive to hold the synced task data and
// prints the file's ID to the execution log. Copy that ID into
// SYNC_FILE_ID above, then delete or ignore this function going forward.
function createSyncFile() {
  var file = DriveApp.createFile(
    'appaday-060-sync-data.json',
    JSON.stringify({ version: 1, nextId: 1, tasks: [] }),
    MimeType.PLAIN_TEXT
  );
  Logger.log('Sync file created.');
  Logger.log('File ID: ' + file.getId());
  Logger.log('Copy that ID into the SYNC_FILE_ID constant at the top of this file.');
}

function doGet(e) {
  var params = (e && e.parameter) || {};
  if (!checkPass(params.pass)) {
    return jsonOutput({ error: 'unauthorized' });
  }
  try {
    return jsonOutput(readData());
  } catch (err) {
    return jsonOutput({ error: String(err) });
  }
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOutput({ error: 'bad request body' });
  }
  if (!checkPass(body.pass)) {
    return jsonOutput({ error: 'unauthorized' });
  }
  try {
    writeData(body.data);
    return jsonOutput({ success: true });
  } catch (err) {
    return jsonOutput({ error: String(err) });
  }
}

function checkPass(pass) {
  return typeof pass === 'string' && pass.length > 0 && pass === SYNC_PASSPHRASE;
}

function readData() {
  var file = DriveApp.getFileById(SYNC_FILE_ID);
  var text = file.getBlob().getDataAsString();
  if (!text || !text.trim()) {
    return { version: 1, nextId: 1, tasks: [] };
  }
  return JSON.parse(text);
}

function writeData(data) {
  var file = DriveApp.getFileById(SYNC_FILE_ID);
  file.setContent(JSON.stringify(data));
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
