import React from "react";

type Option = {
  value: string;
  label: string;
};

type Props = {
  name: string;
  options: Option[];
  NameAction: string;
  onAction: () => void;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  value?: string;
};

const Select = ({
  NameAction,
  options,
  name,
  onAction,
  onChange,
  placeholder = "Selecione",
  value,
}: Props) => {
  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const selectedValue = event.target.value;

    if (selectedValue === "__action__") {
      onAction();
      return;
    }

    onChange(event);
  }

  return (
    <select name={name} value={value ?? ""} onChange={handleChange}>
      <option value="" disabled>
        {placeholder}
      </option>

      <option value="__action__" style={{ backgroundColor: "#d5d0d0ad" }}>
        {NameAction}
      </option>

      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default Select;