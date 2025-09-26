// Shared terser options used by Vite and post-build minifier to avoid drift.
export default {
	compress: {
		module: true,
		toplevel: true,
		passes: 3,
		pure_getters: true,
		unsafe_arrows: true,
		unsafe_methods: true,
		unused: true,
		// additional aggressive optimizations used in post-build
		reduce_vars: true,
		reduce_funcs: true,
		hoist_funs: true,
		hoist_vars: true,
		booleans_as_integers: true,
	},
	mangle: { toplevel: true },
	format: { comments: false },
};
