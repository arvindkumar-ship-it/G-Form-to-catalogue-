const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = readFileSync('apps-script-image-proxy.gs', 'utf8');
function run({ configured = true, folder = 'catalogue', mime = 'image/png', size = 12 } = {}) {
  let blobRead = false;
  const context = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => configured ? 'catalogue' : null }) },
    DriveApp: { getFileById: () => ({ getParents: () => { let pending = true; return { hasNext: () => pending, next: () => { pending = false; return { getId: () => folder }; } }; }, getSize: () => size, getMimeType: () => mime, getBlob: () => { blobRead = true; return { getBytes: () => [1, 2] }; } }) },
    Utilities: { base64Encode: () => 'AQI=' },
    ContentService: { MimeType: { TEXT: 'text/plain' }, createTextOutput: value => ({ value, setMimeType() { return this; } }) },
  };
  vm.createContext(context); vm.runInContext(source, context);
  return { response: context.doGet({ parameter: { id: 'fixture-file-123' } }).value, blobRead };
}
assert.equal(run().response, 'data:image/png;base64,AQI=');
for (const options of [{ configured: false }, { folder: 'private' }, { mime: 'text/html' }, { size: 2097153 }]) {
  const result = run(options); assert.equal(result.response, ''); assert.equal(result.blobRead, false);
}
console.log('5 image proxy access cases passed');
