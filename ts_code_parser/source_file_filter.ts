import {SourceFile} from 'typescript';

import {IMinimatch, Minimatch} from 'minimatch';

export type SourceFileFilter = (sourceFile: SourceFile) => boolean;

export interface SourceFileFilterParams {
  include?: string[];
  exclude?: string[];
}

export function createSourceFileFilter(
  params: SourceFileFilterParams
): SourceFileFilter {
  const includeMatches = createMatches(params.include);
  const excludeMatches = createMatches(params.exclude);

  return (sourceFile: SourceFile) => {
    const fileName = sourceFile.fileName;
    return (
      includeMatches.every(mm => mm.match(fileName)) &&
      excludeMatches.every(mm => !mm.match(fileName))
    );
  };
}

function createMatches(patterns?: string[]): IMinimatch[] {
  if (!patterns) return [];
  return patterns.map(pattern => new Minimatch(pattern, {matchBase: true}));
}
