import {AttributeValueType, ElementTranspiler, TemplateTranspiler} from '../transpiler';
import {CheerioElementType} from '../../utils';
import {CodeBuilder} from '../code_builder';

export class TextTranspiler implements ElementTranspiler {
  canTranspile(element: CheerioElement): boolean {
    return element.type === CheerioElementType.Text;
  }

  transpile(
    transpiler: TemplateTranspiler,
    builder: CodeBuilder,
    element: CheerioElement
  ): void {
    const content = transpiler.transpileAttributeValue(element.nodeValue);
    if (content.attrValueType === AttributeValueType.TextOnly) return;
    builder.addTextContent(content.stringExpression);
  }
}