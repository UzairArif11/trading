import { useSymbolContext } from "../../../contexts/Symbol-Context";

const ExitPriceCalculator = ({ row }) => {
  const { symbolData } = useSymbolContext();
  var exitPrice =
    row?.direction == "Buy"
      ? symbolData[row.symbol]?.bid
      : symbolData[row.symbol]?.ask;
  return exitPrice;
};

export default ExitPriceCalculator;
