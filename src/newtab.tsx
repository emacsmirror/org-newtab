/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-console */
import { useCallback, useEffect, useRef, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { usePrevious } from '@react-hookz/web';
import { Storage } from '@plasmohq/storage';
import { useStorage } from '@plasmohq/storage/hook';
import '@fontsource/public-sans/700.css';
import './newtab.css';
import type { JsonValue } from 'react-use-websocket/dist/lib/types';

type ConnectionStatusIndicatorProps = {
	readyState: ReadyState;
};

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
	readyState,
}) => {
	const connectionStatus = {
		[ReadyState.CONNECTING]: 'Connecting',
		[ReadyState.OPEN]: 'Open',
		[ReadyState.CLOSING]: 'Closing',
		[ReadyState.CLOSED]: 'Closed',
		[ReadyState.UNINSTANTIATED]: 'Uninstantiated',
	}[readyState];

	return <p className="connection-status">{connectionStatus}</p>;
};

type OptionsMenuProps = {
	matchQuery: string;
	setMatchQuery: (matchQuery: string) => void;
	lastRecvJsonMessage: JsonValue | null;
};

const OptionsMenu: React.FC<OptionsMenuProps> = ({
	matchQuery,
	setMatchQuery,
	lastRecvJsonMessage,
}) => {
	const [optionsVisible, setOptionsVisible] = useState(false);

	const handleMatchQuerySubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			const { currentTarget } = event;
			const data = new FormData(currentTarget);
			const formMatchQuery = data.get('matchQuery');
			if (formMatchQuery && typeof formMatchQuery === 'string') {
				setMatchQuery(formMatchQuery);
			}
		},
		[setMatchQuery]
	);

	const matchQueryInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (matchQueryInputRef.current) {
			matchQueryInputRef.current.value = matchQuery;
		}
	}, [matchQuery, matchQueryInputRef]);

	const toggleMenu = useCallback(() => {
		setOptionsVisible(!optionsVisible);
	}, [optionsVisible]);

	const optionsMenuButtonClass = [
		'options-menu-button',
		optionsVisible ? 'active' : '',
	].join(' ');

	const optionsMenuClass = [
		'options-menu',
		optionsVisible ? 'active' : '',
	].join(' ');

	return (
		<>
			<button className={optionsMenuButtonClass} onClick={toggleMenu}>
				<div className="options-menu-button-bar1"></div>
				<div className="options-menu-button-bar2"></div>
				<div className="options-menu-button-bar3"></div>
			</button>
			<nav className={optionsMenuClass}>
				<form method="post" onSubmit={handleMatchQuerySubmit}>
					<input
						type="text"
						name="matchQuery"
						defaultValue={matchQuery}
						ref={matchQueryInputRef}
					/>
					<button type="submit">Pull data</button>
				</form>
				{lastRecvJsonMessage ? (
					<>
						Last message:
						<pre className="options-menu-json">
							{JSON.stringify(lastRecvJsonMessage, null, 2)}
							{/*TODO: Display null*/}
						</pre>
					</>
				) : null}
			</nav>
		</>
	);
};

type OrgItemProps = {
	itemText: string | null;
	foregroundColor?: string;
};

const OrgItem: React.FC<OrgItemProps> = ({ itemText, foregroundColor }) => {
	return (
		<>
			{itemText && (
				<div
					className="org-item"
					style={{ backgroundColor: foregroundColor }}
				>
					{itemText}
				</div>
			)}
		</>
	);
};

type AllTagsRecv = string | Array<string | number>;

type WebSocketItemMessage = {
	type: 'ITEM';
	data: {
		ITEM: string;
		ALLTAGS?: AllTagsRecv;
	};
};

type WebSocketTagsMessage = {
	type: 'TAGS';
	data: {
		[key: string]: string;
	};
};

type WebSocketRecvMessage = WebSocketItemMessage | WebSocketTagsMessage | null;

const IndexNewtab: React.FC = () => {
	const {
		sendJsonMessage,
		lastJsonMessage: lastRecvJsonMessage,
		readyState,
	} = useWebSocket<WebSocketRecvMessage>('ws://localhost:35942/');

	// One tab is the master and the others talk to it
	// The master tab is the one that has the websocket connection
	// The master tab is the one that sends the data to the other tabs
	// If master tab is killed, a new websocket connection is established
	// ^ This will work, as Emacs is erroring out with MULTIPLE websocket connections
	// As long as you maintain only one connection, it doesn't matter if you
	// establish multiple opens
	// Idea here is that the port messaging will work to keep talking between
	// all the newtabs even if the bg dies (possibly false assumption)

	// NEXT: Background won't work this way as Plasmo only allows for handlers
	// The Port API is still the way to go, have to implement it manually without
	// bg ideally, then see if it works in firefox or options therein

	// Also should figure out a way to identify this failure in Emacs

	const port = useRef(chrome.runtime.connect());
	const isInitialRender = useRef(true);
	const handleMessage = useCallback((message: string) => {
		console.log('Data recv on newtab end: ', message);
	}, []);

	useEffect(() => {
		if (isInitialRender.current) {
			port.current.postMessage('Hello from newtab!');
			port.current.onMessage.addListener(handleMessage);
			isInitialRender.current = false;
		}
	}, [handleMessage]);

	//////////////////////////////////////////////////////////////////////
	// const { send, listen } = usePort('ws');

	const storageInstanceRef = useRef<Storage>(new Storage({ area: 'local' }));
	const [matchQuery, setMatchQuery] = useStorage<string>(
		{
			key: 'matchQuery',
			instance: storageInstanceRef.current,
		},
		(v) => (v === undefined ? 'TODO="TODO"' : v)
	);
	const previousMatchQuery = usePrevious(matchQuery);
	const [itemText, setItemText] = useState<string | null>(null);
	const [tagsData, setTagsData] = useState<Record<string, string>>({});
	const [foregroundColor, setForegroundColor] = useState<string | undefined>(
		undefined
	);

	const sanitizeTagsAndMatchData = useCallback(
		(allTagsData?: AllTagsRecv) => {
			let allTags: Array<string> | string | undefined;
			if (Array.isArray(allTagsData)) {
				allTags = allTagsData.filter(
					(tag): tag is string =>
						typeof tag === 'string' && tag !== ''
				);
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
		switch (lastRecvJsonMessage?.type) {
			case 'ITEM':
				setItemText(lastRecvJsonMessage?.data?.ITEM || null);
				setForegroundColor(
					tagsData[
						sanitizeTagsAndMatchData(
							lastRecvJsonMessage?.data?.ALLTAGS
						) || ''
					]
				);
				break;
			case 'TAGS':
				setTagsData(lastRecvJsonMessage?.data || {});
				break;
			default:
				console.error('Unknown message type: ', lastRecvJsonMessage);
				break;
		}
	}, [
		lastRecvJsonMessage,
		tagsData,
		setTagsData,
		setItemText,
		setForegroundColor,
		sanitizeTagsAndMatchData,
	]);

	useEffect(() => {
		if (previousMatchQuery !== matchQuery) {
			sendJsonMessage({
				command: 'updateMatchQuery',
				data: matchQuery,
			});
		} else {
			sendJsonMessage({
				command: 'getItem',
				data: matchQuery,
			});
		}
	}, [matchQuery, previousMatchQuery, sendJsonMessage]);

	return (
		<div className="app">
			<OptionsMenu
				matchQuery={matchQuery}
				setMatchQuery={setMatchQuery}
				lastRecvJsonMessage={lastRecvJsonMessage}
			/>
			<ConnectionStatusIndicator readyState={readyState} />
			<OrgItem foregroundColor={foregroundColor} itemText={itemText} />
		</div>
	);
};

export default IndexNewtab;
