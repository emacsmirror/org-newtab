import * as styles from './style.module.css';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
	selectedMatchQuery,
	setMatchQueryTo,
} from '../../modules/emacs/emacsSlice';
import {
	selectedAmMasterRole,
	selectedStateResolved,
} from 'modules/role/roleSlice';
import { selectedWSPort, setWSPortTo } from 'modules/ws/wsSlice';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

type OptionCategories = 'Behavior' | 'Layout' | 'Theming' | 'Debug';

type OptionsButtonProps = {
	optionsVisible: boolean;
	toggleMenu: () => void;
};

const OptionsButton: React.FC<OptionsButtonProps> = ({
	optionsVisible,
	toggleMenu,
}) => {
	const optionsMenuButtonClass = [
		styles.button,
		optionsVisible ? styles.active : '',
	].join(' ');

	const optionsMenuCloseButtonClass = [
		styles['close-button'],
		optionsVisible ? styles.active : '',
	].join(' ');

	return (
		<>
			<button
				aria-label={chrome.i18n.getMessage('optionsMenu')}
				className={optionsMenuButtonClass}
				onClick={toggleMenu}
			>
				<div className={styles['button-bar1']}></div>
				<div className={styles['button-bar2']}></div>
				<div className={styles['button-bar3']}></div>
			</button>
			<button
				className={optionsMenuCloseButtonClass}
				onClick={toggleMenu}
			>
				<div className={styles['close-button-bar1']}></div>
				<div className={styles['close-button-bar2']}></div>
			</button>
		</>
	);
};

type OptionsBarProps = {
	selectedCategory: OptionCategories;
	setSelectedCategory: (category: OptionCategories) => void;
};

const OptionsBar: React.FC<OptionsBarProps> = ({ setSelectedCategory }) => {
	const handleCategoryClick = useCallback(
		(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
			const { currentTarget } = event;
			const category = currentTarget.dataset.category as OptionCategories;
			if (category) {
				setSelectedCategory(category);
			}
		},
		[setSelectedCategory]
	);

	return (
		<nav className={styles['options-bar']}>
			<button data-category="Behavior" onClick={handleCategoryClick}>
				Behavior
			</button>
			<button data-category="Layout" onClick={handleCategoryClick}>
				Layout
			</button>
			<button data-category="Theming" onClick={handleCategoryClick}>
				Theming
			</button>
			<button data-category="Debug" onClick={handleCategoryClick}>
				Debug
			</button>
		</nav>
	);
};

type OptionsPanelProps = {
	selectedCategory: OptionCategories;
};

const OptionsPanel: React.FC<OptionsPanelProps> = ({ selectedCategory }) => {
	const PanelToRender = useCallback(() => {
		switch (selectedCategory) {
			case 'Behavior':
				return <BehaviorPanel />;
			case 'Layout':
				return <LayoutPanel />;
			case 'Theming':
				return <ThemingPanel />;
			case 'Debug':
				return <DebugPanel />;
		}
	}, [selectedCategory]);
	return (
		<div className={styles['options-panel']}>
			<PanelToRender />
		</div>
	);
};

type OptionsContentProps = {
	selectedCategory: OptionCategories;
};

const OptionsContent: React.FC<OptionsContentProps> = ({
	selectedCategory,
}) => {
	return (
		<div className={styles['options-content-container']}>
			<div className={styles['options-content']}>
				<TransitionGroup component={null}>
					<CSSTransition
						key={selectedCategory}
						timeout={slideTransitionTimeout}
						classNames={slideTransitionClassNames}
						unmountOnExit
					>
						<OptionsPanel selectedCategory={selectedCategory} />
					</CSSTransition>
				</TransitionGroup>
			</div>
		</div>
	);
};

const MemoizedOptionsContent = memo(OptionsContent);

const BehaviorPanel: React.FC = () => {
	const dispatch = useAppDispatch();
	const matchQuery = useAppSelector(selectedMatchQuery);
	const wsPort = useAppSelector(selectedWSPort);
	const matchQueryInputRef = useRef<HTMLInputElement>(null);
	const wsPortInputRef = useRef<HTMLInputElement>(null);
	const isInitialStateResolved = useAppSelector(selectedStateResolved);

	const handleFormSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			const { currentTarget } = event;
			const data = new FormData(currentTarget);
			const formMatchQuery = data.get('matchQuery');
			if (formMatchQuery && typeof formMatchQuery === 'string') {
				dispatch(setMatchQueryTo(formMatchQuery));
			}
			const formWSPort = data.get('wsPort');
			if (formWSPort && typeof formWSPort === 'string') {
				const portNumber = parseInt(formWSPort, 10);
				if (
					!isNaN(portNumber) &&
					portNumber > 0 &&
					portNumber < 65536 &&
					portNumber !== wsPort
				) {
					dispatch(setWSPortTo(portNumber));
				}
			}
		},
		[dispatch, wsPort]
	);

	useEffect(() => {
		if (matchQueryInputRef.current && matchQuery) {
			matchQueryInputRef.current.value = matchQuery;
		}
	}, [isInitialStateResolved, matchQuery]);

	useEffect(() => {
		if (wsPortInputRef.current && wsPort) {
			wsPortInputRef.current.value = wsPort.toString();
		}
	}, [isInitialStateResolved, wsPort]);

	return (
		<form className={styles.form} method="post" onSubmit={handleFormSubmit}>
			<label htmlFor="matchQuery">
				{chrome.i18n.getMessage('matchQuery')}:{' '}
			</label>
			<input
				type="text"
				name="matchQuery"
				defaultValue={matchQuery}
				ref={matchQueryInputRef}
				aria-label={chrome.i18n.getMessage('matchQuery')}
			/>
			<label htmlFor="wsPort">{chrome.i18n.getMessage('wsPort')}:</label>
			<input
				type="number"
				name="wsPort"
				defaultValue={wsPort}
				ref={wsPortInputRef}
				aria-label={chrome.i18n.getMessage('wsPort')}
			/>
			<button type="submit" disabled={false}>
				{chrome.i18n.getMessage('saveOptions')}
			</button>
		</form>
	);
};

const DebugPanel: React.FC = () => {
	const isInitialStateResolved = useAppSelector(selectedStateResolved);
	const amMasterRole = useAppSelector(selectedAmMasterRole);
	const masterStatus = amMasterRole
		? chrome.i18n.getMessage('masterRole')
		: chrome.i18n.getMessage('clientRole');
	return (
		<>
			<div
				data-testid="initial-state"
				className={styles['initial-state']}
			>
				{chrome.i18n.getMessage('storageStatus')}:{' '}
				{isInitialStateResolved
					? chrome.i18n.getMessage('storageResolved')
					: chrome.i18n.getMessage('storageUnresolved')}
			</div>
			<div
				data-testid="websocket-role"
				className={styles['websocket-role']}
			>
				{chrome.i18n.getMessage('websocketRole')}: {masterStatus}
			</div>
		</>
	);
};

const LayoutPanel: React.FC = () => {
	return null;
};

const ThemingPanel: React.FC = () => {
	return null;
};

const slideTransitionTimeout = 500;
const slideTransitionClassNames = {
	enter: styles['slide-transition-enter'],
	enterActive: styles['slide-transition-enter-active'],
	exit: styles['slide-transition-exit'],
	exitActive: styles['slide-transition-exit-active'],
};

const OptionsMenu: React.FC = () => {
	const [optionsVisible, setOptionsVisible] = useState(false);
	const [selectedCategory, setSelectedCategory] =
		useState<OptionCategories>('Behavior');

	const toggleMenu = useCallback(() => {
		setOptionsVisible(!optionsVisible);
	}, [optionsVisible]);

	const optionsMenuClass = [
		styles['options-menu'],
		optionsVisible ? styles.active : '',
	].join(' ');

	return (
		<>
			<OptionsButton
				optionsVisible={optionsVisible}
				toggleMenu={toggleMenu}
			/>
			<div className={optionsMenuClass}>
				<OptionsBar
					selectedCategory={selectedCategory}
					setSelectedCategory={setSelectedCategory}
				/>
				<MemoizedOptionsContent selectedCategory={selectedCategory} />
			</div>
		</>
	);
};

export default OptionsMenu;
