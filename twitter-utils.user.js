// ==UserScript==
// @name        twitter utils
// @version     1.0
// @namespace   Violentmonkey Scripts
// @include     http*://twitter.com/*
// @include     http*://*.twitter.com/*
// @grant       GM_openInTab
// @run-at      document-start
// ==/UserScript==

const enable_rightClick_openOrig = false;
const enable_mouseOver_preview = true;

const mouseOver_preview_enable_outline = true;
const mouseOver_preview_contained = false;
const mouseOver_preview_centerInThumbnail = false;
const mouseOver_preview_keepVisible = true;
const mouseOver_preview_keepVisible_padding = 5;



function isThumbnailImage(element){
    // if there's a better way to check this, please let me know
    return window.getComputedStyle(element).cursor == "pointer";
}

function get(url, param){
    return new URL(url).searchParams.get(param);
}

function closest(el, predicate) {
    do if (predicate(el)) return el;
    while (el = el && el.parentNode);
}

function calculatePreviewLocation(e){
    let container = closest(e, (el) => {
        let role = el.attributes["role"];
        return role && role.value == "link";
    }) || e;
    let content = mouseOver_preview_centerInThumbnail ? container : e;
    
    let padding = mouseOver_preview_keepVisible_padding;
    
    let scrollY = window.scrollY + padding;
    let scrollX = window.scrollX + padding;
    let vw = document.documentElement.clientWidth - (padding * 2);
    let vh = document.documentElement.clientHeight - (padding * 2);
    let iw = e.naturalWidth;
    let ih = e.naturalHeight;
    let rect = content.getBoundingClientRect();
    
    // logic to fit the image inside the window
    if(mouseOver_preview_contained){
        let containerRect = container.getBoundingClientRect();
        let ratio = Math.max(containerRect.width / iw, containerRect.height / ih);
        iw *= ratio;
        ih *= ratio;
    }
    
    if(mouseOver_preview_keepVisible){
        if(iw > vw || ih > vh){
            let ratio = Math.min(vw / iw, vh / ih);
            iw *= ratio;
            ih *= ratio;
        }
    }
    
    let top = (rect.top + window.scrollY) - ((ih - rect.height) / 2);
    let left = (rect.left + window.scrollX) - ((iw - rect.width) / 2);
    
    if(mouseOver_preview_keepVisible){
        if(top < scrollY) top = scrollY;
        else if(top + ih > scrollY + vh) top = scrollY + vh - ih;
        if(left < scrollX) left = scrollX;
        else if(left + iw > scrollX + vw) left = scrollX + vw - iw;
    }
    
    return {
        x: left,
        y: top,
        width: iw,
        height: ih
    };
}

window.addEventListener("load", function(ev){
    if(enable_rightClick_openOrig){
        document.addEventListener("contextmenu", function(ev){
            let e = ev.target;
            if(e.tagName == "IMG"){
                let format = get(e.src, "format");
                let url = e.src.split("?")[0] + "?format=" + format + "&name=orig";
                
                GM_openInTab(url, true);
                
                ev.preventDefault();
                ev.stopPropagation();
                return false;
            }
        });
    }
    
    const uncroppedThumbnail = "uncropped-thumbnail";
    if(enable_mouseOver_preview){
        document.addEventListener("mouseover", function(ev){
            let e = ev.target;
            if(e.tagName == "IMG" && !e.classList.contains(uncroppedThumbnail) && isThumbnailImage(e)){
                let url = e.src;
                
                let loc = calculatePreviewLocation(e);
                
                // create the uncropped thumbnail preview and add it to the page
                let img = document.createElement("img");
                img.classList.add(uncroppedThumbnail);
                img.src = url;
                img.style.position = "absolute";
                img.style.left = loc.x + "px";
                img.style.top = loc.y + "px";
                img.style.width = loc.width + "px";
                img.style.height = loc.height + "px";
                img.style.zIndex = "2147483647";
                img.style.pointerEvents = "none";
                
                if(mouseOver_preview_enable_outline){
                    img.style.outline = "1px solid rgb(133, 156, 173)";
                }
                
                document.body.appendChild(img);
                
                function removeImg(){
                    updating = false;
                    img.parentNode.removeChild(img);
                }
                
                let updating = true;
                function update(){
                    // if element is not visible (or removed from the DOM?)
                    if(e.offsetParent === null)
                        removeImg();
                    
                    if(updating){
                        let loc = calculatePreviewLocation(e);
                        img.style.left = loc.x + "px";
                        img.style.top = loc.y + "px";
                        img.style.width = loc.width + "px";
                        img.style.height = loc.height + "px";
                        window.requestAnimationFrame(update);
                    }
                }
                window.requestAnimationFrame(update);
                
                e.addEventListener("mouseout", removeImg);
            }
        });
    }
});
