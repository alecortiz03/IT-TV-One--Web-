import { useEffect, useRef, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { Icons } from '../AppData/Icons';

const SPOTIFY_CONNECT_URL = 'https://spotifyserver-kzcx.onrender.com/connect';

export default function SpotifyPlayerCard({
	accessToken,
	style = {},
	width = 'clamp(180px, 12vw, 360px)',
	height = 'auto',
	backgroundColor = 'rgba(2, 2, 2, 0.61)',
	borderColor = '#212324bd',
	textColor = '#f8f6f6',
	subTextColor = '#cccccc',
	borderRadius = 'clamp(18px, 3vw, 45px)',
	borderWidth = 'clamp(2px, 0.4vw, 6px)',
}) {
	const [status, setStatus] = useState('Device ready to connect');
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
			setStatus('Device ready to connect');
			setTrack(null);
			setIsPlaying(false);
			setCurrentPosition(0);
			setDeviceId(null);

			if (playerRef.current) {
				playerRef.current.disconnect();
				playerRef.current = null;
			}

			return;
		}

		function clearPlayback() {
			setTrack(null);
			setIsPlaying(false);
			setCurrentPosition(0);
			setStatus('Device ready to connect');
		}

		function setupPlayer() {
			if (!window.Spotify) {
				setStatus('Loading Spotify player...');
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
				setStatus('Device ready to connect');

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
				} catch (error) {
					console.error(error);
					setStatus('Device ready to connect');
				}
			});

			player.addListener('not_ready', () => {
				setDeviceId(null);
				clearPlayback();
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

				setStatus('');
				setIsPlaying(!state.paused);
				setCurrentPosition(state.position);

				setTrack({
					title: currentTrack.name || 'Unknown Song',
					artist:
						currentTrack.artists?.map((artist) => artist.name).join(', ') ||
						'Unknown Artist',
					album: currentTrack.album?.name || 'Unknown Album',
					image: currentTrack.album?.images?.[0]?.url,
					duration: state.duration,
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
				if (!success) {
					setStatus('Spotify player failed to connect.');
				}
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
			className='select-none flex items-center justify-center overflow-hidden shadow-lg'
			style={{
				width,
				height,
				minWidth: 0,
				minHeight: height === 'auto' ? 'clamp(260px, 25vh, 520px)' : undefined,
				padding: 'clamp(10px, 1vw, 24px)',
				backgroundColor,
				borderColor,
				borderRadius,
				borderWidth,
				borderStyle: 'solid',
				boxSizing: 'border-box',
				boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
				...style,
			}}>
			{!accessToken && (
				<div
					className='flex items-center justify-center'
					style={styles.qrBox}>
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
							width: 100,
							height: 100,
							borderRadius: 12,
						}}
					/>
				</div>
			)}

			{accessToken && !track && (
				<div
					className='flex flex-col items-center justify-center'
					style={styles.contentBox}>
					<p
						className='font-bold text-center'
						style={styles.status(textColor)}>
						{status}
					</p>

					{deviceId && (
						<p
							className='text-center'
							style={styles.deviceReady(subTextColor)}>
							Open Spotify and select ITTVOne
						</p>
					)}
				</div>
			)}

			{accessToken && track && (
				<div
					className='flex flex-col items-center justify-center'
					style={styles.contentBox}>
					{track.image && (
						<img
							src={track.image}
							alt={track.title}
							className='object-cover'
							style={styles.albumArt}
						/>
					)}

					<div style={styles.textBox}>
						<p
							className='font-bold text-center truncate w-full'
							style={styles.title(textColor)}>
							{track.title}
						</p>

						<p
							className='text-center truncate w-full'
							style={styles.subtitle(subTextColor)}>
							{track.album}
						</p>

						<p
							className='text-center truncate w-full'
							style={styles.subtitle(subTextColor)}>
							{track.artist}
						</p>
					</div>

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
				</div>
			)}
		</div>
	);
}

const styles = {
	qrBox: {
		width: '100%',
		height: '100%',
		padding: 3,
		boxSizing: 'border-box',
		overflow: 'hidden',
	},

	contentBox: {
		width: '100%',
		height: '100%',
		padding: 'clamp(6px, 0.8vw, 16px)',
		gap: 'clamp(4px, 0.5vw, 9px)',
		boxSizing: 'border-box',
		overflow: 'hidden',
	},

	textBox: {
		width: '100%',
		display: 'flex',
		flexDirection: 'column',
		gap: 'clamp(1px, 0.2vw, 4px)',
		overflow: 'hidden',
		flexShrink: 0,
	},

	status: (color) => ({
		color,
		fontSize: 'clamp(8px, 0.7vw, 15px)',
		lineHeight: 1.2,
		margin: 0,
		maxWidth: '90%',
		textShadow: '2px 2px 4px rgba(0,0,0,0.75)',
	}),

	deviceReady: (color) => ({
		color,
		fontSize: 'clamp(7px, 0.62vw, 13px)',
		lineHeight: 1.1,
		margin: 0,
		maxWidth: '90%',
	}),

	albumArt: {
		width: 'clamp(58px, 5.8vw, 145px)',
		height: 'clamp(58px, 5.8vw, 145px)',
		borderRadius: 'clamp(10px, 1.5vw, 22px)',
		flexShrink: 1,
	},

	title: (color) => ({
		color,
		fontSize: 'clamp(8px, 0.82vw, 18px)',
		fontWeight: '900',
		lineHeight: 1.05,
		margin: 0,
		textShadow: '2px 2px 4px rgba(0,0,0,0.75)',
	}),

	subtitle: (color) => ({
		color,
		fontSize: 'clamp(6px, 0.58vw, 12px)',
		fontWeight: '600',
		lineHeight: 1.05,
		margin: 0,
	}),

	playingText: (color) => ({
		color,
		fontSize: 'clamp(7px, 0.65vw, 13px)',
		fontWeight: '700',
		lineHeight: 1.05,
		margin: 0,
		flexShrink: 0,
	}),

	progressBar: {
		width: '75%',
		height: 'clamp(4px, 0.42vw, 8px)',
		backgroundColor: 'rgba(255,255,255,0.15)',
		borderRadius: 999,
		overflow: 'hidden',
		flexShrink: 0,
	},
};
