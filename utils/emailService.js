// emailService.js
const SibApiV3Sdk = require('sib-api-v3-sdk');
const logger = require('logger');
const AppError = require('./appError')

const dotenv = require("dotenv");
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' :
                 process.env.NODE_ENV === 'test' ? '.env.test' :
                 '.env.development';
dotenv.config({ path: envFile });

const apiKey = process.env.BREVO_API_KEY_DEV;
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKeyAuth = defaultClient.authentications['api-key'];
apiKeyAuth.apiKey = apiKey;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (to, subject, htmlContent) => {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { email: process.env.DEVELOPER_EMAIL };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    try {
        const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
        return response;
    } catch (error) {
        logger.error(error)
        return next(new AppError(error, 500))
    }
};

module.exports = { sendEmail };
