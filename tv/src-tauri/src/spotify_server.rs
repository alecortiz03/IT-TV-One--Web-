use axum::{
    extract::{Path, Query, State},
    response::{Html, Redirect},
    routing::get,
    Json, Router,
};

use serde::{Deserialize, Serialize};

use std::sync::{Arc, Mutex};

use tower_http::cors::{Any, CorsLayer};

// ---------------------------------------------------------
// Spotify State
// ---------------------------------------------------------

#[derive(Clone)]
struct AppState {
    access_token: Arc<Mutex<Option<String>>>,
}

// ---------------------------------------------------------
// Spotify Models
// ---------------------------------------------------------

#[derive(Deserialize)]
struct SpotifyCallback {
    code: String,
}

#[derive(Deserialize)]
struct SpotifyTokenResponse {
    access_token: String,
}

#[derive(Serialize)]
struct TokenStatus {
    access_token: Option<String>,
}

#[derive(Serialize)]
struct LoginResponse {
    valid: bool,
    connected: bool,
}

// ---------------------------------------------------------
// Spotify Router
//
// This no longer starts its own Axum server.
// Your main lib.rs will merge this router into the
// existing Rust server.
// ---------------------------------------------------------

pub fn spotify_router() -> Router {
    let state = AppState {
        access_token: Arc::new(Mutex::new(None)),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        // -------------------------------------------------
        // Simple connect URL
        // -------------------------------------------------
        //
        // Visiting:
        //
        // /connect
        //
        // starts the Spotify OAuth process.
        //
        .route("/connect", get(start_spotify_login))

        // -------------------------------------------------
        // Existing API routes
        // -------------------------------------------------

        .route(
            "/api/login/{username}/{password}",
            get(login),
        )
        .route(
            "/api/spotify/start",
            get(start_spotify_login),
        )
        .route(
            "/api/spotify/callback",
            get(spotify_callback),
        )
        .route(
            "/api/spotify/token",
            get(get_token),
        )
        .route(
            "/api/spotify/logout",
            get(logout),
        )

        .layer(cors)
        .with_state(state)
}

// ---------------------------------------------------------
// Login
// ---------------------------------------------------------

async fn login(
    Path((username, password)): Path<(String, String)>,
    State(state): State<AppState>,
) -> Json<LoginResponse> {
    let valid =
        username == get_admin_username()
            && password == get_admin_password();

    let connected =
        state.access_token.lock().unwrap().is_some();

    Json(LoginResponse {
        valid,
        connected,
    })
}

// ---------------------------------------------------------
// Start Spotify OAuth
// ---------------------------------------------------------

async fn start_spotify_login() -> Redirect {
    let redirect_uri = format!(
        "{}/api/spotify/callback",
        get_base_url()
    );

    let scopes = [
        "streaming",
        "user-read-email",
        "user-read-private",
        "user-read-playback-state",
        "user-modify-playback-state",
        "user-read-currently-playing",
    ]
    .join(" ");

    let spotify_url = format!(
        "https://accounts.spotify.com/authorize?client_id={}&response_type=code&redirect_uri={}&scope={}",
        get_client_id(),
        encode_uri_component(&redirect_uri),
        encode_uri_component(&scopes)
    );

    Redirect::to(&spotify_url)
}

// ---------------------------------------------------------
// Spotify Callback
// ---------------------------------------------------------

async fn spotify_callback(
    State(state): State<AppState>,
    Query(query): Query<SpotifyCallback>,
) -> Result<Redirect, Html<String>> {
    let redirect_uri = format!(
        "{}/api/spotify/callback",
        get_base_url()
    );

    let body = format!(
        "grant_type=authorization_code&code={}&redirect_uri={}&client_id={}&client_secret={}",
        encode_uri_component(&query.code),
        encode_uri_component(&redirect_uri),
        encode_uri_component(&get_client_id()),
        encode_uri_component(&get_client_secret())
    );

    let client = reqwest::Client::new();

    let response = client
        .post("https://accounts.spotify.com/api/token")
        .header(
            "Content-Type",
            "application/x-www-form-urlencoded",
        )
        .body(body)
        .send()
        .await;

    let Ok(response) = response else {
        return Err(Html(
            "<h1>Spotify token request failed</h1>"
                .to_string(),
        ));
    };

    if !response.status().is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| {
                "Unknown Spotify error".to_string()
            });

        return Err(Html(format!(
            "<h1>Spotify token request failed</h1><pre>{}</pre>",
            error_text
        )));
    }

    let token_result =
        response.json::<SpotifyTokenResponse>().await;

    let Ok(token) = token_result else {
        return Err(Html(
            "<h1>Could not read Spotify token</h1>"
                .to_string(),
        ));
    };

    // Save Spotify access token
    *state.access_token.lock().unwrap() =
        Some(token.access_token);

    // Return to the React dashboard
    Ok(Redirect::to(
        "/dashboard?spotify=connected",
    ))
}

// ---------------------------------------------------------
// Get Current Spotify Token
// ---------------------------------------------------------

async fn get_token(
    State(state): State<AppState>,
) -> Json<TokenStatus> {
    Json(TokenStatus {
        access_token: state
            .access_token
            .lock()
            .unwrap()
            .clone(),
    })
}

// ---------------------------------------------------------
// Logout
// ---------------------------------------------------------

async fn logout(
    State(state): State<AppState>,
) -> Html<String> {
    *state.access_token.lock().unwrap() = None;

    Html(
        r#"
        <!doctype html>
        <html>
            <head>
                <title>Spotify Logged Out</title>
            </head>

            <body>
                <h1>Spotify Logged Out</h1>
                <p>
                    You can now connect a different
                    Spotify account.
                </p>
            </body>
        </html>
        "#
        .to_string(),
    )
}

// ---------------------------------------------------------
// Configuration
// ---------------------------------------------------------

fn get_admin_username() -> String {
    "itsadmin".to_string()
}

fn get_admin_password() -> String {
    "itsadmin".to_string()
}

fn get_base_url() -> String {
    "http://10.57.45.10:8080".to_string()
}

fn get_client_id() -> String {
    "a0b6eccbad264d52829f00e37f758224".to_string()
}

fn get_client_secret() -> String {
    "53dbf64fbcfd472ab5817fc89bf21367".to_string()
}

// ---------------------------------------------------------
// URL Encoding Helper
// ---------------------------------------------------------

fn encode_uri_component(input: &str) -> String {
    input
        .replace("%", "%25")
        .replace(" ", "%20")
        .replace(":", "%3A")
        .replace("/", "%2F")
        .replace("?", "%3F")
        .replace("#", "%23")
        .replace("[", "%5B")
        .replace("]", "%5D")
        .replace("@", "%40")
        .replace("!", "%21")
        .replace("$", "%24")
        .replace("&", "%26")
        .replace("'", "%27")
        .replace("(", "%28")
        .replace(")", "%29")
        .replace("*", "%2A")
        .replace("+", "%2B")
        .replace(",", "%2C")
        .replace(";", "%3B")
        .replace("=", "%3D")
}