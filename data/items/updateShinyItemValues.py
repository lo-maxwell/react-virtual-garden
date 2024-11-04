import json

# Define the multipliers for shiny items
multipliers = {
    "Bronze": 2,
    "Silver": 5,
    "Gold": 10
}

# Load the JSON data from the file
with open('data/items/Items.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Access the HarvestedItems list
harvested_items = data['InventoryItems']['HarvestedItems']

# Update the values of shiny items based on the multipliers
for item in harvested_items:
    # Check if the item is a shiny version
    for shiny_name, multiplier in multipliers.items():
        if shiny_name in item['name']:
            # Find the base item (e.g., "garlic" for "Bronze garlic")
            base_item_name = item['name'].replace(shiny_name, "").strip()  # Remove shiny prefix
            base_item = next((i for i in harvested_items if i['name'] == base_item_name), None)
            if base_item is not None:
                item['value'] = base_item['value'] * multiplier

# Save the updated items back to the JSON file
with open('data/items/Items.json', 'w', encoding='utf-8') as file:
    json.dump(data, file, ensure_ascii=False, indent=4)

print("Updated shiny item values successfully.")