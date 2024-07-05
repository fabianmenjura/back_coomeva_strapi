// path: ./src/api/email/controllers/email.js

module.exports = {
    async sendTestEmail(ctx) {
      try {
        await strapi.plugins['email'].services.email.send({
          to: 'fabianesneider39@gmail.com',
          from: 'fmenjura@existaya.com',
          subject: 'Test Email',
          text: 'This is a test email sent using SendGrid.',
          html: '<p>This is a test email sent using SendGrid.</p>',
        });
        ctx.send({ message: 'Email sent successfully' });
      } catch (error) {
        ctx.send({ error: error.message });
      }
    },
  };
  