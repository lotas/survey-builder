import App from './App.svelte';
import SurveyBuilder from './SurveyBuilder/SurveyBuilder.svelte'
import type { SurveyBuilderOpts } from './SurveyBuilder/types';

const app = new App({
	target: document.getElementById('svelte-app'),
});

(window as any).SurveyBuilder = function (opts: SurveyBuilderOpts) {
	if (!opts.target) {
		throw new Error('Please define "target" element')
	}
	const surveyBuilder = new SurveyBuilder({
		target: opts.target,
		props: opts.props,
	})
	return surveyBuilder
}

export default app;