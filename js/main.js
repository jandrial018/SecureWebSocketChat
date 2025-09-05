   //  codex: ignore
   
    function onColorChange(color)
    {
        console.log("onColorChange",color.hexString);
    }
    function e(...msg)
    {
        console.log(...msg);
    }

    function getCookies()
    {
        const cook = document.cookie.split(";");
        let arr = [];
        for (let ies of cook)
        {
            const [key, value] = ies.split("=");
            arr[key.trim()] = decodeURIComponent(value);
        }
        return arr;
    }

    function setCookie(key, value, days = 365)
    {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();

        document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; ${expires}; path=/`;
    }

    function sendPing()
    {
        if(isConnected)
        {
            const payload = JSON.stringify({'ping': "pong"});
            ws.send(payload);
            setTimeout(() => { sendPing();}, 50000);
        }
    }

    function startTimer()
    {
        countdown = document.getElementsByClassName('countdown')[0]??[];
        if(countdown)
            countdown.classList.remove('displayNone');
        timer = document.getElementById('timer');
        if(timer)
        {
            const now = new Date();
            const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);//6pm "today"
            updateTimer(timer, targetTime);
            setInterval(()=>updateTimer(timer, targetTime), 1000);
        }
    }

    function findObjects(p, message)
    {
        const regurl = /(https?:\/\/[^\s]+)/g;
        const regimg = /\.(jpeg|jpg|gif|png|webp)$/i;
        const regYT = /www.youtube.com/;
        let match = null;
        p.innerText = message;
        if(match = p.textContent.match(regurl))
        {
            match.forEach(val => {
                p.innerText = p.innerText.replace(val, '');
                if(val.match(regimg))
                {
                    const img = document.createElement('img');
                    img.src = val;
                    img.style = "max-width: 200px; display:block; border-radius: 9px;";

                    const urlParts = val.split('/');
                    const lastPart = urlParts[urlParts.length - 1];
                    img.setAttribute('data-gif-id', lastPart);

                    img.alt = "animated gif: "+lastPart;
                    img.addEventListener('click',()=>{openModal(val)})
                    p.appendChild(img);
                }
                else if(val.match(regYT))
                {
                    const img = document.createElement('iframe');
                    //https://www.youtube.com/watch?v=w4jo5WOy9Fk
                    val = val.replace('/watch?v=', '/embed/');
                    img.src = val;
                    img.title = "YouTube video player";
                    img.frameborder = "0";
                    img.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                    img.referrerpolicy = "strict-origin-when-cross-origin";
                    img.style = "width: auto; height:auto; display:block; border-radius: 9px;";
                    img.setAttribute('allowfullscreen', '');

                    p.appendChild(img);
                }
                else
                {
                    const a = document.createElement('a');
                    a.target = "_blank";
                    a.href = val;
                    a.textContent = val;
                    p.appendChild(a);
                }
            });
       }

       return message;
    }

    function updateSmall(id)
    {
        small = document.getElementById(id);
        if(small)
        {
            if(small.getAttribute('sent') != 'true')
            {
                small.innerHTML = "Failed: " + getLocalTime();
            }
        }
    }

    function appendMessage(mydata, type)
    {
        const data = JSON.parse(mydata??[]);

        if(data.uid == uid)
        {
            type = 'sent';
        }

        if(data.count)
        {
            counter.innerText = data.count;
        }
        if(data.init )
        {
            myColor = data.color;
            fontColor = data.font;
            id = data.id;
            uid = data.uid??data.id;
            setCookie("id", data.id);
            setCookie("uid", data.uid);
            setCookie("color", data.color);
            setCookie("font", data.font);

            if(data.display)
            {
                startTimer();
            }
            return;
        }
        if(data.History)
        {
            data.History.forEach(item => {
                appendMessage(JSON.stringify(item.data), type);
            });

            setTimeout(() => { chatContainer.scrollTop = chatContainer.scrollHeight;}, 500);
            return;
        }
        else if(data.ping)
        {
            return;
        }
        else if(data.received)
        {
            let small = document.getElementById(data.received);
            if(small)
            {
                small.setAttribute('sent',true);
                small.innerHTML = "sent: " +  getLocalTime();
            }
            return;
        }

        let message   = data.message??'';
        const name    = data.name??'Anon';

        const divContainer = document.createElement('div');
        const div = document.createElement('div');
        divContainer.classList.add(type);
        div.classList.add('message');
        const p = document.createElement('p');
 
        message = ((name)?name+': ':'')+message;
        message = findObjects(p, message);
        divContainer.appendChild(div);
        div.appendChild(p);
        div.style.backgroundColor = data.color??myColor;//color;
        div.style.color = data.font??fontColor;//color;

        const small = document.createElement('p');
        small.classList.add('small');
        if(type == 'sent')
        {
            small.id = messageID++;
            small.innerHTML = "sending...";
            small.setAttribute("sent", false);
            if(data.uid == uid)
                small.innerHTML = "sent: " + getLocalTime(data.time??null);
            else
            setTimeout(() => { updateSmall(small.id);}, 3000);
        }
        else
        {
            small.innerHTML = "received: " + getLocalTime(data.time??null);
        }
        divContainer.appendChild(small);
        chatContainer.appendChild(divContainer);
        setTimeout(() => { chatContainer.scrollTop = chatContainer.scrollHeight;}, 200);
    }

    function clearMessage()
    {
        chatContainer.textContent = '';
        const payload = JSON.stringify({'ClearHistory': 1});

        if(isConnected)
            ws.send(payload);
    }
    function getHistory()
    {
        const payload = JSON.stringify({'GetHistory': 1});

        if(isConnected)
            ws.send(payload);
    }

    function sendMessage()
    {
        if (textbox.value == null || !textbox.value.trim())
        {
            flashTextareaAlert();
            return;
        }

        const name    = nameElement.value;
        const payload = JSON.stringify({'id':id,'uid':uid,'name': name, 'message': textbox.value, "messageID":messageID, 'color':myColor, 'font':fontColor});
       
        appendMessage(payload, type.sent);//send

        if(isConnected)
            ws.send(payload);
        else
        {
            const payload2 = JSON.stringify({'name':'','message': "You're not connected to the server", "messageID":messageID, 'color':myColor, 'font':fontColor});
            appendMessage(payload2, type.received);//send
        }
        textbox.value = "";
    }

    function getComplementaryColor(hexColor)
    {
        // Remove the '#' if present
        hexColor = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;

        // Convert the hex color to RGB values
        let r = parseInt(hexColor.substring(0, 2), 16);
        let g = parseInt(hexColor.substring(2, 4), 16);
        let b = parseInt(hexColor.substring(4, 6), 16);

        // Calculate the complementary RGB values
        let compR = 255 - r;
        let compG = 255 - g;
        let compB = 255 - b;

        // Convert the complementary RGB values back to hex
        let compHexR = compR.toString(16).padStart(2, '0');
        let compHexG = compG.toString(16).padStart(2, '0');
        let compHexB = compB.toString(16).padStart(2, '0');

        return `#${compHexR}${compHexG}${compHexB}`;
    }

    function calculateLuminance(color)
    {
        const rgb = parseInt(color.replace("#", ""), 16);
        const r = (rgb >> 16) & 0xFF;
        const g = (rgb >> 8) & 0xFF;
        const b = rgb & 0xFF;
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }

    function setTextColor(backgroundColor)
    {
      const luminance = calculateLuminance(backgroundColor);
      return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    function openModal(url)
    {
        if(modal.classList.contains('displayNone'))
            modal.classList.remove('displayNone');
        

        const urlParts = url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        modalImg.setAttribute('data-gif-id', lastPart);
        modalImg.src=url;
        modalImg.alt=`Select Image ${lastPart} enlarged`;
    }

    function closeModal(evt)
    {
        if (evt.target.classList.contains('imgModal'))
        {
            modal.classList.add('displayNone');
        }
    }

    function getLocalTime(time = null)
    {
        if(time)
        {
            const date = new Date(time);
            const now  = new Date();
            let format = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }
            if(date.getDate() != now.getDate())
            {
                format.month = 'numeric';
                format.day   = 'numeric';
            }
            if(date.getYear() != now.getYear())
            {
                format.year = 'short';
            }

            return date.toLocaleString(undefined, format);
        }
        else
            return new Date().toLocaleString(undefined, options);
    }

    function aboutMe()
    {
        Swal.fire({
            title: 'Still Working on it',
            html: 'Here is the public repo of this project:<br><br>GitHub: <a target="_blank" href="https://github.com/jandrial018/SecureWebSocketChat">https://github.com/jandrial018/SecureWebSocketChat</a>',
            confirmButtonText: 'Close'
            });
        //alert("Still Working on it Here is the repo (may still be private):\n\nGitHub: https://github.com/jandrial018/Secure-Web-Socket-Chat");
    }
   
    function flashTextareaAlert()
    {
        if(!textbox.classList.contains('flash-alert'))
        {
            textbox.classList.add('flash-alert');
            setTimeout(() => {
                textbox.classList.remove('flash-alert');
                }, 3000);
        }
    }
   
   
   let ws = startWebSocket();

    if(ws)
    {
        ws.onopen = (event) => 
        {
            statusLight.style.backgroundColor = '#4CAF50';
            statusLight.title = 'Connected';
            statusText.textContent = 'Connected';
            label.textContent = 'Connected';
            isConnected = true;

            var text = {"message":"You've Have connected to server", "name":""};
            appendMessage(JSON.stringify(text), type.received);
            getHistory();
            sendPing();
        };

        ws.onmessage = (event) => 
        {
            Connlabel.textContent = 'last msg from server: ' + getLocalTime();
            //Connlabel.textContent = 'last msg from server: ' + new Date().toLocaleTimeString();
            appendMessage(event.data, type.received);
        };

        ws.onclose = (event) => {
            statusLight.style.backgroundColor = '#f44336';
            statusLight.title = 'Disconnected';
            statusText.textContent = 'Disconnected';
            label.textContent = 'Disconnected';

            isConnected = false;
            setTimeout(() => { location.reload();}, 15000);
        };

        ws.onerror = (error) =>
        {
            statusLight.style.backgroundColor = '#f44336';
            statusLight.title = 'Error';
            statusText.textContent = 'Error';
            label.textContent = 'Error';

            isConnected = false;
            const myError = JSON.stringify(error);
            received.textContent += "WebSocket error: " + myError + "\n";
        };
    }
    else
    {
        e('failed to open WS');
    }