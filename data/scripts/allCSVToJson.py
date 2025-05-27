def convert_all_csv_to_json():
    import subprocess
    import os  # Ensure this import is at the top of your file

    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Define the scripts with absolute paths
    scripts = [
        os.path.join(script_dir, "actionHistoryCSVToJson.py"),
        # os.path.join(script_dir, "gardenCSVToJson.py"), #Removed, tools were merged into item csv
        os.path.join(script_dir, "iconCSVToJson.py"),
        os.path.join(script_dir, "itemCSVToJson.py"),
        os.path.join(script_dir, "stocklistCSVToJson.py"),
        os.path.join(script_dir, "storeCSVToJson.py")
    ]

    for script in scripts:
        subprocess.run(["python", script])  # Call each script

convert_all_csv_to_json()