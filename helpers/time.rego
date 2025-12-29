package odrl.helpers.time

before_now(rfc3339) if {
  time.parse_rfc3339_ns(rfc3339) < time.now_ns()
}

after_now(rfc3339) if {
  time.parse_rfc3339_ns(rfc3339) > time.now_ns()
}
