"""Produce un Agentflow V2 portátil para orientación del Portal."""
import argparse
import json
from pathlib import Path

from openpyxl import load_workbook


def build(schema, workbook, knowledge):
    graph = json.loads(schema.read_text(encoding="utf-8"))
    sheet = load_workbook(workbook, read_only=True, data_only=True).worksheets[0]
    expected = {
        str(row[0])
        for row in sheet.values
        if row and str(row[0]).startswith("VEC-PL-")
    }
    cards = json.loads(knowledge.read_text(encoding="utf-8"))
    if len(cards) != len(expected) or {card["id"] for card in cards} != expected:
        raise ValueError("Las fichas operativas deben corresponder al inventario del Excel")
    for card in cards:
        card["area"] = card["id"].split("-")[2]
    code = Path(__file__).with_name("orientacion.js").read_text(encoding="utf-8")
    render = graph["nodes"][1]["data"]["inputs"]
    render["customFunctionJavascriptFunction"] = (
        f"{code}\nreturn answer($flow.input, {json.dumps(cards, ensure_ascii=False)});\n"
    )
    return graph


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workbook", type=Path)
    parser.add_argument("knowledge", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    graph = build(Path(__file__).with_name("esquema.json"), args.workbook, args.knowledge)
    args.output.write_text(json.dumps(graph, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
