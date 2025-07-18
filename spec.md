# Manifold

Manifold is a reactive state management and front-end templating library that aims to be small, simple, performant, efficient, and convenient. Manifold provides features common in frameworks like React, Vue, and Svelte without requiring complex build systems, compilers, or coding practices.

## API

Manifold uses data attributes on regular HTML elements for all reactive templating.

### Core Attributes

| Attribute    | Purpose                | Example                                                 |
| ------------ | ---------------------- | ------------------------------------------------------- |
| data-bind    | Property/state binding | `<input data-bind="username" />`                        |
| data-if      | Conditional rendering  | `<div data-if="isVisible">Content</div>`                |
| data-else-if | Alternative condition  | `<div data-else-if="showAlternative">Alt content</div>` |
| data-else    | Fallback content       | `<div data-else>Default content</div>`                  |
| data-each    | List rendering         | `<div data-each="items as item">${item.name}</div>`     |
| data-scope   | Variable scoping       | `<div data-scope="user as u">Hello ${u.name}</div>`     |
| data-await   | Async content          | `<div data-await="fetchUser()">Loading...</div>`        |

### Data Binding

All reactive functionality is handled through data attributes that work on any HTML element:

-   **data-bind**: Binds element properties to state or expressions
-   **data-if/data-else-if/data-else**: Controls element visibility
-   **data-each**: Repeats elements for each item in an array
-   **data-scope**: Creates scoped variables for child elements
-   **data-await**: Handles async content with loading states
-   **Interpolation**: Use `${expression}` syntax within element content

#### Examples

**Conditional rendering:**

```html
<div data-if="user.isLoggedIn">Welcome back, ${user.name}!</div>
<div data-else-if="user.isGuest">Hello, guest!</div>
<div data-else>Please log in</div>
```

**List rendering:**

```html
<ul>
	<li data-each="products as product">${product.name} - $${product.price}</li>
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
