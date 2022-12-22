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

use rocket::State;
use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};
use crate::store::{Store, user::User};
use crate::util::base62;
use uuid::{uuid, Uuid};
use std::sync::Mutex;
use std::time::SystemTime;
use totp_rs::{Algorithm, TOTP};


#[derive(Deserialize)]
pub struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
  success: bool,
  session_id: Option<String>,
  user_id: Option<String>,
  root_page_id: Option<String>,
}

#[post("/account/login", data = "<request>")]
pub fn login(store: &State<Mutex<Store>>, request: Json<LoginRequest>) -> Json<LoginResponse> {
  let mut store = store.lock().unwrap();

  let user = match store.user_store.get_by_username(&request.username) {
    Some(user) => user,
    None => {
      info!("Login was attempted for a user that does not exist '{}'.", request.username);
      return Json(LoginResponse { success: false, session_id: None, user_id: None, root_page_id: None })
    }
  }.clone();

  let test_hash = User::compute_password_hash(&user.password_salt, &request.password);
  if test_hash != user.password_hash {
    info!("A login attempt for user '{}' failed due to incorrect password.", request.username);
    return Json(LoginResponse { success: false, session_id: None, user_id: None, root_page_id: None });
  }

  match store.session_store.create_session(&user.id) {
    Ok(session) => {
      let result = LoginResponse {
        success: true,
        session_id: Some(session.id),
        user_id: Some(user.id),
        root_page_id: Some(user.root_page_id.clone())
      };
      Json(result)
    },
    Err(e) => {
      error!("Failed to create session for user '{}': {}.", request.username, e);
      Json(LoginResponse { success: false, session_id: None, user_id: None, root_page_id: None })
    }
  }
}


#[derive(Deserialize)]
pub struct LogoutRequest {
    _user_id: String,
    _session_id: Option<String>,
}

#[derive(Serialize)]
pub struct LogoutResponse {
  success: bool,
}

#[post("/account/logout", data = "<_payload>")]
pub fn logout(_store: &State<Mutex<Store>>, _payload: Json<LogoutRequest>) -> Json<LogoutResponse> {
  let result = LogoutResponse { success: false };

  Json(result)
}


#[get("/gen")]
fn _gen() -> String {
  // TODO (HIGH): remove. playing with OTP / base62 uuids.

  const ID: Uuid = uuid!("3d14c109-9934-4717-aef0-be64a95a8550");
  // let key_uuid = uuid::Uuid::new_v4();
  let b = ID.as_bytes().clone();
  let a = base62::encode(&b);
  println!("{}", a);

  // The secret should be randomly generated of N bits length (look it up)
  let totp = TOTP::new(
    Algorithm::SHA1,
    6,
    1,
    30,
    "hello123123123123123123123123123".as_bytes(),
    Some("infumap".to_string()),
    "math".to_string()
  ).unwrap();
  let time = SystemTime::now()
    .duration_since(SystemTime::UNIX_EPOCH).unwrap()
    .as_secs();
  println!("{}", totp.get_url());
  let token = totp.generate(time);
  println!("{}", token);
  "hello".to_string()
}
