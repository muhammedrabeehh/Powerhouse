const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendNewBillNotification = async (users, billDetails) => {
    // Filter active users with emails
    const activeUsers = users.filter(u => u.email);

    if (activeUsers.length === 0) {
        console.log('No recipients found for bill notification.');
        return;
    }

    // Send individual emails
    for (const user of activeUsers) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: `New Bill: ${billDetails.description || 'Monthly Expenses'}`,
                html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px;">
                <h2 style="color: #6366f1;">New Bill Posted</h2>
                <p>Hi ${user.name},</p>
                <p>A new bill has been added by the admin.</p>
                
                <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">Description</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${billDetails.description}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">Total Amount</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">₹${billDetails.totalAmount}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">Your Share</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #6366f1;">₹${billDetails.individualShare}</td>
                    </tr>
                </table>

                <p>Please login to the <a href="http://localhost:5001/user/login">User Portal</a> to upload your payment proof.</p>
                <p style="color: #888; font-size: 0.8em; margin-top: 20px;">Powerhouse Mgmt</p>
            </div>
          `,
            };

            await transporter.sendMail(mailOptions);
            console.log(`Notification sent to ${user.email}`);
        } catch (error) {
            console.error(`Failed to send notification to ${user.email}:`, error.message);
        }
    }
};

const sendReminder = async (user, billDetails) => {
    if (!user.email) return;

    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: `REMINDER: Unpaid Bill - ${billDetails.description}`,
            html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px;">
            <h2 style="color: #ef4444;">Payment Reminder</h2>
            <p>Hi ${user.name},</p>
            <p>This is a gentle reminder that your share of <strong>₹${billDetails.individualShare}</strong> for the bill "<strong>${billDetails.description}</strong>" is still Unpaid.</p>
            
            <a href="http://localhost:5001/user/login" style="display: inline-block; background: #6366f1; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Pay Now</a>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Reminder sent to ${user.email}: ` + info.response);
    } catch (error) {
        console.error(`Error sending reminder to ${user.email}:`, error);
    }
};

const sendPaymentReceipt = async (user, billDetails) => {
    if (!user.email) return;

    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: `Payment Receipt: ${billDetails.description || 'Monthly Expenses'}`,
            html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px;">
            <h2 style="color: #10b981;">Payment Received</h2>
            <p>Hi ${user.name},</p>
            <p>Your payment has been approved by the admin.</p>
            
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">Bill</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${billDetails.description}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">Amount Paid</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #10b981;">₹${billDetails.individualShare}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">Date</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date().toLocaleDateString()}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">Status</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; color: #10b981; font-weight: bold;">PAID</td>
                </tr>
            </table>

            <p style="color: #888; font-size: 0.8em; margin-top: 20px;">Powerhouse Mgmt</p>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Receipt sent to ${user.email}: ` + info.response);
    } catch (error) {
        console.error(`Error sending receipt to ${user.email}:`, error);
    }
};

module.exports = {
    sendNewBillNotification,
    sendReminder,
    sendPaymentReceipt
};
