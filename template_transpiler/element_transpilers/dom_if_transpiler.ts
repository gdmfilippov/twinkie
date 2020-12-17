import {OrdinaryTagTranspiler} from './ordinary_tag_transpiler';
import {TemplateTranspiler} from '../transpiler';
import {CodeBuilder} from '../code_builder';

export class DomIfElementTranspiler extends OrdinaryTagTranspiler {
  canTranspile(element: CheerioElement): boolean {
    if (!super.canTranspile(element)) return false;
    return this.getActualTagName(element) === 'dom-if';
  }

  transpile(
    transpiler: TemplateTranspiler,
    builder: CodeBuilder,
    element: CheerioElement
  ): void {
    const condition = element.attribs['if'];
    this.transpileTagWithoutChildren(
      transpiler,
      builder,
      element,
      attrName => attrName !== 'if'
    );

    const tsCondition = transpiler.transpileAttributeValue(condition);
    builder.addLine(`if(${tsCondition.tsExpression})`);
    builder.startBlock();
    transpiler.transpileChildNodes(element);
    builder.endBlock();
  }
}
