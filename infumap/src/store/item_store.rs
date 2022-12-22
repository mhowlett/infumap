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
use super::item::RelationshipToParent;
use super::kv_store::KVStore;
use super::item::Item;


/// Store for Item instances.
/// Not threadsafe.
pub struct ItemStore {
  data_dir: String,
  store_by_user_id: HashMap<Uid, KVStore<Item>>,
  children_of: HashMap<Uid, Vec<Uid>>,
  attachments_of: HashMap<Uid, Vec<Uid>>,
}

impl ItemStore {
  pub fn init(data_dir: &str) -> ItemStore {
    ItemStore { data_dir: String::from(data_dir), store_by_user_id: HashMap::new(), children_of: HashMap::new(), attachments_of: HashMap::new() }
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

    for (_id, item) in store.get_iter() {
      match &item.parent_id {
        Some(parent_id) => {
          match item.relationship_to_parent {
            RelationshipToParent::Child => {
              match self.children_of.get_mut(parent_id) {
                Some(children) => {
                  children.push(item.id.clone());
                },
                None => {
                  self.children_of.insert(parent_id.clone(), vec![item.id.clone()]);
                }
              }
            },
            RelationshipToParent::Attachment => {
              match self.attachments_of.get_mut(parent_id) {
                Some(attachments) => {
                  attachments.push(item.id.clone());
                },
                None => {
                  self.attachments_of.insert(parent_id.clone(), vec![item.id.clone()]);
                }
              }
            },
            RelationshipToParent::NoParent => {
              return Err(InfuError::new("NoParent relationship is invalid except for root element."));
            }
          }
        },
        None => {
          if item.relationship_to_parent != RelationshipToParent::NoParent {
            return Err(InfuError::new("Root element relationship to parent is not NoParent."));
          }
          // By convention, root level items are children of themselves.
          match self.children_of.get_mut(&item.id) {
            Some(children) => {
              children.push(item.id.clone());
            },
            None => {
              self.children_of.insert(item.id.clone(), vec![item.id.clone()]);
            }
          }
        }
      }
    }

    self.store_by_user_id.insert(String::from(user_id), store);

    Ok(())
  }

  pub fn _unload_user_items(_user_id: &str) -> InfuResult<()> {
    todo!()
  }

  pub fn add(&mut self, item: Item) -> InfuResult<()> {
    let store = self.store_by_user_id.get_mut(&item.owner_id)
      .ok_or(InfuError::new(&format!("Store has not been loaded for user '{}'", item.owner_id)))?;
    store.add(item)
  }
}
