import React from 'react';

type Props = {
  text?: string;
  size?: string;
};

export const Spinner: React.VFC<Props> = ({ text = '', size = '5em' }) => {
  const header = text ? <h4>{text}</h4> : null;
  return (
    <div className="spinner">
      {header}
      <div className="loader" style={{ height: size, width: size }} />
    </div>
  );
};
