import csv
import json
import os  # Ensure this import is at the top of your file

# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Define the input and output file paths with absolute paths
icon_file_path = os.path.join(script_dir, '../user/final/icons.csv')
json_file_path = os.path.join(script_dir, '../final/temp/Icons.json')

# Initialize the data structure for JSON output
data = {
	"Icons": {
		"Error": [],
        "Ground": [],
		"Plants": [],
        "Eggs": [],
		"Decorations": [],
        "Tools": [],
        "Utilities": [],
        "Other": []
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