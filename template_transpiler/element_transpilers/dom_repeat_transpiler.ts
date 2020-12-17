import {OrdinaryTagTranspiler} from './ordinary_tag_transpiler';
import {TemplateTranspiler} from '../transpiler';
import {CodeBuilder} from '../code_builder';
import {parsePolymerBindingExpression} from '../../expression_parser';

const specialDomRepatAttributes = new Set([
  'items',
  'as',
  'indexAs',
  'itemIndexAs',
  'sort',
  'filter',
  'observe',
]);

export class DomRepeatElementTranspiler extends OrdinaryTagTranspiler {
  canTranspile(element: CheerioElement): boolean {
    if (!super.canTranspile(element)) return false;
    return this.getActualTagName(element) === 'dom-repeat';
  }

  transpile(
    transpiler: TemplateTranspiler,
    builder: CodeBuilder,
    element: CheerioElement
  ): void {
    const items = element.attribs['items'];
    const as = element.attribs['as'] ?? 'item';
    const indexAs = element.attribs['indexAs'] ?? 'index';
    const itemsIndexAs = element.attribs['itemsIndexAs'] ?? 'itemsIndexAs';
    const sortFunction = element.attribs['sort'];
    const filter = element.attribs['filter'];
    const observe = element.attribs['observe'];
    this.transpileTagWithoutChildren(
      transpiler,
      builder,
      element,
      attrName => !specialDomRepatAttributes.has(attrName)
    );

    const tsItems = transpiler.transpileAttributeValue(items);
    // Technically, all items can be either string or binding expression to string

    builder.startBlock();
    builder.addLine(`const ${indexAs} = 0;`);
    builder.addLine(`const ${itemsIndexAs} = 0;`);
    builder.addLine(`useVars(${indexAs}, ${itemsIndexAs});`);
    builder.addLine(
      `for(const ${as} of ${tsItems.tsExpression}!${
        filter ? `.filter(this.${filter}.bind(this))` : ''
      }${sortFunction ? `.sort(this.${sortFunction}.bind(this))` : ''})`
    );
    builder.startBlock();
    transpiler.pushContext();
    transpiler.updateCurrentContext({
      domRepeatVar: as,
      localVars: new Set([as, itemsIndexAs, indexAs]),
    });
    if (observe) {
      const observeExpressions = observe
        .split(' ')
        .map(s => s.trim())
        .map(expr =>
          transpiler.transpilePolymerExpression(
            parsePolymerBindingExpression(expr).expression
          )
        );
      builder.startBlock();
      builder.addLine(
        `const observerArray = [${observeExpressions.join(',')}]`
      );
      builder.addLine('useVars(observerArray)');
      builder.endBlock();
    }

    transpiler.transpileChildNodes(element);
    transpiler.popContext();
    builder.endBlock();
    builder.endBlock();
  }
}
