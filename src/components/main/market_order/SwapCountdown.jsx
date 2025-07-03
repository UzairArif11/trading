import { useEffect, useState } from 'react';
import { useSymbolContext } from '../../../contexts/Symbol-Context';

function SwapCountdown() {
  const [countdown, setCountdown] = useState('');

    const {
      symbolInfo,
    } = useSymbolContext();

  useEffect(() => {
    if (!symbolInfo?.swap_time) return;
    if (symbolInfo.swap_time == "00:00") {
      symbolInfo.swap_time = "24:00"
    }
    let [swapHours, swapMinutes] = symbolInfo.swap_time.split(':').map(Number);

    const interval = setInterval(() => {
      // const now = new Date();
      // now.getTime() + 5 * 60 * 60 * 1000
      const date = new Date();
      let serverHours = String(date.getUTCHours()).padStart(2, '0');
      let serverMinutes = String(date.getUTCMinutes()).padStart(2, '0');
      let serverSeconds = String(date.getUTCSeconds()).padStart(2, '0');
      
      serverHours = parseFloat(serverHours);
      serverMinutes = parseFloat(serverMinutes);
      serverSeconds = parseFloat(serverSeconds);

      swapHours = parseFloat(swapHours);
      swapMinutes = parseFloat(swapMinutes);
      let diff = new Date()
      
      if (
        swapHours > serverHours ||
        (swapHours == serverHours && swapMinutes >= serverMinutes)
      ){

        diff.setHours(swapHours - date.getUTCHours());
        diff.setMinutes(swapMinutes - date.getUTCMinutes());
        diff.setSeconds(59 - date.getUTCSeconds());
        
      }
      else{

        while (swapHours <= serverHours) {
            swapHours += parseFloat(symbolInfo?.swap_period);
        }

      }

      setCountdown(
        String(diff.getHours()).padStart(2, '0') + ':' +
        String(diff.getMinutes()).padStart(2, '0') + ':' +
        String(diff.getSeconds()).padStart(2, '0')
      );      
  
      


    }, 1000);

    return () => clearInterval(interval);
  }, [symbolInfo]);

  return (
    <div>
      <p style={{
            fontSize: "13px",
            fontWeight: "600"
      }}>{countdown}</p>
    </div>
  );
}

export default SwapCountdown;
