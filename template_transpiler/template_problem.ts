export enum ProoblemType {
  TextElementShouldUseOneWayBinding = 'TextElementShouldUseOneWayBinding',
  ExpressionParseError = 'ExpressionParseError',
  OnlyTwoWayBindingCanHaveEvent = 'OnlyTwoWayBindingCanHaveEvent',
  UnusableTwoWayBinding = 'UnusableTwoWayBinding',
}

export interface TemplateProblem {
  type: ProoblemType;
  message: string;
  Element: CheerioElement;
}

