'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/presentaciones',
      handler: 'custom-presentacion.createUserPresentation',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/presentaciones/mine',
      handler: 'custom-presentacion.findUserPresentations',
      config: {
        policies: [],
      },
    },
    {
      method: 'PUT',
      path: '/presentaciones/:id',
      handler: 'custom-presentacion.updateUserPresentation',
      config: {
        policies: [],
      },
    },
    {
      method: 'DELETE',
      path: '/presentaciones/:id',
      handler: 'custom-presentacion.deleteUserPresentation',
      config: {
        policies: [],
      },
    },
  ],
};
