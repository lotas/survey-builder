export enum SurveyBuilderTypes {
  TextInput = 'input',
  TextValue = 'text',
  SingleSelect = 'single',
  MultipleSelect = 'multiple',
  StarsRating = 'rating',
}

export interface SurveyBuilderQuestion {
  id: string;
  title: string;
  type: SurveyBuilderTypes;
  required?: boolean;
  options?: SurveyBuilderQuestion[] | number;
}

export interface SurveyBuilderSnapshot {
  title?: string;
  questions?: SurveyBuilderQuestion[];
}
