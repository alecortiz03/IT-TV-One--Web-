import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Icons } from '../AppData/Icons';

export default function GuestWiFiCard({
	style = {},
	width = '450px',
	height = '180px',
	borderRadius = 60,
	borderWidth = 6,
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
				p-5 overflow-hidden
				shadow-lg flex justify-center
				relative
			'
			style={{
				width,
				height,
				minWidth: 250,
				minHeight: 180,
				borderRadius,
				borderWidth,
				borderColor,
				backgroundColor,
				borderStyle: 'solid',
				...style,
			}}>
			<img
				src={wifiSync ? Icons.CheckMark : Icons.XIcon}
				alt={wifiSync ? 'Synced' : 'Not synced'}
				className='absolute top-4 right-4 w-8 h-8 object-contain'
			/>

			<div className='flex flex-col justify-center items-center w-full px-3'>
				<p
					className='text-center font-bold w-full mb-1 text-[12px] min-[900px]:text-[20px] min-[1000px]:text-[26px] drop-shadow'
					style={{ color: textColor }}>
					Need Guest Wi-Fi?
				</p>

				<p
					className='text-center font-bold w-full mb-1 text-[12px] min-[900px]:text-[20px] min-[1000px]:text-[24px] drop-shadow'
					style={{ color: textColor }}>
					Text{' '}
					<span style={{ color: accentColor, fontWeight: 'bold' }}>
						{data?.dailyKey || '...'}
					</span>{' '}
					to{' '}
					<span style={{ color: accentColor, fontWeight: 'bold' }}>
						{formatPhoneNumber(data?.locales?.en?.phoneNumber) || '...'}
					</span>
				</p>

				<p
					className='text-center font-bold w-full text-[12px] min-[900px]:text-[20px] min-[1000px]:text-[24px] drop-shadow'
					style={{ color: textColor }}>
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
