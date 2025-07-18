import { State } from "./State";
import { attributeParser } from "./attribute-parser";

// Example usage of the attribute parser

// Create some global state
const userState = new State({
	name: "John Doe",
	isLoggedIn: true,
	profile: {
		email: "john@example.com",
		settings: {
			theme: "dark",
		},
	},
});

const productsState = new State([
	{ name: "Laptop", price: 999, inStock: true },
	{ name: "Mouse", price: 25, inStock: false },
	{ name: "Keyboard", price: 75, inStock: true },
]);

// Register global variables
attributeParser.addGlobalVariable("user", userState);
attributeParser.addGlobalVariable("products", productsState);

// Example HTML that would be parsed:
/*
<div data-scope="user as currentUser">
	<div data-if="currentUser.isLoggedIn">
		Welcome back, ${currentUser.name}!
		
		<div data-scope="currentUser.profile as profile">
			<p>Email: ${profile.email}</p>
			<p>Theme: ${profile.settings.theme}</p>
		</div>
	</div>
	<div data-else>
		Please log in
	</div>
	
	<ul>
		<li data-each="products as product">
			<span data-if="product.inStock">${product.name} - $${product.price}</span>
			<span data-else>Out of stock: ${product.name}</span>
		</li>
		<li data-else>No products available</li>
	</ul>
</div>
*/

// Parse all elements in the document
// attributeParser.parseContainer();

console.log("Attribute parser initialized and ready to parse elements!");

export { userState, productsState };
