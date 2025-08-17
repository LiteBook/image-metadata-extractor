# Image Metadata Extractor

A simple web application built with Python (Flask) and JavaScript to upload an image and extract its EXIF metadata.

## Features
- Upload images via file selection or drag & drop.
- Instant image preview.
- Extracts and displays EXIF metadata in a clean table format.
- Uses the powerful `ExifTool` library via a Python wrapper.

## Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/image-metadata-extractor.git
    cd image-metadata-extractor
    ```

2.  **Install ExifTool:**
    - Follow the installation instructions from the [official ExifTool website](https://exiftool.org/).

3.  **Create a virtual environment and install dependencies:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    pip install -r requirements.txt
    ```

## How to Run
1.  Run the Flask application:
    ```bash
    python app.py
    ```
2.  Open your web browser and go to `http://127.0.0.1:5000`.
