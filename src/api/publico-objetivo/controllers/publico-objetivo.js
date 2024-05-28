'use strict';

// Importar la función createCoreController de las fábricas de Strapi
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::publico-objetivo.publico-objetivo', ({ strapi }) => ({
  // Definir un nuevo método asincrónico llamado findWithMotivadores
  async findWithMotivadores(ctx) {
    try {
      // Realizar una consulta para obtener los 'publico-objetivos' con sus 'motivadors' y 'servicios' relacionados
      const publicoObjetivos = await strapi.db.query('api::publico-objetivo.publico-objetivo').findMany({
        populate: {
          motivadors: {  // Poblar (incluir) los datos relacionados de los motivadores
            populate: {
              Banner: true,  // Incluir los datos relacionados de los banners dentro de los motivadores
              servicios: {  // Incluir los datos relacionados de los servicios dentro de los motivadores
                populate: {
                  Banner: true  // Incluir los datos relacionados de los banners dentro de los servicios
                }
              }
            }
          }
        }
      });

      // Mapear los datos obtenidos para transformarlos en el formato deseado
      const data = publicoObjetivos.map(publicoObjetivo => ({
        id: publicoObjetivo.id,  // ID del 'publico-objetivo'
        attributes: {
          Nombre: publicoObjetivo.Nombre,  // Nombre del 'publico-objetivo'
          motivadors: {
            data: publicoObjetivo.motivadors.map(motivador => ({
              id: motivador.id,  // ID del motivador
              attributes: {
                Titulo: motivador.Titulo,  // Título del motivador
                Slug: motivador.Slug,  // Slug del motivador
                Descripcion: motivador.Descripcion,  // Descripción del motivador
                createdAt: motivador.createdAt,  // Fecha de creación del motivador
                updatedAt: motivador.updatedAt,  // Fecha de actualización del motivador
                publishedAt: motivador.publishedAt,  // Fecha de publicación del motivador
                Banner: motivador.Banner ? {  // Si el motivador tiene un banner, incluir los detalles del banner
                  data: motivador.Banner.map(banner => ({
                    id: banner.id,  // ID del banner
                    attributes: {
                      name: banner.name,  // Nombre del banner
                      alternativeText: banner.alternativeText,  // Texto alternativo del banner
                      caption: banner.caption,  // Subtítulo del banner
                      width: banner.width,  // Ancho del banner
                      height: banner.height,  // Altura del banner
                      formats: banner.formats,  // Formatos del banner
                      hash: banner.hash,  // Hash del banner
                      ext: banner.ext,  // Extensión del banner
                      mime: banner.mime,  // Tipo MIME del banner
                      size: banner.size,  // Tamaño del banner
                      url: banner.url,  // URL del banner
                      previewUrl: banner.previewUrl,  // URL de vista previa del banner
                      provider: banner.provider,  // Proveedor del banner
                      provider_metadata: banner.provider_metadata,  // Metadatos del proveedor del banner
                      createdAt: banner.createdAt,  // Fecha de creación del banner
                      updatedAt: banner.updatedAt  // Fecha de actualización del banner
                    }
                  }))
                } : null,  // Si no hay banner, establecer como null
                servicios: {
                  data: motivador.servicios.map(servicio => ({
                    id: servicio.id,  // ID del servicio
                    attributes: {
                      Titulo: servicio.Titulo,  // Título del servicio
                      Descripcion_Corta: servicio.Descripcion_Corta,  // Descripción corta del servicio
                      Descripcion_Ampliada: servicio.Descripcion_Ampliada,  // Descripción ampliada del servicio
                      Bullets: servicio.Bullets,  // Puntos clave del servicio
                      createdAt: servicio.createdAt,  // Fecha de creación del servicio
                      updatedAt: servicio.updatedAt,  // Fecha de actualización del servicio
                      publishedAt: servicio.publishedAt,  // Fecha de publicación del servicio
                      Banner: servicio.Banner ? {  // Si el servicio tiene un banner, incluir los detalles del banner
                        data: servicio.Banner.map(banner => ({
                          id: banner.id,  // ID del banner
                          attributes: {
                            name: banner.name,  // Nombre del banner
                            alternativeText: banner.alternativeText,  // Texto alternativo del banner
                            caption: banner.caption,  // Subtítulo del banner
                            width: banner.width,  // Ancho del banner
                            height: banner.height,  // Altura del banner
                            formats: banner.formats,  // Formatos del banner
                            hash: banner.hash,  // Hash del banner
                            ext: banner.ext,  // Extensión del banner
                            mime: banner.mime,  // Tipo MIME del banner
                            size: banner.size,  // Tamaño del banner
                            url: banner.url,  // URL del banner
                            previewUrl: banner.previewUrl,  // URL de vista previa del banner
                            provider: banner.provider,  // Proveedor del banner
                            provider_metadata: banner.provider_metadata,  // Metadatos del proveedor del banner
                            createdAt: banner.createdAt,  // Fecha de creación del banner
                            updatedAt: banner.updatedAt  // Fecha de actualización del banner
                          }
                        }))
                      } : null  // Si no hay banner, establecer como null
                    }
                  }))
                }
              }
            }))
          }
        }
      }));

      // Configurar la respuesta HTTP con los datos formateados y los metadatos de paginación
      ctx.body = {
        data,
        meta: {
          pagination: {
            page: 1,  // Número de la página actual
            pageSize: data.length,  // Número de elementos en la página actual
            pageCount: 1,  // Número total de páginas
            total: data.length  // Número total de elementos
          }
        }
      };
    } catch (err) {
      // Manejar cualquier error que ocurra y devolver un error 500 (Error interno del servidor)
      ctx.throw(500, 'Error al obtener los datos');
    }
  }
}));
