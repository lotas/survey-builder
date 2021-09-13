import App from './App.svelte';
import SurveyBuilder from './SurveyBuilder/SurveyBuilder.svelte'
import type { SurveyBuilderSnapshot } from './SurveyBuilder/types';

const app = new App({
	target: document.getElementById('svelte-app'),
});

export interface SurveyBuilderOpts {
	target: HTMLElement | Element;
	props: {
		snapshot: SurveyBuilderSnapshot;
		onExport: (snapshot: SurveyBuilderSnapshot) => void;
	};
}

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