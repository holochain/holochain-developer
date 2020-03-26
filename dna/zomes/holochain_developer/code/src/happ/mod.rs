use serde_derive::{Deserialize, Serialize};
use holochain_json_derive::DefaultJson; 
use hdk::{
    self,
    entry,
    from,
    link,
    entry_definition::ValidatingEntryType,
    holochain_core_types::{
        dna::entry_types::Sharing,
        time::Timeout,
        time::Iso8601,
    },
    holochain_json_api::{
        json::JsonString,
        error::JsonError,
    },
    prelude::*,
    holochain_persistence_api::cas::content::Address
};

pub mod handlers;
pub mod validation;

const HAPP_ENTRY_NAME: &str = "happ";
const HAPP_LINK_TYPE: &str = "happ_link";
const HAPPS_ANCHOR_TYPE: &str = "happs";
const HAPPS_ANCHOR_TEXT: &str = "happs";

#[derive(Serialize, Deserialize, Debug, DefaultJson,Clone)]
#[serde(rename_all = "camelCase")]
pub struct HappEntry {
    title: String,
    content: String,
}

#[derive(Serialize, Deserialize, Debug, DefaultJson,Clone)]
#[serde(rename_all = "camelCase")]
pub struct Happ {
    id: Address,
    created_at: Iso8601,
    title: String,
    content: String,
}

fn timestamp(address: Address) -> ZomeApiResult<Iso8601> {
    let options = GetEntryOptions{status_request: StatusRequestKind::Initial, entry: false, headers: true, timeout: Timeout::new(10000)};
    let entry_result = hdk::get_entry_result(&address, options)?;
    match entry_result.result {
        GetEntryResultType::Single(entry) => {
            Ok(entry.headers[0].timestamp().clone())
        },
        _ => {
            unreachable!()
        }
    }
}

impl Happ {
    pub fn new(id: Address, happ_entry: HappEntry) -> ZomeApiResult<Happ> {
        Ok(Happ{
            id: id.clone(),
            created_at: timestamp(id)?,
            title: happ_entry.title,
            content: happ_entry.content,
        })
    }
}

pub fn definition() -> ValidatingEntryType {
    entry!(
        name: HAPP_ENTRY_NAME,
        description: "this is a same entry defintion",
        sharing: Sharing::Public,
        validation_package: || {
            hdk::ValidationPackageDefinition::Entry
        },
        validation: | validation_data: hdk::EntryValidationData<HappEntry>| {
            match validation_data
            {
                hdk::EntryValidationData::Create{entry, validation_data} =>
                {
                    validation::validate_entry_create(entry, validation_data)
                },
                hdk::EntryValidationData::Modify{new_entry, old_entry, old_entry_header, validation_data} =>
                {
                    validation::validate_entry_modify(new_entry, old_entry, old_entry_header, validation_data)
                },
                hdk::EntryValidationData::Delete{old_entry, old_entry_header, validation_data} =>
                {
                   validation::validate_entry_delete(old_entry, old_entry_header, validation_data)
                }
            }
        },
        links: [
            from!(
                holochain_anchors::ANCHOR_TYPE,
                link_type: HAPP_LINK_TYPE,
                validation_package: || {
                    hdk::ValidationPackageDefinition::Entry
                },
                validation: |validation_data: hdk::LinkValidationData| {
                    match validation_data
                    {
                        hdk::LinkValidationData::LinkAdd{link, validation_data} =>
                        {
                            validation::validate_link_add(link, validation_data)
                        },
                        hdk::LinkValidationData::LinkRemove{link, validation_data} =>
                        {
                            validation::validate_link_remove(link, validation_data)
                        }
                    }
                }
            )
        ]
    )
}
