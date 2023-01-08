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

use std::os::unix::prelude::FileExt;
use config::{Config, FileFormat};
use crate::util::infu::InfuResult;


const CONFIG_PREFIX: &'static str = "INFUMAP";

pub fn setup_config(settings_path: Option<&str>) -> InfuResult<Config> {
  let settings_path_maybe = match settings_path {

    Some(path) => {
      if !std::path::Path::new(path).exists() {
        return Err(format!("The specified settings file path '{path}' does not exist.").into());
      }
      Some(String::from(path))
    },

    None => {
      let config = match Config::builder()
        .add_source(config::Environment::with_prefix(CONFIG_PREFIX))
        .build() {
          Ok(c) => c,
          Err(e) => {
            return Err(format!("An error occurred building env var-only configuration: '{e}'").into());
          }
        };
      let env_has_all_mandatory_config =
        match config.get_string("db_dir") { Ok(_) => true, Err(_) => false } &&
        match config.get_string("files_dir") { Ok(_) => true, Err(_) => false };

      if !env_has_all_mandatory_config {
        // If mandatory config is not all available via env vars, then the settings file must be read as well.
        // And if it doesn't exist, it must be successfully created (and defaults used).

        let mut pb = match dirs::home_dir() {
          Some(dir) => dir,
          None => {
            return Err(format!("No settings path was specified, and the home dir could not be determined.").into());
          }
        };

        pb.push(".infumap");
        if !pb.as_path().exists() {
          match std::fs::create_dir(pb.as_path()) {
            Ok(_) => {
              println!("Settings file was not specified, creating .infumap in home directory.");
            },
            Err(e) => {
              return Err(format!("Could not create .infumap in home directory: {e}").into());
            }
          }
        }

        pb.push("db");
        if !pb.as_path().exists() {
          if let Err(e) = std::fs::create_dir(pb.as_path()) {
            return Err(format!("Could not create db directory: '{e}'").into());
          }
        }
        pb.pop();

        pb.push("files");
        if !pb.as_path().exists() {
          if let Err(e) = std::fs::create_dir(pb.as_path()) {
            return Err(format!("Could not create files directory: '{e}'").into());
          }
        }
        pb.pop();

        pb.push("settings.toml");
        if !pb.as_path().exists() {
          let f = match std::fs::File::create(pb.as_path()) {
            Ok(f) => f,
            Err(e) => {
              return Err(format!("Could not open default settings file for write {e}").into());
            }
          };
          let buf = include_bytes!("../default_settings.toml");
          match f.write_all_at(buf, 0) {
            Ok(_) => {
              println!("Created default settings file at ~/.infumap/settings.toml");
            },
            Err(e) => {
              return Err(format!("Could not create default settings file at ~/.infumap/settings.toml: '{e}'").into());
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
      return Err(format!("An error occurred loading configuration: '{e}'").into());
    }
  };

  println!("Using db directory: {}", config.get_string("db_dir").unwrap());
  println!("Using files directory: {}", config.get_string("files_dir").unwrap());

  Ok(config)
}