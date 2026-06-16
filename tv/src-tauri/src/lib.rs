use scraper::{Html, Selector};

#[tauri::command]
async fn fetch_rss_feed() -> Result<String, String> {
    let url = "https://www.youtube.com/feeds/videos.xml?user=CNETTV";

    let response = reqwest::get(url).await.map_err(|error| error.to_string())?;
    let xml = response.text().await.map_err(|error| error.to_string())?;

    Ok(xml)
}

#[tauri::command]
async fn fetch_guest_wifi_info() -> Result<String, String> {
    let url = "https://eva.eduroam.ca/sms/macewan/HCgABMkR9DGEK5ubhdayemZN.json";

    let response = reqwest::get(url).await.map_err(|error| error.to_string())?;
    let json = response.text().await.map_err(|error| error.to_string())?;

    Ok(json)
}

#[tauri::command]
async fn fetch_hund_status() -> Result<String, String> {
    let url = "https://macewan.hund.io/";

    let response = reqwest::get(url).await.map_err(|error| error.to_string())?;
    let html = response.text().await.map_err(|error| error.to_string())?;

    let document = Html::parse_document(&html);

    let title_selector = Selector::parse(".issue-notice--header__title").unwrap();
    let service_selector = Selector::parse(".issue-notice--footer__context li a").unwrap();

    let title = document
        .select(&title_selector)
        .next()
        .map(|element| element.text().collect::<String>())
        .unwrap_or_else(|| "No Active Alerts".to_string());

    let services: Vec<String> = document
        .select(&service_selector)
        .map(|element| element.text().collect::<String>().trim().to_string())
        .collect();

    if services.is_empty() {
        return Ok(title.trim().to_string());
    }

    Ok(format!("{}\n{}", title.trim(), services.join("\n")))
}

#[tauri::command]
fn get_spotify_connect_url() -> Result<String, String> {
    Ok("https://spotifyserver-kzcx.onrender.com/connect".to_string())
}

#[tauri::command]
async fn fetch_transit_trip_updates() -> Result<Vec<u8>, String> {
    let url = "http://gtfs.edmonton.ca/TMGTFSRealTimeWebService/TripUpdate/TripUpdates.pb";

    let response = reqwest::get(url)
        .await
        .map_err(|error| error.to_string())?;

    let bytes = response
        .bytes()
        .await
        .map_err(|error| error.to_string())?;

    Ok(bytes.to_vec())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            fetch_rss_feed,
            fetch_guest_wifi_info,
            fetch_hund_status,
            get_spotify_connect_url,
            fetch_transit_trip_updates
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}