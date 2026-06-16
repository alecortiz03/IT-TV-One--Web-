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
	width = 'clamp(260px, 30vw, 520px)',
	height = 'auto',
	backgroundColor = 'rgba(0,0,0,0.58)',
	borderColor = 'rgba(255,255,255,0.8)',
	textColor = '#ffffff',
	borderRadius = 'clamp(18px, 3vw, 40px)',
	borderWidth = 'clamp(1px, 0.25vw, 2px)',
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
			className='select-none overflow-hidden shadow-lg flex flex-col items-center justify-center'
			style={{
				width,
				height,
				minWidth: 0,
				minHeight: height === 'auto' ? 'clamp(160px, 18vh, 320px)' : undefined,
				padding: 'clamp(10px, 1.4vw, 24px)',
				backgroundColor,
				borderColor,
				borderRadius,
				borderWidth,
				borderStyle: 'solid',
				boxSizing: 'border-box',
				...style,
			}}>
			{current ?
				<div
					className='flex flex-col items-center justify-center text-center transition-all duration-500'
					style={styles.contentBox}>
					<div style={styles.routeRow}>
						<div style={styles.iconCircle}>
							<img
								src={Icons.Bus}
								alt='Bus'
								style={styles.busIcon}
							/>
						</div>

						<p style={styles.routeNumber}>{current.routeNumber}</p>

						{current.routeName ?
							<p
								className='truncate'
								style={styles.routeName(textColor)}>
								{current.routeName}
							</p>
						:	null}
					</div>

					<div style={styles.stopRow}>
						<p
							className='truncate'
							style={styles.stopText(textColor)}>
							{current.stopName}
						</p>

						<p style={styles.minutesText(textColor)}>- {current.minutes} min</p>
					</div>

					<p
						className='truncate'
						style={styles.distanceText(textColor)}>
						{current.distance.toFixed(1)} mi away
					</p>
				</div>
			:	<p
					className='font-bold text-center'
					style={styles.message(textColor)}>
					{message}
				</p>
			}
		</div>
	);
}

const styles = {
	contentBox: {
		width: '100%',
		height: '100%',
		gap: 'clamp(8px, 1vw, 18px)',
		boxSizing: 'border-box',
		overflow: 'hidden',
	},

	routeRow: {
		width: '100%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 'clamp(6px, 0.9vw, 14px)',
		overflow: 'hidden',
	},

	iconCircle: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 'clamp(5px, 0.6vw, 10px)',
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		borderRadius: '9999px',
		width: 'clamp(30px, 3vw, 58px)',
		height: 'clamp(30px, 3vw, 58px)',
		boxShadow: '0 0 10px #1a3464',
		boxSizing: 'border-box',
		flexShrink: 0,
	},

	busIcon: {
		width: '100%',
		height: '100%',
		objectFit: 'contain',
		filter: 'invert(100%) sepia(100%) grayscale(100%)',
	},

	routeNumber: {
		color: '#1a3464',
		fontSize: 'clamp(18px, 2vw, 36px)',
		fontWeight: '900',
		lineHeight: 1,
		margin: 0,
		flexShrink: 0,
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
	},

	routeName: (color) => ({
		color,
		fontSize: 'clamp(9px, 0.85vw, 17px)',
		fontWeight: '800',
		lineHeight: 1.1,
		margin: 0,
		maxWidth: '65%',
		opacity: 0.95,
		textShadow: `
			-1px -1px 0 #1a3464,
			 1px -1px 0 #1a3464,
			-1px  1px 0 #1a3464,
			 1px  1px 0 #1a3464,
			 0px  0px 5px rgba(0,0,0,0.75)
		`,
	}),

	stopRow: {
		width: '100%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 'clamp(4px, 0.5vw, 8px)',
		padding: 'clamp(2px, 0.4vw, 8px)',
		boxSizing: 'border-box',
		overflow: 'hidden',
	},

	stopText: (color) => ({
		color,
		fontSize: 'clamp(10px, 1vw, 20px)',
		fontWeight: '800',
		lineHeight: 1.1,
		margin: 0,
		maxWidth: '70%',
		opacity: 0.7,
		textShadow: '1px 1px 2px rgba(0,0,0,0.75)',
	}),

	minutesText: (color) => ({
		color,
		fontSize: 'clamp(10px, 1vw, 20px)',
		fontWeight: '800',
		lineHeight: 1.1,
		margin: 0,
		flexShrink: 0,
		opacity: 0.7,
		textShadow: '1px 1px 2px rgba(0,0,0,0.75)',
	}),

	distanceText: (color) => ({
		color,
		fontSize: 'clamp(8px, 0.8vw, 15px)',
		fontWeight: '800',
		lineHeight: 1.1,
		margin: 0,
		maxWidth: '90%',
		opacity: 0.65,
		textShadow: '1px 1px 2px rgba(0,0,0,0.75)',
	}),

	message: (color) => ({
		color,
		fontSize: 'clamp(11px, 1vw, 20px)',
		fontWeight: '800',
		lineHeight: 1.15,
		margin: 0,
		textShadow: '1px 1px 2px rgba(0,0,0,0.75)',
	}),
};
