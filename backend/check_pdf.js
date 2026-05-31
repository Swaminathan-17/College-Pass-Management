const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create test PDF to check alignment
const createTestPDF = async () => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 30
      });
      
      const fileName = `check_alignment_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, fileName);
      
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Test data
      const passRequest = {
        passCode: '7008BE55',
        passType: 'outpass',
        destination: 'Home',
        reason: 'Weekend leave',
        outDate: new Date(),
        outTime: '04:00 PM',
        expectedReturnTime: '06:00 PM',
        facultyRemark: 'Approved for weekend'
      };

      const studentUser = { name: 'Test Student' };
      const student = {
        rollNo: '21BCE1234',
        department: 'Computer Science Engineering',
        year: 3,
        class: 'CSE-C',
        residenceType: 'day-scholar'
      };
      const facultyName = 'Lalitha Faculty';

      // Background
      doc.fillColor('#ffffff').rect(0, 0, pageWidth, pageHeight).fill();

      // Outer Border
      doc.strokeColor('#e5e7eb')
        .lineWidth(2)
        .roundedRect(20, 20, pageWidth - 40, pageHeight - 40, 10)
        .stroke();

      // Header
      doc.fillColor('#1e40af')
        .roundedRect(30, 30, pageWidth - 60, 70, 8)
        .fill();

      // Calculate center position within header bounds
      const headerLeft = 30;
      const headerWidth = pageWidth - 60;
      const headerCenterX = headerLeft + (headerWidth / 2);
      
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

      // ================= STUDENT DETAILS =================
      const startY = 115;

      doc.fillColor('#1f2937')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('STUDENT DETAILS', 50, startY);

      doc.strokeColor('#3b82f6')
        .lineWidth(2)
        .moveTo(50, startY + 25)
        .lineTo(250, startY + 25)
        .stroke();

      const studentData = [
        ['Name:', studentUser?.name || 'N/A'],
        ['Roll No:', student.rollNo],
        ['Department:', student.department],
        ['Year:', student.year + getOrdinalSuffix(student.year)],
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

      // ================= PASS CODE =================
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

      // ================= PASS DETAILS =================
      const detailsY = codeY + 95;

      doc.fillColor('#1f2937')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('PASS DETAILS', 50, detailsY);

      doc.strokeColor('#10b981')
        .lineWidth(2)
        .moveTo(50, detailsY + 25)
        .lineTo(pageWidth - 50, detailsY + 25)
        .stroke();

      const passDetails = [
        ['Pass Type:', passRequest.passType.toUpperCase()],
        ['Destination:', passRequest.destination],
        ['Reason:', passRequest.reason],
        ['Date:', new Date(passRequest.outDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })],
        ['Out Time:', passRequest.outTime],
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

      // ================= APPROVAL =================
      const approvalY = detailsY + 135;

      doc.fillColor('#1f2937')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('APPROVAL STATUS', 50, approvalY);

      doc.strokeColor('#8b5cf6')
        .lineWidth(2)
        .moveTo(50, approvalY + 25)
        .lineTo(pageWidth - 50, approvalY + 25)
        .stroke();

      if (facultyName) {
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
      }

      // ================= FOOTER =================
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
          60,
          footerY + 12
        );

      doc.fillColor('#9ca3af')
        .fontSize(9)
        .font('Helvetica-Oblique')
        .text('Valid only with college ID card', 60, footerY + 25);

      stream.on('finish', () => {
        resolve(filePath);
      });

      doc.end();

    } catch (error) {
      console.error('PDF Generation Error:', error);
      reject(error);
    }
  });
};

// Helper
const getOrdinalSuffix = (num) => {
  const j = num % 10, k = num % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

// Create and check PDF
createTestPDF()
  .then(filePath => {
    console.log('✅ PDF CREATED FOR CHECKING!');
    console.log('📁 File path:', filePath);
    console.log('\n🔍 Opening PDF to check alignment...');
    
    // Try to open the PDF with default viewer
    const { exec } = require('child_process');
    const command = process.platform === 'darwin' ? 'open' : 
                   process.platform === 'win32' ? 'start' : 'xdg-open';
    
    exec(`${command} "${filePath}"`, (error) => {
      if (error) {
        console.log('❌ Could not open PDF automatically');
        console.log('📂 Please manually open:', filePath);
      } else {
        console.log('✅ PDF opened in default viewer');
      }
    });
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });
