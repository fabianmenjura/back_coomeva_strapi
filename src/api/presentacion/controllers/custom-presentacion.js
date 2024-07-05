"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::presentacion.presentacion",
  ({ strapi }) => ({
    //METODO GET, LISTAR PRESENTACIONES
    async findUserPresentations(ctx) {
      const user = ctx.state.user; // Obtener el usuario autenticado

      if (!user) {
        return ctx.unauthorized("Usuario no autenticado");
      }

      // Filtrar presentaciones por el ID del usuario autenticado y poblar los servicios asociados y sus banners
      const entities = await strapi.db
        .query("api::presentacion.presentacion")
        .findMany({
          where: { id_own_user: user.id },
          populate: {
            servicios: {
              populate: {
                Banner: true,
              },
            },
          },
        });

      // Sanitizar las entidades antes de devolverlas
      const sanitizedEntities = await this.sanitizeOutput(entities, ctx);

      // Transformar la respuesta para que cumpla con la estructura deseada
      const transformedResponse = {
        data: sanitizedEntities.map((presentacion) => ({
          id: presentacion.id,
          attributes: {
            ...presentacion,
            servicios: {
              data: presentacion.servicios.map((servicio) => ({
                id: servicio.id,
                attributes: {
                  ...servicio,
                  Banner: {
                    data: servicio.Banner ? [servicio.Banner] : null,
                  },
                },
              })),
            },
          },
        })),
        meta: {},
      };

      return this.transformResponse(transformedResponse);
    },

    async findOnePresentation(ctx) {
      const user = ctx.state.user; // Obtener el usuario autenticado

      if (!user) {
        return ctx.unauthorized("Usuario no autenticado");
      }

      const { id } = ctx.params;

      // Buscar una presentación específica por ID y verificar que pertenezca al usuario autenticado
      const presentation = await strapi.db
        .query("api::presentacion.presentacion")
        .findOne({
          where: { id, id_own_user: user.id },
          populate: {
            servicios: {
              populate: {
                Banner: true,
              },
            },
          },
        });

      if (!presentation) {
        return ctx.notFound("Presentación no encontrada");
      }

      // Sanitizar la presentación antes de devolverla
      const sanitizedPresentation = await this.sanitizeOutput(
        presentation,
        ctx
      );

      // Transformar la respuesta para que cumpla con la estructura deseada
      const transformedResponse = {
        data: {
          id: sanitizedPresentation.id,
          attributes: {
            ...sanitizedPresentation,
            servicios: {
              data: sanitizedPresentation.servicios.map((servicio) => ({
                id: servicio.id,
                attributes: {
                  ...servicio,
                  Banner: {
                    data: servicio.Banner ? [servicio.Banner] : null,
                  },
                },
              })),
            },
          },
        },
        meta: {},
      };

      return this.transformResponse(transformedResponse);
    },

    async updateUserPresentation(ctx) {
      const user = ctx.state.user; // Obtener el usuario autenticado

      if (!user) {
        return ctx.unauthorized("Usuario no autenticado");
      }

      const { id } = ctx.params;

      // Verificar que la presentación que se está actualizando pertenece al usuario autenticado
      const existingEntity = await strapi.db
        .query("api::presentacion.presentacion")
        .findOne({
          where: { id, id_own_user: user.id },
        });

      if (!existingEntity) {
        return ctx.unauthorized("Solo autores");
      }

      ctx.request.body.data = {
        ...ctx.request.body.data,
        created_by_id: existingEntity.created_by_id, // Mantener el ID del creador original
      };

      // Llamar a la función `update` del controlador base
      const response = await super.update(ctx);

      return response;
    },

    //=========================
    //ELIMINAR
    async deleteUserPresentation(ctx) {
      const user = ctx.state.user; // Obtener el usuario autenticado

      if (!user) {
        return ctx.unauthorized("Usuario no autenticado");
      }

      const { id } = ctx.params;

      // Verificar que la presentación que se está eliminando pertenece al usuario autenticado
      const existingEntity = await strapi.db
        .query("api::presentacion.presentacion")
        .findOne({
          where: { id, id_own_user: user.id },
        });

      if (!existingEntity) {
        return ctx.unauthorized("Solo autores");
      }

      // Llamar a la función `delete` del controlador base
      const response = await super.delete(ctx);

      return response;
    },

    //Crear presentaciones
    async createUserPresentation(ctx) {
      const user = ctx.state.user; // Obtener el usuario autenticado

      if (!user) {
        return ctx.unauthorized("Usuario no autenticado");
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
  })
);
