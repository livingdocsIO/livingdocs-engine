# History
# -------
# Represents the performed actions in a document
class History

  history: []

  constructor: () ->
    #todo


  # add an action to the history
  add: () ->
    #todo


  # track the saved state
  saved: () ->
    #todo


  # The history is dirty if there are unsaved actions in the history
  isDirty: () ->
    return false if history.length == 0


