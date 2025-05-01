import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  })
}

// Customize password reset email template
admin.auth().updateConfig({
  passwordResetTemplate: {
    subject: 'Reset your TruckNest password',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Reset Your TruckNest Password</h2>
        
        <p>Hello,</p>
        
        <p>We received a request to reset your password for your TruckNest account. 
           Click the button below to choose a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{LINK}" style="
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
          ">Reset Password</a>
        </div>
        
        <p>This link will expire in 1 hour for security reasons.</p>
        
        <p>If you didn't request this password reset, you can safely ignore this email. 
           Your password won't be changed until you create a new one.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            For security:
            <br>• Never share this link with anyone
            <br>• We'll never ask for your password via email
            <br>• Change your password immediately if you suspect unauthorized access
          </p>
        </div>
      </div>
    `,
    replyTo: 'support@trucknest.com'
  }
})

export { admin as firebaseAdmin } 