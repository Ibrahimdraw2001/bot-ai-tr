document.addEventListener('DOMContentLoaded', function() {
    // تهيئة المتغيرات
    const navItems = document.querySelectorAll('.nav-item');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    const pages = document.querySelectorAll('.page');
    const messageTextarea = document.getElementById('message');
    const sendBtn = document.getElementById('sendBtn');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const statusMessage = document.getElementById('statusMessage');
    const charCounter = document.querySelector('.char-counter');
    const clearBtn = document.querySelector('.btn-secondary');

    // تحميل سجل الرسائل عند بدء التشغيل
    loadMessageHistory();

    // إضافة مستمعي الأحداث للتنقل بين الصفحات
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = item.getAttribute('data-page');
            switchPage(pageName);
        });
    });

    mobileNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = item.getAttribute('data-page');
            switchPage(pageName);
        });
    });

    // دالة تبديل الصفحات
    function switchPage(pageName) {
        // إزالة الفئة النشطة من جميع عناصر التنقل والصفحات
        navItems.forEach(item => item.classList.remove('active'));
        mobileNavItems.forEach(item => item.classList.remove('active'));
        pages.forEach(page => page.classList.remove('active'));

        // إضافة الفئة النشطة للعناصر المحددة
        document.querySelector(`.nav-item[data-page="${pageName}"]`).classList.add('active');
        document.querySelector(`.mobile-nav-item[data-page="${pageName}"]`).classList.add('active');
        document.getElementById(`${pageName}-page`).classList.add('active');

        // إذا تم فتح صفحة السجل، تحميل الرسائل المحفوظة
        if (pageName === 'history') {
            loadMessageHistory();
        }
    }

    // عداد الأحرف
    messageTextarea.addEventListener('input', function() {
        const length = this.value.length;
        charCounter.textContent = `${length}/500`;

        // تغيير لون العداد عند الاقتراب من الحد الأقصى
        if (length > 450) {
            charCounter.style.color = 'var(--error-color)';
        } else if (length > 400) {
            charCounter.style.color = 'var(--warning-color)';
        } else {
            charCounter.style.color = '#999';
        }

        // منع الكتابة بعد الوصول للحد الأقصى
        if (length > 500) {
            this.value = this.value.substring(0, 500);
            charCounter.textContent = '500/500';
        }
    });

    // زر مسح النص
    clearBtn.addEventListener('click', function() {
        messageTextarea.value = '';
        charCounter.textContent = '0/500';
        charCounter.style.color = '#999';
        messageTextarea.focus();
    });

    // إرسال الرسالة
    sendBtn.addEventListener('click', function(e) {
        e.preventDefault();
        sendMessage();
    });

    // إرسال الرسالة عند الضغط على Ctrl+Enter
    messageTextarea.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            sendMessage();
        }
    });

    // دالة إرسال الرسالة
    function sendMessage() {
        const message = messageTextarea.value.trim();

        // إعادة تعيين رسالة الحالة
        statusMessage.classList.add('hidden');
        statusMessage.classList.remove('success', 'error');

        // التحقق من أن الرسالة ليست فارغة
        if (!message) {
            showStatusMessage('الرجاء كتابة رسالة قبل الإرسال.', 'error');
            return;
        }

        // تعطيل زر الإرسال وإظهار حالة التحميل
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';

        // إرسال الرسالة إلى Telegram API
        fetch('https://api.telegram.org/bot8479888702:AAH6YltJUxZSkikjAs1eEshvstF5zTNpODw/sendMessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: '7267939574',
                text: message
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('فشل الإرسال.');
            }
            return response.json();
        })
        .then(data => {
            // حفظ الرسالة في السجل
            saveMessageToHistory(message);

            // إظهار رسالة النجاح
            showStatusMessage('تم إرسال الرسالة بنجاح!', 'success');

            // مسح حقل النص
            messageTextarea.value = '';
            charCounter.textContent = '0/500';
            charCounter.style.color = '#999';

            // إعادة تفعيل الزر
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال';
        })
        .catch(error => {
            console.error('Error:', error);
            showStatusMessage('حدث خطأ أثناء الإرسال.', 'error');

            // إعادة تفعيل الزر
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال';
        });
    }

    // دالة عرض رسالة الحالة
    function showStatusMessage(message, type) {
        statusMessage.textContent = message;
        statusMessage.classList.remove('hidden', 'success', 'error');
        statusMessage.classList.add(type);

        // إخفاء الرسالة بعد 5 ثوانٍ
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 5000);
    }

    // حفظ الرسالة في السجل
    function saveMessageToHistory(message) {
        let messageHistory = JSON.parse(localStorage.getItem('telegramMessageHistory')) || [];

        messageHistory.unshift({
            text: message,
            timestamp: new Date().toISOString()
        });

        // الحفاظ على آخر 50 رسالة فقط
        if (messageHistory.length > 50) {
            messageHistory = messageHistory.slice(0, 50);
        }

        localStorage.setItem('telegramMessageHistory', JSON.stringify(messageHistory));
    }

    // تحميل سجل الرسائل وعرضها
    function loadMessageHistory() {
        const messageHistory = JSON.parse(localStorage.getItem('telegramMessageHistory')) || [];
        const historyContainer = document.querySelector('.message-history');

        // مسح المحتوى الحالي
        historyContainer.innerHTML = '';

        if (messageHistory.length === 0) {
            // عرض رسالة فارغة إذا لم تكن هناك رسائل
            historyContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>لا توجد رسائل مسجلة</p>
                </div>
            `;
        } else {
            // عرض كل رسالة في السجل
            messageHistory.forEach((msg, index) => {
                const messageDate = new Date(msg.timestamp);
                const formattedDate = messageDate.toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const messageItem = document.createElement('div');
                messageItem.className = 'message-item';
                messageItem.innerHTML = `
                    <div class="message-text">${msg.text}</div>
                    <div class="message-time">${formattedDate}</div>
                `;

                // إضافة تأثير ظهور تدريجي
                messageItem.style.animationDelay = `${index * 0.05}s`;

                historyContainer.appendChild(messageItem);
            });
        }
    }

    // مسح سجل الرسائل
    clearHistoryBtn.addEventListener('click', function() {
        if (confirm('هل أنت متأكد من رغبتك في مسح سجل الرسائل؟')) {
            localStorage.removeItem('telegramMessageHistory');
            loadMessageHistory();
        }
    });
});