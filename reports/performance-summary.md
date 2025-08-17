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

- Date: 2025-08-17T03:51:08.552Z
- Node: v24.5.0
- Platform: linux x64

| Test | Duration (ms) | Ops | ms/op | Ops/sec | Effect runs | Avg (ms) | Med (ms) | P95 (ms) | P99 (ms) | Min/Max (ms) | CPU u/s (ms) | Mem start/end/Δ (MB) | GC? |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:--:|
| Basic State Operations | 105.24 | 1000 | 0.1052 | 9502 | 2 | 0.1025 | 0.0147 | 0.0147 | 0.0147 | 0.0147/0.1904 | 4.3/0.8 | 38.59/39.06/0.47 |  |
| Derived State Performance | 50.71 | 500 | 0.1014 | 9860 | 2 | 0.0078 | 0.0015 | 0.0015 | 0.0015 | 0.0015/0.0141 | 1.2/0.1 | 39.23/39.31/0.08 |  |
| Hierarchical Effects Performance | 102.53 | 200 | 0.5127 | 1951 | 6 | 0.0113 | 0.0058 | 0.0196 | 0.0196 | 0.0028/0.0275 | 0.7/0.0 | 39.40/39.46/0.06 |  |
| Mass State Updates Stress Test | 201.66 | 2000 | 0.1008 | 9918 | 100 | 0.0013 | 0.0007 | 0.0024 | 0.0037 | 0.0006/0.0228 | 1.6/0.0 | 39.59/39.91/0.33 |  |
| Deep Object Nesting Stress Test | 153.97 | 1000 | 0.1540 | 6495 | 4 | 0.0214 | 0.0080 | 0.0282 | 0.0282 | 0.0049/0.0445 | 5.1/3.9 | 40.02/36.49/-3.53 |  |
| Circular Dependency Stress Test | 304.68 | 20 | 15.2341 | 66 | 83 | 0.0027 | 0.0010 | 0.0034 | 0.0275 | 0.0004/0.0788 | 2.6/0.1 | 36.59/36.95/0.35 |  |
| Rapid State Changes Stress Test | 152.51 | 5000 | 0.0305 | 32785 | 51 | 0.0015 | 0.0006 | 0.0023 | 0.0026 | 0.0005/0.0291 | 2.5/0.0 | 37.04/37.24/0.20 |  |
| Effect Cleanup Performance | 101.42 | 1000 | 0.1014 | 9860 | 2500 | 0.0003 | 0.0002 | 0.0004 | 0.0007 | 0.0001/0.0193 | 4.8/0.0 | 37.36/39.44/2.08 |  |
| Hierarchical Mode | 100.61 | 1000 | 0.1006 | 9939 | 4 | 0.0194 | 0.0042 | 0.0209 | 0.0209 | 0.0002/0.0523 | 0.7/0.0 | 39.94/39.99/0.04 |  |
| Performance Mode | 100.45 | 1000 | 0.1004 | 9955 | 4 | 0.0114 | 0.0032 | 0.0039 | 0.0039 | 0.0002/0.0382 | 0.4/0.0 | 40.01/40.05/0.05 |  |

