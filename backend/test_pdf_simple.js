const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Simplified PDF generation test without database
const createTestPDF = () => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 30
      });
      
      const fileName = `test_new_design_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, fileName);
      
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Test data
      const passRequest = {
        passCode: '70088E55',
        passType: 'home',
        destination: 'Home',
        reason: 'Weekend visit',
        outDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        outTime: '10:00',
        expectedReturnTime: '18:00',
        facultyRemark: 'Approved for weekend'
      };

      const student = {
        name: 'Test Student',
        rollNo: '21BCE1234',
        department: 'Computer Science Engineering',
        year: 3,
        class: 'CSE-C',
        residenceType: 'day-scholar'
      };

      const facultyName = 'Lalitha Faculty';

      // Background - LIGHT
      doc.fillColor('#ffffff').rect(0, 0, pageWidth, pageHeight).fill();

      // Outer Border
      doc.strokeColor('#e5e7eb')
        .lineWidth(2)
        .roundedRect(20, 20, pageWidth - 40, pageHeight - 40, 10)
        .stroke();

      // Header - LIGHT BLUE
      doc.fillColor('#1e40af')
        .roundedRect(30, 30, pageWidth - 60, 70, 8)
        .fill();

      // Calculate center position within header bounds
      const headerLeft = 30;
      const headerWidth = pageWidth - 60;
      
      // Centered text
      doc.fillColor('#ffffff')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('SCSVMV UNIVERSITY', headerLeft, 50, {
          width: headerWidth,
          align: 'center'
        });

      doc.fillColor('#dbeafe')
        .fontSize(12)
        .font('Helvetica')
        .text('STUDENT GATE PASS', headerLeft, 75, {
          width: headerWidth,
          align: 'center'
        });

      // Student Details - NORMAL TEXT COLORS
      const startY = 115;
      doc.fillColor('#1f2937')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('STUDENT DETAILS', 50, startY);

      const studentData = [
        ['Name:', student.name],
        ['Roll No:', student.rollNo],
        ['Department:', student.department],
        ['Year:', student.year + 'rd'],
        ['Class:', student.class],
        ['Residence:', student.residenceType === 'day-scholar' ? 'Day Scholar' : 'Hosteller']
      ];

      const labelWidth = 100;
      studentData.forEach((item, index) => {
        const y = startY + 40 + (index * 24);
        doc.fillColor('#1f2937')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(item[0], 50, y, { width: labelWidth });
        doc.fillColor('#374151')
          .font('Helvetica')
          .text(item[1], 50 + labelWidth, y);
      });

      // PASS CODE - ORANGE BLOCK
      const codeY = startY + 185;
      const boxWidth = 240;
      const boxHeight = 70;
      const codeX = (pageWidth - boxWidth) / 2;

      doc.fillColor('#fef3c7')
        .roundedRect(codeX, codeY, boxWidth, boxHeight, 8)
        .fill();

      doc.strokeColor('#f59e0b')
        .lineWidth(2)
        .roundedRect(codeX, codeY, boxWidth, boxHeight, 8)
        .stroke();

      const centerY = codeY + (boxHeight / 2);
      doc.fillColor('#92400e')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('PASS CODE', codeX, centerY - 18, {
          width: boxWidth,
          align: 'center'
        });

      doc.fillColor('#dc2626')
        .fontSize(26)
        .font('Helvetica-Bold')
        .text(passRequest.passCode, codeX, centerY + 2, {
          width: boxWidth,
          align: 'center'
        });

      // PASS DETAILS - NORMAL TEXT COLORS
      const detailsY = codeY + 95;
      doc.fillColor('#1f2937')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('PASS DETAILS', 50, detailsY);

      const passDetails = [
        ['Pass Type:', passRequest.passType.toUpperCase()],
        ['Reason:', passRequest.reason],
        ['Out Time:', passRequest.outTime],
        ['Destination:', passRequest.destination],
        ['Date:', new Date(passRequest.outDate).toLocaleDateString()],
        ['Return Time:', passRequest.expectedReturnTime]
      ];

      const leftColX = 50;
      const rightColX = pageWidth / 2 + 30;
      const detailLabelWidth = 100;

      passDetails.forEach((item, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const baseX = col === 0 ? leftColX : rightColX;
        const y = detailsY + 40 + (row * 30);
        doc.fillColor('#1f2937')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(item[0], baseX, y, { width: detailLabelWidth });
        doc.fillColor('#374151')
          .font('Helvetica')
          .text(item[1], baseX + detailLabelWidth, y);
      });

      // APPROVAL STATUS - NORMAL TEXT COLORS
      const approvalY = detailsY + 135;
      doc.fillColor('#1f2937')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('APPROVAL STATUS', 50, approvalY);

      const approvalBoxY = approvalY + 40;
      doc.fillColor('#f0f9ff')
        .roundedRect(50, approvalBoxY, pageWidth - 100, 70, 8)
        .fill();

      doc.strokeColor('#3b82f6')
        .lineWidth(2)
        .roundedRect(50, approvalBoxY, pageWidth - 100, 70, 8)
        .stroke();

      doc.fillColor('#1e3a8a')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`APPROVED BY: ${facultyName}`, 50, approvalBoxY + 18, {
          width: pageWidth - 100,
          align: 'center'
        });

      if (passRequest.facultyRemark) {
        doc.fillColor('#059669')
          .fontSize(11)
          .font('Helvetica-Oblique')
          .text(`"${passRequest.facultyRemark}"`, 50, approvalBoxY + 40, {
            width: pageWidth - 100,
            align: 'center'
          });
      }

      // Footer
      const footerY = pageHeight - 50;
      doc.fillColor('#f9fafb')
        .roundedRect(50, footerY, pageWidth - 100, 30, 6)
        .fill();

      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(
          'Generated: ' +
          new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          50,
          footerY + 10,
          { width: pageWidth - 100, align: 'center' }
        );

      doc.end();

      stream.on('finish', () => {
        console.log('✅ PDF CREATED WITH NEW DESIGN!');
        console.log('📁 File path:', filePath);
        
        // Copy to uploads folder
        const targetPath = path.join(__dirname, 'uploads/passes/pass_70088E55_1774369169524.pdf');
        fs.copyFileSync(filePath, targetPath);
        console.log('📋 PDF copied to uploads folder');
        console.log('🌐 Access at: http://localhost:5000/uploads/passes/pass_70088E55_1774369169524.pdf');
        console.log('🎨 Features: Light background, centered text, orange PASS CODE, normal colors, single page');
        
        resolve(filePath);
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

createTestPDF().catch(console.error);
