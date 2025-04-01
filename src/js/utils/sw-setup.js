(function(){
    // Отключаем регистрацию Service Worker для интеграции в iframe
    // В рамках iframe использование Service Worker может вызвать проблемы
    if(false && 'serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('./pwa/sw.js')
            .then(function() {
                console.log("Service Worker Registered");
            });
    }

    let pwaRequest = {};
    let pwaInstalled = true;

    window.PWATracker = { getRequest: () => pwaRequest, getInstalled: () => pwaInstalled };

    window.addEventListener('beforeinstallprompt', function(e) {
        pwaInstalled = false;
        e.preventDefault();
        pwaRequest = e;
    });

}());