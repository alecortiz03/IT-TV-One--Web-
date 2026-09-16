import { useEffect, useState } from 'react';

export default function DateTimeCard({
	style = {},
	backgroundColor = 'rgba(15, 23, 42, 0.45)',
	borderColor = 'rgba(255,255,255,0.15)',
	textBackgroundColor = 'transparent',
	textColor = 'rgba(255,255,255,0.9)',
	borderRadius = 'clamp(22px, 2.4vw, 40px)',
	borderWidth = 1,
	width = '72vw',
	height = '11vw',
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
				minute: '2-digit',
			});

			const date = now.toLocaleDateString([], {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});

			setCurrentTime(`${day} · ${time} · ${date}`);
		};

		updateTime();

		const interval = setInterval(updateTime, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div
			className='
				relative
				select-none
				flex
				justify-center
				items-center
				overflow-hidden
				box-border

				bg-slate-950/45
				backdrop-blur-[28px]

				border
				border-white/15

				shadow-[0_24px_70px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(255,255,255,0.04)]
			'
			style={{
				width,
				height,
				padding: 'clamp(10px, 1.2vw, 20px)',
				backgroundColor,
				borderColor,
				borderRadius,
				borderWidth,
				borderStyle: 'solid',
				boxSizing: 'border-box',
				...style,
			}}>
			{/* Soft glass highlight */}
			<div
				className='
					pointer-events-none
					absolute
					-inset-[30%]
					bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.22),transparent_32%)]
				'
			/>

			{/* Top specular highlight */}
			<div
				className='
					pointer-events-none
					absolute
					top-0
					left-[8%]
					right-[8%]
					h-px
					bg-gradient-to-r
					from-transparent
					via-white/35
					to-transparent
				'
			/>

			{/* Subtle inner glow */}
			<div
				className='
					pointer-events-none
					absolute
					inset-0
					rounded-[inherit]
					shadow-[inset_0_0_30px_rgba(255,255,255,0.03)]
				'
			/>

			{/* Date / Time Text */}
			<p
				className='
					relative
					z-10
					font-medium
					text-center
					whitespace-nowrap
					tracking-[-0.02em]
				'
				style={{
					fontSize: 'clamp(20px, 2.3vw, 42px)',
					backgroundColor: textBackgroundColor,
					color: textColor,
					lineHeight: 1.1,
					margin: 0,
				}}>
				{currentTime}
			</p>
		</div>
	);
}
