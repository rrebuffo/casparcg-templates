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