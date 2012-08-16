## [Overview](#overview)

The points listed here summarize the discussions that follow in the [**Concepts**](#concepts) section.

* **States** — Formally, a **state** is an instance of `State` that encapsulates all or part of an **owner** object’s condition at a given moment. The owner may adopt different behaviors at various times by transitioning its **currency** from one of its states to another.

* [**Expressions**](#concepts--expressions) — A **state expression** describes the contents of a `State`. States may be [expressed concisely](#concepts--expressions--shorthand) with an object literal, which, along with an optional set of attribute keywords, can be passed into the `state()` function. There the provided input [is interpreted](#concepts--expressions--interpreting-expression-input) into a formal `StateExpression`, which can then be used to create a `State` instance.

* [**Inheritance**](#concepts--inheritance) — States are arranged hierarchically in a rooted tree structure: the owner object is given exactly one [**root state**](#concepts--inheritance--the-root-state), within which may be nested zero or more **substates**, which may themselves contain further substates, and so on, [thereby expressing specificity](#concepts--inheritance--superstates-and-substates) of the owner’s behavior. A state inherits from its **superstate**, with which it shares the same owner, [and also inherits from any **protostate**](#concepts--inheritance--protostates), defined as the equivalently positioned state within a prototype of the owner object. Protostates have a higher inheriting precedence than superstates.

* [**Selectors**](#concepts--selectors) — A stateful owner `object`’s accessor method at `object.state()` can be called without arguments to retrieve the object’s current state, or, if provided a **selector** string, to query for a specific `State` of the object, or a specific set of states.

* [**Attributes**](#concepts--attributes) — A state expression may include a set of **attribute** keywords (e.g.: `mutable`, `initial`, `conclusive`, `abstract`, etc.), which will enable features or impose constraints for the `State` that the expression is to represent.

* [**Data**](#concepts--data) — Arbitrary **data** can be attached to each state, and inherited accordingly through protostates and superstates.

* [**Methods**](#concepts--methods) — Behavior is modeled by defining state **methods** that override the object’s methods. Consumers of the object simply call its methods as usual, and need not be aware of the object’s current state, or even that a concept of state exists at all. State methods [are invoked in the context of the state](#concepts--methods--context) in which the method is defined, allowing for polymorphic features like invoking the overridden methods of a superstate.

* [**Transitions**](#concepts--transitions) — When an object is directed to change from one state to another, it does so by temporarily entering into a **transition** state. A state expression may include [**transition expressions**](#concepts--transitions--expressions) that describe, given a specific pairing of origin and target states, a synchronous or asynchronous **action** to be performed over the duration of the transition.

* [**Events**](#concepts--events) — Listeners for specific **event** types can be bound to a state, which will be called in the context of the bound state as it is affected [by a progressing transition](#concepts--events--transitional), as the state itself [experiences changes to its content](#concepts--events--mutation), or upon the state’s [construction or destruction](#concepts--events--existential). **State** also allows for [custom typed events](#concepts--events--custom), which can be emitted from a particular state and propagated to listeners bound to the state itself as well as its protostates and superstates.

* [**Guards**](#concepts--guards) may be applied [to a state](#concepts--state-guards) to govern its viability as a transition target, dependent on the outgoing state and any other conditions that may be defined. Likewise guards may also be included [in transition expressions](#concepts--transition-guards), where they are used to select a particular transition to execute. Guards are evaluated as predicates if supplied as functions, or as boolean values otherwise.

<div class="backcrumb">
⏎  <a class="section" href="#overview">Overview</a>
</div>

* * *