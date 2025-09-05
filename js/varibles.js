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