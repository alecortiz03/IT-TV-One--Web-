import { Icons } from '../AppData/Icons';
export default function HoursCard() {
	const width = 'clamp(320px, 33vw, 680px)';
	const height = 'clamp(180px, 17vw, 320px)';
	return (
		<div
			className='
		relative
		flex flex-col
		box-border
		overflow-hidden

		rounded-[clamp(22px,2.4vw,40px)]

		bg-slate-950/45
		backdrop-blur-[28px]

		border border-white/15

		shadow-[0_24px_70px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(255,255,255,0.04)]

		py-[clamp(10px,1vw,20px)]
	'
			style={{
				width,
				height,
			}}>
			<div
				className='
		pointer-events-none
		absolute
		-inset-[30%]
		bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.22),transparent_32%)]
	'
			/>
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
			{/* Header */}
			<div
				className='
	flex flex-row items-center
	w-full
	flex-1
	gap-[clamp(10px,1.5vw,24px)]
'>
				{' '}
				{/* Clock Logo */}
				<div
					className='flex justify-center items-center bbg-white/[0.08]
border border-white/15
backdrop-blur-xl
shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] w-1/9 aspect-square rounded-full ml-[clamp(10px,1.5vw,28px)]'>
					<img
						src={Icons.Clock}
						alt='Clock'
						className='w-8/9 aspect-square object-contain'
					/>
				</div>
				<p className='text-[clamp(18px,2vw,36px)] font-medium	tracking-[-0.02em] text-white/90'>
					IT Hours
				</p>
			</div>

			{/* Body */}
			<div
				className='
	w-full
	flex-[2]
	flex flex-col
	justify-evenly
'>
				{' '}
				<div className='flex flex-row justify-between items-center px-[clamp(10px,1.5vw,24px)] pt-[clamp(10px,1.4vw,28px)]'>
					<p className='text-[clamp(12px,1.3vw,26px)] text-white/65 font-light tracking-wide'>
						Monday - Friday
					</p>

					<p className='text-[clamp(12px,1.3vw,26px)] text-white/90 font-medium tracking-wide'>
						7 AM - 9 PM
					</p>
				</div>
				<div
					className='w-3/4 h-px bg-white/10'
					style={{ margin: '0 auto' }}
				/>
				<div className='flex flex-row justify-between items-center px-[clamp(10px,1.5vw,24px)] pt-[clamp(8px,1.2vw,24px)]'>
					<p className='text-[clamp(12px,1.3vw,26px)] text-white/65 font-light tracking-wide'>
						Saturday - Sunday
					</p>

					<p className='text-[clamp(12px,1.3vw,26px)] text-white/90 font-medium tracking-wide'>
						9 AM - 5 PM
					</p>
				</div>
				<div
					className='w-3/4 h-px bg-white/10'
					style={{ margin: '0 auto' }}
				/>
			</div>
		</div>
	);
}
