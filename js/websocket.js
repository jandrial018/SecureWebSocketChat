    function startWebSocket()
    {
        cookies = getCookies();
        var url = 'wss://websocketchat.com:8443?source=user';
        Object.keys(cookies).forEach(key => {
            url +='&'+key+'='+ encodeURIComponent(cookies[key]);
        });
        nameElement.value = cookies.name??'';
        uid = cookies.uid;
        myColor = cookies.color??'#e1f0ff';
   
        let ws = new WebSocket(url);
        return ws;
    }

   