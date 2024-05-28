'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/publico-objetivos/find-with-motivadores',
      handler: 'publico-objetivo.findWithMotivadores',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
