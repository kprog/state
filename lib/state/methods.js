// ### [`state/methods.js`](#state--methods.js)

function rootNoop () {}

O.assign( State.privileged, {

    // #### [method](#state--privileged--method)
    // 
    // Retrieves the named method held on this state. If no method is found,
    // step through this state’s protostate chain to find one. If no method is
    // found there, step up the superstate hierarchy and repeat the search.
    //
    // > [method](/api/#state--methods--method)
    method: function ( methods ) {
        return function (
             /*String*/ methodName,
            /*Boolean*/ viaSuper,    // = true
            /*Boolean*/ viaProto,    // = true
             /*Object*/ out          // optional
        ) {
            var superstate, protostate, method;

            viaSuper === undefined && ( viaSuper = true );
            viaProto === undefined && ( viaProto = true );

            methods && ( method = methods[ methodName ] );

            if ( method && method !== rootNoop ) {
                if ( out ) {
                    out.context = this; out.method = method;
                }
                return method;
            }

            if ( viaProto ) {
                protostate = this.protostate();
                if ( protostate ) {
                    method = protostate.method( methodName, false, true, out );
                    if ( method ) {
                        out && ( out.context = this );
                        return method;
                    }
                }
            }

            if ( viaSuper ) {
                superstate = this.superstate();
                if ( superstate ) {
                    method = superstate.method( methodName, true, viaProto,
                        out );
                    if ( method ) return method;
                }
            }

            if ( out ) {
                out.context = null; out.method = method;
            }
            
            return method;
        };
    },

    // #### [methodNames](#state--privileged--method-names)
    // 
    // Returns an `Array` of names of methods defined for this state.
    //
    // > [methodNames](/api/#state--methods--method-names)
    methodNames: function ( methods ) {
        return function () {
            return O.keys( methods );
        };
    },

    // #### [addMethod](#state--privileged--add-method)
    // 
    // Adds a method to this state, which will be callable directly from the
    // owner, but with its context bound to the state.
    //
    // > [addMethod](/api/#state--methods--add-method)
    addMethod: function ( methods ) {

        // ##### createDelegator
        // 
        // Creates a function that will serve as a **delegator** method on an
        // owner object. For each method defined in any of the owner’s states,
        // a delegator must be created and assigned on the owner itself, at
        // the `methodName` key. This delegator then forwards any calls to
        // `methodName` to the owner’s current state, which will locate the
        // appropriate implementation for the method, apply it, and return the
        // result.
        // 
        // If an owner already has an implementation for a delegated method,
        // it is copied into the owner’s root state, such that it remains
        // accessible as the owner’s “default behavior” if none of its active
        // states contains an implementation for that method.
        // 
        // Stateful methods are applied in the context of the [`State`](#state)
        // to which they belong, or, if a method is inherited from a
        // protostate, the context will be the corresponding virtual state
        // within the local [`StateController`](#state-controller). However,
        // for any a priori methods relocated to the root state, the context
        // appropriately remains bound to the owner object.
        //
        // > [Delegator methods](/docs/#concepts--methods--delegators)
        function createDelegator ( accessorKey, methodName, original ) {
            function delegator () {
                return this[ accessorKey ]().apply( methodName, arguments );
            }

            delegator.isDelegator = true;
            if ( O.env.debug ) {
                delegator.toString = function () { return "[delegator]"; };
            }

            original && ( delegator.original = original );

            return delegator;
        }

        //
        return function (
              /*String*/ methodName,
            /*Function*/ fn,
             /*Boolean*/ raw  // optional
        ) {
            var controller = this.controller(),
                controllerName = controller.name(),
                root = controller.root(),
                owner = controller.owner(),
                ownerMethod;

            // If `fn` holds a lexical state method then extract the method.
            if ( !raw && fn.isLexicalStateMethodFactory ) {
                fn = fn.call( __MODULE__, this );
            }

            // If there is not already a method called `methodName` in the
            // state hierarchy, then the owner and controller need to be set up
            // properly to accommodate calls to this method.
            if ( !this.method( methodName, true, false ) ) {
                if ( this !== root &&
                    !root.method( methodName, false, false )
                ) {
                    ownerMethod = owner[ methodName ];
                    ( ownerMethod === undefined || ownerMethod.isDelegator ) &&
                        ( ownerMethod = rootNoop );

                    // The owner method must be added to the root state in its
                    // “raw” form, i.e., not lexically transformed by
                    // `state.method`.
                    root.addMethod( methodName, ownerMethod, true );
                }

                // A delegator function is instated on the owner, which will
                // direct subsequent calls to `owner[ methodName ]` to the
                // controller, and then on to the appropriate state’s
                // implementation.
                owner[ methodName ] =
                    createDelegator( controllerName, methodName, ownerMethod );
            }

            return methods[ methodName ] = fn;
        };
    },

    // #### [removeMethod](#state--privileged--remove-method)
    // 
    // Dissociates the named method from this state object and returns its
    // function.
    //
    // > [removeMethod](/api/#state--methods--remove-method)
    removeMethod: function ( methods ) {
        return function ( /*String*/ methodName ) {
            var fn = methods[ methodName ];
            delete methods[ methodName ];
            return fn;
        };
    }
});

O.assign( State.prototype, {
    method: State.privileged.method( null ),
    methodNames: function () { return []; },
    'addMethod removeMethod': O.noop,

    // #### [hasMethod](#state--prototype--has-method)
    // 
    // Determines whether `this` possesses or inherits a method named
    // `methodName`.
    //
    // > [hasMethod](/api/#state--methods--has-method)
    hasMethod: function ( /*String*/ methodName ) {
        var method = this.method( methodName );
        return method && method !== rootNoop;
    },

    // #### [hasOwnMethod](#state--prototype--has-own-method)
    // 
    // Determines whether `this` directly possesses a method named `methodName`.
    //
    // > [hasOwnMethod](/api/#state--methods--has-own-method)
    hasOwnMethod: function ( /*String*/ methodName ) {
        return !!this.method( methodName, false, false );
    },

    // #### [apply](#state--prototype--apply)
    // 
    // Finds a state method and applies it in the appropriate context. If the
    // method was originally defined in the owner, the context will be the
    // owner. Otherwise, the context will either be the state in which the
    // method is defined, or if the implementation resides in a protostate, the
    // corresponding state belonging to the inheriting owner. If the named
    // method does not exist locally and cannot be inherited, a `noSuchMethod`
    // event is emitted and the call returns `undefined`.
    //
    // > [apply](/api/#state--methods--apply)
    apply: function (
        /*String*/ methodName,
         /*Array*/ args         // optional
    ) {
        var out, method, context, owner, ownerMethod;

        out = { method: undefined, context: undefined };
        method = this.method( methodName, true, true, out );

        if ( !method ) {
            // Observers may listen for either a general `noSuchMethod` event,
            // or one that is specific to a particular method.
            this.emit( 'noSuchMethod', [ methodName, args ] );
            this.emit( 'noSuchMethod:' + methodName, args );
            return;
        }

        context = out.context;
        owner = this.owner();
        ownerMethod = owner[ methodName ];
        if ( ownerMethod && ownerMethod.original && context === this.root() ) {
            context = owner;
        }

        return method.apply( context, args );
    },

    // #### [call](#state--prototype--call)
    // 
    // Variadic [`apply`](#state--prototype--apply).
    //
    // > [call](/api/#state--methods--call)
    call: function ( /*String*/ methodName ) {
        return this.apply( methodName, O.slice.call( arguments, 1 ) );
    }
});
