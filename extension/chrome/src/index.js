chrome.tabs.getSelected(null, function (tab) {
  /**
   * Base URL for API calls
   */
  const API_URL = 'http://localhost:3000/api/v1/url?q=';

  /**
   * Retrieved short url from API
   */
  let retrievedUrl = null;

  /**
   * Copies retrieved url to clipboard
   */
  function copyToClipboard(e) {
    if (!retrievedUrl) return;

    e.preventDefault();

    if (e.clipboardData) {
      e.clipboardData.setData('text/plain', retrievedUrl);
    } else if (window.clipboardData) {
      window.clipboardData.setData('Text', retrievedUrl);
    }
  }

  window.addEventListener('copy', copyToClipboard);

  const req = API_URL + encodeURI(tab.url);
  fetch(req)
    .then((response) => response.json())
    .then((json) => {
      if (json.data) {
        let result = json.data.url;

        // Auto copy to clipboard if setting is true
        chrome.storage.sync.get(
          {
            autocopy: false,
          },
          function (items) {
            if (items.autocopy === true) {
              document.execCommand('copy');
              result = 'Copied to clipboard\n' + result;
            }

            alert(result);

            /**
             * Clean up
             */
            window.removeEventListener('copy', copyToClipboard);
            window.close();
          }
        );
      }
    })
    .catch((e) => alert(e));
});
