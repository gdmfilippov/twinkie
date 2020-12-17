import {
  Identifier,
  LiteralExpression,
  MethodCallExpression,
  NegationExpression,
  PolymerSyntaxNode,
  PropertyAccessExpression,
  SyntaxNodeKind,
  WildcardPathExpression,
} from '../expression_parser';
import {assertNever} from '../utils';

export interface PolymerSyntaxNodeVisitor<T> {
  visitNegation(node: NegationExpression): T;
  visitWildcardPath(node: WildcardPathExpression): T;
  visitPropertyAccess(node: PropertyAccessExpression): T;
  visitLiteral(node: LiteralExpression): T;
  visitMethodCall(node: MethodCallExpression): T;
  visitIdentifier(node: Identifier): T;
}

export function visitSyntaxNode<T>(
  node: PolymerSyntaxNode,
  visitor: PolymerSyntaxNodeVisitor<T>
): T {
  switch (node.type) {
    case SyntaxNodeKind.Negation:
      return visitor.visitNegation(node);
    case SyntaxNodeKind.WildcardPath:
      return visitor.visitWildcardPath(node);
    case SyntaxNodeKind.PropertyAccess:
      return visitor.visitPropertyAccess(node);
    case SyntaxNodeKind.Literal:
      return visitor.visitLiteral(node);
    case SyntaxNodeKind.MethodCall:
      return visitor.visitMethodCall(node);
    case SyntaxNodeKind.Identifier:
      return visitor.visitIdentifier(node);
    default:
      assertNever(node);
  }
}
