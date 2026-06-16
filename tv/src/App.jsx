import './App.css';
import { useEffect, useState } from 'react';

import { Images } from './AppData/Images';
import DateTimeCard from './Components/DateTimeCard';
import SpotifyPlayerCard from './Components/SpotifyPlayerCard';
import WeatherCard from './Components/WeatherCard';
import HoursCard from './Components/HoursCard';
import GuestWiFiCard from './Components/GuestWiFiCard';
import NewsCard from './Components/NewsCard';
import TransitCard from './Components/TransitCard';

const SPOTIFY_SERVER_URL = 'https://spotifyserver-kzcx.onrender.com';

function App() {
	const [accessToken, setAccessToken] = useState(null);

	useEffect(() => {
		async function getSpotifyToken() {
			try {
				const res = await fetch(`${SPOTIFY_SERVER_URL}/api/spotify/token`);
				const data = await res.json();

				setAccessToken(data.access_token);
			} catch (err) {
				console.error('Failed to fetch Spotify token:', err);
			}
		}

		getSpotifyToken();

		const interval = setInterval(getSpotifyToken, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className='relative w-screen h-screen'>
			<img
				src={Images.Background}
				alt='Background'
				className='absolute w-full h-full object-cover'
			/>

			<div className='absolute inset-0 backdrop-blur-md bg-black/30'>
				<div style={styles.header}>
					<DateTimeCard
						backgroundColor='rgba(0, 0, 0, 0.58)'
						borderColor='rgba(255, 255, 255, 0.8)'
						borderRadius={40}
						borderWidth={2}
						textColor='#ffffff'
						width='60vw'
						height='20vh'
					/>

					<WeatherCard
						backgroundColor='rgba(0, 0, 0, 0.58)'
						borderColor='rgba(255, 255, 255, 0.8)'
						borderRadius={40}
						borderWidth={2}
						textColor='#ffffff'
						height='20vh'
					/>

					<SpotifyPlayerCard
						accessToken={accessToken}
						backgroundColor='rgba(0, 0, 0, 0.58)'
						borderColor='rgba(255, 255, 255, 0.8)'
						borderRadius={40}
						borderWidth={2}
						textColor='#ffffff'
						width='10vw'
						height='20vh'
					/>
				</div>

				<div style={styles.body}>
					<div style={styles.leftSide}>
						<HoursCard
							backgroundColor='rgba(0, 0, 0, 0.58)'
							borderColor='rgba(255, 255, 255, 0.8)'
							borderRadius={40}
							borderWidth={2}
							textColor='#ffffff'
							width='33vw'
							height='20vh'
						/>

						<TransitCard
							height='17vh'
							width='33vw'
							borderColor='#1a3464'
						/>

						<GuestWiFiCard
							backgroundColor='rgba(0, 0, 0, 0.58)'
							borderColor='rgba(255, 255, 255, 0.8)'
							borderRadius={40}
							borderWidth={2}
							textColor='#ffffff'
							width='33vw'
							height='20vh'
						/>
					</div>

					<div style={styles.rightSide}>
						<NewsCard
							backgroundColor='rgba(0, 0, 0, 0.58)'
							borderColor='rgba(255, 255, 255, 0.8)'
							borderRadius={40}
							borderWidth={2}
							textColor='#ffffff'
							width='60vw'
							height='70vh'
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;

const styles = {
	header: {
		display: 'flex',
		justifyContent: 'space-evenly',
		alignItems: 'center',
		paddingTop: '5vh',
	},

	body: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-evenly',
		alignItems: 'center',
		paddingTop: '3vh',
	},

	rightSide: {},

	leftSide: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-between',
		height: '70vh',
	},
};
