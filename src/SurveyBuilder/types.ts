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
  name?: string;
  type: SurveyBuilderTypes;
  required?: boolean;
  answers?: SurveyBuilderQuestion[];
  options?: string | number;
}

export interface SurveyBuilderSnapshot {
  title?: string;
  questions?: SurveyBuilderQuestion[];
}

export interface SurveyBuilderOpts {
  target: HTMLElement | Element;
  props: {
    haveTitle?: boolean;
    customInputNames?: boolean;
    debug?: boolean;
    snapshot?: SurveyBuilderSnapshot;
    onChange?: (snapshot: SurveyBuilderSnapshot) => void;
    showExportButton?: boolean;
    onExport?: (snapshot: SurveyBuilderSnapshot) => void;
  };
}
