import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import stopsText from '../AppData/stops.txt?raw';
import routesText from '../AppData/routes.txt?raw';
import { Icons } from '../AppData/Icons';

const CENTER_LAT = 53.5471;
const CENTER_LON = -113.506;
const RADIUS_MILES = 3;

function getDistanceMiles(lat1, lon1, lat2, lon2) {
	const R = 3958.8;

	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
}

function cleanText(value) {
	return String(value || '')
		.trim()
		.replace(/^"+|"+$/g, '');
}

function formatRoute(routeId) {
	const cleanedRoute = cleanText(routeId);
	if (!cleanedRoute) return 'Unknown';

	return cleanedRoute.replace(/^0+(?!$)/, '');
}

function parseRoutes(text) {
	const lines = text.trim().split('\n');
	const headers = lines[0].split(',').map(cleanText);

	const routeIdIndex = headers.indexOf('route_id');
	const shortNameIndex = headers.indexOf('route_short_name');
	const longNameIndex = headers.indexOf('route_long_name');

	const lookup = {};

	for (const line of lines.slice(1)) {
		const cols = line.split(',');

		const routeId = formatRoute(cols[routeIdIndex]);
		const shortName = formatRoute(cols[shortNameIndex]);
		const longName = cleanText(cols[longNameIndex]);

		if (!routeId) continue;

		lookup[routeId] = {
			shortName,
			longName,
		};
	}

	return lookup;
}

function parseStops(text) {
	const lines = text.trim().split('\n');
	const headers = lines[0].split(',').map(cleanText);

	const stopIdIndex = headers.indexOf('stop_id');
	const stopNameIndex = headers.indexOf('stop_name');
	const stopLatIndex = headers.indexOf('stop_lat');
	const stopLonIndex = headers.indexOf('stop_lon');

	const lookup = {};

	for (const line of lines.slice(1)) {
		const cols = line.split(',');

		const stopId = cleanText(cols[stopIdIndex]);
		const stopName = cleanText(cols[stopNameIndex]);
		const stopLat = Number(cleanText(cols[stopLatIndex]));
		const stopLon = Number(cleanText(cols[stopLonIndex]));

		if (
			!stopId ||
			!stopName ||
			Number.isNaN(stopLat) ||
			Number.isNaN(stopLon)
		) {
			continue;
		}

		const distance = getDistanceMiles(CENTER_LAT, CENTER_LON, stopLat, stopLon);

		if (distance <= RADIUS_MILES) {
			lookup[stopId] = {
				name: stopName,
				distance,
			};
		}
	}

	return lookup;
}

export default function TransitCard({
	style = {},
	width = '30vw',
	height = '30vh',
	backgroundColor = 'rgba(0,0,0,0.58)',
	borderColor = 'rgba(255,255,255,0.8)',
	textColor = '#ffffff',
	borderRadius = 40,
	borderWidth = 2,
}) {
	const [items, setItems] = useState([]);
	const [index, setIndex] = useState(0);
	const [message, setMessage] = useState('Loading transit...');

	const stopLookup = useMemo(() => parseStops(stopsText), []);
	const routeLookup = useMemo(() => parseRoutes(routesText), []);

	useEffect(() => {
		async function loadTransit() {
			try {
				const bytes = await invoke('fetch_transit_trip_updates');

				const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
					new Uint8Array(bytes),
				);

				const now = Math.floor(Date.now() / 1000);
				const arrivals = [];

				for (const entity of feed.entity) {
					const tripUpdate = entity.tripUpdate;
					if (!tripUpdate) continue;

					const routeNumber = formatRoute(tripUpdate.trip?.routeId);
					if (routeNumber === 'Unknown') continue;

					const routeInfo = routeLookup[routeNumber];
					const routeName = routeInfo?.longName || '';
					const tripId = cleanText(tripUpdate.trip?.tripId);

					for (const stopUpdate of tripUpdate.stopTimeUpdate || []) {
						const stopId = cleanText(stopUpdate.stopId);
						const stopInfo = stopLookup[stopId];

						if (!stopInfo) continue;

						const arrivalTimeRaw =
							stopUpdate.arrival?.time || stopUpdate.departure?.time;

						if (!arrivalTimeRaw) continue;

						const arrivalTime =
							typeof arrivalTimeRaw.toNumber === 'function' ?
								arrivalTimeRaw.toNumber()
							:	Number(arrivalTimeRaw);

						const rawMinutes = (arrivalTime - now) / 60;

						if (rawMinutes < 1 || rawMinutes > 60) continue;

						const minutes = Math.ceil(rawMinutes);

						arrivals.push({
							routeNumber,
							routeName,
							tripId,
							stopName: stopInfo.name,
							stopId,
							minutes,
							distance: stopInfo.distance,
						});
					}
				}

				arrivals.sort((a, b) => {
					if (a.minutes !== b.minutes) return a.minutes - b.minutes;
					return a.distance - b.distance;
				});

				setItems(arrivals.slice(0, 30));
				setIndex(0);
				setMessage(arrivals.length ? '' : 'No nearby transit found');
			} catch (error) {
				console.log('Transit error:', error);
				setMessage('Could not load transit');
			}
		}

		loadTransit();

		const interval = setInterval(loadTransit, 60 * 1000);

		return () => clearInterval(interval);
	}, [stopLookup, routeLookup]);

	useEffect(() => {
		if (items.length === 0) return;

		const interval = setInterval(() => {
			setIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
		}, 4000);

		return () => clearInterval(interval);
	}, [items]);

	const current = items[index];

	return (
		<div
			className='select-none overflow-hidden shadow-lg flex flex-col items-center justify-center p-5'
			style={{
				width,
				height,
				backgroundColor,
				borderColor,
				borderRadius,
				borderWidth,
				borderStyle: 'solid',
				...style,
			}}>
			{current ?
				<div className='flex flex-col items-center justify-center text-center transition-all duration-500 w-full pt-1.5'>
					<div className='flex flex-row items-center justify-center gap-3 w-full mb-1.5'>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								padding: '0.6vw',
								backgroundColor: 'rgba(255, 255, 255, 0.2)',
								borderRadius: '9999px',
								width: '3vw',
								height: '3vw',
								boxShadow: '0 0 10px #1a3464',
								flexShrink: 0,
							}}>
							<img
								src={Icons.Bus}
								alt='Bus'
								className='w-3vw h-3vw object-contain'
								style={styles.busIcon}
							/>
						</div>

						<p
							style={{
								textShadow: `
			-2px -2px 0 #ffffff,
			 2px -2px 0 #ffffff,
			-2px  2px 0 #ffffff,
			 2px  2px 0 #ffffff,
			 0px -2px 0 #ffffff,
			 0px  2px 0 #ffffff,
			-2px  0px 0 #ffffff,
			 2px  0px 0 #ffffff
		`,
							}}
							className='font-bold text-[#1a3464] text-[clamp(18px,2vw,36px)] leading-none '>
							{current.routeNumber}
						</p>
						{current.routeName ?
							<p
								className='font-bold text-[clamp(12px,1vw,19px)] opacity-90 truncate max-w-[90%]'
								style={{
									color: textColor,
									textShadow: `
			-2px -2px 0 #1a3464,
			 2px -2px 0 #1a3464,
			-2px  2px 0 #1a3464,
			 2px  2px 0 #1a3464,
			 0px -2px 0 #1a3464,
			 0px  2px 0 #1a3464,
			-2px  0px 0 #1a3464,
			 2px  0px 0 #1a3464,
			 0px  0px 6px rgba(0,0,0,0.75)
		`,
								}}>
								{current.routeName}
							</p>
						:	null}
					</div>
					<div className='flex flex-row items-center justify-center gap-1 w-full  p-2 rounded-lg'>
						<p
							className='font-bold text-[clamp(12px,1vw,24px)] truncate max-w-[90%] opacity-60 [text-shadow:1px_1px_2px_rgba(0,0,0,0.75)]'
							style={{ color: textColor }}>
							{current.stopName}
						</p>
						<p
							className='font-bold text-[clamp(12px,1vw,24px)] truncate max-w-[90%] opacity-60 [text-shadow:1px_1px_2px_rgba(0,0,0,0.75)]'
							style={{ color: textColor }}>
							- {current.minutes} min
						</p>
					</div>

					<p
						className='font-bold text-[clamp(10px,0.9vw,16px)] truncate max-w-[90%] opacity-60 [text-shadow:1px_1px_2px_rgba(0,0,0,0.75)]'
						style={{ color: textColor }}>
						{current.distance.toFixed(1)} mi away
					</p>
				</div>
			:	<p
					className='font-bold text-center text-[clamp(12px,1.2vw,22px)]'
					style={{ color: textColor }}>
					{message}
				</p>
			}
		</div>
	);
}

const styles = {
	busIcon: {
		filter: 'invert(100%) sepia(100%) grayscale(100%)',
	},
};
