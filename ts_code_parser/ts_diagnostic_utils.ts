import {
  Diagnostic,
  formatDiagnostic,
  FormatDiagnosticsHost,
  sys,
} from 'typescript';

class FormatDiagnosticHostImpl implements FormatDiagnosticsHost {
  public static readonly Instance = new FormatDiagnosticHostImpl();
  private constructor() {}
  getCanonicalFileName(fileName: string): string {
    return fileName;
  }

  getCurrentDirectory(): string {
    return sys.getCurrentDirectory();
  }

  getNewLine(): string {
    return sys.newLine;
  }
}

function getFormattedDiagnostic(d: Diagnostic) {
  return formatDiagnostic(d, FormatDiagnosticHostImpl.Instance);
}

export function failWithDiagnostic(msg: string, diagnostic: Diagnostic) {
  throw new Error(`${msg}:\n${getFormattedDiagnostic(diagnostic)}`);
}
export function failWithDiagnostics(msg: string, diagnostics: Diagnostic[]) {
  const diagnosticsTexts = diagnostics.map(d =>
    getFormattedDiagnostic(d).trim()
  );
  throw new Error(`${msg}:\n${diagnosticsTexts.join('\n')}`);
}
