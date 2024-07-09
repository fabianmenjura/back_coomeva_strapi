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

export interface DiapositivaFinalDiapositivaFinal extends Schema.Component {
  collectionName: 'components_diapositiva_final_diapositiva_finals';
  info: {
    displayName: 'DiapositivaFinal';
    icon: 'layout';
    description: '';
  };
  attributes: {
    Titulo: Attribute.String;
    Descripcion: Attribute.Blocks;
  };
}

export interface DiapositivaInicialDiapositivaInicial extends Schema.Component {
  collectionName: 'components_diapositiva_inicial_diapositiva_inicials';
  info: {
    displayName: 'DiapositivaInicial';
    icon: 'layout';
    description: '';
  };
  attributes: {
    Titulo: Attribute.String;
    Descripcion: Attribute.Blocks;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'a.publico': APublico;
      'diapositiva-final.diapositiva-final': DiapositivaFinalDiapositivaFinal;
      'diapositiva-inicial.diapositiva-inicial': DiapositivaInicialDiapositivaInicial;
    }
  }
}
