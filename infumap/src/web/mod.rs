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
use uuid::{uuid, Uuid};
use std::{time::SystemTime, os::unix::prelude::FileExt};
use totp_rs::{Algorithm, TOTP};
use clap::{App, ArgMatches, Arg};
use config::{Config, FileFormat};


#[get("/gen")]
fn gen() -> String {
  // TODO: remove. playing with OTP / base62 uuids.

  const ID: Uuid = uuid!("3d14c109-9934-4717-aef0-be64a95a8550");
  // let key_uuid = uuid::Uuid::new_v4();
  let b = ID.as_bytes().clone();
  let a = super::util::base62::encode(&b);
  println!("{}", a);

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
  RawJson("[{ \"test\": \"one\" }, { \"test\": \"two\" }]")
}


pub fn make_clap_subcommand<'a, 'b>() -> App<'a> {
  App::new("web")
    .about("The Infumap web server")
    .arg(Arg::new("settings_path")
      .short('s')
      .long("settings")
      .help(concat!("Path to a toml settings configuration file. If not specified and the required configuration values are not available ",
                    "via env vars, ~/.infumap/settings.toml will be used. If it does not exist, it will created with default values."))
      .takes_value(true)
      .multiple_values(false)
      .required(false))
}


const CONFIG_PREFIX: &'static str = "INFUMAP";

pub async fn handle_matches<'a>(sub_matches: &ArgMatches) {
  let settings_path_maybe = match sub_matches.value_of("settings_path") {

    Some(path) => {
      if !std::path::Path::new(path).exists() {
        println!("The specified settings file path '{path}' does not exist.");
        return;
      }
      Some(String::from(path))
    },

    None => {
      let config = match Config::builder()
        .add_source(config::Environment::with_prefix(CONFIG_PREFIX))
        .build() {
          Ok(c) => c,
          Err(e) => {
            println!("An error occurred building env var-only configuration: '{e}'");
            return;
          }
        };
      let env_has_all_mandatory_config = match config.get_string("data_dir") { Ok(_) => true, Err(_) => false };

      if !env_has_all_mandatory_config {
        // If mandatory config is not all available via env vars, then the settings file must be read as well.
        // And if it doesn't exist, it must be successfully created (and defaults used).

        let mut pb = match dirs::home_dir() {
          Some(dir) => dir,
          None => {
            println!("No settings path was specified, and the home dir could not be determined.");
            return;
          }
        };
        pb.push(".infumap");
        if !pb.as_path().exists() {
          match std::fs::create_dir(pb.as_path()) {
            Ok(_) => {
              println!("Settings file was not specified, creating .infumap in home directory.");
            },
            Err(e) => {
              println!("Could not create .infumap in home directory: {e}");
              return;
            }
          }
        }
        pb.push("settings.toml");
        if !pb.as_path().exists() {
          let f = match std::fs::File::create(pb.as_path()) {
            Ok(f) => f,
            Err(e) => {
              println!("Could not open default settings file for write {e}");
              return;
            }
          };
          let buf = include_bytes!("../../default_settings.toml");
          match f.write_all_at(buf, 0) {
            Ok(_) => {
              println!("Created default settings file at ~/.infumap/settings.toml");
            },
            Err(e) => {
              println!("Could not create default settings file at ~/.infumap/settings.toml: '{e}'");
              return;
            }
          };
        }

        Some(String::from(pb.as_os_str().to_str().unwrap()))

      } else {
        // If all required config is available via env vars, then also (first) read the settings from
        // the default location, but only if the file exists (don't create one with defaults).

        match dirs::home_dir() {
          Some(mut dir) => {
            dir.push(".infumap");
            dir.push("settings.toml");
            if dir.as_path().exists() { Some(String::from(dir.as_os_str().to_str().unwrap())) }
            else { None }
          },
          None => {
            None
          }
        }
      }
    }
  };

  let config_builder =
    if let Some(path) = settings_path_maybe {
      println!("Using settings from path: {path}, and overriding with env vars if set.");
      Config::builder()
        .add_source(config::File::new(&path, FileFormat::Toml))
    } else {
      println!("Not using settings file - taking all settings from env vars.");
      Config::builder()
    }
    .add_source(config::Environment::with_prefix(CONFIG_PREFIX));

  let config = match config_builder.build() {
      Ok(c) => c,
      Err(e) => {
        println!("An error occurred loading configuration: '{e}'");
        return;
      }
    };

  println!("Data directory: {}", config.get_string("data_dir").unwrap());

  _ = dist_handlers::mount(
    rocket::build()
      .mount("/", routes![json])
      .mount("/", routes![gen])).launch().await;

}
