"use strict";
const axios = require("axios");
const { createCoreController } = require("@strapi/strapi").factories;
const _ = require("lodash");

module.exports = createCoreController(
  "api::presentacion.presentacion",
  ({ strapi }) => ({
    //METODO GET, LISTAR PRESENTACIONES
    async findUserPresentations(ctx) {
      const user = ctx.state.user; // Obtener el usuario autenticado

      if (!user) {
        return ctx.unauthorized("Usuario no autenticado");
      }

      // Filtrar presentaciones por el ID del usuario autenticado y poblar los servicios asociados, sus banners y la empresa asociada con su imagen
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
            empresa: {
              populate: {
                Imagen: true,
              },
            },
          },
        });

      // Clonar profundamente los datos antes de la sanitización
      const clonedEntities = _.cloneDeep(entities);

      // Sanitizar las entidades antes de devolverlas
      const sanitizedEntities = await this.sanitizeOutput(entities, ctx);

      // Reintroducir la información de empresa y su imagen en las entidades sanitizadas
      const transformedResponse = {
        data: sanitizedEntities.map((presentacion, index) => {
          const originalEntity = clonedEntities[index];

          return {
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
              empresa: originalEntity.empresa
                ? {
                    id: originalEntity.empresa.id,
                    attributes: {
                      ...originalEntity.empresa,
                      Imagen: {
                        data: originalEntity.empresa.Imagen
                          ? [originalEntity.empresa.Imagen]
                          : null,
                      },
                    },
                  }
                : null,
            },
          };
        }),
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
            empresa: {
              populate: {
                Imagen: true,
              },
            },
          },
        });

      if (!presentation) {
        return ctx.notFound("Presentación no encontrada");
      }

      // Clonar profundamente los datos antes de la sanitización
      const clonedPresentation = _.cloneDeep(presentation);

      // Sanitizar la presentación antes de devolverla
      const sanitizedPresentation = await this.sanitizeOutput(
        presentation,
        ctx
      );

      // Reintroducir la información de empresa y su imagen en la presentación sanitizada
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
            empresa: clonedPresentation.empresa
              ? {
                  id: clonedPresentation.empresa.id,
                  attributes: {
                    ...clonedPresentation.empresa,
                    Imagen: {
                      data: clonedPresentation.empresa.Imagen
                        ? [clonedPresentation.empresa.Imagen]
                        : null,
                    },
                  },
                }
              : null,
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
      const pdfResponse = await axios.get(
        "http://localhost:1337/api/pdf-generator/download-pdf"
      );
      const server = "http://localhost:1337"; //editar en produccion
      const downloadPDFUrl = server + pdfResponse.data.url;

      if (!user) {
        return ctx.unauthorized("Usuario no autenticado");
      }
      // Añadir el usuario autenticado como dueño de la presentación
      ctx.request.body.data.id_own_user = user.id;

      //Crear pdf y añadir a la presentación
      ctx.request.body.data.DownloadPDF = downloadPDFUrl;

      // Llamar a la función `create` del controlador base
      const response = await super.create(ctx);

      return response;
    },
  })
);
