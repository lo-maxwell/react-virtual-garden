def convert_all_csv_to_json():
    import subprocess
    import os  # Ensure this import is at the top of your file

    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Define the scripts with absolute paths
    scripts = [
        os.path.join(script_dir, "cleanCSVs.py"),
        os.path.join(script_dir, "copyTempToFinal.py"),
        os.path.join(script_dir, "allCSVToJson.py")
    ]

    for script in scripts:
        subprocess.run(["python", script])  # Call each script

convert_all_csv_to_json()