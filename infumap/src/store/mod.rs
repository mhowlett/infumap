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

use self::item::Item;
use self::kv_store::KVStore;
use self::session::Session;
use self::user_store::UserStore;

pub mod user;
pub mod user_store;
pub mod session;
pub mod item;
pub mod kv_store;

pub struct Store {
  pub user_store: UserStore,
  pub item_store: KVStore<Item>,
  pub session_store: KVStore<Session>
}

impl Store {
  pub fn new(data_dir: &str) -> Store {
    let user_store: UserStore = match UserStore::init(data_dir, "users.json") {
      Ok(store) => store,
      Err(e) => {
        println!("Could not read user store log: {e}");
        panic!();
      }
    };

    // Assume for the moment there is just one user...
    let (_id, user) = user_store.get_iter().next().unwrap();

    let path = String::from("items_") + &user.username + &String::from(".json");
    let item_store: KVStore<Item> = match KVStore::init(data_dir, &path) {
      Ok(store) => store,
      Err(e) => {
        println!("Could not read item store log: {e}");
        panic!();
      }
    };

    let session_store: KVStore<Session> = match KVStore::init(data_dir, "sessions.json") {
      Ok(store) => store,
      Err(e) => {
        println!("Could not read session store log: {e}");
        panic!();
      }
    };

    Store { user_store, item_store, session_store }
  }
}
