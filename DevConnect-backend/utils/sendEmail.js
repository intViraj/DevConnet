const { SendEmailCommand } = require('@aws-sdk/client-ses');
const { sesClient } = require('./sesClient');

const sendEmail = async ({ toEmail, subject, bodyHtml, bodyText }) => {
  const fromEmail = process.env.SES_FROM_EMAIL || 'notifications@devconnect.quest';

  const createSendEmailCommand = (toAddress, fromAddress) => {
    return new SendEmailCommand({
      Destination: {
        CcAddresses: [],
        ToAddresses: [toAddress],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: bodyHtml || bodyText || '',
          },
          Text: {
            Charset: 'UTF-8',
            Data: bodyText || '',
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
      Source: fromAddress,
      ReplyToAddresses: [],
    });
  };

  try {
    const sendEmailCommand = createSendEmailCommand(toEmail, fromEmail);
    const response = await sesClient.send(sendEmailCommand);
    console.log(`Email successfully dispatched to ${toEmail}:`, response.MessageId || 'OK');
    return response;
  } catch (err) {
    console.error(`Failed to dispatch email to ${toEmail}:`, err.message);
    return null;
  }
};

module.exports = { sendEmail };
