# Static Code Graph: OpenConstructionERP → PTO research

**Upstream commit:** 6032873c58e930e420af3d7fd483b61ea1b246d3. **Scope:** 20 checked-out source modules; this diagram displays 15.

Arrows labelled **manifest** are declared module dependencies. Dashed **imports N** arrows count Python `from app.modules...` import statements in selected files (not calls or runtime events). External modules and most of the ERP are intentionally omitted from the drawing; the full declared dependency lists and observed imports are in [CODE_GRAPH.json](CODE_GRAPH.json).

## Source-derived graph

```mermaid
flowchart LR
  classDef heavy fill:#fff2cc,stroke:#ae7c05
  classDef light fill:#eaf3ff,stroke:#456fa8
  projects["projects"]
  class projects light
  documents["documents"]
  class documents light
  submittals["submittals"]
  class submittals light
  daily_diary["daily_diary"]
  class daily_diary light
  field_diary["field_diary"]
  class field_diary light
  inspections["inspections"]
  class inspections light
  rfi["rfi"]
  class rfi light
  changeorders["changeorders"]
  class changeorders light
  boq["boq"]
  class boq heavy
  progress["progress"]
  class progress light
  cde["cde"]
  class cde heavy
  transmittals["transmittals"]
  class transmittals light
  quality_concept["quality_concept"]
  class quality_concept heavy
  requirements["requirements"]
  class requirements light
  fieldreports["fieldreports"]
  class fieldreports light
  projects -.->|imports 20| documents
  projects -.->|imports 8| boq
  projects -.->|imports 5| rfi
  projects -.->|imports 4| fieldreports
  projects -.->|imports 3| changeorders
  projects -.->|imports 2| inspections
  projects -.->|imports 2| requirements
  documents -->|manifest| projects
  documents -.->|imports 3| cde
  submittals -->|manifest| projects
  submittals -.->|imports 2| documents
  daily_diary -->|manifest| projects
  field_diary -->|manifest| projects
  field_diary -.->|imports 3| inspections
  inspections -->|manifest| projects
  rfi -->|manifest| projects
  rfi -.->|imports 4| changeorders
  changeorders -->|manifest| projects
  changeorders -->|manifest| boq
  boq -->|manifest| projects
  boq -.->|imports 4| documents
  progress -->|manifest| projects
  progress -->|manifest| boq
  cde -->|manifest| projects
  cde -->|manifest| documents
  transmittals -->|manifest| projects
  quality_concept -->|manifest| projects
  quality_concept -->|manifest| requirements
  quality_concept -.->|imports 3| cde
  quality_concept -.->|imports 3| daily_diary
  quality_concept -.->|imports 2| submittals
  quality_concept -.->|imports 2| inspections
  requirements -->|manifest| projects
  requirements -.->|imports 3| boq
  fieldreports -->|manifest| projects
  fieldreports -.->|imports 2| documents
```

## Most important coupling observations

- The lightweight `daily_diary` and `submittals` manifests each declare only projects and users, but their source code also imports other subsystems; independent copy/paste would be misleading.
- The `progress` manifest depends on `boq`, which is large and internally imports many modules. Prefer implementing a small local quantity reconciliation contract.
- The `cde` manifest directly depends on `documents`, and its service also uses versioning and approval systems. Its role-based published-state gate cannot be safely reduced to a local checkbox.
- `quality_concept` has many governance and commissioning dependencies. Treat its evidence-linking and state-machine approach as architectural reference, not a drop-in АОСР compliance engine.

## Reproduce

Run the sibling [build_code_graph.py](build_code_graph.py) against the pinned sparse checkout. It parses manifests and imports without executing upstream software. See the [phased integration plan](INTEGRATION_PLAN.md) and the original [AGPL-3.0 license](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/LICENSE).
