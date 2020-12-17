/**
 * @license
 * Copyright (C) 2020 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {createProgramFromTsConfig} from '../ts_code_parser/tsconfig_parser';
import {createSourceFileFilter} from '../ts_code_parser/source_file_filter';
import * as path from 'path';
import * as fs from 'fs';
import * as Cheerio from 'cheerio';
import {createTranspiler} from '../template_transpiler/default_transpiler';
import {CodeBuilder} from '../template_transpiler/code_builder';
import {ElementsProperties} from '../template_transpiler/transpiler';
import {getProgramClasses} from '../ts_code_parser/code_parser';
import {
  getPolymerElements,
  PolymerElementInfo,
} from '../ts_code_parser/polymer_classes_parser';
import {ClassDeclaration, SyntaxKind} from 'typescript';
import {Logger} from '../template_problems_logger';

async function main() {
  const program = createProgramFromTsConfig(
    '/Users/dmfilippov/gerrit/gerrit/polygerrit-ui/app/tsconfig.json'
  );
  const programFiles = program.getSourceFiles().filter(
    createSourceFileFilter({
      include: ['*.ts'],
      exclude: ['*.d.ts', '*_tets.ts'],
    })
  );
  const typeChecker = program.getTypeChecker();

  const programClasses = getProgramClasses(typeChecker, programFiles);

  const polymerElements = getPolymerElements(typeChecker, programClasses);

  const elementsProperties: ElementsProperties = new Map(
    polymerElements.map(element => [
      element.tag,
      new Map(element.properties.map(prop => [prop.name, prop])),
    ])
  );

  const outDir = '/Users/dmfilippov/gerrit/gerrit/polygerrit-ui/app/tmpl_out';
  for (const element of polymerElements) {
    try {
      generateFile(
        path.join(outDir, element.className + '.ts'),
        element,
        elementsProperties
      );
    } catch (e) {
      console.log(`Error in ${element.className}: ${e}`);
      console.log(element.template);
      throw e;
    }
  }
}

function removeTsFileExtension(filePath: string): string {
  return filePath.endsWith('.ts') ? filePath.slice(0, -3) : filePath;
}

const fileHeader = `
import {PolymerDeepPropertyChange} from '@polymer/polymer/interfaces';
import '@polymer/polymer/lib/elements/dom-if';
import '@polymer/polymer/lib/elements/dom-repeat';

export interface PolymerDomRepeatEventModel<T> {
  /**
   * The item corresponding to the element in the dom-repeat.
   */
  item: T;

  /**
   * The index of the element in the dom-repeat.
   */
  index: number;
  get: (name: string) => T;
  set: (name: string, val: T) => void;
}

declare function wrapInPolymerDomRepeatEvent<T, U>(event: T, item: U): T & {model: PolymerDomRepeatEventModel<U>};
declare function setTextContent(content: unknown): void;
declare function useVars(...args: unknown[]): void;

type UnionToIntersection<T> = (
  T extends any ? (v: T) => void : never
) extends (v: infer K) => void
  ? K
  : never;

type AddNonDefinedProperties<T, P> = {
  [K in keyof P]: K extends keyof T ? T[K] : undefined;
};

type FlatUnion<T, TIntersect> = T extends any
  ? AddNonDefinedProperties<T, TIntersect>
  : never;

type AllUndefined<T> = {
  [P in keyof T]: undefined;
}

type UnionToAllUndefined<T> = T extends any ? AllUndefined<T> : any

type Flat<T> = FlatUnion<T, UnionToIntersection<UnionToAllUndefined<T>>>;


declare function __f<T>(obj: T): Flat<NonNullable<T>>;

declare function pc<T>(obj: T): PolymerDeepPropertyChange<T, T>;

declare function convert<T, U extends T>(obj: T): U;
`;

function hasExportModifier(classDeclaration: ClassDeclaration): boolean {
  if (!classDeclaration.modifiers) return false;
  return classDeclaration.modifiers.some(m => m.kind === SyntaxKind.ExportKeyword);
}

function generateFile(
  targetFile: string,
  element: PolymerElementInfo,
  elementsProperties: ElementsProperties
) {
  if (!hasExportModifier(element.declaration.declaration)) {
    Logger.problemWithClass(element.declaration, `The class must have export modifier`);
  }
  const builder = new CodeBuilder();
  builder.addLine(
    `import {${element.className}} from '${removeTsFileExtension(
      element.declaration.sourceFile.fileName
    )}';`
  );
  builder.addLine(fileHeader);

  builder.addLine(
    `export class ${element.className}Check extends ${element.className}`
  );
  builder.startBlock();
  builder.addLine('templateCheck()');
  builder.startBlock();
  if (element.template) {
    const parsed = Cheerio.parseHTML(element.template);
    createTranspiler(builder, elementsProperties).transpile(parsed);
  }
  builder.endBlock();
  builder.endBlock();

  fs.writeFileSync(targetFile, builder.getCode());
}

main().catch(error => {
  console.error(error.message);
  console.error(error.stack);
  throw error;
});
