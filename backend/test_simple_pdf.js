const PDFDocument = require('pdfkit');

// Test basic PDF generation
function testBasicPDF() {
  console.log('🔄 Testing basic PDF generation...');
  
  try {
    const doc = new PDFDocument();
    const buffers = [];
    
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      console.log('✅ Basic PDF generated successfully, size:', pdfBuffer.length);
      
      // Save to file
      const fs = require('fs');
      fs.writeFileSync('basic_test.pdf', pdfBuffer);
      console.log('✅ Basic PDF saved as basic_test.pdf');
    });
    
    doc.on('error', (error) => {
      console.error('❌ PDF generation error:', error);
    });
    
    // Add simple content
    doc.fontSize(20).text('Test PDF', 100, 100);
    doc.fontSize(14).text('This is a test PDF', 100, 130);
    
    doc.end();
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testBasicPDF();
