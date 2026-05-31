const mongoose = require('mongoose');
const PassRequest = require('./models/PassRequest');
const Student = require('./models/Student');
const PDFDocument = require('pdfkit');
require('dotenv').config();

async function debugPDFGeneration() {
  try {
    console.log('🔄 Debugging PDF generation...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    // Find the pass
    const pass = await PassRequest.findById('69c2a0c7a7f10da732558544')
      .populate('studentId')
      .populate('assignedFacultyId');
    
    if (!pass) {
      console.log('❌ Pass not found');
      return;
    }
    
    console.log('✅ Found pass:', pass._id);
    console.log('Student:', pass.studentId.name);
    console.log('PassCode:', pass.passCode);
    
    // Create simple PDF
    const doc = new PDFDocument();
    const buffers = [];
    
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      console.log('✅ PDF generated successfully, size:', pdfBuffer.length);
      
      // Save to file to test
      const fs = require('fs');
      fs.writeFileSync('debug_test.pdf', pdfBuffer);
      console.log('✅ PDF saved as debug_test.pdf');
    });
    
    doc.on('error', (error) => {
      console.error('❌ PDF generation error:', error);
    });
    
    // Add simple content
    doc.fontSize(20).text('Test PDF', 100, 100);
    doc.fontSize(14).text('Pass Code: ' + pass.passCode, 100, 130);
    doc.fontSize(14).text('Student: ' + pass.studentId.name, 100, 160);
    
    doc.end();
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugPDFGeneration();
