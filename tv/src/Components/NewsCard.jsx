import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Images } from '../AppData/Images';

export default function NewsCard({
	style = {},
	width = '520px',
	height = '420px',
	borderRadius = 45,
	borderWidth = 6,
	borderColor = '#1211119d',
	backgroundColor = 'rgba(0,0,0,0.5)',
	textColor = '#ffffff',
}) {
	const [articles, setArticles] = useState([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [message, setMessage] = useState('Loading...');

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
				title,
				links: [{ url: link }],
			};
		});
	}

	useEffect(() => {
		async function fetchNews() {
			try {
				const rssText = await invoke('fetch_rss_feed');
				const parsedArticles = parseRssFeed(rssText);

				setArticles(parsedArticles);
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

	const videoUrl = currentArticle?.links?.[0]?.url;
	const videoId = getYouTubeVideoId(videoUrl);

	const embedUrl =
		videoId ?
			`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&iv_load_policy=3&rel=0&fs=0&disablekb=1&cc_load_policy=1&cc_lang_pref=en`
		:	null;

	return (
		<div
			className='
				select-none
				p-5 overflow-hidden
				shadow-lg flex flex-col
				items-center justify-center
			'
			style={{
				width,
				height,
				minWidth: 250,
				minHeight: 250,
				borderRadius,
				borderWidth,
				borderColor,
				backgroundColor,
				borderStyle: 'solid',
				...style,
			}}>
			{currentArticle ?
				<>
					{embedUrl ?
						<iframe
							src={embedUrl}
							className='w-[100%] h-[90%] rounded-[30px] border-[6px] border-[#0c0b0b9a] shadow-lg'
							allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
							allowFullScreen
							title={currentArticle.title}
						/>
					:	<img
							src={Images.NoVideoFound}
							alt='No video found'
							className='w-[100%] h-[90%] rounded-[30px] border-[6px] border-[#0c0b0b9a] object-cover shadow-lg'
						/>
					}

					<div className='flex flex-1 justify-center items-center w-[80%]'>
						<p
							className='mt-3 font-bold text-center text-[12px] min-[900px]:text-[20px] min-[1000px]:text-[30px] drop-shadow-lg'
							style={{ color: textColor }}>
							{currentArticle.title}
						</p>
					</div>
				</>
			:	<p
					className='font-bold text-center text-[12px] min-[900px]:text-[20px] min-[1000px]:text-[30px] drop-shadow-lg'
					style={{ color: textColor }}>
					{message}
				</p>
			}
		</div>
	);
}
