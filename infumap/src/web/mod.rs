// Copyright (C) 2022 Matt Howlett
// This file is part of Infumap.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

mod responders;
mod dist_handlers;

use rocket::response::content::RawJson;
use std::time::SystemTime;
use totp_rs::{Algorithm, TOTP};
use clap::{App, ArgMatches};


#[get("/gen")]
fn gen() -> String {
    // TODO: remove. playing with OTP / base62.

    // let key_uuid = uuid::Uuid::new_v4();
    // let a = base_62::base62::encode(key_uuid.as_bytes());
    // a

    // The secret should be randomly generated of N bits length (look it up)
    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        "hello123123123123123123123123123".as_bytes(),
        Some("infumap".to_string()),
        "math".to_string()
    ).unwrap();
    let time = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH).unwrap()
        .as_secs();
    println!("{}", totp.get_url());
    let token = totp.generate(time);
    println!("{}", token);
    "hello".to_string()
}


#[get("/test-json")]
fn json() -> RawJson<&'static str> {
    // TODO: remove. Playing with JSON.
    RawJson("{ \"hello\": \"world\" }")
}


pub fn make_clap_subcommand<'a, 'b>() -> App<'a, 'b> {
    App::new("web")
        .about("Run the Infumap web server")
}

pub async fn handle_matches<'a>(_conf: &config::Config, _sub_matches: Option<&ArgMatches<'a>>) {
    _ = dist_handlers::mount(
        rocket::build()
            .mount("/", routes![json])
            .mount("/", routes![gen])).launch().await;
}
