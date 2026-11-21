const cron = require('node-cron');
const { subDays, startOfDay, endOfDay } = require('date-fns');
const ConnectionRequest = require('../model/connectionRequest');
const { sendEmail } = require('./sendEmail');

const initCronJobs = () => {
  // Schedule a daily job at 08:00 AM every day: "0 8 * * *"
  // For easy dev verification, can also be triggered programmatically
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron Job] Running daily pending connection requests digest...');
    try {
      const yesterday = subDays(new Date(), 1);
      const yesterdayStart = startOfDay(yesterday);
      const yesterdayEnd = endOfDay(yesterday);

      const pendingRequests = await ConnectionRequest.find({
        status: 'interested',
        createdAt: {
          $gte: yesterdayStart,
          $lt: yesterdayEnd,
        },
      }).populate('fromUserId', 'firstName lastName').populate('toUserId', 'firstName emailId');

      // Group by recipient
      const userRequestsMap = new Map();
      for (const req of pendingRequests) {
        if (!req.toUserId || !req.toUserId.emailId) continue;
        const recipientEmail = req.toUserId.emailId;
        const senderName = `${req.fromUserId?.firstName || 'A developer'} ${req.fromUserId?.lastName || ''}`.trim();

        if (!userRequestsMap.has(recipientEmail)) {
          userRequestsMap.set(recipientEmail, {
            recipientName: req.toUserId.firstName || 'Developer',
            senders: [],
          });
        }
        userRequestsMap.get(recipientEmail).senders.push(senderName);
      }

      // Send digest emails
      for (const [email, data] of userRequestsMap.entries()) {
        const count = data.senders.length;
        const subject = `You have ${count} new connection request${count > 1 ? 's' : ''} on DevConnect!`;
        const senderListHtml = data.senders.map((name) => `<li><strong>${name}</strong> wants to connect</li>`).join('');
        const html = `
          <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #6366f1;">Hi ${data.recipientName},</h2>
            <p>You received <strong>${count}</strong> new connection request${count > 1 ? 's' : ''} yesterday on DevConnect:</p>
            <ul>${senderListHtml}</ul>
            <p>Log in now to review and connect with fellow developers!</p>
            <div style="margin: 25px 0;">
              <a href="https://devconnect.quest/requests" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Requests</a>
            </div>
            <p style="color: #94a3b8; font-size: 12px;">Happy Networking,<br/>The DevConnect Team</p>
          </div>
        `;

        await sendEmail({
          toEmail: email,
          subject,
          bodyHtml: html,
          bodyText: `Hi ${data.recipientName}, you have ${count} new connection request(s) on DevConnect. Check them out at DevConnect!`,
        });
      }

      console.log(`[Cron Job] Processed digest for ${userRequestsMap.size} users.`);
    } catch (error) {
      console.error('[Cron Job Error]:', error.message);
    }
  });

  console.log('[Cron Job] Initialized daily notification scheduler (08:00 AM daily).');
};

module.exports = { initCronJobs };
