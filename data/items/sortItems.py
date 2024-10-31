import json

def sort_items_by_id(data):
    # Sort each sub-array by 'id'
    for category in data['PlacedItems']:
        data['PlacedItems'][category] = sorted(data['PlacedItems'][category], key=lambda x: x['id'])
    
    for category in data['InventoryItems']:
        data['InventoryItems'][category] = sorted(data['InventoryItems'][category], key=lambda x: x['id'])

    return data

def main():
    # Load the JSON data from the file
    with open('data/items/Items.json', 'r', encoding='utf-8') as file:
        data = json.load(file)

    # Sort the items by id
    sorted_data = sort_items_by_id(data)

    # Save the sorted data back to the file, ensuring emojis are preserved
    with open('data/items/Sorted_Items.json', 'w', encoding='utf-8') as file:
        json.dump(sorted_data, file, indent=4, ensure_ascii=False)

if __name__ == "__main__":
    main()