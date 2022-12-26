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

use crate::util::infu::InfuResult;
use crate::util::uid::Uid;
use super::item::RelationshipToParent;
use super::kv_store::{KVStore, JsonLogSerializable};
use super::item::Item;


/// Store for Item instances.
/// Not threadsafe.
pub struct ItemStore {
  data_dir: String,
  store_by_user_id: HashMap<Uid, KVStore<Item>>,

  // indexes
  owner_id_by_item_id: HashMap<Uid, Uid>,
  children_of: HashMap<Uid, Vec<Uid>>,
  attachments_of: HashMap<Uid, Vec<Uid>>,
}

impl ItemStore {
  pub fn init(data_dir: &str) -> ItemStore {
    ItemStore {
      data_dir: String::from(data_dir),
      store_by_user_id: HashMap::new(),
      owner_id_by_item_id: HashMap::new(),
      children_of: HashMap::new(),
      attachments_of: HashMap::new()
    }
  }

  pub fn user_items_loaded(&self, user_id: &Uid) -> bool {
    self.store_by_user_id.contains_key(user_id)
  }

  pub fn load_user_items(&mut self, user_id: &str, creating: bool) -> InfuResult<()> {
    info!("Loading items for user {}{}.", user_id, if creating { " (creating)" } else { "" });

    let log_filename = String::from("items_") + &user_id + ".json";

    if creating {
      if std::path::Path::new(&log_filename).exists() {
        return Err(format!("Items log file already exists for user '{}'.", user_id).into());
      }
    } else {
      if std::path::Path::new(&log_filename).exists() {
        return Err(format!("Items log file does not exist for user '{}'.", user_id).into());
      }
    }

    let store: KVStore<Item> = KVStore::init(&self.data_dir, &log_filename)?;
    for (_id, item) in store.get_iter() { self.add_to_indexes(item)?; }
    self.store_by_user_id.insert(String::from(user_id), store);

    Ok(())
  }

  fn add_to_indexes(&mut self, item: &Item) -> InfuResult<()> {
    self.owner_id_by_item_id.insert(item.id.clone(), item.owner_id.clone());
    match &item.parent_id {
      Some(parent_id) => {
        match item.relationship_to_parent {
          RelationshipToParent::Child => {
            match self.children_of.get_mut(parent_id) {
              Some(children) => { children.push(item.id.clone()); },
              None => { self.children_of.insert(parent_id.clone(), vec![item.id.clone()]); }
            }
          },
          RelationshipToParent::Attachment => {
            match self.attachments_of.get_mut(parent_id) {
              Some(attachments) => { attachments.push(item.id.clone()); },
              None => { self.attachments_of.insert(parent_id.clone(), vec![item.id.clone()]); }
            }
          },
          RelationshipToParent::NoParent => {
            return Err(format!("'no-parent' relationship to parent for item '{}' is not valid because it is not a root item.", item.id).into());
          }
        }
      },
      None => {
        if item.relationship_to_parent != RelationshipToParent::NoParent {
          return Err(format!("Relationship to parent for root page item '{}' must be 'no-parent', not '{}'.", item.id, item.relationship_to_parent.to_string()).into());
        }
        // By convention, root level items are children of themselves.
        match self.children_of.get_mut(&item.id) {
          Some(children) => { children.push(item.id.clone()); },
          None => { self.children_of.insert(item.id.clone(), vec![item.id.clone()]); }
        }
      }
    }
    Ok(())
  }

  fn remove_from_indexes(&mut self, item: &Item) -> InfuResult<()> {
    self.owner_id_by_item_id.remove(&item.id)
      .ok_or(format!("Item '{}' is missing in the owner_id_by_item_id map.", item.id))?;

    match &item.parent_id {
      Some(parent_id) => {
        match item.relationship_to_parent {
          RelationshipToParent::Child => {
            let child_list = self.children_of.remove(parent_id)
              .ok_or(format!("Item '{}' parent '{}' is missing a children_of index.", item.id, parent_id))?;
            let updated_child_list = child_list.iter()
              .filter(|el| **el != item.id).map(|v| v.clone()).collect::<Vec<String>>();
            if updated_child_list.len() > 0 {
              self.children_of.insert(parent_id.clone(), updated_child_list);
            }
          },
          RelationshipToParent::Attachment => {
            let attachment_list = self.attachments_of.remove(parent_id)
              .ok_or(format!("Item '{}' parent '{}' is missing a attachment_of index.", item.id, parent_id))?;
            let updated_attachment_list = attachment_list.iter()
              .filter(|el| **el != item.id).map(|v| v.clone()).collect::<Vec<String>>();
            if updated_attachment_list.len() > 0 {
              self.attachments_of.insert(parent_id.clone(), updated_attachment_list);
            }
          },
          RelationshipToParent::NoParent => {
            return Err(format!("'no-parent' relationship to parent for item '{}' is not valid because it is not a root item.", item.id).into());
          }
        }
      },
      None => {
        if item.relationship_to_parent != RelationshipToParent::NoParent {
          return Err(format!("Relationship to parent for root page item '{}' must be 'no-parent', not '{}'.", item.id, item.relationship_to_parent.to_string()).into());
        }
        // By convention, root level items are children of themselves.
        let child_list = self.children_of.remove(&item.id)
          .ok_or(format!("Root item '{}' is missing a children_of index.", item.id))?;
        let updated_child_list = child_list.iter()
          .filter(|el| **el == item.id).map(|v| v.clone()).collect::<Vec<String>>();
        if updated_child_list.len() > 0 {
          self.children_of.insert(item.id.clone(), updated_child_list);
        }
      }
    }

    Ok(())
  }

  pub fn add(&mut self, item: Item) -> InfuResult<()> {
    self.store_by_user_id.get_mut(&item.owner_id)
      .ok_or(format!("Item store has not been loaded for user '{}'.", item.owner_id))?
      .add(item.clone())?;
    self.add_to_indexes(&item)
  }

  pub fn update(&mut self, item: &Item) -> InfuResult<()> {
    // TODO (LOW): implementation of PartialEq would be better.
    let old_item = self.store_by_user_id.get(&item.owner_id)
      .ok_or(format!("Item store has not been loaded for user '{}'.", item.owner_id))?
      .get(&item.id)
      .ok_or(format!("Attempt was made to update item '{}', but it does not exist.", item.id))?;
    if Item::create_json_update(old_item, item)?.len() == 2 {
      // "__recordType" and "id" and nothing else.
      return Err(format!("Attempt was made to update item '{}', but nothing has changed.", item.id).into());
    }

    self.remove_from_indexes(&item)?;
    self.store_by_user_id.get_mut(&item.owner_id)
      .ok_or(format!("Item store has not been loaded for user '{}'.", item.owner_id))?
      .update(item.clone())?;
    self.add_to_indexes(item)
  }

  pub fn get_children(&mut self, parent_id: &Uid) -> InfuResult<Vec<&Item>> {
    let owner_id = self.owner_id_by_item_id.get(parent_id)
      .ok_or(format!("Unknown item '{}' - corresponding user item store might not be loaded.", parent_id))?;
    let store = self.store_by_user_id.get(owner_id)
      .ok_or(format!("Item store is not loaded for user '{}'.", owner_id))?;
    let children = self.children_of
      .get(parent_id)
      .unwrap_or(&vec![])
      .iter().map(|id| store.get(&id)).collect::<Option<Vec<&Item>>>()
      .ok_or(format!("One or more children of '{}' are missing.", parent_id))?;
    Ok(children)
  }

  pub fn get_attachments(&self, parent_id: &Uid) -> InfuResult<Vec<&Item>> {
    let owner_id = self.owner_id_by_item_id.get(parent_id)
      .ok_or(format!("Unknown item '{}' - corresponding user item store may not be loaded.", parent_id))?;
    let store = self.store_by_user_id.get(owner_id)
      .ok_or(format!("Item store is not loaded for user '{}'.", owner_id))?;
    let attachments = self.attachments_of
      .get(parent_id)
      .unwrap_or(&vec![])
      .iter().map(|id| store.get(&id)).collect::<Option<Vec<&Item>>>()
      .ok_or(format!("One or more attachments of '{}' are missing.", parent_id))?;
    Ok(attachments)
  }
}
