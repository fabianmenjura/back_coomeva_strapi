"use strict";
const axios = require("axios");
const { createCoreController } = require("@strapi/strapi").factories;
const _ = require("lodash");
const path = require("path");
const fs = require("fs");
const FormData = require("form-data");

module.exports = createCoreController(
  "api::presentacion.presentacion",
  ({ strapi }) => ({
    /*============================================================================
                      LISTAR TODAS PRESENTACONES
==============================================================================*/
    /**
     * @descripcion Obtiene las presentaciones del usuario autenticado,
     * poblando los servicios asociados, sus banners y la empresa asociada con su imagen.
     * @proyecto Portafolio Coomeva
     * @autor
     */
    /**
     * Buscar presentaciones del usuario autenticado.
     *
     * @async
     * @función findUserPresentations
     * @param {Object} ctx - El objeto de contexto que contiene la solicitud y la respuesta.
     * @param {Object} ctx.state - El estado del contexto.
     * @param {Object} ctx.state.user - El usuario autenticado.
     * @returns {Promise<Object>} Las presentaciones del usuario autenticado, incluyendo sus servicios asociados, banners, empresa asociada e imagen.
     * @throws {Error} Si el usuario no está autenticado o si hay un error durante el proceso de búsqueda.
     */

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

    /*============================================================================
                      CONTAR UNA PRESENTACÓN
==============================================================================*/
    /**
     * @description Obtiene una presentación específica por ID, asegurándose de
     * que pertenezca al usuario autenticado, y estructura la respuesta
     * agrupando los servicios por motivador.
     *
     * @async
     * @function findOnePresentation
     * @param {object} ctx - Contexto de la solicitud proporcionado por Strapi.
     * @param {object} ctx.state.user - Usuario autenticado.
     * @param {object} ctx.params.id - ID de la presentación a buscar.
     * @returns {object} - Respuesta transformada con la presentación específica.
     *
     * @throws {UnauthorizedError} - Si el usuario no está autenticado.
     * @throws {NotFoundError} - Si la presentación no se encuentra o no pertenece al usuario autenticado.
     */

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

    /*============================================================================
                      ACTUALIZAR PRESENTACÓN
==============================================================================*/
    /**
     * @description Actualiza una presentación específica del usuario autenticado.
     * Si el estado de la presentación es "Enviado", genera un PDF,
     * mueve archivos PDF según el valor agregado, y envía datos al API de TopLeads.
     *
     * @async
     * @function updateUserPresentation
     * @param {object} ctx - Contexto de la solicitud proporcionado por Strapi.
     * @param {object} ctx.state.user - Usuario autenticado.
     * @param {object} ctx.params.id - ID de la presentación a actualizar.
     * @param {object} ctx.request.body.data - Datos para actualizar la presentación.
     * @returns {object} - Respuesta de la presentación actualizada.
     *
     * @throws {UnauthorizedError} - Si el usuario no está autenticado o no es el autor de la presentación.
     * @throws {NotFoundError} - Si la presentación no se encuentra o no pertenece al usuario autenticado.
     */
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

        // Verificar si hay un valor_agregado asociado
        // console.log(existingEntity.valor_agregado);
        if (
          existingEntity.valor_agregado &&
          ctx.request.body.data.valor_agregado != null
        ) {
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
            const protocol = ctx.request.protocol;
            const host = ctx.request.header.host;
            const ruta = path
              .join("uploads", "ValorAgregadoPDF", pdfName)
              .replace(/\\/g, "/"); // Normalizar el separador de directorios en la ruta final
            // Actualizar el campo PDF con la nueva ubicación en la base de datos de Strapi
            ctx.request.body.data.ValorAgregadoPDF = `${protocol}://${host}/${ruta}`;
            // console.log(ctx.request.body.data.ValorAgregadoPDF); return false;
          } catch (error) {
            console.error("Error al copiar el archivo PDF:", error);
          }
        } else {
          ctx.request.body.data.valor_agregado = null;
          ctx.request.body.data.ValorAgregadoPDF = null;
          console.error("El campo valor_agregado o PDF no está definido.");
        }
        const response = await super.update(ctx);

        /*============================================================================
                      ENVIAR DATOS A TOPLEADS
==============================================================================*/
        try {
          // Consultar información del usuario desde la colección de usuarios de Strapi
          const userD = await strapi.db
            .query("plugin::users-permissions.user")
            .findOne({
              where: { id: user.id },
            });
          const valorAgregadoPDF = response.data.attributes.ValorAgregadoPDF ? response.data.attributes.ValorAgregadoPDF : 0;
          const fullName = response.data.attributes.Nombre_Responsable;
          const partsName = fullName.split(' ');
          const firstName = partsName[0];
          const lastName = partsName.slice(1).join(' ');

          // Preparar los datos que se enviarán a TopLeads
          var formData = new FormData();
          formData.append("id", id);
          formData.append("createdAt", response.data.attributes.createdAt);
          formData.append("updatedAt", response.data.attributes.updatedAt);
          formData.append("cargo", response.data.attributes.Cargo);
          formData.append("celular", response.data.attributes.Celular);
          formData.append("correo", response.data.attributes.Correo);
          formData.append("firstName", firstName);
          formData.append("lastName", lastName);
          formData.append("downloadPDF", response.data.attributes.DownloadPDF);
          formData.append("estado", response.data.attributes.Estado);
          formData.append("valorAgregadoPDF", valorAgregadoPDF);
          formData.append("nombreEmpresa", response.data.attributes.Nombre_Empresa);
          //Asesor
          formData.append("idAsesor", userD.id);
          formData.append("nombresAsesor", userD.Nombres);
          formData.append("apellidosAsesor", userD.Apellidos);
          formData.append("cargoAsesor", userD.Cargo);
          formData.append("telefonoAsesor", userD.Telefono);
          formData.append("emailAsesor", userD.email);

          console.log("Datos enviados a TopLeads ", formData);
          //return false;
          // Enviar los datos a la API de TopLeads utilizando axios
          const postResponse = await axios.post(
            "https://api.topleads.co/api/portafolio-coomeva/crear-contacto",
            formData,
            {
              headers: {
                ...formData.getHeaders(),
              },
            }
          );
          console.log("Respuesta TopLeads" , postResponse.data);
          // return false;
        } catch (error) {
          // Manejo de errores
          console.error("Error al enviar datos a TopLeads:", error);
        }
        /*============================================================================
                      FIN ENVÍO DATOS A TOPLEADS
==============================================================================*/
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

    /*============================================================================
                      ELIMINAR PRESENTACÓN
==============================================================================*/
    /**
     * @description Elimina una presentación específica del usuario autenticado.
     *
     * @async
     * @function deleteUserPresentation
     * @param {object} ctx - Contexto de la solicitud proporcionado por Strapi.
     * @param {object} ctx.state.user - Usuario autenticado.
     * @param {object} ctx.params.id - ID de la presentación a eliminar.
     * @returns {object} - Respuesta de la presentación eliminada.
     *
     * @throws {UnauthorizedError} - Si el usuario no está autenticado o no es el autor de la presentación.
     */
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

    /*============================================================================
                      CREAR PRESENTACÓN
==============================================================================*/
    /**
     * @archivo Controlador Personalizado para crear Presentaciones
     * @descripcion Este archivo contiene los métodos del controlador personalizado para manejar operaciones relacionadas con presentaciones en el proyecto Portafolio Coomeva.
     * @proyecto Portafolio Coomeva
     * @autor GitHub: 53685320+fabianmenjura@users.noreply.github.com
     */

    /**
     * Crear una nueva presentación.
     *
     * @async
     * @función createUserPresentation
     * @param {Object} ctx - El objeto de contexto de Koa que contiene la solicitud y la respuesta.
     * @param {Object} ctx.state.user - El usuario autenticado.
     * @param {Object} ctx.request.body.data - Los datos para crear la presentación.
     * @param {string} ctx.request.body.data.id_own_user - El ID del usuario propietario de la presentación.
     * @param {string} [ctx.request.body.data.valor_agregado] - El ID de la entrada asociada de valor_agregado.
     * @param {string} [ctx.request.body.data.ValorAgregadoPDF] - La URL del PDF de la entrada asociada de valor_agregado.
     * @returns {Promise<Object>} La presentación creada.
     * @throws {Error} Si el usuario no está autenticado o si hay un error durante el proceso de creación.
     */

    async createUserPresentation(ctx) {
      // Obtener el usuario autenticado
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized("Usuario no autenticado");
      }
      // Añadir el usuario autenticado como dueño de la presentación
      ctx.request.body.data.id_own_user = user.id;

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
