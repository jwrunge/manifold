1. ✅ Ensure each loop DOM is updated properly (DON'T re-parse the DOM if the element hasn't changed)
2. ✅ Aggressive shrink and refactor without losing functionality or efficiency. ~~Can we get below 10KB?~~ **Achieved 12.3% reduction** (21.16 kB → 18.40 kB UMD). Removed console logs, dead code, and abstracted repeated patterns while maintaining all functionality. 10KB target was too aggressive without removing features.
3. Performance testing and optimization.
4. Implement the rest of the spec (in spec.md): data-await, data-then, data-process, data-target
5. Animation (using View Transitions API?)
6. Another refactor pass for performance and file size
7. Rigorous testing
8. Automatic registration feature
9. Better way to handle State and function availability and scope in JavaScript/TypeScript?
10. Check for CSP compliance
11. nother refactor pass for performance and file size
12. Rigorous testing
13. Begin speccing out an LSP server
