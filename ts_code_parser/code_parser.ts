import {
  ClassDeclaration,
  isClassDeclaration,
  SourceFile,
  Type,
  TypeChecker,
} from 'typescript';

export interface ClassDeclarationInfo {
  declaration: ClassDeclaration;
  sourceFile: SourceFile;
  type: Type;
}

export function getProgramClasses(
  typeChecker: TypeChecker,
  sourceFiles: SourceFile[]
): ClassDeclarationInfo[] {
  return sourceFiles.reduce((classes, sourceFile) => {
    classes.push(...getSourceFileClasses(typeChecker, sourceFile));
    return classes;
  }, [] as ClassDeclarationInfo[]);
}

function getSourceFileClasses(
  typeChecker: TypeChecker,
  sourceFile: SourceFile
): ClassDeclarationInfo[] {
  const result: ClassDeclarationInfo[] = [];
  sourceFile.forEachChild(node => {
    if (!isClassDeclaration(node)) return;
    result.push({
      sourceFile,
      declaration: node,
      type: typeChecker.getTypeAtLocation(node),
    });
  });
  return result;
}
