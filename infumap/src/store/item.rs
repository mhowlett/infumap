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

use serde_json::{Value, Map, Number};
use crate::util::{uid::Uid, geometry::Vector, infu::{InfuResult, InfuError}};
use super::kv_store::{JsonLogSerializable, vector_to_object, get_json_object_string_field, get_json_object_integer_field, get_json_object_vector_field, get_json_object_float_field};


#[derive(PartialEq)]
pub enum RelationshipToParent {
  NoParent,
  Child,
  Attachment
}

impl Clone for RelationshipToParent {
  fn clone(&self) -> Self {
    match self {
      Self::NoParent => Self::NoParent,
      Self::Child => Self::Child,
      Self::Attachment => Self::Attachment,
    }
  }
}

impl RelationshipToParent {
  pub fn to_string(&self) -> &'static str {
    match self {
      RelationshipToParent::Attachment => "attachment",
      RelationshipToParent::Child => "child",
      RelationshipToParent::NoParent => "no-parent"
    }
  }

  pub fn from_string(s: &str) -> InfuResult<RelationshipToParent> {
    match s {
      "attachment" => Ok(RelationshipToParent::Attachment),
      "child" => Ok(RelationshipToParent::Child),
      "no-parent" => Ok(RelationshipToParent::NoParent),
      other => Err(InfuError::new(&format!("invalid relationship-to-parent value: '{}'.", other)))
    }
  }
}


pub struct Item {
  pub item_type: String,
  pub owner_id: Uid,
  pub id: Uid,
  pub parent_id: Option<Uid>,
  pub relationship_to_parent: RelationshipToParent,
  pub creation_date: i64,
  pub last_modified_date: i64,
  pub ordering: Vec<u8>,
  pub title: String,
  pub spatial_position_bl: Vector<f64>,

  // x-sizeable
  pub spatial_width_bl: Option<f64>,

  // page
  pub inner_spatial_width_bl: Option<f64>,
  pub natural_aspect: Option<f64>,
  pub bg_color_idx: Option<i64>,

  // note
  pub url: Option<String>,

  // file
  pub original_creation_date: Option<i64>,
  // TODO: not complete
}

impl Clone for Item {
  fn clone(&self) -> Self {
    Self { item_type: self.item_type.clone(), owner_id: self.owner_id.clone(), id: self.id.clone(), parent_id: self.parent_id.clone(), relationship_to_parent: self.relationship_to_parent.clone(), creation_date: self.creation_date.clone(), last_modified_date: self.last_modified_date.clone(), ordering: self.ordering.clone(), title: self.title.clone(), spatial_position_bl: self.spatial_position_bl.clone(), spatial_width_bl: self.spatial_width_bl.clone(), inner_spatial_width_bl: self.inner_spatial_width_bl.clone(), natural_aspect: self.natural_aspect.clone(), bg_color_idx: self.bg_color_idx.clone(), url: self.url.clone(), original_creation_date: self.original_creation_date.clone() }
  }
}

impl JsonLogSerializable<Item> for Item {
  fn value_type_identifier() -> &'static str {
    "item"
  }

  fn get_id(&self) -> &Uid {
    &self.id
  }

  fn serialize_entry(&self) -> InfuResult<serde_json::Map<String, serde_json::Value>> {
    let mut result = Map::new();
    result.insert(String::from("__record_type"), Value::String(String::from("entry")));
    result.insert(String::from("item_type"), Value::String(self.item_type.clone()));
    result.insert(String::from("id"), Value::String(self.id.clone()));
    result.insert(String::from("owner_id"), Value::String(self.owner_id.clone()));
    match &self.parent_id {
      Some(uid) => { result.insert(String::from("parent_id"), Value::String(uid.clone())); },
      None => { result.insert(String::from("parent_id"), Value::Null); }
    };
    result.insert(String::from("relationship_to_parent"), Value::String(String::from(self.relationship_to_parent.to_string())));
    result.insert(String::from("creation_date"), Value::Number(self.creation_date.into()));
    result.insert(String::from("last_modified_date"), Value::Number(self.last_modified_date.into()));
    result.insert(String::from("ordering"), Value::Array(self.ordering.iter().map(|v| Value::Number((*v).into())).collect::<Vec<_>>()));
    result.insert(String::from("title"), Value::String(self.title.clone()));
    result.insert(String::from("spatial_position_bl"), vector_to_object(&self.spatial_position_bl)?);

    // x-sizeable
    if let Some(spatial_width_bl) = self.spatial_width_bl {
      result.insert(String::from("spatial_width_bl"), Value::Number(Number::from_f64(spatial_width_bl).ok_or(InfuError::new("not a number"))?));
    }

    // page
    if let Some(inner_spatial_width_bl) = self.inner_spatial_width_bl {
      result.insert(String::from("inner_spatial_width_bl"), Value::Number(Number::from_f64(inner_spatial_width_bl).ok_or(InfuError::new("not a number"))?));
    }
    if let Some(natural_aspect) = self.natural_aspect {
      result.insert(String::from("natural_aspect"), Value::Number(Number::from_f64(natural_aspect).ok_or(InfuError::new("not a number"))?));
    }
    if let Some(bg_color_idx) = self.bg_color_idx {
      result.insert(String::from("bg_color_idx"), Value::Number(bg_color_idx.into()));
    }

    // note
    if let Some(url) = &self.url {
      result.insert(String::from("url"), Value::String(url.clone()));
    }

    // file
    if let Some(original_creation_date) = self.original_creation_date {
      result.insert(String::from("original_creation_date"), Value::Number(original_creation_date.into()));
    }
    // TODO (MEDIUM): not complete.

    Ok(result)
  }

  fn deserialize_entry(map: &serde_json::Map<String, serde_json::Value>) -> InfuResult<Item> {
    // TODO (LOW): check for/error on unexepected fields.
    Ok(Item {
      item_type: get_json_object_string_field(map, "item_type")?,
      id: get_json_object_string_field(map, "id")?,
      owner_id: get_json_object_string_field(map, "owner_id")?,
      parent_id: match get_json_object_string_field(map, "parent_id") { Ok(s) => Some(s), Err(_) => None }, // TODO (LOW): Proper handling of errors.
      relationship_to_parent: RelationshipToParent::from_string(&get_json_object_string_field(map, "relationship_to_parent")?)?,
      creation_date: get_json_object_integer_field(map, "creation_date")?,
      last_modified_date: get_json_object_integer_field(map, "last_modified_date")?,
      ordering: map.get("ordering")
        .ok_or(InfuError::new("ordering field was not available"))?
        .as_array()
        .ok_or(InfuError::new("ordering field was not an array"))?
        .iter().map(|v| v.as_i64().unwrap() as u8).collect::<Vec<_>>(), // TODO (LOW): Proper handling of errors.
      title: get_json_object_string_field(map, "title")?,
      spatial_position_bl: get_json_object_vector_field(map, "spatial_position_bl")?,

      // x-sizeable
      spatial_width_bl: get_json_object_float_field(map, "spatial_width_bl").ok(), // TODO (LOW): Proper handling of errors.

      // page
      inner_spatial_width_bl: get_json_object_float_field(map, "inner_spatial_width_bl").ok(), // TODO (LOW): Proper handling of errors.
      natural_aspect: get_json_object_float_field(map, "natural_aspect").ok(), // TODO (LOW): Proper handling of errors.
      bg_color_idx: get_json_object_integer_field(map, "bg_color_idx").ok(), // TODO (LOW): Proper handling of errors.

      // note
      url: get_json_object_string_field(map, "url").ok(), // TODO (LOW): Proper handling of errors.

      // file
      original_creation_date: get_json_object_integer_field(map, "original_creation_date").ok(), // TODO (LOW): Proper handling of errors.
      // TODO (MEDIUM): not complete.
    })
  }

  fn serialize_update(_old: &Item, _new: &Item) -> InfuResult<serde_json::Map<String, serde_json::Value>> {
    todo!()
  }

  fn deserialize_update(&mut self, _map: &serde_json::Map<String, serde_json::Value>) -> InfuResult<()> {
    todo!()
  }
}
