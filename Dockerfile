# 1. বেস ইমেজ হিসেবে একটি হালকা পাইথন ইমেজ ব্যবহার করা হচ্ছে
FROM python:3.9-slim

# 2. সিস্টেম প্যাকেজ লিস্ট আপডেট করা এবং exiftool ইনস্টল করা
#    এখানে RUN কমান্ডটি root ইউজার হিসেবে চলে
RUN apt-get update && apt-get install -y libimage-exiftool-perl && \
    # অপ্রয়োজনীয় ফাইল মুছে ফেলে ইমেজ সাইজ কমানো হচ্ছে
    rm -rf /var/lib/apt/lists/*

# 3. অ্যাপ্লিকেশনের জন্য একটি ওয়ার্কিং ডিরেক্টরি তৈরি করা
WORKDIR /app

# 4. requirements.txt ফাইলটি কপি করা এবং প্যাকেজগুলো ইনস্টল করা
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. প্রজেক্টের বাকি সব ফাইল কন্টেইনারে কপি করা
COPY . .

# 6. কন্টেইনারটি রান হলে কোন কমান্ডটি চলবে তা নির্দিষ্ট করা
#    Render ডাইনামিক PORT ব্যবহার করে, তাই $PORT ব্যবহার করতে হবে
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "app:app"]
