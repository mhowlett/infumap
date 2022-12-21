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

use std::io::{BufRead, Write};
use clap::{ArgMatches, App, Arg};
use crate::config::setup_config;
use crate::store::item::{Item, RelationshipToParent};
use crate::store::{KVStore, user::User};
use crate::util::geometry::Vector;
use crate::util::uid::{new_uid, Uid};
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

  let data_dir = &config.get_string("data_dir").unwrap();

  let mut user_store: KVStore<User> = match KVStore::init(data_dir, "users.json") {
    Ok(store) => store,
    Err(e) => {
      println!("Could not open user store log: {e}");
      return;
    }
  };

  let stdin = std::io::stdin();
  let stdout = std::io::stdout();

  let user_id = new_uid();
  let root_page_id = new_uid(); // TODO (HIGH): actually make the page item...
  let password_salt = new_uid();

  print!("Username: ");
  stdout.lock().flush().unwrap();
  let username = stdin.lock().lines().next().unwrap().unwrap();

  print!("Password: ");
  stdout.lock().flush().unwrap();
  let password = stdin.lock().lines().next().unwrap().unwrap();

  let mut hasher = Sha256::new();
  hasher.update(format!("{}-{}", password, password_salt));
  let password_hash = format!("{:x}", hasher.finalize());

  match user_store.add(User {
    id: user_id,
    username: username.clone(),
    password_hash: password_hash,
    password_salt: password_salt,
    root_page_id: root_page_id.clone()
  }) {
    Ok(_) => {},
    Err(e) => {
      println!("Failed to add new user to store: {e}");
      return;
    }
  }

  let path = String::from("items_") + &username + &String::from(".json");
  let mut item_store: KVStore<Item> = match KVStore::init(data_dir, &path) {
    Ok(store) => store,
    Err(e) => {
      println!("Could not open item store log for user '{username}': {e}.");
      return;
    }
  };

  match item_store.add(default_page(&username, root_page_id)) {
    Ok(_) => {},
    Err(e) => {
      println!("Failed to add top level page for user '{username}': {e}.");
      return;
    }
  }

}

fn default_page(username: &str, root_page_id: Uid) -> Item {
  Item {
    item_type: String::from("page"),
    id: root_page_id,
    parent_id: None,
    relationship_to_parent: RelationshipToParent::NoParent,
    creation_date: std::time::SystemTime::now().elapsed().unwrap().as_secs() as i64,
    last_modified_date: std::time::SystemTime::now().elapsed().unwrap().as_secs() as i64,
    ordering: vec![128],
    title: username.to_string(),
    spatial_position_bl: Vector { x: 0.0, y: 0.0 },
    spatial_width_bl: Some(60.0),
    inner_spatial_width_bl: Some(60.0),
    natural_aspect: Some(2.0),
    bg_color_idx: Some(0),
    url: None,
    original_creation_date: None,
  }
}