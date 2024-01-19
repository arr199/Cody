// SENDING LOGS MESSAGES FROM THE IFRAME WINDOW TO OUR PARENT WINDOW
export const consoleLogScript = () => {
  return `
    <script>
      function customConsole (w) {
        function addLogs (logs , type) {
          w.parent.postMessage({
           console : {
            logs : JSON.stringify(logs) ,
            type : type
           }  
          })
        } 
    
        const console = { 
          log : function(...args) { addLogs(args, "log")  }  , 
          error : function (...args) {  addLogs(args , "error") }  }
        
        window.console = {...window.console , ...console }
        
      }
     
      if (window.parent) {
        customConsole(window)
      }
      
    </script>`
}
