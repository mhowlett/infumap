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
mod routes;
use std::sync::Mutex;

use rocket::{Rocket, Build};
use rocket::fairing::AdHoc;
use clap::{App, ArgMatches, Arg};
use crate::store::Store;
use crate::config::setup_config;


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

pub async fn execute<'a>(arg_matches: &ArgMatches) {
  let config = match setup_config(arg_matches.value_of("settings_path")) {
    Ok(c) => c,
    Err(e) => { println!("Could not setup configuration {e}"); return; }
  };

  let data_dir = config.get_string("data_dir").unwrap();
  let init_stores = |rocket: Rocket<Build>| async move {
    rocket.manage(Mutex::new(
      match Store::new(&data_dir) {
        Ok(store) => store,
        Err(e) => {
          println!("Failed to initialize store: {}", e);
          panic!();
        }
      }))
  };

  _ = dist_handlers::mount(
    rocket::build()
      .mount("/", routes![
        routes::account::login,
        routes::account::logout,
        routes::command::send,
      ])
      .attach(AdHoc::on_ignite("Initialize Store", init_stores))).launch().await;
}
