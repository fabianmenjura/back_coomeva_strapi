"use strict";

const fs = require("fs");
const path = require("path");
const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::valor-agregado.valor-agregado",
  ({ strapi }) => ({
    async create(ctx) {
      const user = ctx.state.user; // Obtener el usuario autenticado

      if (!user) {
        return ctx.unauthorized("Usuario no autenticado");
      }

      // Verificar y obtener los archivos y datos del cuerpo de la solicitud
      const { files } = ctx.request;
      const data = ctx.request.body;

      if (!data) {
        return ctx.badRequest(
          "Los datos del cuerpo de la solicitud son requeridos"
        );
      }

      if (!files || !files["files.PDF"]) {
        return ctx.badRequest("El archivo PDF es requerido");
      }

      const pdfFile = files["files.PDF"];
      const pdfName = `valor_agregado_${Date.now()}_${pdfFile.name}`;
      const relativeFolderPath = path.join("uploads", "pdf_no_enviado");
      const privateFolderPath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "public",
        "uploads",
        "pdf_no_enviado"
      );

      // Crear la carpeta si no existe
      if (!fs.existsSync(privateFolderPath)) {
        fs.mkdirSync(privateFolderPath, { recursive: true });
      }
              // Obtener el protocolo y el host de la solicitud
              const protocol = ctx.request.protocol;
              const host = ctx.request.header.host;
      const fullUrl = `${protocol}://${host}/${relativeFolderPath}/${pdfName}`;
      const filePath = path.join(privateFolderPath, pdfName);

      // Crear la entrada en la colección valor-agregado con la URL del archivo PDF
      const newEntry = await strapi.db
        .query("api::valor-agregado.valor-agregado")
        .create({
          data: {
            Titulo: pdfName,
            PDF: fullUrl, // Guardar la ruta del archivo en el campo PDF
            id_own_user: user.id, // Agregar el ID del usuario autenticado
          },
        });

      // Mover el archivo a la carpeta privada
      fs.renameSync(pdfFile.path, filePath);

      // Retornar la nueva entrada
      return newEntry;
    },

    async findUserValorAgregado(ctx) {
      const user = ctx.state.user; // Obtener el usuario autenticado
      if (!user) {
        return ctx.unauthorized("Usuario no autenticado");
      }

      // Filtrar presentaciones por el ID del usuario autenticado
      const entities = await strapi.db
        .query("api::valor-agregado.valor-agregado")
        .findMany({
          where: { id_own_user: user.id },
        });

      // Enviar la respuesta con los registros encontrados
      return this.transformResponse(entities);
    },
  })
);
