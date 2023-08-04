import '../lib/wdyr';
import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from '@plasmohq/redux-persist/integration/react';
import '@fontsource/public-sans/700.css';
import './index.css';
import ConnectionStatusIndicator from 'components/ConnectionStatusIndicator';
import OptionsMenu from 'components/OptionsMenu';
import OrgItem from 'components/OrgItem';
import LoadingBar from 'components/LoadingBar';
import store, { persistor } from '../app/store';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { WSReadyState } from 'lib/types';
import { selectedReadyState } from 'modules/ws/wsSlice';
import { selectedMatchQuery, getItem } from 'modules/emacs/emacsSlice';
import { establishRole, selectedAmMasterWs } from 'modules/role/roleSlice';
import { useAppDispatch } from '../app/hooks';
import { setStateAsResolved, establishRole } from 'modules/role/roleSlice';

const IndexNewtab: React.FC = () => {
	const dispatch = useAppDispatch();
	const amMasterWS = useAppSelector(selectedAmMasterWs);
	const readyState = useAppSelector(selectedReadyState);
	const matchQuery = useAppSelector(selectedMatchQuery);
	const isInitialRender = useRef(true);
	const hasSentInitialQuery = useRef(false);

	useEffect(() => {
		if (isInitialRender.current) {
			isInitialRender.current = false;
			dispatch(establishRole());
		}
	}, [dispatch]);

	/**
	 * Effect should fire after websocket opened so keep the readyState effect.
	 */
	useEffect(() => {
		if (
			!hasSentInitialQuery.current &&
			amMasterWS &&
			isInitialStateResolved &&
			matchQuery &&
			readyState === WSReadyState.OPEN
		) {
			dispatch(getItem());
			hasSentInitialQuery.current = true;
		}
	}, [dispatch, matchQuery, amMasterWS, isInitialStateResolved, readyState]);

	return (
		<main className="app">
			<LoadingBar animationDuration={200} />
			<OptionsMenu />
			<ConnectionStatusIndicator />
			<OrgItem />
		</main>
	);
};

const RootContextWrapper: React.FC = () => {
	// TODO: Strict Mode
	return (
		<Provider store={store}>
			<PersistGate persistor={persistor}>
				{(isInitialStateResolved) => {
					if (isInitialStateResolved) {
						store.dispatch(setStateAsResolved());
					}
					return <IndexNewtab />;
				}}
			</PersistGate>
		</Provider>
	);
};

export default RootContextWrapper;
