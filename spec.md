# Manifold

Manifold is a reactive state management and front-end templating library that aims to be small, simple, performant, efficient, and convenient. Manifold provides features common in frameworks like React, Vue, and Svelte without requiring complex build systems, compilers, or coding practices.

## API

Manifold uses data attributes on regular HTML elements for all reactive templating.

### Data Attributes

| Attribute    | Purpose                                                                   | Example                                                 |
| ------------ | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| data-bind    | Binds element properties to state using `property: value` syntax          | `<input data-bind="value: username" />`                 |
| data-sync    | Two-way data binding for form inputs (shorthand for value + events)       | `<input data-sync="username" />`                        |
| data-if      | Conditional rendering - shows element when expression is truthy           | `<div data-if="isVisible">Content</div>`                |
| data-else-if | Alternative condition - sibling of data-if for additional conditions      | `<div data-else-if="showAlternative">Alt content</div>` |
| data-else    | Fallback content - works with data-if, data-each, and data-await          | `<div data-else>Default content</div>`                  |
| data-each    | Repeats element for each array item using `items as item` syntax          | `<div data-each="items as item">${item.name}</div>`     |
| data-scope   | Creates scoped variables for child elements using `state as alias` syntax | `<div data-scope="user as u">Hello ${u.name}</div>`     |
| data-await   | Shows loading content while promise is pending                            | `<div data-await="fetchUser()">Loading...</div>`        |
| data-then    | Shows content when promise resolves, creates named variable               | `<div data-then="profile">${profile.name}</div>`        |

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

<!-- With fallback for empty arrays -->
<ul>
	<li data-each="products as product">${product.name} - $${product.price}</li>
	<li data-else>No products available</li>
</ul>
```

**Property binding:**

```html
<!-- Two-way binding shorthand -->
<input type="text" data-sync="username" />
<input type="email" data-sync="email" />
<textarea data-sync="message"></textarea>

<!-- Explicit property binding -->
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
<div data-then="profile">
	<h2>${profile.name}</h2>
	<p>${profile.bio}</p>
</div>
<div data-else="error">Error: ${error.message}</div>
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

### State Creation & Binding

Manifold provides two ways to create reactive state:

1. **JavaScript/TypeScript constructors** with full typing support
2. **Simple expressions** parsed directly in data attributes

**Typed constructors:**

```typescript
// Element-specific constructors with full type inference
const submitButton = $.button({
	innerText: "Submit Form",
	disabled: false,
	onclick: (e) => handleSubmit(e),
});

const emailInput = $.input({
	type: "email",
	value: "",
	placeholder: "Enter your email",
	required: true,
	oninput: (e) => validateEmail(e.target.value),
});

// Generic state creation for custom scenarios
const customState = $.create({
	isVisible: true,
	count: 0,
	items: ["apple", "banana", "cherry"],
});
```

**Expression-based state:**

```html
<!-- Expressions are automatically converted to reactive State -->
<div data-if="user.age >= 18">Adult content</div>
<div data-each="products.filter(p => p.inStock)">Available: ${value.name}</div>
<input data-bind="value: user.email || 'Enter email'" />

<!-- Complex expressions with scoping -->
<div data-scope="user.profile as profile, settings.theme as theme">
	<div data-if="profile.isVisible && theme === 'dark'">
		Dark mode profile content
	</div>
</div>
```

**Usage examples:**

```html
<!-- Using typed constructors -->
<button data-bind="submitButton">This text will be overridden</button>
<input data-bind="emailInput" />

<!-- Using custom state with scoping -->
<div data-scope="customState as state">
	<div data-if="state.isVisible">
		<p>Count: ${state.count}</p>
		<ul>
			<li data-each="state.items as item">${item}</li>
			<li data-else>No items available</li>
		</ul>
	</div>
</div>

<!-- Complex property binding -->
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
