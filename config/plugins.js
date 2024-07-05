module.exports = ({ env }) => ({
    email: {
      provider: 'sendgrid',
      providerOptions: {
        apiKey: env('SENDGRID_API_KEY'),
      },
      settings: {
        defaultFrom: 'fmenjura@existaya.com',
        defaultReplyTo: 'fmenjura@existaya.com',
      },
    },
  });
  
