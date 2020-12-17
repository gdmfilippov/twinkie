export enum AttributeType {
  String = 'String',
}

export interface AttributeInfo {
  type: AttributeType;
}

export type HtmlTagAttributes = {[attrName: string]: AttributeInfo};
export type HtmlTags = {[tagName: string]: HtmlTagAttributes};

export const HTMLTagAttributes: HtmlTags = {
  '*': {
    'id': {
      type: AttributeType.String,
    },
    'class': {
      type: AttributeType.String,
    },
    'style': {
      type: AttributeType.String,
    },
  },
}