// ==UserScript==
// @name url rewrite
// @namespace Violentmonkey Scripts
// @match *://*/*
// @grant unsafeWindow
// @run-at document-start
// ==/UserScript==


(function() {
    let rewrite_map = [
        [/^https?:\/\/pastebin\.com\/([a-zA-Z0-9]+)$/, "https://pastebin.com/raw.php?i=$1"],
    ];
    
    let url = window.location.href;
    
    console.log(url);
    
    for(let i = 0; i < rewrite_map.length; i++){
        let rewrite = rewrite_map[i][0];
        let replace = rewrite_map[i][1];
        if(rewrite.test(url)) {
            window.location.href = url.replace(rewrite, replace);
            return;
        }
    }
})();

