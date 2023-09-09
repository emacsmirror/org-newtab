import * as styles from './style.module.css';
import { useAppSelector } from 'app/hooks';
import classNames from 'classnames';
import {
	selectedIsClockedIn,
	selectedItemClockStartTime,
	selectedItemEffortMinutes,
	selectedItemPreviouslyClockedMinutes,
} from 'modules/emacs/emacsSlice';
import { selectedIsInSync } from 'modules/ws/wsSlice';
import { useCallback, useEffect, useState } from 'react';

const ClockedTime: React.FC = () => {
	const isInSync = useAppSelector(selectedIsInSync);
	const isClockedIn = useAppSelector(selectedIsClockedIn);

	const itemPreviouslyClockedMinutes = useAppSelector(
		selectedItemPreviouslyClockedMinutes
	);
	const itemEffortMinutes = useAppSelector(selectedItemEffortMinutes);
	const itemClockStartTime = useAppSelector(selectedItemClockStartTime);

	const [minutesClockedIn, setMinutesClockedIn] = useState(
		itemPreviouslyClockedMinutes
	);
	const minutesToTimeString = useCallback((minutes: number): string => {
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;

		const formattedHours = hours.toString();
		const formattedMinutes = remainingMinutes.toString().padStart(2, '0');

		return `${formattedHours}:${formattedMinutes}`;
	}, []);

	const calculateMinutesClockedIn = useCallback(() => {
		const now = new Date().getTime();
		const start = new Date(itemClockStartTime as number).getTime();
		const diff = Math.floor((now - start) / 1000 / 60);
		const total = diff + itemPreviouslyClockedMinutes;
		setMinutesClockedIn(total);
	}, [itemClockStartTime, itemPreviouslyClockedMinutes]);

	useEffect(() => {
		calculateMinutesClockedIn();
		const interval = setInterval(calculateMinutesClockedIn, 5000);
		return () => clearInterval(interval);
	}, [calculateMinutesClockedIn]);

	let overtime = false;
	if (
		itemEffortMinutes &&
		itemClockStartTime &&
		itemClockStartTime > itemEffortMinutes
	) {
		overtime = true;
	}

	if (!isInSync || !isClockedIn) {
		return null;
	}

	return (
		<div className={styles.clock}>
			<span className={classNames({ [styles.overtime]: overtime })}>
				{minutesToTimeString(minutesClockedIn)}
			</span>
			{itemEffortMinutes && (
				<>
					{' / '}
					{minutesToTimeString(itemEffortMinutes)}
				</>
			)}
		</div>
	);
};

export default ClockedTime;
