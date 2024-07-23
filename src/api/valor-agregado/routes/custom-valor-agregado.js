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
      {
        method: 'GET',
        path: '/valor-agregado/mine',
        handler: 'valor-agregado.findUserValorAgregado',
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ],
  };