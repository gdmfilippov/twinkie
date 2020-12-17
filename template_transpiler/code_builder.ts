import {kebabCaseToCamelCase} from '../printer';
import {TemplateTranspiler} from './transpiler';
import {TranspilerContext} from './context';

export class CodeBuilder {
  private code = '';
  private indent = '';
  private readonly blockIndent = '  ';

  getCode(): string {
    return this.code;
  }

  public addLine(line: string) {
    this.code += `${this.indent}${line}\n`;
  }

  addTextContent(statement: string) {
    this.addLine(`setTextContent(${statement});\n`);
  }

  startBlock() {
    this.addLine('{');
    this.indent += this.blockIndent;
  }

  endBlock() {
    this.indent = this.indent.slice(0, -this.blockIndent.length);
    this.addLine('}');
  }

  beginElement(tagName: string) {
    this.startBlock();
    // Even if there is no attribute, it make sence to check that tagName is registered in HTMLElementTagNameMap
    this.addLine(`const el: HTMLElementTagNameMap['${tagName}'] = null!;`);
    this.addLine('useVars(el);');
  }

  endElement() {
    this.endBlock();
  }

  addElementPropertySet(attrName: string, getValueTsCode: string) {
    this.addLine(`el.${kebabCaseToCamelCase(attrName)} = ${getValueTsCode};`);
  }

  addAttributeSet(attrName: string, stringExpression: string) {
    this.addLine(
      `el.setAttribute('${kebabCaseToCamelCase(
        attrName
      )}', ${stringExpression});`
    );
  }

  addValueSetFromProperty(
    tagName: string,
    target: string,
    sourceAttr: string,
    transpiler: TemplateTranspiler
  ) {
    const value = transpiler.getValueForSet(
      tagName,
      sourceAttr,
      `el.${kebabCaseToCamelCase(sourceAttr)}`
    );
    this.addLine(`${target} = ${value};`);
  }

  subscribeEvent(
    eventName: string,
    handler: string,
    context: TranspilerContext
  ) {
    // dom-repeat adds model to the event. This complex handler is required
    // to handle both cases: when handler doesn't have arguments and when it has
    // arguments
    const listener = context.domRepeatVar
      ? `e => this.${handler}.bind(this, wrapInPolymerDomRepeatEvent(e, ${context.domRepeatVar}))()`
      : `this.${handler}.bind(this)`;
    this.addLine(`el.addEventListener('${eventName}', ${listener});`);
  }
}