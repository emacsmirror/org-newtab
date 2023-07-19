import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import {
	MsgDirection,
	type MsgToTab,
	MsgToTabType,
	MsgToBGSWType,
	type WSCommonProps,
	getMsgToTabType,
} from '../lib/types';
import {
	SendResponseType,
	handleConfirmingAlive,
	handleMasterQueryConfirmation,
	sendMsgToBGSWPort,
} from '../lib/messages';
import useSingleWebsocket from 'hooks/useSingleWS';
import { LogLoc, LogMsgDir, logMsg, logMsgErr } from 'lib/logging';
import usePort from 'hooks/usePort';

export type WSContextProps = {
	updateMatchQuery: (matchQuery: string) => void;
	getItem: (matchQuery: string) => void;
	waitingForResponse: Array<number>;
} & WSCommonProps;

const WSContext = createContext<WSContextProps>({
	amMasterWS: false,
	sendJsonMessage: () => {
		return;
	},
	lastRecvJsonMessage: null,
	updateMatchQuery: () => {},
	getItem: () => {},
	waitingForResponse: [],
});

export default WSContext;

export const WSProvider: React.FC<{ children?: React.ReactNode }> = ({
	children,
}) => {
	const { sendJsonMessage, lastRecvJsonMessage, amMasterWS, setAmMasterWS } =
		useSingleWebsocket();
	const [waitingForResponse, setWaitingForResponse] = useState<Array<number>>(
		[]
	);
	const port = usePort();

	const isInitialRender = useRef(true);

	const updateMatchQuery = useCallback(
		(newMatchQuery: string) => {
			const resid = Math.floor(Math.random() * 1000000000);
			sendJsonMessage({
				command: 'updateMatchQuery',
				data: newMatchQuery,
				resid,
			});
			setWaitingForResponse((prevValue) => [...prevValue, resid]);
		},
		[sendJsonMessage]
	);

	const getItem = useCallback(
		(matchQuery: string) => {
			const resid = Math.floor(Math.random() * 1000000000);
			sendJsonMessage({
				command: 'getItem',
				data: matchQuery,
				resid,
			});
			setWaitingForResponse((prevValue) => [...prevValue, resid]);
		},
		[sendJsonMessage]
	);

	useEffect(() => {
		if (lastRecvJsonMessage === null) {
			return;
		}
		if (
			lastRecvJsonMessage &&
			lastRecvJsonMessage.type === 'ITEM' &&
			lastRecvJsonMessage.resid
		) {
			setWaitingForResponse((prevValue) => {
				const index = prevValue.indexOf(lastRecvJsonMessage.resid);
				if (index !== -1) {
					return prevValue.splice(index, 1);
				}
				return prevValue;
			});
		}
	}, [lastRecvJsonMessage]);

	const handlePassingMessage = useCallback(
		(message: MsgToTab) => {
			if (message.data) {
				sendJsonMessage(message.data);
			} else {
				logMsgErr(
					LogLoc.NEWTAB,
					LogMsgDir.RECV,
					'Bad or no data for updating match query',
					message?.data
				);
			}
		},
		[sendJsonMessage]
	);

	const handleMessage = useCallback(
		(
			message: MsgToTab,
			_sender: chrome.runtime.MessageSender,
			sendResponse: SendResponseType
		) => {
			if (message.direction !== MsgDirection.TO_NEWTAB) {
				return;
			}
			logMsg(
				LogLoc.NEWTAB,
				LogMsgDir.RECV,
				'Data recv:',
				getMsgToTabType(message.type),
				message?.data ? `with data ${JSON.stringify(message.data)}` : ''
			);
			switch (message.type) {
				case MsgToTabType.CONFIRM_IF_MASTER_WS:
					handleMasterQueryConfirmation(sendResponse, amMasterWS);
					break;
				case MsgToTabType.YOU_ARE_MASTER_WS:
					setAmMasterWS(true);
					break;
				case MsgToTabType.YOU_ARE_CLIENT_WS:
					setAmMasterWS(false);
					break;
				case MsgToTabType.CONFIRM_IF_ALIVE:
					handleConfirmingAlive(sendResponse);
					break;
				case MsgToTabType.PASS_ON_TO_EMACS:
					handlePassingMessage(message);
					break;
			}
		},
		[setAmMasterWS, amMasterWS, handlePassingMessage]
	);

	useEffect(() => {
		if (!chrome.runtime.onMessage.hasListener(handleMessage)) {
			chrome.runtime.onMessage.addListener(handleMessage);
		}
		return () => {
			chrome.runtime.onMessage.removeListener(handleMessage);
		};
	}, [handleMessage]);

	useEffect(() => {
		if (isInitialRender.current) {
			// 1. Ask if any master web sockets exist
			sendMsgToBGSWPort(MsgToBGSWType.QUERY_STATUS_OF_WS, port);
			isInitialRender.current = false;
		}
	}, [port]);

	return (
		<WSContext.Provider
			value={{
				amMasterWS,
				sendJsonMessage,
				lastRecvJsonMessage,
				updateMatchQuery,
				getItem,
				waitingForResponse,
			}}
		>
			{children}
		</WSContext.Provider>
	);
};

export const { Consumer: WSConsumer } = WSContext;
