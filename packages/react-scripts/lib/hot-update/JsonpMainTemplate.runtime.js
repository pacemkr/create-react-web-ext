/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
/*globals hotAddUpdateChunk parentHotUpdateCallback document XMLHttpRequest $hotChunkFilename$ $hotUpdateManifestUrl$ browser chrome msBrowser */
module.exports = function() {
  function webpackHotUpdateCallback(chunkId, moreModules) {
    // eslint-disable-line no-unused-vars
    hotAddUpdateChunk(chunkId, moreModules);
    if (parentHotUpdateCallback) parentHotUpdateCallback(chunkId, moreModules);
  } //$semicolon

  function hotDownloadUpdateChunk(chunkId) {
    // eslint-disable-line no-unused-vars
    const crossb = browser || chrome || msBrowser;
    const IS_BACKGROUND = !!crossb.extension.getBackgroundPage;
    if (IS_BACKGROUND) {
      crossb.runtime.reload();
    } else {
      // Request hot update from background script, since we can't inject js from content scripts.
      crossb.runtime.sendMessage({
        action: '__hot-update-apply',
        file: $hotChunkFilename$,
      });
    }
  }

  function hotDownloadManifest(requestTimeout) {
    // eslint-disable-line no-unused-vars
    requestTimeout = requestTimeout || 10000;
    return new Promise(function(resolve, reject) {
      if (typeof XMLHttpRequest === 'undefined')
        return reject(new Error('No browser support'));
      try {
        var request = new XMLHttpRequest();
        var requestPath = $hotUpdateManifestUrl$;
        request.open('GET', requestPath, true);
        request.timeout = requestTimeout;
        request.send(null);
      } catch (err) {
        return reject(err);
      }
      request.onreadystatechange = function() {
        if (request.readyState !== 4) return;
        if (request.status === 0) {
          // timeout
          reject(
            new Error('Manifest request to ' + requestPath + ' timed out.')
          );
        } else if (request.status === 404) {
          // no update available
          resolve();
        } else if (request.status !== 200 && request.status !== 304) {
          // other failure
          reject(new Error('Manifest request to ' + requestPath + ' failed.'));
        } else {
          // success
          try {
            var update = JSON.parse(request.responseText);
          } catch (e) {
            reject(e);
            return;
          }
          resolve(update);
        }
      };
    });
  }
};
