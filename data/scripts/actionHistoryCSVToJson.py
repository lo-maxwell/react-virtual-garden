import csv
import json
import os  # Ensure this import is at the top of your file

# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Construct absolute paths for the input and output files
history_file_path = os.path.join(script_dir, '../user/actionHistories.csv')
json_file_path = os.path.join(script_dir, '../final/temp/ActionHistories.json')

# Initialize the data structure for JSON output
data = {
    "ActionHistories": []
}

with open(history_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)

    # Process each row in the CSV
    for row in csv_reader:
        history = {
            "name": row["name"],
            "description": row["description"],
			"identifier": row["identifier"],
        }
        data["ActionHistories"].append(history)

# Write the JSON data to the output file
with open(json_file_path, mode='w', encoding='utf-8') as json_file:
    json.dump(data, json_file, ensure_ascii=False, indent=4)

print("Action History CSV has been converted to JSON format successfully.")