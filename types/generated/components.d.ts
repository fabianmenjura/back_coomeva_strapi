import type { Schema, Attribute } from '@strapi/strapi';

export interface APublico extends Schema.Component {
  collectionName: 'components_a_publicos';
  info: {
    displayName: 'Publico';
  };
  attributes: {
    Colaborador: Attribute.Boolean;
    Empresa: Attribute.Boolean;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'a.publico': APublico;
    }
  }
}
