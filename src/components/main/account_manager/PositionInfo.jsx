import React from "react";

const PositionInfo = ({ row, onEditClick }) => {
  return <button onClick={() => onEditClick(row)}>Edit</button>;
};

export default PositionInfo;
