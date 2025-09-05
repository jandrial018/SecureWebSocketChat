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

    document.addEventListener('keydown', function(event)
    {
        if ((event.metaKey || event.ctrlKey) && event.key === 'l')
        {
            clearMessage();
            event.preventDefault();
        }
    });

    btn_fireworks.addEventListener('click', triggerFireworks);