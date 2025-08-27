//  codex: ignore
    
    const type     = {'received':'received', 'sent':'sent'};
    const chatContainer = document.getElementById('chatContainer');
    const log      = document.getElementById('log');
    const received = document.getElementById('received');
    const sender   = document.getElementById('sender');
    const counter  = document.getElementById('count');
    const modal    = document.getElementById('modal');
    const modalImg = document.getElementById('modalImg');
    const textbox  = document.getElementById('message');
    const nameElement = document.getElementsByName('name')[0]??[];
    const Connlabel = document.getElementById('statusText');
    const btn_fireworks = document.getElementById('btn_fireworks');
    
    const colors = {'sent':['#DCF8C6','#E1FFC7','#007AFF','#005C99','#A7F3D0','#2E7D32','#B3E5FC','#1976D2'],
        'received':['#f4e8ab','#b4d2e9','#f3b9cc','#adadad','#eec5ef','#ff82cf','#E6E6E6','#93b4f6']};
    var myColor = '#e1f0ff';
    let fontColor = '#00000';
    let isConnected = false;
    const statusLight = document.getElementById('statusLight');
    const statusText = document.getElementById('statusText');
    const label = document.getElementById('label');
        
    let messageID = 1;
    let id = 0;
    let uid = 0;
    const options = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
        };
        
    let cookies = [];

    // var colorPicker = new iro.ColorPicker('#picker');
    // var colorPicker = new iro.ColorPicker("#picker", {
    // // Set the size of the color picker
    // width: 120,
    // // Set the initial color to pure red
    // color: "#f00"
    // });

    // listen to a color picker's color:change event
    // color:change callbacks receive the current color
    // colorPicker.on('color:change', function(color) {
    //     console.log("in change",color.hexString);
    // });

    // colorPicker.on('input:move', function(color) {
    //     console.log("in move",color.hexString);
    // });
    // colorPicker.on('input:change', function(color) {
    //     console.log("in change",color.hexString);
    // });
    // colorPicker.on('input:start', function(color) {
    //     console.log("in start",color.hexString);
    // });
    // colorPicker.on('input:end', function(color) {
    //     console.log("in end",color.hexString);
    // });
    
    // // add color:change listener
    // colorPicker.on('color:change', onColorChange);
    // // later, if we want to stop listening to color:change...
    // colorPicker.off('color:change', onColorChange);
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
    let ws = startWebSocket();
    
    function sendPing()
    {
        if(isConnected)
        {
            const payload = JSON.stringify({'ping': "pong"});
            ws.send(payload);
            setTimeout(() => { sendPing();}, 50000);
        }
    }

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
    let triggeredFire = false;
    function updateTimer(timer, targetTime)
    {
        const now = new Date();
        let diff = targetTime - now;
        let prefix = "";

        if(diff <= 0 && diff > -2)
        {
            if(!triggeredFire)
            {
                triggeredFire =!triggeredFire;
                triggerFireworks();

                mydata = {"message":"https://media.tenor.com/M6JHx26JpjoAAAAC/spongebob-patrick-star.gif", "name":"Server"};
                appendMessage(JSON.stringify(mydata), type.received);

            }
            prefix = "+";
            diff = Math.abs(diff);
        }

        const hours   = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const h = String(hours)  .padStart(2, "0");
        const m = String(minutes).padStart(2, "0");
        const s = String(seconds).padStart(2, "0");

        timer.textContent = `${prefix}${h}:${m}:${s}`;
    }

    nameElement.addEventListener('focusout', ()=> {
        setCookie('name', nameElement.value);
    });

    modal.addEventListener('click', (evt) => {closeModal(evt)})

    document.getElementById('message').addEventListener('keydown', function(event)
    {
        if (event.key === 'Enter')
        {
            if(event.shiftKey)
            {
                const start = textbox.selectionStart;
                const end   = textbox.selectionEnd;
                const text  = textbox.value;
                textbox.value = text.substring(0, start) + "\n" + text.substring(end);
                textbox.selectionStart = textbox.selectionEnd = start + 1;
            }
            else
            {
                sendMessage();
            }
            event.preventDefault();
        }
    });

    document.addEventListener('keydown', function(event) {
        if ((event.metaKey || event.ctrlKey) && event.key === 'l')
        {
            clearMessage();
            event.preventDefault();
        }
    });

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

       // console.log('in message', data);
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
           // e("myColorBefore:",myColor);
          //  e("in init",data);
            myColor = data.color;
            fontColor = data.font;
            id = data.id;
            uid = data.uid??data.id;
            setCookie("id", data.id);
            setCookie("uid", data.uid);
            setCookie("color", data.color);
            setCookie("font", data.font);
          //  e("after:",myColor);
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
        modalImg.src=url;
    }

    function closeModal(evt)
    {
        if (evt.target.classList.contains('imgModal'))
        {
            modal.classList.add('displayNone');
        }
    }

    function createFireBox()
    {
        let fire = document.createElement('div');
        fire.id = 'fire';
        fire.style.position = 'absolute';
        updateStyle(fire);
        let leftside = document.getElementsByClassName('leftside')[0]??[];
        leftside.append(fire);
        return fire;
    }

    function updateStyle(fire)
    {
        if(!fire)
             fire = document.getElementById('fire');
        let rect = chatContainer.getBoundingClientRect();
        fire.style.top = rect.top + 'px';
        fire.style.left = rect.left + 'px';
        fire.style.height = rect.height + 'px';
        fire.style.width = rect.width + 'px';
        fire.style.pointerEvents = 'none';
    }

    let isRunning = false;
    let fireworks = null;
    function launchFireworks()
    {
        isRunning =! isRunning;
        if((isRunning))
        {
            let firebox = null;
            if(!fireworks)
            {
                firebox = createFireBox();
                fireworks = new Fireworks.default(firebox);
            }
            else
            {
                updateStyle();
            }
            fireworks.start();
        }      
        else
        {
            fireworks.stop();
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
            html: 'Here is the repo (may still be private):<br><br>GitHub: <a target="_blank" href="https://github.com/jandrial018/Secure-Web-Socket-Chat">https://github.com/jandrial018/Secure-Web-Socket-Chat</a>',
            confirmButtonText: 'Close'
            });
        //alert("Still Working on it Here is the repo (may still be private):\n\nGitHub: https://github.com/jandrial018/Secure-Web-Socket-Chat");
    }

    btn_fireworks.addEventListener('click', triggerFireworks);

    function triggerFireworks()
    {
        if(isRunning)
        {
            launchFireworks();
            btn_fireworks.style.background = ranColor();
            return;
        }
        else
        {
            shootParticle();
        }
    }

    function ranColor()
    {
        return `hsl(${Math.floor(Math.random() * 361)}, 100%, 50%)`;
    }

    function randomLocation()
    {
        return {
            x: ((Math.random() * 100 - 150)) + 'px',
            y: ((Math.random() * 200 + 120)) + 'px',
        }
        return {
            x: Math.random() * window.innerWidth - window.innerWidth / 2 + 'px',
            y: Math.random() * window.innerHeight - window.innerHeight / 2 + 'px',
        }
    }

    function shootParticle()
    {
        const particles = [];
        const color = ranColor();
        const particle = document.createElement('span');
        particle.classList.add('particle', 'move');
        
       // const { x, y } = {'x':'-115px','y':'145px'}
        const { x, y } = randomLocation();

        particle.style.setProperty('--x', x);
        particle.style.setProperty('--y', y);
        particle.style.background = color;
        btn_fireworks.style.background = color;
        btn_fireworks.appendChild(particle);
        particles.push(particle);
	
	    setTimeout(() => 
        {
            for(let i=0; i<100; i++)
            {
                const innerP = document.createElement('span');
                innerP.classList.add('particle', 'move');
                innerP.style.transform = `translate(${x}, ${y})`;
                const xs = Math.random() * 200 - 100 + 'px';
                const ys = Math.random() * 200 - 100 + 'px';
                innerP.style.setProperty('--x', `calc(${x} + ${xs})`);
                innerP.style.setProperty('--y', `calc(${y} + ${ys})`);
                innerP.style.animationDuration = Math.random() * 300 + 200 + 'ms';
                innerP.style.background = color;
                btn_fireworks.appendChild(innerP);
                particles.push(innerP);
            }
            setTimeout(() => {
                particles.forEach(particle => {
                    particle.remove();
                })
            }, 500);

            launchFireworks();
        }, 500);
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

