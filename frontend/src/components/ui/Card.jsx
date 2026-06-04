import React from 'react';

const Card = ({
  children,
  className = '',
  onClick,
  id,
  title,
  role,
  tabIndex,
  onMouseEnter,
  onMouseLeave
}) => {
  const cardClasses = `rounded-[10px] bg-surface p-6 shadow-sm border border-theme transition-all duration-150 ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${className}`;

  return (
    <div
      onClick={onClick}
      className={cardClasses}
      id={id}
      title={title}
      role={role}
      tabIndex={tabIndex}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
};

export default Card;
