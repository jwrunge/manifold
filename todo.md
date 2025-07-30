1. ✅ Ensure each loop DOM is updated properly (DON'T re-parse the DOM if the element hasn't changed)

# Manifold TODO

## High Priority

1. ✅ **Efficient data-each DOM updates** - Implement virtual diffing algorithm for each-loops to minimize DOM manipulation by reusing existing elements and only updating what changed.

2. ✅ **Aggressive code shrinking** - Remove all debug statements, abstract repeated patterns, optimize bundle size while maintaining functionality. (Achieved 12.3% reduction: 21.16 kB → 18.40 kB UMD)

3. ✅ **Performance testing and optimization** - Create comprehensive performance test suite, identify bottlenecks, and implement optimizations. All tests passing with efficient batching and virtual diffing.

4. **Better error messages** - Improve error reporting throughout the framework with more descriptive messages and debugging information.

5. **Advanced each-loop features** - Add support for keyed loops, nested loops, and complex iteration patterns.

6. **State persistence** - Add built-in support for localStorage/sessionStorage persistence with automatic serialization.

7. **Component composition** - Design a lightweight component system that works with the current state management.

8. **TypeScript improvements** - Better type inference and stricter typing throughout the codebase.

9. **Documentation and examples** - Comprehensive docs with interactive examples and best practices guide.

10. **Testing infrastructure** - Expand test coverage and add integration tests.
11. Performance testing and optimization.
12. Implement the rest of the spec (in spec.md): data-await, data-then, data-process, data-target
13. Animation (using View Transitions API?)
14. Another refactor pass for performance and file size
15. Rigorous testing
16. Automatic registration feature
17. Better way to handle State and function availability and scope in JavaScript/TypeScript?
18. Check for CSP compliance
