export default function HoursCard({
	style = {},
	width = 'clamp(260px, 32vw, 450px)',
	height = 'auto',
	borderRadius = 'clamp(12px, 2vw, 20px)',
	borderWidth = 'clamp(1px, 0.2vw, 2px)',
	borderColor = '#000000',
	backgroundColor = '#ffffff',
	textColor = '#ffffff',
}) {
	return (
		<div
			className='
				select-none
				shadow-lg
				flex flex-col items-center
			'
			style={{
				width,
				height,
				minWidth: 0,
				minHeight: 'clamp(140px, 14vw, 260px)',
				padding: 'clamp(8px, 1.2vw, 20px)',
				borderRadius,
				borderWidth,
				borderColor,
				backgroundColor,
				borderStyle: 'solid',
				boxSizing: 'border-box',
				...style,
			}}>
			<div className='flex flex-col justify-center items-center w-full'>
				<h2
					className='font-bold text-center w-full'
					style={{
						color: textColor,
						fontSize: 'clamp(14px, 2vw, 28px)',
						lineHeight: 1.1,
						margin: 0,
						textShadow: '1px 1px 2px rgba(0,0,0,0.75)',
					}}>
					IT Support Hours
				</h2>

				<hr
					className='border-white'
					style={{
						width: '60%',
						marginTop: 'clamp(4px, 0.5vw, 10px)',
						borderTopWidth: 'clamp(1px, 0.15vw, 2px)',
					}}
				/>
			</div>

			<div
				className='flex flex-col justify-evenly items-center w-full'
				style={{
					gap: 'clamp(4px, 0.7vw, 12px)',
					marginTop: 'clamp(8px, 1vw, 18px)',
					paddingLeft: 'clamp(4px, 1vw, 12px)',
					paddingRight: 'clamp(4px, 1vw, 12px)',
				}}>
				<p
					className='font-bold text-center'
					style={{
						color: textColor,
						fontSize: 'clamp(9px, 1.45vw, 23px)',
						lineHeight: 1.15,
						margin: 0,
						textShadow: '1px 1px 2px rgba(0,0,0,0.75)',
					}}>
					Monday - Friday: 8:00 AM - 7:00 PM
				</p>

				<p
					className='font-bold text-center'
					style={{
						color: textColor,
						fontSize: 'clamp(9px, 1.45vw, 23px)',
						lineHeight: 1.15,
						margin: 0,
						textShadow: '1px 1px 2px rgba(0,0,0,0.75)',
					}}>
					Saturday: 9:00 AM - 5:00 PM
				</p>

				<p
					className='font-bold text-center'
					style={{
						color: textColor,
						fontSize: 'clamp(9px, 1.45vw, 23px)',
						lineHeight: 1.15,
						margin: 0,
						textShadow: '1px 1px 2px rgba(0,0,0,0.75)',
					}}>
					Sunday: Closed
				</p>
			</div>
		</div>
	);
}
