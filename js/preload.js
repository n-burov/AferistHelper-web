// Preload critical data
(async function() {
    // Preload configs.json
    const configUrl = 'https://raw.githubusercontent.com/n-burov/AferistHelper-web/main/configs/configs.json';
    try {
        const response = await fetch(configUrl, { 
            priority: 'low',
            cache: 'force-cache'
        });
        if (response.ok) {
            const data = await response.json();
            // Store in session storage for quick access
            sessionStorage.setItem('preloadedConfigs', JSON.stringify(data));
        }
    } catch (error) {
        console.log('Preload failed, will load normally');
    }
})();
