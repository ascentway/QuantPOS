import React from 'react';
import useThemeStore from '../../store/themeStore';

import lightWordmark from '../../assets/Quantpos Light Logo WO BG.png';
import darkWordmark from '../../assets/Quantpos Dark Logo WO BG.png';
import lightLogoIcon from '../../assets/Q. Light Mode Sidebar.png';
import darkLogoIcon from '../../assets/Q. Dark Mode Sidebar.png';

/**
 * QPMark  compact square icon logo.
 * Used in the sidebar collapsed state and anywhere a small mark is needed.
 */
export const QPMark = ({ size = 32, className = '', isDark: isDarkProp }) => {
  const { theme } = useThemeStore();
  const isDarkTheme = isDarkProp !== undefined ? isDarkProp : theme === 'dark';
  const src = isDarkTheme ? darkLogoIcon : lightLogoIcon;

  return (
    <img
      src={src}
      alt="Quantpos"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', display: 'block' }}
      draggable={false}
    />
  );
};

/**
 * Wordmark  horizontal logo with text.
 * Used in the sidebar expanded state, auth pages header/footer, landing page.
 */
export const Wordmark = ({ height = 28, className = '', isDark: isDarkProp }) => {
  const { theme } = useThemeStore();
  const isDarkTheme = isDarkProp !== undefined ? isDarkProp : theme === 'dark';
  const src = isDarkTheme ? darkWordmark : lightWordmark;

  return (
    <img
      src={src}
      alt="Quantpos"
      height={height}
      className={className}
      style={{ height: `${height}px`, width: 'auto', objectFit: 'contain', display: 'block' }}
      draggable={false}
    />
  );
};

export default Wordmark;
