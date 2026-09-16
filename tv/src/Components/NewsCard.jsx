import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Images } from '../AppData/Images';

export default function NewsCard({
	style = {},
	width = 'clamp(340px, 60vw, 1200px)',

	// Fixed responsive height instead of auto
	height = '39vw',
	borderRadius = 'clamp(22px, 2.4vw, 40px)',
	borderWidth = 1,
	borderColor = 'rgba(255,255,255,0.15)',
	backgroundColor = 'rgba(15, 23, 42, 0.45)',
	textColor = 'rgba(255,255,255,0.9)',
}) {
	const [articles, setArticles] = useState([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [message, setMessage] = useState('Loading...');

	const targetDate = new Date('2027-01-07T07:00:00');
	const [timeLeft, setTimeLeft] = useState('');

	// ---------------------------------------------------------
	// Get YouTube Video ID
	// ---------------------------------------------------------

	function getYouTubeVideoId(url) {
		if (!url) return null;

		const watchMatch = url.match(/[?&]v=([^&]+)/);

		if (watchMatch) {
			return watchMatch[1];
		}

		const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&/]+)/);

		if (shortsMatch) {
			return shortsMatch[1];
		}

		const shortLinkMatch = url.match(/youtu\.be\/([^?&/]+)/);

		if (shortLinkMatch) {
			return shortLinkMatch[1];
		}

		const embedMatch = url.match(/youtube\.com\/embed\/([^?&/]+)/);

		if (embedMatch) {
			return embedMatch[1];
		}

		return null;
	}

	// ---------------------------------------------------------
	// Parse YouTube RSS
	// ---------------------------------------------------------

	function parseRssFeed(xmlText, source = 'youtube') {
		const parser = new DOMParser();

		const xml = parser.parseFromString(xmlText, 'text/xml');

		// Detect invalid XML
		const parserError = xml.querySelector('parsererror');

		if (parserError) {
			console.error(`${source} RSS XML parse error`, parserError.textContent);
			return [];
		}

		const entries = Array.from(xml.querySelectorAll('entry'));

		console.log(`${source} RSS entries found: ${entries.length}`);

		return entries
			.map((entry) => {
				const title = entry.querySelector('title')?.textContent || 'Untitled';

				const link =
					entry.querySelector('link[rel="alternate"]')?.getAttribute('href') ||
					entry.querySelector('link')?.getAttribute('href') ||
					'';

				/*
				 * getElementsByTagNameNS is more reliable with
				 * namespaced YouTube RSS elements such as yt:videoId.
				 */
				let videoId = null;

				const ytVideoId = entry.getElementsByTagNameNS(
					'http://www.youtube.com/xml/schemas/2015',
					'videoId',
				)[0]?.textContent;

				if (ytVideoId) {
					videoId = ytVideoId.trim();
				}

				// Fallback
				if (!videoId) {
					const namespacedVideoId =
						entry.getElementsByTagName('yt:videoId')[0]?.textContent;

					if (namespacedVideoId) {
						videoId = namespacedVideoId.trim();
					}
				}

				// Final fallback: extract ID from URL
				if (!videoId) {
					videoId = getYouTubeVideoId(link);
				}

				const published = entry.querySelector('published')?.textContent || null;

				return {
					type: 'youtube',
					source,
					title,
					videoId,
					published,
					links: [
						{
							url: link,
						},
					],
				};
			})
			.filter((article) => Boolean(article.videoId));
	}

	// ---------------------------------------------------------
	// Shuffle Array
	// ---------------------------------------------------------

	function shuffleArray(array) {
		const shuffled = [...array];

		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));

			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}

		return shuffled;
	}

	// ---------------------------------------------------------
	// Sprinkle Cameras Through News
	// ---------------------------------------------------------

	function sprinkleCameras(newsArticles) {
		const MacEwanEastCam = {
			type: 'mjpg',
			title: 'Grand Opening of Building 12',
			url: 'https://busconstructioncameast.macewan.ca/mjpg/video.mjpg',
		};

		const MacEwanCam = {
			type: 'mjpg',
			title: 'Grand Opening of Building 12',
			url: 'https://busconstructioncam.macewan.ca/mjpg/video.mjpg',
		};

		const cameras = [MacEwanEastCam, MacEwanCam];

		const mixedArticles = [];

		let cameraIndex = 0;

		newsArticles.forEach((article, index) => {
			mixedArticles.push(article);

			if ((index + 1) % 3 === 0 && index !== newsArticles.length - 1) {
				mixedArticles.push(cameras[cameraIndex % cameras.length]);

				cameraIndex++;
			}
		});

		return mixedArticles;
	}

	// ---------------------------------------------------------
	// Building 12 Countdown
	// ---------------------------------------------------------

	useEffect(() => {
		function updateCountdown() {
			const now = new Date();

			const difference = targetDate - now;

			if (difference <= 0) {
				setTimeLeft('0 day(s), 0 hour(s), and 0 minute(s)');

				return;
			}

			const days = Math.floor(difference / (1000 * 60 * 60 * 24));

			const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);

			const minutes = Math.floor((difference / 1000 / 60) % 60);

			setTimeLeft(`${days} day(s), ${hours} hour(s), and ${minutes} minute(s)`);
		}

		updateCountdown();

		const interval = setInterval(updateCountdown, 1000);

		return () => clearInterval(interval);
	}, []);

	// ---------------------------------------------------------
	// Fetch CNET + Bloomberg THROUGH TAURI
	// ---------------------------------------------------------

	useEffect(() => {
		async function fetchNews() {
			try {
				setMessage('Loading...');

				console.log('Loading RSS feeds through Tauri...');

				/*
				 * Call Rust directly.
				 *
				 * These correspond to:
				 *
				 * #[tauri::command]
				 * fetch_rss_feed()
				 *
				 * #[tauri::command]
				 * fetch_bloomberg_rss_feed()
				 */

				const [cnetText, bloombergText] = await Promise.all([
					invoke('fetch_rss_feed'),
					invoke('fetch_bloomberg_rss_feed'),
				]);

				console.log(`CNET RSS received: ${cnetText.length} characters`);

				console.log(
					`Bloomberg RSS received: ${bloombergText.length} characters`,
				);

				// Parse feeds
				const cnetArticles = parseRssFeed(cnetText, 'cnet');

				const bloombergArticles = parseRssFeed(bloombergText, 'bloomberg');

				console.log(`CNET videos: ${cnetArticles.length}`);

				console.log(`Bloomberg videos: ${bloombergArticles.length}`);

				// Combine feeds
				const combinedArticles = [...cnetArticles, ...bloombergArticles];

				console.log(`Combined news videos: ${combinedArticles.length}`);

				/*
				 * Don't silently show an empty card if the RSS
				 * requests succeeded but parsing found nothing.
				 */
				if (combinedArticles.length === 0) {
					throw new Error(
						'RSS feeds loaded, but no playable YouTube videos were found.',
					);
				}

				// Randomize CNET + Bloomberg
				const shuffledArticles = shuffleArray(combinedArticles);

				// Insert cameras
				const mixedArticles = sprinkleCameras(shuffledArticles);

				console.log(`Total rotation items: ${mixedArticles.length}`);

				setArticles(mixedArticles);
				setCurrentIndex(0);
				setMessage('');
			} catch (error) {
				console.error('News loading error:', error);

				const errorMessage =
					typeof error === 'string' ? error : error?.message || String(error);

				setArticles([]);

				setMessage(`Could not load news: ${errorMessage}`);
			}
		}

		// Load immediately
		fetchNews();

		// Refresh every 30 minutes
		const interval = setInterval(fetchNews, 30 * 60 * 1000);

		return () => clearInterval(interval);
	}, []);

	// ---------------------------------------------------------
	// Rotate Stories Every 20 Seconds
	// ---------------------------------------------------------

	useEffect(() => {
		if (articles.length === 0) {
			return;
		}

		const interval = setInterval(() => {
			setCurrentIndex((prevIndex) =>
				prevIndex === articles.length - 1 ? 0 : prevIndex + 1,
			);
		}, 20000);

		return () => clearInterval(interval);
	}, [articles]);

	// ---------------------------------------------------------
	// Current Story
	// ---------------------------------------------------------

	const currentArticle = articles[currentIndex];

	const videoUrl =
		currentArticle?.type === 'youtube' ? currentArticle?.links?.[0]?.url : null;

	const videoId = currentArticle?.videoId || getYouTubeVideoId(videoUrl);

	// ---------------------------------------------------------
	// YouTube Player
	// ---------------------------------------------------------

	const embedUrl =
		videoId ?
			`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&iv_load_policy=3&rel=0&fs=0&disablekb=1&cc_load_policy=1&cc_lang_pref=en`
		:	null;

	return (
		<div
			className='
				relative
				select-none
				overflow-hidden
				box-border

				flex
				flex-col
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

				padding: 'clamp(10px, 1.4vw, 20px)',

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

			{currentArticle ?
				<>
					{/* Video / Camera Area */}
					<div
						className='
							relative
							z-10
							overflow-hidden
							flex-shrink-0

							border
							border-white/10

							shadow-[0_12px_35px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]
						'
						style={{
							width: '100%',

							aspectRatio: '16 / 9',

							borderRadius: 'clamp(16px, 1.8vw, 28px)',

							boxSizing: 'border-box',
						}}>
						{currentArticle.type === 'mjpg' ?
							<img
								src={currentArticle.url}
								alt={currentArticle.title}
								style={{
									width: '100%',
									height: '100%',
									display: 'block',
									objectFit: 'cover',
									objectPosition: 'center bottom',
								}}
							/>
						: embedUrl ?
							<iframe
								src={embedUrl}
								style={{
									width: '100%',
									height: '100%',
									display: 'block',
									border: 'none',
								}}
								allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
								allowFullScreen
								title={currentArticle.title}
							/>
						:	<img
								src={Images.NoVideoFound}
								alt='No video found'
								style={{
									width: '100%',
									height: '100%',
									display: 'block',
									objectFit: 'cover',
								}}
							/>
						}

						{/* Subtle video glass edge */}
						<div
							className='
								pointer-events-none
								absolute
								inset-0
								rounded-[inherit]

								shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]
							'
						/>
					</div>

					{/* Fixed Headline Area */}
					<div
						className='
							relative
							z-10

							flex
							justify-center
							items-center

							flex-1
							overflow-hidden
						'
						style={{
							width: '92%',

							paddingTop: 'clamp(10px, 1.2vw, 20px)',

							paddingBottom: 'clamp(4px, 0.5vw, 10px)',

							minHeight: 0,
						}}>
						<p
							className='
								font-medium
								text-center
								tracking-[-0.02em]
								text-white/90

								line-clamp-3
								overflow-hidden
							'
							style={{
								color: textColor,

								fontSize: 'clamp(14px, 1.6vw, 30px)',

								lineHeight: 1.15,

								margin: 0,

								display: '-webkit-box',

								WebkitLineClamp: 3,

								WebkitBoxOrient: 'vertical',

								overflow: 'hidden',
							}}>
							{currentArticle.type === 'mjpg' ?
								`${timeLeft} left until the Grand Opening of Building 12!`
							:	currentArticle.title}
						</p>
					</div>
				</>
			:	<div
					className='
						relative
						z-10

						flex
						flex-1

						justify-center
						items-center
					'>
					<p
						className='
							font-medium
							text-center
							tracking-[-0.02em]
							text-white/70
						'
						style={{
							color: textColor,

							fontSize: 'clamp(14px, 1.6vw, 30px)',

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
