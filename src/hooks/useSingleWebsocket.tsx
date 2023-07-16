import useWebSocket from 'react-use-websocket';
import type { SendJsonMessage } from 'react-use-websocket/dist/lib/types';
import type { WSCommonProps, EmacsRecvMsg } from '../util/types';
import useValue from './useValue';
import { useState } from 'react';

type useSingleWebsocket = () => WSCommonProps & {
	amMasterWS: boolean;
	setAmMasterWS: (amMasterWS: boolean) => void;
};

const useSingleWebsocket: useSingleWebsocket = () => {
	const [amMasterWS, setAmMasterWS] = useState(false);
	let sendJsonMessage: SendJsonMessage = () => {
		return;
	};
	let lastRecvJsonMessage: EmacsRecvMsg = null;
	const { setValue: setReadyState } = useValue('readyState');

	const {
		sendJsonMessage: sendJsonMessageMaster,
		lastJsonMessage: lastRecvJsonMessageMaster,
		readyState: readyStateMaster,
	} = useWebSocket<EmacsRecvMsg>(amMasterWS ? 'ws://localhost:35942/' : null);

	if (amMasterWS) {
		sendJsonMessage = sendJsonMessageMaster;
		lastRecvJsonMessage = lastRecvJsonMessageMaster;
		setReadyState(readyStateMaster);
	}

	return {
		sendJsonMessage,
		lastRecvJsonMessage,
		amMasterWS,
		setAmMasterWS,
	};
};

export default useSingleWebsocket;
