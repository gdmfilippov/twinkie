import {
  createProgram,
  parseJsonConfigFileContent,
  Program,
  readConfigFile,
  sys,
} from 'typescript';
import * as path from 'path';
import {failWithDiagnostic, failWithDiagnostics} from './ts_diagnostic_utils';

function parseConfigFile(tsconfigFile: string) {
  const rawConfig = readConfigFile(tsconfigFile, sys.readFile);
  if (rawConfig.error) {
    failWithDiagnostic(
      `Can't parse config file ${tsconfigFile}`,
      rawConfig.error
    );
  }
  const config = parseJsonConfigFileContent(
    rawConfig.config,
    sys,
    path.dirname(tsconfigFile)
  );
  if (config.errors.length > 0) {
    failWithDiagnostics(`Can't parse ${tsconfigFile}`, config.errors);
  }

  return config;
}

export function createProgramFromTsConfig(tsconfigFullPath: string): Program {
  const config = parseConfigFile(tsconfigFullPath);
  return createProgram(config.fileNames, config.options);
}
