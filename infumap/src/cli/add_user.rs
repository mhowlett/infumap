// Copyright (C) 2022-2023 Matt Howlett
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
use std::time::SystemTime;
use clap::{ArgMatches, App, Arg};
use crate::config::setup_config;
use crate::storage::db::item::{Item, RelationshipToParent};
use crate::storage::db::item_db::ItemDb;
use crate::storage::db::kv_store::KVStore;
use crate::storage::db::user::User;
use crate::util::geometry::{Vector, GRID_SIZE};
use crate::util::uid::{new_uid, Uid};


pub fn make_clap_subcommand<'a, 'b>() -> App<'a> {
  App::new("add-user")
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

pub fn execute<'a>(sub_matches: &ArgMatches) {
  let config = match setup_config(sub_matches.value_of("settings_path")) {
    Ok(c) => c,
    Err(e) => {
      println!("Could not setup configuration {e}");
      return;
    }
  };

  let db_dir = &config.get_string("db_dir").unwrap();

  let mut user_store: KVStore<User> = match KVStore::init(db_dir, "users.json") {
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

  let user = User {
    id: user_id.clone(),
    username: username.clone(),
    password_hash: User::compute_password_hash(&password_salt, &password),
    password_salt: password_salt,
    root_page_id: root_page_id.clone()
  };

  match user_store.add(user.clone()) {
    Ok(_) => {},
    Err(e) => {
      println!("Failed to add new user to store: {e}");
      return;
    }
  }

  let mut item_store = ItemDb::init(db_dir);
  match item_store.load_user_items(&user.id, true) {
    Ok(_) => {},
    Err(e) => {
      println!("Failed to create item store for user: {e}");
      return;
    }
  }

  match item_store.add(default_page(user_id.as_str(), &username, root_page_id)) {
    Ok(_) => {},
    Err(e) => {
      println!("Failed to add top level page for user '{username}': {e}.");
      return;
    }
  }

}

fn default_page(owner_id: &str, username: &str, root_page_id: Uid) -> Item {
  Item {
    item_type: String::from("page"),
    owner_id: String::from(owner_id),
    id: root_page_id,
    parent_id: None,
    relationship_to_parent: RelationshipToParent::NoParent,
    creation_date: SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() as i64,
    last_modified_date: SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() as i64,
    ordering: vec![128],
    spatial_position_gr: Vector { x: 0, y: 0 },
    spatial_width_gr: Some(60 * GRID_SIZE),
    spatial_height_gr: None,
    title: Some(username.to_string()),
    original_creation_date: None,
    mime_type: None,
    file_size_bytes: None,
    inner_spatial_width_gr: Some(60 * GRID_SIZE),
    natural_aspect: Some(2.0),
    background_color_index: Some(0),
    popup_position_gr: Some(Vector { x: 30 * GRID_SIZE, y: 15 * GRID_SIZE }),
    popup_alignment_point: Some(crate::storage::db::item::AlignmentPoint::Center),
    popup_width_gr: Some(10 * GRID_SIZE),
    url: None,
    image_size_px: None,
    thumbnail: None,
    rating: None,
  }
}
