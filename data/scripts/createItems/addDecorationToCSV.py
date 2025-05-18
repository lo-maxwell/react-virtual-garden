import csv
import copy
import os

decorationData = {
    "name": "goose",
    "icon": "🪿",
    "category": "Normal",
    "item": "Goose",
    "idSuffix": "00",
    "description": "Error",
    "value": 50000,
    "level": 0
}


def categoryToId(category):
    category_map = {
        "Normal": "01",
        "Bountiful": "02",
        "Speedy": "03",
        "Protective": "04",
        "Error": "99"
    }
    if category not in category_map:
        raise ValueError(f"Category '{category}' not found")
    return category_map[category]

def itemToId(item, category):
    decoration_map = {
        "Normal": {
            "Bench": "01",
            "Flamingo": "02",
            "Construction Sign": "03",
            "Potted Plant": "04",
            "Goose": "05"
        },
        "Bountiful": {
        },
        "Speedy": {
        },
        "Protective": {
        },
        "Error": {
            "Error": "99"
        }
    }
    
    if category not in decoration_map or item not in decoration_map[category]:
        raise ValueError(f"Item '{item}' not found in category '{category}'")
    return decoration_map[category][item]  # Default to "00" if item or category not found


def generateId(type, subtype, category, item, variant):
    id = ''
    if (type == 'PlacedItem'):
        id += '0-'
    elif (type == 'InventoryItem'):
        id += '1-'
    else:
        raise ValueError("Invalid type")

    if (subtype == 'Ground'):
        id += '00-'
    elif (subtype == 'Seed'):
        id += '01-'
    elif (subtype == 'Plant'):
        id += '02-'
    elif (subtype == 'HarvestedItem'):
        id += '03-'
    elif (subtype == 'Decoration'):
        id += '04-'
    elif (subtype == 'Blueprint'):
        id += '05-'
    else:
        raise ValueError("Invalid subtype")
    
    id += categoryToId(category) + '-'

    id += itemToId(item, category) + '-'

    id += variant

    return id

decorationData["type"] = "PlacedItem"
decorationData["subtype"] = "Decoration"
decorationData["id"] = generateId(decorationData["type"], decorationData["subtype"], decorationData["category"], decorationData["item"], decorationData["idSuffix"])

blueprintData = copy.deepcopy(decorationData)
blueprintData["type"] = "InventoryItem"
blueprintData["subtype"] = "Blueprint"
blueprintData["id"] = generateId(blueprintData["type"], blueprintData["subtype"], blueprintData["category"], blueprintData["item"], blueprintData["idSuffix"])

blueprintData["transformId"] = decorationData["id"]
decorationData["transformId"] = blueprintData["id"]

def addDecorationToCSV(decorationData):
     # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Construct the absolute path to the decorations.csv file
    absolute_path = os.path.join(script_dir, '../../items/placedItems/temp/decorations.csv')
    with open(absolute_path, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([
            decorationData["id"],
            decorationData["name"],
            decorationData["icon"],
            decorationData["type"],
            decorationData["subtype"],
            decorationData["category"],
            decorationData["description"],
            decorationData["value"],
            decorationData["level"],
            decorationData["transformId"],
        ])

def addBlueprintToCSV(blueprintData):
    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Construct the absolute path to the decorations.csv file
    absolute_path = os.path.join(script_dir, '../../items/inventoryItems/temp/blueprints.csv')
    with open(absolute_path, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([
            blueprintData["id"],
            blueprintData["name"],
            blueprintData["icon"],
            blueprintData["type"],
            blueprintData["subtype"],
            blueprintData["category"],
            blueprintData["description"],
            blueprintData["value"],
            blueprintData["level"],
            blueprintData["transformId"],
        ])

addDecorationToCSV(decorationData)

addBlueprintToCSV(blueprintData)

