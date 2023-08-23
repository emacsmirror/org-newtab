import React from 'react';
import whyDidYouRender from '@welldone-software/why-did-you-render';

if (process.env.NODE_ENV === 'development') {
	whyDidYouRender(React, {
		trackAllPureComponents: true,
		trackHooks: true,
		include: [/.*/],
		exclude: [
			/^Transition$/,
			/^DraggableWidget$/,
			/^DndContext$/,
			/^LiveRegion$/,
			/^Accessibility$/,
			/^AnimationManager$/,
			/^RestoreFocus$/,
			/^NullifiedContextProvider$/,
			/^HiddenText$/,
			/^Unknown$/,
		],
		collapseGroups: true,
		diffNameColor: 'darkturquoise',
		titleColor: 'lavender',
	});
}
