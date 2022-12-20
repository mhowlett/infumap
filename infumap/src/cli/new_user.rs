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

use std::io::BufRead;
use clap::{ArgMatches, App, Arg};
use crate::config::setup_config;
use crate::store::{KVStore, user::User};
use crate::util::uid::new_uid;
use sha2::{Sha256, Digest};


pub fn make_clap_subcommand<'a, 'b>() -> App<'a> {
  App::new("new-user")
    .about("Create a new user")
    .arg(Arg::new("settings_path")
      .short('s')
      .long("settings")
      .help(concat!("Path to a toml settings configuration file. If not specified and the required configuration values are not available ",
                    "via env vars, ~/.infumap/settings.toml will be used. If it does not exist, it will created with default values."))
      .takes_value(true)
      .multiple_values(false)
      .required(false))
}

pub fn handle_command_arg_matches<'a>(sub_matches: &ArgMatches) {
  let config = match setup_config(sub_matches.value_of("settings_path")) {
    Ok(c) => c,
    Err(e) => {
      println!("Could not setup configuration {e}");
      return;
    }
  };

  let mut user_store: KVStore<User> = match KVStore::init(&config.get_string("data_dir").unwrap(), "users.json") {
    Ok(store) => store,
    Err(e) => {
      println!("Could not read user store log: {e}");
      return;
    }
  };

  let stdin = std::io::stdin();

  let user_id = new_uid();
  let root_page_id = new_uid(); // TODO (HIGH): actually make the page item...
  let password_salt = new_uid();

  print!("Username: ");
  let username = stdin.lock().lines().next().unwrap().unwrap();

  print!("Password: ");
  let password = stdin.lock().lines().next().unwrap().unwrap();

  let mut hasher = Sha256::new();
  hasher.update(format!("{}-{}", password, password_salt));
  let password_hash = format!("{:x}", hasher.finalize());

  match user_store.add(User {
    id: user_id,
    username: username,
    password_hash: password_hash,
    password_salt: password_salt,
    root_page_id: root_page_id
  }) {
    Ok(_) => {},
    Err(e) => {
      println!("Failed to add new user to store: {e}");
    }
  }

}
