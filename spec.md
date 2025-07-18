# Manifold

Manifold is a reactive state management and front-end templating library that aims to be small, simple, performant, efficient, and convenient. Manifold provides features common in frameworks like React, Vue, and Svelte without requiring complex build systems, compilers, or coding practices.

## API

Manifold uses data attributes on regular HTML elements for all reactive templating.

### Data Attributes

| Attribute    | Purpose                                                                   | Example                                                 |
| ------------ | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| data-bind    | Binds element properties to state using `property: value` syntax          | `<input data-bind="value: username" />`                 |
| data-if      | Conditional rendering - shows element when expression is truthy           | `<div data-if="isVisible">Content</div>`                |
| data-else-if | Alternative condition - sibling of data-if for additional conditions      | `<div data-else-if="showAlternative">Alt content</div>` |
| data-else    | Fallback content - sibling of data-if shown when all conditions are false | `<div data-else>Default content</div>`                  |
| data-each    | Repeats element for each array item using `items as item` syntax          | `<div data-each="items as item">${item.name}</div>`     |
| data-scope   | Creates scoped variables for child elements using `state as alias` syntax | `<div data-scope="user as u">Hello ${u.name}</div>`     |
| data-await   | Shows loading content while promise is pending (use with data-then/catch) | `<div data-await="fetchUser()">Loading...</div>`        |

**Interpolation**: Use `${expression}` syntax within element content to display dynamic values.

#### Examples

**Conditional rendering:**

```html
<div data-if="user.isLoggedIn">Welcome back, ${user.name}!</div>
<div data-else-if="user.isGuest">Hello, guest!</div>
<div data-else>Please log in</div>
```

**List rendering:**

```html
<!-- Default: key maps to "key", value maps to "value" -->
<ul>
	<li data-each="products">${key}: ${value.name} - $${value.price}</li>
</ul>

<!-- Custom naming: array as keyName, valueName -->
<ul>
	<li data-each="products as id, product">
		${id}: ${product.name} - $${product.price}
	</li>
</ul>
```

**Property binding:**

```html
<input type="text" data-bind="value: username" />
<button data-bind="disabled: isDisabled">Click me</button>
<button data-bind="onclick: handleClick">Click me</button>
<input data-bind="value: email, disabled: isReadonly" />
```

**Scoped variables:**

```html
<div data-scope="currentUser as user, cartItems as items">
	<h1>Hello ${user.name}</h1>
	<div data-if="items.length > 0">
		<div data-each="items as item">${item.title} - $${item.price}</div>
	</div>
	<div data-else>Your cart is empty</div>
</div>
```

### Advanced Features

**Async content:**

```html
<div data-await="fetchUserProfile()">Loading user profile...</div>
<div data-then data-bind="result as profile">
	<h2>${profile.name}</h2>
	<p>${profile.bio}</p>
</div>
<div data-catch data-bind="error">Error: ${error.message}</div>
```

**Event handlers:**

```html
<button data-bind="onclick: handleClick">Click me</button>
<form data-bind="onsubmit: handleSubmit">...</form>
```

**Multiple properties:**

```typescript
const buttonState = $.create({
	innerText: "Click me",
	disabled: false,
	onclick: () => alert("Hello!"),
});
```

```html
<button data-bind="buttonState"></button>
```

**Complex binding:**

```html
<select data-bind="value: selectedValue, options: optionsList">
	<option
		data-each="optionsList as option"
		data-bind="value: option.value"
		selected="${option.value === selectedValue}"
	>
		${option.label}
	</option>
</select>
```
