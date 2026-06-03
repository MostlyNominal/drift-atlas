# Method reference

| Method | Input | Repeat unit | Key outputs |
|--------|-------|-------------|-------------|
| KF | manual JSON/CSV | each entry | water_content_ppm |
| PSD | vendor text export | each row | D10/D50/D90, span |
| GranuTap | vendor export | each row | bulk/tapped density, Hausner, Carr |
| GranuDrum/Flow | .ini (mode from content) | each section | angle/cohesion/roughness vs speed |
| FT4 | .prb (kept) + CSV summary | each test | BFE, SI, FRI, cohesion |
| ASEM | full particle export | each particle | ECD, circularity, chemistry, oxide/contaminant flags |
| DSC/TGA | text table | curve points | HF & weight vs T/t, mass change |
| XRD | file or manual table | each phase | fraction, FWHM, crystallite size |
| SEM | images + sidecars | each image | thumbnails, metadata |
| EBSD | file + comments | dataset | registered file + notes |
