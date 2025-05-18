import csv
import json

# Define the input and output file paths
icon_file_path = '../user/icons.csv'
json_file_path = '../final/temp/Icons.json'

# Initialize the data structure for JSON output
data = {
	"Icons": {
		"Error": [],
		"Plants": [],
		"Decorations": []
	}
}

with open(icon_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)

    # Process each row in the CSV
    for row in csv_reader:
        icon = {
            "name": row["name"],
            "icon": row["icon"]
        }
        data["Icons"][row["type"]].append(icon)

# Write the JSON data to the output file
with open(json_file_path, mode='w', encoding='utf-8') as json_file:
    json.dump(data, json_file, ensure_ascii=False, indent=4)

print("Icon CSV has been converted to JSON format successfully.")