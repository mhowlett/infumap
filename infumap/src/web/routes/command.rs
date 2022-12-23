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
use crate::store::Store;
use crate::util::infu::InfuResult;


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
pub fn command(store: &State<Mutex<Store>>, request: Json<SendRequest>) -> Json<SendResponse> {
  let mut store = store.lock().unwrap();

  // validate session
  let session = match
      match store.session.get_session(&request.session_id) {
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
  if !store.item.user_items_loaded(&session.user_id) {
    match store.item.load_user_items(&session.user_id, false) {
      Ok(_) => {},
      Err(_e) => {
        error!("An error occurred loading item state for user '{}'.", session.user_id);
        return Json(SendResponse { success: false, json_data: None });
      }
    }
  }

  // handle
  let response_data_maybe = match request.command.as_str() {
    "get-children" => handle_get_children(&mut store, &request.json_data),
    "get-attachments" => handle_get_attachments(&mut store, &request.json_data),
    "add-item" => handle_add_item(&mut store, &request.json_data),
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

  let r = SendResponse { success: true, json_data: Some(response_data) };
  Json(r)
}


#[derive(Deserialize)]
pub struct GetChildrenRequest {
  #[serde(rename="containerId")]
  container_id: String,
}

fn handle_get_children(store: &mut MutexGuard<Store>, json: &str) -> InfuResult<String> {
  let request: GetChildrenRequest = serde_json::from_str(json)?;
  let children = store.item.get_children(&request.container_id)?;
  Ok(serde_json::to_string(&children)?)
}


#[derive(Deserialize)]
pub struct GetAttachmentsRequest {
  #[serde(rename="parentId")]
  parent_id: String,
}

fn handle_get_attachments(store: &mut MutexGuard<Store>, json: &str) -> InfuResult<String> {
  let request: GetAttachmentsRequest = serde_json::from_str(json)?;
  let attachments = store.item.get_attachments(&request.parent_id)?;
  Ok(serde_json::to_string(&attachments)?)
}


#[derive(Deserialize)]
pub struct AddItemRequest {
}

fn handle_add_item(_store: &mut MutexGuard<Store>, _json: &str) -> InfuResult<String> {
  Ok(serde_json::to_string("")?)
}
