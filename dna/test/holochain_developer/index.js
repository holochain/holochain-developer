module.exports = (scenario, conductorConfig) => {
  scenario("create_happ", async (s, t) => {
    const {alice, bob} = await s.players({alice: conductorConfig, bob: conductorConfig}, true)
    // Make a call to a Zome function
    // indicating the function, and passing it an input
    const create_happ_result = await alice.call("holochain_developer", "holochain_developer", "create_happ", {"happ_input" : {"title":"Title first happ", "content":"Content first happ"}})
    // Wait for all network activity to settle
    await s.consistency()
    const get_happ_result = await bob.call("holochain_developer", "holochain_developer", "get_happ", {"id": create_happ_result.Ok.id})
    t.deepEqual(create_happ_result, get_happ_result)
    t.deepEqual(get_happ_result.Ok.title, 'Title first happ')
    t.deepEqual(get_happ_result.Ok.content, 'Content first happ')
  })

  scenario("update_happ", async (s, t) => {
    const {alice, bob} = await s.players({alice: conductorConfig, bob: conductorConfig}, true)
    const create_happ_result = await alice.call("holochain_developer", "holochain_developer", "create_happ", {"happ_input" : {"title":"Title first happ", "content":"Content first happ"}})
    const update_happ_result = await alice.call("holochain_developer", "holochain_developer", "update_happ", {"id": create_happ_result.Ok.id, "happ_input" : {"title":"Updated title first happ", "content":"Updated content first happ"}})
    await s.consistency()
    const get_happ_result = await alice.call("holochain_developer", "holochain_developer", "get_happ", {"id": create_happ_result.Ok.id})
    t.deepEqual(update_happ_result, get_happ_result)
    t.deepEqual(get_happ_result.Ok.id, create_happ_result.Ok.id)
    t.deepEqual(get_happ_result.Ok.title, 'Updated title first happ')
    t.deepEqual(get_happ_result.Ok.content, 'Updated content first happ')

    const update_happ_result_2 = await alice.call("holochain_developer", "holochain_developer", "update_happ", {"id": create_happ_result.Ok.id, "happ_input" : {"title":"Updated again title first happ", "content":"Updated again content first happ"}})
    await s.consistency()
    const get_happ_result_2 = await bob.call("holochain_developer", "holochain_developer", "get_happ", {"id": create_happ_result.Ok.id})
    t.deepEqual(update_happ_result_2, get_happ_result_2)
    t.deepEqual(get_happ_result_2.Ok.id, create_happ_result.Ok.id)
    t.deepEqual(get_happ_result_2.Ok.title, 'Updated again title first happ')
    t.deepEqual(get_happ_result_2.Ok.content, 'Updated again content first happ')
  })

  scenario("validate_entry_modify", async (s, t) => {
    const {alice, bob} = await s.players({alice: conductorConfig, bob: conductorConfig}, true)
    const create_happ_result = await alice.call("holochain_developer", "holochain_developer", "create_happ", {"happ_input" : {"title":"Title first happ", "content":"Content first happ"}})
    await s.consistency()
    const updated_happ_result = await bob.call("holochain_developer", "holochain_developer", "update_happ", {"id": create_happ_result.Ok.id, "happ_input" : {"title":"Updated title first happ", "content":"Updated content first happ"}})
    await s.consistency()
    let err = JSON.parse(updated_happ_result.Err.Internal)
    t.deepEqual(err.kind, {"ValidationFailed":"Agent who did not author is trying to update"})
  })

  scenario("remove_happ", async (s, t) => {
    const {alice, bob} = await s.players({alice: conductorConfig, bob: conductorConfig}, true)
    const create_happ_result = await alice.call("holochain_developer", "holochain_developer", "create_happ", {"happ_input" : {"title":"Title first happ", "content":"Content first happ"}})
    await s.consistency()
    const list_happs_result = await bob.call("holochain_developer", "holochain_developer", "list_happs", {})
    t.deepEqual(list_happs_result.Ok.length, 1)
    const remove_happ_result = await alice.call("holochain_developer", "holochain_developer", "remove_happ", { "id": create_happ_result.Ok.id })
    const list_happs_result_2 = await bob.call("holochain_developer", "holochain_developer", "list_happs", {})
    t.deepEqual(list_happs_result_2.Ok.length, 0)
  })

  scenario("validate_entry_delete", async (s, t) => {
    const {alice, bob} = await s.players({alice: conductorConfig, bob: conductorConfig}, true)
    const create_happ_result = await alice.call("holochain_developer", "holochain_developer", "create_happ", {"happ_input" : {"title":"Title first happ", "content":"Content first happ"}})
    await s.consistency()
    const deleted_result = await bob.call("holochain_developer", "holochain_developer", "remove_happ", { "id": create_happ_result.Ok.id })
    let err = JSON.parse(deleted_result.Err.Internal)
    t.deepEqual(err.kind, {"ValidationFailed":"Agent who did not author is trying to delete"})
  })

  scenario("list_happs", async (s, t) => {
    const {alice, bob} = await s.players({alice: conductorConfig, bob: conductorConfig}, true)
    await alice.call("holochain_developer", "holochain_developer", "create_happ", {"happ_input" : {"title":"Title first happ", "content":"Content first happ"}})
    await alice.call("holochain_developer", "holochain_developer", "create_happ", {"happ_input" : {"title":"Title second happ", "content":"Content second happ"}})
    await alice.call("holochain_developer", "holochain_developer", "create_happ", {"happ_input" : {"title":"Title third happ", "content":"Content third happ"}})
    await alice.call("holochain_developer", "holochain_developer", "create_happ", {"happ_input" : {"title":"Title fourth happ", "content":"Content fourth happ"}})
    await s.consistency()
    const result = await alice.call("holochain_developer", "holochain_developer", "list_happs", {})
    t.deepEqual(result.Ok.length, 4)
  })
}
