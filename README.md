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
<!-- JSDelivr ESM -->
<script type="module">
	import Manifold from "https://cdn.jsdelivr.net/npm/@jwrunge/manifold@latest/dist/manifold.js";
	const state = Manifold.create().add("count", 0).build();
	state.count++;
</script>

<!-- Alternative CDN (esm.sh proxy) -->
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
			import Manifold from "./dist/manifold.js";
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
import { State } from "@jwrunge/manifold";

const state = State.create()
	.add("firstName", "John")
	.add("lastName", "Doe")
	.derive("fullName", (s) => `${s.firstName} ${s.lastName}`)
	.derive(
		"initials",
		(s) =>
			s.fullName
				.split(" ")
				.map((n) => n[0])
				.join("")
	)
	.build();

// fullName and initials update automatically when firstName or lastName change
```

### 3. Sets and Maps Reactivity

Manifold provides fine-grained reactivity for Sets and Maps with efficient tracking:

#### Reactive Sets

```javascript
const state = State.create()
	.add("tags", new Set(["javascript", "typescript", "react"]))
	.add("activeFilters", new Set())
	.build();

// Set operations trigger reactivity
state.tags.add("vue"); // Updates DOM
state.tags.delete("react"); // Updates DOM
state.tags.clear(); // Updates DOM

// Use in templates with spread operator
```

```html
<div>
	<p>Tags: ${[...tags].join(', ')}</p>
	<ul>
		<li :each="[...tags] as tag">${tag}</li>
	</ul>
</div>
```

#### Reactive Maps with Granular Tracking

Maps use **granular key-level tracking** for optimal performance with large datasets:

```javascript
const state = State.create()
	.add("userSettings", new Map([
		["theme", "dark"],
		["fontSize", 14],
		["language", "en"]
	]))
	.add("cache", new Map())
	.build();

// Map operations are tracked efficiently
state.userSettings.set("theme", "light"); // Only affects watchers of "theme" key
state.userSettings.delete("language"); // Updates structural watchers
state.cache.set("user:123", userData); // Only notifies watchers of this specific key
```

**How granular tracking works:**
- `.get(key)` - Tracks the specific key; re-runs only when that key's value changes
- `.has(key)` - Tracks key existence; re-runs only when key is added/deleted, NOT on value changes
- `.set(key, value)` - Notifies `.get()` watchers of that key, plus structural watchers if it's a new key
- `.delete(key)` - Notifies both value and existence watchers
- Iteration (`.keys()`, `.values()`, `.entries()`, `.forEach()`) - Tracks all structural changes

```javascript
import { State, effect } from "@jwrunge/manifold";

const state = State.create()
	.add("data", new Map([["a", 1], ["b", 2]]))
	.build();

// This effect only re-runs when key "a" value changes
effect(() => {
	console.log("Value of a:", state.data.get("a"));
});

// This effect only re-runs when key "a" is added/deleted
effect(() => {
	console.log("Has a:", state.data.has("a"));
});

state.data.set("a", 10); // First effect runs, second does NOT
state.data.set("b", 20); // Neither effect runs
state.data.delete("a"); // Both effects run
```

**Use in templates:**

```html
<div>
	<!-- Iterate over entries -->
	<div :each="[...userSettings.entries()] as [key, value]">
		${key}: ${value}
	</div>

	<!-- Check for specific keys -->
	<div :if="userSettings.has('theme')">
		Theme: ${userSettings.get('theme')}
	</div>

	<!-- Get map size -->
	<p>Settings count: ${userSettings.size}</p>
</div>
```

#### Deep Equality for Sets and Maps

Derived state that returns new Sets/Maps uses deep equality comparison:

```javascript
const state = State.create()
	.add("items", ["apple", "banana", "apple", "cherry"])
	.add("filter", "all")
	.derive("uniqueItems", (s) => new Set(s.items)) // Returns new Set each time
	.derive("filteredSet", (s) => {
		// Returns new Set based on filter
		const items = s.filter === "all" ? s.items : s.items.filter(/* ... */);
		return new Set(items);
	})
	.build();

// Derived state only triggers updates when Set CONTENTS actually change
// Not when a new Set instance is created with the same contents
```

This prevents unnecessary re-renders when derived functions return fresh Set/Map instances with identical contents.

### 4. Template Syntax

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

### 5. Conditional Rendering

Show/hide elements based on state:

```html
<div :if="user.isLoggedIn">Welcome back, ${user.name}!</div>
<div :elseif="user.isGuest">You're browsing as a guest</div>
<div :else>Please log in to continue</div>
```

### 6. List Rendering

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

### 7. Async/Await Templating

Handle promises directly in your templates:

```html
<div :await="fetchUser(userId)">Loading user...</div>
<div :then="user">Welcome ${user.name}! Email: ${user.email}</div>
<div :catch="error">Failed to load user: ${error.message}</div>
```

### 8. View Transitions & Animations

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

### 9. Server Content Integration

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

### 10. Registration System

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

## TypeScript Support

Manifold is built with TypeScript and provides full type safety throughout your application.

### Automatic Type Inference

Types are automatically inferred from your state:

```typescript
import { State } from "@jwrunge/manifold";

const state = State.create()
	.add("count", 0) // inferred as number
	.add("name", "Alice") // inferred as string
	.add("items", [1, 2, 3]) // inferred as number[]
	.add("user", { id: 1, name: "Bob" }) // inferred as { id: number, name: string }
	.build();

// TypeScript knows the types!
state.count.toFixed(2); // ✓ OK
state.name.toUpperCase(); // ✓ OK
state.items.push(4); // ✓ OK
state.count = "hello"; // ✗ Error: Type 'string' is not assignable to type 'number'
```

### Explicit Type Annotations

Provide explicit types when you need more control (no casting required):

```typescript
const state = State.create()
	// Explicitly type as a mutable record
	.add<Record<string, boolean>>("flags", {})
	// Explicitly type as a Set
	.add<Set<string>>("tags", new Set())
	// Explicitly type as a Map
	.add<Map<string, number>>("scores", new Map())
	// Functions can reference state properties
	.add("toggle", (key: string, state: { flags: Record<string, boolean> }) => {
		state.flags[key] = !state.flags[key];
	})
	.build();

// Now you can use them without casting:
state.flags.darkMode = true; // ✓ OK
state.tags.add("featured"); // ✓ OK
state.scores.set("player1", 100); // ✓ OK
state.toggle("darkMode");
```

### Derived State with Type Annotations

Enforce return types for derived state:

```typescript
const state = State.create()
	.add("items", ["apple", "banana", "apple", "cherry"])
	// Explicitly specify the return type
	.derive<Set<string>>("uniqueItems", (s) => new Set(s.items))
	.derive<number>("itemCount", (s) => s.uniqueItems.size)
	// Complex return types
	.derive<Map<string, number>>("itemFrequency", (s) => {
		const freq = new Map<string, number>();
		for (const item of s.items) {
			freq.set(item, (freq.get(item) || 0) + 1);
		}
		return freq;
	})
	.build();
```

### Typing Functions with State Access

Functions can access the full state by typing their parameters:

```typescript
type AppState = {
	todos: Array<{ id: number; text: string; done: boolean }>;
	filter: "all" | "active" | "completed";
	filteredTodos: Array<{ id: number; text: string; done: boolean }>;
};

const state = State.create()
	.add("todos", [] as AppState["todos"])
	.add("filter", "all" as AppState["filter"])
	.derive<AppState["filteredTodos"]>("filteredTodos", (s) => {
		if (s.filter === "all") return s.todos;
		if (s.filter === "active") return s.todos.filter((t) => !t.done);
		return s.todos.filter((t) => t.done);
	})
	.add("addTodo", (text: string, state: AppState) => {
		state.todos.push({ id: Date.now(), text, done: false });
	})
	.add("toggleTodo", (id: number, state: AppState) => {
		const todo = state.todos.find((t) => t.id === id);
		if (todo) todo.done = !todo.done;
	})
	.add("setFilter", (filter: AppState["filter"], state: AppState) => {
		state.filter = filter;
	})
	.build();
```

### Pre-defining State Shape

For complex applications, define your state shape upfront:

```typescript
type UserState = {
	user: { name: string; email: string; role: string } | null;
	isLoggedIn: boolean;
	permissions: Set<string>;
	settings: Map<string, unknown>;
	login: (email: string, password: string) => Promise<void>;
	logout: () => void;
};

const state = State.create()
	.add("user", null as UserState["user"])
	.add("isLoggedIn", false)
	.add<Set<string>>("permissions", new Set())
	.add<Map<string, unknown>>("settings", new Map())
	.add("login", async (email: string, password: string, state: UserState) => {
		const response = await fetch("/api/login", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		});
		const data = await response.json();
		state.user = data.user;
		state.permissions = new Set(data.permissions);
		state.isLoggedIn = true;
	})
	.add("logout", (state: UserState) => {
		state.user = null;
		state.permissions.clear();
		state.isLoggedIn = false;
	})
	.build();
```

### Component TypeScript Support

Components are fully typed when using the TypeScript-first approach:

```typescript
import { State, html, css } from "@jwrunge/manifold";

type CounterState = {
	count: number;
	step: number;
	increment: () => void;
	decrement: () => void;
};

const MyCounter = State.component<CounterState>({
	name: "my-counter",
	template: html`
		<div class="counter">
			<button :onclick="decrement()">-</button>
			<span>\${count}</span>
			<button :onclick="increment()">+</button>
			<div>Step: \${step}</div>
		</div>
	`,
	styles: css`
		:host {
			display: inline-block;
		}
		.counter {
			display: flex;
			gap: 1rem;
			align-items: center;
		}
		button {
			padding: 0.5rem 1rem;
			font-size: 1.5rem;
		}
	`,
	state: {
		count: 0,
		step: 1,
	},
})
	.add("increment", (state: CounterState) => {
		state.count += state.step;
	})
	.add("decrement", (state: CounterState) => {
		state.count -= state.step;
	})
	.build();
```

### Helper Functions: `html` and `css`

The `html` and `css` tagged template helpers provide syntax highlighting in TypeScript:

```typescript
import { html, css } from "@jwrunge/manifold";

// Get proper HTML syntax highlighting and IntelliSense
const template = html`
	<div class="card">
		<h2>\${title}</h2>
		<p>\${description}</p>
		<button :onclick="handleClick()">Click me</button>
	</div>
`;

// Get proper CSS syntax highlighting
const styles = css`
	.card {
		border: 1px solid #ccc;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	.card h2 {
		margin-top: 0;
		color: #333;
	}
`;

// Use with components
const MyCard = State.component({
	name: "my-card",
	template: template,
	styles: styles,
}).build();
```

These are simple pass-through functions that return the string, but enable your editor (VS Code, WebStorm, etc.) to apply proper syntax highlighting when using extensions like `lit-html` or `vscode-styled-components`.

### Using `effect()` with Types

The `effect` function automatically tracks dependencies:

```typescript
import { State, effect } from "@jwrunge/manifold";

const state = State.create()
	.add("count", 0)
	.add("userName", "Alice")
	.build();

// Effect runs immediately and whenever dependencies change
effect(() => {
	console.log(`Count is ${state.count}`);
	// Only re-runs when count changes
});

// Conditional dependency tracking
effect(() => {
	if (state.count > 5) {
		console.log(`High count for user: ${state.userName}`);
		// Tracks userName only when count > 5
	}
});
```

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

### State Class

```javascript
import { State } from "@jwrunge/manifold";

// Static method
State.create(name?: string, initialState?: object) // Create new builder instance

// Instance methods (builder pattern)
.add(key: string, value: any) // Add property to state
.add(obj: object) // Add multiple properties at once
.derive(key: string, fn: (state) => any) // Add computed property
.build() // Build and return reactive state
```

### Fetch Helpers

All fetch helpers are available both as imports and directly in template expressions:

```javascript
import { mfGet, mfPost, mfPut, mfDelete, mfPatch, mfHead, mfOptions } from "@jwrunge/manifold";

// Each returns a FetchedContent instance with .replace(), .append(), .prepend() methods
mfGet(url, fetchOps?, defaultOps?) // GET request
mfPost(url, fetchOps?, defaultOps?) // POST request  
mfPut(url, fetchOps?, defaultOps?) // PUT request
mfDelete(url, fetchOps?, defaultOps?) // DELETE request
mfPatch(url, fetchOps?, defaultOps?) // PATCH request
mfHead(url, fetchOps?, defaultOps?) // HEAD request
mfOptions(url, fetchOps?, defaultOps?) // OPTIONS request
```

**Usage in JavaScript:**
```javascript
const state = State.create()
	.add("loadData", () => 
		mfGet("/api/data.html").replace("#content", {
			from: "#payload",
			addTransitionClass: "fade"
		})
	)
	.build();
```

**Usage in templates:**
```html
<button :onclick="mfGet('/snippets/header.html').replace('#content', { from: '#payload' })">Load Header</button>
<button :onclick="mfPost('/api/save', { body: JSON.stringify(data) }).append('#results')">Submit</button>
```

### FetchedContent Methods

```javascript
.replace(to: string, ops?: FetchMergeOptions) // Replace target content
.append(to: string, ops?: FetchMergeOptions) // Append to target
.prepend(to: string, ops?: FetchMergeOptions) // Prepend to target
```

### effect Function

```javascript
import { effect } from "@jwrunge/manifold";

// Run side effects that automatically track dependencies
effect(() => {
	console.log("Count changed:", state.count);
});
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

## Component System

Manifold supports reusable components with two flexible approaches: **HTML-first** (`.mf.html` files) and **TypeScript-first** (defined in code).

### HTML-First Components

Create components in `.mf.html` files with three sections: script, template, and styles.

**Example: `my-input.mf.html`**

```html
<script type="module">
    import { State } from "./dist/manifold.js";

    export default State.component("#my-input")
        .add({
            type: "text",
            value: "",
            label: "Enter text"
        })
        .derive("isEmpty", (state) => state.value.length === 0);
</script>

<template id="my-input">
    <label>
        <span>${label}</span>
        <input :type="type" :sync:value="value" />
    </label>
    <p :if="!isEmpty">You entered: ${value}</p>
</template>

<style>
    label {
        display: flex;
        flex-direction: column;
        margin-bottom: 1rem;
    }
    
    input {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
</style>
```

**Loading and Using:**

```html
<script type="module">
    import { State, useComponent } from "./dist/manifold.js";

    // Load the component
    await useComponent("./my-input.mf.html");

    // Create parent state
    const state = State.create("App")
        .add({ userEmail: "" })
        .build();
</script>

<!-- Use the component -->
<my-input 
    label="Email Address" 
    type="email" 
    :sync:value="userEmail">
</my-input>
<p>Your email: ${userEmail}</p>
```

### TypeScript-First Components

Define components directly in code with full type safety.

```typescript
import { State, html, css } from "./dist/manifold.js";

const MyCounter = State.component({
    name: "my-counter",
    template: html`
        <div class="counter">
            <button @click="count--">−</button>
            <span>\${count}</span>
            <button @click="count++">+</button>
        </div>
    `,
    styles: css`
        .counter {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        button {
            padding: 0.5rem 1rem;
            cursor: pointer;
        }
    `,
    state: { count: 0 }
});

// Register the component
MyCounter.register();
```

### Component Props

**Static Props** - Pass string values directly:
```html
<my-input type="email" label="Email"></my-input>
```

**Reactive Props** - Use `:` prefix for values that update with parent state:
```html
<my-input :type="inputType" :label="emailLabel"></my-input>
```

**Two-Way Binding** - Use `:sync:` to sync state between parent and component:
```html
<my-input :sync:value="userEmail"></my-input>
<!-- Parent automatically knows about changes to userEmail -->
```

### Component Isolation

Each component instance has isolated state by default:

```html
<!-- Three separate counters, each maintains its own state -->
<my-counter></my-counter>
<my-counter></my-counter>
<my-counter></my-counter>
```

Share state between components using `:sync:`:

```html
<!-- All counters share the same count value -->
<my-counter :sync:count="sharedCount"></my-counter>
<my-counter :sync:count="sharedCount"></my-counter>
<p>Shared value: ${sharedCount}</p>
```

### Builder Pattern

Components support chaining with `.add()` and `.derive()`:

```javascript
const EnhancedCounter = State.component({
    name: "enhanced-counter",
    template: html`
        <div>\${count} × 2 = \${doubled}</div>
        <button @click="count++">+</button>
    `,
    state: { count: 0 }
})
    .derive("doubled", (state) => state.count * 2)
    .derive("tripled", (state) => state.count * 3);

EnhancedCounter.register();
```

### Component API

```typescript
// HTML-first: create from template selector
State.component(selector: string)
    .add(key, value)
    .derive(key, fn)

// TS-first: create from config
State.component({
    name: string,        // Custom element tag name
    template: string,    // HTML template
    styles?: string,     // CSS styles
    state?: object      // Initial state
})
    .add(key, value)
    .derive(key, fn)
    .register(tagName?)

// Load HTML-first components
useComponent(url: string, options?: {
    tagName?: string
})

// Template helpers for syntax highlighting
html`<div>...</div>`
css`.class { ... }`
```

### When to Use Each Approach

**HTML-First (`.mf.html`):**
- Rapid prototyping
- Designer-developer collaboration
- Content-heavy components
- Clear separation of concerns

**TypeScript-First:**
- Complex business logic
- Type-safe components
- Reusable utility components
- Integration with TypeScript codebases

See [COMPONENTS.md](COMPONENTS.md) for complete documentation and migration examples.
