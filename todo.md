1. ✅ Ensure each loop DOM is updated properly (DON'T re-parse the DOM if the element hasn't changed)

# Manifold TODO

## High Priority

1. ✅ **Efficient data-each DOM updates** - Implement virtual diffing algorithm for each-loops to minimize DOM manipulation by reusing existing elements and only updating what changed.

2. ✅ **Aggressive code shrinking** - Remove all debug statements, abstract repeated patterns, optimize bundle size while maintaining functionality. (Achieved 12.3% reduction: 21.16 kB → 18.40 kB UMD)

3. ✅ **Performance testing and optimization** - Create comprehensive performance test suite, identify bottlenecks, and implement optimizations. All tests passing with efficient batching and virtual diffing.

4. Implement the rest of the spec (in spec.md): data-await, data-then, data-process, data-target
5. Animation (using View Transitions API?)
6. Another refactor pass for performance and file size
7. Rigorous testing
8. Automatic registration feature
9. Better way to handle State and function availability and scope in JavaScript/TypeScript?
10. Check for CSP compliance
11. Let's think through an LSP server
