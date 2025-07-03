import React, { useState, useEffect, useRef } from "react";
import { formatPrice } from "../../../utils/format.js";
import { useSymbolContext } from "../../../contexts/Symbol-Context.js";
import { useChartContext } from "../../../contexts/Chart-Context.js";
import { BsArrowUpSquare, BsArrowDownSquare } from "react-icons/bs";
import { AiOutlineDown, AiOutlineUp } from "react-icons/ai";
import "./React-Select.scss";

const CustomOption = ({ data, onSelect, isSelected, closeDropdown }) => {
  const optionClass = isSelected ? "custom-option selected" : "custom-option";

  return (
    <div
      className={optionClass}
      onClick={() => {
        onSelect(data);
        closeDropdown();
      }}
    >
      <div className="symbol">{data.label}</div>
      {/* <div className="bid">{formatPrice(data.bid)}</div>
      <div className="ask">{formatPrice(data.ask)}</div> */}
    </div>
  );
};

const CustomSelect = ({ options, selectedOption, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const selectRef = useRef(null);
  const { selectedStyle } = useChartContext();

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const closeDropdown = () => setIsOpen(false);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setIsOpen(false); 
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="custom-select-container" ref={selectRef}>
      <div className="custom-select"  onClick={toggleDropdown}>
        <div className="selected-option">
          <input
            type="text"
            className="custom-search"
            placeholder={selectedOption ? selectedOption.label : placeholder}
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className="arrow"  style={{color: selectedStyle.buyColor}}>
          {isOpen ? <AiOutlineUp /> : <AiOutlineDown />}
        </div>
      </div>
      {isOpen && (
        <div className="custom-dropdown">
          <div className="custom-menu">
            <div className="header">
              <div className="symbol-title">Symbol</div>
              {/* <div className="bid-title">Bid</div>
              <div className="ask-title">Ask</div> */}
            </div>
            {filteredOptions.length === 0 ? (
              <div className="no-results">No results found</div>
            ) : (
              filteredOptions.map((option, index) => (
                <CustomOption
                  key={index}
                  data={option}
                  onSelect={(selected) => {
                    onChange(selected);
                  }}
                  isSelected={selectedOption && selectedOption.label === option.label}
                  closeDropdown={closeDropdown}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ReactSelect = () => {
  const {
    allSymbolOptions,
    selectedSymbolOption,
    handleSymbolOptionChange,
  } = useSymbolContext();

  return (
    <CustomSelect
      options={allSymbolOptions}
      selectedOption={selectedSymbolOption}
      onChange={handleSymbolOptionChange}
      placeholder="Select Symbol"
    />
  );
};

export default ReactSelect;
