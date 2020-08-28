chrome.tabs.getSelected(null, function (tab) {
  /**
   * Base URL for API calls
   */
  const API_URL = 'http://localhost:3000/api/v1/url?q=';

  /**
   * Copies retrieved url to clipboard
   */
  function copyToClipboard(url) {
    navigator.clipboard.writeText(url);
  }

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
              copyToClipboard(result);
              result = 'Copied to clipboard\n' + result;
            }

            alert(result);

            /**
             * Clean up
             */
            window.close();
          }
        );
      }
    })
    .catch((e) => {
      console.log(e);
      alert('Could not get your short url at this time. Sorry.');
    });
});
