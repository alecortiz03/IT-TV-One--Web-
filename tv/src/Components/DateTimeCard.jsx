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

			setCurrentTime(`${day}, ${time}  -  ${date}`);
		};

		updateTime();

		const interval = setInterval(updateTime, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div
			className='
				select-none
				flex flex-row flex-wrap
				justify-center items-center
				shadow-lg
			'
			style={{
				width: width,
				height: height,
				backgroundColor,
				borderColor,
				borderRadius,
				borderWidth,
				borderStyle: 'solid',
				...style,
			}}>
			<p
				className='
					font-bold text-center shrink
					text-[7.5px]
					min-[400px]:text-[8.5px]
					min-[500px]:text-[12px]
					min-[550px]:text-[20px]
					min-[900px]:text-[22px]
					min-[1000px]:text-[50px]
				'
				style={{
					backgroundColor: textBackgroundColor,
					color: textColor,
					textShadow: '2px 2px 4px rgba(0,0,0,0.75)',
					lineHeight: 1,
				}}>
				{currentTime}
			</p>
		</div>
	);
}
