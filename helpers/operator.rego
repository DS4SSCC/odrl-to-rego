package odrl.helpers.operator

eval(left, op, right) if {
  op == "eq"
  left == right
}

eval(left, op, right) if {
  op == "neq"
  left != right
}

eval(left, op, right) if {
  op == "gt"
  left > right
}

eval(left, op, right) if {
  op == "gte"
  left >= right
}

eval(left, op, right) if {
  op == "lt"
  left < right
}

eval(left, op, right) if {
  op == "lte"
  left <= right
}

eval(left, op, right) if {
  op == "in"
  some i
  right[i] == left
}

eval(left, op, right) if {
  op == "contains"
  contains(left, right)
}
