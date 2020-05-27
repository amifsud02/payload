import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'condition-value-date';

const DateField = ({ onChange, value }) => {
  return (
    <input
      className={baseClass}
      type="text"
      onChange={e => onChange(e.target.value)}
      value={value}
    />
  );
};

DateField.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

export default DateField;
