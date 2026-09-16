mod spotify_server;

use scraper::{Html, Selector};

use axum::{
    body::Body,
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing::get,
    Router,
};

use tower_http::services::{ServeDir, ServeFile};

// ---------------------------------------------------------
// Existing Tauri Commands
// ---------------------------------------------------------

// ---------------------------------------------------------
// CNET RSS Feed
// ---------------------------------------------------------

#[tauri::command]
async fn fetch_rss_feed() -> Result<String, String> {
    let url = "https://www.youtube.com/feeds/videos.xml?user=CNETTV";

    let response = reqwest::get(url)
        .await
        .map_err(|error| error.to_string())?;

    if !response.status().is_success() {
        return Err(format!(
            "CNET RSS request failed: {}",
            response.status()
        ));
    }

    let xml = response
        .text()
        .await
        .map_err(|error| error.to_string())?;

    Ok(xml)
}

// ---------------------------------------------------------
// Bloomberg Tech RSS Feed
// ---------------------------------------------------------

#[tauri::command]
async fn fetch_bloomberg_rss_feed() -> Result<String, String> {
    let url =
        "https://www.youtube.com/feeds/videos.xml?channel_id=UCrM7B7SL_g1edFOnmj-SDKg";

    let response = reqwest::get(url)
        .await
        .map_err(|error| error.to_string())?;

    if !response.status().is_success() {
        return Err(format!(
            "Bloomberg RSS request failed: {}",
            response.status()
        ));
    }

    let xml = response
        .text()
        .await
        .map_err(|error| error.to_string())?;

    Ok(xml)
}

// ---------------------------------------------------------
// Guest Wi-Fi
// ---------------------------------------------------------

#[tauri::command]
async fn fetch_guest_wifi_info() -> Result<String, String> {
    let url =
        "https://eva.eduroam.ca/sms/macewan/HCgABMkR9DGEK5ubhdayemZN.json";

    let response = reqwest::get(url)
        .await
        .map_err(|error| error.to_string())?;

    let json = response
        .text()
        .await
        .map_err(|error| error.to_string())?;

    Ok(json)
}

// ---------------------------------------------------------
// Hund Status
// ---------------------------------------------------------

#[tauri::command]
async fn fetch_hund_status() -> Result<String, String> {
    let url = "https://macewan.hund.io/";

    let response = reqwest::get(url)
        .await
        .map_err(|error| error.to_string())?;

    let html = response
        .text()
        .await
        .map_err(|error| error.to_string())?;

    let document = Html::parse_document(&html);

    let title_selector =
        Selector::parse(".issue-notice--header__title").unwrap();

    let service_selector =
        Selector::parse(".issue-notice--footer__context li a").unwrap();

    let title = document
        .select(&title_selector)
        .next()
        .map(|element| element.text().collect::<String>())
        .unwrap_or_else(|| "No Active Alerts".to_string());

    let services: Vec<String> = document
        .select(&service_selector)
        .map(|element| {
            element
                .text()
                .collect::<String>()
                .trim()
                .to_string()
        })
        .collect();

    if services.is_empty() {
        return Ok(title.trim().to_string());
    }

    Ok(format!(
        "{}\n{}",
        title.trim(),
        services.join("\n")
    ))
}

// ---------------------------------------------------------
// Spotify Connect URL
// ---------------------------------------------------------
//
// This now points to the Spotify server that is built into
// THIS Rust application.
//
// PUBLIC_BASE_URL examples:
//
// Local computer:
// http://localhost:8080
//
// LAN:
// http://192.168.1.50:8080
//
// Public:
// https://tv.example.com
//
// The returned QR URL becomes:
// PUBLIC_BASE_URL/connect
// ---------------------------------------------------------

#[tauri::command]
fn get_spotify_connect_url() -> Result<String, String> {
    let base_url =
        std::env::var("PUBLIC_BASE_URL")
            .unwrap_or_else(|_| {
                "http://localhost:8080".to_string()
            });

    Ok(format!(
        "{}/connect",
        base_url.trim_end_matches('/')
    ))
}

// ---------------------------------------------------------
// Edmonton Transit
// ---------------------------------------------------------

#[tauri::command]
async fn fetch_transit_trip_updates() -> Result<Vec<u8>, String> {
    let url =
        "http://gtfs.edmonton.ca/TMGTFSRealTimeWebService/TripUpdate/TripUpdates.pb";

    let response = reqwest::get(url)
        .await
        .map_err(|error| error.to_string())?;

    let bytes = response
        .bytes()
        .await
        .map_err(|error| error.to_string())?;

    Ok(bytes.to_vec())
}

// ---------------------------------------------------------
// HTTP API routes for browser access
// ---------------------------------------------------------

// ---------------------------------------------------------
// CNET RSS API
//
// GET /api/rss
// ---------------------------------------------------------

async fn api_rss_feed() -> Response {
    match fetch_rss_feed().await {
        Ok(xml) => (
            [(
                header::CONTENT_TYPE,
                "application/xml; charset=utf-8",
            )],
            xml,
        )
            .into_response(),

        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            error,
        )
            .into_response(),
    }
}

// ---------------------------------------------------------
// Bloomberg Tech RSS API
//
// GET /api/rss/bloomberg
// ---------------------------------------------------------

async fn api_bloomberg_rss_feed() -> Response {
    match fetch_bloomberg_rss_feed().await {
        Ok(xml) => (
            [(
                header::CONTENT_TYPE,
                "application/xml; charset=utf-8",
            )],
            xml,
        )
            .into_response(),

        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            error,
        )
            .into_response(),
    }
}

// ---------------------------------------------------------
// Guest Wi-Fi API
// ---------------------------------------------------------

async fn api_guest_wifi() -> Response {
    match fetch_guest_wifi_info().await {
        Ok(json) => (
            [(
                header::CONTENT_TYPE,
                "application/json; charset=utf-8",
            )],
            json,
        )
            .into_response(),

        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            error,
        )
            .into_response(),
    }
}

// ---------------------------------------------------------
// Hund Status API
// ---------------------------------------------------------

async fn api_hund_status() -> Response {
    match fetch_hund_status().await {
        Ok(status) => (
            [(
                header::CONTENT_TYPE,
                "text/plain; charset=utf-8",
            )],
            status,
        )
            .into_response(),

        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            error,
        )
            .into_response(),
    }
}

// ---------------------------------------------------------
// Spotify Connect URL API
// ---------------------------------------------------------

async fn api_spotify_connect_url() -> Response {
    match get_spotify_connect_url() {
        Ok(url) => (
            [(
                header::CONTENT_TYPE,
                "text/plain; charset=utf-8",
            )],
            url,
        )
            .into_response(),

        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            error,
        )
            .into_response(),
    }
}

// ---------------------------------------------------------
// Transit Trip Updates API
// ---------------------------------------------------------

async fn api_transit_trip_updates() -> Response {
    match fetch_transit_trip_updates().await {
        Ok(bytes) => Response::builder()
            .status(StatusCode::OK)
            .header(
                header::CONTENT_TYPE,
                "application/octet-stream",
            )
            .body(Body::from(bytes))
            .unwrap(),

        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            error,
        )
            .into_response(),
    }
}

// ---------------------------------------------------------
// Web Server
// ---------------------------------------------------------

async fn start_web_server() {
    // Project structure:
    //
    // tv/
    // ├── dist/
    // └── src-tauri/
    //     └── src/
    //         ├── lib.rs
    //         └── spotify_server.rs
    //
    // Since cargo is running from src-tauri,
    // the Vite build is one directory up.

    let frontend_dist = "../dist";

    let app = Router::new()

        // -------------------------------------------------
        // News RSS API routes
        // -------------------------------------------------

        // CNET
        //
        // GET /api/rss

        .route(
            "/api/rss",
            get(api_rss_feed),
        )

        // Bloomberg Tech
        //
        // GET /api/rss/bloomberg

        .route(
            "/api/rss/bloomberg",
            get(api_bloomberg_rss_feed),
        )

        // -------------------------------------------------
        // Main application API routes
        // -------------------------------------------------

        .route(
            "/api/guest-wifi",
            get(api_guest_wifi),
        )

        .route(
            "/api/hund-status",
            get(api_hund_status),
        )

        .route(
            "/api/spotify-connect-url",
            get(api_spotify_connect_url),
        )

        .route(
            "/api/transit-trip-updates",
            get(api_transit_trip_updates),
        )

        // -------------------------------------------------
        // Spotify routes
        // -------------------------------------------------
        //
        // Adds:
        //
        // /connect
        // /api/login/{username}/{password}
        // /api/spotify/start
        // /api/spotify/callback
        // /api/spotify/token
        // /api/spotify/logout
        //
        // -------------------------------------------------

        .merge(
            spotify_server::spotify_router(),
        )

        // -------------------------------------------------
        // React / Vite frontend
        // -------------------------------------------------

        .fallback_service(
            ServeDir::new(frontend_dist)
                .not_found_service(
                    ServeFile::new(
                        "../dist/index.html",
                    ),
                ),
        );

    // -----------------------------------------------------
    // Start Server
    // -----------------------------------------------------

    let listener =
        tokio::net::TcpListener::bind(
            "0.0.0.0:8080",
        )
        .await
        .expect(
            "Failed to bind server to port 8080",
        );

    println!("--------------------------------");
    println!("Rust web server running");
    println!("Local:   http://localhost:8080");
    println!("Network: http://YOUR-IP:8080");
    println!();

    println!("News:");
    println!(
        "CNET:      http://localhost:8080/api/rss"
    );
    println!(
        "Bloomberg: http://localhost:8080/api/rss/bloomberg"
    );
    println!();

    println!("Spotify:");
    println!(
        "Connect:  http://localhost:8080/connect"
    );
    println!(
        "Token:    http://localhost:8080/api/spotify/token"
    );
    println!(
        "Logout:   http://localhost:8080/api/spotify/logout"
    );

    println!("--------------------------------");

    axum::serve(
        listener,
        app,
    )
    .await
    .expect(
        "Axum server failed",
    );
}

// ---------------------------------------------------------
// Server-only entry point
// ---------------------------------------------------------

pub async fn run_server() {
    start_web_server().await;
}

// ---------------------------------------------------------
// Tauri entry point
// ---------------------------------------------------------

#[cfg_attr(
    mobile,
    tauri::mobile_entry_point
)]
pub fn run() {
    tauri::Builder::default()

        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(
                            log::LevelFilter::Info,
                        )
                        .build(),
                )?;
            }

            Ok(())
        })

        .invoke_handler(
            tauri::generate_handler![
                fetch_rss_feed,
                fetch_bloomberg_rss_feed,
                fetch_guest_wifi_info,
                fetch_hund_status,
                get_spotify_connect_url,
                fetch_transit_trip_updates
            ],
        )

        .run(
            tauri::generate_context!(),
        )

        .expect(
            "error while running tauri application",
        );
}