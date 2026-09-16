import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { QRCode } from 'react-qrcode-logo';
import { Icons } from '../AppData/Icons';

const FALLBACK_SPOTIFY_CONNECT_URL =
	'https://spotifyserver-kzcx.onrender.com/connect';

export default function SpotifyPlayerCard({
	accessToken,
	style = {},

	// Same general sizing as WeatherCard
	width = '10vw',
	height = '11vw',

	backgroundColor = 'rgba(15, 23, 42, 0.45)',
	borderColor = 'rgba(255,255,255,0.15)',
	textColor = 'rgba(255,255,255,0.9)',
	subTextColor = 'rgba(255,255,255,0.55)',

	borderRadius = 'clamp(22px, 2.4vw, 40px)',
	borderWidth = 1,
}) {
	const [status, setStatus] = useState('Device ready to connect');
	const [deviceId, setDeviceId] = useState(null);
	const [track, setTrack] = useState(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentPosition, setCurrentPosition] = useState(0);

	const [spotifyConnectUrl, setSpotifyConnectUrl] = useState(
		FALLBACK_SPOTIFY_CONNECT_URL,
	);

	const playerRef = useRef(null);

	const progressPercent =
		track?.duration && track.duration > 0 ?
			(currentPosition / track.duration) * 100
		:	0;

	// ---------------------------------------------------------
	// Get Spotify Connect URL
	// Tauri -> invoke
	// Browser / Rust server -> /api route
	// ---------------------------------------------------------

	useEffect(() => {
		async function loadSpotifyConnectUrl() {
			try {
				let url;

				try {
					// Tauri build
					url = await invoke('get_spotify_connect_url');
				} catch {
					// Browser / Rust-served React app
					const response = await fetch('/api/spotify-connect-url');

					if (!response.ok) {
						throw new Error(`Spotify URL request failed: ${response.status}`);
					}

					url = await response.text();
				}

				if (url) {
					setSpotifyConnectUrl(url.trim());
				}
			} catch (error) {
				console.log('Could not load Spotify connect URL:', error);

				// Keep fallback URL
				setSpotifyConnectUrl(FALLBACK_SPOTIFY_CONNECT_URL);
			}
		}

		loadSpotifyConnectUrl();
	}, []);

	// ---------------------------------------------------------
	// Local playback progress
	// ---------------------------------------------------------

	useEffect(() => {
		if (!track || !isPlaying) return;

		const interval = setInterval(() => {
			setCurrentPosition((prev) => Math.min(prev + 1000, track.duration));
		}, 1000);

		return () => clearInterval(interval);
	}, [track, isPlaying]);

	// ---------------------------------------------------------
	// Spotify Web Playback SDK
	// ---------------------------------------------------------

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

				getOAuthToken: (cb) => {
					cb(accessToken);
				},

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
			className='
				relative
				select-none
				overflow-hidden
				box-border

				flex
				items-center
				justify-center

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

				padding: 'clamp(10px, 1.2vw, 20px)',

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

			{/* ------------------------------------------------ */}
			{/* QR CONNECT VIEW */}
			{/* ------------------------------------------------ */}

			{!accessToken && (
				<div
					className='
						relative
						z-10

						flex
						w-full
						h-full
						flex-col

						items-center
						justify-center

					'>
					{/* QR Glass Bubble */}
					<div
						className='
							flex
							items-center
							justify-center

							bg-white/[0.08]

							border
							border-white/15

							backdrop-blur-xl

							shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_rgba(0,0,0,0.25)]
						'
						style={{
							padding: 'clamp(5px, 0.5vw, 9px)',

							borderRadius: 'clamp(12px,1vw,20px)',

							flexShrink: 0,
						}}>
						<QRCode
							value={spotifyConnectUrl}
							size={100}
							bgColor='#1DB954'
							fgColor='#000000'
							level='H'
							logoImage={Icons.Spotify}
							logoWidth={28}
							logoHeight={28}
							style={{
								width: 'clamp(65px,6vw,100px)',

								height: 'clamp(65px,6vw,100px)',

								borderRadius: 'clamp(8px,0.8vw,14px)',
							}}
						/>
					</div>

					{/* QR Text */}
					<div
						className='
							flex
							flex-col
							justify-center
						'
						style={{
							minWidth: 0,

							gap: 'clamp(4px,0.4vw,8px)',
						}}>
						<p
							className='
								font-medium
								text-white/90
								tracking-[-0.02em]
							'
							style={{
								color: textColor,

								fontSize: '1vw',

								lineHeight: 1.1,

								margin: 0,
							}}>
							Connect Spotify
						</p>

						<p
							className='
								font-light
								text-white/55
							'
							style={{
								color: subTextColor,

								fontSize: 'clamp(9px,0.8vw,15px)',

								lineHeight: 1.25,

								margin: 0,
							}}>
							Scan to connect music to ITTVOne
						</p>
					</div>
				</div>
			)}

			{/* ------------------------------------------------ */}
			{/* CONNECTED, WAITING FOR PLAYBACK */}
			{/* ------------------------------------------------ */}

			{accessToken && !track && (
				<div
					className='
						relative
						z-10

						flex
						flex-col

						w-full
						h-full

						items-center
						justify-center

						text-center
					'
					style={{
						gap: 'clamp(6px,0.6vw,12px)',
					}}>
					{/* Spotify Glass Bubble */}
					<div
						className='
							flex
							items-center
							justify-center

							rounded-full

							bg-white/[0.08]

							border
							border-white/15

							shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_rgba(0,0,0,0.25)]
						'
						style={{
							width: 'clamp(42px,4vw,72px)',

							height: 'clamp(42px,4vw,72px)',
						}}>
						<img
							src={Icons.Spotify}
							alt='Spotify'
							className='
								w-[65%]
								h-[65%]
								object-contain
							'
						/>
					</div>

					<p
						className='
							font-medium
							text-center
							text-white/90
						'
						style={{
							color: textColor,

							fontSize: 'clamp(12px,1.1vw,20px)',

							lineHeight: 1.15,

							margin: 0,
						}}>
						{status}
					</p>

					{deviceId && (
						<p
							className='
								font-light
								text-center
								text-white/50
							'
							style={{
								color: subTextColor,

								fontSize: 'clamp(9px,0.75vw,14px)',

								lineHeight: 1.2,

								margin: 0,
							}}>
							Open Spotify and select ITTVOne
						</p>
					)}
				</div>
			)}

			{/* ------------------------------------------------ */}
			{/* NOW PLAYING */}
			{/* ------------------------------------------------ */}

			{accessToken && track && (
				<div
					className='
						relative
						z-10

						flex
						flex-row

						w-full
						h-full

						items-center
					'
					style={{
						gap: 'clamp(10px,1vw,18px)',
					}}>
					{/* Album Art */}
					{track.image && (
						<img
							src={track.image}
							alt={track.title}
							className='
								object-cover
								shrink-0

								border
								border-white/10
							'
							style={{
								width: 'clamp(72px,7vw,125px)',

								height: 'clamp(72px,7vw,125px)',

								borderRadius: 'clamp(12px,1.2vw,22px)',

								boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
							}}
						/>
					)}

					{/* Track Details */}
					<div
						className='
							flex
							flex-1
							flex-col

							justify-center

							min-w-0
						'
						style={{
							gap: 'clamp(3px,0.3vw,6px)',
						}}>
						<p
							className='
								font-medium
								truncate
								w-full

								tracking-[-0.02em]
								text-white/95
							'
							style={{
								color: textColor,

								fontSize: 'clamp(13px,1.25vw,22px)',

								lineHeight: 1.1,

								margin: 0,
							}}>
							{track.title}
						</p>

						<p
							className='
								font-light
								truncate
								w-full

								text-white/55
							'
							style={{
								color: subTextColor,

								fontSize: 'clamp(9px,0.8vw,15px)',

								lineHeight: 1.1,

								margin: 0,
							}}>
							{track.artist}
						</p>

						<p
							className='
								font-light
								truncate
								w-full

								text-white/40
							'
							style={{
								color: subTextColor,

								fontSize: 'clamp(8px,0.7vw,13px)',

								lineHeight: 1.1,

								margin: 0,

								opacity: 0.7,
							}}>
							{track.album}
						</p>

						{/* Playing Status */}
						<p
							className='
								font-medium
							'
							style={{
								color: isPlaying ? '#1DB954' : 'rgba(255,255,255,0.55)',

								fontSize: 'clamp(8px,0.7vw,13px)',

								lineHeight: 1.1,

								marginTop: 'clamp(2px,0.2vw,4px)',

								marginBottom: 0,
							}}>
							{isPlaying ? '▶ Playing' : '⏸ Paused'}
						</p>

						{/* Progress Bar */}
						<div
							className='
								w-full
								overflow-hidden
								rounded-full

								bg-white/10
							'
							style={{
								height: 'clamp(3px,0.3vw,6px)',

								marginTop: 'clamp(3px,0.3vw,6px)',
							}}>
							<div
								style={{
									width: `${progressPercent}%`,

									height: '100%',

									backgroundColor: '#1DB954',

									borderRadius: 999,

									transition: 'width 0.5s linear',
								}}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
