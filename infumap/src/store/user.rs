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
use crate::util::json;
use super::kv_store::JsonLogSerializable;


const ALL_JSON_FIELDS: [&'static str; 6] = ["__recordType", "id", "username", "passwordHash", "passwordSalt", "rootPageId"];

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
    Self {
      id: self.id.clone(),
      username: self.username.clone(),
      password_hash: self.password_hash.clone(),
      password_salt: self.password_salt.clone(),
      root_page_id: self.root_page_id.clone()
    }
  }
}

impl JsonLogSerializable<User> for User {
  fn value_type_identifier() -> &'static str {
    "user"
  }

  fn get_id(&self) -> &String {
    &self.id
  }

  fn to_json(&self) -> InfuResult<Map<String, Value>> {
    let mut result = Map::new();
    result.insert(String::from("__recordType"), Value::String(String::from("entry")));
    result.insert(String::from("id"), Value::String(self.id.clone()));
    result.insert(String::from("username"), Value::String(self.username.clone()));
    result.insert(String::from("passwordHash"), Value::String(self.password_hash.clone()));
    result.insert(String::from("passwordSalt"), Value::String(self.password_salt.clone()));
    result.insert(String::from("rootPageId"), Value::String(self.root_page_id.clone()));
    Ok(result)
  }

  fn from_json(map: &Map<String, Value>) -> InfuResult<User> {
    json::validate_map_fields(map, &ALL_JSON_FIELDS)?; // TODO (LOW): JsonSchema validation.
    Ok(User {
      id: json::get_string_field(map, "id")?.ok_or("'id' field was missing.")?,
      username: json::get_string_field(map, "username")?.ok_or("'username' field was missing.")?,
      password_hash: json::get_string_field(map, "passwordHash")?.ok_or("'passwordHash' field was missing.")?,
      password_salt: json::get_string_field(map, "passwordSalt")?.ok_or("'passwordSalt' field was missing.")?,
      root_page_id: json::get_string_field(map, "rootPageId")?.ok_or("'rootPageId' field was missing.")?,
    })
  }

  fn create_json_update(old: &User, new: &User) -> InfuResult<Map<String, Value>> {
    if old.id != new.id { return Err("Attempt was made to create a User update record from instances with non-matching ids.".into()); }
    let mut result: Map<String, Value> = Map::new();
    result.insert(String::from("__recordType"), serde_json::from_str("update")?);
    if old.password_hash != new.password_hash { result.insert(String::from("passwordHash"), serde_json::from_str(&new.password_hash)?); }
    if old.password_salt != new.password_salt { result.insert(String::from("passwordSalt"), serde_json::from_str(&new.password_salt)?); }
    if old.root_page_id != new.root_page_id { result.insert(String::from("rootPageId"), serde_json::from_str(&new.root_page_id)?); }
    Ok(result)
  }

  fn apply_json_update(&mut self, map: &Map<String, Value>) -> InfuResult<()> {
    json::validate_map_fields(map, &ALL_JSON_FIELDS)?; // TODO (LOW): JsonSchema validation.
    if let Ok(v) = json::get_string_field(map, "username") { if let Some(u) = v { self.username = u; } }
    if let Ok(v) = json::get_string_field(map, "passwordHash") { if let Some(u) = v { self.password_hash = u; } }
    if let Ok(v) = json::get_string_field(map, "passwordSalt") { if let Some(u) = v { self.password_salt = u; } }
    if let Ok(v) = json::get_string_field(map, "rootPageId") { if let Some(u) = v { self.root_page_id = u; } }
    Ok(())
  }
}
