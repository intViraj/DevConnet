const { SESClient } = require('@aws-sdk/client-ses');

const REGION = process.env.AWS_REGION || 'us-east-1';

let sesClient = null;

if (process.env.AWS_ACCESS_KEY && process.env.AWS_SECRET) {
  sesClient = new SESClient({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
    },
  });
} else {
  // In development / demo mode when AWS credentials are not yet provided
  sesClient = {
    isMock: true,
    send: async (command) => {
      console.log('[SES Dev Mock] Email command received:', JSON.stringify(command, null, 2));
      return { MessageId: 'mock-ses-msg-' + Date.now() };
    },
  };
}

module.exports = { sesClient };
