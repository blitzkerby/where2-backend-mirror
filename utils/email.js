// const AWS = require("aws-sdk");
// // const SibApiV3Sdk = require('@getbrevo/brevo');
// const pug = require("pug");
// const htmlToText = require("html-to-text");
// const path = require('path');

// const dotenv = require("dotenv");
// const envFile = process.env.NODE_ENV === 'production' ? '.env.production' :
//                  process.env.NODE_ENV === 'test' ? '.env.test' :
//                  '.env.development';
// dotenv.config({ path: envFile });

// class Email {
//   constructor(user, url) {
//     this.to = user.email;
//     this.firstName = user.firstName || 
//                     (user.profile?.firstName) || 
//                     (user.name ? user.name.split(" ")[0] : 'Valued Customer');
//     this.url = url;
//     this.from = {
//       name: "Where2 Team",
//       email: process.env.EMAIL_FROM
//     };

//     // Configure AWS SDK
//     AWS.config.update({
//       accessKeyId: process.env.AWS_ACCESS_KEY_ID_SES,
//       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_SES,
//       region: process.env.AWS_REGION
//     });

//     this.ses = new AWS.SES({ apiVersion: '2010-12-01' });
//   }
    
//     // Properly initialize Brevo API
//     // this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
//     // this.apiInstance.setApiKey(SibApiV3Sdk.AccountApiApiKeys.apiKey, 
//     //   process.env.NODE_ENV !== 'production' 
//     //     ? process.env.BREVO_API_KEY_DEV 
//     //     : process.env.BREVO_API_KEY_PROD
//     // );

//   async send(template, subject, additionalData = {}) {
//     const templatePath = path.join(__dirname, '..', 'views', 'email', `${template}.pug`);

//     if (process.env.NODE_ENV !== 'production') {
//       console.log(`Starting to send ${template} email`);
//       console.log('Template path:', templatePath);
//       console.log('File exists:', require('fs').existsSync(templatePath));
//     }
    
//     try {
//       console.log('Rendering email template');
//       const html = pug.renderFile(templatePath, {
//         firstName: this.firstName,
//         url: this.url,
//         subject,
//         ...additionalData
//       });

//       const params = {
//         Destination: {
//           ToAddresses: [this.to]
//         },
//         Message: {
//           Body: {
//             Html: {
//               Charset: "UTF-8",
//               Data: html
//             },
//             Text: {
//               Charset: "UTF-8",
//               Data: htmlToText.convert(html)
//             }
//           },
//           Subject: {
//             Charset: "UTF-8",
//             Data: subject
//           }
//         },
//         Source: `${this.from.name} <${this.from.email}>`
//       };

//       console.log('Sending email');
//       const sendEmailPromise = this.ses.sendEmail(params).promise();
      
//       const timeoutPromise = new Promise((_, reject) =>
//         setTimeout(() => reject(new Error('Email send operation timed out')), 60000)
//       );
    
//       const result = await Promise.race([sendEmailPromise, timeoutPromise]);
//       console.log('Email sent successfully:', result);
//       return result;

//     } catch (error) {
//       console.error('Error sending email:', error);
//       throw error;
//     }
//   }

//   async sendVerificationCode(verificationCode) {
//     if (process.env.NODE_ENV !== 'production') {
//       console.log('Sending verification code email.');
//     }
//     try {
//       await this.send("verificationCode", "Your Verification Code", { verificationCode });
//     } catch (error) {
//       console.error('Failed to send verification code email:', error);
//       throw new Error('Failed to send verification code email');
//     }
//   }

//   async sendVerification() {
//     console.log('Sending verification email');
//     try {
//       await this.send("verification", "Please Verify Your Email Address");
//     } catch (error) {
//       console.error('Failed to send verification email:', error);
//       throw new Error('Failed to send verification email');
//     }
//   }

//   async sendResetPassword() {
//     console.log('Sending reset password email');
//     try {
//       await this.send("resetPassword", "Reset Your Password");
//     } catch (error) {
//       console.error('Failed to send reset password email:', error);
//       throw new Error('Failed to send reset password email');
//     }
//   }

//   async sendWelcome() {
//     console.log('Sending welcome email');
//     try {
//       await this.send("welcome", "Welcome to Where2!");
//     } catch (error) {
//       console.error('Failed to send welcome email:', error);
//       throw new Error('Failed to send welcome email');
//     }
//   }
// }

// module.exports = Email;

const SibApiV3Sdk = require('@getbrevo/brevo');
const pug = require("pug");
const nodemailer = require("nodemailer")
const htmlToText = require("html-to-text");
const path = require('path');

const dotenv = require("dotenv");
const logger = require('./logger');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' :
                 process.env.NODE_ENV === 'test' ? '.env.test' :
                 '.env.development';
dotenv.config({ path: envFile });

class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.firstName || 
                    (user.profile?.firstName) || 
                    (user.name ? user.name.split(" ")[0] : 'Valued Customer');
    this.url = url;
    this.from = {
      name: "Where2 Team",
      email: process.env.EMAIL_FROM
    };

    if (process.env.NODE_ENV === 'production') {
            // Configure Brevo API
            this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
            this.apiInstance.setApiKey(SibApiV3Sdk.AccountApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    } else {
          // USE MAILTRAP IN DEVELOPMENT
          this.transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            auth: {
              user: process.env.MAILTRAP_USER,
              pass: process.env.MAILTRAP_PASS
            }
    })
    }
  }

  async send(template, subject, additionalData = {}) {
    const templatePath = path.join(__dirname, '..', 'views', 'email', `${template}.pug`);
  
    try {
      console.log('Rendering email template');
      const html = pug.renderFile(templatePath, {
        firstName: this.firstName,
        url: this.url,
        subject,
        ...additionalData
      });
      const text = htmlToText.convert(html);
  
      if (process.env.NODE_ENV === 'production') {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.to = [{ email: this.to }];
        sendSmtpEmail.sender = { name: this.from.name, email: this.from.email };
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = html;
        sendSmtpEmail.textContent = text;
  
        console.log('Sending email via Brevo API');
        const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully via Brevo API:', result);
        return result;
  
      } else {
        // For non-production (using Mailtrap via Nodemailer)
        const mailOptions = {
          from: `"${this.from.name}" <${this.from.email}>`,
          to: this.to,
          subject: subject,
          html: html,
          text: text
        };
  
        console.log('Sending email via Mailtrap');
        const result = await this.transporter.sendMail(mailOptions);
        console.log('Email sent successfully via Mailtrap:', result);
        return result;
      }
  
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendVerificationCode(verificationCode) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Sending verification code email.');
    }
    try {
      await this.send("verificationCode", "Your Verification Code", { verificationCode });
    } catch (error) {
      console.error('Failed to send verification code email:', error);
      throw new Error('Failed to send verification code email');
    }
  }

  async sendVerification() {
    console.log('Sending verification email');
    try {
      await this.send("verification", "Please Verify Your Email Address");
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendResetPassword() {
    console.log('Sending reset password email');
    try {
      await this.send("resetPassword", "Reset Your Password");
    } catch (error) {
      console.error('Failed to send reset password email:', error);
      throw new Error('Failed to send reset password email');
    }
  }

  async sendWelcome() {
    console.log('Sending welcome email');
    try {
      await this.send("welcome", "Welcome to Where2!");
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  // Utility function for password change notification
  async sendPasswordChanged() {
    console.log('Sending password change notification email');
    try {
      await this.send("passwordChanged", "Your Password Has Been Changed");
    } catch (error) {
      console.error('Failed to send password change notification email:', error);
      throw new Error('Failed to send password change notification email');
    }
  }
}

module.exports = Email;