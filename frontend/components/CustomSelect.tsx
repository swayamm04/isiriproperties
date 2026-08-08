import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './CustomSelect.module.css';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  style,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      className={`${styles.selectContainer} ${className} ${disabled ? styles.disabled : ''}`}
      ref={containerRef}
      style={style}
    >
      <div
        className={`${styles.selectHeader} ${isOpen ? styles.open : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          }
        }}
      >
        <span className={selectedOption ? styles.selectedText : styles.placeholderText}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`} />
      </div>

      <div className={`${styles.optionsContainer} ${isOpen ? styles.optionsOpen : ''}`}>
        <ul className={styles.optionsList}>
          {options.length > 0 ? (
            options.map((option) => (
              <li
                key={option.value}
                className={`${styles.optionItem} ${option.value === value ? styles.selectedOption : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </li>
            ))
          ) : (
            <li className={styles.noOptions}>No options available</li>
          )}
        </ul>
      </div>
    </div>
  );
}
