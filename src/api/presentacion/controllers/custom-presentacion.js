'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::presentacion.presentacion', ({ strapi }) => ({

 //METODO GET, LISTAR PRESENTACIONES
  async findUserPresentations(ctx) {
    const user = ctx.state.user;  // Obtener el usuario autenticado

    if (!user) {
      return ctx.unauthorized('User not authenticated');
    }

    // Filtrar presentaciones por el ID del usuario autenticado
    const entities = await strapi.db.query('api::presentacion.presentacion').findMany({
      where: { id_own_user: user.id },
    });

    // Sanitizar las entidades antes de devolverlas
    const sanitizedEntities = await this.sanitizeOutput(entities, ctx);

    return this.transformResponse(sanitizedEntities);
  },

  async updateUserPresentation(ctx) {
    const user = ctx.state.user;  // Obtener el usuario autenticado

    if (!user) {
      return ctx.unauthorized('User not authenticated');
    }

    const { id } = ctx.params;

    // Verificar que la presentación que se está actualizando pertenece al usuario autenticado
    const existingEntity = await strapi.db.query('api::presentacion.presentacion').findOne({
      where: { id, created_by_id: user.id },
    });

    if (!existingEntity) {
      return ctx.unauthorized('You can only update your own presentations');
    }

    // Asegurarse de que el campo created_by_id no cambie
    ctx.request.body.data = {
      ...ctx.request.body.data,
      created_by_id: existingEntity.created_by_id,  // Mantener el ID del creador original
    };

    // Llamar a la función `update` del controlador base
    const response = await super.update(ctx);

    return response;
  },

  //=========================
  //ELIMINAR
  async deleteUserPresentation(ctx) {
    const user = ctx.state.user;  // Obtener el usuario autenticado

    if (!user) {
      return ctx.unauthorized('User not authenticated');
    }

    const { id } = ctx.params;

    // Verificar que la presentación que se está eliminando pertenece al usuario autenticado
    const existingEntity = await strapi.db.query('api::presentacion.presentacion').findOne({
      where: { id, created_by_id: user.id },
    });

    if (!existingEntity) {
      return ctx.unauthorized('You can only delete your own presentations');
    }

    // Llamar a la función `delete` del controlador base
    const response = await super.delete(ctx);

    return response;
  },

  //Crear presentaciones
  async createUserPresentation(ctx) {
    const user = ctx.state.user;  // Obtener el usuario autenticado

    if (!user) {
      return ctx.unauthorized('User not authenticated');
    }

    ctx.request.body.data.id_own_user = user.id;
    

    // Añadir el usuario autenticado como creador de la presentación
    // ctx.request.body.data = {
    //   ...ctx.request.body.data,
    //   created_by_id: user.id,  // Usar solo el ID del usuario
    // };

    // Llamar a la función `create` del controlador base
    const response = await super.create(ctx);

    return response;
  },
}));