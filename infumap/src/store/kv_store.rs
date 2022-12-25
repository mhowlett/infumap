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

use std::any::Any;
use std::collections::HashMap;
use std::collections::hash_map::Iter;
use std::fs::OpenOptions;
use std::io::{BufWriter, Write};
use std::path::PathBuf;
use std::fs::File;
use std::io::BufReader;

use serde::ser::SerializeStruct;
use serde::Serialize;
use serde_json::{self, Value, Map};
use serde_json::Value::Object;

use crate::util::infu::{InfuError, InfuResult};
use crate::util::fs::expand_tilde;
use crate::util::uid::Uid;


pub trait JsonLogSerializable<T> {
  fn value_type_identifier() -> &'static str;

  fn get_id(&self) -> &Uid;

  fn to_json(&self) -> InfuResult<Map<String, Value>>;
  fn from_json(map: &Map<String, Value>) -> InfuResult<T>;

  fn create_json_update(old: &T, new: &T) -> InfuResult<Map<String, Value>>;
  fn apply_json_update(&mut self, map: &Map<String, Value>) -> InfuResult<()>;
}


struct DescriptorRecord {
  value_type: String
}

impl Serialize for DescriptorRecord {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error> where S: serde::Serializer {
    const NUM_FIELDS: usize = 3;
    const VERSION: i64 = 0;
    let mut state = serializer.serialize_struct("Color", NUM_FIELDS)?;
    state.serialize_field("__recordType", "descriptor")?;
    state.serialize_field("version", &VERSION)?;
    state.serialize_field("valueType", &self.value_type)?;
    state.end()
  }
}


struct DeleteRecord {
  id: String
}

impl Serialize for DeleteRecord {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error> where S: serde::Serializer {
    const NUM_FIELDS: usize = 2;
    let mut state = serializer.serialize_struct("Color", NUM_FIELDS)?;
    state.serialize_field("__recordType", "delete")?;
    state.serialize_field("id", &self.id)?;
    state.end()
  }
}


/// A pretty naive KV store implementation, but it'll probably be good enough indefinitely.
/// TODO (MEDIUM): Lock mechanism to ensure only one KVStore instance is accessing files at any given time.
pub struct KVStore<T> where T: JsonLogSerializable<T> {
  log_path: PathBuf,
  map: HashMap<String, T>
}

impl<T> KVStore<T> where T: JsonLogSerializable<T> {
  pub fn init(data_dir: &str, log_filename: &str) -> InfuResult<KVStore<T>> {
    let mut log_path = expand_tilde(data_dir).ok_or("Could not interpret path.")?;
    log_path.push(log_filename);
    let path = log_path.as_path().to_str().unwrap();
    if !std::path::Path::new(path).exists() {
      let file = File::create(path)?;
      let mut writer = BufWriter::new(file);
      let descriptor = DescriptorRecord { value_type: String::from(T::value_type_identifier()) };
      writer.write_all(serde_json::to_string(&descriptor)?.as_bytes())?;
      writer.write_all("\n".as_bytes())?;
    }
    let map = Self::read_log(path)?;
    Ok(Self { log_path, map })
  }

  pub fn add(&mut self, entry: T) -> InfuResult<()> {
    if self.map.contains_key(entry.get_id()) {
      return Err(format!("Entry with id {} already exists.", entry.get_id()).into());
    }
    let file = OpenOptions::new().append(true).open(&self.log_path)?;
    let mut writer = BufWriter::new(file);
    writer.write_all(serde_json::to_string(&entry.to_json()?)?.as_bytes())?;
    writer.write_all("\n".as_bytes())?;
    self.map.insert(entry.get_id().clone(), entry);
    Ok(())
  }

  pub fn remove(&mut self, id: &str) -> InfuResult<()> {
    if !self.map.contains_key(id) {
      return Err(format!("Entry with id {} does not exist.", id).into());
    }
    let file = OpenOptions::new().append(true).open(&self.log_path)?;
    let mut writer = BufWriter::new(file);
    let delete_record = DeleteRecord { id: String::from(id) };
    writer.write_all(serde_json::to_string(&delete_record)?.as_bytes())?;
    writer.write_all("\n".as_bytes())?;
    self.map.remove(id).ok_or(format!("Entry with id {} does not exist (internal logic error).", id))?;
    Ok(())
  }

  pub fn get_iter(&self) -> Iter<String, T> {
    self.map.iter()
  }
  
  pub fn get(&self, id: &str) -> Option<&T> {
    self.map.get(id)
  }

  pub fn update(&mut self, updated: T) -> InfuResult<()> {
    let update_record = T::create_json_update(
      self.map.get(updated.get_id()).ok_or(format!("Entry with id {} does not exist.",
      updated.get_id()))?, &updated)?;
    let file = OpenOptions::new().append(true).open(&self.log_path)?;
    let mut writer = BufWriter::new(file);
    writer.write_all(serde_json::to_string(&update_record)?.as_bytes())?;
    writer.write_all("\n".as_bytes())?;
    self.map.insert(updated.get_id().clone(), updated);
    Ok(())
  }

  fn read_log_record(result: &mut HashMap<String, T>, kvs: &Map<String, Value>) -> InfuResult<()> {
    let record_type = kvs
      .get("__recordType")
      .ok_or(InfuError::new("Log record is missing field __recordType."))?
      .as_str()
      .ok_or(InfuError::new("Log record type field is not of type 'string'."))?;

    match record_type {
      "descriptor" => {
        // Subsequent records in the log conform to this descriptor.
        let version = kvs
          .get("version")
          .ok_or(InfuError::new("Descriptor log record does not specify a version."))?
          .as_i64()
          .ok_or(InfuError::new("Descriptor version does not have type 'number'."))?;
        if version != 0 {
          return Err("Descriptor version is not 0.".into());
        }
        let value_type = kvs
          .get("valueType")
          .ok_or(InfuError::new("Descriptor log record does not specify a value type."))?
          .as_str()
          .ok_or(InfuError::new("Descriptor value_type field is not of type 'string'."))?;
        if value_type != T::value_type_identifier() {
          return Err(format!("Descriptor value_type is '{}', expecting '{}'.", value_type, T::value_type_identifier()).into());
        }
      },

      "entry" => {
        // Log record is a full specification of an entry value.
        let u = T::from_json(&kvs)?;
        if result.contains_key(u.get_id()) {
          return Err(format!("Entry log record has id '{}', but an entry with this id already exists.", u.get_id()).into());
        }
        result.insert(u.get_id().clone(), u);
      },

      "update" => {
        // Log record specifies an update to an entry value.
        let id = kvs
          .get("id")
          .ok_or(InfuError::new("Update log record does not specify an entry id."))?
          .as_str()
          .ok_or(InfuError::new("Update log record id does not have type 'string'."))?;
        let u = result
          .get_mut(&String::from(id))
          .ok_or(InfuError::new(&format!("Update record has id '{}', but this is unknown.", id)))?;
        u.apply_json_update(&kvs)?;
      },

      "delete" => {
        // Log record specifies that the entry with the given id should be deleted.
        let id = kvs
          .get("id")
          .ok_or(InfuError::new("Delete log record does not specify an entry id."))?
          .as_str()
          .ok_or(InfuError::new("Delete log record id does not have type 'string'."))?;
        if !result.contains_key(&String::from(id)) {
          return Err(format!("Delete record has id '{}', but this is unknown.", id).into());
        }
        result.remove(&String::from(id));
      },

      unexpected_record_type => {
        return Err(format!("Unknown log record type '{}'.", unexpected_record_type).into());
      }
    }

    Ok(())
  }

  fn read_log(path: &str) -> InfuResult<HashMap<String, T>> {
    let f = BufReader::new(File::open(path)?);
    let deserializer = serde_json::Deserializer::from_reader(f);
    let iterator = deserializer.into_iter::<serde_json::Value>();

    let mut result: HashMap<String, T> = HashMap::new();

    for item in iterator {
      match item? {
        Object(kvs) => { Self::read_log_record(&mut result, &kvs)?; },
        unexpected_type => {
          return Err(format!("Log record has JSON type '{:?}', but 'Object' was expected.", unexpected_type.type_id()).into());
        }
      }
    }

    Ok(result)
  }
}