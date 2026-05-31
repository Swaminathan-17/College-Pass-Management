const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generatePassPDFSinglePage = async (passRequest, student, facultyName = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      const User = require('../models/User');
      const studentUser = await User.findById(student.userId);

      const doc = new PDFDocument({
        size: 'A4',
        margin: 20, // Reduced margin to maximize space
        autoFirstPage: false // Prevent automatic page creation
      });

      const fileName = `pass_${passRequest.passCode}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../uploads/passes', fileName);

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Add first page manually
      doc.addPage();

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const usableHeight = pageHeight - 40; // Account for margins

      // Background
      doc.fillColor('#ffffff').rect(0, 0, pageWidth, pageHeight).fill();

      // Outer Border
      doc.strokeColor('#e5e7eb')
        .lineWidth(2)
        .roundedRect(10, 10, pageWidth - 20, pageHeight - 20, 8)
        .stroke();

      // Header - Match browser format
      doc.fillColor('#1e40af')
        .roundedRect(25, 25, pageWidth - 50, 80, 8)
        .fill();

      // Calculate center position within header bounds
      const headerLeft = 25;
      const headerWidth = pageWidth - 50;
      
      // Centered text
      doc.fillColor('#ffffff')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('SCSVMV UNIVERSITY', headerLeft, 45, {
          width: headerWidth,
          align: 'center'
        });

      doc.fillColor('#dbeafe')
        .fontSize(14)
        .font('Helvetica')
        .text('STUDENT GATE PASS', headerLeft, 70, {
          width: headerWidth,
          align: 'center'
        });

      // Student Details - Match browser format
      const startY = 130;
      doc.fillColor('#1f2937')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('STUDENT DETAILS', 40, startY);

      const studentData = [
        ['Name:', studentUser ? studentUser.name : 'N/A'],
        ['Roll No:', student.rollNo],
        ['Department:', student.department],
        ['Year:', student.year + getOrdinalSuffix(student.year)],
        ['Class:', student.class],
        ['Residence:', student.residenceType === 'day-scholar' ? 'Day Scholar' : 'Hosteller']
      ];

      const labelWidth = 100;
      
      studentData.forEach((item, index) => {
        const y = startY + 35 + (index * 22);
        doc.fillColor('#1f2937')
          .fontSize(13)
          .font('Helvetica-Bold')
          .text(item[0], 40, y, { width: labelWidth });
        doc.fillColor('#374151')
          .font('Helvetica')
          .text(item[1], 40 + labelWidth, y);
      });

      // PASS CODE - Match browser format
      const codeY = startY + 180;
      const boxWidth = 280;
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
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('PASS CODE', codeX, centerY - 15, {
          width: boxWidth,
          align: 'center'
        });

      doc.fillColor('#dc2626')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text(passRequest.passCode, codeX, centerY + 2, {
          width: boxWidth,
          align: 'center'
        });

      // PASS DETAILS - Match browser format
      const detailsY = codeY + 100;
      doc.fillColor('#1f2937')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('PASS DETAILS', 40, detailsY);

      const passData = [
        ['Type:', passRequest.passType.toUpperCase()],
        ['Destination:', passRequest.destination],
        ['Date:', new Date(passRequest.outDate).toLocaleDateString()],
        ['Out Time:', passRequest.outTime],
        ['Return Time:', passRequest.expectedReturnTime],
        ['Purpose:', passRequest.reason]
      ];

      const leftColX = 40;
      const rightColX = pageWidth / 2 + 40;
      const detailLabelWidth = 110;

      passData.forEach((item, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const baseX = col === 0 ? leftColX : rightColX;
        const y = detailsY + 35 + (row * 25);
        doc.fillColor('#1f2937')
          .fontSize(13)
          .font('Helvetica-Bold')
          .text(item[0], baseX, y, { width: detailLabelWidth });
        doc.fillColor('#374151')
          .fontSize(13)
          .font('Helvetica')
          .text(item[1], baseX + detailLabelWidth, y);
      });

      // APPROVAL STATUS - Separate section below pass details
      const approvalSectionY = detailsY + 120;
      doc.fillColor('#1f2937')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('APPROVAL STATUS', 40, approvalSectionY);

      // Create approval status box
      const approvalY = approvalSectionY + 35;
      const approvalBoxWidth = pageWidth - 80;
      const approvalBoxHeight = 60;
      const approvalX = 40;
      
      doc.fillColor('#059669')
        .roundedRect(approvalX, approvalY, approvalBoxWidth, approvalBoxHeight, 8)
        .fill();
      
      doc.fillColor('#ffffff')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('✓ APPROVED', approvalX + 20, approvalY + 20);
      
      doc.fillColor('#d1fae5')
        .fontSize(14)
        .font('Helvetica')
        .text(`Approved By: ${facultyName || 'Faculty'}`, approvalX + 20, approvalY + 40);


      stream.on('finish', () => {
        resolve(`/uploads/passes/${fileName}`);
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

module.exports = { generatePassPDFSinglePage };
