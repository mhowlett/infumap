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

use serde::{Serialize, Deserialize};
use serde_json::{Value, Map, Number};

use crate::util::json;
use crate::util::uid::Uid;
use crate::util::geometry::Vector;
use crate::util::infu::InfuResult;
use crate::util::lang::option_xor;
use crate::web::routes::WebApiJsonSerializable;
use super::kv_store::JsonLogSerializable;


#[derive(Debug, PartialEq, Serialize, Deserialize)]
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
      other => Err(format!("Invalid RelationshipToParent value: '{}'.", other).into())
    }
  }
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


const ALL_JSON_FIELDS: [&'static str; 17] = ["__recordType",
  "itemType", "ownerId", "id", "parentId", "relationshipToParent",
  "creationDate", "lastModifiedDate", "ordering", "title",
  "spatialPositionBl", "spatialWidthBl", "innerSpatialWidthBl",
  "naturalAspect", "backgroundColorIndex", "url", "originalCreationDate"];

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
  pub background_color_index: Option<i64>,

  // note
  pub url: Option<String>,

  // file
  pub original_creation_date: Option<i64>,
  // TODO: not complete
}

impl Clone for Item {
  fn clone(&self) -> Self {
    Self {
      item_type: self.item_type.clone(),
      owner_id: self.owner_id.clone(),
      id: self.id.clone(),
      parent_id: self.parent_id.clone(),
      relationship_to_parent: self.relationship_to_parent.clone(),
      creation_date: self.creation_date.clone(),
      last_modified_date: self.last_modified_date.clone(),
      ordering: self.ordering.clone(),
      title: self.title.clone(),
      spatial_position_bl: self.spatial_position_bl.clone(),
      spatial_width_bl: self.spatial_width_bl.clone(),
      inner_spatial_width_bl: self.inner_spatial_width_bl.clone(),
      natural_aspect: self.natural_aspect.clone(),
      background_color_index: self.background_color_index.clone(),
      url: self.url.clone(),
      original_creation_date: self.original_creation_date.clone()
    }
  }
}


impl WebApiJsonSerializable<Item> for Item {
  fn to_api_json(&self) -> InfuResult<Map<String, Value>> {
    to_json(self)
  }

  fn from_api_json(map: &Map<String, Value>) -> InfuResult<Item> {
    from_json(map)
  }
}


impl JsonLogSerializable<Item> for Item {
  fn value_type_identifier() -> &'static str {
    "item"
  }

  fn get_id(&self) -> &Uid {
    &self.id
  }

  fn to_json(&self) -> InfuResult<serde_json::Map<String, serde_json::Value>> {
    let mut result = to_json(self)?;
    result.insert(String::from("__recordType"), Value::String(String::from("entry")));
    Ok(result)
  }

  fn from_json(map: &serde_json::Map<String, serde_json::Value>) -> InfuResult<Item> {
    from_json(map)
  }

  fn create_json_update(old: &Item, new: &Item) -> InfuResult<serde_json::Map<String, serde_json::Value>> {
    fn nan_err(field_name: &str, item_id: &str) -> String {
      format!("Could not serialize the '{}' field of item '{}' to an update record because it is not a number.", field_name, item_id)
    }
    fn add_or_remove_err(field_name: &str, item_id: &str) -> InfuResult<()> {
      Err(format!("An attempt was made to create an item update that adds or removes the field '{}' of item '{}', but this is not allowed.", field_name, item_id).into())
    }
    fn cannot_modify_err(field_name: &str, item_id: &str) -> InfuResult<()> {
      Err(format!("An attempt was made to create an item update that modifies the field '{}' of item '{}', but this is not allowed.", field_name, item_id).into())
    }

    if old.id != new.id { return Err("An attempt was made to create an item update from instances with non-matching ids.".into()); }
    if old.owner_id != new.owner_id { return Err("An attempt was made to create an item update from instances with non-matching owner_ids.".into()); }

    let mut result: Map<String, Value> = Map::new();
    result.insert(String::from("__recordType"), Value::String(String::from("update")));
    result.insert(String::from("id"), Value::String(new.id.clone()));

    if option_xor(&old.parent_id, &new.parent_id) { add_or_remove_err("parentId", &old.id)?; }
    if let Some(parent_id) = &new.parent_id {
      if old.parent_id.as_ref().unwrap() != parent_id {
        result.insert(String::from("parentId"), Value::String(String::from(parent_id)));
      }
    }

    if old.relationship_to_parent != new.relationship_to_parent { result.insert(String::from("relationshipToParent"), Value::String(String::from(new.relationship_to_parent.to_string()))); }
    if old.creation_date != new.creation_date { cannot_modify_err("creationDate", &old.id)?; }
    if old.last_modified_date != new.last_modified_date { result.insert(String::from("lastModifiedDate"), Value::Number(new.last_modified_date.into())); }
    if old.ordering != new.ordering { result.insert(String::from("ordering"), Value::Array(new.ordering.iter().map(|v| Value::Number((*v).into())).collect::<Vec<_>>())); }
    if old.title != new.title { result.insert(String::from("title"), Value::String(new.title.clone())); }
    if old.spatial_position_bl != new.spatial_position_bl { result.insert(String::from("spatialPositionBl"), json::vector_to_object(&new.spatial_position_bl)?); }

    // x-sizable.
    if option_xor(&old.spatial_width_bl, &new.spatial_width_bl) { add_or_remove_err("spatialWidthBl", &old.id)?; }
    if let Some(spatial_width_bl) = new.spatial_width_bl {
      if old.spatial_width_bl.unwrap() != spatial_width_bl {
        result.insert(String::from("spatialWidthBl"), Value::Number(Number::from_f64(spatial_width_bl).ok_or(nan_err("spatialWidthBl", &old.id))?));
      }
    }

    // page
    if option_xor(&old.inner_spatial_width_bl, &new.inner_spatial_width_bl) { add_or_remove_err("innerSpatialWidthBl", &old.id)?; }
    if let Some(inner_spatial_width_bl) = new.inner_spatial_width_bl {
      if old.inner_spatial_width_bl.unwrap() != inner_spatial_width_bl {
        result.insert(String::from("innerSpatialWidthBl"), Value::Number(Number::from_f64(inner_spatial_width_bl).ok_or(nan_err("innerSpatialWidthBl", &old.id))?));
      }
    }
    if option_xor(&old.natural_aspect, &new.natural_aspect) { add_or_remove_err("naturalAspect", &old.id)?; }
    if let Some(natural_aspect) = new.natural_aspect {
      if old.natural_aspect.unwrap() != natural_aspect {
        result.insert(String::from("naturalAspect"), Value::Number(Number::from_f64(natural_aspect).ok_or(nan_err("naturalAspect", &old.id))?));
      }
    }
    if option_xor(&old.background_color_index, &new.background_color_index) { add_or_remove_err("backgroundColorIndex", &old.id)?; }
    if let Some(background_color_index) = new.background_color_index {
      if old.background_color_index.unwrap() != background_color_index {
        result.insert(String::from("backgroundColorIndex"), Value::Number(background_color_index.into()));
      }
    }

    // note
    if option_xor(&old.url, &new.url) {
      // no url is encoded as "", not null.
      add_or_remove_err("url", &old.id)?;
    }
    if let Some(url) = &new.url {
      if old.url.as_ref().unwrap() != url {
        result.insert(String::from("url"), Value::String(url.clone()));
      }
    }

    // file
    if option_xor(&old.original_creation_date, &new.original_creation_date) { add_or_remove_err("originalCreationDate", &old.id)?; }
    if let Some(original_creation_date) = new.original_creation_date {
      if old.original_creation_date.unwrap() != original_creation_date {
        cannot_modify_err("originalCreationDate", &old.id)?;
      }
    }
    // TODO (MEDIUM): not complete.
  
    Ok(result)
  }

  fn apply_json_update(&mut self, map: &serde_json::Map<String, serde_json::Value>) -> InfuResult<()> {
    fn cannot_update_err(field_name: &str, item_id: &str) -> InfuResult<()> {
      Err(format!("An attempt was made to apply an update to the '{}' field of item '{}', but this is not allowed.", field_name, item_id).into())
    }

    json::validate_map_fields(map, &ALL_JSON_FIELDS)?; // TODO (LOW): JsonSchema validation.

    if let Ok(_) = json::get_string_field(map, "itemType") { cannot_update_err("itemType", &self.id)?; }
    if let Ok(_) = json::get_string_field(map, "ownerId") { cannot_update_err("ownerId", &self.id)?; }
    
    if let Ok(v) = json::get_string_field(map, "parentId") {
      if self.parent_id.is_none() {
        return Err(format!("An attempt was made to apply an update to item '{}' that sets the 'parentId' field, where this was not previously set.", self.id).into());
      }
      self.parent_id = Some(v);
    }
    if let Ok(v) = json::get_string_field(map, "relationshipToParent") { self.relationship_to_parent = RelationshipToParent::from_string(&v)?; }
    if let Ok(_) = json::get_integer_field(map, "creationDate") { cannot_update_err("creationDate", &self.id)?; }
    if let Ok(v) = json::get_integer_field(map, "lastModifiedDate") { self.last_modified_date = v; }
    if map.contains_key("ordering") {
      self.ordering = map.get("ordering")
        .unwrap()
        .as_array()
        .ok_or(format!("Ordering field for item '{}' is not an array.", self.id))?
        .iter().map(|v| v.as_i64().unwrap() as u8).collect::<Vec<_>>();
    }
    if let Ok(v) = json::get_string_field(map, "title") { self.title = v; }
    if let Ok(v) = json::get_vector_field(map, "spatialPositionBl") { self.spatial_position_bl = v; }

    // x-sizable
    if let Ok(v) = json::get_float_field(map, "spatialWidthBl") { self.spatial_width_bl = Some(v); }

    // page
    if let Ok(v) = json::get_float_field(map, "innerSpatialWidthBl") { self.inner_spatial_width_bl = Some(v); }
    if let Ok(v) = json::get_float_field(map, "naturalAspect") { self.natural_aspect = Some(v); }
    if let Ok(v) = json::get_integer_field(map, "backgroundColorIndex") { self.background_color_index = Some(v); }

    // note
    if let Ok(v) = json::get_string_field(map, "url") { self.url = Some(v); }

    // file
    if let Ok(_) = json::get_integer_field(map, "originalCreationDate") { cannot_update_err("originalCreationDate", &self.id)?; }
    // TODO (MEDIUM): not complete.

    Ok(())
  }
}


fn to_json(item: &Item) -> InfuResult<serde_json::Map<String, serde_json::Value>> {
  fn nan_err(field_name: &str, item_id: &str) -> String {
    format!("Could not serialize the '{}' field of item '{}' because it is not a number.", field_name, item_id)
  }

  let mut result = Map::new();
  result.insert(String::from("itemType"), Value::String(item.item_type.clone()));
  result.insert(String::from("id"), Value::String(item.id.clone()));
  result.insert(String::from("ownerId"), Value::String(item.owner_id.clone()));
  match &item.parent_id {
    Some(uid) => { result.insert(String::from("parentId"), Value::String(uid.clone())); },
    None => { result.insert(String::from("parentId"), Value::Null); }
  };
  result.insert(String::from("relationshipToParent"), Value::String(String::from(item.relationship_to_parent.to_string())));
  result.insert(String::from("creationDate"), Value::Number(item.creation_date.into()));
  result.insert(String::from("lastModifiedDate"), Value::Number(item.last_modified_date.into()));
  result.insert(String::from("ordering"), Value::Array(item.ordering.iter().map(|v| Value::Number((*v).into())).collect::<Vec<_>>()));
  result.insert(String::from("title"), Value::String(item.title.clone()));
  result.insert(String::from("spatialPositionBl"), json::vector_to_object(&item.spatial_position_bl)?);

  // x-sizeable
  if let Some(spatial_width_bl) = item.spatial_width_bl {
    result.insert(
      String::from("spatialWidthBl"),
      Value::Number(Number::from_f64(spatial_width_bl).ok_or(nan_err("spatialWidthBl", &item.id))?));
  }

  // page
  if let Some(inner_spatial_width_bl) = item.inner_spatial_width_bl {
    result.insert(
      String::from("innerSpatialWidthBl"),
      Value::Number(Number::from_f64(inner_spatial_width_bl).ok_or(nan_err("innerSpatialWidthBl", &item.id))?));
  }
  if let Some(natural_aspect) = item.natural_aspect {
    result.insert(
      String::from("naturalAspect"),
      Value::Number(Number::from_f64(natural_aspect).ok_or(nan_err("naturalAspect", &item.id))?));
  }
  if let Some(background_color_index) = item.background_color_index {
    result.insert(String::from("backgroundColorIndex"), Value::Number(background_color_index.into()));
  }

  // note
  if let Some(url) = &item.url {
    result.insert(String::from("url"), Value::String(url.clone()));
  }

  // file
  if let Some(original_creation_date) = item.original_creation_date {
    result.insert(String::from("originalCreationDate"), Value::Number(original_creation_date.into()));
  }
  // TODO (MEDIUM): not complete.

  Ok(result)
}


fn from_json(map: &serde_json::Map<String, serde_json::Value>) -> InfuResult<Item> {
  json::validate_map_fields(map, &ALL_JSON_FIELDS)?; // TODO (LOW): JsonSchema validation.

  let id = json::get_string_field(map, "id")?;

  Ok(Item {
    item_type: json::get_string_field(map, "itemType")?,
    id: id.clone(),
    owner_id: json::get_string_field(map, "ownerId")?,
    parent_id: json::get_string_field(map, "parentId").ok(), // TODO (LOW): Proper handling of errors.
    relationship_to_parent: RelationshipToParent::from_string(&json::get_string_field(map, "relationshipToParent")?)?,
    creation_date: json::get_integer_field(map, "creationDate")?,
    last_modified_date: json::get_integer_field(map, "lastModifiedDate")?,
    ordering: map.get("ordering")
      .ok_or(format!("'ordering' field was not available for item '{}'.", &id))?
      .as_array()
      .ok_or(format!("'ordering' field for item '{}' was not of type 'array'.", &id))?
      .iter().map(|v| match v.as_i64() { Some(v) => Some(v as u8), None => None })
      .collect::<Option<Vec<_>>>().ok_or(format!("One or more element of the 'ordering' field for item '{}' was invalid.", &id))?,
    title: json::get_string_field(map, "title")?,
    spatial_position_bl: json::get_vector_field(map, "spatialPositionBl")?,

    // x-sizeable
    spatial_width_bl: json::get_float_field(map, "spatialWidthBl").ok(), // TODO (LOW): Proper handling of errors.

    // page
    inner_spatial_width_bl: json::get_float_field(map, "innerSpatialWidthBl").ok(), // TODO (LOW): Proper handling of errors.
    natural_aspect: json::get_float_field(map, "naturalAspect").ok(), // TODO (LOW): Proper handling of errors.
    background_color_index: json::get_integer_field(map, "backgroundColorIndex").ok(), // TODO (LOW): Proper handling of errors.

    // note
    url: json::get_string_field(map, "url").ok(), // TODO (LOW): Proper handling of errors.

    // file
    original_creation_date: json::get_integer_field(map, "originalCreationDate").ok(), // TODO (LOW): Proper handling of errors.
    // TODO (MEDIUM): not complete.
  })
}
