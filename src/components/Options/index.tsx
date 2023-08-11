import * as styles from './style.module.css';
import { memo, useCallback, useState } from 'react';
import { useAppSelector } from '../../app/hooks';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { OptionCategories, selectedOptionCategory } from 'modules/ui/uiSlice';
import BehaviorPanel from 'components/BehaviorPanel';
import LayoutPanel from 'components/LayoutPanel';
import ThemingPanel from 'components/ThemingPanel';
import DebugPanel from 'components/DebugPanel';
import OptionsBar from 'components/OptBar';
import OptionsButton from 'components/OptButton';

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

const slideTransitionTimeout = 500;
const slideTransitionClassNames = {
	enter: styles['slide-transition-enter'],
	enterActive: styles['slide-transition-enter-active'],
	exit: styles['slide-transition-exit'],
	exitActive: styles['slide-transition-exit-active'],
};

const MemoizedCSSTransition = memo(CSSTransition, (prevProps, nextProps) => {
	return (
		prevProps.key === nextProps.key &&
		prevProps.in === nextProps.in &&
		prevProps.enter === nextProps.enter &&
		prevProps.exit === nextProps.exit
	);
});

const OptionsContent: React.FC = () => {
	const selectedCategory = useAppSelector(selectedOptionCategory);
	return (
		<div className={styles['options-content-container']}>
			<div className={styles['options-content']}>
				<TransitionGroup component={null}>
					<MemoizedCSSTransition
						key={selectedCategory}
						timeout={slideTransitionTimeout}
						classNames={slideTransitionClassNames}
						unmountOnExit
					>
						<OptionsPanel selectedCategory={selectedCategory} />
					</MemoizedCSSTransition>
				</TransitionGroup>
			</div>
		</div>
	);
};

const Options: React.FC = () => {
	const [optionsVisible, setOptionsVisible] = useState(false);
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
				<OptionsBar optionsVisible={optionsVisible} />
				<OptionsContent />
			</div>
		</>
	);
};

export default Options;
