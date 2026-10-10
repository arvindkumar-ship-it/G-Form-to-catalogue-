function doGet(request) {
  var fileId = request && request.parameter && request.parameter.id;
  var denied = function () { return ContentService.createTextOutput(""); };
  if (!fileId || !/^[A-Za-z0-9_-]{10,200}$/.test(fileId)) return denied();

  try {
    // This folder's images will be public through this endpoint. Keep it separate
    // from personal documents. Missing configuration denies every request.
    var folderId = PropertiesService.getScriptProperties().getProperty("CATALOGUE_IMAGE_FOLDER_ID");
    if (!folderId) return denied();
    var file = DriveApp.getFileById(fileId);
    var parents = file.getParents();
    var allowed = false;
    while (parents.hasNext()) {
      if (parents.next().getId() === folderId) allowed = true;
    }
    if (!allowed || file.getSize() > 2 * 1024 * 1024) return denied();
    var mimeType = file.getMimeType();
    if (["image/jpeg", "image/png", "image/gif", "image/webp"].indexOf(mimeType) === -1) return denied();
    var blob = file.getBlob();
    var bytes = blob.getBytes();
    if (bytes.length > 2 * 1024 * 1024) return denied();
    var dataUrl = "data:" + mimeType + ";base64," + Utilities.base64Encode(bytes);
    return ContentService.createTextOutput(dataUrl).setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return denied();
  }
}
