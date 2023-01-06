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

use std::collections::HashMap;
use std::collections::hash_map::Iter;

use crate::util::infu::InfuResult;
use super::kv_store::KVStore;
use super::user::User;


/// Db for User instances.
/// Not threadsafe.
pub struct UserDb {
  store: KVStore<User>,
  id_by_username: HashMap<String, String>
}

impl UserDb {
  pub fn init(db_dir: &str) -> InfuResult<UserDb> {
    const LOG_FILENAME: &str = "users.json";
    let store: KVStore<User> = KVStore::init(db_dir, LOG_FILENAME)?;
    let mut id_by_username = HashMap::new();
    for (id, user) in store.get_iter() {
      id_by_username.insert(user.username.clone(), id.clone());
    }
    Ok(UserDb { store, id_by_username })
  }

  pub fn _get_iter(&self) -> Iter<String, User> {
    self.store.get_iter()
  }

  pub fn _get_by_id(&self, id: &str) -> Option<&User> {
    self.store.get(id)
  }

  pub fn get_by_username(&self, username: &str) -> Option<&User> {
    match self.id_by_username.get(username) {
      None => None,
      Some(id) => self.store.get(id)
    }
  }
}
