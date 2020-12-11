import {
  escapeLeadingUnderscores,
  Expression,
  isCallExpression,
  isGetAccessor,
  isIdentifier,
  isNoSubstitutionTemplateLiteral,
  isReturnStatement,
  isStringLiteral,
  isTaggedTemplateExpression,
  isVariableDeclaration,
  Type,
  TypeChecker,
} from 'typescript';
import {ClassDeclarationInfo} from './code_parser';

export function isPolymerElement(classDeclarationInfo: ClassDeclarationInfo) {
  return extendsPolymerElement(classDeclarationInfo.type);
}

export interface PolymerElementInfo {
  declaration: ClassDeclarationInfo;
  className: string; // The name in ts.classDeclaration can be undefined, but PolymerElement must be defined with class name
  tag: string;
  template?: string;
}

export function getPolymerElements(
  typeChecker: TypeChecker,
  classes: ClassDeclarationInfo[]
): PolymerElementInfo[] {
  return classes
    .filter(isPolymerElement)
    .map(classInfo => getPolymerElementInfo(typeChecker, classInfo));
}

export function getPolymerElementInfo(
  typeChecker: TypeChecker,
  polymerElementClassDeclarationInfo: ClassDeclarationInfo
): PolymerElementInfo {
  const className = polymerElementClassDeclarationInfo.declaration.name;
  if (!className) {
    throw new Error(
      `Polymer element doesn't have a class name. File: ${polymerElementClassDeclarationInfo.sourceFile.fileName}`
    );
  }
  return {
    declaration: polymerElementClassDeclarationInfo,
    tag: getTagName(polymerElementClassDeclarationInfo),
    className: className.text,
    template: getPolymerElementTemplate(
      typeChecker,
      polymerElementClassDeclarationInfo
    ),
  };
}

function extendsPolymerElement(type: Type): boolean {
  const baseTypes = type.getBaseTypes();
  if (!baseTypes) {
    return false;
  }
  for (const baseType of baseTypes) {
    if (isPolymerElementType(baseType)) {
      return true;
    }
  }
  return false;
}

function isPolymerElementType(type: Type): boolean {
  if (type.isIntersection()) {
    for (const subType of type.types) {
      if (isPolymerElementType(subType)) {
        return true;
      }
    }
    return false;
  } else {
    if (!type.symbol) {
      throw new Error('Internal error!');
    }
    return type.symbol.getName() === 'PolymerElement';
  }
}

function getTagName(elementDeclaration: ClassDeclarationInfo): string {
  const decorators = elementDeclaration.declaration.decorators;
  if (!decorators) {
    throw new Error('Decorator not found on class');
  }
  for (const decorator of decorators) {
    const expression = decorator.expression;
    if (!isCallExpression(expression)) {
      continue;
    }
    if (
      !isIdentifier(expression.expression) ||
      expression.expression.text !== 'customElement'
    ) {
      continue;
    }
    const args = expression.arguments;
    if (args.length !== 1) {
      throw new Error('Invalid decorator');
    }
    const tagNameArg = args[0];
    if (!isStringLiteral(tagNameArg)) {
      throw new Error('Unsupported argument type in decorator');
    }
    return tagNameArg.text;
  }
  throw new Error("Can't find decorator tag");
}

function getTemplateFromExpression(expr: Expression) {
  if (!isTaggedTemplateExpression(expr)) {
    throw new Error('Internal error');
  }
  if (!isIdentifier(expr.tag) || expr.tag.text !== 'html') {
    throw new Error('Internal error');
  }
  if (!isNoSubstitutionTemplateLiteral(expr.template)) {
    throw new Error('Internal error');
  }
  return expr.template.text;
}

function getPolymerElementTemplate(
  typeChecker: TypeChecker,
  polymerElementClassDeclarationInfo: ClassDeclarationInfo
): string | undefined {
  const templateGetterSymbol = polymerElementClassDeclarationInfo.type.symbol.exports?.get(
    escapeLeadingUnderscores('template')
  );
  if (!templateGetterSymbol) {
    return undefined;
  }
  if (templateGetterSymbol.declarations.length !== 1) {
    throw new Error('Internal error');
  }
  const declaration = templateGetterSymbol.declarations[0];
  if (!isGetAccessor(declaration)) {
    throw new Error('Internal error');
  }
  const statements = declaration.body?.statements;
  if (!statements || statements.length !== 1) {
    throw new Error('Internal error');
  }
  const returnStatement = statements[0];
  if (!isReturnStatement(returnStatement) || !returnStatement.expression) {
    throw new Error('Internal error');
  }

  if (isIdentifier(returnStatement.expression)) {
    // Case 1: return imported template
    const identifierSymbol = typeChecker.getSymbolAtLocation(
      returnStatement.expression
    );
    if (!identifierSymbol || identifierSymbol.declarations.length !== 1) {
      throw new Error('Internal error');
    }
    const aliasedSymbol = typeChecker.getAliasedSymbol(identifierSymbol);
    if (!aliasedSymbol || !aliasedSymbol.valueDeclaration) {
      throw new Error('Internal error');
    }
    const declaration = aliasedSymbol.valueDeclaration;
    if (!isVariableDeclaration(declaration) || !declaration.initializer) {
      throw new Error('Internal error');
    }
    return getTemplateFromExpression(declaration.initializer);
  } else if (isTaggedTemplateExpression(returnStatement.expression)) {
    // Case 2: the template defined inside template property
    return getTemplateFromExpression(returnStatement.expression);
  }
  throw new Error('Internal error');
}
