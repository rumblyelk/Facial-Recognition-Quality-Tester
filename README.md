# Facial-Recognition-Quality-Tester

### CLI usage

```bash
node frqt.js path-to-photos list-of-sizes-to-downscale-to
```
Example:
```bash
node frqt.js test-data/ "[540, 260, 90]"
```

### Image directories
The path to photos provided above should lead to a directory which contains subdirectories of the faces, each subdirectory containing a single identity's pictures. See `test-data/` for reference.
