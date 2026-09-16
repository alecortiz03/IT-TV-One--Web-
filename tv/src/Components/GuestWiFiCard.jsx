import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Icons } from '../AppData/Icons';

export default function GuestWiFiCard({
	style = {},
	width = 'clamp(300px, 33vw, 680px)',
	height = 'clamp(140px, 10vw, 300px)',
	borderRadius = 'clamp(22px, 2.4vw, 40px)',
	borderWidth = 1,
	borderColor = 'rgba(255,255,255,0.15)',
	backgroundColor = 'rgba(15, 23, 42, 0.45)',
	textColor = 'rgba(255,255,255,0.9)',
	accentColor = '#66c7f2',
}) {
	const [wifiSync, setWifiSync] = useState(false);
	const [data, setData] = useState(null);

	function getCurrentDate() {
		const today = new Date();

		return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
			2,
			'0',
		)}-${String(today.getDate()).padStart(2, '0')}`;
	}

	function formatPhoneNumber(phoneNumber) {
		if (!phoneNumber) return '';

		const cleaned = phoneNumber.replace(/\D/g, '');

		// +1 (780) 555-5555
		if (cleaned.length === 11) {
			return `+${cleaned[0]} (${cleaned.slice(
				1,
				4,
			)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
		}

		// (780) 555-5555
		if (cleaned.length === 10) {
			return `(${cleaned.slice(0, 3)}) ${cleaned.slice(
				3,
				6,
			)}-${cleaned.slice(6)}`;
		}

		return phoneNumber;
	}

	async function loadWiFiInfo() {
		try {
			let wifiData;

			try {
				// Tauri build
				const json = await invoke('fetch_guest_wifi_info');
				wifiData = JSON.parse(json);
			} catch {
				// Browser / Rust server build
				const response = await fetch('/api/guest-wifi');

				if (!response.ok) {
					throw new Error(`Wi-Fi request failed: ${response.status}`);
				}

				wifiData = await response.json();
			}

			console.log('Wi-Fi data:', wifiData);

			setData(wifiData);

			return wifiData;
		} catch (error) {
			console.log('Failed to load Wi-Fi info:', error);

			setWifiSync(false);

			return null;
		}
	}

	async function checkWiFiStatus(wifiData, retryCount = 0) {
		if (!wifiData) {
			setWifiSync(false);
			return;
		}

		const formattedToday = getCurrentDate();

		const validDate =
			wifiData?.validAt ? String(wifiData.validAt).substring(0, 10) : '';

		const isValidToday = validDate === formattedToday;

		if (!isValidToday) {
			setWifiSync(false);

			if (retryCount >= 3) return;

			const refreshedData = await loadWiFiInfo();

			await checkWiFiStatus(refreshedData, retryCount + 1);

			return;
		}

		setWifiSync(true);
	}

	useEffect(() => {
		async function initialize() {
			const wifiData = await loadWiFiInfo();

			await checkWiFiStatus(wifiData);
		}

		initialize();

		const interval = setInterval(initialize, 60 * 60 * 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div
			className='
				relative
				select-none
				overflow-hidden
				box-border

				flex
				justify-center
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

				minHeight: height === 'auto' ? 'clamp(150px, 14vw, 230px)' : undefined,

				padding: 'clamp(18px, 2vw, 32px)',

				borderRadius,
				borderWidth,
				borderColor,
				backgroundColor,

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

			{/* Subtle inner glow */}
			<div
				className='
					pointer-events-none
					absolute
					inset-0
					rounded-[inherit]
					shadow-[inset_0_0_30px_rgba(255,255,255,0.03)]
				'
			/>

			{/* Sync Status */}
			<div
				className='
					absolute
					z-20
					flex
					items-center
					justify-center
					rounded-full
					bg-white/[0.08]
					border
					border-white/15
					backdrop-blur-xl
					shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]
				'
				style={{
					top: 'clamp(10px, 1vw, 18px)',
					right: 'clamp(10px, 1vw, 18px)',

					width: 'clamp(30px, 2.6vw, 46px)',
					height: 'clamp(30px, 2.6vw, 46px)',

					padding: 'clamp(6px, 0.5vw, 9px)',
				}}>
				<img
					src={wifiSync ? Icons.CheckMark : Icons.XIcon}
					alt={wifiSync ? 'Synced' : 'Not synced'}
					className='w-full h-full object-contain'
				/>
			</div>

			{/* Main Content */}
			<div
				className='
					relative
					z-10
					flex
					flex-col
					justify-center
					items-center
					w-full
				'
				style={{
					gap: 'clamp(8px, 0.8vw, 14px)',
					paddingLeft: 'clamp(8px, 1vw, 16px)',
					paddingRight: 'clamp(8px, 1vw, 16px)',
				}}>
				{/* Title */}
				<p
					className='
						text-center
						font-medium
						w-full
						tracking-[-0.02em]
						text-white/90
					'
					style={{
						color: textColor,

						fontSize: 'clamp(18px, 1.8vw, 32px)',

						lineHeight: 1.1,

						margin: 0,
					}}>
					Need Guest Wi-Fi?
				</p>

				{/* Divider */}
				<div
					className='
						h-px
						w-[70%]
						bg-gradient-to-r
						from-transparent
						via-white/15
						to-transparent
					'
				/>

				{/* Instructions */}
				<p
					className='
						text-center
						font-light
						w-full
						text-white/70
					'
					style={{
						color: textColor,

						fontSize: 'clamp(14px, 1.35vw, 24px)',

						lineHeight: 1.25,

						margin: 0,
					}}>
					Text{' '}
					<span
						style={{
							color: accentColor,
							fontWeight: 600,
						}}>
						{data?.dailyKey || '...'}
					</span>{' '}
					<span style={{ whiteSpace: 'nowrap' }}>
						to{' '}
						<span
							style={{
								color: accentColor,
								fontWeight: 600,
							}}>
							{formatPhoneNumber(data?.locales?.en?.phoneNumber) || '...'}
						</span>
					</span>
				</p>

				<p
					className='
						text-center
						font-light
						w-full
						text-white/65
					'
					style={{
						color: textColor,

						fontSize: 'clamp(13px, 1.2vw, 22px)',

						lineHeight: 1.2,

						margin: 0,
					}}>
					to get access to{' '}
					<span
						style={{
							color: accentColor,
							fontWeight: 600,
						}}>
						eduroam
					</span>{' '}
					today!
				</p>
			</div>
		</div>
	);
}
