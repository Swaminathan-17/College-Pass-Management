const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendEmail = async (to, subject, content, attachments = []) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: content.includes('<!DOCTYPE html>') ? stripHtml(content) : content,
      html: content.includes('<!DOCTYPE html>') ? content : null,
      attachments
    };
    
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const stripHtml = (html) => {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

const sendFacultyNotification = async (facultyEmail, studentName, passDetails) => {
  const subject = 'New Pass Request - Approval Required';
  const text = `
    Dear Faculty,
    
    A new pass request has been submitted by ${studentName} and requires your approval.
    
    Pass Details:
    - Type: ${passDetails.passType}
    - Reason: ${passDetails.reason}
    - Destination: ${passDetails.destination}
    - Out Date: ${new Date(passDetails.outDate).toLocaleDateString()}
    - Out Time: ${passDetails.outTime}
    - Expected Return: ${passDetails.expectedReturnTime}
    
    Please login to the system to approve or reject this request.
    
    Regards,
    College Pass Management System
  `;
  
  await sendEmail(facultyEmail, subject, text);
};

const sendStudentPassApproval = async (studentEmail, studentName, passCode, pdfPath) => {
  const subject = '✅ Pass Approved - Your Digital Gate Pass Ready';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pass Approved - College Pass Management</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .pass-code { background: #4CAF50; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 5px; margin: 20px 0; }
        .info-box { background: #e3f2fd; padding: 20px; border-left: 4px solid #2196F3; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .emoji { font-size: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="emoji">🎉</span> Congratulations! Your Pass is Approved</h1>
          <p>College Pass Management System</p>
        </div>
        
        <div class="content">
          <p>Dear <strong>${studentName}</strong>,</p>
          
          <p>Great news! Your gate pass request has been <strong>approved</strong>. You can now use your digital pass for campus exit and entry.</p>
          
          <div class="pass-code">
            <span class="emoji">🎫</span> Pass Code: ${passCode} <span class="emoji">🎫</span>
          </div>
          
          <div class="info-box">
            <h3><span class="emoji">📋</span> Important Instructions:</h3>
            <ul>
              <li><strong>Show this email or the attached PDF</strong> to security personnel</li>
              <li>You can also <strong>use your pass code: ${passCode}</strong> for verification</li>
              <li>Keep your digital pass accessible on your mobile device</li>
              <li>Remember to <strong>sign out</strong> when leaving and <strong>sign in</strong> when returning</li>
            </ul>
          </div>
          
          <div class="info-box">
            <h3><span class="emoji">📱</span> How to Use Your Pass:</h3>
            <ol>
              <li>Present this email or the attached PDF at the security gate</li>
              <li>Alternatively, mention your pass code: <strong>${passCode}</strong></li>
              <li>Security personnel will verify and record your exit/entry</li>
            </ol>
          </div>
          
          <p><strong>📎 Your digital pass is attached to this email as a PDF file.</strong></p>
          <p>You can also download it anytime from the student portal.</p>
          
          <div class="footer">
            <p><span class="emoji">🏫</span> College Pass Management System</p>
            <p>For support, contact the administration office</p>
            <p><em>This is an automated message. Please do not reply to this email.</em></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const attachments = pdfPath ? [{
    filename: `pass_${passCode}.pdf`,
    path: pdfPath
  }] : [];
  
  await sendEmail(studentEmail, subject, html, attachments);
};

const sendParentNotification = async (parentEmail, studentName, passDetails) => {
  const subject = '🏫 Student Pass Approved - Notification';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Student Pass Notification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .pass-details { background: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .pass-details h3 { color: #856404; margin-top: 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #555; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .emoji { font-size: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="emoji">📧</span> Student Pass Notification</h1>
          <p>College Pass Management System</p>
        </div>
        
        <div class="content">
          <p>Dear Parent/Guardian,</p>
          
          <p>This is to inform you that <strong>${studentName}</strong> has been granted a pass to leave the campus.</p>
          
          <div class="pass-details">
            <h3><span class="emoji">📋</span> Pass Details:</h3>
            <div class="detail-row">
              <span class="detail-label">📍 Destination:</span>
              <span>${passDetails.destination}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📅 Date:</span>
              <span>${new Date(passDetails.outDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🕐 Out Time:</span>
              <span>${passDetails.outTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🕐 Expected Return:</span>
              <span>${passDetails.expectedReturnTime}</span>
            </div>
          </div>
          
          <div class="pass-details">
            <h3><span class="emoji">📝</span> Important Notes:</h3>
            <ul>
              <li>Please ensure your child follows all college rules and regulations</li>
              <li>Encourage your child to return on time as specified</li>
              <li>The student should carry their digital pass or pass code for verification</li>
              <li>For any emergencies, contact the college administration immediately</li>
            </ul>
          </div>
          
          <p>Thank you for your cooperation in ensuring your child's safety and compliance with college policies.</p>
          
          <div class="footer">
            <p><span class="emoji">🏫</span> College Pass Management System</p>
            <p>For queries, contact the college administration office</p>
            <p><em>This is an automated message. Please do not reply to this email.</em></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail(parentEmail, subject, html);
};

const sendHodEmergencyNotification = async (hodEmail, studentName, passDetails) => {
  const subject = 'EMERGENCY PASS REQUEST - Immediate Action Required';
  const text = `
    Dear HOD,
    
    An EMERGENCY pass request has been submitted by ${studentName} and requires your immediate attention.
    
    Emergency Details:
    - Type: ${passDetails.passType}
    - Reason: ${passDetails.reason}
    - Destination: ${passDetails.destination}
    - Out Date: ${new Date(passDetails.outDate).toLocaleDateString()}
    - Out Time: ${passDetails.outTime}
    - Expected Return: ${passDetails.expectedReturnTime}
    
    This is an emergency request. Please login to the system immediately to approve or reject this request.
    
    Regards,
    College Pass Management System
  `;
  
  await sendEmail(hodEmail, subject, text);
};

const sendWardenNotification = async (wardenEmail, facultyName, studentName, passDetails) => {
  const subject = 'Pass Request - Faculty Approved - Warden Approval Required';
  const text = `
    Dear Warden,
    
    A pass request has been approved by ${facultyName} and requires your final approval.
    
    Student: ${studentName}
    
    Pass Details:
    - Type: ${passDetails.passType}
    - Reason: ${passDetails.reason}
    - Destination: ${passDetails.destination}
    - Out Date: ${new Date(passDetails.outDate).toLocaleDateString()}
    - Out Time: ${passDetails.outTime}
    - Expected Return: ${passDetails.expectedReturnTime}
    
    Please login to the system to approve or reject this request.
    
    Regards,
    College Pass Management System
  `;
  
  await sendEmail(wardenEmail, subject, text);
};

const sendPassRejectionEmail = async (email, role, studentName, rejectionReason, passDetails = null) => {
  const subject = '❌ Pass Request - Update on Your Application';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pass Request Update - College Pass Management</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .rejection-box { background: #fee; border-left: 4px solid #f44336; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .info-box { background: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .pass-details { background: #e3f2fd; padding: 20px; border-left: 4px solid #2196F3; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .emoji { font-size: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="emoji">📋</span> Update on Your Pass Request</h1>
          <p>College Pass Management System</p>
        </div>
        
        <div class="content">
          <p>Dear <strong>${studentName}</strong>,</p>
          
          <p>We regret to inform you that your pass request has been <strong>reviewed and could not be approved</strong> at this time.</p>
          
          ${rejectionReason ? `
          <div class="rejection-box">
            <h3><span class="emoji">📝</span> Reason for Rejection:</h3>
            <p><em>${rejectionReason}</em></p>
          </div>
          ` : ''}
          
          ${passDetails ? `
          <div class="pass-details">
            <h3><span class="emoji">📋</span> Request Details:</h3>
            <ul>
              <li><strong>Pass Type:</strong> ${passDetails.passType || 'N/A'}</li>
              <li><strong>Destination:</strong> ${passDetails.destination || 'N/A'}</li>
              <li><strong>Date:</strong> ${passDetails.outDate ? new Date(passDetails.outDate).toLocaleDateString() : 'N/A'}</li>
              <li><strong>Time:</strong> ${passDetails.outTime || 'N/A'}</li>
              <li><strong>Reason:</strong> ${passDetails.reason || 'N/A'}</li>
            </ul>
          </div>
          ` : ''}
          
          <div class="info-box">
            <h3><span class="emoji">💡</span> What You Can Do:</h3>
            <ul>
              <li>Review the rejection reason above (if provided)</li>
              <li>Contact the administration office for clarification</li>
              <li>Submit a new pass request with updated information if needed</li>
              <li>Ensure all required information is provided in future requests</li>
            </ul>
          </div>
          
          <div class="info-box">
            <h3><span class="emoji">📞</span> Need Assistance?</h3>
            <p>If you believe this rejection was made in error or need further clarification, please contact:</p>
            <ul>
              <li>College Administration Office</li>
              <li>Your Class Incharge (for academic-related passes)</li>
              <li>HOD Office (for emergency passes)</li>
            </ul>
          </div>
          
          <div class="footer">
            <p><span class="emoji">🏫</span> College Pass Management System</p>
            <p>We appreciate your understanding and cooperation</p>
            <p><em>This is an automated message. Please do not reply to this email.</em></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail(email, subject, html);
};

module.exports = {
  sendFacultyNotification,
  sendStudentPassApproval,
  sendParentNotification,
  sendHodEmergencyNotification,
  sendWardenNotification,
  sendPassRejectionEmail
};
