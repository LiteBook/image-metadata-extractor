import os
from flask import Flask, request, jsonify, render_template
import exiftool
import logging

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        logging.error("No image part in the request")
        return jsonify({"error": "No image part in the request"}), 400
    
    file = request.files['image']

    if file.filename == '':
        logging.warning("No image selected for uploading")
        return jsonify({"error": "No image selected"}), 400

    if file:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        try:
            file.save(filepath)
            logging.info(f"Image saved temporarily to {filepath}")

            with exiftool.ExifToolHelper() as et:
                metadata_list = et.get_metadata(filepath)
                if metadata_list:
                    metadata = metadata_list[0]
                    logging.info(f"Successfully extracted metadata for {file.filename}")
                    return jsonify(metadata)
                else:
                    logging.warning(f"No metadata found for {file.filename}")
                    return jsonify({"error": "No metadata could be extracted"}), 404

        except Exception as e:
            logging.error(f"An error occurred: {e}")
            return jsonify({"error": str(e)}), 500
        
        finally:
            if os.path.exists(filepath):
                os.remove(filepath)
                logging.info(f"Temporary file {filepath} deleted")

    return jsonify({"error": "An unknown error occurred"}), 500

if __name__ == '__main__':
    app.run(debug=True)
