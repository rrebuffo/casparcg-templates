/*

    TEMPLATE HELPERS
    by Mauro Rebuffo
    https://mehir.ar
    https://github.com/rrebuffo

*/

// THIS CONTAINS THE WHOLE TEMPLATE AND HANDLE MARGINS
const lout = document.getElementById("mainlayout");

// CURRENT TEMPLATE DATA
let jsdata;

// LAYOUT VARIABLES
let offset = 0;
let margin = 0;
let height = 0;
let offset_top = 54;
let offset_bottom = 54;
let offset_left = 96;
let offset_right = 96;

// STATUS VARIABLES
let preview_mode = false;
let boundings = false;
let playAfterLoad = false;
let fcu = false;
let tpl_init = false;
let media_path = '';
let font_path = '../../../font/'
let position = "BL";
let elements = [];
let texts = [];
let loops = [];

let frametime = 0;
let prevtime = 0;

//#region HELPER FUNCTIONS

function getValue(obj, prop)
{
    return Number(window.getComputedStyle(obj).getPropertyValue(prop).replace(/px/g, ''));
}

function getWidth(v)
{
    return String((Number(v)/1920)*100+"vw");
}

function getHeight(v)
{
    return String((Number(v)/1080)*100+"vh")
}

function getMediaUrl(v,e = "png")
{
    return "url('"+getMediaPath(v,e)+"')";
}


function getMediaPath(v,e = "png")
{
    var _media = jsdata.hasOwnProperty(v) ? jsdata[v] : "";
    return "file:///"+media_path.replace(/\\/g, '/')+_media+"."+e;
}

function getColor(color)
{
    if(color.indexOf('#')>=0) return color;
    if(color.indexOf("0x"==0)) return "#"+color.substr(2);
    return "#"+color;
}

function getGradient(gradient, alpha = 1, direction = 0)
{
    if(gradient.indexOf('|')>0)
    {
        var input = gradient.split('|')
        var colors = [];
        input.forEach(v => colors.push(getColor(v)));
        return "linear-gradient("+direction+"deg, "+hexToRgbA(colors[0],alpha)+" 0%, "+hexToRgbA(colors[1],alpha)+" 100%)";
    }
}

function getShadow(size,color)
{
    return "0 "+getHeight(Number(Math.abs(size)/3))+" "+getHeight(Number(Math.abs(size)))+getColor(color)+((Number(size)<0) ? " inset" : "");
}

function getFont(font)
{
    if(font.indexOf("@">0)) return font.substring(0,font.indexOf("@"));
    else return font;
}

function getWeight(font)
{
    if(font.indexOf("@">0)) return font.substring(font.indexOf("@")+1);
    else return "400";
}

function getAlign(align)
{
    switch(align)
    {
        case "l":
        case "left":
        default:
            return "left";
        case "c":
        case "center":
            return "center";
        case "r":
        case "right":
            return "right";
    }
}

function playElements()
{
    if(preview_mode) return;
    if(!tpl_init)
    {
        playAfterLoad = true;
        return;
    }
    changeClassProperty(".container","opacity",1);
    setupLoops();
    texts.forEach((text) => { text.play(); });
}

function stopElements()
{
    if(preview_mode) return;
    loops.forEach((loop) => { loop.stop(); });
    texts.forEach((text) => { text.stop(); });
}

function checkTextChange()
{
    texts.forEach((text) => {
        if(text.changed)
        {
            if(preview_mode) text.set(false);
            else textChanged(text);
        }
    });
}

function textChanged(text)
{
    text.set(!preview_mode);
    text.changed = false;
    if(fcu)
    {
        gsap.fromTo(text.container,{opacity:1},{opacity:0,duration:.1, ease:"power1.in",delay:.05, onComplete: () => { text.revert(); } });
        gsap.fromTo(text.altcontainer,{opacity:0},{opacity:1, duration:.1, ease:"power1.out"});
    }
    else
    {
        text.stop(true);
        text.play(true);
    }
}

function preview ()
{
    loops.forEach((loop) => {
        loop.element.style.opacity = 1;
        loop.element.currentTime = loop.loop_in;
    });
    changeClassProperty(".container","opacity",1);
    texts.forEach((text) => {
        text.element.opacity = 1;
    });
}

function initElements()
{
    loadFonts();
}

function loadFonts()
{
    for(f=0;f<texts.length;f++)
    {
        var family = 'sans-serif';
        if(texts[f].font != "")
        {
            family = 'font_'+(f+1);
            texts[f].fontFace = new FontFace(family, "url('" + font_path + texts[f].font + ".ttf'), url('" + font_path + texts[f].font + ".otf')", {});
            document.fonts.add(texts[f].fontFace);
            texts[f].fontFace.load();
        }
        texts[f].fontFamily = family+", color-emoji"
    }
    document.fonts.ready.then(continueInit);
}

function continueInit()
{
    loops.forEach(loop => loop.setup());
    texts.forEach(text => text.setup());
    if(preview_mode) preview();
    postData();
}

function postData()
{
    tpl_init = true;
    if(position == "BL" || position == "BC" || position == "BR") gsap.set(elements,{css:{marginBottom:getHeight(offset)}});
    if(preview_mode) document.body.className = boundings ? "boundings" : "";
    if(playAfterLoad) playElements();
}

function getData(data)
{
    fcu = false;
    if(data.indexOf("<")==0) jsdata = parseXML(data);
    else jsdata = JSON.parse(data);
}

function h(p) { return jsdata.hasOwnProperty(p); }
function n(p) { return Number(jsdata[p]); }
function s(p) { return jsdata[p]; }
function b(p) { return jsdata[p] == "true" ? true : false; }

function parseXML(data)
{
    //console.warn("Data is sent as XML. Enable 'Send as JSON' for better performance.");
    if (!window.DOMParser) return null;
    var xmldata = new DOMParser().parseFromString(data,"text/xml").documentElement.childNodes;
    var jsdata = {};
    for (i = 0; i < xmldata.length; i++)
    {
        var id = xmldata[i].getAttribute("id");
        var value = xmldata[i].childNodes[0].getAttribute("value");
        jsdata[id] = value;
    }
    return jsdata;
}

function changeClassProperty(target, property, value)
{
    var elements = document.querySelectorAll(target);
    for(i = 0; i < elements.length; i++)
    {
        elements[i].style[property] = value;
    }
}

function hexToRgbA(hex,alpha)
{
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex))
    {
        c= hex.substring(1).split('');
        if(c.length== 3)
        {
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
}

function fitText(text, parent, size, minSize = 16, vertical = false)
{
    var te = text;
    var tc = parent;
    var ts = getValue(te,'font-size');
    var tw = te.scrollWidth, th = te.scrollHeight;
    var cw = tc.clientWidth, ch = tc.clientHeight;
    var ms = minSize;

    var hs = Math.min(Math.max(minSize, (cw / tw) * ts), size);
    var vs = Math.min(Math.max(minSize, (ch / th) * ts), size);
    var ns = (vertical && hs > vs) ? vs : hs;
    te.style.fontSize = ns+"px";
}

function checkTemplateParam(_var,_value,container=null,el = null)
{
    elements = el;
    if(!preview_mode && tpl_init || fcu)
    {
        gsap.set(lout,{css:{transition:"all .5s ease-in-out"}}); 
        if(elements != null) gsap.set(elements,{css:{transition:"all .5s ease-in-out"}}); 
    }
    switch(_var)
    {
        case "tpreview":
            preview_mode = true;
            break;
        case "showboundings":
            boundings = (_value == "true") ? true : false;
            break;
        case "fcu":
            fcu = true;
            break;
        case "offset_top":
            gsap.set(container,{css:{paddingTop:getHeight(_value)}});
            offset_top = _value;
            break;
        case "offset_bottom":
            gsap.set(container,{css:{paddingBottom:getHeight(_value)}});
            offset_bottom = _value;
            break;
        case "offset_left":
            gsap.set(container,{css:{paddingLeft:getWidth(_value)}});
            offset_left = _value;
            break;
        case "offset_right":
            gsap.set(container,{css:{paddingRight:getWidth(_value)}});
            offset_right = _value;
            break;
        case "margin":
            margin = _value;
            break;
        case "offset":
            offset = _value;
            break;
        case "position":
            position = _value;
            if(container!=null) container.className = _value;
            break;
        case "media_path":
            media_path = _value;
            break;
        case "font_path":
            font_path = _value;
            break;
    }
    if(!preview_mode && tpl_init)
    {
        gsap.set(container,{css:{transform: "translateY(-"+getHeight(offset)+")"}});
        gsap.set(lout,{css:{transition:"none"},delay:1});
        if(elements != null) gsap.set(elements,{css:{transition:"none"},delay:1});
    }
}

function checkTextParam(_param,_value)
{
    var text_param = null;
    var target = null;
    texts.forEach((text) => {
        var i = _param.indexOf(text.prefix);
        if(i==0)
        {
            target = text;
            text_param = _param.substring(text.prefix.length+1);
        }
    });
    if(text_param == null) return;
    switch(text_param)
    {
        case "in_delay":
            target.in_delay = Number(_value)/1000;
            break;
        case "in_duration":
            target.in_duration = Number(_value)/1000;
            break;
        case "in_transition":
            target.in_transition = _value;
            break;
        case "in_from":
            target.in_from = _value;
            break;
        case "out_delay":
            target.out_delay = Number(_value)/1000;
            break;
        case "out_duration":
            target.out_duration = Number(_value)/1000;
            break;
        case "trans_delay":
            target.trans_delay = Number(_value)/1000;
            break;
        case "trans_duration":
            target.trans_duration = Number(_value)/1000;
            break;
        case "out_transition":
            target.out_transition = _value;
            break;
        case "out_to":
            target.out_to = _value;
            break;
        case "padding_left":
            target.pad_left = getWidth(_value);
            break;
        case "padding_right":
            target.pad_right = getWidth(_value);
            break;
        case "padding_top":
            target.pad_top = getWidth(_value);
            break;
        case "padding_bottom":
            target.pad_bottom = getWidth(_value);
            break;
        case "color":
            target.color = getColor(_value);
            break;
        case "size":
            target.size = Number(_value);
            break;
        case "min_size":
            target.size = Number(_value);
            break;
        case "shadow":
            target.shadow = Number(_value);
            break;
        case "font":
            target.font = _value;
            break;
        case "align":
            target.align = getAlign(_value);
            break;
        case "lineheight":
            target.line_height = Number(_value);
            break;
        case "lineoffset":
            target.line_offset = Number(_value);
            break;
        case "":
            var value = _value.replace(/ /g,'&nbsp;');
            if(value != target.text && tpl_init) target.changed = true;
            target.text = value;
            break;
    }
}

function checkLoopParam(_param,_value)
{
    var loop_param = null;
    var target = null;
    loops.forEach((loop) => {
        var i = _param.indexOf(loop.prefix);
        if(i==0)
        {
            target = loop;
            loop_param = _param.substring(loop.prefix.length+1);
        }
    });
    if(loop_param == null) return;
    switch(loop_param)
    {
        case "media":
            loops[0].file = _value;
            break;
        case "loop_in":
            loops[0].loop_in = Number(_value)/1000;
            break;
        case "loop_out":
            loops[0].loop_out = Number(_value)/1000;
            break;
        case "outro_in":
            loops[0].outro_in = Number(_value)/1000;
            break;
        case "outro_out":
            loops[0].outro_out = Number(_value)/1000;
            break;
    }
}

function updateLoops()
{
    if(prevtime > 0) frametime = Date.now()-prevtime;
    prevtime = Date.now();

    loops.forEach(loop => { loop.seek(); });
    window.requestAnimationFrame(updateLoops);
}

function setupLoops()
{
    window.requestAnimationFrame(updateLoops);
}

//#endregion

class TextBlock
{
    constructor(prefix, parent)
    {
        this.parent = parent;
        this.prefix = prefix;
        this.container = null;
        this.altcontainer = null;
        this.element = null;
        this.altelement = null;
        this.fontFace = null;
        this.changed = false;
        this.clip = {};
        this.altclip = {};
        
        this.text = "";
        this.color = "#FFFFFF";
        this.shadow = 0;
        this.size = 40;
        this.minSize = 5;
        this.align = "l";
        this.font = "";
        this.fontFamily = "";
        this.margin = 0;
        this.line_offset = 0;
        this.line_height = 1;
        this.in_delay = .5;
        this.in_duration = .5;
        this.in_transition = "";
        this.in_from = "";
        this.out_delay = 0;
        this.out_duration = .5;
        this.out_transition = "";
        this.out_to = "";
        this.trans_delay = .5;
        this.trans_duration = 1;
        this.pad_left = 0;
        this.pad_right = 0;
        this.pad_top = 0;
        this.pad_bottom = 0;

        return this;
    }

    setup()
    {
        var c = this.container = document.createElement('div');
        var a = this.altcontainer = document.createElement('div');
        var te = this.element = document.createElement('p');
        var ae = this.altelement = document.createElement('p');
        var ts = document.createElement('div');
        var as = document.createElement('div');

        c.className = 'textcontainer';
        a.className = 'textcontainer';
        te.className = 'text'
        ae.className = 'text'
        te.id = this.prefix+"_p";
        ae.id = this.prefix+"_n";
        ts.className = 'scale';
        as.className = 'scale';
        c.appendChild(ts);
        a.appendChild(as);
        ts.appendChild(te);
        as.appendChild(ae);

        this.parent.appendChild(c);
        this.parent.appendChild(a);

        this.set();
        this.set(true);
        a.style.opacity = 0;
    }

    set(alt = false)
    {
        var target = (alt) ? this.altelement : this.element;
        var t = target.style;
        var cont = (alt) ? this.altcontainer : this.container;

        target.innerHTML = this.text;
        cont.style.paddingTop = this.pad_top;
        cont.style.paddingBottom = this.pad_bottom;
        cont.style.paddingLeft = this.pad_left;
        cont.style.paddingRight = this.pad_right;
        t.color = getColor(this.color);
        t.textShadow = getShadow(this.shadow,"#000000");
        t.textAlign = getAlign(this.align);
        t.fontFamily = this.fontFamily;
        t.fontSize = getHeight(this.size);
        t.transformOrigin = "center "+getAlign(this.align);
        t.lineHeight = this.line_height+"em";
        cont.style.marginTop = getHeight(this.line_offset);
        this.fit(alt,true);
        $(target).lettering('lines').children('span').lettering('words').children('span').lettering();
    }

    fit(alt = false, vertical = false)
    {
        var te = alt ? this.altelement : this.element;
        var tc = te.parentElement;
        fitText(te,tc,this.size,this.minSize,vertical);
    }

    play(update = false)
    {
        var el = update ? this.altelement : this.element;
        var tc = update ? this.altcontainer : this.container;
        var dr = update ? this.trans_duration : this.in_duration;
        var dl = update ? this.trans_delay : this.in_delay;
        var cf = update ? () => { this.revert(); } : () => { this.clearMask(); };
        var id = update ? "#"+this.altelement.id : "#"+this.element.id;
        gsap.set(tc,{opacity:1});
        
        var fr = "start";
        switch(this.in_from)
        {
            case "left":
            case "top":
                fr = "start";
                break;
            case "right":
            case "bottom":
                fr = "end";
                break;
        }
        switch(this.in_transition)
        {
            case "fade":
            default:
                gsap.from(el,dr,{opacity:0,ease:"power3.inOut",delay:dl, onComplete: cf});
                break;
            case "slide":
                gsap.set($(id).parent(),{css:{overflow:"hidden"}});
                gsap.set($(id).parent(),{css:{overflow:"visible"},delay:dl+dr});
                gsap.from(el,dr/4,{opacity:0,ease:"power3.in",delay:dl});
                var tx = "+=0";
                var ty = "+=0";
                switch(this.in_from)
                {
                    case "left":
                    default:
                        tx = "-=100%";
                        break;
                    case "right":
                        tx = "+=100%";
                        break;
                    case "top":
                        ty = "-=100%";
                        break;
                    case "bottom":
                        ty = "+=100%";
                        break;
                }
                gsap.from(el, dr, {x: tx, y: ty, ease: "power3.out", delay:dl, onComplete: cf});
                break;
            case "slidelines":
                var ld = dr/$(id+" > span").length;
                var le = dr/($(id+" > span").length+1);
                var st = {from: "start",ease: "power0.out",each:le};
                var tx = "+=0";
                var ty = "+=0";
                gsap.set($(id).parent(),{css:{overflow:"hidden"}});
                gsap.set($(id).parent(),{css:{overflow:"visible"},delay:dl+dr+le});
                switch(this.in_from)
                {
                    case "left":
                        tx = "-=25%";
                        break;
                    case "right":
                        tx = "+=25%";
                        break;
                    case "top":
                        ty = "-=25%";
                        break;
                    case "bottom":
                        ty = "+=25%";
                        break;
                }
                gsap.from(id+" > span",dr,{x:tx, y:ty, opacity:0, ease: "power2.out", delay:dl, stagger:st, onComplete: cf});
                break;
            case "fadeletters":
                var st = {from: fr,ease: "power0.out",amount:dr}
                gsap.from(id+" span span span",.3,{opacity:0,ease: "power1.out",delay:dl,stagger:st, onComplete: cf});
                break;
            case "stampletters":
                var st = {from: fr,ease: "power0.out",amount:dr}
                gsap.from(id+" span span span",.3,{scaleX:2,scaleY:2,opacity:0,ease: "power1.out",delay:dl,stagger:st, onComplete: cf});
                break;
            case "stamp":
                gsap.from(tc,dr,{scale:2,opacity:0,ease: "power4.out",delay:dl, force3D:true, onComplete: cf});
                break;
            case "grow":
                gsap.from(tc,dr,{scaleX:.5,scaleY:.5,opacity:0,ease: "power1.out",delay:dl, force3D:true, onComplete: cf});
                break;
            case "wipe":
                var x1 = 0, x2 = 100, y1 = 0, y2 = 100;
                switch(this.in_from)
                {
                    case "left":
                    default:
                        x2 = 0;
                        break;
                    case "right":
                        x1 = 100;
                        break;
                    case "top":
                        y2 = 0;
                        break;
                    case "bottom":
                        y1 = 100;
                        break;
                }
                if(update) this.altclip = {x1: x1, x2: x2, y1: y1, y2: y2};
                else this.clip = {x1: x1, x2: x2, y1: y1, y2: y2};

                this.setMask(update);
                gsap.to((update ? this.altclip : this.clip),{x1:0,x2:100,y1:0,y2:100,duration:dr,ease: "power3.inOut",delay:dl,onUpdate: () => { this.setMask(update); }, onComplete:cf});
                break;
        }
    }

    stop(update = false)
    {
        var el = this.element;
        var tc = this.container;
        var dr = update ? this.trans_duration : this.out_duration;
        var dl = update ? 0 : this.out_delay;
        var id = "#"+this.element.id;
        var to = "start";
        switch(this.out_to)
        {
            case "left":
            case "top":
                to = "end";
                break;
            case "right":
            case "bottom":
                to = "start";
                break;
        }
        switch(this.out_transition)
        {
            case "fade":
            default:
                gsap.to(tc,dr,{opacity:0,ease:"power3.inOut",delay:dl});
                break;
            case "slide":
                gsap.set($(id).parent(),{css:{overflow:"hidden"}});
                gsap.set($(id).parent(),{css:{overflow:"visible"},delay:dl+dr});
                gsap.to(tc,dr/8,{opacity:0,ease:"power3.in",delay:dl+dr-(dr/8)});
                var tx = "+=0";
                var ty = "+=0";
                var te = "power3.out";
                switch(this.out_to)
                {
                    case "left":
                    default:
                        tx = "-=100%";
                        break;
                    case "right":
                        tx = "+=100%";
                        break;
                    case "top":
                        ty = "-=100%";
                        break;
                    case "bottom":
                        ty = "+=100%";
                        break;
                    }
                    gsap.to(el,dr,{x: tx, y: ty, ease: "power3.in", delay: dl, clearProps: 'transform'});
                break;
            case "slidelines":
                var ld = dr/$(id+" > span").length;
                var le = dr/($(id+" > span").length+1);
                var st = {from: "start",ease: "power0.out",each:le}
                var tx = "+=0";
                var ty = "+=0";
                gsap.set($(id).parent(),{css:{overflow:"hidden"}});
                gsap.set($(id).parent(),{css:{overflow:"visible"},delay:dl+dr+le});
                switch(this.out_to)
                {
                    case "left":
                        tx = "-=25%";
                        break;
                    case "right":
                        tx = "+=25%";
                        break;
                    case "top":
                        ty = "-=25%";
                        break;
                    case "bottom":
                        ty = "+=25%";
                        break;
                }
                gsap.to(id+" > span", dr, {x: tx, y: ty, opacity: 0, ease: "power2.out", delay: dl, stagger: st});
                break;
            case "fadeletters":
                var st = {from: to,ease: "power0.out",amount:dr}
                gsap.to(id+" span span span",.3,{opacity:0,ease: "power1.out",delay:dl,stagger:st});
                break;
            case "stampletters":
                var st = {from: to,ease: "power0.out",amount:dr}
                gsap.to(id+" span span span",.3,{scaleX:2,scaleY:2,opacity:0,ease: "power1.out",delay:dl,stagger:st});
                break;
            case "stamp":
                gsap.to(tc,dr,{scale:2,opacity:0,ease: "power4.in",delay:dl, force3D:true});
                break;
            case "grow":
                gsap.to(tc,dr,{scaleX:.5,scaleY:.5,opacity:0,ease: "power1.in",delay:dl, force3D:true});
                break;
            case "wipe":
                var x1 = 0, x2 = 100, y1 = 0, y2 = 100;
                this.clip = {x1: x1, x2: x2, y1: y1, y2: y2};
                switch(this.out_to)
                {
                    case "left":
                    default:
                        x2 = 0;
                        break;
                    case "right":
                        x1 = 100;
                        break;
                    case "top":
                        y2 = 0;
                        break;
                    case "bottom":
                        y1 = 100;
                        break;
                }
                gsap.to(tc,dr/8,{opacity:0,ease:"power3.in",delay:dl+dr-(dr/8)});
                this.setMask();
                gsap.to(this.clip,{x1:x1,x2:x2,y1:y1,y2:y2,duration:dr,ease: "power3.inOut",delay:dl,onUpdate:() => { this.setMask(); }});
                break;
        }
    }

    revert()
    {
        this.set();
        this.clearMask();
        this.clearMask(true);
        gsap.to(this.container,{opacity:0,duration:.01, clearProps: 'transform'});
        gsap.fromTo(this.container,{opacity:0},{opacity:1, duration:0.001, ease:"sine.inOut",delay:.01});
        gsap.fromTo(this.altcontainer,{opacity:1},{opacity:0,duration:0.001, ease:"sine.inOut",delay:.01});
    }

    setMask(alt = false)
    {
        var tp = alt ? this.altclip : this.clip;
        var te = alt ? this.altelement : this.element;
        var result = "polygon("+tp.x1+"% "+tp.y1+"%, "+tp.x2+"% "+tp.y1+"%, "+tp.x2+"% "+tp.y2+"%, "+tp.x1+"% "+tp.y2+"%)";
        te.style.clipPath = result;
    }

    clearMask(alt = false)
    {
        var te = alt ? this.altelement : this.element;
        te.style.removeProperty("clip-path");
    }

}

class VideoLoop
{
    constructor(prefix, parent)
    {
        this.parent = parent;
        this.prefix = prefix;
        this.element = null;
        this.altelement = null;
        this.play = false;
        this.loop = false;
        this.outro = false;

        this.file = "";
        this.loop_in = 1;
        this.loop_out = 2;
        this.outro_in = 3;
        this.outro_out = 4;
        this.start_time = 0;
        this.alt_time = 0;
    }

    setup()
    {
        var v = this.element = document.createElement('video');
        var a = this.altelement = document.createElement('video');
        v.className = a.className = 'video';
        v.src = a.src = "file:///"+media_path+this.file+".webm";
        v.style.width = a.style.width = "100%";
        v.style.height = a.style.height = "100%";
        a.style.opacity = 0;

        this.parent.appendChild(v);
        this.parent.appendChild(a);
    }

    stop()
    {
        this.outro = true;
        gsap.fromTo(this.element,{opacity:1},{opacity:0,duration:.2, ease:"power1.in",delay:.1});
        gsap.fromTo(this.altelement,{opacity:0},{opacity:1, duration:.2, ease:"power1.out"});
    }

    seek()
    {
        if(!this.play)
        {
            this.play = true;
            this.element.play();
        }
        else
        {
            if(this.outro)
            {
                if(this.altelement.currentTime<this.outro_in)
                {
                    this.altelement.currentTime = this.outro_in;
                    this.altelement.play();
                }
            }
            else
            {
                if(this.looping)
                {
                    if(this.element.currentTime >= this.loop_out)
                    {
                        this.element.currentTime = this.loop_in;
                    }
                }
                else
                {
                    if(frametime>0 && this.element.currentTime >= this.loop_out)
                    {
                        this.element.currentTime = this.loop_in;
                        this.looping = true;
                    }
                }
            }
        }
    }
}