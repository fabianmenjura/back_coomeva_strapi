'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const htmlPdf = require('html-pdf');
const ejs = require('ejs');

module.exports = {
  fetchExternalData: async () => {
    try {
      const response = await axios.get('http://localhost:1337/api/presentacions');
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener datos: ', error);
      throw new Error('Error al obtener datos');
    }
  },

  generatePDF: async (data) => {
    const templatePath = path.join(__dirname, 'template.ejs');
    const htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

    // Construir las rutas absolutas del logo y el fondo
    const logoPath = path.resolve(__dirname, '../../../../public/images/logo.png');
    const fondoPath = path.resolve(__dirname, '../../../../public/images/fondo.png');
    const fontPath = path.resolve(__dirname, '../../../../public/fonts/Nunito-Medium.ttf');

    // Leer los archivos y convertir a base64
    const logoData = fs.readFileSync(logoPath).toString('base64');
    const fondoData = fs.readFileSync(fondoPath).toString('base64');

    // Crear URLs en base64
    const logoUrl = `data:image/png;base64,${logoData}`;
    const fondoUrl = `data:image/jpeg;base64,${fondoData}`;

    // Renderizar el HTML con los datos y las URLs de las imágenes
    const htmlContent = ejs.render(htmlTemplate, { data, logoUrl, fondoUrl, fontPath });

    const options = { format: 'A4'};
    const filePath = path.join(__dirname, '../../../../public/uploads/pdf', 'output.pdf');

    return new Promise((resolve, reject) => {
      htmlPdf.create(htmlContent, options).toFile(filePath, (err, res) => {
        if (err) return reject(err);
        resolve(filePath);
      });
    });
  }
};
