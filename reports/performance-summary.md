# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

# Manifold Performance Summary

- Date: 2025-08-18T03:29:30.028Z
- Node: v24.5.0
- Platform: linux x64

| Test | Duration (ms) | Ops | ms/op | Ops/sec | Effect runs | Avg (ms) | Med (ms) | P95 (ms) | P99 (ms) | Min/Max (ms) | CPU u/s (ms) | Mem start/end/Δ (MB) | GC? |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:--:|
| Basic State Operations | 103.57 | 1000 | 0.1036 | 9655 | 2 | 0.0623 | 0.0229 | 0.0229 | 0.0229 | 0.0229/0.1018 | 5.0/0.0 | 37.40/37.85/0.45 |  |
| Derived State Performance | 50.69 | 500 | 0.1014 | 9864 | 2 | 0.0113 | 0.0016 | 0.0016 | 0.0016 | 0.0016/0.0211 | 1.3/0.0 | 38.04/38.12/0.08 |  |
| Hierarchical Effects Performance | 100.55 | 200 | 0.5028 | 1989 | 6 | 0.0082 | 0.0046 | 0.0088 | 0.0088 | 0.0022/0.0255 | 0.5/0.0 | 38.21/38.25/0.04 |  |
| Mass State Updates Stress Test | 201.29 | 2000 | 0.1006 | 9936 | 100 | 0.0010 | 0.0007 | 0.0013 | 0.0034 | 0.0006/0.0250 | 1.7/0.0 | 38.39/38.72/0.33 |  |
| Deep Object Nesting Stress Test | 152.82 | 1000 | 0.1528 | 6544 | 4 | 0.0195 | 0.0060 | 0.0297 | 0.0297 | 0.0031/0.0392 | 2.7/0.0 | 38.83/40.92/2.09 |  |
| Circular Dependency Stress Test | 306.28 | 20 | 15.3142 | 65 | 84 | 0.0018 | 0.0011 | 0.0036 | 0.0086 | 0.0004/0.0231 | 2.9/0.0 | 41.02/41.38/0.36 |  |
| Rapid State Changes Stress Test | 155.89 | 5000 | 0.0312 | 32073 | 51 | 0.0018 | 0.0011 | 0.0027 | 0.0039 | 0.0004/0.0215 | 2.6/0.0 | 41.48/41.68/0.20 |  |
| Effect Cleanup Performance | 102.79 | 1000 | 0.1028 | 9728 | 2500 | 0.0003 | 0.0002 | 0.0004 | 0.0010 | 0.0001/0.0378 | 4.8/0.0 | 41.80/43.93/2.13 |  |
| Hierarchical Mode | 100.58 | 1000 | 0.1006 | 9942 | 4 | 0.0177 | 0.0036 | 0.0174 | 0.0174 | 0.0003/0.0496 | 0.7/0.0 | 44.43/44.48/0.05 |  |
| Performance Mode | 100.42 | 1000 | 0.1004 | 9958 | 4 | 0.0112 | 0.0033 | 0.0040 | 0.0040 | 0.0002/0.0373 | 0.0/0.4 | 44.50/44.54/0.04 |  |

