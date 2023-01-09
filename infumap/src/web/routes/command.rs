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

use std::sync::{Mutex, MutexGuard};
use log::{error, warn};
use rocket::{State, serde::json::Json};
use serde::{Deserialize, Serialize};
use crate::storage::db::Db;
use crate::storage::db::item::Item;
use crate::util::infu::InfuResult;
use super::WebApiJsonSerializable;



#[derive(Deserialize)]
pub struct SendRequest {
  #[serde(rename="userId")]
  user_id: String,
  #[serde(rename="sessionId")]
  session_id: String,
  command: String,
  #[serde(rename="jsonData")]
  json_data: String,
}

#[derive(Serialize)]
pub struct SendResponse {
  success: bool,
  #[serde(rename="jsonData")]
  json_data: Option<String>,
}

#[post("/command", data = "<request>")]
pub fn command(db: &State<Mutex<Db>>, request: Json<SendRequest>) -> Json<SendResponse> {
  let mut db = db.lock().unwrap();

  // validate session
  let session = match
      match db.session.get_session(&request.session_id) {
        Ok(s) => s,
        Err(e) => {
          error!("An error occurred retrieving session '{}' for user '{}': {}.", request.session_id, request.user_id, e);
          return Json(SendResponse { success: false, json_data: None });
        }
      } {
    Some(s) => s,
    None => {
      info!("Session '{}' for user '{}' is not availble. It may have expired.", request.session_id, request.user_id);
      return Json(SendResponse { success: false, json_data: None });
    }
  };
  if session.user_id != request.user_id {
    warn!("Session '{}' if for user '{}' not user '{}'.", request.session_id, session.user_id, request.user_id);
    return Json(SendResponse { success: false, json_data: None });
  }

  // load user items if required
  if !db.item.user_items_loaded(&session.user_id) {
    match db.item.load_user_items(&session.user_id, false) {
      Ok(_) => {},
      Err(e) => {
        error!("An error occurred loading item state for user '{}': {}", session.user_id, e);
        return Json(SendResponse { success: false, json_data: None });
      }
    }
  }

  // handle
  let response_data_maybe = match request.command.as_str() {
    "get-children" => handle_get_children(&mut db, &request.json_data),
    "get-attachments" => handle_get_attachments(&mut db, &request.json_data),
    "add-item" => handle_add_item(&mut db, &request.json_data),
    "update-item" => handle_update_item(&mut db, &request.json_data),
    _ => {
      warn!("Unknown command '{}' issued by user '{}', session '{}'", request.command, request.user_id, request.session_id);
      return Json(SendResponse { success: false, json_data: None });
    }
  };

  let response_data = match response_data_maybe {
    Ok(r) => r,
    Err(e) => {
      error!("An error occurred servicing a '{}' command for user '{}': {}.", request.command, request.user_id, e);
      return Json(SendResponse { success: false, json_data: None });
    }
  };

  let r = SendResponse { success: true, json_data: response_data };
  Json(r)
}


#[derive(Deserialize)]
pub struct GetChildrenRequest {
  #[serde(rename="parentId")]
  parent_id: String,
}

fn handle_get_children(db: &mut MutexGuard<Db>, json_data: &str) -> InfuResult<Option<String>> {
  let request: GetChildrenRequest = serde_json::from_str(json_data)?;
  let children = db.item
    .get_children(&request.parent_id)?.iter()
    .map(|v| v.to_api_json().ok())
    .collect::<Option<Vec<serde_json::Map<String, serde_json::Value>>>>();
  Ok(Some(serde_json::to_string(&children)?))
}


#[derive(Deserialize)]
pub struct GetAttachmentsRequest {
  #[serde(rename="parentId")]
  parent_id: String,
}

fn handle_get_attachments(db: &mut MutexGuard<Db>, json_data: &str) -> InfuResult<Option<String>> {
  let request: GetAttachmentsRequest = serde_json::from_str(json_data)?;
  let attachments = db.item
    .get_attachments(&request.parent_id)?.iter()
    .map(|v| v.to_api_json().ok())
    .collect::<Option<Vec<serde_json::Map<String, serde_json::Value>>>>();
  Ok(Some(serde_json::to_string(&attachments)?))
}


fn handle_add_item(db: &mut MutexGuard<Db>, json_data: &str) -> InfuResult<Option<String>> {
  let deserializer = serde_json::Deserializer::from_str(json_data);
  let mut iterator = deserializer.into_iter::<serde_json::Value>();
  let item_map_maybe = iterator.next().ok_or("Add item request has no item")??;
  let item_map = item_map_maybe.as_object().ok_or("Add item request body is not a JSON object")?;
  let item: Item = Item::from_api_json(item_map)?;
  db.item.add(item)?;
  Ok(None)
}


fn handle_update_item(db: &mut MutexGuard<Db>, json_data: &str) -> InfuResult<Option<String>> {
  let deserializer = serde_json::Deserializer::from_str(json_data);
  let mut iterator = deserializer.into_iter::<serde_json::Value>();
  let item_map_maybe = iterator.next().ok_or("Update item request has no item")??;
  let item_map = item_map_maybe.as_object().ok_or("Update item request body is not a JSON object")?;
  let item: Item = Item::from_api_json(item_map)?;
  db.item.update(&item)?;
  Ok(None)
}
