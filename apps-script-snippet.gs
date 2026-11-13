/**
 * Tambahkan fungsi ini ke Apps Script backend yang sudah ada (yang mengembalikan news & events).
 * 1) Buat tab bernama "apps" di Google Sheet dengan header baris 1:
 *    nama | grup | ket | tag | url | badge | aktif | urut
 *    grup: plan | trial | demplot | report   (aktif: kosongkan atau isi TRUE; FALSE = sembunyikan)
 * 2) Di doGet(), tambahkan  apps: getApps_()  pada objek JSON yang dikembalikan, mis.:
 *    return ContentService.createTextOutput(JSON.stringify({news: ..., events: ..., apps: getApps_()}))
 *             .setMimeType(ContentService.MimeType.JSON);
 * 3) Deploy ulang web app (New version).
 */
function getApps_() {
  var sh = SpreadsheetApp.getActive().getSheetByName('apps');
  if (!sh || sh.getLastRow() < 2) return [];
  var v = sh.getDataRange().getValues(), h = v.shift().map(function (x) { return String(x).trim().toLowerCase(); });
  var rows = v.map(function (r) {
    var o = {}; h.forEach(function (k, i) { o[k] = r[i]; }); return o;
  }).filter(function (o) {
    return o.nama && o.url && String(o.aktif).toUpperCase() !== 'FALSE';
  });
  rows.sort(function (a, b) { return (Number(a.urut) || 999) - (Number(b.urut) || 999); });
  return rows.map(function (o) {
    return { nama: String(o.nama), grup: String(o.grup || 'lain'), ket: String(o.ket || ''),
             tag: String(o.tag || ''), url: String(o.url), badge: o.badge ? String(o.badge) : '' };
  });
}
