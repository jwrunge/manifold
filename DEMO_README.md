# Manifold Demo Files

This directory contains demonstration files showing how to use the Manifold reactive state management library.

## Files Overview

### 📚 Documentation

-   **getting-started.html** - Simple introduction to Manifold concepts
-   **demo.html** - Comprehensive demo with advanced features
-   **simple.ts** - Basic TypeScript example
-   **demo.ts** - Full-featured TypeScript implementation

## Quick Start

1. **Start with the basics:**
   Open `getting-started.html` in your browser to see the fundamental concepts of Manifold:

    - Creating reactive state
    - Computed values
    - HTML data attribute binding

2. **Explore advanced features:**
   Open `demo.html` for a comprehensive showcase including:
    - Object and array reactivity
    - Conditional rendering
    - Dynamic lists
    - Expression evaluation
    - Theme switching

## Key Concepts Demonstrated

### 🔄 Reactive State

```typescript
const count = new State(0);
const name = createState("World");
```

### 📊 Computed Values

```typescript
const greeting = new State(() => `Hello, ${name.value}!`);
const doubleCount = new State(() => count.value * 2);
```

### ⚡ Effects

```typescript
count.effect(() => {
	console.log("Count changed:", count.value);
});
```

### 🌐 HTML Binding

```html
<!-- Display reactive values -->
<span data-bind="textContent: count.value">0</span>

<!-- Conditional rendering -->
<div data-if="count.value > 5">Count is greater than 5!</div>
<div data-else>Count is 5 or less</div>

<!-- Two-way binding -->
<input data-sync="name" placeholder="Enter name" />

<!-- Dynamic lists -->
<ul>
	<li data-each="items as item, index" data-bind="textContent: item"></li>
</ul>
```

## Data Attributes Reference

| Attribute      | Purpose                             | Example                                |
| -------------- | ----------------------------------- | -------------------------------------- |
| `data-bind`    | Bind element property to expression | `data-bind="textContent: message"`     |
| `data-sync`    | Two-way binding for inputs          | `data-sync="username"`                 |
| `data-if`      | Conditional rendering               | `data-if="count > 0"`                  |
| `data-else-if` | Alternative condition               | `data-else-if="count < 0"`             |
| `data-else`    | Fallback condition                  | `data-else`                            |
| `data-each`    | Repeat for array items              | `data-each="items as item, index"`     |
| `data-scope`   | Create scoped variables             | `data-scope="x: value, y: otherValue"` |

## Running the Demos

### Development Server

If you have a development server setup:

```bash
# Start your dev server (e.g., with Vite, webpack, etc.)
npm run dev
# Then open http://localhost:3000/getting-started.html
```

### Static Files

You can also open the HTML files directly in your browser, though TypeScript compilation may be needed:

```bash
# Compile TypeScript files first
npx tsc simple.ts --target es2020 --module es2020
npx tsc demo.ts --target es2020 --module es2020

# Then open the HTML files in your browser
```

## Features Highlighted

-   ✅ **Automatic UI Updates** - Changes to state automatically update the DOM
-   ✅ **Computed Properties** - Derived values that recalculate when dependencies change
-   ✅ **Conditional Rendering** - Show/hide elements based on conditions
-   ✅ **List Rendering** - Dynamic lists that update when arrays change
-   ✅ **Two-way Binding** - Form inputs stay in sync with state
-   ✅ **Expression Evaluation** - Rich expressions with operators, conditionals, property access
-   ✅ **Theme Support** - Dynamic theming based on state
-   ✅ **Performance** - Only updates what actually changed

## Next Steps

After exploring these demos:

1. **Read the main README.md** for full API documentation
2. **Check the test files** in `src/tests/` for more examples
3. **Integrate into your project** using the patterns shown here

## Browser Compatibility

The demos work in modern browsers that support:

-   ES2020+ features
-   ES Modules
-   Proxy objects

For older browser support, you may need to compile/transpile the TypeScript files.
