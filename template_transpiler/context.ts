export type LocalVars = Set<string>;

export interface TranspilerContext {
  localVars: LocalVars;
  domRepeatVar?: string;
}
