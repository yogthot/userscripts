// ==UserScript==
// @name        twitter utils
// @namespace   Violentmonkey Scripts
// @include     http*://twitter.com/*
// @grant       GM_openInTab
// @run-at      document-start
// ==/UserScript==

const enable_rightClick_openOrig = false;
const enable_mouseOver_preview = true;

const mouseOver_preview_enable_border = true;


function get(url, param){
    return new URL(url).searchParams.get(param);
}

function isThumbnailImage(element){
    // if there's a better way to check this, please let me know
    return window.getComputedStyle(element).cursor == "pointer";
}

window.addEventListener("load", function(ev){
    if(enable_rightClick_openOrig){
        document.addEventListener("contextmenu", function(ev){
            let e = ev.target;
            if(e.tagName == "IMG"){
                let format = get(e.src, "format");
                let url = e.src.split("?")[0] + "." + format + ":orig";
                
                GM_openInTab(url, true);
                
                ev.preventDefault();
                ev.stopPropagation();
                return false;
            }
        });
    }
    
    const uncroppedThumbnail = "uncropped-thumbnail";
    const padding = 5;
    if(enable_mouseOver_preview){
        document.addEventListener("mouseover", function(ev){
            let e = ev.target;
            if(e.tagName == "IMG" && !e.classList.contains(uncroppedThumbnail) && isThumbnailImage(e)){
                let url = e.src;
                
                // cleanup any images that may have been left behind
                let old = document.getElementsByClassName(uncroppedThumbnail);
                for(let oldImg of old){
                    oldImg.parentNode.removeChild(oldImg);
                }
                
                let scrollY = window.scrollY + padding;
                let scrollX = window.scrollX + padding;
                let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) - (padding * 2);
                let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) - (padding * 2);
                let iw = e.naturalWidth;
                let ih = e.naturalHeight;
                let rect = e.getBoundingClientRect();
                
                // logic to fit the image inside the window
                let ratio = 1;
                if(iw > vw || ih > vh){
                    let ratio = Math.min(vw / iw, vh / ih);
                    iw *= ratio;
                    ih *= ratio;
                }
                
                let top = (rect.top + window.scrollY) - ((ih - e.height) / 2);
                let left = (rect.left + window.scrollX) - ((iw - e.width) / 2);
                
                if(top < scrollY) top = scrollY;
                else if(top + ih > scrollY + vh) top = scrollY + vh - ih;
                if(left < scrollX) left = scrollX;
                else if(left + iw > scrollX + vw) top = scrollX + vw - iw;
                
                // create the uncropped thumbnail preview and add it to the page
                let img = document.createElement("img");
                img.classList.add(uncroppedThumbnail);
                img.src = url;
                img.style.position = "absolute";
                img.style.top = top + "px";
                img.style.left = left + "px";
                img.style.width = iw + "px";
                img.style.height = ih + "px";
                img.style.zIndex = "2147483647";
                img.style.pointerEvents = "none";
                e.addEventListener("mouseout", () => img.parentNode.removeChild(img));
                
                if(mouseOver_preview_enable_border){
                    img.style.border = "1px solid rgb(133, 156, 173)";
                    img.style.borderRadius = "0px";
                }
                
                document.body.appendChild(img);
            }
        });
    }
});
