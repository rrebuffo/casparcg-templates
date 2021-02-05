# CasparCG HTML Template Helpers
This repository contains boilerplate code used in most of my HTML templates for CasparCG.
It includes some basic layout handling, video looping with intro and outro, text handler with transitions,
various parsing and conversion functions and a basic Caspar connection handler (over WebSockets).

Additionally it has some examples to showcase most of those features.

Many of the functions are carried over from ActionScript and handle legacy client syntax conversion
(eg. color: from `0xFFFFFF` to `#FFFFFF` or `rgba(255,255,255,1)`). Those include functions to help implement certain features
of custom clients (like live preview, automatic offsets, styling and stealth updates) and they handle all channel formats and
can receive both JSON and XML data from clients.

## Usage
It's recommended that the folder structure is kept as is, placing the folder inside CasparCG's template folder
and creating a folder for each template group:

```
template/
    |
    |__ css/
    |     |__ cg.css
    |
    |__ font/
    |     |__ NotoColorEmoji.ttf 
    |
    |__ js/
    |     |__ caspar.js
    |     |__ helpers.js
    |     |__ jquery.lettering.min.js
    |     |__ jquery-latest.min.js
    |     :.. gsap.min.js
    |
    |__ loop-io/
    :     |__ one-liner.html
    :     |__ two-liner.html
    :
    :.. additional-templates/
          :.. another-template.html

```
This code relies heavily on GreenSock's GSAP library. As it has a restrictive license, it's not included in this repo.
You shall download it from https://greensock.com/gsap and place it in the js folder like shown above.

The NotoColorEmoji.ttf font enables consistent emoji support for HTML templates across different server installations and OS.
You can swap it with any other emoji font of your choosing.

## Basic template
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Basic Template</title>
    <link rel="stylesheet" href="../css/cg.css">
</head>
<body>
    <div id="mainlayout">
        <div id="container" class="container" style="width: 100%; height: 10vh; background: rgba(0,0,0,.75);"></div>
    </div>
    <script type="text/javascript" src="../js/jquery-latest.min.js"></script>
    <script type="text/javascript" src="../js/jquery.lettering.min.js"></script>
    <script type="text/javascript" src="../js/gsap.min.js"></script>
    <script type="text/javascript" src="../js/helpers.js"></script>
    <script type="text/javascript" src="../js/caspar.js"></script>
    <script>

        // ELEMENTS
        let _container = document.getElementById('container');
        texts.push(new TextBlock("text", _container));

        // PLAYOUT FUNCTIONS

        function play ()
        {
            playElements();
        }

        function stop ()
        {
            stopElements();
        }

        function next ()
        {

        }

        // DATA PARSER
        
        function update (data) 
        {
            getData(data);
            
            for (let i in Object.keys(jsdata))
            {
                var _param = Object.keys(jsdata)[i];
                var _value = Object.values(jsdata)[i];
                checkTemplateParam(_param,_value,lout,[_container]);
                checkTextParam(_param,_value);
                checkLoopParam(_param,_value);

                switch(_param)
                {
                    case "custom-param":
                        // Do something with the = _value;
                        break;
                }
            }
            if(tpl_init)
            {
                checkTextChange();
            }
            else
            {
                initElements();
            }

        }

    </script>
</body>
</html>
```
This example sets a full width container with a black semitransparent background and adds a text field to it.
The textfield fits inside the container and scales down if it overflows.


## Parameters and customization options

### Main template parameters
These affect the overall look and behavior of the template:

Parameter | Value | Result
----------------- | ------------------ | -------------------------------------
tpreview | `*` | Disables all transitions and updates the elements instantly
showboundings | `true` | Shows bounding boxes on elements to help layout sizing visually (only works in preview mode)
fcu | `*` | Forces text content to update silently (fade) instead of a out-in transition
position | `[TL/TC/TR/CL/CC/CR/BL/BC/BR]` | Anchor position for the `.container`s
media_path | `string` | base path for the video elements
font_path | `string` | base path for the fonts of text elements

### Layout
The layout has a safe margin by default and its children (of `container` class) are aligned to the bottom left of the screen.

Parameter | Default value | Result
----------------- | ------------------ | -------------------------------------
offset | `0` | Margin between the bottom of the screen (to avoid multiple templates overlapping)
offset_top | `54` | Top safe margin
offset_bottom | `54` | Bottom safe margin
offset_left | `96` | Left safe margin
offset_right | `96` | Right safe margin

All the parameters accept only pixel units based on a 1920x1080px and get scaled automatically to the current size of the template.

### Elements
The available elements are:
 * `TextBlock(prefix, parent)` added to the `texts` array
 * `VideoLoop(prefix, parent)` added to the `loops` array
 
They accept both template parameters from the server (using the prefix param in the constructor) and hardcoded
settings in the object itself, eg:

Hardcoded parameters:
```javascript
// TEXTS ELEMENTS
var text1 = new TextBlock("text1", parent_container);
text1.text = "text for the element";
text1.color = "#CC0000";
text1.size = 40;
text1.align = "center";
texts.push(text1);

// LOOP ELEMENTS
var loop1 = new VideoLoop("loop1", parent_container);
loop1.media = "video-file"; // .webm
loop1.loop_in = 1; // seconds
loop1.loop_out = 4;
loop1.outro_in = 4;
loop1.outro_out = 5;
loops.push(loop1);
```
Parameters sent from CasparCG:
Parameter | Value
------------ | -------------
text1 | text for the element
text1_color | #CC0000
text1_size | 40
text1_color | center
loop1_media | "video-file"
loop1_loop_in | 1000
loop1_loop_out | 4000
loop1_outro_in | 4000
loop1_outro_out | 5000

Most of the parameters are updated on runtime, except for loading bound ones like `loop_media` and `text_font`.
Those will be implemented later.
A detailed list of parameters for the elements will be added to the wiki.


## Caspar connection example
```javascript
var caspar = new Caspar("127.0.0.1:7250");
addEventListener("caspar-connected", onConnect);
caspar.connect();

async function onConnect()
{
    // Getting paths using the "INFO PATHS" command
    var paths = await caspar.getPaths();
    if(paths != false)
    {
        console.log("INITIAL PATH: "+paths.initial);
        console.log("MEDIA PATH: "+paths.media);
    }
    else console.error("ERROR GETTING PATHS");

    // Getting paths using the "INFO CONFIG" command,
    // this will allow reading the font-path but lacks
    // the server base directory (initial-path)
    var altpaths = await caspar.getPaths(true);
    if(altpaths != false)
    {
        console.log("FONT PATH: "+altpaths.font);
    }
    else console.error("ERROR GETTING PATHS");
}
```
The example above connects to local CasparCG through port 7250 (through Websockify) and gets the paths for the server, media and fonts.

### Sending commands
```javascript
async function myCommand()
{
  var result = await caspar.sendString("PLAY 1-1 AMB LOOP MIX 12");
  if(result == false) console.error("COMMAND FAILED");
  else if(result.state == "201") console.log("PLAYING AMB LOOP SUCCEEDED");
}
```
