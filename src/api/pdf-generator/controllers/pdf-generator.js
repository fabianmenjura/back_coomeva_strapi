'use strict';

module.exports = {
  async downloadPDF(ctx) {
    try {
      const data = await strapi.service('api::pdf-generator.pdf-generator').fetchExternalData();
      const filePath = await strapi.service('api::pdf-generator.pdf-generator').generatePDF(data);

      ctx.send({
        url: `${strapi.config.get('server.url')}/uploads/output.pdf`
      });
    } catch (error) {
      ctx.throw(500, 'Error al generar el PDF');
    }
  }
};
