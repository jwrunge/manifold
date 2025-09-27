import {
	type CompletionItem,
	CompletionItemKind,
	createConnection,
	type Diagnostic,
	DiagnosticSeverity,
	DidChangeConfigurationNotification,
	type InitializeParams,
	type InitializeResult,
	ProposedFeatures,
	type TextDocumentPositionParams,
	TextDocumentSyncKind,
	TextDocuments,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true,
				triggerCharacters: [":"],
			},
		},
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true,
			},
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(
			DidChangeConfigurationNotification.type,
			undefined
		);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders((_event) => {
			connection.console.log("Workspace folder change event received.");
		});
	}
});

// Example settings interface
interface ManifoldSettings {
	maxNumberOfProblems: number;
	enableTypeChecking: boolean;
}

// Default settings
const defaultSettings: ManifoldSettings = {
	maxNumberOfProblems: 1000,
	enableTypeChecking: true,
};
let globalSettings: ManifoldSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ManifoldSettings>> = new Map();

connection.onDidChangeConfiguration((change) => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ManifoldSettings>(
			(change.settings.languageServerExample || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<ManifoldSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: "manifoldLsp",
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose((e) => {
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	const settings = await getDocumentSettings(textDocument.uri);
	const text = textDocument.getText();
	const diagnostics: Diagnostic[] = [];

	// Look for Manifold-specific syntax patterns
	validateManifoldAttributes(text, textDocument, diagnostics, settings);
	validateInterpolationExpressions(text, textDocument, diagnostics, settings);

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

function validateManifoldAttributes(
	text: string,
	document: TextDocument,
	diagnostics: Diagnostic[],
	settings: ManifoldSettings
): void {
	// Manifold colon attributes pattern: :if, :each, :onclick, etc.
	const manifoldAttrPattern = /(:[\w-]+(?::[\w-]+)*)\s*=\s*"([^"]*)"/g;
	let match = manifoldAttrPattern.exec(text);

	while (match && diagnostics.length < settings.maxNumberOfProblems) {
		const [fullMatch, attribute, value] = match;
		const attrName = attribute.substring(1); // Remove the colon

		// Check for known Manifold attributes
		const knownAttrs = [
			"if",
			"elseif",
			"else",
			"each",
			"await",
			"then",
			"catch",
			"onclick",
			"oninput",
			"onsubmit",
			"onchange",
			"value",
			"checked",
			"disabled",
			"src",
			"alt",
			"href",
			"class",
			"style",
			"sync",
			"transition",
		];

		// Handle nested attributes like :class:active or :style:color
		const baseName = attrName.split(":")[0];
		const isKnownAttr =
			knownAttrs.includes(baseName) ||
			knownAttrs.some((attr) => attrName.startsWith(`${attr}:`));

		if (!isKnownAttr) {
			const diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Warning,
				range: {
					start: document.positionAt(match.index),
					end: document.positionAt(match.index + attribute.length),
				},
				message: `Unknown Manifold attribute: ${attribute}`,
				source: "manifold-lsp",
			};
			diagnostics.push(diagnostic);
		}

		// Validate attribute-specific syntax
		if (baseName === "each" && value) {
			validateEachSyntax(
				value,
				match.index + fullMatch.indexOf(value),
				document,
				diagnostics
			);
		} else if (baseName === "if" || baseName === "elseif") {
			validateExpressionSyntax(
				value,
				match.index + fullMatch.indexOf(value),
				document,
				diagnostics
			);
		}

		match = manifoldAttrPattern.exec(text);
	}
}

function validateEachSyntax(
	value: string,
	offset: number,
	document: TextDocument,
	diagnostics: Diagnostic[]
): void {
	// :each syntax: "items as item" or "items as item, index"
	const eachPattern = /^(.+?)\s+as\s+(.+)$/;
	const match = value.match(eachPattern);

	if (!match) {
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Error,
			range: {
				start: document.positionAt(offset),
				end: document.positionAt(offset + value.length),
			},
			message:
				'Invalid :each syntax. Expected format: "array as item" or "array as item, index"',
			source: "manifold-lsp",
		};
		diagnostics.push(diagnostic);
		return;
	}

	const [, , destructure] = match;

	// Validate destructuring pattern
	if (destructure.includes(",")) {
		// Check for valid "item, index" pattern
		const parts = destructure.split(",").map((p) => p.trim());
		if (parts.length !== 2) {
			const diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Error,
				range: {
					start: document.positionAt(
						offset + value.indexOf(destructure)
					),
					end: document.positionAt(
						offset + value.indexOf(destructure) + destructure.length
					),
				},
				message:
					'Invalid destructuring in :each. Expected format: "item, index"',
				source: "manifold-lsp",
			};
			diagnostics.push(diagnostic);
		}
	}
}

function validateInterpolationExpressions(
	text: string,
	document: TextDocument,
	diagnostics: Diagnostic[],
	settings: ManifoldSettings
): void {
	// Template interpolation pattern: ${expression}
	const interpolationPattern = /\$\{([^}]+)\}/g;
	let match = interpolationPattern.exec(text);

	while (match && diagnostics.length < settings.maxNumberOfProblems) {
		const [fullMatch, expression] = match;
		validateExpressionSyntax(
			expression,
			match.index + fullMatch.indexOf(expression),
			document,
			diagnostics
		);
		match = interpolationPattern.exec(text);
	}
}

function validateExpressionSyntax(
	expression: string,
	offset: number,
	document: TextDocument,
	diagnostics: Diagnostic[]
): void {
	const trimmed = expression.trim();

	// Basic syntax validation
	if (!trimmed) {
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Error,
			range: {
				start: document.positionAt(offset),
				end: document.positionAt(offset + expression.length),
			},
			message: "Empty expression",
			source: "manifold-lsp",
		};
		diagnostics.push(diagnostic);
		return;
	}

	// Check for unmatched parentheses/brackets
	const parens = { "(": 0, "[": 0, "{": 0 };
	for (const char of trimmed) {
		if (char === "(") parens["("]++;
		else if (char === ")") parens["("]--;
		else if (char === "[") parens["["]++;
		else if (char === "]") parens["["]--;
		else if (char === "{") parens["{"]++;
		else if (char === "}") parens["{"]--;
	}

	const unmatched = Object.entries(parens).find(([_, count]) => count !== 0);
	if (unmatched) {
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Error,
			range: {
				start: document.positionAt(offset),
				end: document.positionAt(offset + expression.length),
			},
			message: `Unmatched ${
				unmatched[0] === "("
					? "parenthesis"
					: unmatched[0] === "["
					? "bracket"
					: "brace"
			}`,
			source: "manifold-lsp",
		};
		diagnostics.push(diagnostic);
	}
}

connection.onCompletion(
	(textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		const document = documents.get(textDocumentPosition.textDocument.uri);
		if (!document) return [];

		const position = textDocumentPosition.position;
		const text = document.getText();
		const offset = document.offsetAt(position);

		// Check if we're in an attribute context (after a colon)
		const beforeCursor = text.substring(0, offset);
		const lastColon = beforeCursor.lastIndexOf(":");
		const lastSpace = Math.max(
			beforeCursor.lastIndexOf(" "),
			beforeCursor.lastIndexOf("\n"),
			beforeCursor.lastIndexOf("\t")
		);

		if (lastColon > lastSpace) {
			// We're completing a Manifold attribute
			return getManifoldAttributeCompletions();
		}

		return [];
	}
);

function getManifoldAttributeCompletions(): CompletionItem[] {
	const attributes = [
		// Conditional rendering
		{
			label: "if",
			detail: "Conditional rendering",
			kind: CompletionItemKind.Property,
		},
		{
			label: "elseif",
			detail: "Else-if condition",
			kind: CompletionItemKind.Property,
		},
		{
			label: "else",
			detail: "Else condition",
			kind: CompletionItemKind.Property,
		},

		// List rendering
		{
			label: "each",
			detail: 'List rendering - "array as item"',
			kind: CompletionItemKind.Property,
		},

		// Async handling
		{
			label: "await",
			detail: "Async await",
			kind: CompletionItemKind.Property,
		},
		{
			label: "then",
			detail: "Promise success",
			kind: CompletionItemKind.Property,
		},
		{
			label: "catch",
			detail: "Promise error",
			kind: CompletionItemKind.Property,
		},

		// Event handlers
		{
			label: "onclick",
			detail: "Click event handler",
			kind: CompletionItemKind.Event,
		},
		{
			label: "oninput",
			detail: "Input event handler",
			kind: CompletionItemKind.Event,
		},
		{
			label: "onchange",
			detail: "Change event handler",
			kind: CompletionItemKind.Event,
		},
		{
			label: "onsubmit",
			detail: "Submit event handler",
			kind: CompletionItemKind.Event,
		},

		// Attribute binding
		{
			label: "value",
			detail: "Bind value attribute",
			kind: CompletionItemKind.Property,
		},
		{
			label: "checked",
			detail: "Bind checked attribute",
			kind: CompletionItemKind.Property,
		},
		{
			label: "disabled",
			detail: "Bind disabled attribute",
			kind: CompletionItemKind.Property,
		},
		{
			label: "src",
			detail: "Bind src attribute",
			kind: CompletionItemKind.Property,
		},
		{
			label: "href",
			detail: "Bind href attribute",
			kind: CompletionItemKind.Property,
		},

		// Style and class binding
		{
			label: "class:active",
			detail: "Conditional CSS class",
			kind: CompletionItemKind.Property,
		},
		{
			label: "style:color",
			detail: "Dynamic CSS style",
			kind: CompletionItemKind.Property,
		},

		// Two-way binding
		{
			label: "sync:value",
			detail: "Two-way value binding",
			kind: CompletionItemKind.Property,
		},
		{
			label: "sync:checked",
			detail: "Two-way checked binding",
			kind: CompletionItemKind.Property,
		},

		// Animations
		{
			label: "transition",
			detail: "View transition class",
			kind: CompletionItemKind.Property,
		},
	];

	return attributes;
}

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	// Add more detailed documentation for specific attributes
	switch (item.label) {
		case "each":
			item.documentation =
				'Renders a list of items. Syntax: "array as item" or "array as item, index"';
			item.insertText = 'each="items as item"';
			break;
		case "if":
			item.documentation =
				"Conditionally renders element based on expression";
			item.insertText = 'if="expression"';
			break;
		case "onclick":
			item.documentation =
				"Handles click events. Can use arrow functions or method calls";
			item.insertText = 'onclick="handleClick()"';
			break;
	}
	return item;
});

// Diagnostic provider for pull diagnostics - removed due to API compatibility
// The push-based diagnostics in validateTextDocument are sufficient

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
