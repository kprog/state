class Sophisticate extends Person
  constructor: (@name) ->

  state @::, 'abstract'
    Formal: state 'default initial'
      Cordial:
        greet: state.method (person) ->
          greeting = superstate.call 'greet'
          if name = person?.name then "Hello #{name}. #{greeting}"
          else greeting
    Casual:
      greet: state.method (person) ->
        name = person?.name
        return "How’s it hanging?" if name is 'Lane'
        return "Hi #{name}." if name
        protostate.call 'greet'


[ sterling, cooper, draper, pryce ] =
  new Sophisticate n for n in ['Roger', 'Bert', 'Don', 'Lane']

draper.state()              # >>> State 'Formal'
draper.greet new Person     # >>> "How do you do?"

draper.state '-> Cordial'
draper.greet new Person     # >>> "How do you do?"
draper.greet cooper         # >>> "Hello Bert. How do you do?"
draper.greet sterling       # >>> "Hello Roger. How do you do?"

draper.state '-> Casual'
draper.greet new Person     # >>> "Hi!"
draper.greet sterling       # >>> "Hi Roger."
draper.greet pryce          # >>> "How’s it hanging?"