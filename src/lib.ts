import SurveyBuilder from './SurveyBuilder/SurveyBuilder.svelte'
import type { SurveyBuilderOpts } from './SurveyBuilder/types';

(window as any).SurveyBuilderInit = function (opts: SurveyBuilderOpts) {
	if (!opts.target) {
		throw new Error('Please define "target" element')
	}
	const surveyBuilder = new SurveyBuilder({
		target: opts.target,
		props: opts.props,
	})
	return surveyBuilder
}
