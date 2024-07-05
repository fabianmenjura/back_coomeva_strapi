// path: ./src/api/email/routes/email.js

module.exports = {
    routes: [
      {
        method: 'GET',
        path: '/send-test-email',
        handler: 'email.sendTestEmail',
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ],
  };
  