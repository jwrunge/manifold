# Manifold

A lightweight, no-build reactive state and templating library for the modern web. All the framework niceties you crave, none of the build complexity, bloat, weeping, or gnashing of teeth that usually comes with them.

Manifold's guiding philosophy: stand in for the power and ergonomics of big front-end frameworks like React, Vue, and Svelte only where the modern browser can't; cleave to modern web standards and features where it can.

## What is Manifold? Why use it?

Manifold is a **no-build reactive framework** that lets you add powerful state management and templating to your web applications without any build tools, bundlers, or compilation steps. Just drop it in your HTML and start building reactive UIs immediately.

Manifold is **not** JavaScript/TypeScript-phobic and is **not** meant to hide programming from you. But it's also not going to sugar-coat the fact doing everything in a script tag is bad for business. The web was made to be simple: let's be simple.

### Key Advantages

-   **Zero Build Step**: Import and use directly in the browser - no webpack, vite, or babel needed... unless of course you want them
-   **Fine-Grained Reactivity**: Surgical DOM updates with wicked-efficient proxy-based reactivity that only re-renders what actually changed
-   **HTML-First Approach**: Write reactive templates directly in your HTML using intuitive attributes with syntax and features inspired by Svelte and Vue
-   **Smooth Animations**: Built-in support for View Transitions API with automatic transition management
-   **Tiny Footprint**: Minimal runtime with no dependencies
-   **Fully-typed state**: No hiding types in loose proxies
-   **Scoped elements**: Variables are safely scoped to DOM elements and trickle down only to the element's descendents
-   **Server Integration**: Built-in utilities for fetching and dynamically inserting remote content, htmx-style
-   **TypeScript Support**: Full type safety with intelligent auto-completion
-   **Framework Agnostic**: Use alongside any other libraries or frameworks
-   **Close to the metal**: Rely on browser-native features; no complex routing setups or DOM integrations, no HTML in template strings, and no compilation step (unless of course you want those things!). Just flexible code that keeps it simple and does things the old-fashioned way, but with all the modern features and sleek app-ness of contemporary web development.

Perfect for:

-   **Rapid prototyping** without build setup overhead
-   **Legacy applications** that need modern reactivity
-   **Static sites** that want dynamic behavior
-   **Learning reactive concepts** without tooling complexity
-   **CDN-delivered applications** that can't use build tools
-   **Hybrid-native apps** that are complex enough without worrying about build steps and framework noise
-   **Modular websites and apps**
-   **Whatever else you can dream up**

## Installing

### NPM (Node.js/Bun)

```bash
npm install mfld
```

### JSR (Deno/Modern Runtime)

```bash
deno add @jwrunge/manifold
```

### GitHub Packages

```bash
npm install @jwrunge/manifold --registry=https://npm.pkg.github.com
```

### CDN (No Installation)

```html
<!-- ES Modules -->
<script type="module">
	import Manifold from "https://cdn.jsdelivr.net/npm/@jwrunge/manifold@latest/dist/manifold.es.js";
</script>

<!-- UMD (global Manifold variable) -->
<script src="https://cdn.jsdelivr.net/npm/@jwrunge/manifold@latest/dist/manifold.umd.js"></script>

<!-- Alternative CDNs -->
<script src="https://unpkg.com/@jwrunge/manifold@latest/dist/manifold.umd.js"></script>
<script type="module">
	import Manifold from "https://esm.sh/@jwrunge/manifold";
</script>
```

### Deno Land

```typescript
import Manifold from "https://deno.land/x/manifold@v0.4.0/src/main.ts";
```

## Quick Start

Here's a complete reactive counter app in pure HTML:

```html
<!DOCTYPE html>
<html>
	<head>
		<title>Manifold Counter</title>
	</head>
	<body data-mf-register>
		<h1>Count: ${count}</h1>
		<button :onclick="count++">Increment</button>
		<button :onclick="count--">Decrement</button>

		<div :if="count > 10">Wow, you've clicked a lot!</div>

		<script type="module">
			import Manifold from "./dist/manifold.es.js";
			const state = Manifold.create().add("count", 0).build();
		</script>
	</body>
</html>
```

That's it! You now have:

-   ✅ Reactive text interpolation (`${count}`)
-   ✅ Event handling (`:onclick`)
-   ✅ Conditional rendering (`:if`)
-   ✅ Automatic DOM updates when state changes

## Core Features

### 1. Reactive State Management

Create type-safe reactive state that automatically updates the DOM:

```javascript
const state = Manifold.create()
	.add("user", { name: "Alice", age: 30 })
	.add("items", [1, 2, 3])
	.add("isLoggedIn", false)
	.build();

// Any changes automatically update the DOM
state.user.name = "Bob";
state.items.push(4);
state.isLoggedIn = true;
```

#### Incremental State Building

Manifold states aren't complete until you call `.build()`. This lets you store incomplete states and pass them around:

```javascript
// Start building a state
const incompleteState = Manifold.create()
	.add("user", null)
	.add("theme", "light");

// Pass it to a function to add more properties
function addUserFeatures(state) {
	return state.add("preferences", {}).add("notifications", []);
}

// Continue building elsewhere
const moreComplete = addUserFeatures(incompleteState)
	.add("isAdmin", false)
	.derive("hasUser", (s) => s.user !== null);

// Only now does it become reactive
const finalState = moreComplete.build();
```

### 2. Derived State

Compute values that automatically update when dependencies change:

```javascript
const state = Manifold.create()
	.add("firstName", "John")
	.add("lastName", "Doe")
	.derive("fullName", (s) => `${s.firstName} ${s.lastName}`)
	.derive("initials", (s) =>
		s.fullName
			.split(" ")
			.map((n) => n[0])
			.join("")
	)
	.build();

// fullName and initials update automatically when firstName or lastName change
```

### 3. Template Syntax

#### Text Interpolation

```html
<p>Hello ${user.name}, you have ${items.length} items!</p>
<span>Your score: ${score * multiplier}</span>
```

#### Attribute Binding

```html
<input :value="username" :placeholder="hint" />
<img :src="imageUrl" :alt="imageDescription" />
<div :class:active="isActive" :class:disabled="!canSubmit">
	<span
		:style:color="theme.textColor"
		:style:font-size="fontSize + 'px'"
	></span>
</div>
```

#### Event Handling

```html
<button :onclick="handleClick">Click me</button>
<input :oninput="value => updateSearch(value)" />
<form :onsubmit="e => { e.preventDefault(); submit() }"></form>
```

#### Two-Way Binding

```html
<input :sync:value="username" />
<input type="checkbox" :sync:checked="isSubscribed" />
<select :sync:value="selectedOption"></select>
```

### 4. Conditional Rendering

Show/hide elements based on state:

```html
<div :if="user.isLoggedIn">Welcome back, ${user.name}!</div>
<div :elseif="user.isGuest">You're browsing as a guest</div>
<div :else>Please log in to continue</div>
```

### 5. List Rendering

Render dynamic lists with automatic updates:

```html
<!-- Simple array -->
<ul>
	<li :each="items as item, index">${index}: ${item}</li>
</ul>

<!-- Object destructuring -->
<div :each="users as {name, age, id}">
	<h3>${name} (${age} years old)</h3>
	<button :onclick="deleteUser(id)">Delete</button>
</div>

<!-- With nested conditionals -->
<div :each="todos as todo">
	<span :if="todo.completed" class="done">${todo.title}</span>
	<span :else class="pending">${todo.title}</span>
</div>
```

### 6. Async/Await Templating

Handle promises directly in your templates:

```html
<div :await="fetchUser(userId)">Loading user...</div>
<div :then="user">Welcome ${user.name}! Email: ${user.email}</div>
<div :catch="error">Failed to load user: ${error.message}</div>
```

### 7. View Transitions & Animations

Smooth animations with zero configuration using the View Transitions API:

```html
<!-- Elements automatically animate when shown/hidden -->
<div :if="isVisible" :transition="fade-in">This will fade in smoothly!</div>
**
<ul>
	<li :each="items as item" :transition="slide-up">
		${item}
		<!-- Animates in/out when added/removed -->
	</li>
</ul>
```

Add corresponding CSS:

```css
@keyframes fade-in {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes slide-up {
	from {
		opacity: 0;
		transform: translateY(20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

::view-transition-new(*.fade-in) {
	animation: fade-in 300ms ease;
}

::view-transition-new(*.slide-up) {
	animation: slide-up 250ms ease;
}
```

### 8. Server Content Integration

Fetch and dynamically insert remote content with automatic registration:

```javascript
// In your state
const state = Manifold.create()
	.add("loadSnippet", () => {
		Manifold.get("/api/snippet.html").replace("#content", {
			from: "#payload",
			addTransitionClass: "fade",
		});
	})
	.build();
```

```html
<div id="content"></div>
<button :onclick="loadSnippet()">Load Content</button>

<!-- Or use directly in expressions -->
<button :onclick="$.get('/snippets/header.html').append('#main')">
	Load Header
</button>
```

Features:

-   **Smart Script/Style Handling**: Automatically dedupe and execute scripts, insert styles
-   **Selector-Based Extraction**: Pull specific parts from remote HTML
-   **Transition Support**: Smooth animations when inserting content
-   **Auto-Registration**: New elements automatically become reactive

### 9. Registration System

Control which parts of your DOM are reactive and scope different states to different sections:

```html
<!-- Automatic registration for entire document (unnamed state) -->
<body data-mf-register>
	<!-- Everything here uses the default/unnamed state -->
</body>

<!-- Manual registration for specific sections (unnamed state) -->
<div data-mf-register>
	<!-- Only this section is reactive, uses default state -->
	<p>${message}</p>
</div>

<!-- Named state scoping -->
<div data-mf-register="user-panel">
	<!-- This section uses the "user-panel" state -->
	<h2>Welcome ${username}</h2>
	<button :onclick="logout()">Logout</button>
</div>

<div data-mf-register="shopping-cart">
	<!-- This section uses the "shopping-cart" state -->
	<p>Items: ${items.length}</p>
	<div :each="items as item">${item.name} - $${item.price}</div>
</div>

<!-- Programmatic registration -->
<script>
	// Create multiple named states
	const userState = Manifold.create("user-panel")
		.add("username", "Alice")
		.add("logout", () => console.log("Logging out..."))
		.build(); // Registration happens automatically when built

	const cartState = Manifold.create("shopping-cart")
		.add("items", [
			{ name: "Widget", price: 9.99 },
			{ name: "Gadget", price: 19.99 },
		])
		.build(); // This also registers automatically
</script>
```

This allows you to:

-   **Isolate state** between different UI components
-   **Avoid naming conflicts** when different sections need similar property names
-   **Organize complex applications** with multiple independent reactive regions
-   **Mix named and unnamed states** in the same application

## Browser Support

### Core Reactivity

-   **Modern browsers (Chrome 49+, Firefox 44+, Safari 10+)**: Full support with native Proxy
-   **Older browsers**: Requires Proxy polyfill (see below)
-   **IE11**: Not supported (no viable Proxy polyfill exists with acceptable performance)

### View Transitions

-   **Chrome 111+**: Native support
-   **Firefox, Safari**: Use polyfill (see recommendations below)

### Recommended Polyfills

For **older browsers** that need Proxy support:

```html
<!-- Only include if targeting older browsers -->
<script src="https://cdn.jsdelivr.net/npm/proxy-polyfill@0.3.2/proxy.min.js"></script>
```

⚠️ **Note**: Proxy polyfills have limitations and performance implications. Consider using feature detection.

For **View Transitions** in Firefox or older versions of Chrome and Safari, check out [the NPM package by demarketed.](https://www.npmjs.com/package/view-transitions-polyfill)

### Feature Detection Pattern

```javascript
// Graceful degradation approach
const hasProxySupport = typeof Proxy !== "undefined";
const hasViewTransitions = "startViewTransition" in document;

if (!hasProxySupport) {
	console.warn("Manifold: Limited reactivity on this browser");
}

if (!hasViewTransitions) {
	console.info("Manifold: Using CSS transitions fallback");
}
```

### Minimum Requirements

-   **Required**: ES6 Proxy support (or polyfill)
-   **Optional**: View Transitions API (graceful fallback to regular CSS transitions)
-   **Recommended**: ES2015+ for best performance and developer experience

## API Reference

### Manifold Class

```javascript
// Static methods
Manifold.create(name?: string, initialState?: object) // Create new instance
Manifold.get(url, fetchOps?: RequestInit, defaultOps?: FetchDOMOptions) // Static fetch GET
Manifold.post(url, fetchOps?: RequestInit, defaultOps?: FetchDOMOptions) // Static fetch POST
Manifold.fetch(url, ops: FetchDOMOptions, fetchOps?: RequestInit) // Static fetch with full options

// Instance methods
.add(key: string, value: any) // Add property to state
.derive(key: string, fn: (state) => any) // Add computed property
.build() // Build and return reactive state
.get(url, fetchOps?: RequestInit, defaultOps?: FetchDOMOptions) // Instance fetch GET
.post(url, fetchOps?: RequestInit, defaultOps?: FetchDOMOptions) // Instance fetch POST
.fetch(url, ops: FetchDOMOptions, fetchOps?: RequestInit) // Instance fetch with options
```

### Type Definitions

```typescript
interface FetchDOMOptions {
	from?: string; // CSS selector to extract content from
	to: string; // CSS selector for insertion target
	method: "append" | "prepend" | "replace";
	insertScripts?: boolean | string[]; // Whether to execute scripts
	insertStyles?: boolean | string[]; // Whether to insert styles
	addTransitionClass?: string; // CSS class for View Transitions
}

// fetchOps is the standard fetch RequestInit:
interface RequestInit {
	method?: string;
	headers?: HeadersInit;
	body?: BodyInit | null;
	mode?: RequestMode;
	credentials?: RequestCredentials;
	cache?: RequestCache;
	redirect?: RequestRedirect;
	referrer?: string;
	// ... and other standard fetch options
}
```

### Template Directives

-   **`:if`**, **`:elseif`**, **`:else`** - Conditional rendering
-   **`:each`** - List rendering with destructuring support
-   **`:await`**, **`:then`**, **`:catch`** - Promise handling
-   **`:onclick`**, **`:oninput`**, etc. - Event binding
-   **`:value`**, **`:checked`**, etc. - Attribute binding
-   **`:class:name`**, **`:style:property`** - Conditional classes/styles
-   **`:sync:property`** - Two-way data binding
-   **`:transition`** - Animation class for View Transitions
