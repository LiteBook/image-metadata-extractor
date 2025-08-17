import os
from flask import Flask, request, jsonify, render_template
import exiftool
import logging

# বেসিক লগিং কনফিগার করা হলো, যাতে কোনো সমস্যা হলে টার্মিনালে দেখা যায়
logging.basicConfig(level=logging.INFO)

# Flask অ্যাপ ইনিশিয়ালাইজ করা
app = Flask(__name__)

# ব্যবহারকারীর আপলোড করা ফাইল অস্থায়ীভাবে রাখার জন্য একটি ফোল্ডার নির্দিষ্ট করা
# এই ফোল্ডারটি যদি না থাকে, তাহলে স্বয়ংক্রিয়ভাবে তৈরি হবে
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- রাউট (Routes) ---

# 1. হোমপেজ দেখানোর জন্য মূল রাউট
@app.route('/')
def index():
    """
    অ্যাপ্লিকেশনের হোমপেজ রেন্ডার করে।
    এটি 'templates' ফোল্ডার থেকে 'index.html' ফাইলটি পরিবেশন করবে।
    """
    return render_template('index.html')

# 2. ছবি আপলোড এবং মেটাডেটা প্রসেস করার জন্য API রাউট
@app.route('/upload', methods=['POST'])
def upload_image():
    """
    POST রিকোয়েস্টের মাধ্যমে পাঠানো ছবি গ্রহণ করে, 
    এর EXIF মেটাডেটা বের করে এবং JSON হিসেবে ফেরত পাঠায়।
    """
    # প্রথমে পরীক্ষা করা হচ্ছে যে রিকোয়েস্টে 'image' নামে কোনো ফাইল আছে কিনা
    if 'image' not in request.files:
        logging.error("No image part in the request")
        return jsonify({"error": "No image part in the request"}), 400
    
    file = request.files['image']

    # যদি ব্যবহারকারী কোনো ফাইল সিলেক্ট না করে ব্রাউজার থেকে সাবমিট করে
    if file.filename == '':
        logging.warning("No image selected for uploading")
        return jsonify({"error": "No image selected"}), 400

    if file:
        # ফাইলটি 'uploads' ফোল্ডারে সেভ করা
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        try:
            file.save(filepath)
            logging.info(f"Image saved temporarily to {filepath}")

            # pyexiftool ব্যবহার করে মেটাডেটা এক্সট্র্যাক্ট করা
            with exiftool.ExifToolHelper() as et:
                # get_metadata একটি লিস্ট রিটার্ন করে, তাই আমরা প্রথম আইটেমটি নেব
                metadata_list = et.get_metadata(filepath)
                if metadata_list:
                    metadata = metadata_list[0]
                    logging.info(f"Successfully extracted metadata for {file.filename}")
                    return jsonify(metadata)
                else:
                    logging.warning(f"No metadata found for {file.filename}")
                    return jsonify({"error": "No metadata could be extracted"}), 404

        except Exception as e:
            # কোনো অপ্রত্যাশিত সমস্যা হলে সার্ভার এরর রিটার্ন করবে
            logging.error(f"An error occurred: {e}")
            return jsonify({"error": str(e)}), 500
        
        finally:
            # try-except ব্লক শেষ হওয়ার পর এই অংশটি সবসময় রান করবে
            # কাজ শেষে আপলোড করা ছবিটি ডিলিট করে দেওয়া হচ্ছে
            if os.path.exists(filepath):
                os.remove(filepath)
                logging.info(f"Temporary file {filepath} deleted")

    return jsonify({"error": "An unknown error occurred"}), 500


# --- অ্যাপ রান করার জন্য ---
if __name__ == '__main__':
    # debug=True দিলে কোডে কোনো পরিবর্তন করলে সার্ভার নিজে থেকেই রিস্টার্ট হবে
    app.run(debug=True)
