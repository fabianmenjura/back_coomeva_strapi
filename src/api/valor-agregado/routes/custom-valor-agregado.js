'use strict';

/**
 * valor-agregado router
 */

module.exports = {
    routes: [
      {
        method: 'POST',
        path: '/valor-agregado',
        handler: 'valor-agregado.create',
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ],
  };