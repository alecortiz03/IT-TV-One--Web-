import { useEffect, useRef, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { Icons } from '../AppData/Icons';

const SPOTIFY_CONNECT_URL = 'https://spotifyserver-kzcx.onrender.com/connect';

export default function SpotifyPlayerCard({
	accessToken,
	style = {},
	width = 'clamp(180px, 12vw, 360px)',
	height = 'clamp(260px, 25vh, 520px)',
	backgroundColor = 'rgba(2, 2, 2, 0.61)',
	borderColor = '#212324bd',
	textColor = '#f8f6f6',
	subTextColor = '#cccccc',
	borderRadius = '3vw',
	borderWidth = 6,
}) {
	const [status, setStatus] = useState('Waiting for Spotify connection...');
	const [deviceId, setDeviceId] = useState(null);
	const [track, setTrack] = useState(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentPosition, setCurrentPosition] = useState(0);

	const playerRef = useRef(null);

	const progressPercent =
		track?.duration && track.duration > 0 ?
			(currentPosition / track.duration) * 100
		:	0;

	useEffect(() => {
		if (!track || !isPlaying) return;

		const interval = setInterval(() => {
			setCurrentPosition((prev) => Math.min(prev + 1000, track.duration));
		}, 1000);

		return () => clearInterval(interval);
	}, [track, isPlaying]);

	useEffect(() => {
		if (!accessToken) {
			setStatus('Waiting for Spotify login...');
			setTrack(null);
			setIsPlaying(false);
			setCurrentPosition(0);
			setDeviceId(null);
			return;
		}

		function clearPlayback() {
			setTrack(null);
			setIsPlaying(false);
			setCurrentPosition(0);
			setStatus('Spotify logged in. Waiting for player connection...');
		}

		function setupPlayer() {
			if (!window.Spotify) {
				setStatus('Spotify SDK not loaded yet...');
				return;
			}

			if (playerRef.current) {
				playerRef.current.disconnect();
				playerRef.current = null;
			}

			const player = new window.Spotify.Player({
				name: 'ITTVOne',
				getOAuthToken: (cb) => cb(accessToken),
				volume: 0.8,
			});

			playerRef.current = player;

			player.addListener('ready', async ({ device_id }) => {
				setDeviceId(device_id);
				setStatus('Device ready. Transferring playback...');

				try {
					await fetch('https://api.spotify.com/v1/me/player', {
						method: 'PUT',
						headers: {
							Authorization: `Bearer ${accessToken}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							device_ids: [device_id],
							play: true,
						}),
					});

					setStatus('Spotify connected to ITTVOne.');
				} catch (error) {
					console.error(error);
					setStatus('Device ready. Open Spotify and select ITTVOne manually.');
				}
			});

			player.addListener('not_ready', () => {
				setDeviceId(null);
				setTrack(null);
				setIsPlaying(false);
				setCurrentPosition(0);
				setStatus(
					'Spotify player disconnected. Waiting for player connection...',
				);
			});

			player.addListener('player_state_changed', (state) => {
				if (!state) {
					clearPlayback();
					return;
				}

				const currentTrack = state.track_window.current_track;

				if (!currentTrack) {
					clearPlayback();
					return;
				}

				setIsPlaying(!state.paused);
				setCurrentPosition(state.position);

				setTrack({
					title: currentTrack.name,
					artist: currentTrack.artists.map((artist) => artist.name).join(', '),
					album: currentTrack.album.name,
					image: currentTrack.album.images?.[0]?.url,
					duration: state.duration,
					position: state.position,
				});
			});

			player.addListener('initialization_error', ({ message }) => {
				setStatus(`Init error: ${message}`);
				setTrack(null);
			});

			player.addListener('authentication_error', ({ message }) => {
				setStatus(`Auth error: ${message}`);
				setTrack(null);
			});

			player.addListener('account_error', ({ message }) => {
				setStatus(`Account error: ${message}`);
				setTrack(null);
			});

			player.addListener('playback_error', ({ message }) => {
				setStatus(`Playback error: ${message}`);
				setTrack(null);
			});

			player.connect().then((success) => {
				setStatus(
					success ?
						'Spotify logged in. Waiting for player connection...'
					:	'Spotify player failed to connect.',
				);
			});
		}

		if (document.getElementById('spotify-player-script')) {
			setupPlayer();
		} else {
			const script = document.createElement('script');
			script.id = 'spotify-player-script';
			script.src = 'https://sdk.scdn.co/spotify-player.js';
			script.async = true;
			document.body.appendChild(script);

			window.onSpotifyWebPlaybackSDKReady = setupPlayer;
		}

		return () => {
			if (playerRef.current) {
				playerRef.current.disconnect();
				playerRef.current = null;
			}
		};
	}, [accessToken]);

	return (
		<div
			className='select-none flex flex-col items-center justify-center overflow-hidden shadow-lg'
			style={{
				width,
				height,
				backgroundColor,
				borderColor,
				borderRadius,
				borderWidth,
				borderStyle: 'solid',
				boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
				...style,
			}}>
			{!accessToken && (
				<>
					<div
						style={{
							backgroundColor: 'transparent',
							borderRadius: 16,
							padding: 6,
							marginBottom: 6,
						}}>
						<QRCode
							value={SPOTIFY_CONNECT_URL}
							size={100}
							bgColor='#3fca2a'
							fgColor='#000000'
							level='H'
							logoImage={Icons.Spotify}
							logoWidth={30}
							logoHeight={30}
							style={{
								width: 'clamp(80px, 8vw, 160px)',
								height: 'clamp(80px, 8vw, 160px)',
								borderRadius: 16,
							}}
						/>
					</div>

					<p
						className='font-bold text-center '
						style={styles.status(textColor)}>
						Scan to connect Spotify
					</p>
				</>
			)}

			{accessToken && !track && (
				<>
					<p
						className='font-bold text-center'
						style={styles.status(textColor)}>
						{status}
					</p>

					{deviceId && (
						<p
							className='text-center mt-2'
							style={{
								color: subTextColor,
								fontSize: 'clamp(8px, 0.7vw, 14px)',
							}}>
							Device ready
						</p>
					)}
				</>
			)}

			{accessToken && track && (
				<>
					{track.image && (
						<img
							src={track.image}
							alt={track.title}
							className='object-cover'
							style={{
								width: 'clamp(70px, 7vw, 170px)',
								height: 'clamp(70px, 7vw, 170px)',
								borderRadius: 24,
							}}
						/>
					)}

					<p
						className='font-bold text-center truncate w-[100%] '
						style={styles.title(textColor)}>
						{track.title}
					</p>

					<p
						className='text-center truncate w-[100%] '
						style={styles.sub(subTextColor)}>
						{track.artist}
					</p>

					<p
						className='text-center truncate w-[100%]'
						style={styles.album(subTextColor)}>
						{track.album}
					</p>

					<p
						className='font-bold text-center'
						style={styles.playingText(isPlaying ? '#65ac5a' : subTextColor)}>
						{isPlaying ? '▶ Playing' : '⏸ Paused'}
					</p>

					<div style={styles.progressBar}>
						<div
							style={{
								width: `${progressPercent}%`,
								height: '100%',
								backgroundColor: '#65ac5a',
								borderRadius: 999,
							}}
						/>
					</div>
				</>
			)}
		</div>
	);
}

const styles = {
	status: (color) => ({
		color,
		fontSize: 'clamp(8px, 0.3vw, 16px)',
		textShadow: '2px 2px 4px rgba(0,0,0,0.75)',
	}),

	title: (color) => ({
		color,
		fontSize: 'clamp(10px, 1vw, 24px)',
		fontWeight: '800',
		lineHeight: 1.1,
		textShadow: '2px 2px 4px rgba(0,0,0,0.75)',
		marginTop: 3,
	}),

	sub: (color) => ({
		color,
		fontSize: 'clamp(6px, 0.1vw, 18px)',
		fontWeight: '600',
		lineHeight: 1.1,
	}),

	album: (color) => ({
		color,
		fontSize: 'clamp(6px, 0.1vw, 16px)',
		fontWeight: '500',
		lineHeight: 1.1,
		marginBottom: 6,
	}),

	playingText: (color) => ({
		color,
		fontSize: 'clamp(6px, 0.1vw, 17px)',
		fontWeight: '700',
		lineHeight: 1.1,
		marginBottom: 3,
		marginTop: 3,
	}),

	progressBar: {
		width: '60%',
		height: 8,
		backgroundColor: 'rgba(255,255,255,0.15)',
		borderRadius: 999,
		overflow: 'hidden',
	},
};
