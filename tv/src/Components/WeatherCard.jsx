import { useEffect, useState } from 'react';

export default function WeatherCard({
	style = {},
	width = '350px',
	height = '120px',
	backgroundColor = '#ffffff',
	borderColor = '#000000',
	borderRadius = 10,
	borderWidth = 2,
	textColor = '#ffffff',
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
				title: 'Unknown weather',
				image: null,
			}
		);
	}

	useEffect(() => {
		const fetchWeather = async () => {
			try {
				const response = await fetch(weatherUrl);

				if (!response.ok) {
					throw new Error('Weather request failed');
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

		fetchWeather();

		const interval = setInterval(fetchWeather, 30 * 60 * 1000);

		return () => clearInterval(interval);
	}, [weatherUrl]);

	const weatherInfo = weather ? getWeatherInfo(weather.weather_code) : null;

	return (
		<div
			className='
				overflow-hidden
				flex flex-row
				shadow-lg
				select-none
			'
			style={{
				width,
				height,
				backgroundColor,
				borderColor,
				borderRadius,
				borderWidth,
				borderStyle: 'solid',
				...style,
			}}>
			{weather ?
				<>
					<div className='flex-1 flex flex-col items-center justify-center overflow-hidden mb-2'>
						{weatherInfo?.image && (
							<img
								src={weatherInfo.image}
								alt={weatherInfo.title}
								className='w-[100px] h-[100px] object-contain'
							/>
						)}

						<p
							className='font-bold text-center text-xs
							min-[550px]:text-[3px]
							min-[900px]:text-[7px]
							min-[1000px]:text-[16px]'
							style={{
								color: textColor,
								textShadow: '-1px 1px 2px rgba(0,0,0,0.75)',
							}}>
							{weatherInfo.title}
						</p>

						<p
							className='
								font-bold text-center w-full pb-3
								text-[2px]
								min-[550px]:text-[3px]
								min-[900px]:text-[7px]
								min-[1000px]:text-[16px]
							'
							style={{
								color: textColor,
								textShadow: '-1px 1px 4px rgba(0,0,0,0.75)',
							}}>
							{Math.round(weather.temperature_2m)}°C
						</p>
					</div>

					<div className='w-[0.6%] h-full flex justify-center items-center'>
						<div className='bg-white h-[60%] w-full' />
					</div>

					<div className='flex-1 flex flex-col justify-center items-center px-7 gap-3'>
						<p
							className='font-bold text-center w-full text-xs
							min-[550px]:text-[3px]
							min-[900px]:text-[7px]
							min-[1000px]:text-[20px]'
							style={{
								color: textColor,
								textShadow: '-1px 1px 4px rgba(0,0,0,0.75)',
							}}>
							Feels like {Math.round(weather.apparent_temperature)}°C
						</p>

						<p
							className='font-bold text-center w-full text-xs
							min-[550px]:text-[3px]
							min-[900px]:text-[7px]
							min-[1000px]:text-[20px]'
							style={{
								color: textColor,
								textShadow: '-1px 1px 2px rgba(0,0,0,0.75)',
							}}>
							Wind {Math.round(weather.wind_speed_10m)} km/h
						</p>

						<p
							className='font-bold text-center w-full text-xs
							min-[550px]:text-[3px]
							min-[900px]:text-[7px]
							min-[1000px]:text-[20px]'
							style={{
								color: textColor,
								textShadow: '-1px 1px 4px rgba(0,0,0,0.75)',
							}}>
							Humidity {weather.relative_humidity_2m}%
						</p>
					</div>
				</>
			:	<p className='m-auto text-white text-center font-bold text-xs'>
					{message}
				</p>
			}
		</div>
	);
}
