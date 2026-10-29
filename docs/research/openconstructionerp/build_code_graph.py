"""Generate a static dependency graph from OpenConstructionERP manifests/imports.
No upstream code is imported or executed. Only the sparse checkout is read.
Usage: python3 build_code_graph.py /absolute/path/to/OpenConstructionERP
"""
import ast
import json
import pathlib
import subprocess
import sys
from collections import Counter

source = pathlib.Path(sys.argv[1]).resolve()
root = source / "backend/app/modules"
out = pathlib.Path(__file__).parent
commit = subprocess.check_output(["git", "-C", str(source), "rev-parse", "HEAD"], text=True).strip()
modules = {}
for path in sorted(root.glob("*/manifest.py")):
    tree = ast.parse(path.read_text(encoding="utf-8"))
    for node in tree.body:
        if not isinstance(node, ast.Assign):
            continue
        if not any(isinstance(x, ast.Name) and x.id == "manifest" for x in node.targets):
            continue
        values = {x.arg: x.value for x in node.value.keywords}
        try:
            name = ast.literal_eval(values["name"])
            deps = ast.literal_eval(values["depends"])
        except (ValueError, KeyError):
            continue
        cross = Counter()
        for module_file in path.parent.rglob("*.py"):
            try:
                text = ast.parse(module_file.read_text(encoding="utf-8"))
            except (SyntaxError, UnicodeDecodeError):
                continue
            for call in ast.walk(text):
                if isinstance(call, ast.ImportFrom) and (call.module or "").startswith("app.modules."):
                    target = call.module.split(".")[2]
                    if target != path.parent.name:
                        cross[target] += 1
        modules[path.parent.name] = {
            "module_id": name,
            "declared_dependencies": deps,
            "observed_cross_module_import_statements": dict(cross.most_common()),
            "manifest_source": str(path.relative_to(source)),
        }
        break
payload = {
    "upstream": "datadrivenconstruction/OpenConstructionERP",
    "upstream_sha": commit,
    "method": "Python AST manifest declarations and static cross-module imports; no runtime graph",
    "scope": "ONLY modules included in the sparse local checkout",
    "modules": modules,
}
(out / "CODE_GRAPH.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
shown = ("projects", "documents", "submittals", "daily_diary", "field_diary",
         "inspections", "rfi", "changeorders", "boq", "progress", "cde",
         "transmittals", "quality_concept", "requirements", "fieldreports")
lookup = {v["module_id"]: k for k, v in modules.items()}
lines = ["flowchart LR", '  classDef heavy fill:#fff2cc,stroke:#ae7c05',
         '  classDef light fill:#eaf3ff,stroke:#456fa8']
for name in shown:
    if name in modules:
        lines.append(f'  {name}["{name}"]')
        lines.append(f'  class {name} ' + ("heavy" if name in ("quality_concept","boq","cde") else "light"))
for name in shown:
    if name not in modules:
        continue
    declared = [lookup[x] for x in modules[name]["declared_dependencies"] if x in lookup]
    for target in declared:
        if target in shown:
            lines.append(f'  {name} -->|manifest| {target}')
    for target, count in modules[name]["observed_cross_module_import_statements"].items():
        if target in shown and target not in declared and count >= 2:
            lines.append(f'  {name} -.->|imports {count}| {target}')
(out / "CODE_GRAPH.mmd").write_text("\n".join(lines) + "\n")
print(f"Graph generated for {len(modules)} checked-out modules at {commit[:12]}")
