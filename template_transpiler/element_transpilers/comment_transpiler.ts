import {ElementTranspiler, TemplateTranspiler} from '../transpiler';
import {CodeBuilder} from '../code_builder';
import {CheerioElementType} from '../../utils';

export class CommentTranspiler implements ElementTranspiler {
  canTranspile(element: CheerioElement): boolean {
    return element.type === CheerioElementType.Comment;
  }

  transpile(
    transpiler: TemplateTranspiler,
    builder: CodeBuilder,
    element: CheerioElement
  ): void {
    // Ignore comments
  }
}
