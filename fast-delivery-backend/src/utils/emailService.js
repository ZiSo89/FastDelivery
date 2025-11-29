const Brevo = require('@getbrevo/brevo');

// Initialize Brevo API
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'zisoglou@hotmail.gr';
const EMAIL_FROM_NAME = 'Fast Delivery';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Log configuration on startup
console.log('📧 Email Service Initializing (Brevo API)...');
console.log('   API Key configured:', process.env.BREVO_API_KEY ? 'YES ✅' : 'NO ❌');
console.log('   From Email:', EMAIL_FROM);
console.log('   Frontend URL:', FRONTEND_URL);
console.log('   NODE_ENV:', process.env.NODE_ENV);

/**
 * Send email using Brevo API
 */
const sendEmailWithBrevo = async (to, subject, htmlContent) => {
  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  
  sendSmtpEmail.sender = { name: EMAIL_FROM_NAME, email: EMAIL_FROM };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;

  try {
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent to ${to} (MessageId: ${result.body?.messageId || result.messageId || 'N/A'})`);
    return { success: true, messageId: result.body?.messageId || result.messageId };
  } catch (error) {
    console.error('❌ Brevo API Error:', error.message);
    if (error.body) {
      console.error('   Response:', JSON.stringify(error.body, null, 2));
    }
    throw error;
  }
};

/**
 * Send verification email to user
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @param {string} token - Verification token
 * @param {string} userType - 'customer', 'store', or 'driver'
 */
exports.sendVerificationEmail = async (email, name, token, userType) => {
  // Skip email in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log(`📧 [DEV MODE] Verification email skipped for ${email}`);
    console.log(`   Token: ${token}`);
    console.log(`   Link: ${FRONTEND_URL}/verify-email?token=${token}&type=${userType}`);
    return { success: true, dev: true };
  }

  const verificationLink = `${FRONTEND_URL}/verify-email?token=${token}&type=${userType}`;
  
  const userTypeGreek = {
    customer: 'Πελάτη',
    store: 'Καταστήματος',
    driver: 'Διανομέα'
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00c2e8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #00c2e8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 Fast Delivery</h1>
        </div>
        <div class="content">
          <h2>Γεια σου ${name}!</h2>
          <p>Ευχαριστούμε για την εγγραφή σου ως <strong>${userTypeGreek[userType]}</strong> στο Fast Delivery.</p>
          <p>Για να ολοκληρώσεις την εγγραφή σου, κάνε κλικ στο παρακάτω κουμπί:</p>
          <center>
            <a href="${verificationLink}" class="button">✅ Επιβεβαίωση Email</a>
          </center>
          <p>Ή αντέγραψε αυτό το link στον browser σου:</p>
          <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">
            ${verificationLink}
          </p>
          <p><strong>Το link ισχύει για 24 ώρες.</strong></p>
        </div>
        <div class="footer">
          <p>Αν δεν έκανες εσύ αυτή την εγγραφή, αγνόησε αυτό το email.</p>
          <p>© ${new Date().getFullYear()} Fast Delivery - Αλεξανδρούπολη</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    console.log(`📧 Sending verification email to: ${email}`);
    console.log(`   Link: ${verificationLink}`);
    
    const result = await sendEmailWithBrevo(email, '✉️ Επιβεβαίωση Email - Fast Delivery', htmlContent);
    return result;
  } catch (error) {
    console.error('❌ Email service error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @param {string} token - Reset token
 * @param {string} userType - 'customer', 'store', or 'driver'
 */
exports.sendPasswordResetEmail = async (email, name, token, userType) => {
  // Skip email in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log(`📧 [DEV MODE] Password reset email skipped for ${email}`);
    console.log(`   Token: ${token}`);
    return { success: true, dev: true };
  }

  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}&type=${userType}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00c2e8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 Fast Delivery</h1>
        </div>
        <div class="content">
          <h2>Επαναφορά Κωδικού</h2>
          <p>Γεια σου ${name},</p>
          <p>Λάβαμε αίτημα για επαναφορά του κωδικού σου.</p>
          <p>Κάνε κλικ στο παρακάτω κουμπί για να ορίσεις νέο κωδικό:</p>
          <center>
            <a href="${resetLink}" class="button">🔐 Αλλαγή Κωδικού</a>
          </center>
          <p>Ή αντέγραψε αυτό το link στον browser σου:</p>
          <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px; font-size: 12px;">
            ${resetLink}
          </p>
          <p><strong>Το link ισχύει για 1 ώρα.</strong></p>
          <p>Αν δεν ζήτησες εσύ επαναφορά κωδικού, αγνόησε αυτό το email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Fast Delivery - Αλεξανδρούπολη</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    console.log(`📧 Sending password reset email to: ${email}`);
    
    const result = await sendEmailWithBrevo(email, '🔐 Επαναφορά Κωδικού - Fast Delivery', htmlContent);
    return result;
  } catch (error) {
    console.error('❌ Email service error:', error.message);
    return { success: false, error: error.message };
  }
};
