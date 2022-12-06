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

mod web;
mod util;

#[macro_use] extern crate rocket;
use clap::App;


#[rocket::main]
async fn main() {
    // TODO (HIGH): stops rocket logging working.. why?
    // pretty_env_logger::init();

    let mut config = config::Config::default();
    config
        .merge(config::File::with_name("Settings")).unwrap()
        .merge(config::Environment::with_prefix("INFUMAP")).unwrap();

    let matches = App::new("Infumap")
        .version("0.1.0")
        .subcommand(web::make_clap_subcommand())
        .get_matches();

    match matches.subcommand() {
        ("web", sub_matches) => web::handle_matches(&config, sub_matches).await,
        _ => {
            println!(".. --help for help.");
        },
    }
}
