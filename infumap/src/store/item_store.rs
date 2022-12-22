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
use crate::util::infu::{InfuResult, InfuError};
use crate::util::uid::Uid;
use super::{kv_store::KVStore, item::Item};


/// Store for Item instances.
/// Not threadsafe.
pub struct ItemStore {
  data_dir: String,
  stores: HashMap<Uid, KVStore<Item>>,
}

impl ItemStore {
  pub fn init(data_dir: &str) -> ItemStore {
    ItemStore { data_dir: String::from(data_dir), stores: HashMap::new() }
  }

  pub fn load_user_items(&mut self, user_id: &str, creating: bool) -> InfuResult<()> {
    let log_filename = String::from("items_") + &user_id + ".json";
    if creating {
      if std::path::Path::new(&log_filename).exists() {
        return Err(InfuError::new(&format!("Items log file already exists for user '{}'.", user_id)));
      }
    } else {
      if std::path::Path::new(&log_filename).exists() {
        return Err(InfuError::new(&format!("Items log file does not exist for user '{}'.", user_id)));
      }
    }
    let store: KVStore<Item> = KVStore::init(&self.data_dir, &log_filename)?;
    self.stores.insert(String::from(user_id), store);
    Ok(())
  }

  pub fn _unload_user_items(_user_id: &str) -> InfuResult<()> {
    todo!()
  }

  pub fn add(&mut self, item: Item) -> InfuResult<()> {
    let store = self.stores.get_mut(&item.owner_id)
      .ok_or(InfuError::new(&format!("Store has not been loaded for user '{}'", item.owner_id)))?;
    store.add(item)
  }
}
