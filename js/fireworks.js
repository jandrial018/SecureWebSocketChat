     
    let isRunning = false;
    let fireworks = null;
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