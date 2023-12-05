# Data binding and syncing

[< Return to index.](/README.md)

* [Description](#description)
* [Some brief examples](#some-brief-examples)
* [Detailed overview](#detailed-overview)
  * [One-way binding](#one-way-binding)
  * [Two-way binding](#two-way-binding)
  * [Processing bound values](#processing-bound-values)
  * [Multiple bindings](#multiple-bindings)
  * [Binding to attributes](#binding-to-attributes)

## Description

Via the `cu-bind` attribute, Copper stores can be bound to any attribute or property of an HTML element, and optionally processed by globally-defined functions. Alterations to the HTML element can also by synced back to the variable, creating a two-way binding.

The `cu-bind` syntax is as follows:

```html
{store_name}[:properties] [input_processing_function] [sync:events [output_processing_function]]
```

## Some brief examples

Below is a kind of "cheat sheet" reference to how to bind and sync stores with HTML elements in Copper. You can find a detailed explanation of these patterns in the [detailed overview below](#detailed-overview).

Bind the value of `store` to an element's `value` property (one-way binding):

```html
<input cu-bind="store:value">
```

Bind the value of `store` to the `checked` property and sync changes to `checked` back to `store` on `change` (two-way binding):

```html
<input type="checkbox" cu-bind="store:checked sync:change">
```

Bind the value of `store` to the `disabled` property, processed with the `isDisabled` function; sync changes to `disabled` back to `store`, processing the value with the `onDisabled` function:

```html
<input cu-bind="store:disabled isDisabled sync:change onDisabled">
```

Bind the value of `store` to both the `disabled` and `value` properties, and sync on `change` and `keyup`. The effect of this is to disable the input once you've typed "true":

```html
<input cu-bind="store:disabled|value sync:change|keyup">
```

When `store` updates, run the `evaluate` function (which receives a reference to the element for direct manipulation):

```html
<div class="special-div" cu-bind="store evaluate">
```

Apply granular bindings by separating with a semicolon:

```html
<input cu-bind="store evaluate; store:value sync:change processChange">
```

## Detailed Overview

### One-way binding

The result of a Copper store can be synced to an HTML element's attribute using the `cu-bind` attribute. For example:

```javascript
new Copper.Store("Initial value", "store1");

setTimeout(()=> {
    Copper.update("Updated after 3s", "store1");
}, 3000);

setTimeout(()=> {
    console.log(Copper.valueof("store1"));
}, 5000);
```

```html
<input type="text" cu-bind="store1:value">
```

The above example should be fairly self-explanatory: we initialize a Copper store called "store1," and three seconds later update its value. In the markup, we bind the value of `store1` to the `value` property of the input element using the `cu-bind` attribute. When `store1` updates, the input element will update. After 5 seconds, the console will log the current value of `store1`, which in this case will always be "Updated after 3s."

### Two-way binding

What the above example does *not* do is sync updates to the input element's value back to the store. To do this, we can extend the `cu-bind` attribute value like so:

```html
<input type="text" cu-bind="store1:value sync:change">
```

The above modification will update the value of `store1` whenever the value of the input changes. If the user changes the text of the input element to "Sync works!" after the three-second timeout (which updates the store, and therefore the input element) but before the five-second timeout (which logs the value of the store), then the console log output will read "Sync works!"

### Processing bound values

Bound values can optionally be processed both on assignment to the HTML element (on ingress) and on sync (egress). Specifying a processing function after the bind definition will change the bound value before it is applied to the HTML element (without affecting the store value). Specifying a processing function after the sync definition will change the syncing value before the change is applied to the store without affecting the HTML element's value.

```html
<input type="number" cu-bind="store:value asNumber sync:change asText">
```

```typescript
new Copper.Store("128", "store");

asNumber(val: string) {
    const returnValue = parseInt(val);
    if(isNaN(returnValue)) return 12345;
    return val;
}

asString(val: number) {
    return val.toString();
}
```

The above code initializes a store named "store" that takes a string value.

Whenever the store updates, the value will be fed into the `asNumber` function, which will parse the input as a number; if it isn't a number, the input will be assigned the number `12345`. That value is then applied to the number input element. The result of this is that the input will *never not be a number*.

Whenever the `change` event fires on our number input element, the value will be processed by `asString`, which converts the number to a string and updates the store. The result of this is that updating this input element *will never change to store to any type other than a string*.

### Multiple bindings

**You can bind to multiple properties or attributes** by separating the properties or attributes with a pipe (`|`):

```html
<input cu-bind="store:value|disabled sync:change">
```

The result of the above code is that `store`'s value will be updated whenever the input is changed. If that value happens to be "true," `store`'s `disabled` property will also be set to true, making it uneditable.

**You can sync changes based on multiple events** by separating the events with a pipe (`|`):

```html
<input cu-bind="store:value sync:change|keyup">
```

The result of the above code is that `store`'s value will be updated whenever the input is changed, or whenever a `keyup` event is fired.

**You can granularly define binding and syncing behavior** by separating bind statements with a semicolon (`;`):

```html
<div cu-bind="store:innerText formatValue; store colorize"></div>
```

```typescript
function formatValue(val: string) {
    return `The value is currently: ${val}`
}

function colorize(val: string, el: HTMLElement) {
    if(val === "red") {
        el.style.backgroundColor = "red";
    }
    else {
        el.style.backgroundColor = "";
    }
}
```

In the above code, we process the binding of `store`'s value in two ways:

1. via the `formatValue` function, which prepends some text to the store value before updating the `div` element's `innerText` property.
2. via the `colorize` function, which determines the background of the `div` based on the value of the store.

### Binding to attributes

You can bind to attributes instead of properties by appending `-attr` to the property name.

```html
<input cu-bind="store:value-attr">
```

In the above example, we bind the value of `store` to the input's `value` attribute.

If you inspect the element in your console, whenever `store` updates, you will see the element's tag update with `value={some_value}`, but you won't see the actual input element's value update. That's because an HTML element's `value` *attribute* is different than the `value` *property*: the `value` attribute is the element's default value; the `value` property is its current value.

Setting an element's `value` *attribute* is probably not very practical, but it serves to illustrate why Copper allows you control over what a store can bind to. In most cases you'll want to update an element's property rather than its attribue (that's why Copper defaults to altering properties and requires that you append `-attr` if you want to specifically override that behavior).
