import React, { useState, useRef, useEffect } from 'react';
import styles from './AutocompleteInput.module.css';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}

export default function AutocompleteInput({ value, onChange, options, placeholder, required }: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    
    if (val.trim()) {
      const filtered = options.filter(opt => 
        opt.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredOptions(filtered);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleOptionClick = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleFocus = () => {
    if (value.trim()) {
      const filtered = options.filter(opt => 
        opt.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
      setIsOpen(true);
    } else {
      setFilteredOptions(options);
      setIsOpen(true);
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {isOpen && filteredOptions.length > 0 && (
        <ul className={styles.dropdown}>
          {filteredOptions.map((option, idx) => (
            <li
              key={idx}
              className={styles.option}
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
