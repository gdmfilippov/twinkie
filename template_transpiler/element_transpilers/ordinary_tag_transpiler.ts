import {CheerioElementType} from '../../utils';
import {
  AttributeValueType,
  ElementTranspiler,
  TemplateTranspiler,
} from '../transpiler';
import {CodeBuilder} from '../code_builder';
import {HTMLTagAttributes} from '../attrubutes';

export type AttributeFilter = (attrName: string, attrValue: string) => boolean;

export class OrdinaryTagTranspiler implements ElementTranspiler {
  canTranspile(element: CheerioElement): boolean {
    return element.type === CheerioElementType.Tag;
  }

  transpile(
    transpiler: TemplateTranspiler,
    builder: CodeBuilder,
    element: CheerioElement
  ): void {
    this.transpileTagWithoutChildren(transpiler, builder, element);
    // Transpile child elements
    transpiler.transpile(element.childNodes);
  }

  protected getActualTagName(element: CheerioElement) {
    if (element.attribs['is']) {
      return element.attribs['is'];
    }
    return element.tagName;
  }

  protected transpileTagWithoutChildren(
    transpiler: TemplateTranspiler,
    builder: CodeBuilder,
    element: CheerioElement,
    attrFilter?: AttributeFilter
  ) {
    builder.beginElement(this.getActualTagName(element));
    for (const [attrName, attrValue] of Object.entries(element.attribs)) {
      if (attrName === 'is') continue;
      if (attrFilter && !attrFilter(attrName, attrValue)) continue;
      this.transpileAttribute(
        transpiler,
        builder,
        element,
        attrName,
        attrValue
      );
    }
    builder.endElement();
  }

  private isHtmlAttribute(element: CheerioElement, attrName: string): boolean {
    if (HTMLTagAttributes[this.getActualTagName(element)]?.[attrName]) {
      return true;
    }
    return !!HTMLTagAttributes['*']?.[attrName];
  }

  protected transpileAttribute(
    transpiler: TemplateTranspiler,
    builder: CodeBuilder,
    element: CheerioElement,
    attrName: string,
    attrValue: string
  ) {
    const eventAttrPrefix = 'on-';
    if (attrName.startsWith(eventAttrPrefix)) {
      const eventName = attrName.slice(eventAttrPrefix.length);
      builder.subscribeEvent(
        eventName,
        attrValue,
        transpiler.getCurrentContext()
      );
      return;
    }

    const tsValue = transpiler.transpileAttributeValue(attrValue);
    const assignToAttribute = attrName.endsWith('$');
    if (assignToAttribute) {
      if (!tsValue.whitespacesOnly) {
        builder.addAttributeSet(
          attrName.slice(0, -1),
          tsValue.stringExpression
        );
      }
    } else if (this.isHtmlAttribute(element, attrName)) {
      if (!tsValue.whitespacesOnly) {
        builder.addAttributeSet(
          attrName,
          tsValue.stringExpression
        );
      }
    } else {
      builder.addElementPropertySet(attrName, tsValue.tsExpression);
    }
    if (tsValue.attrValueType === AttributeValueType.TwoWayBinding) {
      if (!transpiler.getCurrentContext().localVars.has(tsValue.tsExpression)) {
        builder.addValueSetFromProperty(
          this.getActualTagName(element),
          tsValue.tsExpression,
          attrName,
          transpiler
        );
      }
    }
  }
}
