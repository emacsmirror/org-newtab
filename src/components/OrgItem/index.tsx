import { useCallback, useEffect, useState } from 'react';
import * as styles from './style.module.css';
import { WSReadyState, type AllTagsRecv } from '../../lib/types';
import logo from 'data-base64:~assets/icon-1024x1024.png';
import { useAppSelector } from '../../app/hooks';

//TODO: flip out image with actual transparency

const OrgItem: React.FC = () => {
	const tagsData = useAppSelector((state) => state.emacs.tagsData);
	const orgItem = useAppSelector((state) => state.emacs.orgItem);
	const readyState = useAppSelector((state) => state.ws.readyState);
	const isWaitingForResponse = useAppSelector(
		(state) => state.ws.responsesWaitingFor.length > 0
	);
	const [foregroundColor, setForegroundColor] = useState<string | undefined>(
		undefined
	);
	const itemText = orgItem?.ITEM;

	const sanitizeTagsAndMatchData = useCallback(
		(allTagsData?: AllTagsRecv) => {
			let allTags: Array<string> | string | undefined;
			if (Array.isArray(allTagsData)) {
				allTags = [];
				allTagsData
					.filter(
						(tag): tag is string =>
							typeof tag === 'string' && tag !== ''
					)
					.forEach((tag) => {
						const splitTags = tag
							.split(':')
							.filter((tag) => tag !== '');
						(allTags as Array<string>).push(...splitTags);
					});
			} else {
				allTags = allTagsData?.split(':').filter((tag) => tag !== '');
			}
			const foundTag = allTags
				?.map((tag) => tag.replace(/^:(.*):$/i, '$1'))
				?.find((tag) => Object.keys(tagsData).includes(tag));
			return foundTag || undefined;
		},
		[tagsData]
	);

	useEffect(() => {
		const allTags = orgItem?.ALLTAGS || '';
		const foundTag = sanitizeTagsAndMatchData(allTags);
		if (foundTag) {
			const tagColor = tagsData?.[foundTag];
			tagColor && setForegroundColor(tagColor);
		}
	}, [sanitizeTagsAndMatchData, orgItem, tagsData]);

	const classString = `${styles.item}${
		readyState !== WSReadyState.OPEN || isWaitingForResponse
			? ' ' + styles.stale
			: ''
	}`;

	return (
		<>
			{itemText ? (
				<h1
					className={classString}
					style={{ backgroundColor: foregroundColor }}
				>
					{itemText}
				</h1>
			) : (
				<img src={logo} className={styles.logo} alt="logo" />
			)}
		</>
	);
};

export default OrgItem;
