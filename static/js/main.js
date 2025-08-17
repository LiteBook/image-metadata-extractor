// নিশ্চিত করা হচ্ছে যে পুরো HTML ডকুমেন্ট লোড হওয়ার পরেই এই স্ক্রিপ্টটি রান হবে
document.addEventListener('DOMContentLoaded', () => {
    
    // --- প্রয়োজনীয় HTML এলিমেন্টগুলো সিলেক্ট করা ---
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const metadataResult = document.getElementById('metadata-result');
    const spinner = document.getElementById('spinner');
    const dropText = document.getElementById('drop-text');

    // --- ইভেন্ট লিসেনার সেটআপ ---

    // 1. ড্রপ এরিয়াতে ক্লিক করলে ফাইল ইনপুটটি খোলার ব্যবস্থা
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });

    // 2. ব্যবহারকারী ফাইল সিলেক্ট করলে
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    });

    // 3. ড্র্যাগ অ্যান্ড ড্রপ ইভেন্টগুলো পরিচালনা করা
    // ব্রাউজারের ডিফল্ট আচরণ বন্ধ করা আবশ্যক
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // 4. ড্র্যাগ করার সময় ভিজ্যুয়াল ফিডব্যাক দেওয়া
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.remove('drag-over');
        }, false);
    });

    // 5. ফাইল ড্রপ করা হলে
    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0]; // প্রথম ফাইলটি নেওয়া হচ্ছে
        if (file) {
            handleFile(file);
        }
    });


    // --- মূল ফাংশনগুলো ---

    /**
     * ফাইল প্রসেস করার মূল ফাংশন।
     * এটি ছবির প্রিভিউ দেখায় এবং সার্ভারে ফাইল পাঠায়।
     * @param {File} file - ব্যবহারকারীর সিলেক্ট করা বা ড্রপ করা ফাইল।
     */
    function handleFile(file) {
        // শুধুমাত্র ইমেজ ফাইল গ্রহণ করা হচ্ছে কিনা তা পরীক্ষা করা
        if (!file.type.startsWith('image/')) {
            alert('অনুগ্রহ করে একটি ইমেজ ফাইল আপলোড করুন।');
            return;
        }

        // 1. ইমেজ প্রিভিউ দেখানো
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            previewContainer.style.display = 'block';
        }
        reader.readAsDataURL(file);

        // 2. পুরনো রেজাল্ট ও টেক্সট মুছে ফেলা এবং স্পিনার দেখানো
        metadataResult.innerHTML = '';
        dropText.textContent = 'প্রসেসিং চলছে...';
        spinner.style.display = 'block';

        // 3. সার্ভারে ফাইল পাঠানো
        const formData = new FormData();
        formData.append('image', file); // 'image' কী (key) ব্যবহার করা হয়েছে যা Flask এ আশা করা হচ্ছে

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                // সার্ভার থেকে কোনো এরর এলে (যেমন 400 বা 500)
                throw new Error(`সার্ভার থেকে সমস্যা: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            spinner.style.display = 'none'; // স্পিনার লুকানো
            if (data.error) {
                // যদি ব্যাকএন্ড কোনো এরর মেসেজ পাঠায়
                throw new Error(data.error);
            }
            displayMetadata(data);
            dropText.textContent = 'অন্য একটি ছবি আপলোড করুন';
        })
        .catch(error => {
            spinner.style.display = 'none'; // স্পিনার লুকানো
            metadataResult.innerHTML = `<p style="color: red; text-align: center;">একটি সমস্যা হয়েছে: ${error.message}</p>`;
            dropText.textContent = 'এখানে ইমেজ ড্র্যাগ করুন অথবা ক্লিক করে আপলোড করুন';
            console.error('Error:', error);
        });
    }

    /**
     * সার্ভার থেকে পাওয়া মেটাডেটা সুন্দরভাবে টেবিলে প্রদর্শন করে।
     * @param {Object} data - মেটাডেটা অবজেক্ট।
     */
    function displayMetadata(data) {
        if (!data || Object.keys(data).length === 0) {
            metadataResult.innerHTML = '<p style="text-align: center;">এই ছবিতে কোনো মেটাডেটা পাওয়া যায়নি।</p>';
            return;
        }

        let tableHTML = '<table><thead><tr><th>বৈশিষ্ট্য (Property)</th><th>মান (Value)</th></tr></thead><tbody>';
        
        // প্রতিটি মেটাডেটা কী-ভ্যালু জোড়ার জন্য একটি টেবিল রো তৈরি করা
        for (const key in data) {
            // কিছু অপ্রয়োজনীয় বা বাইনারি ডেটা বাদ দেওয়া যেতে পারে
            if (key !== 'SourceFile' && key !== 'ThumbnailImage') {
                 tableHTML += `<tr><td>${key}</td><td>${data[key]}</td></tr>`;
            }
        }

        tableHTML += '</tbody></table>';
        metadataResult.innerHTML = tableHTML;
    }
});
