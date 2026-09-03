const { PDFDocument } = require('pdf-lib');
async function run() {
  const doc = await PDFDocument.create();
  console.log(typeof doc.embedPdf);
  console.log(typeof doc.embedPage);
  console.log(typeof doc.embedPages);
}
run();
