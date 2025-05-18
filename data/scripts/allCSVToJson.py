def convert_all_csv_to_json():
    import subprocess

    scripts = [
        "actionHistoryCSVToJson.py",
        "gardenCSVToJson.py",
        "iconCSVToJson.py",
        "itemCSVToJson.py",
        "stocklistCSVToJson.py",
        "storeCSVToJson.py"
    ]

    for script in scripts:
        subprocess.run(["python", script])  # Call each script

convert_all_csv_to_json()