import {
  parsePolymerBindingExpression,
  PolymerExpression,
} from '../expression_parser';
import {TranspilerContext} from './context';
import {CodeBuilder} from './code_builder';
import {TsExpressionGenerator} from './ts_expression_generator';
import {TemplateProblem} from './template_problem';
import {
  BindingType,
  extractBindingParts,
  isRawExpression,
} from '../expression_extractor';
import {isExpressionWithTheOnlyBinding, isTextOnlyExpression} from '../utils';

export interface ElementTranspiler {
  canTranspile(element: CheerioElement): boolean;
  transpile(
    transpiler: TemplateTranspiler,
    builder: CodeBuilder,
    element: CheerioElement
  ): void;
}

export enum AttributeValueType {
  OneWayBinding = 'OneWayBinding', // [[abc]]
  TwoWayBinding = 'TwoWayBinding', // {{abc}}
  TextOnly = 'TextOnly', // "some text"
  MultiBinding = 'MultiBinding', // [[abc]]-text-[[def]
}

export class TemplateTranspiler {
  private readonly elementTranspilers: ElementTranspiler[] = [];
  private readonly contextStack: TranspilerContext[] = [];
  private readonly problems: TemplateProblem[] = [];
  private currentContext: TranspilerContext;

  public constructor(
    private readonly codeBuilder: CodeBuilder // private readonly config: TemplateTranspilerConfig
  ) {
    this.currentContext = {
      localVars: new Set(),
      domRepeatVar: undefined,
    };
  }

  public registerElementTranspiler(transpiler: ElementTranspiler) {
    this.elementTranspilers.push(transpiler);
  }

  public transpile(elements: CheerioElement[]) {
    elements.forEach(el => this.transpileElement(el));
  }

  public transpileChildNodes(element: CheerioElement) {
    let childNodes = element.childNodes;
    if (element.tagName === 'template') {
      if (
        element.childNodes.length !== 1 ||
        element.childNodes[0].tagName !== 'root'
      ) {
        throw new Error('Expected only single root child');
      }
      childNodes = element.childNodes[0].childNodes;
    }
    this.transpile(childNodes);
  }

  public transpileElement(element: CheerioElement) {
    const elementTranspiler = this.elementTranspilers.find(transpiler =>
      transpiler.canTranspile(element)
    );
    if (!elementTranspiler) {
      throw new Error(
        `Internal error: ${element.tagName} doesn't have transpiler.`
      );
    }
    elementTranspiler.transpile(this, this.codeBuilder, element);
  }

  public transpilePolymerExpression(expression: PolymerExpression): string {
    return TsExpressionGenerator.fromPolymerExpresion(
      expression,
      this.currentContext.localVars
    );
  }

  public transpileAttributeValue(
    attrValue: string
  ): {
    attrValueType: AttributeValueType;
    tsExpression: string;
    stringExpression: string;
    whitespacesOnly: boolean;
  } {
    const bindingParts = extractBindingParts(attrValue);
    if (isTextOnlyExpression(bindingParts)) {
      const stringExpression = `\`${bindingParts[0]
        .replace(/\\/g, '\\')
        .replace(/`/g, '\\``')}\``;
      return {
        attrValueType: AttributeValueType.TextOnly,
        tsExpression: stringExpression,
        stringExpression,
        whitespacesOnly: bindingParts[0].trim().length === 0,
      };
    }
    if (!isExpressionWithTheOnlyBinding(bindingParts)) {
      // Expressions like "abc-[[prop]]" or "[[prop1]][[prop2]]"
      const tsExpressions: string[] = bindingParts.map(part => {
        if (isRawExpression(part)) {
          const parseResult = parsePolymerBindingExpression(part.text);
          return (
            '${' + this.transpilePolymerExpression(parseResult.expression) + '}'
          );
        } else {
          return part;
        }
      });
      const stringExpression = '`' + tsExpressions.join('') + '`';
      return {
        attrValueType: AttributeValueType.MultiBinding,
        tsExpression: stringExpression,
        stringExpression,
        whitespacesOnly: false,
      };
    }

    const parseResult = parsePolymerBindingExpression(bindingParts[0].text);
    const tsExpression = this.transpilePolymerExpression(
      parseResult.expression
    );
    return {
      attrValueType:
        bindingParts[0].bindingType === BindingType.OneWay
          ? AttributeValueType.OneWayBinding
          : AttributeValueType.TwoWayBinding,
      tsExpression,
      stringExpression: '`${' + tsExpression + '}`',
      whitespacesOnly: false,
    };
  }

  public addProblem(element: CheerioElement, problem: TemplateProblem) {
    this.problems.push(problem);
  }

  public getCurrentContext(): TranspilerContext {
    return this.currentContext;
  }

  public updateCurrentContext(update: Partial<TranspilerContext>) {
    if (update.domRepeatVar) {
      this.currentContext.domRepeatVar = update.domRepeatVar;
    }
    if (update.localVars) {
      update.localVars.forEach(val => this.currentContext.localVars.add(val));
    }
  }

  pushContext(): void {
    const newContext: TranspilerContext = {
      localVars: new Set<string>(this.currentContext.localVars),
      domRepeatVar: this.currentContext.domRepeatVar,
    };
    this.contextStack.push(this.currentContext);
    this.currentContext = newContext;
  }

  popContext(): void {
    const context = this.contextStack.pop();
    if (!context) {
      throw new Error('Internal error');
    }
    this.currentContext = context;
  }

  getValueForSet(
    tagName: string,
    attrName: string,
    transpiledExpression: string
  ) {
    if (tagName === 'iron-input' && attrName === 'bind-value') {
      return `convert(${transpiledExpression})`;
    }
    return transpiledExpression;
  }
}
