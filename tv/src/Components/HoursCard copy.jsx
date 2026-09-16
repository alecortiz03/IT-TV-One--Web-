export default function HoursCard({
	style = {},
	width = 'clamp(260px, 32vw, 450px)',
	height = 'clamp(180px, 19vw, 300px)',
	borderRadius = 'clamp(18px, 2.5vw, 32px)',
	borderWidth = '1px',
	borderColor = 'rgba(255,255,255,0.16)',
	backgroundColor = 'rgba(10, 15, 25, 0.72)',
	textColor = '#ffffff',
}) {
	return (
		<div
			className='
		select-none
		flex flex-col items-center
		overflow-hidden
		backdrop-blur-2xl
	'
			style={{
				width,
				height,

				minWidth: 0,
				minHeight: 'clamp(160px, 16vw, 280px)',

				padding: 'clamp(12px, 1.4vw, 22px)',

				borderRadius,
				borderWidth,
				borderColor,
				borderStyle: 'solid',

				background: `
			linear-gradient(
				145deg,
				rgba(255,255,255,0.10),
				rgba(255,255,255,0.025)
			),
			${backgroundColor}
		`,

				boxShadow: `
			0 25px 60px rgba(0,0,0,0.45),
			inset 0 1px 0 rgba(255,255,255,0.18),
			inset 0 -1px 0 rgba(255,255,255,0.04)
		`,

				boxSizing: 'border-box',

				...style,
			}}>
			{/* Header */}
			<div className='flex flex-col justify-center items-center w-full'>
				<h2
					className='font-bold text-center w-full'
					style={{
						color: textColor,
						fontSize: 'clamp(20px, 2vw, 34px)',
						lineHeight: 1.1,
						margin: 0,
						textShadow: '1px 1px 2px rgba(0,0,0,0.75)',
					}}>
					IT Support Hours
				</h2>

				<hr
					className='border-white'
					style={{
						width: '70%',
						marginTop: 'clamp(6px, 0.6vw, 12px)',
						borderTopWidth: 'clamp(1px, 0.15vw, 2px)',
					}}
				/>
			</div>

			{/* Hours */}
			<div
				className='flex flex-col justify-center items-center w-full'
				style={{
					gap: 'clamp(10px, 1vw, 18px)',
					marginTop: 'clamp(12px, 1.2vw, 22px)',
					paddingLeft: 'clamp(2px, 0.5vw, 8px)',
					paddingRight: 'clamp(2px, 0.5vw, 8px)',
				}}>
				{/* Weekdays */}
				<p
					className='font-bold text-center w-full'
					style={{
						color: textColor,
						fontSize: 'clamp(18px, 1.7vw, 28px)',
						lineHeight: 1.2,
						margin: 0,
						textShadow: '1px 1px 2px rgba(0,0,0,0.75)',
						overflowWrap: 'break-word',
					}}>
					Monday - Friday: 7:00 AM - 9:00 PM
				</p>

				{/* Weekends */}
				<p
					className='font-bold text-center w-full'
					style={{
						color: textColor,
						fontSize: 'clamp(18px, 1.7vw, 28px)',
						lineHeight: 1.2,
						margin: 0,
						textShadow: '1px 1px 2px rgba(0,0,0,0.75)',
						overflowWrap: 'break-word',
					}}>
					Saturday - Sunday: 9:00 AM - 5:00 PM
				</p>
			</div>
		</div>
	);
}
