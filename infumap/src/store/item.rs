// Copyright (C) 2022-2023 Matt Howlett
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

use log::warn;
use serde_json::{Value, Map, Number};

use crate::util::json;
use crate::util::uid::Uid;
use crate::util::geometry::Vector;
use crate::util::infu::{InfuResult, InfuError};
use crate::util::lang::option_xor;
use crate::web::routes::WebApiJsonSerializable;
use super::kv_store::JsonLogSerializable;


#[derive(Debug, PartialEq)]
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


#[derive(Debug, PartialEq)]
pub enum AlignmentPoint {
  Center,
  LeftCenter,
  TopCenter,
  RightCenter,
  BottomCenter,
  TopLeft,
  TopRight,
  BottomRight,
  BottomLeft,
}

impl Clone for AlignmentPoint {
  fn clone(&self) -> Self {
    match self {
      Self::Center => Self::Center,
      Self::LeftCenter => Self::LeftCenter,
      Self::TopCenter => Self::TopCenter,
      Self::RightCenter => Self::RightCenter,
      Self::BottomCenter => Self::BottomCenter,
      Self::TopLeft => Self::TopLeft,
      Self::TopRight => Self::TopRight,
      Self::BottomRight => Self::BottomRight,
      Self::BottomLeft => Self::BottomLeft,
    }
  }
}

impl AlignmentPoint {
  pub fn to_string(&self) -> &'static str {
    match self {
        AlignmentPoint::Center => "center",
        AlignmentPoint::LeftCenter => "left-center",
        AlignmentPoint::TopCenter => "top-center",
        AlignmentPoint::RightCenter => "right-center",
        AlignmentPoint::BottomCenter => "bottom-center",
        AlignmentPoint::TopLeft => "top-left",
        AlignmentPoint::TopRight => "top-right",
        AlignmentPoint::BottomRight => "bottom-right",
        AlignmentPoint::BottomLeft => "bottom-left",
    }
  }

  pub fn from_string(s: &str) -> InfuResult<AlignmentPoint> {
    match s {
      "center" => Ok(AlignmentPoint::Center),
      "left-center" => Ok(AlignmentPoint::LeftCenter),
      "top-center" => Ok(AlignmentPoint::TopCenter),
      "right-center" => Ok(AlignmentPoint::RightCenter),
      "bottom-center" => Ok(AlignmentPoint::BottomCenter),
      "top-left" => Ok(AlignmentPoint::TopLeft),
      "top-right" => Ok(AlignmentPoint::TopRight),
      "bottom-right" => Ok(AlignmentPoint::BottomRight),
      "bottom-left" => Ok(AlignmentPoint::BottomLeft),
      other => Err(format!("Invalid FixedPoint value: '{}'.", other).into())
    }
  }
}

const ITEM_TYPE_PAGE: &'static str = "page";
const ITEM_TYPE_NOTE: &'static str = "note";
const ITEM_TYPE_FILE: &'static str = "file";
const ITEM_TYPE_TABLE: &'static str = "table";

const ALL_JSON_FIELDS: [&'static str; 21] = ["__recordType",
  "itemType", "ownerId", "id", "parentId", "relationshipToParent",
  "creationDate", "lastModifiedDate", "ordering", "title",
  "spatialPositionGr", "spatialWidthGr", "innerSpatialWidthGr",
  "naturalAspect", "backgroundColorIndex", "popupPositionGr",
  "popupAlignmentPoint", "popupWidthGr", "url",
  "originalCreationDate", "spatialHeightGr"];

#[derive(Debug)]
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
  pub spatial_position_gr: Vector<i64>,

  // x-sizeable
  pub spatial_width_gr: Option<i64>,

  // y-sizeable
  pub spatial_height_gr: Option<i64>,

  // page
  pub inner_spatial_width_gr: Option<i64>,
  pub natural_aspect: Option<f64>,
  pub background_color_index: Option<i64>,
  pub popup_position_gr: Option<Vector<i64>>,
  pub popup_alignment_point: Option<AlignmentPoint>,
  pub popup_width_gr: Option<i64>,

  // note
  pub url: Option<String>,

  // file
  pub original_creation_date: Option<i64>,
  // TODO: not complete

  // table
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
      spatial_position_gr: self.spatial_position_gr.clone(),
      spatial_width_gr: self.spatial_width_gr.clone(),
      spatial_height_gr: self.spatial_height_gr.clone(),
      inner_spatial_width_gr: self.inner_spatial_width_gr.clone(),
      natural_aspect: self.natural_aspect.clone(),
      background_color_index: self.background_color_index.clone(),
      popup_position_gr: self.popup_position_gr.clone(),
      popup_alignment_point: self.popup_alignment_point.clone(),
      popup_width_gr: self.popup_width_gr.clone(),
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
    if old.spatial_position_gr != new.spatial_position_gr { result.insert(String::from("spatialPositionGr"), json::vector_to_object(&new.spatial_position_gr)?); }

    // x-sizable.
    if let Some(new_spatial_width_gr) = new.spatial_width_gr {
      if match old.spatial_width_gr { Some(o) => o != new_spatial_width_gr, None => { true } } {
        result.insert(String::from("spatialWidthGr"), Value::Number(new_spatial_width_gr.into()));
      }
    }

    // y-sizable.
    if let Some(new_spatial_height_gr) = new.spatial_height_gr {
      if match old.spatial_height_gr { Some(o) => o != new_spatial_height_gr, None => { true } } {
        result.insert(String::from("spatialHeightGr"), Value::Number(new_spatial_height_gr.into()));
      }
    }

    // page
    if let Some(new_inner_spatial_width_gr) = new.inner_spatial_width_gr {
      if match old.inner_spatial_width_gr { Some(o) => o != new_inner_spatial_width_gr, None => { true } } {
        if old.item_type != ITEM_TYPE_PAGE { cannot_modify_err("innerSpatialWidthGr", &old.id)?; }
        result.insert(String::from("innerSpatialWidthGr"), Value::Number(new_inner_spatial_width_gr.into()));
      }
    }
    if let Some(new_natural_aspect) = new.natural_aspect {
      if match old.natural_aspect { Some(o) => o != new_natural_aspect, None => { true } } {
        if old.item_type != ITEM_TYPE_PAGE { cannot_modify_err("naturalAspect", &old.id)?; }
        result.insert(String::from("naturalAspect"), Value::Number(Number::from_f64(new_natural_aspect).ok_or(nan_err("naturalAspect", &old.id))?));
      }
    }
    if let Some(new_background_color_index) = new.background_color_index {
      if match old.background_color_index { Some(o) => o != new_background_color_index, None => { true } } {
        if old.item_type != ITEM_TYPE_PAGE { cannot_modify_err("backgroundColorIndex", &old.id)?; }
        result.insert(String::from("backgroundColorIndex"), Value::Number(new_background_color_index.into()));
      }
    }
    if let Some(new_popup_position_gr) = &new.popup_position_gr {
      if match &old.popup_position_gr { Some(o) => o != new_popup_position_gr, None => { true } } {
        if old.item_type != ITEM_TYPE_PAGE { cannot_modify_err("popupPositionGr", &old.id)?; }
        result.insert(String::from("popupPositionGr"), json::vector_to_object(&new_popup_position_gr)?);
      }
    }
    if let Some(new_popup_alignment_point) = &new.popup_alignment_point {
      if match &old.popup_alignment_point { Some(o) => o != new_popup_alignment_point, None => { true } } {
        if old.item_type != ITEM_TYPE_PAGE { cannot_modify_err("popupAlignmentPoint", &old.id)?; }
        result.insert(String::from("popupAlignmentPoint"), Value::String(String::from(new_popup_alignment_point.to_string())));
      }
    }
    if let Some(new_popup_width_gr) = new.popup_width_gr {
      if match old.popup_width_gr { Some(o) => o != new_popup_width_gr, None => { true } } {
        if old.item_type != ITEM_TYPE_PAGE { cannot_modify_err("popupWidthGr", &old.id)?; }
        result.insert(String::from("popupWidthGr"), Value::Number(new_popup_width_gr.into()));
      }
    }

    // note
    if let Some(new_url) = &new.url {
      if match &old.url { Some(o) => o != new_url, None => { true } } {
        if old.item_type != ITEM_TYPE_NOTE { cannot_modify_err("url", &old.id)?; }
        result.insert(String::from("url"), Value::String(new_url.clone()));
      }
    }

    // file
    if let Some(new_original_creation_date) = new.original_creation_date {
      if match old.original_creation_date { Some(o) => o != new_original_creation_date, None => { true } } {
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
    fn not_applicable_err(field_name: &str, item_type: &str) -> InfuResult<()> {
      Err(InfuError::new(&format!("'{}' field is not valid for item type '{}' - cannot update.", field_name, item_type)))
    }

    json::validate_map_fields(map, &ALL_JSON_FIELDS)?; // TODO (LOW): JsonSchema validation.

    if let Ok(v) = json::get_string_field(map, "itemType") { if v.is_some() { cannot_update_err("itemType", &self.id)?; } }
    if let Ok(v) = json::get_string_field(map, "ownerId") { if v.is_some() { cannot_update_err("ownerId", &self.id)?; } }

    if let Ok(v) = json::get_string_field(map, "parentId") {
      if self.parent_id.is_none() && v.is_some() {
        return Err(format!("An attempt was made to apply an update to item '{}' that sets the 'parentId' field, where this was not previously set, but this is not allowed.", self.id).into());
      }
      let map_value_is_null = match map.get("parentId") { Some(v) => v.is_null(), None => false }; // get_string_field doesn't differentiate between null and unset.
      if self.parent_id.is_some() && map_value_is_null {
        return Err(format!("An attempt was made to apply an update to item '{}' that unsets the 'parentId' field where this was previously set, but this is not allowed.", self.id).into());
      }
      if v.is_some() { self.parent_id = v; }
    }
    if let Ok(v) = json::get_string_field(map, "relationshipToParent") { if let Some(u) = v { self.relationship_to_parent = RelationshipToParent::from_string(&u)?; } }
    if let Ok(v) = json::get_integer_field(map, "creationDate") { if v.is_some() { cannot_update_err("creationDate", &self.id)?; } }
    if let Ok(v) = json::get_integer_field(map, "lastModifiedDate") { if let Some(u) = v { self.last_modified_date = u; } }
    if map.contains_key("ordering") {
      self.ordering = map.get("ordering")
        .unwrap()
        .as_array()
        .ok_or(format!("'ordering' field for item '{}' is not an array.", self.id))?
        .iter().map(|v| match v.as_i64() {
          Some(v) => if v >= 0 && v <= 255 { Some(v as u8) } else { None },
          None => None })
        .collect::<Option<Vec<_>>>().ok_or(format!("One or more element of the 'ordering' field in an update for item '{}' was invalid.", &self.id))?;
    }
    if let Ok(v) = json::get_string_field(map, "title") { if let Some(u) = v { self.title = u; } }
    if let Ok(v) = json::get_vector_field(map, "spatialPositionGr") { if let Some(u) = v { self.spatial_position_gr = u; } }

    // x-sizable
    if let Ok(v) = json::get_integer_field(map, "spatialWidthGr") {
      if let Some(u) = v { self.spatial_width_gr = Some(u); }
    }

    // y-sizable
    if let Ok(v) = json::get_integer_field(map, "spatialHeightGr") {
      if let Some(u) = v { self.spatial_height_gr = Some(u); }
    }

    // page
    if let Ok(v) = json::get_integer_field(map, "innerSpatialWidthGr") {
      if let Some(u) = v {
        if self.item_type != ITEM_TYPE_PAGE { not_applicable_err("innerSpatialWidthGr", ITEM_TYPE_PAGE)?; }
        self.inner_spatial_width_gr = Some(u);
      }
    }
    if let Ok(v) = json::get_float_field(map, "naturalAspect") {
      if let Some(u) = v {
        if self.item_type != ITEM_TYPE_PAGE { not_applicable_err("naturalAspect", ITEM_TYPE_PAGE)?; }
        self.natural_aspect = Some(u);
      }
    }
    if let Ok(v) = json::get_integer_field(map, "backgroundColorIndex") {
      if let Some(u) = v {
        if self.item_type != ITEM_TYPE_PAGE { not_applicable_err("backgroundColorIndex", ITEM_TYPE_PAGE)?; }
        self.background_color_index = Some(u);
      }
    }
    if let Ok(v) = json::get_vector_field(map, "popupPositionGr") {
      if let Some(u) = v {
        if self.item_type != ITEM_TYPE_PAGE { not_applicable_err("popupPositionGr", ITEM_TYPE_PAGE)?; }
        self.popup_position_gr = Some(u);
      }
    }
    if let Ok(v) = json::get_string_field(map, "popupAlignmentPoint") {
      if let Some(u) = v {
        if self.item_type != ITEM_TYPE_PAGE { not_applicable_err("popupAlignmentPoint", ITEM_TYPE_PAGE)?; }
        self.popup_alignment_point = Some(AlignmentPoint::from_string(&u)?);
      }
    }
    if let Ok(v) = json::get_integer_field(map, "popupWidthGr") {
      if let Some(u) = v {
        if self.item_type != ITEM_TYPE_PAGE { not_applicable_err("popupWidthGr", ITEM_TYPE_PAGE)?; }
        self.popup_width_gr = Some(u);
      }
    }

    // note
    if let Ok(v) = json::get_string_field(map, "url") {
      if let Some(u) = v {
        if self.item_type == ITEM_TYPE_PAGE { self.url = Some(u); }
        else { not_applicable_err("url", ITEM_TYPE_PAGE)?; }
      }
    }

    // file
    if let Ok(v) = json::get_integer_field(map, "originalCreationDate") {
      if v.is_some() { cannot_update_err("originalCreationDate", &self.id)?; }
    }
    // TODO (MEDIUM): not complete.

    Ok(())
  }
}


fn to_json(item: &Item) -> InfuResult<serde_json::Map<String, serde_json::Value>> {
  fn nan_err(field_name: &str, item_id: &str) -> String {
    format!("Could not serialize the '{}' field of item '{}' because it is not a number.", field_name, item_id)
  }
  fn unexpected_field_err(field_name: &str, item_id: &str, item_type: &str) -> InfuResult<()> {
    Err(InfuError::new(&format!("'{}' field cannot be set for item '{}' of type {}.", field_name, item_id, item_type)))
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
  result.insert(String::from("spatialPositionGr"), json::vector_to_object(&item.spatial_position_gr)?);

  // x-sizeable
  if let Some(spatial_width_gr) = item.spatial_width_gr {
    result.insert(
      String::from("spatialWidthGr"),
      Value::Number(spatial_width_gr.into()));
  }

  // y-sizeable
  if let Some(spatial_height_gr) = item.spatial_height_gr {
    result.insert(
      String::from("spatialHeightGr"),
      Value::Number(spatial_height_gr.into()));
  }

  // page
  if let Some(inner_spatial_width_gr) = item.inner_spatial_width_gr {
    if item.item_type != ITEM_TYPE_PAGE { unexpected_field_err("innerSpatialWidthGr", &item.id, &item.item_type)? }
    result.insert(
      String::from("innerSpatialWidthGr"),
      Value::Number(inner_spatial_width_gr.into()));
  }
  if let Some(natural_aspect) = item.natural_aspect {
    if item.item_type != ITEM_TYPE_PAGE { unexpected_field_err("naturalAspect", &item.id, &item.item_type)? }
    result.insert(
      String::from("naturalAspect"),
      Value::Number(Number::from_f64(natural_aspect).ok_or(nan_err("naturalAspect", &item.id))?));
  }
  if let Some(background_color_index) = item.background_color_index {
    if item.item_type != ITEM_TYPE_PAGE { unexpected_field_err("backgroundColorIndex", &item.id, &item.item_type)? }
    result.insert(String::from("backgroundColorIndex"), Value::Number(background_color_index.into()));
  }
  if let Some(popup_position_gr) = &item.popup_position_gr {
    if item.item_type != ITEM_TYPE_PAGE { unexpected_field_err("popupPositionGr", &item.id, &item.item_type)? }
    result.insert(String::from("popupPositionGr"), json::vector_to_object(&popup_position_gr)?);
  }
  if let Some(popup_alignment_point) = &item.popup_alignment_point {
    if item.item_type != ITEM_TYPE_PAGE { unexpected_field_err("positionAlignmentPoint", &item.id, &item.item_type)? }
    result.insert(String::from("popupAlignmentPoint"), Value::String(String::from(popup_alignment_point.to_string())));
  }
  if let Some(popup_width_gr) = item.popup_width_gr {
    if item.item_type != ITEM_TYPE_PAGE { unexpected_field_err("popupWidthGr", &item.id, &item.item_type)? }
    result.insert(
      String::from("popupWidthGr"),
      Value::Number(popup_width_gr.into()));
  }

  // note
  if let Some(url) = &item.url {
    if item.item_type != ITEM_TYPE_NOTE { unexpected_field_err("url", &item.id, &item.item_type)? }
    result.insert(String::from("url"), Value::String(url.clone()));
  }

  // file
  if let Some(original_creation_date) = item.original_creation_date {
    if item.item_type != ITEM_TYPE_FILE { unexpected_field_err("originalCreationDate", &item.id, &item.item_type)? }
    result.insert(String::from("originalCreationDate"), Value::Number(original_creation_date.into()));
  }
  // TODO (MEDIUM): not complete.

  Ok(result)
}


fn from_json(map: &serde_json::Map<String, serde_json::Value>) -> InfuResult<Item> {
  fn not_applicable_err(field_name: &str, item_type: &str) -> InfuError {
    InfuError::new(&format!("'{}' field is not valid for item type '{}'.", field_name, item_type))
  }
  fn expected_for_err(field_name: &str, item_type: &str) -> InfuError {
    InfuError::new(&format!("'{}' field is expected for item type '{}'.", field_name, item_type))
  }

  json::validate_map_fields(map, &ALL_JSON_FIELDS)?; // TODO (LOW): JsonSchema validation.

  let id = json::get_string_field(map, "id")?.ok_or("'id' field was missing.")?;
  let item_type = json::get_string_field(map, "itemType")?.ok_or("'itemType' field was missing.")?;

  Ok(Item {
    item_type: item_type.clone(),
    id: id.clone(),
    owner_id: json::get_string_field(map, "ownerId")?.ok_or("'owner_id' field was missing.")?,
    parent_id: match map.get("parentId").ok_or(InfuError::new("'parentId' field was missing, and must always be set, even if null."))? {
      Value::Null => None,
      Value::String(s) => Some(s.clone()),
      _ => return Err(InfuError::new("'parentId' field was not of type 'string'."))
    },
    relationship_to_parent: RelationshipToParent::from_string(
      &json::get_string_field(map, "relationshipToParent")?.ok_or("'relationshipToParent' field is missing.")?)?,
    creation_date: json::get_integer_field(map, "creationDate")?.ok_or("'creationDate' field was missing.")?,
    last_modified_date: json::get_integer_field(map, "lastModifiedDate")?.ok_or("'lastModifiedDate' field was missing.")?,
    ordering: map.get("ordering")
      .ok_or(format!("'ordering' field for item '{}' was missing.", &id))?
      .as_array()
      .ok_or(format!("'ordering' field for item '{}' was not of type 'array'.", &id))?
      .iter().map(|v| match v.as_i64() {
        Some(v) => if v >= 0 && v <= 255 { Some(v as u8) } else { None },
        None => None
      })
      .collect::<Option<Vec<_>>>().ok_or(format!("One or more element of the 'ordering' field for item '{}' was invalid.", &id))?,
    title: json::get_string_field(map, "title")?.ok_or("'title' field was missing.")?,
    spatial_position_gr: json::get_vector_field(map, "spatialPositionGr")?.ok_or("'spatialPositionGr' field was missing.")?,

    // x-sizeable
    spatial_width_gr: match json::get_integer_field(map, "spatialWidthGr")? {
      Some(v) => { Ok(Some(v)) },
      None => { Err(InfuError::new("'spatialWidthGr' field is expected for all current item types.")) }
    }?,

    // y-sizeable
    spatial_height_gr: match json::get_integer_field(map, "spatialHeightGr")? {
      Some(v) => { if item_type == ITEM_TYPE_TABLE { Ok(Some(v)) } else { Err(not_applicable_err("spatialHeightGr", &item_type)) } },
      None => { if item_type == ITEM_TYPE_TABLE { Err(expected_for_err("spatialHeightGr", &item_type)) } else { Ok(None) } }
    }?,

    // page
    inner_spatial_width_gr: match json::get_integer_field(map, "innerSpatialWidthGr")? {
      Some(v) => { if item_type == ITEM_TYPE_PAGE { Ok(Some(v)) } else { Err(not_applicable_err("innerSpatialWidthGr", &item_type)) } },
      None => { if item_type == ITEM_TYPE_PAGE { Err(expected_for_err("innerSpatialWidthGr", &item_type)) } else { Ok(None) } }
    }?,
    natural_aspect: match json::get_float_field(map, "naturalAspect")? {
      Some(v) => { if item_type == ITEM_TYPE_PAGE { Ok(Some(v)) } else { Err(not_applicable_err("naturalAspect", &item_type)) } },
      None => { if item_type == ITEM_TYPE_PAGE { Err(expected_for_err("naturalAspect", &item_type)) } else { Ok(None) } }
    }?,
    background_color_index: match json::get_integer_field(map, "backgroundColorIndex")? {
      Some(v) => { if item_type == ITEM_TYPE_PAGE { Ok(Some(v)) } else { Err(not_applicable_err("backgroundColorIndex", &item_type)) } },
      None => { if item_type == ITEM_TYPE_PAGE { Err(expected_for_err("backgroundColorIndex", &item_type)) } else { Ok(None) } }
    }?,
    popup_position_gr: match json::get_vector_field(map, "popupPositionGr")? {
      Some(v) => { if item_type == ITEM_TYPE_PAGE { Ok(Some(v)) } else { Err(not_applicable_err("popupPositionGr", &item_type)) } },
      None => {
        if item_type == ITEM_TYPE_PAGE {
          // TODO (LOW): remove.
          warn!("popupPositionGr was not specified for item '{}', using default (0,0).", id);
          Ok(Some(Vector { x: 0, y: 0 }))
        } else {
          Ok(None)
        }
      }
    }?,
    popup_alignment_point: match &json::get_string_field(map, "popupAlignmentPoint")? {
      Some(v) => {
          if item_type == ITEM_TYPE_PAGE { Ok(Some(AlignmentPoint::from_string(v)?)) }
          else { Err(not_applicable_err("popupAlignmentPoint", &item_type)) } },
      None => {
        if item_type == ITEM_TYPE_PAGE {
          // TODO (LOW): remove.
          warn!("popupAlignmentPoint was not specified for item '{}', using default (TopLeft).", id);
          Ok(Some(AlignmentPoint::TopLeft))
        } else {
          Ok(None)
        }
      }
    }?,
    popup_width_gr: match json::get_integer_field(map, "popupWidthGr")? {
      Some(v) => { if item_type == ITEM_TYPE_PAGE { Ok(Some(v)) } else { Err(not_applicable_err("popupWidthGr", &item_type)) } },
      None => {
        if item_type == ITEM_TYPE_PAGE {
          // TODO (LOW): remove.
          warn!("popupWidthGr was not specified for item '{}', using default (10.0).", id);
          Ok(Some(10))
        } else {
          Ok(None)
        }
      }
    }?,

    // note
    url: match json::get_string_field(map, "url")? {
      Some(v) => { if item_type == ITEM_TYPE_NOTE { Ok(Some(v)) } else { Err(not_applicable_err("url", &item_type)) } },
      None => { if item_type == ITEM_TYPE_NOTE { Err(expected_for_err("url", &item_type)) } else { Ok(None) } }
    }?,

    // file
    original_creation_date: match json::get_integer_field(map, "originalCreationDate")? {
      Some(v) => { if item_type == ITEM_TYPE_FILE { Ok(Some(v)) } else { Err(not_applicable_err("originalCreationDate", &item_type)) } },
      None => { if item_type == ITEM_TYPE_FILE { Err(expected_for_err("originalCreationDate", &item_type)) } else { Ok(None) } }
    }?,
    // TODO (MEDIUM): not complete.

  })
}
