import { useEffect, useState } from 'react';

export default function WeatherCard({
	style = {},
	width = '20vw',
	height = '11vw',
	backgroundColor = 'rgba(15, 23, 42, 0.45)',
	borderColor = 'rgba(255,255,255,0.15)',
	borderRadius = 'clamp(22px, 2.4vw, 40px)',
	borderWidth = 1,
	textColor = 'rgba(255,255,255,0.9)',
}) {
	const latitude = 53.54707375500362;
	const longitude = -113.50601718049307;

	const [weather, setWeather] = useState(null);
	const [message, setMessage] = useState('Loading weather...');

	const weatherUrl =
		`https://api.open-meteo.com/v1/forecast` +
		`?latitude=${latitude}` +
		`&longitude=${longitude}` +
		`&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
		`&timezone=auto`;

	function getWeatherInfo(code) {
		const weatherMap = {
			0: {
				title: 'Clear sky',
				image: 'https://openweathermap.org/img/wn/01d@4x.png',
			},
			1: {
				title: 'Mostly clear',
				image: 'https://openweathermap.org/img/wn/02d@4x.png',
			},
			2: {
				title: 'Partly cloudy',
				image: 'https://openweathermap.org/img/wn/03d@4x.png',
			},
			3: {
				title: 'Overcast',
				image: 'https://openweathermap.org/img/wn/04d@4x.png',
			},
			45: {
				title: 'Foggy',
				image: 'https://openweathermap.org/img/wn/50d@4x.png',
			},
			61: {
				title: 'Light rain',
				image: 'https://openweathermap.org/img/wn/10d@4x.png',
			},
			71: {
				title: 'Light snow',
				image: 'https://openweathermap.org/img/wn/13d@4x.png',
			},
			95: {
				title: 'Thunderstorm',
				image: 'https://openweathermap.org/img/wn/11d@4x.png',
			},
		};

		return (
			weatherMap[code] || {
				title: 'Current weather',
				image: null,
			}
		);
	}

	useEffect(() => {
		const fetchWeather = async () => {
			try {
				const response = await fetch(weatherUrl);

				if (!response.ok) {
					throw new Error(`Weather request failed: ${response.status}`);
				}

				const data = await response.json();

				if (!data.current) {
					throw new Error('No current weather data found');
				}

				setWeather(data.current);
				setMessage('');
			} catch (error) {
				console.log('Weather error:', error);

				setWeather(null);
				setMessage('Could not load weather');
			}
		};

		// Load immediately
		fetchWeather();

		// Refresh every 30 minutes
		const interval = setInterval(fetchWeather, 30 * 60 * 1000);

		return () => clearInterval(interval);
	}, [weatherUrl]);

	const weatherInfo = weather ? getWeatherInfo(weather.weather_code) : null;

	return (
		<div
			className='
				relative
				select-none
				overflow-hidden
				box-border

				flex
				flex-row
				items-center

				bg-slate-950/45
				backdrop-blur-[28px]

				border
				border-white/15

				shadow-[0_24px_70px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(255,255,255,0.04)]
			'
			style={{
				width,
				height,

				minWidth: 0,

				padding: 'clamp(12px, 1.4vw, 24px)',

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

			{/* Inner glow */}
			<div
				className='
					pointer-events-none
					absolute
					inset-0
					rounded-[inherit]

					shadow-[inset_0_0_30px_rgba(255,255,255,0.03)]
				'
			/>

			{weather ?
				<>
					{/* Left Side */}
					<div
						className='
							relative
							z-10

							flex
							flex-1
							flex-col

							items-center
							justify-center
							pt-3
						'
						style={{
							minWidth: 0,
							height: '100%',
							gap: 'clamp(2px, 0.35vw, 7px)',
						}}>
						{/* Weather Icon Glass Bubble */}
						{weatherInfo?.image && (
							<div
								className='
									flex
									items-center
									justify-center

									rounded-full

									bg-white/[0.08]

									border
									border-white/15

									backdrop-blur-xl

									shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_rgba(0,0,0,0.25)]
								'
								style={{
									width: 'clamp(65px, 6vw, 110px)',
									height: 'clamp(65px, 6vw, 110px)',
								}}>
								<img
									src={weatherInfo.image}
									alt={weatherInfo.title}
									style={{
										width: '115%',
										height: '115%',
										objectFit: 'contain',
									}}
								/>
							</div>
						)}

						{/* Weather Description */}
						<p
							className='
								font-light
								text-center
								tracking-wide
								text-white/60
							'
							style={{
								color: textColor,
								fontSize: 'clamp(12px, 1.05vw, 20px)',
								lineHeight: 1.1,
								margin: 0,
								opacity: 0.65,
							}}>
							{weatherInfo.title}
						</p>

						{/* Temperature */}
						<p
							className='
								font-medium
								text-center
								tracking-[-0.03em]
								text-white/95
								pb-4
							'
							style={{
								color: textColor,
								fontSize: '1.6vw',
								lineHeight: 1,
								margin: 0,
							}}>
							{Math.round(weather.temperature_2m)}
							°C
						</p>
					</div>

					{/* Divider */}
					<div
						className='
							relative
							z-10

							w-px
							h-[65%]

							bg-gradient-to-b
							from-transparent
							via-white/20
							to-transparent

							shrink-0
						'
					/>

					{/* Right Side */}
					<div
						className='
							relative
							z-10

							flex
							flex-1
							flex-col

							justify-center
						'
						style={{
							minWidth: 0,
							height: '100%',

							gap: '0.7vw',

							paddingLeft: 'clamp(16px, 1.8vw, 30px)',

							paddingRight: 'clamp(6px, 0.6vw, 12px)',
						}}>
						{/* Feels Like */}
						<div>
							<p
								className='
									font-light
									text-white/50
								'
								style={{
									fontSize: 'clamp(10px, 0.9vw, 16px)',
									lineHeight: 1,
									margin: 0,
								}}>
								Feels like
							</p>

							<p
								className='
									font-medium
									text-white/90
								'
								style={{
									fontSize: 'clamp(14px, 1.35vw, 24px)',
									lineHeight: 1.15,
									marginTop: 'clamp(3px, 0.25vw, 6px)',
									marginBottom: 0,
								}}>
								{Math.round(weather.apparent_temperature)}
								°C
							</p>
						</div>

						{/* Wind */}
						<div>
							<p
								className='
									font-light
									text-white/50
								'
								style={{
									fontSize: 'clamp(10px, 0.9vw, 16px)',
									lineHeight: 1,
									margin: 0,
								}}>
								Wind
							</p>

							<p
								className='
									font-medium
									text-white/90
								'
								style={{
									fontSize: 'clamp(14px, 1.35vw, 24px)',
									lineHeight: 1.15,
									marginTop: 'clamp(3px, 0.25vw, 6px)',
									marginBottom: 0,
								}}>
								{Math.round(weather.wind_speed_10m)} km/h
							</p>
						</div>

						{/* Humidity */}
						<div>
							<p
								className='
									font-light
									text-white/50
								'
								style={{
									fontSize: 'clamp(10px, 0.9vw, 16px)',
									lineHeight: 1,
									margin: 0,
								}}>
								Humidity
							</p>

							<p
								className='
									font-medium
									text-white/90
								'
								style={{
									fontSize: 'clamp(14px, 1.35vw, 24px)',
									lineHeight: 1.15,
									marginTop: 'clamp(3px, 0.25vw, 6px)',
									marginBottom: 0,
								}}>
								{weather.relative_humidity_2m}%
							</p>
						</div>
					</div>
				</>
			:	<div
					className='
						relative
						z-10

						flex
						w-full
						h-full

						items-center
						justify-center
					'>
					<p
						className='
							font-medium
							text-center
							text-white/70
						'
						style={{
							color: textColor,
							fontSize: 'clamp(14px, 1.2vw, 22px)',
							lineHeight: 1.15,
							margin: 0,
						}}>
						{message}
					</p>
				</div>
			}
		</div>
	);
}
