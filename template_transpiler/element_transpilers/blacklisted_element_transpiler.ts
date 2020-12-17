import {ElementTranspiler, TemplateTranspiler} from '../transpiler';
import {CheerioElementType} from '../../utils';
import {CodeBuilder} from '../code_builder';

export class BlacklistedElementTranspiler implements ElementTranspiler {
  canTranspile(element: CheerioElement): boolean {
    return (
      element.type === CheerioElementType.Script ||
      element.type === CheerioElementType.Style
    );
  }

  transpile(
    transpiler: TemplateTranspiler,
    builder: CodeBuilder,
    element: CheerioElement
  ): void {
    // ignore tag and its contents
  }
}
