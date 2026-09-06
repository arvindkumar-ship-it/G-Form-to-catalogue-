function doGet(request) {
  var fileId = request.parameter.id;
  if (!fileId) {
    return ContentService.createTextOutput("");
  }

  try {
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    var base64 = Utilities.base64Encode(blob.getBytes());
    var mimeType = blob.getContentType() || "image/jpeg";
    var dataUrl = "data:" + mimeType + ";base64," + base64;
    return ContentService.createTextOutput(dataUrl).setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("");
  }
}
