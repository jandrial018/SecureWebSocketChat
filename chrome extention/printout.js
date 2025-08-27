<script>
  const printOut = {

  init() {
    const outputColor = 'color:#14b53f; text-align: center; ' +
    'font-family: sans-serif; color: #14b53f; ';

    const titleStyle = 'border-style: none; font-size: 35px; font-weight: bold; ' +
                      'text-shadow: 0px 0px 40px; margin: 1em 10em; text-transform: capitalize; text-wrap-style: pretty;';

    const bodytext = 'font-size: 25px; border: 3px outset #226014; border-radius: 8px; padding: 20px 15px;'+
                      ' margin: 1em 40px; background-size: 500px 333px; text-wrap-style: pretty;'+
                      ' background: no-repeat url(https://microhubapp.com/WebHooks/Icon.jpg);';
    const signature = 'font-size: 25px; margin:0 0 0 78%; padding:0;';

    const strings = ['Hello! Welcome to my Secure WebSocket Chat Project',
      'This project began as an exercise to familiarize myself with WebSockets. ' +
      'I quickly became enthralled, and it has since grown beyond its original scope. '+
      'Adding new features, creature comforts, and even a Chrome Extension ' +
      'It\'s still a work in progress as I continue to explore and expand its capabilities.',
      `- Javier P. Andrial`];

      console.log(`%c${strings[0]}`, outputColor + titleStyle);
      console.log(`%c${strings[1]}`, outputColor + bodytext);
      console.log(`%c${strings[2]}`, outputColor + signature);
  },
}
printOut.init();
</script>