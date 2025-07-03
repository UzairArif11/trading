import { useSymbolContext } from "../../../contexts/Symbol-Context";

const CurrentPriceCell = ({ row }) => {
  const { symbolData } = useSymbolContext();
  var currentPrice =
    row.direction == "Buy"
      ? symbolData[row.symbol]?.ask
      : symbolData[row.symbol]?.bid;
  const formattedPrice = parseFloat(currentPrice);

  return <span>{isNaN(formattedPrice) ? "-" : formattedPrice}</span>;
};

export default CurrentPriceCell;
