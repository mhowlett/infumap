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

use serde_json::{Map, Value};
use sha2::{Sha256, Digest};
use crate::util::infu::InfuResult;
use crate::util::uid::Uid;
use super::kv_store::{JsonLogSerializable, get_json_object_string_field};


pub struct User {
  pub id: String,
  pub username: Uid,
  pub password_hash: String,
  pub password_salt: String,
  pub root_page_id: String,
}

impl User {
  pub fn compute_password_hash(password_salt: &str, password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(format!("{}-{}", password, password_salt));
    String::from(format!("{:x}", hasher.finalize()))
  }
}

impl Clone for User {
  fn clone(&self) -> Self {
    Self { id: self.id.clone(), username: self.username.clone(), password_hash: self.password_hash.clone(), password_salt: self.password_salt.clone(), root_page_id: self.root_page_id.clone() }
  }
}

impl JsonLogSerializable<User> for User {
  fn value_type_identifier() -> &'static str {
    "user"
  }

  fn get_id(&self) -> &String {
    &self.id
  }

  fn serialize_entry(&self) -> InfuResult<Map<String, Value>> {
    let mut result = Map::new();
    result.insert(String::from("__record_type"), Value::String(String::from("entry")));
    result.insert(String::from("id"), Value::String(self.id.clone()));
    result.insert(String::from("username"), Value::String(self.username.clone()));
    result.insert(String::from("password_hash"), Value::String(self.password_hash.clone()));
    result.insert(String::from("password_salt"), Value::String(self.password_salt.clone()));
    result.insert(String::from("root_page_id"), Value::String(self.root_page_id.clone()));
    Ok(result)
  }

  fn deserialize_entry(map: &Map<String, Value>) -> InfuResult<User> {
    // TODO (LOW): check for/error on unexepected fields.
    Ok(User {
      id: get_json_object_string_field(map, "id")?,
      username: get_json_object_string_field(map, "username")?,
      password_hash: get_json_object_string_field(map, "password_hash")?,
      password_salt: get_json_object_string_field(map, "password_salt")?,
      root_page_id: get_json_object_string_field(map, "root_page_id")?,
    })
  }

  fn serialize_update(old: &User, new: &User) -> InfuResult<Map<String, Value>> {
    if old.id != new.id { return Err("Attempt was made to create a User update record from instances with non-matching ids.".into()); }
    let mut result: Map<String, Value> = Map::new();
    result.insert(String::from("__record_type"), serde_json::from_str("update")?);
    if old.password_hash != new.password_hash { result.insert(String::from("password_hash"), serde_json::from_str(&new.password_hash)?); }
    if old.password_salt != new.password_salt { result.insert(String::from("password_salt"), serde_json::from_str(&new.password_salt)?); }
    if old.root_page_id != new.root_page_id { result.insert(String::from("root_page_id"), serde_json::from_str(&new.root_page_id)?); }
    Ok(result)
  }

  fn deserialize_update(&mut self, map: &Map<String, Value>) -> InfuResult<()> {
    // TODO (LOW): check for/error on unexepected fields.
    if let Ok(v) = get_json_object_string_field(map, "username") { self.username = v; }
    if let Ok(v) = get_json_object_string_field(map, "password_hash") { self.password_hash = v; }
    if let Ok(v) = get_json_object_string_field(map, "password_salt") { self.password_salt = v; }
    if let Ok(v) = get_json_object_string_field(map, "root_page_id") { self.root_page_id = v; }
    Ok(())
  }
}
