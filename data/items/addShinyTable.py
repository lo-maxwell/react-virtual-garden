import json

# Load the items.json file
with open('data/items/Items.json', 'r', encoding='utf-8') as file:
    items = json.load(file)

# Iterate through each plant and add transformShinyIds
for plant in items['PlacedItems']['Plants']:
    original_transform_id = plant['transformId']
    base_transform_id = original_transform_id[:-1]  # Remove last digit

    plant['transformShinyIds'] = {
        'bronze': {
            'id': f"{base_transform_id}1",  # Change last digit to 1
            'probability': 0.6
        },
        'silver': {
            'id': f"{base_transform_id}2",  # Change last digit to 2
            'probability': 0.3
        },
        'gold': {
            'id': f"{base_transform_id}3",  # Change last digit to 3
            'probability': 0.1
        }
    }

# Write the updated items back to the file
with open('data/items/Items.json', 'w', encoding='utf-8') as file:
    json.dump(items, file, ensure_ascii=False, indent=2)