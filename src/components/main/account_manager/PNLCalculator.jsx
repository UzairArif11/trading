import { useSymbolContext } from "../../../contexts/Symbol-Context";

const CalculatePNL = ({ row }) => {
  const { symbolData } = useSymbolContext();
  var currentPrice =
    row.direction == "Buy"
      ? symbolData[row.symbol]?.ask * 1
      : symbolData[row.symbol]?.bid * 1;

  let pnl = 0;
  if (row.direction == "Buy") {
    pnl = parseFloat(
      (currentPrice - parseFloat(row.entry_price)) * row.quantity
    ).toFixed(2);
  } else {
    pnl = parseFloat(
      (parseFloat(row.entry_price) - currentPrice) * row.quantity
    ).toFixed(2);
  }
  const pnlClass = parseFloat(pnl) >= 0 ? "positive-pnl" : "negative-pnl";
  return <span className={pnlClass}>{pnl}</span>;
};

export default CalculatePNL;
