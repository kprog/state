( function( $, undefined ) {

module( "State.object" );

function TestObject( initialState ) {
	$.extend( this, {
		methodOne: function() {
			return 'methodOne';
		},
		methodTwo: function() {
			return 'methodTwo';
		}
	});
	
	// State definitions
	State.object( this,
		
		// Three progressively more complex ways to define a state:
		{
			// 1. Simple: methods only
			Preparing: {
				methodOne: function() {
					return 'Preparing.methodOne';
				}
			},
			
			// 2. Compound (inside array literal): methods plus events
			Ready: [
				// [0]: methods
				{
					methodTwo: function() {
						return 'Ready.methodTwo';
					}
				},
				// [1]: events
				{
					// event with one listener declared
					enter: function(event) {
						event.log();
					},
					
					// event with multiple listeners declared
					leave: [
						function(event) {
							event.log('1');
						},
						function(event) {
							event.log('2');
						}
					]
				}
			],
			
			// 3. Complex (StateDefinition): named sections
			Finished: State({
				methods: {
					methodOne: function() {
						return 'Finished.methodOne';
					},
					methodTwo: function() {
						return 'Finished.methodTwo';
					}
				},
				events: {
					enter: function(event) {
						event.log();
					},
					leave: [
						function(event) {},
						function(event) {}
					]
				},
				rules: {
					allowLeavingTo: {
						Preparing: function() { return false; },
						Ready: function() { return false; },
						
						// leading "." references current state ('Finished.')
						'.CleaningUp': true
					},
					allowEnteringFrom: {
						// TODO: support multiples with comma-delimited keys
						'Preparing, Ready': function() { return true; }
					}
				},
				states: {
					CleaningUp: {
						methodTwo: function() {
							return 'Finished.CleaningUp.methodTwo';
						}
					},
					Terminated: State({
						methods: {
							methodOne: function() {
								return 'Finished.Terminated.methodOne';
							},
							methodTwo: function() {
								return 'Finished.Terminated.methodTwo';
							}
						},
						rules: {
							allowLeavingTo: {
								// empty string references the controller's default state
								'': function(state) {
									// "this" references current state ('Finished.Terminated')
									// "state" references state to which controller is being changed ('')
									console.warn( 'Denying exit from ' + this.toString() + ' to ' + state.toString() );
									return false;
								},
								// TODO: support wildcard
								'*': true
							},
							allowEnteringFrom: {
								'..CleaningUp': function() { return true; },
								'...Preparing': function() { return true; },
								
								// "." references current state ('Finished.Terminated')
								
								// ".." references parent default state ('Finished')
								'..': true,
								
								// "..." references root default state ('' == controller().defaultState())
								
								// ".*" references any child state of parent state
								'.*': function() { return false; }
								
								// ".**" references any descendant state of parent state
							}
						},
						states: {
							// et cetera
						}
					})
				}
			})
		},
		
		// initial state selector
		initialState === undefined ? 'Preparing' : initialState
	);
}

test( "Object creation", function() {
	var x = new TestObject(),
		arr;
	ok( x.state instanceof State.Controller, "StateController created" );
	ok( x.state.Preparing instanceof State, "State 'Preparing' created" );
	ok( x.state.Preparing.hasMethod('methodOne'), "Method 'methodOne' in state 'Preparing' created" );
	ok( x.state.is('Preparing'), "In state 'Preparing'" );
	equal( x.methodOne(), 'Preparing.methodOne', "methodOne() on TestObject returns proper method for state 'Preparing'" );
	ok( x.state.Ready instanceof State );
	ok( x.state.Ready.hasMethod('methodTwo') );
	arr = x.state.Ready.getEventListeners('enter');
	equal( arr.length, 1, arr.keys() );
	arr = x.state.Ready.getEventListeners('leave');
	equal( arr.length, 2, arr.keys() );
	console.log(x);
	debugger;
});

test( "Null state transition", function() {
	var x = new TestObject();
	ok( ( x.state.change( x.state.current() ), x.state.is('Preparing') ), "StateController.change() to current state" );
	ok( x.state.current() === x.state.current().select(), "State.select() on current state" );
	console.log(x);
});

test( "Simple state transitions", function() {
	var x = new TestObject();
	ok( x.state.change('Ready'), "Change to state 'Ready'" );
	ok( x.state.change('Finished'), "Change to state 'Finished'" );
	ok( x.state.change(), "Change to default state" );
	console.log(x);
});

test( "State transitions from parent state into child state", function() {
	var x = new TestObject(''), result;
	ok( x.state.is(''), "Initialized to default state" );
	ok( result = x.state.change('Finished'), "Changed to state 'Finished' " + result.toString() );
	ok( x.state.change('.CleaningUp'), "Changed to child state 'CleaningUp' using relative selector syntax" );
	console.log(x);
});

test( "State transitions from one child state sibling to another", function() {
	var x = new TestObject('Finished');
	ok( x.state.is('Finished'), "Initialized to state 'Finished'" );
	ok( x.state.change('Finished').change('.CleaningUp'), "Null state transition chained to change to child state" );
	ok( x.state.change('..Terminated'), "Change to sibling state using relative selector syntax" );
	console.log(x);
});

})(jQuery);
