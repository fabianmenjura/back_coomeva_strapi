"use strict";
const axios = require("axios");
const { createCoreController } = require("@strapi/strapi").factories;
const _ = require("lodash");
const path = require("path");
const fs = require("fs");

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
            valor_agregado: true,
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
              valor_agregado: originalEntity.valor_agregado
                ? {
                    id: originalEntity.valor_agregado.id,
                    attributes: {
                      ...originalEntity.valor_agregado,
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
      const presentation = await strapi
        .query("api::presentacion.presentacion")
        .findOne({
          where: { id, id_own_user: user.id },
          //  where: { id:id},
          populate: {
            servicios: {
              populate: {
                motivador: true,
                Banner: true,
                PublicoObjetivo: true,
                empresa: true,
              },
            },
            empresa: {
              populate: {
                Imagen: true,
              },
            },
            valor_agregado: true,
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

      // Filtrar servicios que tienen motivador y agrupar por motivador
      const serviciosConMotivador = presentation.servicios.filter(
        (servicio) => servicio.motivador
      );

      const serviciosPorMotivador = _.groupBy(
        serviciosConMotivador,
        (servicio) => servicio.motivador.id
      );

      // Transformar la respuesta según la estructura deseada
      const transformedResponse = {
        data: {
          id: sanitizedPresentation.id,
          attributes: {
            ...sanitizedPresentation,
            servicios: undefined, // Eliminamos los servicios directos para luego estructurarlos por motivador
            motivador: Object.keys(serviciosPorMotivador).map((motivadorId) => {
              const motivador = serviciosPorMotivador[motivadorId][0].motivador; // Tomamos el primer servicio del motivador para obtener los datos del motivador
              return {
                id: motivador.id,
                attributes: {
                  ...motivador,
                  servicios: {
                    data: serviciosPorMotivador[motivadorId].map(
                      (servicio) => ({
                        id: servicio.id,
                        attributes: { ...servicio },
                      })
                    ),
                  },
                },
              };
            }),
            // empresa: clonedPresentation.empresa
            //   ? {
            //       id: clonedPresentation.empresa.id,
            //       attributes: {
            //         ...clonedPresentation.empresa,
            //         Imagen: {
            //           data: clonedPresentation.empresa.Imagen
            //             ? [clonedPresentation.empresa.Imagen]
            //             : null,
            //         },
            //       },
            //     }
            //   : null,
            valor_agregado: clonedPresentation.valor_agregado
              ? {
                  id: clonedPresentation.valor_agregado.id,
                  attributes: { ...clonedPresentation.valor_agregado },
                }
              : null,
          },
        },
        meta: {},
      };
      // Obtener motivadores de la API
      const todosMotivadores = await strapi
        .query("api::motivador.motivador")
        .findMany({
          select: ["id", "Titulo", "Color", "Slug"],
        });

      // Crear un Set de IDs de motivadores que tienen servicios
      const motivadoresConServiciosIds = new Set(
        transformedResponse.data.attributes.motivador.map(
          (motivador) => motivador.id
        )
      );

      // Filtrar motivadores sin servicios
      const motivadoresSinServicios = todosMotivadores
        .filter((motivador) => !motivadoresConServiciosIds.has(motivador.id))
        .map((motivador) => ({
          id: motivador.id,
          attributes: {
            Titulo: motivador.Titulo,
            Slug: motivador.Slug,
            Color: motivador.Color,
          },
        }));

      // Agregar motivadores sin servicios a la respuesta
      transformedResponse.data.attributes.motivador.push(
        ...motivadoresSinServicios
      );
      // console.log(transformedResponse);
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
          populate: { valor_agregado: true },
        });

      if (!existingEntity) {
        return ctx.unauthorized("Solo autores");
      }

      ctx.request.body.data = {
        ...ctx.request.body.data,
        created_by_id: existingEntity.created_by_id, // Mantener el ID del creador original
      };

      // Verificar si el estado es "Enviado"
      if (ctx.request.body.data.Estado == "Enviado") {
        // crear pdf
        ctx.request.body.data.DownloadPDF = null;
        const url = ctx.request.url;
        const match = url.match(/\/api\/presentaciones\/(\d+)$/);
        if (match) {
          const number = match[1];
          const pdfUrl = `https://strapipdf.existaya.com/generate.php?id=${number}`;
          const pdfResponse = await axios.get(pdfUrl);
          // console.log(pdfResponse.data.message); return false;
          ctx.request.body.data.DownloadPDF = pdfResponse.data.message;
        }
        console.log("La presentación ha sido enviada.");

        // Verificar si hay un valor_agregado asociado
        // console.log(existingEntity.valor_agregado);
        if (existingEntity.valor_agregado && ctx.request.body.data.valor_agregado != null) {
          let pdfPath = existingEntity.valor_agregado.PDF;
          // Normalizar la ruta para evitar problemas con los separadores
          pdfPath = pdfPath.replace(/\\/g, "/");

          // console.log(`PDF Path: ${pdfPath}`);
          const pdfName = path.basename(pdfPath);

          // Ruta del archivo en el sistema de archivos
          const fullPdfPath = path.join(
            __dirname,
            "..",
            "..",
            "..",
            "..",
            "public",
            "uploads",
            "pdf_no_enviado",
            pdfName
          );

          // Ruta de destino en el sistema de archivos
          const publicFolderPath = path.join(
            __dirname,
            "..",
            "..",
            "..",
            "..",
            "public",
            "uploads",
            "ValorAgregadoPDF"
          );

          const publicFilePath = path.join(publicFolderPath, pdfName);

          try {
            // Verificar si el archivo de origen existe
            if (!fs.existsSync(fullPdfPath)) {
              console.error("El archivo de origen no existe:", fullPdfPath);
              ctx.throw(400, "El archivo de origen no existe.");
              return;
            }

            // Crear la carpeta pública si no existe
            if (!fs.existsSync(publicFolderPath)) {
              fs.mkdirSync(publicFolderPath, { recursive: true });
            }

            // Copiar el archivo PDF de la carpeta privada a la carpeta pública
            fs.copyFileSync(fullPdfPath, publicFilePath);
            // console.log(publicFilePath); return false;
            // Actualizar el campo PDF con la nueva ubicación en la base de datos de Strapi
            ctx.request.body.data.ValorAgregadoPDF = publicFilePath.replace(
              /\\/g,
              "/"
            ); // Normalizar el separador de directorios en la ruta final;
            // console.log(ctx.request.body.data.ValorAgregadoPDF); return false;
          } catch (error) {
            console.error("Error al copiar el archivo PDF:", error);
          }
        } else {
          ctx.request.body.data.valor_agregado = null;
          ctx.request.body.data.ValorAgregadoPDF = null;
          console.error("El campo valor_agregado o PDF no está definido.");
        }
      } else {
        // Verificar si se proporciona valor_agregado y extraer el campo PDF
        if (ctx.request.body.data.valor_agregado) {
          const valorAgregadoId = ctx.request.body.data.valor_agregado;

          // Buscar el valor_agregado en la base de datos
          const valorAgregado = await strapi.db
            .query("api::valor-agregado.valor-agregado")
            .findOne({
              where: { id: valorAgregadoId },
            });

          if (valorAgregado && valorAgregado.PDF) {
            ctx.request.body.data.ValorAgregadoPDF = valorAgregado.PDF;
          }
        } else {
          ctx.request.body.data.valor_agregado = null;
          ctx.request.body.data.ValorAgregadoPDF = null;
        }
      }

      // Llamar a la función `update` del controlador base para actualizar la presentación
      const response = await super.update(ctx);

      // Si se proporciona la relación empresa, actualizarla
      if (ctx.request.body.data.empresa) {
        await strapi.db.query("api::empresa.empresa").update({
          where: { id: ctx.request.body.data.empresa.id },
          data: ctx.request.body.data.empresa,
        });
      }

      // Si se proporcionan los servicios, actualizarlos
      if (ctx.request.body.data.servicios) {
        for (const servicio of ctx.request.body.data.servicios) {
          await strapi.db.query("api::servicio.servicio").update({
            where: { id: servicio.id },
            data: servicio,
          });
        }
      }
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

      // const server = "http://localhost:1337"; //editar en produccion
      // const downloadPDFUrl = server + pdfResponse.data.url;

      if (!user) {
        return ctx.unauthorized("Usuario no autenticado");
      }
      // Añadir el usuario autenticado como dueño de la presentación
      ctx.request.body.data.id_own_user = user.id;

      //Crear pdf y añadir a la presentación
      // ctx.request.body.data.DownloadPDF = downloadPDFUrl;

      // Verificar si se proporciona valor_agregado y extraer el campo PDF
      if (ctx.request.body.data.valor_agregado) {
        const valorAgregadoId = ctx.request.body.data.valor_agregado;

        // Buscar el valor_agregado en la base de datos
        const valorAgregado = await strapi.db
          .query("api::valor-agregado.valor-agregado")
          .findOne({
            where: { id: valorAgregadoId },
          });

        if (valorAgregado && valorAgregado.PDF) {
          ctx.request.body.data.ValorAgregadoPDF = valorAgregado.PDF;
        }
      }
      // Llamar a la función `create` del controlador base
      const response = await super.create(ctx);

      return response;
    },
  })
);
