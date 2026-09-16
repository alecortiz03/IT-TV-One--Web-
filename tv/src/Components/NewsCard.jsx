import { useEffect, useState } from 'react';
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

		// Standard YouTube URL:
		// https://www.youtube.com/watch?v=VIDEO_ID
		const watchMatch = url.match(/[?&]v=([^&]+)/);

		if (watchMatch) {
			return watchMatch[1];
		}

		// YouTube Shorts:
		// https://www.youtube.com/shorts/VIDEO_ID
		const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&/]+)/);

		if (shortsMatch) {
			return shortsMatch[1];
		}

		// Short YouTube URL:
		// https://youtu.be/VIDEO_ID
		const shortLinkMatch = url.match(/youtu\.be\/([^?&/]+)/);

		if (shortLinkMatch) {
			return shortLinkMatch[1];
		}

		// Embed URL:
		// https://www.youtube.com/embed/VIDEO_ID
		const embedMatch = url.match(/youtube\.com\/embed\/([^?&/]+)/);

		if (embedMatch) {
			return embedMatch[1];
		}

		return null;
	}

	// ---------------------------------------------------------
	// Parse YouTube RSS
	//
	// Used for:
	// - CNET
	// - Bloomberg Tech
	//
	// IMPORTANT:
	// Entries without a usable YouTube video are skipped.
	// ---------------------------------------------------------

	function parseRssFeed(xmlText, source = 'youtube') {
		const parser = new DOMParser();

		const xml = parser.parseFromString(xmlText, 'text/xml');

		const entries = Array.from(xml.querySelectorAll('entry'));

		return (
			entries
				.map((entry) => {
					const title = entry.querySelector('title')?.textContent || 'Untitled';

					// Prefer the actual YouTube page link
					const link =
						entry
							.querySelector('link[rel="alternate"]')
							?.getAttribute('href') ||
						entry.querySelector('link')?.getAttribute('href') ||
						'';

					// YouTube RSS normally gives us yt:videoId.
					// If it doesn't, try extracting it from the URL.
					const videoId =
						entry.getElementsByTagName('yt:videoId')[0]?.textContent?.trim() ||
						getYouTubeVideoId(link);

					const published =
						entry.querySelector('published')?.textContent || null;

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

				// ---------------------------------------------
				// SKIP anything without a playable video
				// ---------------------------------------------
				.filter((article) => {
					return Boolean(article.videoId);
				})
		);
	}

	// ---------------------------------------------------------
	// Shuffle Array
	//
	// Fisher-Yates shuffle.
	//
	// This mixes CNET and Bloomberg instead of always doing:
	//
	// CNET
	// Bloomberg
	// CNET
	// Bloomberg
	//
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
	//
	// Adds a camera after approximately every 3 news stories.
	// Alternates between the east and main cameras.
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

			// Add a camera after every 3 news stories
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
	// Fetch CNET + Bloomberg
	// ---------------------------------------------------------

	useEffect(() => {
		async function fetchNews() {
			try {
				// ---------------------------------------------
				// Fetch both feeds simultaneously
				// ---------------------------------------------

				const [cnetResponse, bloombergResponse] = await Promise.all([
					fetch('/api/rss'),
					fetch('/api/rss/bloomberg'),
				]);

				if (!cnetResponse.ok) {
					throw new Error(`CNET RSS request failed: ${cnetResponse.status}`);
				}

				if (!bloombergResponse.ok) {
					throw new Error(
						`Bloomberg RSS request failed: ${bloombergResponse.status}`,
					);
				}

				// ---------------------------------------------
				// Get XML
				// ---------------------------------------------

				const [cnetText, bloombergText] = await Promise.all([
					cnetResponse.text(),
					bloombergResponse.text(),
				]);

				// ---------------------------------------------
				// Parse feeds
				//
				// parseRssFeed automatically removes stories
				// that don't contain a YouTube video.
				// ---------------------------------------------

				const cnetArticles = parseRssFeed(cnetText, 'cnet');

				const bloombergArticles = parseRssFeed(bloombergText, 'bloomberg');

				console.log(`CNET videos: ${cnetArticles.length}`);

				console.log(`Bloomberg videos: ${bloombergArticles.length}`);

				// ---------------------------------------------
				// Combine feeds into ONE pool
				// ---------------------------------------------

				const combinedArticles = [...cnetArticles, ...bloombergArticles];

				// ---------------------------------------------
				// Randomly mix CNET + Bloomberg
				// ---------------------------------------------

				const shuffledArticles = shuffleArray(combinedArticles);

				// ---------------------------------------------
				// Sprinkle Building 12 cameras throughout
				// ---------------------------------------------

				const mixedArticles = sprinkleCameras(shuffledArticles);

				console.log(`Total rotation items: ${mixedArticles.length}`);

				setArticles(mixedArticles);

				setCurrentIndex(0);

				setMessage('');
			} catch (error) {
				console.log('News error:', error);

				setMessage('Could not load news');
			}
		}

		// Load immediately
		fetchNews();

		// Refresh feeds every 30 minutes
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

	// Prefer yt:videoId from the RSS feed.
	// Fall back to extracting the ID from the URL.
	const videoId = currentArticle?.videoId || getYouTubeVideoId(videoUrl);

	// ---------------------------------------------------------
	// YouTube Player
	//
	// autoplay=1  → automatically starts
	// mute=1      → always muted
	// controls=0  → hide controls
	// loop=1      → loop video
	//
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
