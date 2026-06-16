import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Icons } from '../AppData/Icons';

export default function GuestWiFiCard({
	style = {},
	width = 'clamp(260px, 32vw, 450px)',
	height = 'auto',
	borderRadius = 'clamp(18px, 4vw, 60px)',
	borderWidth = 'clamp(2px, 0.4vw, 6px)',
	borderColor = '#3998bd',
	backgroundColor = 'rgba(0,0,0,0.6)',
	textColor = '#ffffff',
	accentColor = '#3998bd',
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

		if (cleaned.length === 11) {
			return `${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(
				4,
				7,
			)}-${cleaned.slice(7)}`;
		}

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
			const json = await invoke('fetch_guest_wifi_info');
			const wifiData = JSON.parse(json);

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
		const isValidToday = wifiData?.validAt === formattedToday;

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
				select-none
				relative
				shadow-lg
				overflow-hidden
				flex
				justify-center
				items-center
			'
			style={{
				width,
				height,
				minWidth: 0,
				minHeight: height === 'auto' ? 'clamp(120px, 12vw, 180px)' : undefined,
				padding: 'clamp(14px, 2vw, 28px)',
				borderRadius,
				borderWidth,
				borderColor,
				backgroundColor,
				borderStyle: 'solid',
				boxSizing: 'border-box',
				...style,
			}}>
			<img
				src={wifiSync ? Icons.CheckMark : Icons.XIcon}
				alt={wifiSync ? 'Synced' : 'Not synced'}
				className='absolute object-contain'
				style={{
					top: 'clamp(8px, 1vw, 16px)',
					right: 'clamp(8px, 1vw, 16px)',
					width: 'clamp(18px, 2.2vw, 32px)',
					height: 'clamp(18px, 2.2vw, 32px)',
				}}
			/>

			<div
				className='flex flex-col justify-center items-center w-full'
				style={{
					gap: 'clamp(2px, 0.5vw, 8px)',
					paddingLeft: 'clamp(4px, 1vw, 12px)',
					paddingRight: 'clamp(4px, 1vw, 12px)',
				}}>
				<p
					className='text-center font-bold w-full drop-shadow'
					style={{
						color: textColor,
						fontSize: 'clamp(12px, 1.8vw, 26px)',
						lineHeight: 1.1,
						margin: 0,
					}}>
					Need Guest Wi-Fi?
				</p>

				<p
					className='text-center font-bold w-full drop-shadow'
					style={{
						color: textColor,
						fontSize: 'clamp(11px, 1.55vw, 24px)',
						lineHeight: 1.15,
						margin: 0,
					}}>
					Text{' '}
					<span style={{ color: accentColor, fontWeight: 'bold' }}>
						{data?.dailyKey || '...'}
					</span>{' '}
					<span style={{ whiteSpace: 'nowrap' }}>
						to{' '}
						<span style={{ color: accentColor, fontWeight: 'bold' }}>
							{formatPhoneNumber(data?.locales?.en?.phoneNumber) || '...'}
						</span>
					</span>
				</p>

				<p
					className='text-center font-bold w-full drop-shadow'
					style={{
						color: textColor,
						fontSize: 'clamp(11px, 1.55vw, 24px)',
						lineHeight: 1.15,
						margin: 0,
					}}>
					to get access to{' '}
					<span style={{ color: accentColor, fontWeight: 'bold' }}>
						Eduroam
					</span>{' '}
					today!
				</p>
			</div>
		</div>
	);
}
