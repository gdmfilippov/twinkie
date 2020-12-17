// import {printTemplate, CodeBuilder} from './template_printer';
// import {expect} from 'chai';
// import * as Cheerio from 'cheerio';
//
// function printTemplateContent(html: string) {
//   const codeWriter = new CodeBuilder();
//   const parsed = Cheerio.parseHTML(html);
//   printTemplate(codeWriter, parsed);
//   return codeWriter.getCode().trim();
// }
//
// describe('printTemplateContent', () => {
//   it('template with text value', () => {
//     expect(printTemplateContent('[[abc.def.xyz]]')).to.deep.equal(
//       'setTextContent(this.abc!.def!.xyz);'
//     );
//   });
//
//   it('template with text function call', () => {
//     expect(printTemplateContent('[[abc.xyz.qwe(d.e.f.g, f)]]')).to.deep.equal(
//       'setTextContent(this.abc!.xyz!.qwe(this.d!.e!.f!.g, this.f));'
//     );
//   });
//
//   it('template with literal arguments', () => {
//     expect(
//       printTemplateContent('[[fn("a\'b c", \'de"f g"\', 23)]]')
//     ).to.deep.equal('setTextContent(this.fn("a\'b c", \'de"f g"\', 23));');
//   });
//
//   it('property assignment one-way binding', () => {
//     expect(
//       printTemplateContent('\'<my-el prop1="[[x]]" prop2="[[x.y.z]]"></my-el>')
//     ).to.deep.equal(`{
//   const el: HTMLElementPropertyMap['my-el'] = null!;
//   el.prop1 = this.x;
//   el.prop2 = this.x!.y!.z;
// }`);
//   });
//
//   it('property assignment two-way binding', () => {
//     expect(
//       printTemplateContent('\'<my-el prop1="{{x}}" prop2="{{x.y.z}}"></my-el>')
//     ).to.deep.equal(`{
//   const el: HTMLElementPropertyMap['my-el'] = null!;
//   el.prop1 = this.x;
//   this.x = el.prop1;
//   el.prop2 = this.x!.y!.z;
//   this.x!.y!.z = el.prop2;
// }`);
//   });
//
//   it('event listener', () => {
//     expect(printTemplateContent('\'<my-el on-elem-click="myHandler" ></my-el>'))
//       .to.deep.equal(`{
//   const el: HTMLElementPropertyMap['my-el'] = null!;
//   el.addEventListener('elem-click', this.myHandler.bind(this));
// }`);
//   });
//
//   it('dom-repeat', () => {
//     expect(
//       printTemplateContent(
//         '\'<dom-repeat items="[[abc]]"><my-el on-elem-click="myHandler" val="[[item.abc]]" ></my-el></dom-repeat>'
//       )
//     ).to.deep.equal('');
//   });
// });
