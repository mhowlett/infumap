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

use serde::{Serialize, ser::SerializeStruct};
use serde_json::{Map, Value};
use crate::util::infu::{InfuError, InfuResult};
use super::{JsonLogSerializable, get_json_object_string_field};


pub struct User {
  pub id: String,
  pub username: String,
  pub password_hash: String,
  pub password_salt: String,
  pub root_page_id: String,
}

impl Serialize for User {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error> where S: serde::Serializer {
    const NUM_FIELDS: usize = 6;
    let mut state = serializer.serialize_struct("user", NUM_FIELDS)?;
    state.serialize_field("__record_type", "entry")?;
    state.serialize_field("id", &self.id)?;
    state.serialize_field("username", &self.username)?;
    state.serialize_field("password_hash", &self.password_hash)?;
    state.serialize_field("password_salt", &self.password_salt)?;
    state.serialize_field("root_page_id", &self.root_page_id)?;
    state.end()
  }
}

impl JsonLogSerializable<User> for User {
  fn value_type_identifier() -> &'static str {
    "user"
  }

  fn from_json_map(map: &Map<String, Value>) -> InfuResult<User> {
    // TODO (LOW): check for/error on unexepected fields.
    Ok(User {
      id: get_json_object_string_field(map, "id")?,
      username: get_json_object_string_field(map, "username")?,
      password_hash: get_json_object_string_field(map, "password_hash")?,
      password_salt: get_json_object_string_field(map, "password_salt")?,
      root_page_id: get_json_object_string_field(map, "root_page_id")?,
    })
  }

  fn update_from_json_map(&mut self, map: &Map<String, Value>) -> InfuResult<()> {
    // TODO (LOW): check for/error on unexepected fields.
    if let Ok(v) = get_json_object_string_field(map, "username") { self.username = v; }
    if let Ok(v) = get_json_object_string_field(map, "password_hash") { self.password_hash = v; }
    if let Ok(v) = get_json_object_string_field(map, "password_salt") { self.password_hash = v; }
    if let Ok(v) = get_json_object_string_field(map, "root_page_id") { self.password_hash = v; }
    Ok(())
  }

  fn get_id(&self) -> &String {
    &self.id
  }

  fn get_json_update_map(old: &User, new: &User) -> InfuResult<Map<String, Value>> {
    if old.id != new.id { return Err(InfuError::new("Attempt was made to create a User update record from instances with non-matching ids.")); }
    let mut result: Map<String, Value> = Map::new();
    result.insert(String::from("__record_type"), serde_json::from_str("update")?);
    if old.password_hash != new.password_hash { result.insert(String::from("password_hash"), serde_json::from_str(&new.password_hash)?); }
    if old.password_salt != new.password_salt { result.insert(String::from("password_salt"), serde_json::from_str(&new.password_salt)?); }
    if old.root_page_id != new.root_page_id { result.insert(String::from("root_page_id"), serde_json::from_str(&new.root_page_id)?); }
    Ok(result)
  }
}
