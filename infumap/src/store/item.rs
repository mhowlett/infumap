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
use super::{JsonLogSerializable, vector_to_object, get_json_object_string_field, get_json_object_integer_field, get_json_object_vector_field, get_json_object_float_field};


pub enum RelationshipToParent {
  NoParent,
  Child,
  Attachment
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
  item_type: String,
  id: Uid,
  parent_id: Option<Uid>,
  relationship_to_parent: RelationshipToParent,
  original_creation_date: i64,
  creation_date: i64,
  last_modified_date: i64,
  ordering: Vec<u8>,
  title: String,
  spatial_position_bl: Vector<f64>,

  // x-sizeable
  spatial_width_bl: Option<f64>,

  // page
  inner_spatial_width_bl: Option<f64>,
  natural_aspect: Option<f64>,
  bg_color_idx: Option<i64>,

  // note
  url: Option<String>,
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
    match &self.parent_id {
      Some(uid) => { result.insert(String::from("parent_id"), Value::String(uid.clone())); },
      None => { result.insert(String::from("parent_id"), Value::Null); }
    };
    result.insert(String::from("relationship_to_parent"), Value::String(String::from(self.relationship_to_parent.to_string())));
    result.insert(String::from("original_creation_date"), Value::Number(self.original_creation_date.into()));
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

    Ok(result)
  }

  fn deserialize_entry(map: &serde_json::Map<String, serde_json::Value>) -> InfuResult<Item> {
    // TODO (LOW): check for/error on unexepected fields.
    Ok(Item {
      item_type: get_json_object_string_field(map, "item_type")?,
      id: get_json_object_string_field(map, "id")?,
      parent_id: match get_json_object_string_field(map, "parent_id") { Ok(s) => Some(s), Err(_) => None }, // TODO (LOW): Proper handling of errors.
      relationship_to_parent: RelationshipToParent::from_string(&get_json_object_string_field(map, "relationship_to_parent")?)?,
      original_creation_date: get_json_object_integer_field(map, "original_creation_date")?,
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
    })
  }

  fn serialize_update(_old: &Item, _new: &Item) -> InfuResult<serde_json::Map<String, serde_json::Value>> {
    todo!()
  }

  fn deserialize_update(&mut self, _map: &serde_json::Map<String, serde_json::Value>) -> InfuResult<()> {
    todo!()
  }
}
