import {CodeBuilder} from './code_builder';
import {TemplateTranspiler} from './transpiler';
import {BlacklistedElementTranspiler} from './element_transpilers/blacklisted_element_transpiler';
import {DomRepeatElementTranspiler} from './element_transpilers/dom_repeat_transpiler';
import {DomIfElementTranspiler} from './element_transpilers/dom_if_transpiler';
import {OrdinaryTagTranspiler} from './element_transpilers/ordinary_tag_transpiler';
import {TextTranspiler} from './element_transpilers/text_transpiler';
import {CommentTranspiler} from './element_transpilers/comment_transpiler';

export function createTranspiler(builder: CodeBuilder) {
  const transpiler = new TemplateTranspiler(builder);
  transpiler.registerElementTranspiler(new BlacklistedElementTranspiler());
  transpiler.registerElementTranspiler(new DomRepeatElementTranspiler());
  transpiler.registerElementTranspiler(new DomIfElementTranspiler());
  transpiler.registerElementTranspiler(new OrdinaryTagTranspiler());
  transpiler.registerElementTranspiler(new TextTranspiler());
  transpiler.registerElementTranspiler(new CommentTranspiler());
  return transpiler;
}
