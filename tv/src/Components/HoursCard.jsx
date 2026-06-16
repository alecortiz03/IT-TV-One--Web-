export default function HoursCard({
	style = {},
	width = '450px',
	height = '260px',
	borderRadius = 20,
	borderWidth = 2,
	borderColor = '#000000',
	backgroundColor = '#ffffff',
	textColor = '#ffffff',
}) {
	return (
		<div
			className='
				select-none
				pt-3 shadow-lg
				flex flex-col items-center
			'
			style={{
				width,
				height,
				minWidth: 250,
				minHeight: 160,
				borderRadius,
				borderWidth,
				borderColor,
				backgroundColor,
				borderStyle: 'solid',
				...style,
			}}>
			<div className='flex flex-col justify-center items-center w-full'>
				<h2
					className='font-bold text-center w-full text-[16px] min-[400px]:text-[23px]'
					style={{
						color: textColor,
						textShadow: '1px 1px 2px rgba(0,0,0,0.75)',
					}}>
					IT Support Hours
				</h2>
				<hr className='border-t-2 border-white w-[60%] mt-1' />
			</div>

			<div className='flex flex-col justify-evenly items-center w-full gap-1 mt-2.5 px-3'>
				<p
					className='font-bold text-center text-[7.5px] min-[500px]:text-[12px] min-[900px]:text-[18px] min-[1000px]:text-[23px]'
					style={{
						color: textColor,
						textShadow: '1px 1px 2px rgba(0,0,0,0.75)',
					}}>
					Monday - Friday: 8:00 AM - 7:00 PM
				</p>

				<p
					className='font-bold text-center text-[7.5px] min-[500px]:text-[12px] min-[900px]:text-[18px] min-[1000px]:text-[23px]'
					style={{
						color: textColor,
						textShadow: '1px 1px 2px rgba(0,0,0,0.75)',
					}}>
					Saturday: 9:00 AM - 5:00 PM
				</p>

				<p
					className='font-bold text-center text-[7.5px] min-[500px]:text-[12px] min-[900px]:text-[18px] min-[1000px]:text-[23px]'
					style={{
						color: textColor,
						textShadow: '1px 1px 2px rgba(0,0,0,0.75)',
					}}>
					Sunday: Closed
				</p>
			</div>
		</div>
	);
}
