class Caspar
{
    constructor(host = "127.0.0.1:7250")
    {
        this.host = host;
        this.connection;
        this.connected = new Event("caspar-connected", { bubbles: true, cancelable: false });
        this.disconnected = new Event("caspar-disconnected", { bubbles: true, cancelable: false });
        this.isConnected = false;
    }

    connect()
    {
        if(this.connection != undefined) this.disconnect();
        this.connection = new WebSocket("ws://"+this.host, ['binary']);
        this.connection.binaryType = "arraybuffer";
        this.connection.addEventListener("open", (evt) => { this.ws_connected() });
        this.connection.addEventListener("close", (evt) => { this.ws_disconnected() });
    }

    disconnect()
    {
        this.connection.close();
        this.connection.removeEventListener("open", (evt) => { this.ws_connected() });
        this.connection.removeEventListener("close", (evt) => { this.ws_disconnected() });
    }

    ws_connected()
    {
        this.isConnected = true;
        dispatchEvent(this.connected);
    }

    ws_disconnected()
    {
        this.isConnected = false;
        dispatchEvent(this.disconnected);
    }

    sendString(string)
    {
        if(!this.isConnected) return false;
        this.connection.send(string+"\r\n");
        return new Promise((resolve,reject) =>
        {
            this.connection.onmessage = function(msg)
            {
                resolve(new CasparResponse(msg));
            };
        })
    }

    getPath(node)
    {
        return node.innerHTML.replace(/\\+/g,"/");
    }

    async getPaths(alt = false)
    {
        var paths = 
        {
            data: "",
            media: "",
            template: "",
            font: "",
            log: "",
            initial: ""
        }
        var command = alt ? "INFO CONFIG" : "INFO PATHS";
        var data = await this.sendString(command);
        if(!data || data.state != "201" || data.command != "INFO") return false;
        var xml = new DOMParser().parseFromString(data.data[0],"text/xml");
        var path_node = xml.getElementsByTagName("paths");
        if(path_node.length>0)
        {
            for(n = 0; n< path_node[0].children.length; n++)
            {
                let p = path_node[0].children[n];
                switch(p.nodeName)
                {
                    case "media-path":
                        paths.media = this.getPath(p);
                        break;
                    case "log-path":
                        paths.log = this.getPath(p);
                        break;
                    case "data-path":
                        paths.data = this.getPath(p);
                        break;
                    case "font-path":
                        paths.font = this.getPath(p);
                        break;
                    case "template-path":
                        paths.template = this.getPath(p);
                        break;
                    case "initial-path":
                        paths.initial = this.getPath(p);
                        break;
                }

            };
        }
        else return false;
        
        return paths;
    }
}

class CasparResponse
{
    constructor(msg)
    {
        var array = new Uint8Array(msg.data);
        var data = new TextDecoder("utf-8").decode(array).split("\r\n");
        var head = data[0].split(" ");
        this.state = head[0];
        this.command = head[1];
        this.data = [];
        for(var i = 1; i<data.length; i++)
        {
            this.data.push(data[i]);
        }
    }
}