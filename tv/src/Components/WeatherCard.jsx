import { useEffect, useState } from 'react';

export default function WeatherCard({
	style = {},
	width = 'clamp(260px, 28vw, 350px)',
	height = 'auto',
	backgroundColor = '#ffffff',
	borderColor = '#000000',
	borderRadius = 'clamp(10px, 1.5vw, 24px)',
	borderWidth = 'clamp(1px, 0.25vw, 2px)',
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
			className='overflow-hidden flex flex-row shadow-lg select-none'
			style={{
				width,
				height,
				minWidth: 0,
				minHeight: height === 'auto' ? 'clamp(95px, 10vw, 140px)' : undefined,
				padding: 'clamp(6px, 0.8vw, 12px)',
				backgroundColor,
				borderColor,
				borderRadius,
				borderWidth,
				borderStyle: 'solid',
				boxSizing: 'border-box',
				...style,
			}}>
			{weather ?
				<>
					<div style={styles.leftBox}>
						{weatherInfo?.image && (
							<img
								src={weatherInfo.image}
								alt={weatherInfo.title}
								style={styles.weatherIcon}
							/>
						)}

						<p style={styles.weatherTitle(textColor)}>{weatherInfo.title}</p>

						<p style={styles.temperature(textColor)}>
							{Math.round(weather.temperature_2m)}°C
						</p>
					</div>

					<div style={styles.dividerWrapper}>
						<div style={styles.divider} />
					</div>

					<div style={styles.rightBox}>
						<p style={styles.detailText(textColor)}>
							Feels like {Math.round(weather.apparent_temperature)}°C
						</p>

						<p style={styles.detailText(textColor)}>
							Wind {Math.round(weather.wind_speed_10m)} km/h
						</p>

						<p style={styles.detailText(textColor)}>
							Humidity {weather.relative_humidity_2m}%
						</p>
					</div>
				</>
			:	<p style={styles.message(textColor)}>{message}</p>}
		</div>
	);
}

const styles = {
	leftBox: {
		flex: 1,
		minWidth: 0,
		height: '100%',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 'clamp(1px, 0.25vw, 4px)',
		overflow: 'hidden',
	},

	weatherIcon: {
		width: 'clamp(42px, 5.5vw, 85px)',
		height: 'clamp(42px, 5.5vw, 85px)',
		objectFit: 'contain',
		flexShrink: 1,
	},

	weatherTitle: (color) => ({
		color,
		fontSize: 'clamp(7px, 0.72vw, 14px)',
		fontWeight: '800',
		lineHeight: 1.05,
		margin: 0,
		textAlign: 'center',
		textShadow: '-1px 1px 2px rgba(0,0,0,0.75)',
	}),

	temperature: (color) => ({
		color,
		fontSize: 'clamp(8px, 0.85vw, 16px)',
		fontWeight: '900',
		lineHeight: 1,
		margin: 0,
		textAlign: 'center',
		textShadow: '-1px 1px 4px rgba(0,0,0,0.75)',
	}),

	dividerWrapper: {
		width: 'clamp(2px, 0.3vw, 5px)',
		height: '100%',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
	},

	divider: {
		backgroundColor: '#ffffff',
		height: '65%',
		width: '100%',
		borderRadius: 999,
	},

	rightBox: {
		flex: 1,
		minWidth: 0,
		height: '100%',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 'clamp(4px, 0.6vw, 10px)',
		paddingLeft: 'clamp(8px, 1vw, 18px)',
		paddingRight: 'clamp(4px, 0.6vw, 10px)',
		boxSizing: 'border-box',
		overflow: 'hidden',
	},

	detailText: (color) => ({
		color,
		fontSize: 'clamp(7px, 0.85vw, 17px)',
		fontWeight: '800',
		lineHeight: 1.1,
		margin: 0,
		textAlign: 'center',
		whiteSpace: 'nowrap',
		textShadow: '-1px 1px 4px rgba(0,0,0,0.75)',
	}),

	message: (color) => ({
		color,
		fontSize: 'clamp(9px, 0.9vw, 16px)',
		fontWeight: '800',
		lineHeight: 1.1,
		margin: 'auto',
		textAlign: 'center',
		textShadow: '-1px 1px 4px rgba(0,0,0,0.75)',
	}),
};
