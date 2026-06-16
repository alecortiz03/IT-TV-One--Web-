import { useEffect, useState } from 'react';

export default function DateTimeCard({
	style = {},
	backgroundColor = '#ffffff',
	borderColor = '#000000',
	textBackgroundColor = 'transparent',
	textColor = '#000000',
	borderRadius = 10,
	borderWidth = 2,
	width = '30vw',
	height = 'auto',
}) {
	const [currentTime, setCurrentTime] = useState('');

	useEffect(() => {
		const updateTime = () => {
			const now = new Date();

			const day = now.toLocaleDateString([], {
				weekday: 'long',
			});

			const time = now.toLocaleTimeString([], {
				hour: 'numeric',
				minute: 'numeric',
			});

			const date = now.toLocaleDateString([], {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});

			setCurrentTime(`${day}, ${time} - ${date}`);
		};

		updateTime();

		const interval = setInterval(updateTime, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div
			className='
				select-none
				flex
				justify-center
				items-center
				shadow-lg
				overflow-hidden
			'
			style={{
				width,
				height,
				minHeight: height === 'auto' ? 'clamp(24px, 4vw, 80px)' : undefined,
				padding: 'clamp(4px, 0.8vw, 16px)',
				backgroundColor,
				borderColor,
				borderRadius,
				borderWidth,
				borderStyle: 'solid',
				boxSizing: 'border-box',
				...style,
			}}>
			<p
				className='
					font-bold
					text-center
					whitespace-nowrap
				'
				style={{
					fontSize: 'clamp(8px, 2.2vw, 32px)',
					backgroundColor: textBackgroundColor,
					color: textColor,
					textShadow: '2px 2px 4px rgba(0,0,0,0.75)',
					lineHeight: 1.1,
				}}>
				{currentTime}
			</p>
		</div>
	);
}
