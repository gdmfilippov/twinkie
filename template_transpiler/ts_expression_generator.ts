import {
  Identifier,
  LiteralExpression,
  MethodCallExpression,
  NegationExpression,
  PolymerExpression,
  PropertyAccessExpression,
  WildcardPathExpression,
} from '../expression_parser';
import {PolymerSyntaxNodeVisitor, visitSyntaxNode} from './syntax_node_visitor';
import {LocalVars} from './context';

export class TsExpressionGenerator implements PolymerSyntaxNodeVisitor<string> {
  public static fromPolymerExpresion(
    expression: PolymerExpression,
    localVars: LocalVars
  ): string {
    return visitSyntaxNode(expression, new TsExpressionGenerator(localVars));
  }
  private constructor(private readonly localVars: LocalVars) {}
  visitIdentifier(node: Identifier, propertyAccess?: boolean): string {
    const addThis = !propertyAccess && !this.localVars.has(node.name);
    return addThis ? `this.${node.name}` : `${node.name}`;
  }

  visitLiteral(node: LiteralExpression): string {
    return node.value;
  }

  visitMethodCall(node: MethodCallExpression): string {
    const args = node.arguments.map(argument =>
      visitSyntaxNode(argument, this)
    );
    return `${visitSyntaxNode(node.expression, this)}(${args.join(', ')})`;
  }

  visitNegation(node: NegationExpression): string {
    return `!${visitSyntaxNode(node.operand, this)}`;
  }

  visitPropertyAccess(node: PropertyAccessExpression): string {
    return (
      `__f(${visitSyntaxNode(node.expression, this)})!.` +
      this.visitIdentifier(node.name, true)
    );
  }

  visitWildcardPath(node: WildcardPathExpression): string {
    return `pc(${visitSyntaxNode(node.expression, this)})`;
  }
}
