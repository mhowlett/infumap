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

mod blob;
mod db;
mod util;
mod web;
mod cli;
mod config;

#[macro_use] extern crate rocket;
use clap::App;


#[rocket::main]
async fn main() {
  // TODO (MEDIUM): Initialize logging like this when not using rocket.
  // pretty_env_logger::init();

  let arg_matches = App::new("Infumap")
    .version("0.1.0")
    .subcommand(web::make_clap_subcommand())
    .subcommand(cli::add_user::make_clap_subcommand())
    .get_matches();

  // test();

  match arg_matches.subcommand() {
    Some(("web", arg_sub_matches)) => {
      web::execute(arg_sub_matches).await
    },
    Some(("add-user", arg_sub_matches)) => {
      cli::add_user::execute(arg_sub_matches)
    },
    _ => {
      println!(".. --help for help.");
    },
  }
}
