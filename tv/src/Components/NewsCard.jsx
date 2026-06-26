import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Images } from '../AppData/Images';

export default function NewsCard({
	style = {},
	width = 'clamp(280px, 36vw, 520px)',
	height = 'auto',
	borderRadius = 'clamp(18px, 3vw, 45px)',
	borderWidth = 'clamp(2px, 0.4vw, 6px)',
	borderColor = '#1211119d',
	backgroundColor = 'rgba(0,0,0,0.5)',
	textColor = '#ffffff',
}) {
	const [articles, setArticles] = useState([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [message, setMessage] = useState('Loading...');
	const targetDate = new Date('2027-01-01T07:00:00');
	const [timeLeft, setTimeLeft] = useState('');
	function getYouTubeVideoId(url) {
		if (!url) return null;

		const match = url.match(/[?&]v=([^&]+)/);
		return match ? match[1] : null;
	}

	function parseRssFeed(xmlText) {
		const parser = new DOMParser();
		const xml = parser.parseFromString(xmlText, 'text/xml');
		const entries = Array.from(xml.querySelectorAll('entry'));

		return entries.map((entry) => {
			const title = entry.querySelector('title')?.textContent || 'Untitled';
			const link = entry.querySelector('link')?.getAttribute('href') || '';

			return {
				type: 'youtube',
				title,
				links: [{ url: link }],
			};
		});
	}
	useEffect(() => {
		function updateCountdown() {
			const now = new Date();
			const difference = targetDate - now;

			// calculate days, hours, minutes, seconds...
			const days = Math.floor(difference / (1000 * 60 * 60 * 24));
			const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
			const minutes = Math.floor((difference / 1000 / 60) % 60);
			const seconds = Math.floor((difference / 1000) % 60);

			// setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
			setTimeLeft(`${days} day(s), ${hours} hour(s), and ${minutes} minute(s)`);
		}

		updateCountdown(); // update immediately

		const interval = setInterval(updateCountdown, 1000);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		async function fetchNews() {
			try {
				const rssText = await invoke('fetch_rss_feed');
				const parsedArticles = parseRssFeed(rssText);

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

				const mixedArticles = [
					...parsedArticles.slice(0, 2),
					MacEwanEastCam,

					...parsedArticles.slice(2, 5),
					MacEwanCam,

					...parsedArticles.slice(5, 8),
					MacEwanEastCam,

					...parsedArticles.slice(8, 11),
					MacEwanCam,

					...parsedArticles.slice(11, 14),
					MacEwanEastCam,

					...parsedArticles.slice(14),
				];

				setArticles(mixedArticles);
				setCurrentIndex(0);
				setMessage('');
			} catch (error) {
				console.log('News error:', error);
				setMessage('Could not load news');
			}
		}

		fetchNews();

		const interval = setInterval(fetchNews, 30 * 60 * 1000);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (articles.length === 0) return;

		const interval = setInterval(() => {
			setCurrentIndex((prevIndex) =>
				prevIndex === articles.length - 1 ? 0 : prevIndex + 1,
			);
		}, 20000);

		return () => clearInterval(interval);
	}, [articles]);

	const currentArticle = articles[currentIndex];

	const videoUrl =
		currentArticle?.type === 'youtube' ? currentArticle?.links?.[0]?.url : null;

	const videoId = getYouTubeVideoId(videoUrl);

	const embedUrl =
		videoId ?
			`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&iv_load_policy=3&rel=0&fs=0&disablekb=1&cc_load_policy=1&cc_lang_pref=en`
		:	null;

	return (
		<div
			className='
				select-none
				overflow-hidden
				shadow-lg
				flex flex-col
				items-center justify-center
			'
			style={{
				width,
				height,
				minWidth: 0,
				minHeight: height === 'auto' ? 'clamp(260px, 30vw, 420px)' : undefined,
				padding: 'clamp(10px, 1.4vw, 20px)',
				borderRadius,
				borderWidth,
				borderColor,
				backgroundColor,
				borderStyle: 'solid',
				boxSizing: 'border-box',
				...style,
			}}>
			{currentArticle ?
				<>
					<div
						style={{
							width: '100%',
							aspectRatio: '16 / 9',
							borderRadius: 'clamp(14px, 2vw, 30px)',
							border: 'clamp(2px, 0.4vw, 6px) solid #0c0b0b9a',
							overflow: 'hidden',
							boxSizing: 'border-box',
							boxShadow: '0 10px 15px rgba(0,0,0,0.25)',
							flexShrink: 0,
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
					</div>

					<div
						className='flex flex-1 justify-center items-center'
						style={{
							width: '90%',
							minHeight: 0,
							paddingTop: 'clamp(8px, 1vw, 16px)',
						}}>
						<p
							className='font-bold text-center drop-shadow-lg'
							style={{
								color: textColor,
								fontSize: 'clamp(11px, 1.8vw, 30px)',
								lineHeight: 1.1,
								margin: 0,
							}}>
							{currentArticle.type === 'mjpg' ?
								`${timeLeft} left until the Grand Opening of Building 12!`
							:	currentArticle.title}
						</p>
					</div>
				</>
			:	<p
					className='font-bold text-center drop-shadow-lg'
					style={{
						color: textColor,
						fontSize: 'clamp(12px, 1.8vw, 30px)',
						lineHeight: 1.1,
						margin: 0,
					}}>
					{message}
				</p>
			}
		</div>
	);
}
