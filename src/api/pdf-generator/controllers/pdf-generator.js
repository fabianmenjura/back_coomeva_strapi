'use strict';

module.exports = {
  async downloadPDF(ctx) {
    try {
      const data = await strapi.service('api::pdf-generator.pdf-generator').fetchExternalData();
      
      // Generar un timestamp para el nombre del archivo
      const timestamp = Date.now(); // Puedes usar también una biblioteca como uuid para un identificador único
      const fileName = `output_${timestamp}.pdf`;
      const filePath = await strapi.service('api::pdf-generator.pdf-generator').generatePDF(data, fileName);
  
      ctx.send({
        url: `${strapi.config.get('server.url')}/uploads/pdf/${fileName}`
      });
    } catch (error) {
      ctx.throw(500, 'Error al generar el PDF');
    }
  }
  
};
