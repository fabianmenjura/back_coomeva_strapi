import type { Schema, Attribute } from '@strapi/strapi';

export interface APublico extends Schema.Component {
  collectionName: 'components_a_publicos';
  info: {
    displayName: 'Publico';
    description: '';
  };
  attributes: {
    Colaborador: Attribute.Boolean & Attribute.Required;
    Empresa: Attribute.Boolean & Attribute.Required;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'a.publico': APublico;
    }
  }
}
