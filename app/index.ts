import {createProgramFromTsConfig} from '../ts_code_parser/tsconfig_parser';
import {createSourceFileFilter} from '../ts_code_parser/source_file_filter';
import {
  getPolymerElementJsons,
  PolymerElementInfoJSON,
} from '../ts_code_parser/polymer_element_json';
import * as path from 'path';
import * as fs from 'fs';
import * as Cheerio from 'cheerio';
import {createTranspiler} from '../template_transpiler/default_transpiler';
import {CodeBuilder} from '../template_transpiler/code_builder';

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

  const jsonElements: PolymerElementInfoJSON[] = getPolymerElementJsons(
    typeChecker,
    programFiles
  );
  // console.log(jsonElements);

  const outDir = '/Users/dmfilippov/gerrit/gerrit/polygerrit-ui/app/tmpl_out';
  for (const element of jsonElements) {
    try {
      generateFile(path.join(outDir, element.className + '.ts'), element);
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
//
// export interface A {
//   a: number;
//   t: number;
//   v: number;
// }
//
// export interface B {
//   b: string;
//   c: number;
//   t: string;
//   v: number;
// }
//
// export interface C {
//   c: string;
//   t: string;
//   v: number;
// }
//
// export type D = A | B | C | undefined;
// export type UnionToIntersection<T> = (
//   T extends any ? (v: T) => void : never
// ) extends (v: infer K) => void
//   ? K
//   : never;
//
// type AddNonDefinedProperties<T, P> = {
//   [K in keyof P]: K extends keyof T ? T[K] : undefined;
// };
//
// type FlatUnion<T, TIntersect> = T extends any
//   ? AddNonDefinedProperties<T, TIntersect>
//   : never;
//
// type Flat<T> = FlatUnion<T, UnionToIntersection<T>>;
//
// declare function f<T>(obj: T): Flat<NonNullable<T>>;
//
// export function d(d: D) {
//   const t = f(d).t;
//   const a = f(d).a;
//   const b = f(d).b;
//   const c = f(d).c;
//   const v = f(d).v;
//   console.log(a, b, c, t, v);
// }

function generateFile(targetFile: string, element: PolymerElementInfoJSON) {
  const builder = new CodeBuilder();
  builder.addLine(
    `import {${element.className}} from '${removeTsFileExtension(
      element.sourceFile
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
    const parsed = Cheerio.parseHTML(element.template.content);
    createTranspiler(builder).transpile(parsed);
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
