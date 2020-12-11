import {TypeChecker, SourceFile} from 'typescript';
import {getProgramClasses} from './code_parser';
import {getPolymerElements} from './polymer_classes_parser';

// Inteface must not include any types from typescript library
export interface PolymerElementInfoJSON {
  tag: string;
  template?: PolymerTemplateString;
  className: string;
}

// We can add HtmlFile in the future
export enum PolymerTemplateType {
  String = 'String',
}

// Inteface must not include any types from typescript library
export interface PolymerTemplateString {
  type: PolymerTemplateType.String;
  content: string;
}

export function getPolymerElementJsons(
  typeChecker: TypeChecker,
  sourceFiles: SourceFile[]
): PolymerElementInfoJSON[] {
  const programClasses = getProgramClasses(typeChecker, sourceFiles);

  const polymerElements = getPolymerElements(typeChecker, programClasses);

  return polymerElements.map(pe => {
    return {
      sourceFile: pe.declaration.sourceFile.fileName,
      className: pe.className,
      tag: pe.tag,
      template: pe.template
        ? {
            type: PolymerTemplateType.String,
            content: pe.template,
          }
        : undefined,
    };
  });
}
