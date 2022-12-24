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

use serde_json::{Value, Map};
use crate::util::uid::Uid;
use crate::util::infu::InfuResult;
use super::kv_store::{JsonLogSerializable, get_json_object_string_field, get_json_object_integer_field};


pub struct Session {
  pub id: Uid,
  pub user_id: Uid,
  pub expires: i64
}

impl Clone for Session {
  fn clone(&self) -> Self {
    Self { id: self.id.clone(), user_id: self.user_id.clone(), expires: self.expires.clone() }
  }
}

impl JsonLogSerializable<Session> for Session {
  fn value_type_identifier() -> &'static str {
    "session"
  }

  fn get_id(&self) -> &Uid {
    &self.id
  }

  fn serialize_entry(&self) -> InfuResult<serde_json::Map<String, serde_json::Value>> {
    let mut result = Map::new();
    result.insert(String::from("__recordType"), Value::String(String::from("entry")));
    result.insert(String::from("id"), Value::String(self.id.clone()));
    result.insert(String::from("userId"), Value::String(self.user_id.clone()));
    result.insert(String::from("expires"), Value::Number(self.expires.into()));
    Ok(result)
  }

  fn deserialize_entry(map: &serde_json::Map<String, serde_json::Value>) -> InfuResult<Session> {
    // TODO (LOW): check for/error on unexepected fields.
    Ok(Session {
      id: get_json_object_string_field(map, "id")?,
      user_id: get_json_object_string_field(map, "userId")?,
      expires: get_json_object_integer_field(map, "expires")?,
    })
  }

  fn serialize_update(_old: &Session, _new: &Session) -> InfuResult<serde_json::Map<String, serde_json::Value>> {
    // Never used.
    panic!();
  }

  fn deserialize_and_apply_update(&mut self, _map: &serde_json::Map<String, serde_json::Value>) -> InfuResult<()> {
    // Never used.
    panic!()
  }
}
