package odrl.helpers.action

# Match ODRL action (string) to input.action
match(input_action, odrl_action) if {
  lower(input_action) == lower(odrl_action)
}
