# Manifold LSP Server

A Language Server Protocol (LSP) implementation for the [Manifold](https://github.com/jwrunge/manifold) reactive templating library. This LSP server provides syntax highlighting, validation, and code completion for Manifold's HTML template syntax.

## Features

### ✅ Implemented Features

-   **Manifold Attribute Validation**: Validates colon-prefixed attributes (`:if`, `:each`, `:onclick`, etc.)
-   **Template String Interpolation**: Validates `${expression}` syntax in HTML templates
-   **Code Completion**: Auto-completion for Manifold attributes when typing `:`
-   **Diagnostic Reporting**: Real-time error and warning reporting for syntax issues
-   **Expression Validation**: Basic syntax validation for JavaScript expressions

### 🔄 Manifold Syntax Support

The LSP server recognizes and validates the following Manifold features:

#### Conditional Rendering

-   `:if="condition"` - Conditional rendering
-   `:elseif="condition"` - Else-if condition
-   `:else` - Else condition

#### List Rendering

-   `:each="items as item"` - Basic iteration
-   `:each="items as item, index"` - Iteration with index
-   `:each="items as {name, age}"` - Object destructuring

#### Async Handling

-   `:await="promise"` - Async await
-   `:then="result"` - Promise success handling
-   `:catch="error"` - Promise error handling

#### Event Handling

-   `:onclick="handler()"` - Click events
-   `:oninput="handler()"` - Input events
-   `:onsubmit="handler()"` - Form submission
-   `:onchange="handler()"` - Change events

#### Attribute Binding

-   `:value="expression"` - Dynamic value binding
-   `:checked="boolean"` - Checkbox/radio binding
-   `:disabled="condition"` - Disabled state
-   `:src="url"`, `:href="link"` - URL attributes

#### Style & Class Binding

-   `:class:active="isActive"` - Conditional CSS classes
-   `:style:color="themeColor"` - Dynamic CSS styles

#### Two-way Binding

-   `:sync:value="property"` - Two-way value sync
-   `:sync:checked="boolean"` - Two-way checkbox sync

#### Animations

-   `:transition="className"` - View transition classes

#### Template Interpolation

-   `${expression}` - JavaScript expression interpolation in text content

## Installation & Usage

### Prerequisites

-   Node.js >= 18.0.0
-   TypeScript

### Build the Server

```bash
npm install
npm run compile
```

### VS Code Extension Integration

To use this LSP server with VS Code, you would typically integrate it into a VS Code extension. The compiled server (`out/server.js`) can be launched by an extension.

Example client configuration:

```typescript
const serverOptions: ServerOptions = {
	run: {
		module: context.asAbsolutePath("out/server.js"),
		transport: TransportKind.ipc,
	},
	debug: {
		module: context.asAbsolutePath("out/server.js"),
		transport: TransportKind.ipc,
		options: { execArgv: ["--nolazy", "--inspect=6009"] },
	},
};

const clientOptions: LanguageClientOptions = {
	documentSelector: [{ scheme: "file", language: "html" }],
	synchronize: {
		configurationSection: "manifoldLsp",
		fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
	},
};
```

### Direct Usage

You can also run the server directly for testing:

```bash
node out/server.js
```

The server communicates via stdin/stdout using the LSP protocol.

## Configuration

The LSP server supports the following configuration options:

```json
{
	"manifoldLsp.maxNumberOfProblems": 1000,
	"manifoldLsp.enableTypeChecking": true
}
```

## Development

### Project Structure

```
├── src/
│   └── server.ts          # Main LSP server implementation
├── out/                   # Compiled JavaScript output
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── .eslintrc.js          # ESLint configuration
```

### Development Commands

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run compile:watch

# Run linting
npm run lint
```

### Testing

The LSP server can be tested using the [LSP Inspector](https://github.com/modelcontextprotocol/inspector) or by integrating it with a VS Code extension for manual testing.

## Architecture

The LSP server is built using the `vscode-languageserver` library and provides:

1. **Text Document Synchronization**: Tracks changes to HTML documents
2. **Diagnostic Provider**: Validates Manifold syntax and reports errors
3. **Completion Provider**: Offers auto-completion for Manifold attributes
4. **Configuration Management**: Handles user settings and preferences

### Key Components

-   **Attribute Validation**: Regex-based parsing to identify and validate Manifold attributes
-   **Expression Parser**: Basic JavaScript expression syntax validation
-   **Completion Engine**: Context-aware completions for Manifold-specific syntax
-   **Error Reporting**: Precise error locations and helpful error messages

## Next Steps & Future Enhancements

### 🚀 Potential Improvements

1. **Advanced Type Checking**

    - Integration with TypeScript compiler API
    - State variable type inference
    - Expression type validation

2. **Enhanced Completions**

    - Context-aware variable suggestions
    - Method parameter hints
    - Smart import suggestions

3. **Refactoring Support**

    - Rename symbols across templates
    - Extract expressions to methods
    - Template component extraction

4. **Documentation Support**

    - Hover information for attributes
    - Links to Manifold documentation
    - Inline help for syntax

5. **VS Code Extension**

    - Package as a full VS Code extension
    - Syntax highlighting themes
    - Snippets and templates

6. **Testing Framework**
    - Unit tests for validation logic
    - Integration tests with LSP client
    - Regression test suite

## Contributing

This LSP server is designed to grow with the Manifold library. Key areas for contribution:

-   Expanding attribute validation rules
-   Improving expression parsing accuracy
-   Adding more sophisticated type checking
-   Creating comprehensive test coverage
-   Building VS Code extension integration

## License

MIT

---

**Note**: This LSP server is independent of the main Manifold library and focuses specifically on providing development tooling support for Manifold's template syntax.
